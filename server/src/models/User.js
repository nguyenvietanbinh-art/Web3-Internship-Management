const mongoose = require("mongoose");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: function () { return !this.googleSubject && !this.passwordHash; },
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["company", "student", "mentor", "admin"],
      default: "student",
    },
    nonce: {
      type: String,
      default: () => crypto.randomBytes(16).toString("hex"),
      select: false,
    },
    email: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      default: "",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

UserSchema.add({
  recruitmentLeaseToken: {type:String,select:false},
  recruitmentLeaseUntil: {type:Date,select:false},
  walletVerified:{type:Boolean,default:false},walletVerifiedAt:Date,
  loginEmail: {type:String,select:false},
  passwordHash: {type:String,select:false},
  passwordEmailVerifiedAt: Date,
  passwordReset: {type: new mongoose.Schema({digest:String,expiresAt:Date,requestedAt:Date,requestedBy:mongoose.Schema.Types.ObjectId,authVersion:Number,deliveryState:String},{_id:false}),select:false},
  authVersion: {type:Number,default:0},
  walletLinkVersion: {type:Number,default:0},
  googleSubject: {type:String,select:false},
  googleEmail: {type:String,select:false},
  identityHistory: {type:[new mongoose.Schema({action:String,at:Date},{_id:false})],select:false,default:undefined},
  disabled: { type: Boolean, default: false },
  auditHistory: { type: [require('../core/shared').HistorySchema], default: undefined, select: false },
});
// Legacy databases retain their existing index until an explicitly reviewed migration.
// A Google-enabled runtime needs the new indexes provisioned and verified before login.
UserSchema.index({walletAddress:1}, process.env.GOOGLE_AUTH_ENABLED==='true'||process.env.EMAIL_AUTH_ENABLED==='true'
  ? {unique:true,partialFilterExpression:{walletAddress:{$type:'string'}}}
  : {unique:true});
if(process.env.GOOGLE_AUTH_ENABLED==='true'){
  UserSchema.index({googleSubject:1},{unique:true,partialFilterExpression:{googleSubject:{$type:'string'}}});
  UserSchema.index({googleEmail:1},{unique:true,partialFilterExpression:{googleEmail:{$type:'string'}}});
}
if(process.env.EMAIL_AUTH_ENABLED==='true')UserSchema.index({loginEmail:1},{unique:true,partialFilterExpression:{loginEmail:{$type:'string'}}});
module.exports = mongoose.model("User", UserSchema);
