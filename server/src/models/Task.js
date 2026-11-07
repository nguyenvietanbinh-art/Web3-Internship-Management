const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    assignedStudentWallet: { type: String, required: true, lowercase: true, trim: true },
    companyWallet: { type: String, required: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    dueDate: { type: Date, default: () => new Date(Date.now() + 7 * 86400000) },
    completedAt: { type: Date },
  },
  { timestamps: true, collection: 'internship_tasks' }
);

TaskSchema.add({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  history: { type: [require('../core/shared').HistorySchema], default: undefined },
});
TaskSchema.add({
  submission: {
    content: String,
    link: String,
    submittedAt: Date,
    late: Boolean,
    fileName: String,
    mime: String,
    size: Number,
  },
  submissionFileData: { type: Buffer, select: false },
  review: {
    decision: { type: String, enum: ['approved', 'need_revision'] },
    comment: String,
    reviewedAt: Date,
    reviewerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
});
require('./userOwnership')(TaskSchema, 'Task');
const Mixed=mongoose.Schema.Types.Mixed;
TaskSchema.add({
  objective:String,workItems:[String],requiredProducts:[String],startDate:Date,
  creationRequestHash:String,
  progressWeight:{type:Number,min:1,max:1000},criteriaVersion:Number,
  acceptanceCriteria:[{id:String,title:String,description:String,weight:Number,requiredProduct:String}],
  criteriaApprovedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},criteriaApprovedAt:Date,
  confirmedProgress:{type:Number,min:0,max:100},criterionReviews:[Mixed],
  submissionVersion:Number,draft:Mixed,evidenceAnalysis:Mixed,
  submissionVersions:[{version:Number,submission:Mixed,sha256:String,fileData:{type:Buffer,select:false},criteriaVersion:Number,reviews:[Mixed],analysis:Mixed}],
});
TaskSchema.add({'submission.result':String,'submission.challenges':String,'submission.solution':String});
module.exports = mongoose.model('Task', TaskSchema);
