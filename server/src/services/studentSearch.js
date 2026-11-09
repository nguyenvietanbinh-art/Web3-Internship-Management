const User=require('../models/User'),Student=require('../models/Student');
// Returns identifiers only. Callers must AND these with their existing RBAC scope.
async function matchingIds(search){
  const coded=await Student.find({studentCode:search}).distinct('userId');
  return User.find({role:'student',$or:[{name:search},{email:search},{_id:{$in:coded}}]}).distinct('_id');
}
module.exports={matchingIds};
