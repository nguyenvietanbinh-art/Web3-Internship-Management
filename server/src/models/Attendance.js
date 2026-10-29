const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    studentWallet: { type: String, required: true, lowercase: true, trim: true, index: true },
    studentName: { type: String, default: "Sinh viên" },
    companyWallet: { type: String, required: true, lowercase: true, trim: true, index: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    checkInTime: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["on_time", "late", "excused"],
      default: "on_time",
    },
    qrCodeHash: { type: String, default: "" },
    locationIp: { type: String, default: "127.0.0.1" },
    note: { type: String, default: "Check-in điểm danh qua mã QR Web3" },
  },
  { timestamps: true, collection: "attendances" }
);

AttendanceSchema.index({ studentWallet: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
