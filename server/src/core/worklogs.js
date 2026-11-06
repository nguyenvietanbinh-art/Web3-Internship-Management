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
    const filter = await scope(req.user);
    if (req.query.assignmentId) {
      await policy.load(req.user, req.query.assignmentId);
      filter.assignmentId = req.query.assignmentId;
    }
    const q = v.search(req.query.q);
    if (q) filter.title = q;
    res.json(await v.paged(WorkLog, filter, req.query));
  })
);
function logInput(body) {
  return {
    title: v.text(body.title, 'Tiêu đề', { required: true, max: 200 }),
    tasksDone: v.text(body.tasksDone, 'Công việc đã làm', { required: true }),
    challenges: v.text(body.challenges, 'Khó khăn'),
    nextPlan: v.text(body.nextPlan, 'Kế hoạch'),
  };
}
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
    ]);
    const a = await policy.load(req.user, req.body.assignmentId, { active: true });
    res
      .status(201)
      .json(
        await WorkLog.create({
          ...logInput(req.body),
          weekNumber: v.integer(req.body.weekNumber, 1, 104, 'Tuần'),
          assignmentId: a._id,
          topicId: a.topicId,
          ...identity.participants(a),
          studentName: req.user.name,
          status: 'submitted',
          history: [v.event(req.user, 'worklog.submitted')],
        })
      );
  })
);
router.patch(
  '/worklogs/:id',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['title', 'tasksDone', 'challenges', 'nextPlan', 'version']);
    const { doc } = await resource(WorkLog, req.user, req.params.id, true);
    if (doc.status === 'approved') throw new HttpError(409, 'Nhật ký đã duyệt không được sửa');
    res.json(
      await v.updateVersion(
        WorkLog,
        doc,
        req.body.version,
        { ...logInput(req.body), status: 'submitted', mentorFeedback: '', reviewedAt: null },
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
