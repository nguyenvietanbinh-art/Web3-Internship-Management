const mongoose = require("mongoose");

const KPISchema = new mongoose.Schema({
  milestoneIndex: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  weightPercent: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },
  status: {
    type: String,
    enum: ["pending", "submitted", "approved", "rejected"],
    default: "pending",
  },
  submissionIpfsHash: {
    type: String,
    default: "",
  },
  submissionContent: {
    type: String,
    default: "",
  },
  score: {
    type: Number,
    default: 0,
  },
  mentorFeedback: {
    type: String,
    default: "",
  },
  aiAnalysis: {
    relevanceScore: Number,
    suggestedScore: Number,
    feedbackSummary: String,
    foundKeywords: [String],
    missingKeywords: [String],
  },
  submittedAt: Date,
  evaluatedAt: Date,
});

const TopicSchema = new mongoose.Schema(
  {
    onChainId: {
      type: Number,
      index: true,
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", index: true },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    expectedKeywords: {
      type: [String],
      default: [],
    },
    companyWallet: {
      type: String,
      required: true,
      lowercase: true,
    },
    companyName: {
      type: String,
      default: "",
    },
    mentorWallet: {
      type: String,
      lowercase: true,
      default: null,
    },
    assignedStudentWallet: {
      type: String,
      lowercase: true,
      default: null,
    },
    assignedStudentName: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["open", "assigned", "in_progress", "completed", "closed", "terminated"],
      default: "open",
    },
    startDate: Date,
    endDate: Date,
    deadline: Date,
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "intermediate" },
    maxSlots: { type: Number, min: 1, default: 1 },
    assignedCount: { type: Number, min: 0, default: 0 },
    ipfsDetailsHash: {
      type: String,
      default: "",
    },
    kpis: [KPISchema],
    finalScore: {
      type: Number,
      default: 0,
    },
    certificateIpfsHash: {
      type: String,
      default: "",
    },
    txHash: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

TopicSchema.index({ companyId: 1, status: 1 });

require('./userOwnership')(TopicSchema,'Topic');
module.exports = mongoose.model("Topic", TopicSchema);
