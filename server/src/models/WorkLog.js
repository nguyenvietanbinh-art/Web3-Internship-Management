const mongoose = require("mongoose");

const WorkLogSchema = new mongoose.Schema(
  {
    studentWallet: { type: String, required: true, lowercase: true, trim: true, index: true },
    studentName: { type: String, default: "Sinh viên" },
    companyWallet: { type: String, required: true, lowercase: true, trim: true, index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
    weekNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    tasksDone: { type: String, default: '', required: function () { return this.status !== 'pending_submission'; } },
    requirement: { type: String, default: '' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    dueDate: Date,
    submittedAt: Date,
    submittedLate: { type: Boolean, default: false },
    resultLink: { type: String, default: '' },
    challenges: { type: String, default: "" },
    nextPlan: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending_submission", "submitted", "approved", "need_revision"],
      default: "submitted",
    },
    mentorFeedback: { type: String, default: "" },
    reviewedAt: { type: Date },
  },
  { timestamps: true, collection: "work_logs" }
);

WorkLogSchema.add({assignmentId:{type:mongoose.Schema.Types.ObjectId,ref:'Assignment'},history:{type:[require('../core/shared').HistorySchema],default:undefined}});
WorkLogSchema.index({assignmentId:1,weekNumber:1},{unique:true,partialFilterExpression:{assignmentId:{$type:'objectId'}}});
require('./userOwnership')(WorkLogSchema,'WorkLog');
module.exports = mongoose.model("WorkLog", WorkLogSchema);
