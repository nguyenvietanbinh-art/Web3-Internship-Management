const mongoose = require('mongoose');
const { HistorySchema } = require('../core/shared');
const { Schema } = mongoose,
  ref = (name, required = true) => ({ type: Schema.Types.ObjectId, ref: name, required });
const history = { type: [HistorySchema], default: [] };
function model(name, fields, collection, indexes = []) {
  const schema = new Schema(fields, { timestamps: true, collection });
  for (const [keys, options] of indexes) schema.index(keys, options);
  require('./userOwnership')(schema, name);
  return mongoose.models[name] || mongoose.model(name, schema);
}
const CV = model(
  'CV',
  {
    ownerWallet: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    summary: { type: String, default: '' },
    skills: [String],
    education: { type: String, default: '' },
    experience: { type: String, default: '' },
    university: { type: String, default: '' },
    gpa: { type: Number, min: 0, max: 4, default: null },
    extractedText: { type: String, default: '' },
    parser: { type: String, default: '' },
    fileName: { type: String, default: '' },
    mime: { type: String, default: '' },
    sha256: { type: String, default: '' },
    fileData: { type: Buffer, select: false },
    history,
  },
  'cvs'
);
const Application = model(
  'Application',
  {
    jdId: ref('JD'),
    cvId: ref('CV'),
    studentWallet: { type: String, required: true, index: true },
    companyWallet: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    jdTitle: { type: String, required: true },
    companyName: { type: String, required: true },
    cvSnapshot: {
      title: String,
      summary: String,
      skills: [String],
      education: String,
      experience: String,
      university: String,
      gpa: Number,
      extractedText: String,
      parser: String,
      sha256: String,
      cvVersion: Number,
    },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'accepted', 'rejected', 'withdrawn'],
      default: 'submitted',
    },
    history,
  },
  'applications',
  [[{ jdId: 1, studentWallet: 1 }, { unique: true }]]
);
const InternshipBatch = model(
  'InternshipBatch',
  {
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ['bachelor', 'engineer'] },
    registrationOpensAt: Date,
    registrationClosesAt: Date,
    workflowRevision: {type:Number,default:0},
    reportRubric: {type:Schema.Types.Mixed,default:undefined},
    rubricProposals: {type:[Schema.Types.Mixed],default:undefined},
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['draft', 'open', 'closed'], default: 'draft' },
    history,
  },
  'internship_batches'
);
const WorkSession = model(
  'WorkSession',
  {
    assignmentId: ref('Assignment'),
    batchId: ref('InternshipBatch'),
    studentWallet: { type: String, required: true, index: true },
    companyWallet: { type: String, required: true, index: true },
    mentorWallet: { type: String, required: true },
    day: { type: String, required: true },
    activeStudent: { type: String },
    requestKey: { type: String, required: true },
    checkInAt: { type: Date, required: true },
    checkOutAt: { type: Date, default: null },
    minutes: { type: Number, min: 0, default: null },
    state: {
      type: String,
      enum: ['open', 'pending', 'needs_adjustment', 'approved', 'rejected'],
      default: 'open',
    },
    reason: { type: String, default: '' },
    proof: {
      provider: { type: String, default: 'manual' },
      verified: { type: Boolean, default: false },
      qrSessionId: String,
      checkoutSessionId: String,
      gps: Schema.Types.Mixed,
      checkoutGps: Schema.Types.Mixed,
      checks: Schema.Types.Mixed,
    },
    history,
  },
  'work_sessions',
  [
    [
      { activeStudent: 1 },
      { unique: true, partialFilterExpression: { activeStudent: { $type: 'string' } } },
    ],
    [{ studentWallet: 1, requestKey: 1 }, { unique: true }],
    [{ studentWallet: 1, day: 1 }, { unique: true }],
  ]
);
const ReviewSchema = new Schema({
  role: { type: String, enum: ['company', 'mentor'], required: true },
  actorWallet: { type: String, required: true },
  score: { type: Number, min: 0, max: 100, required: true },
  comment: { type: String, required: true },
  decision: { type: String, enum: ['approved', 'need_revision', 'incorrect'], required: true },
  at: { type: Date, default: Date.now },
  grading: {type:Schema.Types.Mixed,default:undefined},
});
const Report = model(
  'Report',
  {
    assignmentId: ref('Assignment'),
    studentWallet: { type: String, required: true, index: true },
    companyWallet: { type: String, required: true, index: true },
    mentorWallet: { type: String, required: true },
    kind: { type: String, enum: ['weekly', 'final'], required: true },
    weekNumber: {type:Number,min:1,max:104},weeklyRevision:Number,
    taskIds:[{type:Schema.Types.ObjectId,ref:'Task'}],
    selfAssessment:{type:String,default:undefined},
    selfGrading:Schema.Types.Mixed,
    selfGradingHistory:{type:[Schema.Types.Mixed],default:undefined},
    current: { type: Boolean, default: true },
    version: { type: Number, min: 1, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    state: {
      type: String,
      enum: ['submitted', 'need_revision', 'reviewed', 'approved'],
      default: 'submitted',
    },
    reviews: [ReviewSchema],
    finalScore: { type: Number, min: 0, max: 100, default: null },
    approvedBy: { type: String, default: '' },
    approvedAt: Date,
    publicationPolicy:{type:Schema.Types.Mixed,default:undefined},
    evaluationRequired: {type:Boolean,default:undefined},
    certificateRequest: {type:Schema.Types.Mixed,default:undefined},
    creationRequestHash:String,
    evaluationHistory: {type:[Schema.Types.Mixed],default:undefined},
    evidenceChecks: {type:[Schema.Types.Mixed],default:undefined},
    reviewDrafts: {type:[Schema.Types.Mixed],default:undefined},
    revisionRequests:{type:[Schema.Types.Mixed],default:undefined},
    history,
  },
  'business_reports',
  [
    [{ assignmentId: 1, kind: 1, version: 1 }, { unique: true }],
    [
      { assignmentId: 1, kind: 1, current: 1 },
      { unique: true, partialFilterExpression: { current: true } },
    ],
  ]
);
const NotificationReceipt = model(
  'NotificationReceipt',
  {
    userId: ref('User'),
    eventId: { type: String, required: true },
    readAt: { type: Date, default: Date.now },
  },
  'notification_receipts',
  [[{ userId: 1, eventId: 1 }, { unique: true }]]
);
module.exports = { CV, Application, InternshipBatch, WorkSession, Report, NotificationReceipt };
