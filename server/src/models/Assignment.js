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

AssignmentSchema.add({
  batchId: {type:mongoose.Schema.Types.ObjectId,ref:'InternshipBatch'},
  companyWallet: String, studentWallet: String, mentorWallet: String,
  startDate: Date, endDate: Date,
  lifecycle: {type:String,enum:['proposed','approved','active','completed','cancelled']},
  history: {type:[require('../core/shared').HistorySchema],default:undefined},
  kpiScore: {type:Number,min:0,max:100,default:null},
  kpis: {type:[new mongoose.Schema({milestoneIndex:Number,title:String,description:String,weightPercent:Number,deadline:Date,status:{type:String,enum:['pending','submitted','approved','rejected'],default:'pending'},content:{type:String,default:''},score:{type:Number,min:0,max:100,default:null},feedback:{type:String,default:''},submittedAt:Date,evaluatedAt:Date,submittedLate:{type:Boolean,default:false}})],default:undefined},
});
AssignmentSchema.index({topicId:1,studentId:1,batchId:1},{unique:true,partialFilterExpression:{batchId:{$type:'objectId'}}});
// Role-scoped lists/dashboard queries otherwise scan every internship placement.
// Non-TEST startup keeps autoIndex disabled; production rollout is a separate operation.
AssignmentSchema.index({studentWallet:1,createdAt:-1});
AssignmentSchema.index({companyWallet:1,createdAt:-1});
AssignmentSchema.index({mentorWallet:1,createdAt:-1});
require('./userOwnership')(AssignmentSchema,'Assignment');
module.exports = mongoose.model("Assignment", AssignmentSchema);
