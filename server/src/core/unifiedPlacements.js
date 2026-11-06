const router = require('express').Router(),
  identity = require('../services/businessIdentity'),
  v = require('./shared');
const { requireRole } = require('../middleware/auth'),
  { asyncHandler, HttpError } = require('../utils/http');
const User = require('../models/User'),
  Topic = require('../models/Topic'),
  Assignment = require('../models/Assignment');
const { InternshipBatch, Application } = require('../models/BusinessModels');
router.use((_req, _res, next) => (identity.enabled() ? next() : next('router')));
router.post(
  '/accounts/email',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['email', 'password', 'name', 'role', 'reason']);
    const auth = require('../routes/email.routes'),
      loginEmail = auth.normalizeEmail(req.body.email),
      plain = auth.validatePassword(req.body.password);
    const role = v.choice(req.body.role, ['student', 'company', 'mentor'], 'Vai trò cấp');
    if (await User.exists({ $or: [{ loginEmail }, { email: loginEmail }] }))
      throw new HttpError(409, 'Email đã tồn tại; không tự gộp');
    const user = await User.create({
      loginEmail,
      email: loginEmail,
      passwordHash: await require('bcryptjs').hash(plain, 12),
      name: v.text(req.body.name, 'Tên', { required: true, max: 200 }),
      role,
      auditHistory: [
        v.event(req.user, 'account.email_provisioned', {
          role,
          reason: v.text(req.body.reason, 'Lý do', { required: true }),
        }),
      ],
    });
    await require('../services/accountProfiles').ensureProfile(user);
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  })
);
router.get(
  '/topics',
  requireRole('company', 'admin'),
  asyncHandler(async (req, res) => {
    const filter =
        req.user.role === 'admin' ? {} : identity.owned(req.user, 'companyUserId', 'companyWallet'),
      page = await v.paged(Topic, filter, req.query, { select: '+applicantKeys' });
    const assigned = new Set(
      (
        await Assignment.distinct('topicId', { topicId: { $in: page.items.map((t) => t._id) } })
      ).map(String)
    );
    res.json({
      ...page,
      items: page.items.map((t) => ({
        ...require('../services/topicRecruitment').publicTopic(t),
        hasAssignments: assigned.has(String(t._id)) || t.applicantKeys?.length > 0,
      })),
    });
  })
);
function topicInput(body) {
  if (!Array.isArray(body.kpis) || !body.kpis.length || body.kpis.length > 20)
    throw new HttpError(400, 'Cần từ1 đến20 tiêu chí KPI');
  const kpis = body.kpis.map((k, i) => {
    v.keys(k, ['title', 'description', 'weightPercent', 'deadline']);
    return {
      milestoneIndex: i,
      title: v.text(k.title, 'Tiêu chí', { required: true, max: 200 }),
      description: v.text(k.description, 'Mô tả KPI', { required: true, max: 2000 }),
      weightPercent: v.integer(k.weightPercent, 1, 100, 'Trọng số'),
      deadline: v.date(k.deadline, 'Hạn KPI'),
    };
  });
  if (kpis.reduce((n, k) => n + k.weightPercent, 0) !== 100)
    throw new HttpError(400, 'Tổng trọng số phải100');
  return {
    title: v.text(body.title, 'Đề tài', { required: true, max: 200 }),
    description: v.text(body.description, 'Mô tả', { required: true }),
    kpis,
    maxSlots:
      body.maxSlots === undefined ? 1 : v.integer(body.maxSlots, 1, 1000, 'Chỉ tiêu ứng tuyển'),
  };
}
async function editableTopic(req) {
  const topic = await Topic.findOne({
    _id: v.id(req.params.id),
    ...identity.owned(req.user, 'companyUserId', 'companyWallet'),
  });
  if (!topic) throw new HttpError(404, 'Không tìm thấy đề tài trong phạm vi của bạn');
  if (
    (await Assignment.exists({ topicId: topic._id })) ||
    (await require('../models/BatchRegistration').exists({
      $or: [{ topicId: topic._id }, { 'choices.topicId': topic._id }],
      status: { $in: ['submitted', 'processing'] },
    })) ||
    topic.status !== 'open' ||
    topic.assignedCount > 0 ||
    topic.assignedStudentWallet ||
    topic.onChainId != null
  )
    throw new HttpError(
      409,
      'Đề tài đã có phân công hoặc bằng chứng liên quan, không thể chỉnh sửa hoặc xóa',
      'TOPIC_IN_USE'
    );
  v.integer(req.body.version, 0, Number.MAX_SAFE_INTEGER, 'Phiên bản');
  return topic;
}
router.post(
  '/topics',
  requireRole('company'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['title', 'description', 'kpis', 'maxSlots']);
    res.status(201).json(
      await Topic.create({
        ...identity.refs(req.user, 'companyUserId', 'companyWallet'),
        companyName: req.user.companyName || req.user.name,
        ...topicInput(req.body),
      })
    );
  })
);
router.patch(
  '/topics/:id/capacity',
  requireRole('company'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['maxSlots', 'version']);
    const maxSlots = v.integer(req.body.maxSlots, 1, 1000, 'Chỉ tiêu ứng tuyển');
    v.integer(req.body.version, 0, Number.MAX_SAFE_INTEGER, 'Phiên bản');
    const topic = await Topic.findOne({
      _id: v.id(req.params.id),
      ...identity.owned(req.user, 'companyUserId', 'companyWallet'),
    }).select('+applicantKeys');
    if (!topic) throw new HttpError(404, 'Không tìm thấy đề tài của doanh nghiệp');
    if (topic.applicantKeys.length > maxSlots)
      throw new HttpError(409, 'Không thể giảm chỉ tiêu dưới số chỗ đã giữ');
    const updated = await Topic.findOneAndUpdate(
      {
        _id: topic._id,
        ...v.versionMatch(req.body.version),
        $expr: { $lte: [{ $size: { $ifNull: ['$applicantKeys', []] } }, maxSlots] },
      },
      { $set: { maxSlots }, $inc: { __v: 1 } },
      { new: true, runValidators: true }
    ).select('+applicantKeys');
    if (!updated) throw new HttpError(409, 'Chỉ tiêu đã thay đổi; vui lòng tải lại');
    res.json(require('../services/topicRecruitment').publicTopic(updated.toObject()));
  })
);
router.patch(
  '/topics/:id',
  requireRole('company'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['title', 'description', 'kpis', 'maxSlots', 'version']);
    const topic = await editableTopic(req),
      input = topicInput(req.body);
    if (req.body.maxSlots === undefined) input.maxSlots = topic.maxSlots;
    const saved = await Topic.findOneAndUpdate(
      { _id: topic._id, ...v.versionMatch(req.body.version) },
      { $set: input, $inc: { __v: 1 } },
      { new: true, runValidators: true }
    );
    if (!saved)
      throw new HttpError(409, 'Dữ liệu đã thay đổi; tải lại trước khi sửa', 'STALE_VERSION');
    res.json(saved);
  })
);
router.delete(
  '/topics/:id',
  requireRole('company'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['version']);
    const topic = await editableTopic(req);
    const result = await Topic.deleteOne({ _id: topic._id, ...v.versionMatch(req.body.version) });
    if (!result.deletedCount)
      throw new HttpError(409, 'Dữ liệu đã thay đổi; tải lại trước khi xóa', 'STALE_VERSION');
    res.json({ deleted: true, _id: topic._id });
  })
);
router.get(
  '/directory',
  requireRole('admin', 'company', 'mentor'),
  asyncHandler(async (req, res) => {
    const role = v.choice(req.query.role, ['student', 'company', 'mentor'], 'Vai trò'),
      filter = { role, disabled: { $ne: true } };
    if (req.user.role === 'company' && role === 'student') {
      const applications = await Application.find({
        ...identity.owned(req.user, 'companyUserId', 'companyWallet'),
        status: 'accepted',
      }).select('studentUserId studentWallet');
      const placements = await Assignment.find(require('./placementPolicy').scope(req.user)).select(
        'studentUserId studentWallet'
      );
      const ids = [...applications, ...placements].flatMap((a) =>
          a.studentUserId ? [a.studentUserId] : []
        ),
        wallets = [...applications, ...placements].flatMap((a) =>
          a.studentWallet ? [a.studentWallet] : []
        );
      filter.$or = [{ _id: { $in: ids } }, { walletAddress: { $in: wallets } }];
    } else if (req.user.role === 'mentor') {
      const a = await Assignment.find(require('./placementPolicy').scope(req.user)).lean();
      filter._id = {
        $in: a.flatMap((x) => [x.studentUserId, x.companyUserId, x.mentorUserId].filter(Boolean)),
      };
    } else if (req.user.role === 'company' && role === 'company') filter._id = req.user._id;
    res.json(await v.paged(User, filter, req.query, { select: 'name role walletAddress' }));
  })
);
router.post(
  '/placements',
  requireRole('company', 'admin'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, [
      'topicId',
      'batchId',
      'studentUserId',
      'mentorUserId',
      'startDate',
      'endDate',
      'approveImmediately',
      'reason',
    ]);
    res
      .status(201)
      .json(await require('../services/placementService').createPlacement(req.user, req.body));
  })
);
router.patch(
  '/placements/:id/details',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['mentorUserId', 'startDate', 'endDate', 'reason', 'version']);
    const a = await require('./placementPolicy').load(req.user, req.params.id);
    if (!['proposed', 'approved'].includes(a.lifecycle))
      throw new HttpError(409, 'Chỉ sửa trước khi hoạt động');
    const mentor = await User.findOne({
        _id: v.id(req.body.mentorUserId),
        role: 'mentor',
        disabled: { $ne: true },
      }),
      batch = await InternshipBatch.findById(a.batchId);
    if (!mentor || !batch || batch.status !== 'open')
      throw new HttpError(400, 'Giảng viên/kỳ không hợp lệ');
    const startDate = v.date(req.body.startDate, 'Bắt đầu'),
      endDate = v.date(req.body.endDate, 'Kết thúc');
    if (
      startDate >= endDate ||
      startDate < batch.startDate ||
      endDate > batch.endDate ||
      a.kpis.some((k) => k.deadline < startDate || k.deadline > endDate)
    )
      throw new HttpError(400, 'Ngày không hợp lệ');
    res.json(
      await v.updateVersion(
        Assignment,
        a,
        req.body.version,
        {
          mentorUserId: mentor._id,
          mentorWallet: identity.validWallet(mentor) ? mentor.walletAddress : null,
          startDate,
          endDate,
        },
        v.event(req.user, 'placement.details_updated', {
          reason: v.text(req.body.reason, 'Lý do', { required: true }),
        })
      )
    );
  })
);
module.exports = router;

module.exports.topicInput = topicInput;
