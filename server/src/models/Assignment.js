const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  status: { type: String, enum: ["assigned", "submitted", "evaluated"], default: "assigned" },
  assignedAt: { type: Date, default: Date.now },
  kpiAtAssign: { type: Number, min: 0, max: 100, required: true },
  onchainId: { type: Number, default: null },
  txHash: { type: String, default: "", lowercase: true },
}, { timestamps: true, collection: "assignments" });

AssignmentSchema.index({ studentId: 1, status: 1 });
AssignmentSchema.index({ topicId: 1 });

module.exports = mongoose.model("Assignment", AssignmentSchema);
