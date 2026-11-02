const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  companyWallet: { type: String, required: true, lowercase: true, index: true },
  studentWallet: { type: String, required: true, lowercase: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  nonce: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  usedAt: { type: Date, default: null },
}, { timestamps: true, collection: 'attendance_sessions' });
module.exports = mongoose.model('AttendanceSession', schema);
