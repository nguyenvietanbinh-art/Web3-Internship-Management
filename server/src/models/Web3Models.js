const mongoose=require('mongoose');
const {Schema}=mongoose;
const history={type:[require('../core/shared').HistorySchema],default:[]};
const op=new Schema({
 operationId:{type:String,required:true,unique:true},assignmentId:{type:Schema.Types.ObjectId,ref:'Assignment',required:true,index:true},targetId:{type:Schema.Types.ObjectId,required:true},kind:{type:String,enum:['report','attendance','completion','mint'],required:true},
 actorWallet:{type:String,required:true},studentWallet:{type:String,required:true},assignmentKey:{type:String,required:true},digest:{type:String,required:true},refURI:{type:String,default:''},
 chainId:{type:Number,required:true},contractAddress:{type:String,required:true},deploymentTx:{type:String,required:true},chainInstanceId:{type:String,required:true},state:{type:String,enum:['prepared','submitted','confirmed','failed'],default:'prepared'},
 txHash:String,blockHash:String,blockNumber:Number,tokenId:String,errorCode:{type:String,default:''},leaseUntil:Date,attempts:{type:Number,default:0},history,
},{timestamps:true,collection:'chain_operations'});
op.index({chainId:1,contractAddress:1,chainInstanceId:1,txHash:1},{unique:true,partialFilterExpression:{txHash:{$type:'string'}}});
const artifact=new Schema({
 reportId:{type:Schema.Types.ObjectId,ref:'Report',required:true,index:true},ownerWallet:{type:String,required:true},source:{type:String,enum:['report-json','attachment'],required:true},plaintextHash:{type:String,required:true},ciphertextHash:{type:String,required:true},mime:{type:String,required:true},bytes:{type:Number,required:true},keyId:{type:String,required:true},
 envelope:{type:Buffer,required:true,select:false},cid:String,state:{type:String,enum:['prepared','uploaded','verified','failed'],default:'prepared'},errorCode:{type:String,default:''},verifiedAt:Date,history,
},{timestamps:true,collection:'private_report_artifacts'});
artifact.index({reportId:1,source:1,plaintextHash:1},{unique:true});
const qr=new Schema({
 assignmentId:{type:Schema.Types.ObjectId,ref:'Assignment',required:true,index:true},studentWallet:{type:String,required:true},companyWallet:{type:String,required:true},action:{type:String,enum:['checkin','checkout'],required:true},nonceHash:{type:String,required:true,select:false},expiresAt:{type:Date,required:true},usedAt:{type:Date,default:null},
 centerLat:{type:Number,required:true},centerLon:{type:Number,required:true},radiusMeters:{type:Number,required:true},maxAccuracyMeters:{type:Number,required:true},history,
},{timestamps:true,collection:'core_qr_sessions'});
require('./userOwnership')(op,'ChainOperation');require('./userOwnership')(artifact,'PrivateReportArtifact');require('./userOwnership')(qr,'CoreQrSession');
module.exports={ChainOperation:mongoose.models.ChainOperation||mongoose.model('ChainOperation',op),PrivateReportArtifact:mongoose.models.PrivateReportArtifact||mongoose.model('PrivateReportArtifact',artifact),CoreQrSession:mongoose.models.CoreQrSession||mongoose.model('CoreQrSession',qr)};
