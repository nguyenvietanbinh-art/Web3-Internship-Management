const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  studentCode: { type: String, trim: true, unique: true, sparse: true },
  fullName: { type: String, required: true, trim: true },
  university: { type: String, default: "", trim: true },
  major: { type: String, default: "", trim: true },
  skills: { type: [String], default: [] },
  gpa: { type: Number, min: 0, max: 4, default: null },
  cvCid: { type: String, default: "" },
  kpiScore: { type: Number, min: 0, max: 100, default: 0 },
}, { timestamps: true, collection: "students" });

module.exports = mongoose.model("Student", StudentSchema);
