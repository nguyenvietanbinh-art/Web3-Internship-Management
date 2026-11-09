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
const {
  applicantKey,
  assistanceAllowed,
  withStudentLock,
  reserveTopic,
  releaseTopic,
  publicTopic,
  checkApplication,
  chooseAccepted,
} = require('../services/topicRecruitment');
router.use((_req, _res, next) => (identity.enabled() ? next() : next('router')));
async function openBatch(id) {
  const batch = await InternshipBatch.findById(v.id(id));
  if (!batch) throw new HttpError(404, 'Không tìm thấy kỳ thực tập');
  if (batch.status !== 'open' || batch.endDate <= new Date())
    throw new HttpError(409, 'Kỳ đã đóng hoặc hết thời gian đăng ký');
  return batch;
}
async function opportunities(batch, studentId = null, hideApplied = false) {
  const companies = await User.find({ role: 'company', disabled: { $ne: true } })
    .select('_id name companyName')
    .lean();
  let row = studentId
    ? await Registration.findOne({ batchId: batch._id, studentUserId: studentId }).lean()
    : null;
  if (
    row &&
    (['withdrawn', 'rejected'].includes(row.status) ||
      (row.status === 'placed' &&
        (await Assignment.exists({ _id: row.assignmentId, lifecycle: 'cancelled' }))))
  )
    row = null;
  const key = studentId ? applicantKey(batch._id, studentId) : null;
  const topics = await Topic.find({
    status: 'open',
    companyUserId: { $in: companies.map((c) => c._id) },
  })
    .select('title description companyName companyUserId kpis maxSlots +applicantKeys')
    .lean();
  return {
    companies,
    items: topics
      .filter(
        (t) =>
          t.kpis.length &&
          t.kpis.reduce((sum, k) => sum + k.weightPercent, 0) === 100 &&
          t.kpis.every((k) => k.deadline >= batch.startDate && k.deadline <= batch.endDate)
      )
      .filter(
        (t) => (!hideApplied && t.applicantKeys?.includes(key)) || (t.applicantKeys?.length || 0) < (t.maxSlots || 1)
      )
      .filter(
        (t) => !hideApplied || !row?.choices?.some((c) => String(c.topicId) === String(t._id))
      )
      .map(publicTopic),
    assistanceAllowed: assistanceAllowed(batch),
    applicationCount: row?.choices?.length || 0,
    hasSelection: Boolean(row?.selectedTopicId),
  };
}
router.get(
  '/batches/:id/opportunities',
  requireRole('student', 'admin'),
  asyncHandler(async (req, res) => {
    const batch = await openBatch(req.params.id);
    const studentId =
      req.user.role === 'student'
        ? req.user._id
        : req.query.studentUserId
        ? v.id(req.query.studentUserId)
        : null;
    res.json(await opportunities(batch, studentId, req.user.role === 'student'));
  })
);
router.get(
  '/batch-registrations',
  requireRole('student', 'admin', 'company'),
  asyncHandler(async (req, res) => {
    const filter =
      req.user.role === 'admin'
        ? {}
        : req.user.role === 'company'
        ? { 'choices.companyUserId': req.user._id }
        : { studentUserId: req.user._id };
    const page = await v.paged(Registration, filter, req.query),
      rows = page.items;
    const [students, batches, topics] = await Promise.all([
      User.find({ _id: { $in: rows.map((r) => r.studentUserId) } })
        .select('name email')
        .lean(),
      InternshipBatch.find({ _id: { $in: rows.map((r) => r.batchId) } })
        .select('name startDate endDate status')
        .lean(),
      Topic.find({
        _id: {
          $in: rows
            .flatMap((r) => [r.topicId, ...(r.choices || []).map((c) => c.topicId)])
            .filter(Boolean),
        },
      })
        .select('title companyName companyUserId')
        .lean(),
    ]);
    const find = (list, id) => list.find((x) => String(x._id) === String(id));
    res.json({
      ...page,
      items: rows.map((r) => {
        const batch = find(batches, r.batchId),
          choices = (r.choices || [])
            .filter(
              (c) => req.user.role !== 'company' || String(c.companyUserId) === String(req.user._id)
            )
            .map((c) => ({ ...c, topic: find(topics, c.topicId) }));
        if (req.user.role === 'company')
          return {
            _id: r._id,
            __v: r.__v,
            batchId: r.batchId,
            studentUserId: r.studentUserId,
            student: find(students, r.studentUserId),
            batch,
            choices,
            selectedTopicId: choices.some((c) => String(c.topicId) === String(r.selectedTopicId))
              ? r.selectedTopicId
              : null,
            status: r.status,
          };
        return {
          ...r,
          student: find(students, r.studentUserId),
          batch,
          topic: find(topics, r.topicId),
          choices,
          assistanceAllowed: batch ? assistanceAllowed(batch) : false,
        };
      }),
    });
  })
);
router.post(
  '/batch-registrations',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['batchId', 'topicId', 'requestType', 'message']);
    const batch = await openBatch(req.body.batchId),
      type = v.choice(req.body.requestType, ['application', 'assistance'], 'Hình thức đăng ký'),
      message = v.text(req.body.message, 'Nguyện vọng', { max: 2000 });
    const saved = await withStudentLock(req.user._id, async () => {
      if (await existingPlacement(req.user, batch._id))
        throw new HttpError(409, 'Bạn đã có phân công trong kỳ này');
      let row = await Registration.findOne({ batchId: batch._id, studentUserId: req.user._id });
      const reopen =
        row &&
        (['withdrawn', 'rejected'].includes(row.status) ||
          (row.status === 'placed' &&
            (await Assignment.exists({ _id: row.assignmentId, lifecycle: 'cancelled' }))));
      if (reopen) {
        row.choices = [];
        row.selectedTopicId = null;
        row.topicId = null;
        row.assignmentId = null;
        row.reason = '';
        row.status = 'submitted';
      }
      if (row && (row.status !== 'submitted' || row.selectedTopicId))
        throw new HttpError(409, 'Đăng ký đã được chọn/phân công; không thể thêm nguyện vọng');
      if (type === 'assistance') {
        if (req.body.topicId) throw new HttpError(400, 'Yêu cầu hỗ trợ không chọn đề tài');
        if (!assistanceAllowed(batch))
          throw new HttpError(
            409,
            'Chỉ nhờ nhà trường phân công trong 7 ngày trước ngày bắt đầu kỳ hoặc khi kỳ đã bắt đầu'
          );
        if (row?.requestType === 'assistance' && !reopen)
          throw new HttpError(409, 'Bạn đã gửi yêu cầu hỗ trợ');
        const priorChoices = row ? [...row.choices] : [];
        const data = {
          requestType: type,
          message,
          topicId: null,
          selectedTopicId: null,
          choices: [],
          status: 'submitted',
          reason: '',
          assignmentId: null,
        };
        if (row) {
          Object.assign(row, data);
          row.history.push(v.event(req.user, 'registration.assistance_requested'));
          row.increment();
          const saved = await row.save();
          for (const c of priorChoices)
            await releaseTopic(c.topicId, applicantKey(batch._id, req.user._id));
          return saved;
        }
        return Registration.create({
          batchId: batch._id,
          studentUserId: req.user._id,
          ...data,
          history: [v.event(req.user, 'registration.assistance_requested')],
        });
      }
      const topicId = v.id(req.body.topicId),
        choices = row?.choices || [];
      checkApplication(choices, topicId);
      const topic = (await opportunities(batch)).items.find((t) => String(t._id) === topicId);
      if (!topic) throw new HttpError(409, 'Đề tài đã đủ chỉ tiêu hoặc không còn phù hợp với kỳ');
      const key = applicantKey(batch._id, req.user._id),
        reserved = await reserveTopic(topicId, key);
      try {
        const choice = {
          topicId,
          companyUserId: topic.companyUserId,
          status: 'submitted',
          message,
          appliedAt: new Date(),
        };
        if (row) {
          row.requestType = type;
          row.message = message;
          row.topicId = row.topicId || topicId;
          row.choices.push(choice);
          row.history.push(v.event(req.user, 'registration.applied', { topicId }));
          row.increment();
          return await row.save();
        }
        return await Registration.create({
          batchId: batch._id,
          studentUserId: req.user._id,
          requestType: type,
          message,
          topicId,
          choices: [choice],
          history: [v.event(req.user, 'registration.applied', { topicId })],
        });
      } catch (error) {
        if (reserved) await releaseTopic(topicId, key);
        throw error;
      }
    });
    res.status(201).json(saved);
  })
);
router.patch(
  '/batch-registrations/:id/choices/:topicId',
  requireRole('company'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['status', 'reason', 'version']);
    const initial = await Registration.findOne({
      _id: v.id(req.params.id),
      'choices.companyUserId': req.user._id,
    });
    if (!initial) throw new HttpError(404, 'Không tìm thấy ứng tuyển trong doanh nghiệp của bạn');
    res.json(
      await withStudentLock(initial.studentUserId, async () => {
        const row = await Registration.findById(initial._id),
          topicId = v.id(req.params.topicId);
        await openBatch(String(row.batchId));
        v.integer(req.body.version, 0, Number.MAX_SAFE_INTEGER, 'Phiên bản');
        if (row.__v !== req.body.version || row.status !== 'submitted' || row.selectedTopicId)
          throw new HttpError(409, 'Đăng ký đã thay đổi hoặc sinh viên đã chọn đề tài; tải lại');
        const choice = row.choices.find(
          (c) => String(c.topicId) === topicId && String(c.companyUserId) === String(req.user._id)
        );
        if (!choice || choice.status !== 'submitted')
          throw new HttpError(409, 'Chỉ xét nguyện vọng đang chờ của doanh nghiệp mình');
        choice.status = v.choice(req.body.status, ['accepted', 'rejected'], 'Kết quả');
        choice.reason = v.text(req.body.reason, 'Nhận xét', { required:false, max: 2000 });
        choice.reviewedAt = new Date();
        row.history.push(
          v.event(req.user, 'registration.company_reviewed', {
            topicId,
            status: choice.status,
            reason: choice.reason,
          })
        );
        row.increment();
        await row.save();
        if (choice.status === 'rejected')
          await releaseTopic(topicId, applicantKey(row.batchId, row.studentUserId));
        return { _id: row._id, __v: row.__v, topicId, status: choice.status };
      })
    );
  })
);
router.patch(
  '/batch-registrations/:id/select',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['topicId', 'version']);
    res.json(
      await withStudentLock(req.user._id, async () => {
        const row = await Registration.findOne({
          _id: v.id(req.params.id),
          studentUserId: req.user._id,
        });
        if (!row) throw new HttpError(404, 'Không tìm thấy đăng ký');
        v.integer(req.body.version, 0, Number.MAX_SAFE_INTEGER, 'Phiên bản');
        if (row.__v !== req.body.version || row.status !== 'submitted' || row.selectedTopicId)
          throw new HttpError(409, 'Đăng ký đã thay đổi hoặc đã chọn đề tài');
        await openBatch(String(row.batchId));
        if (await existingPlacement(req.user, row.batchId))
          throw new HttpError(409, 'Bạn đã có phân công trong kỳ này');
        const topicId = v.id(req.body.topicId),
          chosen = chooseAccepted(row, topicId);
        const topic = await Topic.findOne({
          _id: topicId,
          status: 'open',
          companyUserId: chosen.companyUserId,
        });
        if (
          !topic ||
          !(await User.exists({
            _id: chosen.companyUserId,
            disabled: { $ne: true },
            role: 'company',
          }))
        )
          throw new HttpError(409, 'Doanh nghiệp/đề tài không còn tiếp nhận');
        const key = applicantKey(row.batchId, row.studentUserId);
        await reserveTopic(topicId, key);
        const declined = row.choices.filter(
          (c) => String(c.topicId) !== topicId && ['submitted', 'accepted'].includes(c.status)
        );
        for (const c of declined) c.status = 'declined';
        row.selectedTopicId = topicId;
        row.topicId = topicId;
        row.history.push(v.event(req.user, 'registration.selected', { topicId }));
        row.increment();
        await row.save();
        for (const c of declined) await releaseTopic(c.topicId, key);
        return row;
      })
    );
  })
);
router.patch(
  '/batch-registrations/:id',
  requireRole('student', 'admin'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['status', 'reason', 'version']);
    const initial = await Registration.findOne({
      _id: v.id(req.params.id),
      ...(req.user.role === 'student' ? { studentUserId: req.user._id } : {}),
    });
    if (!initial) throw new HttpError(404, 'Không tìm thấy đăng ký');
    res.json(
      await withStudentLock(initial.studentUserId, async () => {
        const row = await Registration.findById(initial._id),
          status = req.user.role === 'admin' ? 'rejected' : 'withdrawn';
        v.choice(req.body.status, [status], 'Trạng thái');
        const reason = v.text(req.body.reason, 'Lý do', { required:false, max: 2000 });
        if (row.status !== 'submitted')
          throw new HttpError(409, 'Chỉ xử lý đăng ký chưa phân công');
        const result = await v.updateVersion(
          Registration,
          row,
          req.body.version,
          { status, reason },
          v.event(req.user, 'registration.' + status, { reason }),
          { status: 'submitted' }
        );
        for (const c of row.choices)
          await releaseTopic(c.topicId, applicantKey(row.batchId, row.studentUserId));
        return result;
      })
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
      throw new HttpError(409, 'Đăng ký đã thay đổi; tải lại');
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
