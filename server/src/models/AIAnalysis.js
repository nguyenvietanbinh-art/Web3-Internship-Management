const mongoose = require("mongoose");

const AIAnalysisSchema = new mongoose.Schema({
  submissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Submission", required: true, unique: true },
  model: { type: String, required: true },
  summary: { type: String, default: "" },
  keywords: { type: [String], default: [] },
  scores: {
    relevance: { type: Number, min: 0, max: 100, default: 0 },
    quality: { type: Number, min: 0, max: 100, default: 0 },
  },
}, { timestamps: true, collection: "ai_analyses" });

module.exports = mongoose.model("AIAnalysis", AIAnalysisSchema);
