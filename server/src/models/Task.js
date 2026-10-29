const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    assignedStudentWallet: { type: String, required: true, lowercase: true, trim: true },
    companyWallet: { type: String, required: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    dueDate: { type: Date, default: () => new Date(Date.now() + 7 * 86400000) },
    completedAt: { type: Date },
  },
  { timestamps: true, collection: "internship_tasks" }
);

module.exports = mongoose.model("Task", TaskSchema);
