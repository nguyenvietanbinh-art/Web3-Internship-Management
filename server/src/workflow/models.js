const mongoose = require('mongoose');
const { Schema } = mongoose;
const history = { type: [require('../core/shared').HistorySchema], default: [] };
const ref = (name, required = true) => ({ type: Schema.Types.ObjectId, ref: name, required });
const make = (name, collection, fields, indexes) => {
  const schema = new Schema(fields, { timestamps: true, optimisticConcurrency: true });
  for (const [key, options] of indexes || []) schema.index(key, options);
  return mongoose.models[name] || mongoose.model(name, schema, collection);
};
const Enrollment = make('BatchEnrollment', 'batch_enrollments', {
  studentUserId: ref('User'), batchId: ref('InternshipBatch'),
  eligibility: { type: String, enum: ['eligible', 'suspended', 'exempt', 'removed'], default: 'eligible' },
  registeredAt: { type: Date, default: null },
  usedOpportunities: { type: [Schema.Types.ObjectId], default: [], validate: values => new Set(values.map(String)).size === values.length },
  refundedOpportunities: { type: [Schema.Types.ObjectId], default: [], validate: function(values){return new Set(values.map(String)).size===values.length&&values.every(id=>this.usedOpportunities.some(used=>String(used)===String(id)));} },
  admission: { type: new Schema({ opportunityId: ref('TopicOpportunity'), companyUserId: ref('User'), applicationId: ref('SchoolApplication', false), state: { type: String, enum: ['active', 'cancelled'], required: true }, confirmedAt: Date, allocationId: String, title: String, companyName: String }, { _id: false }), default: null },
  assignmentId: ref('Assignment', false), history,
}, [[{ batchId: 1, studentUserId: 1 }, { unique: true }], [{ batchId: 1, eligibility: 1, registeredAt: 1 }, {}]]);
const Opportunity = make('TopicOpportunity', 'topic_opportunities', {
  topicId: ref('Topic'), companyUserId: ref('User'), batchId: ref('InternshipBatch'),
  title: { type: String, required: true }, companyName: { type: String, required: true }, description: String,
  capacity: { type: Number, required: true, min: 1, max: 1000 }, confirmedCount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['open', 'closed'], default: 'open' }, schoolAllocationAllowed: { type: Boolean, default: false },
  closureReason: {type:String,default:''},
  topicVersion: Number, kpis: { type: [Schema.Types.Mixed], required: true }, history,
}, [[{ batchId: 1, topicId: 1 }, { unique: true }], [{ batchId: 1, companyUserId: 1, status: 1 }, {}]]);
// A separate collection avoids conflicting legacy (jdId, studentUserId) unique indexes.
// Shared CV/JD/Topic identities are reused; legacy applications remain preserved for migration.
const Application = make('SchoolApplication', 'school_applications', {
  enrollmentId: ref('BatchEnrollment'), studentUserId: ref('User'), companyUserId: ref('User'), batchId: ref('InternshipBatch'), opportunityId: ref('TopicOpportunity'),
  studentName: String, title: String, companyName: String,
  state: { type: String, enum: ['submitted', 'dispatched', 'under_review', 'offered', 'rejected', 'withdrawn', 'confirmed', 'closed_other_selected', 'closed_full', 'cancelled'], default: 'submitted' },
  closedAt: Date, quotaRefundedAt: Date, closeReason: String,
  cvSnapshot: Schema.Types.Mixed, cvFileData: { type: Buffer, select: false }, cvMime: String, cvFileName: String,
  dispatch: { by: ref('User', false), at: Date, revokedAt: { type: Date, default: null }, version: Number },
  message: String, decisionReason: String, history,
}, [[{ enrollmentId: 1, opportunityId: 1 }, { unique: true }], [{ companyUserId: 1, state: 1, 'dispatch.revokedAt': 1 }, {}], [{ studentUserId: 1, batchId: 1 }, {}]]);
const SupportRound = make('SupportRound', 'support_rounds', {
  assignmentId: ref('Assignment'), companyUserId: ref('User'), studentUserId: ref('User'), batchId: ref('InternshipBatch'), roundCode: { type: String, required: true }, label: { type: String, required: true },
  activePaymentId: ref('SupportPayment', false), state: { type: String, enum: ['open', 'confirmed'], default: 'open' }, history,
}, [[{ assignmentId: 1, roundCode: 1 }, { unique: true }]]);
const SupportPayment = make('SupportPayment', 'support_payments', {
  roundId: ref('SupportRound'), assignmentId: ref('Assignment'), companyUserId: ref('User'), studentUserId: ref('User'), batchId: ref('InternshipBatch'),
  requestId: { type: String, required: true, unique: true }, amount: { type: String, required: true }, decimals: { type: Number, default: 18 },
  sender: { type: String, required: true }, recipient: { type: String, required: true }, senderWalletVersion: Number, recipientWalletVersion: Number,
  chainId: Number, contractAddress: String, deploymentId: String, chainInstanceId: String,
  roundKey: String, assignmentKey: String, snapshotHash: String, expiry: Number, authorization: Schema.Types.Mixed,
  issuerSignature: { type: String, select: false }, note: { type: String, default: '' },
  state: { type: String, enum: ['prepared', 'submitted', 'confirmed', 'failed_onchain', 'cancelled', 'needs_reconciliation'], default: 'prepared' },
  txHash: String, blockHash: String, blockNumber: Number, logIndex: Number, verifiedAt: Date, errorCode: String, history,
}, [[{ chainId: 1, deploymentId: 1, contractAddress: 1, txHash: 1, logIndex: 1 }, { unique: true, partialFilterExpression: { verifiedAt: { $type: 'date' } } }]]);
module.exports = { Enrollment, Opportunity, Application, SupportRound, SupportPayment };
