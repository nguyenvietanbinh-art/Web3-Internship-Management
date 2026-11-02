const {test}=require('node:test'),assert=require('node:assert/strict');const {validatePosition,distance}=require('../src/services/qrGps');
const session={centerLat:10.8,centerLon:106.7,radiusMeters:100,maxAccuracyMeters:30};
const position=()=>({latitude:10.8,longitude:106.7,accuracy:10,timestamp:Date.now()});
test('GPS distance/accuracy policy is explicit client claim, no absolute anti-spoof badge',()=>{assert.equal(distance(10.8,106.7,10.8,106.7),0);const p=validatePosition(position(),session);assert.equal(p.distanceMeters,0);assert.equal(p.clientClaim,true);assert.equal(p.spoofResistant,false);});
test('GPS rejects outside, stale, future, low accuracy, NaN and extra caller-controlled fields',()=>{for(const p of [{...position(),latitude:11},{...position(),timestamp:Date.now()-31000},{...position(),timestamp:Date.now()+6000},{...position(),accuracy:31},{...position(),latitude:NaN},{...position(),verified:true}])assert.throws(()=>validatePosition(p,session));});
