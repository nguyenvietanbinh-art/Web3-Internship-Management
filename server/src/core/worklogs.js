const router = require('express').Router();
const identity = require('../services/businessIdentity');
const WorkLog = require('../models/WorkLog');
const { requireRole } = require('../middleware/auth');
const { asyncHandler, HttpError } = require('../utils/http');
const v = require('./shared');
const policy = require('./placementPolicy');
const { scope, resource } = require('./workPolicy');
router.get(
  '/worklogs',
  asyncHandler(async (req, res) => {
    const filter = await scope(req.user,{batchId:req.query.batchId});
    if (req.query.assignmentId) {
      const assignment=await policy.load(req.user, req.query.assignmentId);
      if(req.query.batchId&&String(assignment.batchId)!==req.query.batchId)throw new HttpError(400,'Phân công không thuộc kỳ đã chọn');
      filter.assignmentId = req.query.assignmentId;
    }
    const q = v.search(req.query.q);
    if (q) filter.title = q;
    res.json(await v.paged(WorkLog, filter, req.query));
  })
);
function logInput(body) {
  const resultLink = v.text(body.resultLink, 'Liên kết kết quả', { max: 2000 });
  if (resultLink) {
    let url;
    try {
      url = new URL(resultLink);
    } catch {
      throw new HttpError(400, 'Liên kết kết quả không hợp lệ');
    }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
      throw new HttpError(
        400,
        'Liên kết kết quả phải là URL HTTP/HTTPS không chứa thông tin đăng nhập'
      );
  }
  return {
    title: v.text(body.title, 'Tiêu đề', { required: true, max: 200 }),
    tasksDone: v.text(body.tasksDone, 'Công việc đã làm', { required: true }),
    challenges: v.text(body.challenges, 'Khó khăn'),
    nextPlan: v.text(body.nextPlan, 'Kế hoạch'),
    resultLink,
  };
}
function requestInput(body, assignment) {
  const dueDate = v.date(body.dueDate, 'Hạn nộp nhật ký');
  if (dueDate <= new Date() || dueDate < assignment.startDate || dueDate > assignment.endDate)
    throw new HttpError(
      400,
      'Hạn nộp phải ở tương lai và nằm trong thời gian thực tập của phân công'
    );
  return {
    title: v.text(body.title, 'Tiêu đề yêu cầu', { required: true, max: 200 }),
    requirement: v.text(body.requirement, 'Yêu cầu công việc theo tuần', { required: true }),
    priority: v.choice(body.priority, ['low', 'medium', 'high', 'urgent'], 'Ưu tiên'),
    dueDate,
  };
}
router.post(
  '/worklogs/assign',
  requireRole('company', 'mentor'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['assignmentId', 'weekNumber', 'title', 'requirement', 'priority', 'dueDate']);
    const a = await policy.load(req.user, req.body.assignmentId, { active: true });
    const weekNumber = v.integer(req.body.weekNumber, 1, 104, 'Tuần');
    if (await WorkLog.exists({ assignmentId: a._id, weekNumber }))
      throw new HttpError(409, 'Tuần này đã có yêu cầu hoặc nhật ký; mở mục hiện có để xử lý');
    const student = a.studentUserId
      ? await require('../models/User').findById(a.studentUserId).select('name')
      : null;
    res.status(201).json(
      await WorkLog.create({
        ...requestInput(req.body, a),
        weekNumber,
        assignmentId: a._id,
        topicId: a.topicId,
        ...identity.participants(a),
        studentName: student?.name || 'Sinh viên',
        tasksDone: '',
        status: 'pending_submission',
        history: [v.event(req.user, 'worklog.assigned')],
      })
    );
  })
);
router.patch(
  '/worklogs/:id/assignment',
  requireRole('company', 'mentor'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['title', 'requirement', 'priority', 'dueDate', 'version']);
    const { doc, assignment } = await resource(WorkLog, req.user, req.params.id, true);
    if (!['pending_submission', 'need_revision'].includes(doc.status) || !doc.requirement)
      throw new HttpError(409, 'Chỉ sửa yêu cầu chưa nộp hoặc đang cần chỉnh sửa');
    res.json(
      await v.updateVersion(
        WorkLog,
        doc,
        req.body.version,
        requestInput(req.body, assignment),
        v.event(req.user, 'worklog.assignment_updated')
      )
    );
  })
);
router.post(
  '/worklogs',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, [
      'assignmentId',
      'weekNumber',
      'title',
      'tasksDone',
      'challenges',
      'nextPlan',
      'resultLink',
    ]);
    const a = await policy.load(req.user, req.body.assignmentId, { active: true });
    res.status(201).json(
      await WorkLog.create({
        ...logInput(req.body),
        weekNumber: v.integer(req.body.weekNumber, 1, 104, 'Tuần'),
        assignmentId: a._id,
        topicId: a.topicId,
        ...identity.participants(a),
        studentName: req.user.name,
        status: 'submitted',
        submittedAt: new Date(),
        history: [v.event(req.user, 'worklog.submitted')],
      })
    );
  })
);
router.patch(
  '/worklogs/:id',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['title', 'tasksDone', 'challenges', 'nextPlan', 'resultLink', 'version']);
    const { doc } = await resource(WorkLog, req.user, req.params.id, true);
    if (doc.status === 'approved') throw new HttpError(409, 'Nhật ký đã duyệt không được sửa');
    res.json(
      await v.updateVersion(
        WorkLog,
        doc,
        req.body.version,
        {
          ...logInput(req.body),
          ...(doc.requirement ? { title: doc.title } : {}),
          status: 'submitted',
          submittedAt: new Date(),
          submittedLate: Boolean(doc.dueDate && new Date() > doc.dueDate),
          mentorFeedback: '',
          reviewedAt: null,
        },
        v.event(req.user, 'worklog.revised', {
          previous: {
            title: doc.title,
            tasksDone: doc.tasksDone,
            challenges: doc.challenges,
            nextPlan: doc.nextPlan,
            status: doc.status,
          },
        })
      )
    );
  })
);
router.patch(
  '/worklogs/:id/review',
  requireRole('company', 'mentor'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['status', 'mentorFeedback', 'version']);
    const { doc } = await resource(WorkLog, req.user, req.params.id, true);
    if (doc.status !== 'submitted') throw new HttpError(409, 'Chỉ duyệt nhật ký vừa nộp');
    const set = {
      status: v.choice(req.body.status, ['approved', 'need_revision'], 'Trạng thái'),
      mentorFeedback: v.text(req.body.mentorFeedback, 'Nhận xét', { required: true, max: 5000 }),
      reviewedAt: new Date(),
    };
    res.json(
      await v.updateVersion(
        WorkLog,
        doc,
        req.body.version,
        set,
        v.event(req.user, 'worklog.reviewed', { status: set.status, comment: set.mentorFeedback })
      )
    );
  })
);
module.exports = router;
