const identity = require('../services/businessIdentity');
const router = require('express').Router();
const { Report } = require('../models/BusinessModels');
const Assignment = require('../models/Assignment');
const { requireRole } = require('../middleware/auth');
const { asyncHandler, HttpError } = require('../utils/http');
const v = require('./shared'),
  policy = require('./placementPolicy');
router.get('/reports/:id/practice',requireRole('mentor'),asyncHandler(async(req,res)=>res.json(await require('./reportPractice').load(req.user,req.params.id))));
router.get('/reports/:id/reading-sample',requireRole('mentor'),asyncHandler(async(req,res)=>{const report=await Report.findById(v.id(req.params.id)).lean();if(!report)throw new HttpError(404,'Không có báo cáo');await policy.load(req.user,String(report.assignmentId));res.json(require('./reportSamples').read(report));}));
router.get(
  '/reports',
  asyncHandler(async (req, res) => {
    res.json(await require('./reportContext').list(req.user,req.query,v,policy,Report));
  })
);
router.post(
  '/reports',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['assignmentId', 'kind', 'title', 'content','weekNumber','taskIds','selfAssessment','selfGrading']);
    const a = await policy.load(req.user, req.body.assignmentId, { active: true }),
      kind = v.choice(req.body.kind, ['weekly', 'final'], 'Loại báo cáo');
    const title = v.text(req.body.title, 'Tiêu đề', { required: true, max: 200 }),
      content = v.text(req.body.content, 'Nội dung', { required: true, max: 50000 });
    const creation=await require('./creationIdentity')(Report,req,String(a._id));if(creation.existing)return res.json(creation.existing);
    const linked={};
    if(req.body.selfGrading!==undefined)linked.selfGrading=await require('./reportSelfGrading').validate(req.body.selfGrading,a);
    if(req.body.taskIds!==undefined){if(!Array.isArray(req.body.taskIds)||!req.body.taskIds.length||req.body.taskIds.length>20||new Set(req.body.taskIds).size!==req.body.taskIds.length)throw new HttpError(400,'Chọn từ 1 đến 20 công việc không trùng');const ids=req.body.taskIds.map(v.id),count=await require('../models/Task').countDocuments({_id:{$in:ids},assignmentId:a._id});if(count!==ids.length)throw new HttpError(404,'Công việc không thuộc phân công');linked.taskIds=ids;}
    if(kind==='weekly'&&req.body.weekNumber!==undefined){linked.weekNumber=v.integer(req.body.weekNumber,1,104,'Tuần báo cáo');if(linked.weekNumber>Math.ceil((a.endDate-a.startDate)/604800000)+1)throw new HttpError(400,'Tuần báo cáo ngoài kỳ thực tập');if(!linked.taskIds?.length)throw new HttpError(400,'Cần chọn công việc cho báo cáo tuần');}
    if(req.body.selfAssessment!==undefined)linked.selfAssessment=v.text(req.body.selfAssessment,'Tự đánh giá',{max:5000});
    const save=async session=>{
    const previousWeek=linked.weekNumber?await Report.findOne({assignmentId:a._id,kind,weekNumber:linked.weekNumber}).sort({version:-1}).session(session):null;
    if(previousWeek&&previousWeek.state!=='need_revision')throw new HttpError(409,'Tuần này đã có báo cáo; chỉ nộp bổ sung khi được yêu cầu');

    const last = await Report.findOne({ assignmentId: a._id, kind }).sort({ version: -1 }).session(session);
    if(require('../config/env').schoolWorkflowEnabled&&kind==='final'&&last&&last.state!=='need_revision')throw new HttpError(409,'Báo cáo cuối kỳ đã nộp. Chỉ nộp lại khi có yêu cầu bổ sung; bài đã chốt được giữ nguyên.','FINAL_RESUBMISSION_NOT_REQUESTED');
    if (kind === 'final' && (await Report.exists({ assignmentId: a._id, kind, state: 'approved' }).session(session)))
      throw new HttpError(409, 'Báo cáo cuối kỳ đã chốt');
    if (last?.current) {
      const superseded = await Report.findOneAndUpdate(
        {
          _id: last._id,
          __v: last.__v,
          current: true,
          ...(kind === 'final' ? { state: { $ne: 'approved' } } : {}),
        },
        {
          $set: { current: false },
          $inc: { __v: 1 },
          $push: { history: v.event(req.user, 'report.superseded') },
        },{session}
      );
      if (!superseded)
        throw new HttpError(409, 'Báo cáo vừa thay đổi; tải lại trước khi nộp', 'STALE_VERSION');
    }
    const [doc] = await Report.create([{
      ...(creation._id?{_id:creation._id,creationRequestHash:creation.creationRequestHash}:{}),
      ...linked,...(linked.weekNumber?{weeklyRevision:(previousWeek?.weeklyRevision||0)+1}:{}),
      assignmentId: a._id,
      ...identity.participants(a),
      kind,evaluationRequired:kind==='final',
      current: true,
      version: (last?.version || 0) + 1,
      title,
      content,
      history: [v.event(req.user, 'report.submitted')],
    }],{session});
    return doc;
    };
    const doc=await (require('../config/env').schoolWorkflowEnabled?require('../workflow/service').transaction(save):save(null));
    res.status(201).json(doc);
  })
);
router.post(
  '/reports/:id/reviews',
  requireRole('company', 'mentor'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['score', 'comment', 'decision', 'version','grading']);
    const doc = await Report.findById(v.id(req.params.id));
    if (!doc) throw new HttpError(404, 'Không có báo cáo');
    const assignment=await policy.load(req.user, String(doc.assignmentId));
    if (doc.state === 'approved' || doc.state === 'need_revision')
      throw new HttpError(409, 'Báo cáo đã chốt hoặc cần sinh viên nộp bản mới');
    if (doc.reviews.some((r) => r.role === req.user.role))
      throw new HttpError(409, 'Vai trò này đã đánh giá phiên bản báo cáo');
    await require('./reportVersions').assertCurrent(Report,doc);
    const score = req.body.score;
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 100)
      throw new HttpError(400, 'Điểm phải từ0 đến100');
    if(req.user.role==='mentor'&&doc.evaluationRequired&&!req.body.grading)throw new HttpError(409,'Cần phân tích báo cáo và xác nhận rubric trước khi lưu điểm');
    const grading=await require('./reportEvaluation').gradingInput(doc,assignment,req.body,req.user);
    const review = {
      ...(grading?{grading}:{}),
      role: req.user.role,
      actorUserId: req.user._id,
      actorWallet: req.user.walletAddress,
      score,
      comment: v.text(req.body.comment, 'Nhận xét', { required: true, max: 5000 }),
      decision: v.choice(req.body.decision, ['approved', 'need_revision', 'incorrect'], 'Kết quả'),
      at: new Date(),
    };
    const state =
      review.decision !== 'approved'
        ? 'need_revision'
        : doc.reviews.length === 1
        ? 'reviewed'
        : 'submitted';
    v.integer(req.body.version, 0, Number.MAX_SAFE_INTEGER, 'Phiên bản');
    const saved = await Report.findOneAndUpdate(
      {
        _id: doc._id,
        __v: req.body.version,
        ...require('./reportVersions').currentFilter(doc),
        'reviews.role': { $ne: req.user.role },
      },
      {
        $set: { state },
        $push: {
          reviews: review,
          history: v.event(req.user, 'report.reviewed', {
            score,
            decision: review.decision,
            comment: review.comment,
          }),
        },
        $inc: { __v: 1 },
      },
      { new: true, runValidators: true }
    );
    if (!saved) throw new HttpError(409, 'Báo cáo đã thay đổi', 'STALE_VERSION');
    res.json(saved);
  })
);
router.post(
  '/reports/:id/approve',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['version', 'reason']);
    const doc = await Report.findById(v.id(req.params.id));
    if (!doc) throw new HttpError(404, 'Không có báo cáo');
    await policy.load(req.user, String(doc.assignmentId));
    if (
      doc.state !== 'reviewed' ||
      doc.reviews.length !== 2 ||
      doc.reviews.some((r) => r.decision !== 'approved') ||
      new Set(doc.reviews.map((r) => r.role)).size !== 2
    )
      throw new HttpError(409, 'Cần hai đánh giá đồng ý từ doanh nghiệp và giảng viên');
    await require('./reportVersions').assertCurrent(Report,doc);
    if (doc.kind === 'final') {
      const assignment = await policy.load(req.user, String(doc.assignmentId));
      if (!assignment.kpis?.length || assignment.kpis.some((k) => k.status !== 'approved'))
        throw new HttpError(409, 'Cần duyệt đủ KPI trước khi chốt báo cáo cuối kỳ');
    }
    const reason = v.text(req.body.reason, 'Lý do', { required: true, max: 2000 });
    let score,publicationPolicy;
    if(doc.evaluationRequired){
      const assignment=await policy.load(req.user,String(doc.assignmentId)),batch=await require('../models/BusinessModels').InternshipBatch.findById(assignment.batchId),rule=batch?.reportRubric?.gradingPolicy;
      if(!rule)throw new HttpError(409,'Nhà trường cần công bố quy định chốt điểm của kỳ trước khi chốt kết quả');
      const mentor=doc.reviews.find(r=>r.role==='mentor'),company=doc.reviews.find(r=>r.role==='company');
      score=rule.method==='mentor'?mentor.score:Math.round((mentor.score*rule.mentorWeight+company.score*rule.companyWeight))/100;
      publicationPolicy={...rule,rubricVersion:batch.reportRubric.version};
    }else score=Math.round(doc.reviews.reduce((n,r)=>n+r.score,0)/2);
    res.json(
      await v.updateVersion(
        Report,
        doc,
        req.body.version,
        {
          state: 'approved',
          finalScore: score,
          ...(publicationPolicy?{publicationPolicy}:{}),
          approvedBy: req.user.walletAddress || '',
          ...(identity.enabled() ? { approvedByUserId: req.user._id } : {}),
          approvedAt: new Date(),
        },
        v.event(req.user, 'report.approved', { score, reason }),
        require('./reportVersions').currentFilter(doc)
      )
    );
  })
);
module.exports = router;
