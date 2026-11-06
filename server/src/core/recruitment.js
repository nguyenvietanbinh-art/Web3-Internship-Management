const identity = require('../services/businessIdentity');
const router = require('express').Router();
const { CV, Application, NotificationReceipt } = require('../models/BusinessModels');
const JD = require('../models/JD');
const { requireRole } = require('../middleware/auth');
const { asyncHandler, HttpError } = require('../utils/http');
const v = require('./shared');
router.use(require('./cv'));
const jdFields = [
  'title',
  'department',
  'description',
  'requirements',
  'benefits',
  'slots',
  'location',
  'salary',
  'deadline',
  'status',
];
function jdInput(body, partial = false) {
  const data = {};
  for (const k of ['title', 'department', 'description', 'location', 'salary'])
    if (!partial || body[k] !== undefined)
      data[k] = v.text(body[k], k, {
        required: ['title', 'description'].includes(k),
        max: k === 'description' ? 20000 : 300,
      });
  for (const k of ['requirements', 'benefits'])
    if (!partial || body[k] !== undefined) data[k] = v.list(body[k] || [], k);
  if (!partial || body.slots !== undefined)
    data.slots = v.integer(body.slots === undefined ? 1 : body.slots, 1, 100, 'Số vị trí');
  if (!partial || body.deadline !== undefined)
    data.deadline = v.date(body.deadline, 'Hạn ứng tuyển');
  if (body.status !== undefined)
    data.status = v.choice(body.status, ['open', 'closed'], 'Trạng thái');
  return data;
}
router.get(
  '/jds',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.mine === 'true') {
      if (req.user.role !== 'company') throw new HttpError(403, 'Chỉ doanh nghiệp xem JD của mình');
      Object.assign(filter, identity.owned(req.user, 'companyUserId', 'companyWallet'));
    } else {
      filter.status = 'open';
      filter.deadline = { $gt: new Date() };
    }
    if (req.query.status) {
      if (req.query.mine !== 'true') throw new HttpError(403, 'Chỉ lọc trạng thái JD của mình');
      filter.status = v.choice(req.query.status, ['open', 'closed'], 'Trạng thái');
    }
    const q = v.search(req.query.q);
    if (q) filter.$or = [{ title: q }, { companyName: q }, { location: q }];
    if (req.query.location) filter.location = v.search(req.query.location);
    res.json(await v.paged(JD, filter, req.query, { select: '-history' }));
  })
);
router.post(
  '/jds',
  requireRole('company'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, jdFields);
    const data = jdInput(req.body);
    if (data.deadline <= new Date()) throw new HttpError(400, 'Hạn ứng tuyển phải ở tương lai');
    res
      .status(201)
      .json(
        await JD.create({
          ...data,
          status: data.status || 'closed',
          ...identity.refs(req.user, 'companyUserId', 'companyWallet'),
          companyName: req.user.companyName || req.user.name,
          history: [v.event(req.user, 'jd.created')],
        })
      );
  })
);
router.patch(
  '/jds/:id',
  requireRole('company'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, [...jdFields, 'version']);
    const doc = await JD.findOne({
      _id: v.id(req.params.id),
      ...identity.owned(req.user, 'companyUserId', 'companyWallet'),
    });
    if (!doc) throw new HttpError(404, 'Không có JD trong phạm vi của bạn');
    const data = jdInput(req.body, true);
    if ((data.status || doc.status) === 'open' && (data.deadline || doc.deadline) <= new Date())
      throw new HttpError(400, 'Cần hạn tuyển dụng còn hiệu lực');
    res.json(
      await v.updateVersion(
        JD,
        doc,
        req.body.version,
        data,
        v.event(req.user, 'jd.updated', {
          fields: Object.keys(data),
          status: data.status || doc.status,
        })
      )
    );
  })
);
function appScope(user) {
  if (user.role === 'admin') return {};
  if (user.role === 'student') return identity.owned(user, 'studentUserId', 'studentWallet');
  if (user.role === 'company') return identity.owned(user, 'companyUserId', 'companyWallet');
  throw new HttpError(403, 'Chỉ sinh viên/doanh nghiệp hoặc Admin xem ứng tuyển');
}
router.get(
  '/applications',
  asyncHandler(async (req, res) => {
    const filter = appScope(req.user);
    if (req.query.status)
      filter.status = v.choice(
        req.query.status,
        ['submitted', 'under_review', 'accepted', 'rejected', 'withdrawn'],
        'Trạng thái'
      );
    if (req.query.jdId) filter.jdId = v.id(req.query.jdId);
    const q = v.search(req.query.q);
    if (q) filter.$or = [{ jdTitle: q }, { studentName: q }, { companyName: q }];
    res.json(await v.paged(Application, filter, req.query));
  })
);
router.post(
  '/applications',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['jdId', 'message']);
    const jd = await JD.findById(v.id(req.body.jdId));
    if (!jd || jd.status !== 'open' || jd.deadline <= new Date())
      throw new HttpError(409, 'JD không còn nhận ứng tuyển');
    const cv = await CV.findOne(identity.owned(req.user, 'ownerUserId', 'ownerWallet'));
    if (!cv) throw new HttpError(409, 'Cần lưu CV trước khi ứng tuyển');
    if (!cv.skills.length && !cv.extractedText.trim() && !cv.summary.trim())
      throw new HttpError(400, 'CV chưa có nội dung');
    const cvSnapshot = Object.fromEntries(
      [
        'title',
        'summary',
        'skills',
        'education',
        'experience',
        'university',
        'gpa',
        'extractedText',
        'parser',
        'sha256',
      ].map((k) => [k, cv[k]])
    );
    cvSnapshot.cvVersion = cv.__v;
    const app = await Application.create({
      jdId: jd._id,
      cvId: cv._id,
      ...identity.refs(req.user, 'studentUserId', 'studentWallet'),
      companyUserId: jd.companyUserId,
      companyWallet: jd.companyWallet,
      studentName: req.user.name,
      jdTitle: jd.title,
      companyName: jd.companyName,
      cvSnapshot,
      message: v.text(req.body.message, 'Lời nhắn', { max: 3000 }),
      history: [
        v.event(req.user, 'application.submitted', {
          recipient: jd.companyWallet,
          recipientUserId: jd.companyUserId,
        }),
      ],
    });
    res.status(201).json(app);
  })
);
router.patch(
  '/applications/:id',
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['status', 'reason', 'version']);
    const doc = await Application.findOne({ _id: v.id(req.params.id), ...appScope(req.user) });
    if (!doc) throw new HttpError(404, 'Không tìm thấy ứng tuyển');
    const status =
      req.user.role === 'student'
        ? v.choice(req.body.status, ['withdrawn'], 'Trạng thái')
        : v.choice(req.body.status, ['under_review', 'accepted', 'rejected'], 'Trạng thái');
    if (req.user.role === 'admin')
      throw new HttpError(403, 'Xét duyệt thuộc doanh nghiệp sở hữu JD');
    if (!['submitted', 'under_review'].includes(doc.status) || status === doc.status)
      throw new HttpError(409, 'Ứng tuyển đã kết thúc hoặc trạng thái không đổi');
    const reason = v.text(req.body.reason, 'Lý do', { required: true, max: 2000 });
    res.json(
      await v.updateVersion(
        Application,
        doc,
        req.body.version,
        { status },
        v.event(req.user, 'application.state', {
          before: doc.status,
          after: status,
          reason,
          recipient: req.user.role === 'student' ? doc.companyWallet : doc.studentWallet,
          recipientUserId: req.user.role === 'student' ? doc.companyUserId : doc.studentUserId,
        })
      )
    );
  })
);
async function notifications(user) {
  const apps = await Application.find({
    $or: [
      identity.owned(user, 'studentUserId', 'studentWallet'),
      identity.owned(user, 'companyUserId', 'companyWallet'),
    ],
  }).select('history jdTitle');
  const receipts = await NotificationReceipt.find({ userId: user._id }).lean();
  const read = new Set(receipts.map((r) => r.eventId));
  return apps
    .flatMap((app) =>
      app.history
        .filter((e) =>
          e.data?.recipientUserId
            ? String(e.data.recipientUserId) === String(user._id)
            : identity.validWallet(user) && e.data?.recipient === user.walletAddress
        )
        .map((e) => ({
          id: String(e._id),
          applicationId: String(app._id),
          at: e.at,
          title: app.jdTitle,
          message:
            e.action === 'application.submitted'
              ? 'Có hồ sơ ứng tuyển mới'
              : `Ứng tuyển chuyển sang ${e.data.after}`,
          read: read.has(String(e._id)),
        }))
    )
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}
router.get(
  '/notifications',
  asyncHandler(async (req, res) => {
    v.pagination(req.query);
    const items = await notifications(req.user),
      { page, limit, skip } = v.pagination(req.query);
    res.json({
      items: items.slice(skip, skip + limit),
      total: items.length,
      unread: items.filter((x) => !x.read).length,
      page,
      limit,
      pages: Math.max(1, Math.ceil(items.length / limit)),
    });
  })
);
router.patch(
  '/notifications/:id/read',
  asyncHandler(async (req, res) => {
    v.keys(req.body, []);
    v.id(req.params.id);
    if (!(await notifications(req.user)).some((e) => e.id === req.params.id))
      throw new HttpError(404, 'Không có thông báo');
    await NotificationReceipt.updateOne(
      { userId: req.user._id, eventId: req.params.id },
      { $setOnInsert: { readAt: new Date() } },
      { upsert: true }
    );
    res.json({ read: true });
  })
);
module.exports = router;
