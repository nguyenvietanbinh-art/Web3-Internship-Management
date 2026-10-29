const mongoose = require("mongoose");

const JDSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    companyWallet: { type: String, required: true, lowercase: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    department: { type: String, default: "Công nghệ thông tin / Blockchain" },
    description: { type: String, required: true },
    requirements: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    slots: { type: Number, default: 2 },
    location: { type: String, default: "Hà Nội / TP.HCM / Remote" },
    salary: { type: String, default: "Hỗ trợ 5,000,000 - 10,000,000 VNĐ/tháng" },
    deadline: { type: Date, default: () => new Date(Date.now() + 30 * 86400000) },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true, collection: "job_descriptions" }
);

module.exports = mongoose.model("JD", JDSchema);
