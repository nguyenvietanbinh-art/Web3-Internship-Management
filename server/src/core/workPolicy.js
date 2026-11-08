const Assignment = require('../models/Assignment');
const { HttpError } = require('../utils/http');
const v = require('./shared');
const policy = require('./placementPolicy');
async function scope(user, {batchId,studentUserId} = {}) {
 const filter={$and:[policy.scope(user),{...(batchId?{batchId:v.id(batchId)}:{}),...(studentUserId?{studentUserId:v.id(studentUserId)}:{})}]};
 const ids=await Assignment.find(filter).distinct('_id');return {assignmentId:{$in:ids},...(studentUserId?{$and:[{assignmentId:{$in:ids}}]}:{})};
}
async function resource(Model, user, id, active = false) {
  const doc = await Model.findOne({ _id: v.id(id), ...(await scope(user)) });
  if (!doc) throw new HttpError(404, 'Không có bản ghi trong phạm vi quyền');
  const assignment = await policy.load(user, String(doc.assignmentId), { active });
  return { doc, assignment };
}
module.exports = { scope, resource };
