const crypto = require('node:crypto');
const User = require('../models/User');
const Topic = require('../models/Topic');
const { HttpError } = require('../utils/http');

const applicantKey = (batchId, studentId) => `${batchId}:${studentId}`;
function checkApplication(choices, topicId) {
  if (choices.some((c) => String(c.topicId) === String(topicId)))
    throw new HttpError(409, 'Bạn đã ứng tuyển đề tài này; xem kết quả trong danh sách đăng ký');
  if (choices.length >= 3)
    throw new HttpError(
      409,
      'Mỗi sinh viên chỉ được ứng tuyển tối đa 3 đề tài trong một kỳ',
      'APPLICATION_LIMIT'
    );
}
function chooseAccepted(row, topicId) {
  if (row.status !== 'submitted' || row.selectedTopicId)
    throw new HttpError(409, 'Đăng ký đã được chọn hoặc phân công');
  const chosen = row.choices.find(
    (c) => String(c.topicId) === String(topicId) && c.status === 'accepted'
  );
  if (!chosen) throw new HttpError(409, 'Chỉ chọn đề tài đã được doanh nghiệp chấp nhận');
  return chosen;
}
function assistanceAllowed(batch, now = new Date()) {
  return (
    batch.status === 'open' &&
    now < batch.endDate &&
    now >= new Date(batch.startDate.getTime() - 7 * 86400000)
  );
}
// A short persisted lease serializes all changes for one student on standalone MongoDB.
// It expires after a crashed request; capacity itself is reserved atomically on Topic.
async function withStudentLock(studentId, action) {
  const token = crypto.randomUUID(),
    now = new Date();
  const user = await User.findOneAndUpdate(
    {
      _id: studentId,
      $or: [
        { recruitmentLeaseUntil: { $exists: false } },
        { recruitmentLeaseUntil: null },
        { recruitmentLeaseUntil: { $lte: now } },
      ],
    },
    {
      $set: {
        recruitmentLeaseToken: token,
        recruitmentLeaseUntil: new Date(now.getTime() + 120000),
      },
    }
  );
  if (!user)
    throw new HttpError(409, 'Yêu cầu khác của sinh viên đang được xử lý; vui lòng thử lại');
  try {
    return await action();
  } finally {
    await User.updateOne(
      { _id: studentId, recruitmentLeaseToken: token },
      { $unset: { recruitmentLeaseToken: '', recruitmentLeaseUntil: '' } }
    );
  }
}
async function reserveTopic(topicId, key) {
  const owned = await Topic.exists({ _id: topicId, status: 'open', applicantKeys: key });
  if (owned) return false;
  const saved = await Topic.findOneAndUpdate(
    {
      _id: topicId,
      status: 'open',
      applicantKeys: { $ne: key },
      $expr: {
        $lt: [{ $size: { $ifNull: ['$applicantKeys', []] } }, { $ifNull: ['$maxSlots', 1] }],
      },
    },
    { $addToSet: { applicantKeys: key }, $inc: { __v: 1 } }
  );
  if (!saved)
    throw new HttpError(
      409,
      'Đề tài đã đủ số lượng ứng tuyển hoặc ngừng tiếp nhận; chọn đề tài khác',
      'TOPIC_FULL'
    );
  return true;
}
async function releaseTopic(topicId, key) {
  await Topic.updateOne(
    { _id: topicId, applicantKeys: key },
    { $pull: { applicantKeys: key }, $inc: { __v: 1 } }
  );
}
function publicTopic(topic) {
  const { applicantKeys = [], ...data } = topic;
  return {
    ...data,
    applicantCount: applicantKeys.length,
    remainingSlots: Math.max(0, (topic.maxSlots || 1) - applicantKeys.length),
  };
}
module.exports = {
  checkApplication,
  chooseAccepted,
  applicantKey,
  assistanceAllowed,
  withStudentLock,
  reserveTopic,
  releaseTopic,
  publicTopic,
};
