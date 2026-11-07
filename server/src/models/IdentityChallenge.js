const mongoose = require('mongoose');
module.exports = mongoose.model('IdentityChallenge', new mongoose.Schema({
  _id: String, nonce: {type:String,required:true}, browserHash: {type:String,required:true},
  purpose: {type:String,enum:['login','link-google','link-wallet','unlink-google','password-link-wallet','password-wallet-reauth','user-unlink-wallet'],required:true},
  userId: {type:mongoose.Schema.Types.ObjectId,ref:'User'},
  wallet: String, message: String, chainId: String, authVersion: Number, expiresAt: {type:Date,required:true}, usedAt: Date,
}, {timestamps:true}));
