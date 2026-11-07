const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  industry: { type: String, default: "", trim: true },
  website: { type: String, default: "", trim: true },
  locations: {type:[mongoose.Schema.Types.Mixed],default:undefined},
}, { timestamps: true, collection: "companies" });

module.exports = mongoose.model("Company", CompanySchema);
