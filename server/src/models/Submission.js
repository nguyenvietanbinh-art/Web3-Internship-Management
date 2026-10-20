const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  milestoneIndex: { type: Number, min: 0, default: 0 },
  ipfsCid: { type: String, default: "" },
  fileHash: { type: String, required: true, match: /^[a-fA-F0-9]{64}$/ },
  note: { type: String, default: "" },
  version: { type: Number, min: 1, required: true },
  submittedAt: { type: Date, default: Date.now },
  txHash: { type: String, default: "", lowercase: true },
}, { timestamps: true, collection: "submissions" });

SubmissionSchema.index({ assignmentId: 1, milestoneIndex: 1, version: 1 }, { unique: true });

module.exports = mongoose.model("Submission", SubmissionSchema);
