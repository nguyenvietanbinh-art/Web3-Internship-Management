const mongoose = require("mongoose");

const WorkLogSchema = new mongoose.Schema(
  {
    studentWallet: { type: String, required: true, lowercase: true, trim: true, index: true },
    studentName: { type: String, default: "Sinh viên" },
    companyWallet: { type: String, required: true, lowercase: true, trim: true, index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
    weekNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    tasksDone: { type: String, required: true },
    challenges: { type: String, default: "" },
    nextPlan: { type: String, default: "" },
    status: {
      type: String,
      enum: ["submitted", "approved", "need_revision"],
      default: "submitted",
    },
    mentorFeedback: { type: String, default: "" },
    reviewedAt: { type: Date },
  },
  { timestamps: true, collection: "work_logs" }
);

module.exports = mongoose.model("WorkLog", WorkLogSchema);
