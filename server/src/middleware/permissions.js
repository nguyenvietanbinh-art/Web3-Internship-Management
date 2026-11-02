const Topic = require('../models/Topic');
const { HttpError, normalizeWallet, isObjectId, isWallet } = require('../utils/http');

function topicScope(user) {
  if (user.role === 'admin') return {};
  if (user.role === 'company') return { companyWallet: user.walletAddress };
  if (user.role === 'student') return { assignedStudentWallet: user.walletAddress };
  if (user.role === 'mentor') return { mentorWallet: user.walletAddress };
  throw new HttpError(403, 'Vai trò không được phép');
}
function canReadTopic(user, topic) {
  return Boolean(user && (user.role === 'admin' ||
    (user.role === 'company' && topic.companyWallet === user.walletAddress) ||
    (user.role === 'student' && topic.assignedStudentWallet === user.walletAddress) ||
    (user.role === 'mentor' && topic.mentorWallet === user.walletAddress)));
}
async function relation({ studentWallet, companyWallet, topicId, user }) {
  if (!isWallet(studentWallet) || !isWallet(companyWallet)) throw new HttpError(403, 'Không xác minh được quan hệ phân công');
  const filter = { assignedStudentWallet: normalizeWallet(studentWallet), companyWallet: normalizeWallet(companyWallet) };
  if (topicId) {
    if (!isObjectId(topicId)) throw new HttpError(400, 'ID đề tài không hợp lệ');
    filter._id = topicId;
  }
  const topic = await Topic.findOne(filter);
  if (!topic || (user && !canReadTopic(user, topic))) throw new HttpError(403, 'Bạn không thuộc phân công này', 'NOT_ASSIGNED');
  return topic;
}
async function activeStudentTopic(user, { topicId, companyWallet } = {}) {
  const filter = { assignedStudentWallet: user.walletAddress, status: { $in: ['assigned', 'in_progress'] } };
  if (topicId) { if (!isObjectId(topicId)) throw new HttpError(400, 'ID đề tài không hợp lệ'); filter._id = topicId; }
  if (companyWallet) filter.companyWallet = normalizeWallet(companyWallet);
  const topics = await Topic.find(filter).limit(2);
  if (topics.length !== 1) throw new HttpError(409, 'Cần chọn một phân công đang hoạt động hợp lệ', 'ASSIGNMENT_REQUIRED');
  return topics[0];
}
async function workScope(user, studentField = 'studentWallet', withTopic = true) {
  if (user.role === 'admin') return withTopic ? {assignmentId:{$exists:false}} : {};
  if (user.role === 'student') return { ...(withTopic?{assignmentId:{$exists:false}}:{}), [studentField]: user.walletAddress };
  if (user.role === 'company') return { ...(withTopic?{assignmentId:{$exists:false}}:{}), companyWallet: user.walletAddress };
  if (user.role === 'mentor') {
    const topics = await Topic.find(topicScope(user)).select('_id assignedStudentWallet companyWallet');
    if (withTopic) return { assignmentId:{$exists:false}, topicId: { $in: topics.map(t => t._id) } };
    const pairs = topics.filter(t => t.assignedStudentWallet).map(t => ({ [studentField]: t.assignedStudentWallet, companyWallet: t.companyWallet }));
    return pairs.length ? { $or: pairs } : { _id: { $in: [] } };
  }
  throw new HttpError(403, 'Vai trò không được phép');
}
function ownWalletQuery(user, queryWallet) {
  if (queryWallet && !isWallet(queryWallet)) throw new HttpError(400, 'Ví không hợp lệ');
  if (user.role === 'student' && queryWallet && normalizeWallet(queryWallet) !== user.walletAddress) throw new HttpError(403, 'Không được đọc dữ liệu sinh viên khác');
}
module.exports = { topicScope, canReadTopic, relation, activeStudentTopic, workScope, ownWalletQuery };
