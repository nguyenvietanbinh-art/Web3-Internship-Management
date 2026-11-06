const mongoose = require('mongoose');
const { HistorySchema } = require('../core/shared');

const schema = new mongoose.Schema(
  {
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'InternshipBatch', required: true },
    studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    requestType: { type: String, enum: ['application', 'assistance'], required: true },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['submitted', 'processing', 'placed', 'rejected', 'withdrawn'],
      default: 'submitted',
    },
    reason: { type: String, default: '' },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', default: null },
    history: { type: [HistorySchema], default: [] },
  },
  { timestamps: true, collection: 'batch_registrations' }
);

schema.index({ batchId: 1, studentUserId: 1 }, { unique: true });
schema.index({ studentUserId: 1, createdAt: -1 });
schema.index({ status: 1, createdAt: -1 });
module.exports = mongoose.model('BatchRegistration', schema);
