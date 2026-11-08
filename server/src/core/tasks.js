const router = require('express').Router();
const multer = require('multer');
const Task = require('../models/Task');
const { requireRole } = require('../middleware/auth');
const { asyncHandler, HttpError } = require('../utils/http');
const { decodeMultipartName, safeFileName } = require('../services/taskFiles');
const v = require('./shared');
const policy = require('./placementPolicy');
const { scope, resource } = require('./workPolicy');
router.get(
  '/tasks',
  asyncHandler(async (req, res) => {
    const filter = await scope(req.user,{batchId:req.query.batchId,studentUserId:req.query.studentUserId});
    if (req.query.assignmentId) {
      const assignment=await policy.load(req.user, req.query.assignmentId);
      if(req.query.batchId&&String(assignment.batchId)!==req.query.batchId)throw new HttpError(400,'Phân công không thuộc kỳ đã chọn');
      filter.assignmentId = req.query.assignmentId;
    }
    if (req.query.status)
      filter.status = v.choice(
        req.query.status,
        ['todo', 'in_progress', 'review', 'done'],
        'Trạng thái'
      );
    const q = v.search(req.query.q);
    if (q) filter.title = q;
    const page=await v.paged(Task, filter, req.query);if(req.user.role!=='student')page.items=page.items.map(({draft,...row})=>row);res.json(page);
  })
);
router.post(
  '/tasks',
  requireRole('company', 'mentor'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['assignmentId', 'title', 'description', 'priority', 'dueDate','objective','workItems','requiredProducts','criteria','progressWeight','startDate']);
    const a = await policy.load(req.user, req.body.assignmentId, { active: true });
    const creation=await require('./creationIdentity')(Task,req,String(a._id));if(creation.existing)return res.json(creation.existing);
    const dueDate = v.date(req.body.dueDate, 'Hạn task');
    if (dueDate < a.startDate || dueDate > a.endDate)
      throw new HttpError(400, 'Hạn task ngoài thời gian phân công');
    res
      .status(201)
      .json(
        await Task.create({
          ...(creation._id?{_id:creation._id,creationRequestHash:creation.creationRequestHash}:{}),
          ...require('./taskEvaluationService').taskDefinition(req.body,a,req.user),
          assignmentId: a._id,
          topicId: a.topicId,
          title: v.text(req.body.title, 'Tên task', { required: true, max: 200 }),
          description: v.text(req.body.description, 'Mô tả'),
          priority: v.choice(
            req.body.priority || 'medium',
            ['low', 'medium', 'high', 'urgent'],
            'Độ ưu tiên'
          ),
          dueDate,
          companyUserId: a.companyUserId,
          studentUserId: a.studentUserId,
          companyWallet: a.companyWallet,
          assignedStudentWallet: a.studentWallet,
          status: 'todo',
          progress: 0,
          history: [v.event(req.user, 'task.created')],
        })
      );
  })
);
router.patch(
  '/tasks/:id',
  requireRole('student', 'company', 'mentor'),
  asyncHandler(async (req, res) => {
    const { doc, assignment } = await resource(Task, req.user, req.params.id, true);
    const allowed =
      req.user.role === 'student'
        ? ['version']
        : ['title', 'description', 'priority', 'dueDate', 'version'];
    v.keys(req.body, allowed);
    const set = {};
    if (req.body.title !== undefined)
      set.title = v.text(req.body.title, 'Tên task', { required: true, max: 200 });
    if (req.body.description !== undefined) set.description = v.text(req.body.description, 'Mô tả');
    if (req.body.priority !== undefined)
      set.priority = v.choice(req.body.priority, ['low', 'medium', 'high', 'urgent'], 'Ưu tiên');
    if (req.body.dueDate !== undefined) {
      set.dueDate = v.date(req.body.dueDate, 'Hạn');
      if (set.dueDate < assignment.startDate || set.dueDate > assignment.endDate)
        throw new HttpError(400, 'Hạn ngoài phân công');
    }
    if(req.user.role==='student')throw new HttpError(403,'Sinh viên chỉ nộp kết quả, không tự cập nhật phần trăm hoặc xác nhận hoàn thành');
    if(doc.submissionVersion||doc.submission?.submittedAt||doc.status==='done')throw new HttpError(409,'Công việc đã có bài nộp; không thay yêu cầu trong phiên bản đang đánh giá');
    res.json(
      await v.updateVersion(
        Task,
        doc,
        req.body.version,
        set,
        v.event(req.user, 'task.updated', {
          before: {
            status: doc.status,
            progress: doc.progress,
            title: doc.title,
            priority: doc.priority,
            dueDate: doc.dueDate,
          },
          after: set,
        })
      )
    );
  })
);
const taskUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 8, fieldSize: 160000 },
}).single('file');
router.post(
  '/tasks/:id/submit',
  requireRole('student'),
  asyncHandler(async (req, _res, next) => {
    const context = await resource(Task, req.user, req.params.id, true);
    if (['review', 'done'].includes(context.doc.status))
      throw new HttpError(
        409,
        'Bài đang chờ duyệt hoặc đã hoàn thành; chỉ nộp lại khi được yêu cầu'
      );
    require('./taskEvaluationService').requireCriteria(context.doc);
    req.taskContext = context;
    next();
  }),
  (req, res, next) =>
    taskUpload(req, res, (error) => {
      if (error)
        return next(
          new HttpError(
            error.code === 'LIMIT_FILE_SIZE' ? 413 : 400,
            error.code === 'LIMIT_FILE_SIZE'
              ? 'Tệp nộp bài không được vượt quá 5 MiB'
              : 'Tệp hoặc thông tin nộp bài không hợp lệ'
          )
        );
      next();
    }),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['content', 'link', 'version', 'fileName','result','challenges','solution']);
    const { doc } = req.taskContext,
      content = v.text(req.body.content, 'Nội dung bài nộp', { max: 40000 }),
      link = v.text(req.body.link, 'Liên kết kết quả', { max: 2000 });
    if (link) {
      let url;
      try {
        url = new URL(link);
      } catch {
        throw new HttpError(400, 'Liên kết kết quả không hợp lệ');
      }
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
        throw new HttpError(400, 'Chỉ nhận liên kết HTTP/HTTPS không chứa thông tin đăng nhập');
    }
    if (!content && !link && !req.file)
      throw new HttpError(400, 'Cần nội dung, liên kết hoặc tệp kết quả');
    let fileName = '',
      mime = '',
      size = 0;
    if (req.file) {
      fileName = safeFileName(
        req.body.fileName === undefined
          ? decodeMultipartName(req.file.originalname)
          : v.text(req.body.fileName, 'Tên tệp', { required: true, max: 240 })
      );
      if (!/\.(pdf|docx|zip|txt|png|jpg|jpeg)$/i.test(fileName) || !req.file.size)
        throw new HttpError(415, 'Chỉ nhận PDF, DOCX, ZIP, TXT, PNG hoặc JPG có nội dung');
      mime = await require('../services/taskEvidenceFile').validate(req.file,fileName);
      size = req.file.size;
    }
    const resultText=v.text(req.body.result,'Kết quả đạt được',{required:true,max:15000}),challenges=v.text(req.body.challenges,'Khó khăn',{required:true,max:10000}),solution=v.text(req.body.solution,'Giải pháp',{required:true,max:10000});
    if(!content.trim())throw new HttpError(400,'Cần nội dung công việc đã thực hiện');
    const submittedAt = new Date(),
      submission = {
        content,result:resultText,challenges,solution,
        link,
        submittedAt,
        late: submittedAt > doc.dueDate,
        fileName,
        mime,
        size,
      };
    if(require('./taskEvaluationService').submissionText(submission).length>50000)throw new HttpError(400,'Tổng nội dung bài nộp vượt 50.000 ký tự');
    const version = req.is('multipart/form-data') ? Number(req.body.version) : req.body.version;
    const prior=await Task.findById(doc._id).select('+submissionVersions.fileData +submissionFileData');
    const versions=(prior.submissionVersions||[]).map(row=>row.toObject());
    if(!versions.length&&prior.submission?.submittedAt)versions.push({version:prior.submissionVersion||1,submission:prior.submission.toObject?.()||prior.submission,fileData:prior.submissionFileData,criteriaVersion:prior.criteriaVersion,reviews:prior.criterionReviews||[],analysis:prior.evidenceAnalysis});
    if(versions.length>=15||versions.reduce((n,row)=>n+(row.fileData?.length||0),0)+(req.file?.buffer.length||0)>8*1024*1024)throw new HttpError(413,'Lịch sử bài nộp đã đạt giới hạn; liên hệ người phụ trách, không xóa bản cũ');
    const previous=versions.find(row=>row.version===prior.submissionVersion);if(previous){previous.reviews=(prior.criterionReviews||[]).map(r=>r.toObject?.()||r);previous.analysis=prior.evidenceAnalysis;}
    const nextVersion=(prior.submissionVersion||versions.length||0)+1;
    versions.push({version:nextVersion,submission,fileData:req.file?.buffer,sha256:require('./taskEvaluationService').hash(req.file?.buffer||Buffer.from(content)),criteriaVersion:doc.criteriaVersion});
    if(require('mongoose').mongo.BSON.calculateObjectSize({...prior.toObject(),submissionVersions:versions,submissionFileData:req.file?.buffer,history:[...(prior.history||[]).map(e=>e.toObject?.()||e),{data:{submission,previous:doc.submission}}]})>15*1024*1024)throw new HttpError(413,'Lịch sử bài nộp vượt giới hạn lưu trữ; không xóa bản cũ');
    const saved = await v.updateVersion(
      Task,
      doc,
      version,
      {
        submission,submissionVersion:nextVersion,submissionVersions:versions,draft:null,evidenceAnalysis:null,criterionReviews:[],confirmedProgress:0,
        submissionFileData: req.file?.buffer || null,
        review: null,
        status: 'review',
        progress: 0,
        completedAt: null,
      },
      v.event(req.user, 'task.submitted', {
        submission,
        previous: doc.submission?.toObject?.() || doc.submission || null,
      })
    );
    const result = saved.toObject();
    delete result.submissionFileData;
    result.submissionVersions=result.submissionVersions?.map(({fileData,...row})=>row);
    res.json(result);
  })
);
router.get(
  '/tasks/:id/submission/file',
  asyncHandler(async (req, res) => {
    const { doc } = await resource(Task, req.user, req.params.id);
    const file = await require('./taskEvaluationService').fileVersion(doc,req.query);
    if (!file?.submissionFileData || !file.submission?.fileName)
      throw new HttpError(404, 'Bài nộp chưa có tệp đính kèm');
    res
      .set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="submission.${file.submission.fileName
          .split('.')
          .pop()}"; filename*=UTF-8''${encodeURIComponent(file.submission.fileName)}`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      })
      .send(file.submissionFileData);
  })
);
router.get(
  '/tasks/:id/submission/preview',
  asyncHandler(async (req, res) => {
    const { doc } = await resource(Task, req.user, req.params.id);
    const file = await require('./taskEvaluationService').fileVersion(doc,req.query),
      bytes = file?.submissionFileData,
      name = file?.submission?.fileName;
    if (!bytes || !name) throw new HttpError(404, 'Bài nộp chưa có tệp đính kèm');
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    const extension = name.split('.').pop().toLowerCase();
    if (extension === 'txt') {
      const encoding =
        bytes[0] === 0xff && bytes[1] === 0xfe
          ? 'utf-16le'
          : bytes[0] === 0xfe && bytes[1] === 0xff
          ? 'utf-16be'
          : 'utf-8';
      const text = new TextDecoder(encoding).decode(bytes);
      if (text.length > 200000)
        throw new HttpError(413, 'Tệp văn bản quá dài để xem trực tiếp; vui lòng tải về');
      return res.json({ kind: 'text', fileName: name, text });
    }
    if (extension === 'docx') {
      if (bytes.length > 2 * 1024 * 1024)
        throw new HttpError(413, 'DOCX trên 2 MiB cần tải về để xem');
      const parsed = await require('../services/cvParser').parseCv(bytes, 'docx');
      return res.json({
        kind: 'text',
        fileName: name,
        text: parsed.text,
        note: 'Xem nội dung văn bản; tải về để xem bố cục gốc.',
      });
    }
    let mime;
    if (extension === 'pdf' && bytes.subarray(0, 5).toString() === '%PDF-')
      mime = 'application/pdf';
    if (
      extension === 'png' &&
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      mime = 'image/png';
    if (
      ['jpg', 'jpeg'].includes(extension) &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    )
      mime = 'image/jpeg';
    if (!mime)
      throw new HttpError(
        415,
        'Định dạng này không hỗ trợ xem trực tiếp hoặc tệp không hợp lệ; vui lòng tải về'
      );
    res
      .set({
        'Content-Type': mime,
        'Content-Disposition': `inline; filename="preview.${extension}"`,
      })
      .send(bytes);
  })
);
router.post('/tasks/:id/review',requireRole('company','mentor'),asyncHandler(async(req,res)=>{await resource(Task,req.user,req.params.id,true);throw new HttpError(409,'Duyệt từng tiêu chí để tính tiến độ chính thức','CRITERION_REVIEW_REQUIRED');}));
module.exports = router;
