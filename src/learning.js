/* Stable identifiers and real user ratings only. No synthetic study history. */
(function(root){
 'use strict';
 const intervals=[1,3,7,14,30],DAY=86400000;
 function clean(raw,ids){
  const result={}; if(!raw||typeof raw!=='object'||Array.isArray(raw))return result;
  for(const id of ids){const v=raw[id];if(v&&Number.isInteger(v.step)&&v.step>=0&&v.step<=5&&Number.isInteger(v.reviews)&&v.reviews>0&&Number.isFinite(v.due)&&v.due>=0&&Number.isFinite(v.last)&&v.last>=0)result[id]={step:v.step,reviews:v.reviews,due:v.due,last:v.last};}
  return result;
 }
 function nextDays(previous){return intervals[Math.min(previous?.step||0,intervals.length-1)];}
 function rate(previous,grade,now=Date.now()){
  if(!['again','good'].includes(grade))throw new Error('Unknown rating');
  if(!Number.isFinite(now)||now<0)throw new Error('Invalid time');
  return {step:grade==='again'?0:Math.min((previous?.step||0)+1,5),reviews:(previous?.reviews||0)+1,last:now,due:now+(grade==='again'?600000:nextDays(previous)*DAY)};
 }
 function select(cards,state,topic='all',all=false,now=Date.now()){
  return cards.filter(c=>(topic==='all'||c.topic===topic)&&(all||!state[c.id]||state[c.id].due<=now)).sort((a,b)=>(state[a.id]?.due||0)-(state[b.id]?.due||0));
 }
 const api={clean,rate,select,nextDays};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PalermoLearning=api;
})(typeof window!=='undefined'?window:globalThis);
