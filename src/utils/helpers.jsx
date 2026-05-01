// ─── HELPERS ────────────────────────────────────────────
export const calcPar=(h,s,e)=>h.slice(s,e).reduce((a,x)=>a+x.par,0);
export const fmtRange=(h,s,e)=>{const mn=h.slice(s,e).reduce((a,x)=>a+x.range[0],0);const mx=h.slice(s,e).reduce((a,x)=>a+x.range[1],0);return`${mn}-${mx}`;};
export const fmtR=r=>`${r[0]}-${r[1]}`;
// Best-40% diff handicap. Returns null if fewer than 3 rounds (a single round
// would otherwise produce a "handicap" equal to that round's diff, which is
// misleading for new players).
export const HANDICAP_MIN_ROUNDS = 3;
export function calcHandicap(rnds){
  if(!rnds || rnds.length < HANDICAP_MIN_ROUNDS) return null;
  const diffs = rnds.map(r=>r.total-r.par).sort((a,b)=>a-b);
  const n = Math.max(1, Math.floor(diffs.length*0.4));
  return Math.round((diffs.slice(0,n).reduce((s,d)=>s+d,0)/n)*10)/10;
}
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
// Treats holeCount/holesPlayed interchangeably so legacy rounds saved before
// the 9-hole feature still match.
export const roundHoleCount = r => r.holeCount || r.holesPlayed || 18;
export function isRoundSealed(round, leagueMatches, me) {
  if (!round.sealedMatchId) return false;
  const match = (leagueMatches||[]).find(m => m.id === round.sealedMatchId);
  if (!match) return false;
  if (match.status !== "complete") return true;
  return !(match.resultsSeenBy || []).includes(me);
}

// Returns a Set<"player|course"> of (player, course) fingerprints for all
// known championship matches. Used to retroactively identify championship
// rounds that were saved before matchType was tracked or before the live
// round join-flow propagated activeLeagueMatch (PR #2). New rounds get
// matchType set at save time and don't need this fallback.
export function championshipFingerprints(leagueMatches) {
  const out = new Set();
  // Hardcoded S1 final at Nebraska (S1 isn't in the leagueMatches collection).
  out.add("Jeff Gurrister|Nebraska");
  out.add("Jimmie Perkins|Nebraska");
  // Season 2+ finals from leagueMatches. roundType "F" + a course is enough.
  (leagueMatches||[]).forEach(m => {
    if (m.roundType !== "F" || !m.course) return;
    if (m.player1) out.add(`${m.player1}|${m.course}`);
    if (m.player2) out.add(`${m.player2}|${m.course}`);
  });
  return out;
}
export function effectiveMatchType(round, fingerprints) {
  if (round?.matchType) return round.matchType;
  if (round?.hidden && round?.course && round?.player) {
    const fp = fingerprints || championshipFingerprints();
    if (fp.has(`${round.player}|${round.course}`)) return "championship";
  }
  return null;
}
export function isLeagueRound(round, fingerprints) {
  const mt = effectiveMatchType(round, fingerprints);
  return mt === "league" || mt === "playoff" || mt === "championship";
}

// Whether a round's score should still be hidden in list views. Manually-hidden
// rounds stay hidden forever; auto-hidden league rounds reveal once the match
// is no longer pending. Dynamic matches use sealedMatchId; the S1 final has no
// sealedMatchId so we check that both finalists have submitted via the
// fingerprint set.
export function isRoundHiddenForDisplay(round, leagueMatches, rounds, me, fingerprints) {
  if (!round?.hidden) return false;
  const fp = fingerprints || championshipFingerprints(leagueMatches);
  const auto = round.autoHidden || isLeagueRound(round, fp);
  if (!auto) return true;
  if (round.sealedMatchId) return isRoundSealed(round, leagueMatches, me);
  if (effectiveMatchType(round, fp) === "championship") {
    // Find the matching championship and require both finalists have a
    // championship-tagged round at that course.
    const fps = [...fp].filter(s => s.endsWith(`|${round.course}`));
    const finalists = fps.map(s => s.split("|")[0]);
    if (finalists.length < 2) return true;
    const hasBoth = finalists.every(name =>
      (rounds || []).some(r => r.player === name && effectiveMatchType(r, fp) === "championship")
    );
    return !hasBoth;
  }
  return false;
}

// ─── COURSE RECORDS ─────────────────────────────────────
export function computeCourseRecords(rounds, leagueMatches, me) {
  const records = {};
  rounds
    .filter(r => roundHoleCount(r) === 18 && !isRoundSealed(r, leagueMatches, me))
    .forEach(r => {
      const key = r.course;
      if (!records[key] || r.total < records[key].total ||
          (r.total === records[key].total && r.createdAt < records[key].createdAt)) {
        records[key] = { total: r.total, player: r.player, date: r.date, par: r.par, createdAt: r.createdAt };
      }
    });
  return records;
}

// ─── PER-COURSE STATS ────────────────────────────────────
// Aggregate stats for a course across all unsealed rounds at that course.
export function computeCourseStats(courseName, rounds, leagueMatches, me) {
  const pr = (rounds || []).filter(r =>
    r.course === courseName && roundHoleCount(r) === 18 && !isRoundSealed(r, leagueMatches, me) && r.scores
  );
  if (!pr.length) return null;
  const totals = pr.map(r => r.total).filter(v => v != null);
  const avg = totals.length ? Math.round(totals.reduce((s,v)=>s+v,0) / totals.length * 10) / 10 : null;
  // Hole-level: sum scores per hole index across rounds, plus count
  const holeSums = Array(18).fill(0), holeCounts = Array(18).fill(0);
  const holeBirdies = Array(18).fill(0), holeBogeyPlus = Array(18).fill(0);
  pr.forEach(r => {
    (r.scores || []).forEach((s, i) => {
      if (s == null || i >= 18) return;
      holeSums[i] += s; holeCounts[i] += 1;
      const par = r.courseHoles?.[i]?.par;
      if (par != null) {
        if (s < par) holeBirdies[i] += 1;
        else if (s > par) holeBogeyPlus[i] += 1;
      }
    });
  });
  const holeAvgs = holeSums.map((sum, i) => holeCounts[i] ? Math.round(sum / holeCounts[i] * 10) / 10 : null);
  // Find course par per hole from the most recent round's courseHoles, if any
  const refHoles = pr.find(r => r.courseHoles)?.courseHoles || null;
  const overUnderPerHole = refHoles ? holeAvgs.map((a, i) => a == null ? null : a - refHoles[i].par) : null;
  let hardestIdx = null, easiestIdx = null;
  if (overUnderPerHole) {
    let hMax = -Infinity, eMin = Infinity;
    overUnderPerHole.forEach((d, i) => {
      if (d == null) return;
      if (d > hMax) { hMax = d; hardestIdx = i; }
      if (d < eMin) { eMin = d; easiestIdx = i; }
    });
  }
  return { rounds: pr.length, avg, holeAvgs, overUnderPerHole, hardestIdx, easiestIdx, holeBirdies, holeBogeyPlus, refHoles };
}

// ─── ACHIEVEMENTS ───────────────────────────────────────
export function computeAchievements(playerName, rounds, leagueMatches, allCourses, me) {
  const myRounds18 = rounds.filter(r => r.player === playerName && roundHoleCount(r) === 18 && !isRoundSealed(r, leagueMatches, me));
  const myRoundsAll = rounds.filter(r => r.player === playerName && !isRoundSealed(r, leagueMatches, me));
  const result = {};

  // Milestones
  result.roundsPlayed = myRounds18.length;
  result.roundsMilestone = [100,50,25,10].find(n => myRounds18.length >= n) || 0;
  const uniqueCourses = [...new Set(myRounds18.map(r => r.course))];
  result.coursesPlayed = uniqueCourses.length;
  result.coursesMilestone = [15,10,5].find(n => uniqueCourses.length >= n) || 0;
  const totalHIO = myRounds18.reduce((s, r) => s + (r.holeInOnes || 0), 0);
  result.totalHIO = totalHIO;
  result.hioMilestone = [25,10,5,1].find(n => totalHIO >= n) || 0;

  // Under par streak
  const sorted = [...myRounds18].sort((a, b) => a.createdAt - b.createdAt);
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
  result.bestToPar = myRounds18.length ? Math.min(...myRounds18.map(r => r.total - r.par)) : null;
  // Birdies = strictly one under par. Eagles/albatrosses are counted separately.
  let mostBirdies = 0, mostEaglesPlus = 0;
  myRounds18.forEach(r => {
    const holes = r.courseHoles || (allCourses.find(c => c.name === r.course)?.holes);
    if (!holes || !r.scores) return;
    let birdies = 0, eaglesPlus = 0;
    r.scores.forEach((s, i) => {
      if (s == null || !holes[i]) return;
      const d = s - holes[i].par;
      if (d === -1) birdies += 1;
      else if (d <= -2) eaglesPlus += 1;
    });
    mostBirdies = Math.max(mostBirdies, birdies);
    mostEaglesPlus = Math.max(mostEaglesPlus, eaglesPlus);
  });
  result.mostBirdies = mostBirdies;
  result.mostEaglesPlus = mostEaglesPlus;
  let biggestWin = 0;
  (leagueMatches||[]).filter(m => m.status === "complete" && m.winner === playerName).forEach(m => {
    biggestWin = Math.max(biggestWin, m.margin || 0);
  });
  result.biggestWin = biggestWin;

  // Course bests
  const courseBests = {};
  myRounds18.forEach(r => {
    if (!courseBests[r.course] || r.total < courseBests[r.course].total) {
      courseBests[r.course] = { total: r.total, date: r.date, par: r.par };
    }
  });
  result.courseBests = courseBests;

  // Recent rounds — include 9H so the player profile shows everything they've played.
  result.recentRounds = [...myRoundsAll].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return result;
}
