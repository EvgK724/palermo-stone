const assert=require('node:assert/strict');
const L=require('../src/learning.js');
const now=1900000000000,day=86400000;
assert.deepEqual(L.clean(null,['a']),{});
assert.deepEqual(L.clean({a:{step:-1,reviews:4,due:0,last:0},b:{step:0,reviews:0,due:0,last:0}},['a','b']),{});
let record;
for(const [i,days] of [1,3,7,14,30,30].entries()){
 record=L.rate(record,'good',now+i*day);assert.equal(record.due,now+i*day+days*day);assert.equal(record.reviews,i+1);
}
const again=L.rate(record,'again',now);assert.equal(again.due,now+600000);assert.equal(again.step,0);assert.equal(L.nextDays(again),1);
assert.equal(L.rate(again,'good',now).due,now+day);
assert.throws(()=>L.rate(null,'bogus',now));
const cards=[{id:'a',topic:'stone'},{id:'b',topic:'craft'},{id:'c',topic:'stone'}];
const state={a:{step:1,reviews:1,due:now+1,last:now-1},b:{step:0,reviews:2,due:now,last:now-600000}};
assert.deepEqual(L.select(cards,state,'all',false,now).map(c=>c.id),['c','b']);
assert.deepEqual(L.select(cards,state,'stone',false,now).map(c=>c.id),['c']);
assert.equal(L.select(cards,state,'all',true,now).length,3);
assert.deepEqual(L.clean({...state,unknown:state.a},['a','b']),state);
console.log('Learning: due boundaries, 6 intervals, relearning, topic filters, state validation passed.');
