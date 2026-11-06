const router = require('express').Router();
const { requireRole } = require('../middleware/auth');
const { asyncHandler, HttpError } = require('../utils/http');
const identity = require('../services/businessIdentity');
const v = require('./shared');
const Registration = require('../models/BatchRegistration');
const Topic = require('../models/Topic');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const { InternshipBatch } = require('../models/BusinessModels');
const { createPlacement, existingPlacement } = require('../services/placementService');
router.use((_req, _res, next) => (identity.enabled() ? next() : next('router')));

async function openBatch(id) {
  const batch = await InternshipBatch.findById(v.id(id));
  if (!batch) throw new HttpError(404, 'Không tìm thấy kỳ thực tập');
  if (batch.status !== 'open' || batch.endDate <= new Date())
    throw new HttpError(409, 'Kỳ đã đóng hoặc hết thời gian đăng ký');
  return batch;
}
async function opportunities(batch) {
  const companies = await User.find({ role: 'company', disabled: { $ne: true } })
    .select('_id walletAddress')
    .lean();
  const topics = await Topic.find({
    status: 'open',
    $or: [
      { companyUserId: { $in: companies.map((c) => c._id) } },
      { companyWallet: { $in: companies.map((c) => c.walletAddress).filter(Boolean) } },
    ],
  })
    .select('title description companyName kpis')
    .lean();
  return topics.filter(
    (t) =>
      t.kpis.length &&
      t.kpis.reduce((n, k) => n + k.weightPercent, 0) === 100 &&
      t.kpis.every((k) => k.deadline >= batch.startDate && k.deadline <= batch.endDate)
  );
}
router.get(
  '/batches/:id/opportunities',
  requireRole('student', 'admin'),
  asyncHandler(async (req, res) => {
    const batch = await openBatch(req.params.id);
    res.json({ items: await opportunities(batch) });
  })
);
router.get(
  '/batch-registrations',
  requireRole('student', 'admin'),
  asyncHandler(async (req, res) => {
    const page = await v.paged(
      Registration,
      req.user.role === 'admin' ? {} : { studentUserId: req.user._id },
      req.query
    );
    const ids = page.items;
    const [students, batches, topics] = await Promise.all([
      User.find({ _id: { $in: ids.map((r) => r.studentUserId) } })
        .select('name email')
        .lean(),
      InternshipBatch.find({ _id: { $in: ids.map((r) => r.batchId) } })
        .select('name startDate endDate status')
        .lean(),
      Topic.find({ _id: { $in: ids.map((r) => r.topicId).filter(Boolean) } })
        .select('title')
        .lean(),
    ]);
    const find = (rows, id) => rows.find((x) => String(x._id) === String(id));
    res.json({
      ...page,
      items: ids.map((r) => ({
        ...r,
        student: find(students, r.studentUserId),
        batch: find(batches, r.batchId),
        topic: find(topics, r.topicId),
      })),
    });
  })
);
router.post(
  '/batch-registrations',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['batchId', 'topicId', 'requestType', 'message']);
    const batch = await openBatch(req.body.batchId);
    const requestType = v.choice(
      req.body.requestType,
      ['application', 'assistance'],
      'Hình thức đăng ký'
    );
    const message = v.text(req.body.message, 'Nguyện vọng', { max: 2000 });
    let topicId = null;
    if (requestType === 'application') {
      topicId = v.id(req.body.topicId);
      if (!(await opportunities(batch)).some((t) => String(t._id) === topicId))
        throw new HttpError(400, 'Đề tài không phù hợp với kỳ thực tập');
    } else if (req.body.topicId) throw new HttpError(400, 'Yêu cầu hỗ trợ không chọn đề tài');
    if (await existingPlacement(req.user, batch._id))
      throw new HttpError(409, 'Bạn đã có phân công trong kỳ này');
    const filter = { batchId: batch._id, studentUserId: req.user._id };
    const previous = await Registration.findOne(filter);
    const data = {
      requestType,
      message,
      topicId,
      status: 'submitted',
      reason: '',
      assignmentId: null,
    };
    if (previous) {
      const cancelled =
        previous.status === 'placed' &&
        (await Assignment.exists({ _id: previous.assignmentId, lifecycle: 'cancelled' }));
      if (!['withdrawn', 'rejected'].includes(previous.status) && !cancelled)
        throw new HttpError(409, 'Bạn đã đăng ký kỳ này; vui lòng chờ nhà trường xử lý');
      return res
        .status(201)
        .json(
          await v.updateVersion(
            Registration,
            previous,
            previous.__v,
            data,
            v.event(req.user, 'registration.submitted'),
            { status: previous.status }
          )
        );
    }
    res.status(201).json(
      await Registration.create({
        ...filter,
        ...data,
        history: [v.event(req.user, 'registration.submitted')],
      })
    );
  })
);
router.patch(
  '/batch-registrations/:id',
  requireRole('student', 'admin'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['status', 'reason', 'version']);
    const row = await Registration.findOne({
      _id: v.id(req.params.id),
      ...(req.user.role === 'student' ? { studentUserId: req.user._id } : {}),
    });
    if (!row) throw new HttpError(404, 'Không tìm thấy đăng ký');
    const status = req.user.role === 'admin' ? 'rejected' : 'withdrawn';
    v.choice(req.body.status, [status], 'Trạng thái');
    const reason = v.text(req.body.reason, 'Lý do', { required: true, max: 2000 });
    if (row.status !== 'submitted') throw new HttpError(409, 'Chỉ xử lý đăng ký đang chờ');
    res.json(
      await v.updateVersion(
        Registration,
        row,
        req.body.version,
        { status, reason },
        v.event(req.user, 'registration.' + status, { reason }),
        { status: 'submitted' }
      )
    );
  })
);
router.post(
  '/batch-registrations/:id/assign',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['topicId', 'mentorUserId', 'startDate', 'endDate', 'reason', 'version']);
    const row = await Registration.findById(v.id(req.params.id));
    if (!row) throw new HttpError(404, 'Không tìm thấy đăng ký');
    v.integer(req.body.version, 0, Number.MAX_SAFE_INTEGER, 'Phiên bản');
    if (row.status !== 'submitted' || row.__v !== req.body.version)
      throw new HttpError(409, 'Đăng ký đã thay đổi; vui lòng tải lại');
    const { version, ...input } = req.body;
    res.status(201).json(
      await createPlacement(
        req.user,
        {
          ...input,
          batchId: String(row.batchId),
          studentUserId: String(row.studentUserId),
          approveImmediately: true,
        },
        row
      )
    );
  })
);
module.exports = router;
