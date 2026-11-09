export function defaultAssignment(items,now=Date.now()){
 if(items.length===1)return items[0];
 const active=items.filter(a=>a.lifecycle==='active'&&Date.parse(a.startDate)<=now&&Date.parse(a.endDate)>=now);
 return active.length===1?active[0]:null;
}
