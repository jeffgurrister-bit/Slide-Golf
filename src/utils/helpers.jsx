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

// ─── COURSE RECORDS ─────────────────────────────────────
export function computeCourseRecords(rounds, leagueMatches, me) {
  const records = {};
  rounds
    .filter(r => r.holesPlayed === 18 && !isRoundSealed(r, leagueMatches, me))
    .forEach(r => {
      const key = r.course;
      if (!records[key] || r.total < records[key].total ||
          (r.total === records[key].total && r.createdAt < records[key].createdAt)) {
        records[key] = { total: r.total, player: r.player, date: r.date, par: r.par, createdAt: r.createdAt };
      }
    });
  return records;
}

// ─── ACHIEVEMENTS ───────────────────────────────────────
export function computeAchievements(playerName, rounds, leagueMatches, allCourses, me) {
  const myRounds = rounds.filter(r => r.player === playerName && r.holesPlayed === 18 && !isRoundSealed(r, leagueMatches, me));
  const result = {};

  // Milestones
  result.roundsPlayed = myRounds.length;
  result.roundsMilestone = [100,50,25,10].find(n => myRounds.length >= n) || 0;
  const uniqueCourses = [...new Set(myRounds.map(r => r.course))];
  result.coursesPlayed = uniqueCourses.length;
  result.coursesMilestone = [15,10,5].find(n => uniqueCourses.length >= n) || 0;
  const totalHIO = myRounds.reduce((s, r) => s + (r.holeInOnes || 0), 0);
  result.totalHIO = totalHIO;
  result.hioMilestone = [25,10,5,1].find(n => totalHIO >= n) || 0;

  // Under par streak
  const sorted = [...myRounds].sort((a, b) => a.createdAt - b.createdAt);
  let curStreak = 0, bestStreak = 0;
  sorted.forEach(r => {
    if (r.total < r.par) { curStreak++; bestStreak = Math.max(bestStreak, curStreak); }
    else curStreak = 0;
  });
  result.underParStreak = { current: curStreak, best: bestStreak };

  // League win streak
  const myMatches = (leagueMatches||[])
    .filter(m => m.status === "complete" && m.roundType === "regular" && (m.player1 === playerName || m.player2 === playerName))
    .sort((a, b) => a.createdAt - b.createdAt);
  let lCur = 0, lBest = 0;
  myMatches.forEach(m => {
    if (m.winner === playerName) { lCur++; lBest = Math.max(lBest, lCur); }
    else lCur = 0;
  });
  result.leagueWinStreak = { current: lCur, best: lBest };

  // Personal records
  result.bestToPar = myRounds.length ? Math.min(...myRounds.map(r => r.total - r.par)) : null;
  let mostBirdies = 0;
  myRounds.forEach(r => {
    const holes = r.courseHoles || (allCourses.find(c => c.name === r.course)?.holes);
    if (!holes || !r.scores) return;
    const birdies = r.scores.filter((s, i) => s != null && holes[i] && s < holes[i].par).length;
    mostBirdies = Math.max(mostBirdies, birdies);
  });
  result.mostBirdies = mostBirdies;
  let biggestWin = 0;
  (leagueMatches||[]).filter(m => m.status === "complete" && m.winner === playerName).forEach(m => {
    biggestWin = Math.max(biggestWin, m.margin || 0);
  });
  result.biggestWin = biggestWin;

  // Course bests
  const courseBests = {};
  myRounds.forEach(r => {
    if (!courseBests[r.course] || r.total < courseBests[r.course].total) {
      courseBests[r.course] = { total: r.total, date: r.date, par: r.par };
    }
  });
  result.courseBests = courseBests;

  // Recent rounds
  result.recentRounds = [...myRounds].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return result;
}
