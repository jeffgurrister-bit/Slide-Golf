// ─── HELPERS ────────────────────────────────────────────
export const calcPar=(h,s,e)=>h.slice(s,e).reduce((a,x)=>a+x.par,0);
export const fmtRange=(h,s,e)=>{const mn=h.slice(s,e).reduce((a,x)=>a+x.range[0],0);const mx=h.slice(s,e).reduce((a,x)=>a+x.range[1],0);return`${mn}-${mx}`;};
export const fmtR=r=>`${r[0]}-${r[1]}`;
export function calcHandicap(rnds,filterFn){const filtered=filterFn?rnds.filter(filterFn):rnds;if(!filtered.length)return null;const diffs=filtered.map(r=>r.total-r.par).sort((a,b)=>a-b);const n=Math.max(1,Math.floor(diffs.length*0.4));return Math.round((diffs.slice(0,n).reduce((s,d)=>s+d,0)/n)*10)/10;}
export function countHIO(scores){return(scores||[]).filter(v=>v===1).length;}
export function scoreName(s,p,isHoleOut=false){
  if(s===1&&isHoleOut)return{l:"HOLE IN ONE!!!",c:"#ff6b00",e:"🎯🔥🎉"};
  const d=s-p;
  if(d<=-3)return{l:"Albatross!",c:"#d4b84a",e:"🦅🦅"};
  if(d===-2)return{l:isHoleOut?"Eagle! (Hole Out)":"Eagle!",c:"#d4b84a",e:"🦅"};
  if(d===-1)return{l:isHoleOut?"Birdie! (Hole Out)":"Birdie!",c:"#22c55e",e:"🐦"};
  if(d===0)return{l:isHoleOut?"Par (Hole Out)":"Par",c:"#aaa",e:"👍"};
  if(d===1)return{l:"Bogey",c:"#ef4444",e:""};
  if(d===2)return{l:"Dbl Bogey",c:"#dc2626",e:""};
  return{l:`+${d}`,c:"#b91c1c",e:""};
}
export function RelPar({s,p}){if(s==null)return null;const d=s-p;return<span style={{color:d<0?"#22c55e":d>0?"#ef4444":"#aaa",fontWeight:700,fontSize:12}}>{d===0?"E":d>0?`+${d}`:d}</span>;}
export function genLiveCode(){const ch="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let c="";for(let i=0;i<4;i++)c+=ch[Math.floor(Math.random()*ch.length)];return c;}
export function calcNeed(hs,hole){
  if(!hs||hs.onGreen||hs.done)return null;
  const isOver=hs.total>hole.range[1];
  if(isOver){const lo=hs.total-hole.range[1];const hi=hs.total-hole.range[0];return{lo,hi,dir:"sub"};}
  else{const lo=hole.range[0]-hs.total;const hi=hole.range[1]-hs.total;return{lo,hi,dir:"add"};}
}
export function isRoundSealed(round, leagueMatches, me) {
  if (!round.sealedMatchId) return false;
  const match = (leagueMatches||[]).find(m => m.id === round.sealedMatchId);
  if (!match) return false;
  if (match.status !== "complete") return true;
  return !(match.resultsSeenBy || []).includes(me);
}
