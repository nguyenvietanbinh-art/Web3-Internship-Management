const mongoose = require("mongoose");

const CriterionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  weight: { type: Number, required: true, min: 0, max: 100 },
  score: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });

const KPIEvaluationSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
  milestoneIndex: { type: Number, min: 0, default: 0 },
  criteria: { type: [CriterionSchema], validate: { validator: (items) => items.length > 0, message: "At least one KPI criterion is required" } },
  totalScore: { type: Number, min: 0, max: 100, default: 0 },
  comment: { type: String, default: "" },
  evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  evaluatedAt: { type: Date, default: Date.now },
  txHash: { type: String, default: "", lowercase: true },
}, { timestamps: true, collection: "kpi_evaluations" });

KPIEvaluationSchema.pre("validate", function validateWeights(next) {
  if (!this.criteria?.length) return next(new Error("At least one KPI criterion is required"));
  const weightSum = this.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  if (weightSum !== 100) return next(new Error("Tổng trọng số tiêu chí KPI phải bằng 100%"));
  this.totalScore = Math.round(this.criteria.reduce((sum, criterion) => sum + criterion.score * criterion.weight / 100, 0));
  next();
});

KPIEvaluationSchema.index({ assignmentId: 1, milestoneIndex: 1 }, { unique: true });

module.exports = mongoose.model("KPIEvaluation", KPIEvaluationSchema);
