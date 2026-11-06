const mongoose = require('mongoose');
const { HistorySchema } = require('../core/shared');

const schema = new mongoose.Schema(
  {
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'InternshipBatch', required: true },
    studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    selectedTopicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    choices: {
      type: [
        new mongoose.Schema(
          {
            topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
            companyUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            status: {
              type: String,
              enum: ['submitted', 'accepted', 'rejected', 'declined'],
              default: 'submitted',
            },
            message: { type: String, default: '' },
            reason: { type: String, default: '' },
            appliedAt: { type: Date, default: Date.now },
            reviewedAt: Date,
          },
          { _id: false }
        ),
      ],
      default: [],
    },
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
schema
  .path('choices')
  .validate(
    (items) =>
      items.length <= 3 && new Set(items.map((c) => String(c.topicId))).size === items.length,
    'Chỉ được tối đa 3 nguyện vọng khác nhau'
  );
schema.index({ studentUserId: 1, createdAt: -1 });
schema.index({ status: 1, createdAt: -1 });
module.exports = mongoose.model('BatchRegistration', schema);
