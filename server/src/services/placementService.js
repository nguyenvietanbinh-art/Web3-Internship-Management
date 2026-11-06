const User = require('../models/User');
const Student = require('../models/Student');
const Topic = require('../models/Topic');
const Assignment = require('../models/Assignment');
const BatchRegistration = require('../models/BatchRegistration');
const { InternshipBatch, Application } = require('../models/BusinessModels');
const identity = require('./businessIdentity');
const { HttpError } = require('../utils/http');
const v = require('../core/shared');

async function existingPlacement(student, batchId) {
  return Assignment.findOne({
    batchId,
    lifecycle: { $ne: 'cancelled' },
    ...identity.owned(student, 'studentUserId', 'studentWallet'),
  });
}

async function createPlacement(actor, body, registration = null) {
  if (
    body.approveImmediately !== undefined &&
    (actor.role !== 'admin' || typeof body.approveImmediately !== 'boolean')
  ) {
    throw new HttpError(403, 'Chỉ Nhà trường được phê duyệt ngay khi phân công');
  }
  const approve = actor.role === 'admin' && body.approveImmediately === true;
  const reason = approve
    ? v.text(body.reason, 'Lý do phân công', { required: true, max: 2000 })
    : '';
  const topic = await Topic.findById(v.id(body.topicId));
  const batch = await InternshipBatch.findById(v.id(body.batchId));
  if (!topic || !batch) throw new HttpError(404, 'Không có đề tài/kỳ');
  if (topic.status !== 'open') throw new HttpError(409, 'Đề tài đã ngừng tiếp nhận');
  if (actor.role === 'company' && !identity.belongs(topic, actor, 'companyUserId', 'companyWallet'))
    throw new HttpError(403, 'Đề tài ngoài quyền');
  const student = await User.findOne({
    _id: v.id(body.studentUserId),
    role: 'student',
    disabled: { $ne: true },
  });
  const mentor = await User.findOne({
    _id: v.id(body.mentorUserId),
    role: 'mentor',
    disabled: { $ne: true },
  });
  const company = topic.companyUserId
    ? await User.findById(topic.companyUserId)
    : await User.findOne({ walletAddress: topic.companyWallet });
  if (!student || !mentor || !company || company.role !== 'company' || company.disabled)
    throw new HttpError(400, 'Thành viên không hợp lệ');
  if (
    actor.role === 'company' &&
    !(await Application.exists({
      $and: [
        identity.owned(actor, 'companyUserId', 'companyWallet'),
        identity.owned(student, 'studentUserId', 'studentWallet'),
      ],
      status: 'accepted',
    }))
  )
    throw new HttpError(403, 'Sinh viên chưa được doanh nghiệp chấp nhận ứng tuyển');
  const normalized = await Student.findOne({ userId: student._id });
  if (!normalized) throw new HttpError(409, 'Sinh viên cần hoàn thiện tài khoản');
  const startDate = v.date(body.startDate, 'Bắt đầu'),
    endDate = v.date(body.endDate, 'Kết thúc');
  if (await existingPlacement(student, batch._id))
    throw new HttpError(
      409,
      'Sinh viên đã có phân công trong kỳ này; cần xử lý phân công hiện tại trước',
      'PLACEMENT_EXISTS'
    );
  const dateLabel = (value) =>
    new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  if (batch.status !== 'open')
    throw new HttpError(400, 'Kỳ thực tập chưa mở hoặc đã đóng; chọn kỳ đang mở', 'BATCH_NOT_OPEN');
  if (startDate >= endDate)
    throw new HttpError(
      400,
      'Ngày kết thúc phải sau ngày bắt đầu thực tập',
      'PLACEMENT_DATE_ORDER'
    );
  if (startDate < batch.startDate || endDate > batch.endDate)
    throw new HttpError(
      400,
      `Thời gian phân công phải nằm trong kỳ: ${dateLabel(batch.startDate)} đến ${dateLabel(
        batch.endDate
      )} (giờ Việt Nam)`,
      'PLACEMENT_OUTSIDE_BATCH'
    );
  if (!topic.kpis.length || topic.kpis.reduce((sum, k) => sum + k.weightPercent, 0) !== 100)
    throw new HttpError(
      400,
      'Đề tài cần có tiêu chí KPI với tổng trọng số bằng 100%; doanh nghiệp cần sửa đề tài trước khi phân công',
      'INVALID_TOPIC_KPIS'
    );
  const outside = topic.kpis.filter((k) => k.deadline < startDate || k.deadline > endDate);
  if (outside.length)
    throw new HttpError(
      400,
      `Hạn KPI nằm ngoài thời gian phân công: ${outside
        .map((k) => `“${k.title}” — ${dateLabel(k.deadline)}`)
        .join(
          '; '
        )} (giờ Việt Nam). Điều chỉnh ngày bắt đầu/kết thúc để bao gồm các hạn KPI, hoặc nhờ doanh nghiệp sửa hạn KPI của đề tài.`,
      'KPI_OUTSIDE_PLACEMENT'
    );

  let claimed = null;
  if (!registration) {
    registration = await BatchRegistration.findOne({
      batchId: batch._id,
      studentUserId: student._id,
      status: { $in: ['submitted', 'processing'] },
    });
  }
  if (registration) {
    if (
      String(registration.batchId) !== String(batch._id) ||
      String(registration.studentUserId) !== String(student._id)
    )
      throw new HttpError(409, 'Đăng ký không khớp sinh viên/kỳ');
    claimed = await BatchRegistration.findOneAndUpdate(
      { _id: registration._id, __v: registration.__v, status: 'submitted' },
      { $set: { status: 'processing' }, $inc: { __v: 1 } },
      { new: true }
    );
    if (!claimed)
      throw new HttpError(409, 'Đăng ký đã thay đổi; tải lại trước khi phân công', 'STALE_VERSION');
  }
  let assignment;
  try {
    assignment = await Assignment.create({
      topicId: topic._id,
      studentId: normalized._id,
      kpiAtAssign: 100,
      batchId: batch._id,
      studentBatchKey: `${batch._id}:${student._id}`,
      ...identity.refs(student, 'studentUserId', 'studentWallet'),
      ...identity.refs(company, 'companyUserId', 'companyWallet'),
      ...identity.refs(mentor, 'mentorUserId', 'mentorWallet'),
      startDate,
      endDate,
      lifecycle: approve ? 'approved' : 'proposed',
      kpis: topic.kpis.map((k, i) => ({
        milestoneIndex: i,
        title: k.title,
        description: k.description,
        weightPercent: k.weightPercent,
        deadline: k.deadline,
        status: 'pending',
      })),
      history: [
        v.event(actor, 'placement.proposed'),
        ...(approve
          ? [v.event(actor, 'placement.state', { before: 'proposed', after: 'approved', reason })]
          : []),
      ],
    });
  } catch (error) {
    if (claimed)
      await BatchRegistration.updateOne(
        { _id: claimed._id, status: 'processing' },
        { $set: { status: 'submitted' }, $inc: { __v: 1 } }
      );
    throw error;
  }
  // Link an existing request even when Admin starts from the direct-assignment form.
  await BatchRegistration.updateOne(
    {
      batchId: batch._id,
      studentUserId: student._id,
      status: { $in: claimed ? ['processing'] : ['submitted'] },
    },
    {
      $set: {
        status: 'placed',
        assignmentId: assignment._id,
        reason: reason || 'Đã tạo phân công thực tập',
      },
      $inc: { __v: 1 },
      $push: { history: v.event(actor, 'registration.placed', { assignmentId: assignment._id }) },
    }
  );
  return assignment;
}

module.exports = { createPlacement, existingPlacement };
