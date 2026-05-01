import { useState, useEffect, useRef } from "react";
import { db } from "./firebase.js";
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, updateDoc, where, getDocs, getDoc, arrayUnion, arrayRemove
} from "firebase/firestore";

// ─── DATA IMPORTS ───────────────────────────────────────
import { COURSES } from "./data/courses.js";
import { PGA_2026, getPGACourse } from "./data/pga2026.js";

// ─── UTILITY IMPORTS ────────────────────────────────────
import { calcPar, fmtRange, fmtR, calcHandicap, countHIO, RelPar, genLiveCode, isRoundSealed, computeCourseRecords, computeAchievements, isLeagueRound, isRoundHiddenForDisplay, championshipFingerprints, roundHoleCount } from "./utils/helpers.jsx";
import { generateCourse } from "./utils/generate.js";
import { C, btnS, inputS, smallInput } from "./utils/theme.js";
import { generateRRSchedule, LEAGUE_FORMATS, buildPlayoffMatches, MIN_LEAGUE_PLAYERS, MAX_LEAGUE_PLAYERS, PLAYOFF_SIZE_OPTIONS, effectivePlayoffSize } from "./data/league.js";

// ─── COMPONENT IMPORTS ──────────────────────────────────
import HomeTab from "./components/HomeTab.jsx";
import LeagueTab from "./components/LeagueTab.jsx";
import CoursesTab from "./components/CoursesTab.jsx";
import RoundDetailOverlay from "./components/RoundDetailOverlay.jsx";
import NotificationsPanel from "./components/NotificationsPanel.jsx";
import PlayTab from "./components/PlayTab.jsx";
import LeaderboardTab from "./components/LeaderboardTab.jsx";
import StatsTab from "./components/StatsTab.jsx";

// ─── MAIN APP ───────────────────────────────────────────
export default function App(){
  const[tab,setTab]=useState("home");
  const[me,setMe]=useState(()=>{try{return localStorage.getItem("sg-me")||"";}catch(e){return"";}});
  const[players,setPlayers]=useState([]);const[rounds,setRounds]=useState([]);const[customCourses,setCustomCourses]=useState([]);const[loaded,setLoaded]=useState(false);
  const[selCourse,setSelCourse]=useState(null);const[roundPlayers,setRoundPlayers]=useState([]);const[playMode,setPlayMode]=useState("setup");
  const[curPlayerIdx,setCurPlayerIdx]=useState(0);const[curHole,setCurHole]=useState(0);const[holeState,setHoleState]=useState({});
  const[allScores,setAllScores]=useState({});const[allShotLogs,setAllShotLogs]=useState({});
  const[hideScores,setHideScores]=useState(false);const[nine,setNine]=useState(0);const[newPlayerName,setNewPlayerName]=useState("");
  const[showScorecard,setShowScorecard]=useState(false);
  const[useHdcp,setUseHdcp]=useState(false);const[hdcps,setHdcps]=useState({});
  const[creating,setCreating]=useState(false);const[ccName,setCcName]=useState("");const[ccLevel,setCcLevel]=useState("Medium");
  const[ccTournament,setCcTournament]=useState("");const[ccHoles,setCcHoles]=useState(()=>Array.from({length:18},(_,i)=>({num:i+1,par:4,rangeMin:10,rangeMax:12})));const[ccNine,setCcNine]=useState(0);
  const[leagueView,setLeagueView]=useState("standings");const[leagueRdFilter,setLeagueRdFilter]=useState("all");
  const[tEntries,setTEntries]=useState([]);const[showTourney,setShowTourney]=useState(false);
  const[activeTourney,setActiveTourney]=useState(null);const[tShowAdj,setTShowAdj]=useState(false);
  const[myTHdcp,setMyTHdcp]=useState("");
  const[liveId,setLiveId]=useState(null);const[liveData,setLiveData]=useState(null);
  const[joinInput,setJoinInput]=useState("");const[showJoin,setShowJoin]=useState(false);
  const[liveScoreMode,setLiveScoreMode]=useState("keeper");
  const[savedHoleStates,setSavedHoleStates]=useState({});
  const[holeCount,setHoleCount]=useState(18);const[nineType,setNineType]=useState("front");

  // ─── LEAGUE STATE ─────────────────────────────────────
  const[leagues,setLeagues]=useState([]);
  const[leagueMatches,setLeagueMatches]=useState([]);
  const[selectedLeague,setSelectedLeague]=useState("s1");
  const[activeLeagueMatch,setActiveLeagueMatch]=useState(null);
  const[notifications,setNotifications]=useState([]);
  const[showNotifications,setShowNotifications]=useState(false);

  // ─── FEATURE STATE (Course Records, Round Detail, Player Profile, Edit Round, Share) ───
  const[newRecordInfo,setNewRecordInfo]=useState(null);
  const[detailRound,setDetailRound]=useState(null);
  const[profilePlayer,setProfilePlayer]=useState(null);
  const[editingRound,setEditingRound]=useState(false);
  const[editScores,setEditScores]=useState(null);
  const[shareMode,setShareMode]=useState(null); // null | "single" | "group"
  const[shareOverlay,setShareOverlay]=useState(false);
  const shareRef=useRef(null);
  const[lbHoleFilter,setLbHoleFilter]=useState(18);const[statsMode,setStatsMode]=useState("all");

  const allCourses=[...COURSES,...customCourses];
  const isLive=!!liveId&&!!liveData;
  const isKeeperHost=isLive&&liveScoreMode==="keeper"&&liveData?.host===me;
  const isSpectator=isLive&&liveScoreMode==="keeper"&&liveData?.host!==me;

  // ─── FIREBASE LISTENERS ────────────────────────────────
  useEffect(()=>{const u=[];
    u.push(onSnapshot(collection(db,"players"),s=>{setPlayers(s.docs.map(d=>({id:d.id,...d.data()})));}));
    u.push(onSnapshot(query(collection(db,"rounds"),orderBy("createdAt","desc")),s=>{setRounds(s.docs.map(d=>({id:d.id,...d.data()})));}));
    u.push(onSnapshot(collection(db,"customCourses"),s=>{setCustomCourses(s.docs.map(d=>({id:d.id,...d.data(),generated:true})));}));
    u.push(onSnapshot(collection(db,"pgaTourneys"),s=>{setTEntries(s.docs.map(d=>({id:d.id,...d.data()})));}));
    u.push(onSnapshot(collection(db,"leagues"),s=>{setLeagues(s.docs.map(d=>({id:d.id,...d.data()})));}));
    u.push(onSnapshot(collection(db,"leagueMatches"),s=>{setLeagueMatches(s.docs.map(d=>({id:d.id,...d.data()})));}));
    setLoaded(true);return()=>u.forEach(x=>x());
  },[]);

  // Notifications: only subscribe to mine. Re-runs when `me` changes so a
  // mid-session player switch picks up the right inbox.
  useEffect(()=>{
    if(!me){setNotifications([]);return;}
    const unsub=onSnapshot(query(collection(db,"notifications"),where("recipient","==",me),orderBy("createdAt","desc")),s=>{
      setNotifications(s.docs.map(d=>({id:d.id,...d.data()})));
    });
    return ()=>unsub();
  },[me]);

  // Deadline checker. Runs once on app load (after data loads) for any
  // league I'm the creator of that has weeklyDeadlineDays set. Browser-side
  // because we don't have Cloud Functions; runs from the creator's session
  // so it self-throttles to "whoever opens the app." Idempotent — won't
  // forfeit a match twice.
  useEffect(()=>{
    if(!loaded||!me||!leagues.length||!leagueMatches.length)return;
    let cancelled=false;
    (async()=>{
      const myCreatorLeagues=leagues.filter(l=>l.creator===me&&l.status==="active"&&l.weeklyDeadlineDays&&l.startedAt);
      for(const lg of myCreatorLeagues){
        if(cancelled)return;
        const dayMs=86_400_000;
        const deadlineWindowMs=lg.weeklyDeadlineDays*dayMs;
        const matches=leagueMatches.filter(m=>m.leagueId===lg.id&&m.roundType==="regular"&&m.status!=="complete");
        for(const m of matches){
          if(cancelled)return;
          const weekStart=lg.startedAt+(m.round-1)*7*dayMs;
          const baseDeadline=weekStart+deadlineWindowMs;
          // Per-match override (creator-granted extension) wins over the
          // weekly default.
          const deadline=m.deadlineOverride||baseDeadline;
          if(Date.now()<=deadline)continue;
          // Past deadline: auto-forfeit. If only one player submitted their
          // total, they win by walkover. If neither submitted, it's a double
          // forfeit — both lose (winner=null, doubleForfeit flag).
          const updates={status:"complete",resultsSeenBy:[],forfeit:true,margin:0};
          if(m.p1Total!=null&&m.p2Total==null){updates.winner=m.player1;}
          else if(m.p2Total!=null&&m.p1Total==null){updates.winner=m.player2;}
          else{updates.winner=null;updates.doubleForfeit=true;}
          try{
            await updateDoc(doc(db,"leagueMatches",m.id),updates);
            await Promise.all([m.player1,m.player2].filter(Boolean).map(p =>
              writeNotification(p, "match_forfeited", { matchId: m.id, leagueId: lg.id, leagueName: lg.name, winner: updates.winner, manual: false })
            ));
          }catch(e){/* best effort; another session may have raced ahead */}
        }
      }
    })();
    return ()=>{cancelled=true;};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[loaded,me,leagues.length,leagueMatches.length]);

  useEffect(()=>{
    if(!liveId){setLiveData(null);return;}
    const unsub=onSnapshot(doc(db,"liveRounds",liveId),snap=>{if(snap.exists())setLiveData({id:snap.id,...snap.data()});else{setLiveId(null);setLiveData(null);}});
    return()=>unsub();
  },[liveId]);

  useEffect(()=>{
    if(!liveData||!me)return;
    setRoundPlayers(prev=>{const all=new Set([...prev,...liveData.players]);return[...all];});
    if(isKeeperHost)return;
    setAllScores(prev=>{
      const m={...prev};
      liveData.players.forEach(p=>{
        const shouldMerge=liveScoreMode==="keeper"||p!==me;
        if(shouldMerge&&liveData.scores?.[p])m[p]=liveData.scores[p];
      });
      return m;
    });
  },[liveData,me,liveScoreMode,isKeeperHost]);

  const scoresJson=JSON.stringify(allScores);
  useEffect(()=>{if(!liveId||!me)return;const t=setTimeout(()=>syncMyScores(),600);return()=>clearTimeout(t);},[scoresJson,liveId]);

  // ─── DB HELPERS ────────────────────────────────────────
  async function addPlayerToDB(name){const n=name.trim();if(!n||players.some(p=>p.name===n))return;await addDoc(collection(db,"players"),{name:n,createdAt:Date.now()});}
  async function saveRoundToDB(rd){await addDoc(collection(db,"rounds"),{...rd,createdAt:Date.now()});}
  async function deleteRoundFromDB(id){await deleteDoc(doc(db,"rounds",id));}
  async function saveCoursetoDB(course){return(await addDoc(collection(db,"customCourses"),{name:course.name,level:course.level,holes:course.holes,tournament:course.tournament||"",createdAt:Date.now()})).id;}
  async function deleteCourseFromDB(id){await deleteDoc(doc(db,"customCourses",id));}
  // ─── NOTIFICATIONS ─────────────────────────────────────
  async function writeNotification(recipient, type, payload) {
    if (!recipient) return;
    try {
      await addDoc(collection(db, "notifications"), {
        recipient, type, payload: payload || {},
        read: false, createdAt: Date.now()
      });
    } catch (e) { /* non-critical: don't block the parent action if notify fails */ }
  }
  async function markNotificationRead(id) {
    await updateDoc(doc(db, "notifications", id), { read: true });
  }
  async function markAllNotificationsRead() {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => updateDoc(doc(db, "notifications", n.id), { read: true })));
  }
  async function deleteNotification(id) {
    await deleteDoc(doc(db, "notifications", id));
  }
  function selectMe(name){setMe(name);try{localStorage.setItem("sg-me",name);}catch(e){}}

  // ─── LIVE ROUND FUNCTIONS ──────────────────────────────
  async function goLive(){
    if(!selCourse||!me)return;
    const code=genLiveCode();
    const playersArr=[me,...roundPlayers.filter(p=>p!==me)];
    const scoresObj={};const hioObj={};
    playersArr.forEach(p=>{scoresObj[p]=allScores[p]||Array(18).fill(null);hioObj[p]=0;});
    const ref=await addDoc(collection(db,"liveRounds"),{code,host:me,courseData:{name:selCourse.name,level:selCourse.level,holes:selCourse.holes,tournament:selCourse.tournament||""},players:playersArr,status:"playing",scores:scoresObj,holeInOnes:hioObj,hideScores,useHdcp,hdcps,activeTourney:activeTourney||null,activeLeagueMatch:activeLeagueMatch||null,scoreMode:liveScoreMode,createdAt:Date.now()});
    setLiveId(ref.id);
  }
  async function joinLive(){
    const code=joinInput.trim().toUpperCase();if(!code)return;
    try{
      const q2=query(collection(db,"liveRounds"),where("code","==",code));const snap=await getDocs(q2);
      if(snap.empty){alert("No round found with code: "+code);return;}
      const d=snap.docs[0];const data=d.data();
      if(data.status==="finished"){alert("That round is already finished!");return;}
      const pls=[...data.players];if(!pls.includes(me))pls.push(me);
      const scores={...data.scores};if(!scores[me])scores[me]=Array(18).fill(null);
      const hio={...data.holeInOnes};if(hio[me]===undefined)hio[me]=0;
      // Dot-notation writes only — never overwrite the whole scores/holeInOnes
      // map (race-condition risk if another joiner is mid-write).
      const updates={};
      if(!data.players.includes(me))updates.players=arrayUnion(me);
      if(!data.scores?.[me])updates[`scores.${me}`]=Array(18).fill(null);
      if(data.holeInOnes?.[me]===undefined)updates[`holeInOnes.${me}`]=0;
      if(Object.keys(updates).length)await updateDoc(doc(db,"liveRounds",d.id),updates);
      setLiveId(d.id);setSelCourse(data.courseData);setActiveTourney(data.activeTourney||null);
      if(data.activeLeagueMatch)setActiveLeagueMatch(data.activeLeagueMatch);
      setLiveScoreMode(data.scoreMode||"self");setRoundPlayers(pls);setAllScores(scores);
      setAllShotLogs(prev=>({...prev,[me]:prev[me]||Array.from({length:18},()=>[])}));
      setHideScores(data.hideScores||false);setUseHdcp(data.useHdcp||false);setHdcps(data.hdcps||{});
      setPlayMode("setup");setTab("play");setShowJoin(false);setJoinInput("");
    }catch(e){alert("Error joining: "+e.message);}
  }
  async function leaveLive(){
    if(liveId&&liveData){
      try{
        if(liveData.host===me){
          // Host: mark finished so other clients can clean up listeners.
          await updateDoc(doc(db,"liveRounds",liveId),{status:"finished"});
        }else{
          // Joiner: remove self from players list. If we're the last one,
          // mark the room finished so it doesn't linger.
          const remaining=(liveData.players||[]).filter(p=>p!==me);
          const updates={players:arrayRemove(me)};
          if(remaining.length===0)updates.status="finished";
          await updateDoc(doc(db,"liveRounds",liveId),updates);
        }
      }catch(e){}
    }
    setLiveId(null);setLiveData(null);
  }
  async function syncMyScores(){
    if(!liveId||!me)return;
    try{
      const ref=doc(db,"liveRounds",liveId);const snap=await getDoc(ref);if(!snap.exists())return;
      if(liveScoreMode==="keeper"&&liveData?.host===me){
        const updates={};roundPlayers.forEach(p=>{updates[`scores.${p}`]=allScores[p]||Array(18).fill(null);updates[`holeInOnes.${p}`]=countHIO(allScores[p]);});
        await updateDoc(ref,updates);
      }else if(liveScoreMode==="self"){
        const sc=allScores[me]||Array(18).fill(null);
        await updateDoc(ref,{[`scores.${me}`]:sc,[`holeInOnes.${me}`]:countHIO(sc)});
      }
    }catch(e){}
  }

  // ─── PGA TOURNAMENT FUNCTIONS ──────────────────────────
  async function joinTourney(tId){if(tEntries.some(e=>e.tournamentId===tId&&e.player===me))return;const hd=parseInt(myTHdcp)||null;await addDoc(collection(db,"pgaTourneys"),{tournamentId:tId,player:me,round:0,hdcp:hd,createdAt:Date.now()});}
  async function updateMyTourneyHdcp(tId){const entry=tEntries.find(e=>e.tournamentId===tId&&e.player===me&&e.round===0);const hd=parseInt(myTHdcp)||null;if(entry)await updateDoc(doc(db,"pgaTourneys",entry.id),{hdcp:hd});}
  function playTourneyRound(pga){
    const tid=pga.start;const myRnds=tEntries.filter(e=>e.tournamentId===tid&&e.player===me&&e.round>0);const nextRd=myRnds.length+1;if(nextRd>4)return;
    if(!tEntries.some(e=>e.tournamentId===tid&&e.player===me)){const hd=parseInt(myTHdcp)||null;addDoc(collection(db,"pgaTourneys"),{tournamentId:tid,player:me,round:0,hdcp:hd,createdAt:Date.now()});}
    setActiveTourney({key:tid,round:nextRd,tournament:pga.tournament});
    const course={name:pga.name,level:pga.level,holes:pga.holes,pga:true,tournament:pga.tournament};
    setSelCourse(course);setRoundPlayers([me]);setAllScores({[me]:Array(18).fill(null)});setAllShotLogs({[me]:Array.from({length:18},()=>[])});setPlayMode("setup");setCurHole(0);setCurPlayerIdx(0);setHideScores(false);setTab("play");
  }
  function playCasualPGA(pga){setActiveTourney(null);const course={name:pga.name,level:pga.level,holes:pga.holes,pga:true,tournament:pga.tournament};setSelCourse(course);setRoundPlayers([]);setAllScores({});setAllShotLogs({});setPlayMode("setup");setTab("play");}

  // ─── LEAGUE FUNCTIONS ─────────────────────────────────
  async function createLeague(name, opts = {}) {
    const code = genLiveCode() + genLiveCode().slice(0,2);
    const ref = await addDoc(collection(db,"leagues"), {
      name, code: code.toUpperCase(), creator: me, status: "lobby",
      players: [me],
      // Schedule + match options. Defaults match the prior behavior so any
      // legacy lobby continues to work unchanged.
      holeCount: opts.holeCount === 9 ? 9 : 18,
      scheduleType: opts.scheduleType === "double" ? "double" : "single",
      courseRotation: opts.courseRotation || "free",
      coursePool: opts.coursePool || null,
      coursesByRound: null,
      // Playoff + championship options.
      playoffSizeOverride: opts.playoffSizeOverride != null ? opts.playoffSizeOverride : null,
      championshipCourse: opts.championshipCourse || null,
      // Handicap options. useHandicapScoring drives adjusted-totals winner
      // determination in saveRound. handicapSource picks where the handicap
      // value comes from: "manual" reads league.handicaps[player], "auto"
      // computes from the player's saved rounds (calcHandicap). handicapCap
      // clamps |handicap| so extreme values don't skew results.
      useHandicapScoring: !!opts.useHandicapScoring,
      handicapSource: opts.handicapSource === "auto" ? "auto" : "manual",
      handicapCap: opts.handicapCap != null ? Number(opts.handicapCap) : null,
      // Per-league display config.
      nicknames: {},
      handicaps: {},
      // Forfeit deadline. weeklyDeadlineDays = N means each week's matches
      // must be played within N days of the league's startedAt + (week-1)*7.
      // Null = no deadline. Browser-side checker runs on app load and
      // auto-forfeits past-deadline matches as a tie.
      weeklyDeadlineDays: opts.weeklyDeadlineDays != null ? Number(opts.weeklyDeadlineDays) : null,
      createdAt: Date.now()
    });
    setSelectedLeague(ref.id);
  }
  async function updateLeagueConfig(leagueId, patch) {
    await updateDoc(doc(db, "leagues", leagueId), patch);
  }

  // ─── CREATOR IN-SEASON EDITS ────────────────────────────
  // All require: caller is the league creator. UI gates on this too but we
  // double-check here since these mutate other players' state.
  function _assertCreator(leagueId) {
    const lg = leagues.find(l => l.id === leagueId);
    if (!lg) throw new Error("League not found");
    if (lg.creator !== me) throw new Error("Only the creator can edit this league");
    return lg;
  }
  async function renameLeague(leagueId, newName) {
    _assertCreator(leagueId);
    const trimmed = (newName || "").trim();
    if (!trimmed) return;
    await updateDoc(doc(db, "leagues", leagueId), { name: trimmed });
  }
  // Swap a single week's course. Updates every pending match in that week
  // and the league's coursesByRound entry. Played matches keep their course.
  async function swapWeekCourse(leagueId, weekIdx, courseName) {
    const lg = _assertCreator(leagueId);
    const next = [...(lg.coursesByRound || [])];
    next[weekIdx] = courseName || null;
    await updateDoc(doc(db, "leagues", leagueId), { coursesByRound: next });
    const round = weekIdx + 1;
    const pending = leagueMatches.filter(m => m.leagueId === leagueId && m.round === round && m.status !== "complete");
    await Promise.all(pending.map(m => updateDoc(doc(db, "leagueMatches", m.id), { course: courseName || null })));
  }
  async function setMatchCourse(matchId, courseName) {
    const match = leagueMatches.find(m => m.id === matchId);
    if (!match) return;
    _assertCreator(match.leagueId);
    if (match.status === "complete") { alert("Can't change course on a completed match — reset it first."); return; }
    await updateDoc(doc(db, "leagueMatches", matchId), { course: courseName || null });
  }
  // Reset a completed match back to pending so players can re-record. Note:
  // does not retroactively undo any playoff matches that were created from
  // the completion of regular-season play. The creator should handle that
  // separately if needed.
  async function resetMatch(matchId) {
    const match = leagueMatches.find(m => m.id === matchId);
    if (!match) return;
    _assertCreator(match.leagueId);
    await updateDoc(doc(db, "leagueMatches", matchId), {
      p1Total: null, p2Total: null, p1Par: null, p2Par: null,
      p1Scores: null, p2Scores: null,
      winner: null, margin: null, status: "pending", resultsSeenBy: []
    });
  }
  // Forfeit / declare winner without play. Sets margin to 0 since no scores.
  async function forfeitMatch(matchId, winnerName) {
    const match = leagueMatches.find(m => m.id === matchId);
    if (!match) return;
    _assertCreator(match.leagueId);
    if (winnerName !== match.player1 && winnerName !== match.player2 && winnerName !== "Tie") return;
    await updateDoc(doc(db, "leagueMatches", matchId), {
      winner: winnerName, margin: 0, status: "complete", resultsSeenBy: [], forfeit: true
    });
    const lg = leagues.find(l => l.id === match.leagueId);
    const lgName = lg?.name || "League";
    await Promise.all([match.player1, match.player2].filter(Boolean).map(p =>
      writeNotification(p, "match_forfeited", { matchId, leagueId: match.leagueId, leagueName: lgName, winner: winnerName, manual: true })
    ));
  }
  // Extend a specific match's deadline. Pass additionalDays to push the
  // existing deadline forward (or set it from now if none exists). Pass null
  // to clear any override and revert to the league's weekly schedule.
  async function extendMatchDeadline(matchId, additionalDays) {
    const match = leagueMatches.find(m => m.id === matchId);
    if (!match) return;
    const lg = _assertCreator(match.leagueId);
    if (additionalDays == null) {
      await updateDoc(doc(db, "leagueMatches", matchId), { deadlineOverride: null });
      return;
    }
    const dayMs = 86_400_000;
    const weekStart = (lg.startedAt || Date.now()) + (match.round - 1) * 7 * dayMs;
    const baseDeadline = lg.weeklyDeadlineDays
      ? weekStart + lg.weeklyDeadlineDays * dayMs
      : Date.now();
    const current = match.deadlineOverride || baseDeadline;
    const next = Math.max(Date.now(), current) + Number(additionalDays) * dayMs;
    await updateDoc(doc(db, "leagueMatches", matchId), { deadlineOverride: next });
    // Notify both finalists they got extra time.
    await Promise.all([match.player1, match.player2].filter(Boolean).map(p =>
      writeNotification(p, "deadline_extended", { matchId, leagueId: match.leagueId, leagueName: lg.name, newDeadline: next, days: Number(additionalDays) })
    ));
  }
  // Per-league handicap override map. Set value to null to clear an override.
  async function setLeagueHandicap(leagueId, playerName, value) {
    const lg = _assertCreator(leagueId);
    const next = { ...(lg.handicaps || {}) };
    if (value == null || value === "" || Number.isNaN(value)) delete next[playerName];
    else next[playerName] = Number(value);
    await updateDoc(doc(db, "leagues", leagueId), { handicaps: next });
  }

  // ─── PLAYER MANAGEMENT (regular season only) ────────────
  // Replace one player with another. Pending matches are re-pointed to the
  // new player; completed matches stay attributed to the original. Handicap
  // and nickname overrides transfer.
  async function replacePlayer(leagueId, oldName, newName) {
    const lg = _assertCreator(leagueId);
    if (lg.status !== "active") { alert("Replace only allowed during regular season."); return; }
    if (!oldName || !newName || oldName === newName) return;
    if (lg.players?.includes(newName)) { alert(`${newName} is already in this league.`); return; }
    const players = (lg.players || []).map(p => p === oldName ? newName : p);
    const handicaps = { ...(lg.handicaps || {}) };
    if (handicaps[oldName] != null) { handicaps[newName] = handicaps[oldName]; delete handicaps[oldName]; }
    const nicknames = { ...(lg.nicknames || {}) };
    if (nicknames[oldName]) { nicknames[newName] = nicknames[oldName]; delete nicknames[oldName]; }
    await updateDoc(doc(db, "leagues", leagueId), { players, handicaps, nicknames });
    const pending = leagueMatches.filter(m => m.leagueId === leagueId && m.status !== "complete" && (m.player1 === oldName || m.player2 === oldName));
    await Promise.all(pending.map(m => {
      const u = {};
      if (m.player1 === oldName) u.player1 = newName;
      if (m.player2 === oldName) u.player2 = newName;
      return updateDoc(doc(db, "leagueMatches", m.id), u);
    }));
    await writeNotification(newName, "league_invite", { leagueId, leagueName: lg.name, replaces: oldName });
  }

  // Add a new player mid-season. Their catch-up matches against existing
  // players are appended as new regular rounds at the end of the schedule.
  async function addPlayerMidSeason(leagueId, newName) {
    const lg = _assertCreator(leagueId);
    if (lg.status !== "active") { alert("Add only allowed during regular season."); return; }
    if (!newName || lg.players?.includes(newName)) { alert(`${newName} is already in this league.`); return; }
    if ((lg.players?.length || 0) >= MAX_LEAGUE_PLAYERS) { alert(`League already at max ${MAX_LEAGUE_PLAYERS} players.`); return; }
    const existing = lg.players || [];
    const players = [...existing, newName];
    // One catch-up match per existing player. Append each as a new round so
    // the schedule view groups them together.
    const startRound = (lg.totalRounds || 0) + 1;
    const writes = existing.map((opp, i) => addDoc(collection(db, "leagueMatches"), {
      leagueId, round: startRound + i, matchNum: 1, roundType: "regular",
      player1: newName, player2: opp,
      course: null, p1Total: null, p2Total: null, p1Par: null, p2Par: null,
      p1Scores: null, p2Scores: null,
      winner: null, margin: null, status: "pending", catchUp: true,
      createdAt: Date.now()
    }));
    await Promise.all(writes);
    await updateDoc(doc(db, "leagues", leagueId), {
      players, totalRounds: startRound + existing.length - 1
    });
    await writeNotification(newName, "league_invite", { leagueId, leagueName: lg.name });
    await Promise.all(existing.map(p =>
      writeNotification(p, "player_added", { leagueId, leagueName: lg.name, newPlayer: newName })
    ));
  }

  // Remove a player. Policy: "forfeit" = pending matches go to the opponent,
  // "void" = pending matches are deleted entirely.
  async function removePlayerMidSeason(leagueId, name, policy = "forfeit") {
    const lg = _assertCreator(leagueId);
    if (lg.status !== "active") { alert("Remove only allowed during regular season."); return; }
    if (!lg.players?.includes(name)) return;
    const players = (lg.players || []).filter(p => p !== name);
    const handicaps = { ...(lg.handicaps || {}) }; delete handicaps[name];
    const nicknames = { ...(lg.nicknames || {}) }; delete nicknames[name];
    const withdrawn = [...(lg.withdrawn || []), name];
    await updateDoc(doc(db, "leagues", leagueId), { players, handicaps, nicknames, withdrawn });
    const pending = leagueMatches.filter(m => m.leagueId === leagueId && m.status !== "complete" && (m.player1 === name || m.player2 === name));
    await Promise.all(pending.map(m => {
      if (policy === "void") return deleteDoc(doc(db, "leagueMatches", m.id));
      const opponent = m.player1 === name ? m.player2 : m.player1;
      return updateDoc(doc(db, "leagueMatches", m.id), {
        winner: opponent || null, margin: 0, status: "complete", forfeit: true, resultsSeenBy: []
      });
    }));
    await Promise.all(players.map(p =>
      writeNotification(p, "player_removed", { leagueId, leagueName: lg.name, removedPlayer: name, policy })
    ));
  }

  async function joinLeagueByCode(code) {
    const q2 = query(collection(db,"leagues"), where("code","==",code.toUpperCase()));
    const snap = await getDocs(q2);
    if (snap.empty) { alert("No league found with code: " + code); return; }
    const d = snap.docs[0]; const data = d.data();
    if (data.status !== "lobby") { alert("This league has already started!"); return; }
    if (data.players?.includes(me)) { setSelectedLeague(d.id); return; }
    const pls = [...(data.players || []), me];
    await updateDoc(doc(db,"leagues",d.id), { players: pls });
    setSelectedLeague(d.id);
  }

  async function startLeagueSeason(leagueId) {
    const lg = leagues.find(l => l.id === leagueId);
    if (!lg || lg.creator !== me) return;
    const n = lg.players.length;
    const fmt = LEAGUE_FORMATS[n];
    if (!fmt) { alert(`Need ${MIN_LEAGUE_PLAYERS}-${MAX_LEAGUE_PLAYERS} players to start`); return; }
    const scheduleType = lg.scheduleType || "single";
    const schedule = generateRRSchedule(lg.players, scheduleType);
    // If course-of-the-week is configured, pull the round→course map so we
    // can pre-fill match.course at write time.
    const coursesByRound = lg.courseRotation === "scheduled" ? (lg.coursesByRound || []) : null;
    if (coursesByRound) {
      const missing = schedule.findIndex((_, i) => !coursesByRound[i]);
      if (missing !== -1) { alert(`Pick a course for week ${missing + 1} before starting.`); return; }
    }
    let matchNum = 0;
    const writes = [];
    for (let rIdx = 0; rIdx < schedule.length; rIdx++) {
      const weekCourse = coursesByRound ? coursesByRound[rIdx] : null;
      for (const [p1, p2] of schedule[rIdx]) {
        matchNum++;
        writes.push(addDoc(collection(db,"leagueMatches"), {
          leagueId, round: rIdx + 1, matchNum, roundType: "regular",
          player1: p1, player2: p2,
          course: weekCourse, p1Total: null, p2Total: null, p1Par: null, p2Par: null,
          p1Scores: null, p2Scores: null,
          winner: null, margin: null, status: "pending",
          createdAt: Date.now()
        }));
      }
    }
    await Promise.all(writes);
    // Persist effectivePlayoffSize so we can short-circuit to "complete" if
    // the creator chose "no playoffs" — checkLeagueProgress reads this back.
    // Record startedAt for the deadline checker.
    await updateDoc(doc(db,"leagues",leagueId), {
      status: "active", totalRounds: schedule.length, currentRound: 1,
      playoffSize: lg.playoffSizeOverride != null ? lg.playoffSizeOverride : fmt.playoffSize,
      formatName: fmt.name, startedAt: Date.now()
    });
  }

  function playLeagueMatch(matchIdOrSpecial) {
    if (matchIdOrSpecial === "s1-final") {
      const nebraska = allCourses.find(c => c.name === "Nebraska");
      if (!nebraska) { alert("Nebraska course not found!"); return; }
      setActiveLeagueMatch({ matchId: "s1-final", leagueId: "s1", isChampionship: true });
      setSelCourse(nebraska);setRoundPlayers([me]);
      setAllScores({[me]: Array(18).fill(null)});setAllShotLogs({[me]: Array.from({length:18},()=>[])});
      setPlayMode("setup");setCurHole(0);setCurPlayerIdx(0);setHideScores(true);setActiveTourney(null);setTab("play");
      return;
    }
    const match = leagueMatches.find(m => m.id === matchIdOrSpecial);
    if (!match) return;
    let course = null;
    if (match.course) {
      course = allCourses.find(c => c.name === match.course);
      if (!course) { alert("Course not found: " + match.course); return; }
    }
    // Honor league-level config (hole count, course-of-the-week).
    const lg = leagues.find(l => l.id === match.leagueId);
    const lgHoleCount = lg?.holeCount === 9 ? 9 : 18;
    setActiveLeagueMatch({ matchId: match.id, leagueId: match.leagueId, isChampionship: match.roundType === "F", roundType: match.roundType, lockCourse: !!match.course });
    if (course) setSelCourse(course); else setSelCourse(null);
    setRoundPlayers([me]);
    setAllScores({[me]: Array(18).fill(null)});setAllShotLogs({[me]: Array.from({length:18},()=>[])});
    setHoleCount(lgHoleCount); setNineType("front");
    setPlayMode("setup");setCurHole(0);setCurPlayerIdx(0);setHideScores(true);setActiveTourney(null);setTab("play");
  }

  async function revealMatchResults(matchId) {
    const match = leagueMatches.find(m => m.id === matchId);
    if (!match || match.status !== "complete") return;
    const seen = match.resultsSeenBy || [];
    if (seen.includes(me)) return;
    await updateDoc(doc(db, "leagueMatches", matchId), { resultsSeenBy: [...seen, me] });
  }

  // ─── COURSE CREATOR ────────────────────────────────────
  function resetCreator(){setCcName("");setCcLevel("Medium");setCcTournament("");setCcHoles(Array.from({length:18},(_,i)=>({num:i+1,par:4,rangeMin:10,rangeMax:12})));setCcNine(0);}
  function setCcHolePar(idx,par){setCcHoles(prev=>{const n=[...prev];n[idx]={...n[idx],par};return n;});}
  function setCcHoleRange(idx,field,val){const v=parseInt(val)||0;setCcHoles(prev=>{const n=[...prev];n[idx]={...n[idx],[field]:Math.max(1,Math.min(30,v))};return n;});}
  async function saveCreatedCourse(){if(!ccName.trim())return;const holes=ccHoles.map(h=>({num:h.num,par:h.par,range:[h.rangeMin,Math.max(h.rangeMin,h.rangeMax)]}));await saveCoursetoDB({name:ccName.trim(),level:ccLevel,holes,tournament:ccTournament.trim()});setCreating(false);resetCreator();}
  async function handleGenerate(diff){const en=[...allCourses.map(c=>c.name),...PGA_2026.map(c=>c.name)];const course=generateCourse(diff,en);const id=await saveCoursetoDB(course);setSelCourse({...course,id,generated:true});setRoundPlayers([]);setAllScores({});setAllShotLogs({});setPlayMode("setup");setCurHole(0);setCurPlayerIdx(0);setHideScores(false);setTab("play");}

  // ─── PLAY FUNCTIONS ────────────────────────────────────
  function startRound(course){setSelCourse(course);setRoundPlayers([]);setAllScores({});setAllShotLogs({});setPlayMode("setup");setCurHole(0);setCurPlayerIdx(0);setHideScores(false);setActiveTourney(null);setActiveLeagueMatch(null);setLiveId(null);setLiveData(null);setSavedHoleStates({});setHoleCount(18);setNineType("front");setTab("play");}
  function addToRound(name){if(!name||roundPlayers.includes(name))return;setRoundPlayers(p=>[...p,name]);setAllScores(s=>({...s,[name]:Array(18).fill(null)}));setAllShotLogs(s=>({...s,[name]:Array.from({length:18},()=>[])}));}
  function beginPlay(){
    if(!roundPlayers.length||!selCourse)return;setPlayMode("holes");
    const startHole=holeCount===9&&nineType==="back"?9:0;
    setCurHole(startHole);setSavedHoleStates({});
    if(isLive&&liveScoreMode==="self"){const myIdx=roundPlayers.indexOf(me);setCurPlayerIdx(myIdx>=0?myIdx:0);}else{setCurPlayerIdx(0);}
    initHoleFor();
  }
  function initHoleFor(){const hs={};roundPlayers.forEach(p=>{hs[p]={shots:[],total:0,onGreen:false,putts:0,done:false,score:null,holeOut:false};});setHoleState(hs);}

  function recordShot(player,value){
    if(isSpectator)return;
    if(isLive&&liveScoreMode==="self"&&player!==me)return;
    setHoleState(prev=>{
      const ps={...prev[player]};const hole=selCourse.holes[curHole];if(ps.done)return prev;
      if(value==="HOLEOUT"){ps.holeOut=true;ps.done=true;ps.score=ps.shots.filter(s=>s.type==="slide"||s.type==="OB").length+1;ps.shots.push({type:"holeout",val:"Hole Out!"});return{...prev,[player]:ps};}
      if(ps.onGreen){if(value==="MADE"){ps.putts+=1;ps.shots.push({type:"putt",val:"Made"});ps.done=true;ps.score=ps.shots.filter(s=>s.type==="slide"||s.type==="OB").length+ps.putts;}else{ps.putts+=1;ps.shots.push({type:"putt",val:"Miss"});}}
      else{if(value==="OB"){ps.shots.push({type:"OB",val:0});}else{const num=parseInt(value);const isOver=ps.total>hole.range[1];if(isOver){ps.total-=num;ps.shots.push({type:"slide",val:num,dir:"sub"});}else{ps.total+=num;ps.shots.push({type:"slide",val:num,dir:"add"});}if(ps.total>=hole.range[0]&&ps.total<=hole.range[1])ps.onGreen=true;}}
      return{...prev,[player]:ps};
    });
  }
  function undoShot(player){
    if(isSpectator)return;if(isLive&&liveScoreMode==="self"&&player!==me)return;
    setHoleState(prev=>{
      const ps={...prev[player]};if(!ps.shots.length)return prev;
      if(ps.done){ps.done=false;ps.score=null;}
      const last=ps.shots.pop();
      if(last.type==="holeout"){ps.holeOut=false;}
      else if(last.type==="putt")ps.putts-=1;
      else if(last.type==="slide"){if(last.dir==="sub")ps.total+=last.val;else ps.total-=last.val;const hole=selCourse.holes[curHole];ps.onGreen=ps.total>=hole.range[0]&&ps.total<=hole.range[1];}
      return{...prev,[player]:ps};
    });
  }
  function saveCurrentHole(){
    setSavedHoleStates(prev=>({...prev,[curHole]:{...holeState}}));
    setAllScores(prev=>{const ns={...prev};roundPlayers.forEach(p=>{const ps=holeState[p];ns[p]=[...(ns[p]||Array(18).fill(null))];ns[p][curHole]=ps?.done?ps.score:(ps?.shots?.length>0?ps.shots.filter(s=>s.type==="slide"||s.type==="OB").length+(ps.onGreen?ps.putts:0):null);});return ns;});
    setAllShotLogs(prev=>{const ns={...prev};roundPlayers.forEach(p=>{ns[p]=[...(ns[p]||Array.from({length:18},()=>[]))];ns[p][curHole]=[...(holeState[p]?.shots||[])];});return ns;});
  }
  function navigateToHole(targetHole){
    setCurHole(targetHole);
    if(isLive&&liveScoreMode==="self"){const myIdx=roundPlayers.indexOf(me);setCurPlayerIdx(myIdx>=0?myIdx:0);}
    if(savedHoleStates[targetHole]){setHoleState(savedHoleStates[targetHole]);}else{initHoleFor();}
  }
  function finishHole(){saveCurrentHole();const lastHole=holeCount===9?(nineType==="back"?17:8):17;if(curHole<lastHole){navigateToHole(curHole+1);}else setPlayMode("review");}
  function goToPrevHole(){const firstHole=holeCount===9&&nineType==="back"?9:0;if(curHole<=firstHole)return;saveCurrentHole();navigateToHole(curHole-1);}

  async function saveRound(){
   try{
    const startIdx=holeCount===9&&nineType==="back"?9:0;
    const endIdx=startIdx+holeCount;
    const playedHoles=selCourse.holes.slice(startIdx,endIdx);
    const totalPar=playedHoles.reduce((s,h)=>s+h.par,0);
    // Snapshot current records BEFORE saving
    const preRecords = { ...courseRecords };

    for(const p of roundPlayers){
      const sc=allScores[p]||Array(18).fill(null);
      const playedScores=sc.slice(startIdx,endIdx);
      const total=playedScores.reduce((s,v)=>s+(v||0),0);const hio=countHIO(playedScores);const hd=useHdcp?(hdcps[p]||null):null;
      const logs = allShotLogs[p] || [];
      const playedLogs = logs.slice(startIdx,endIdx);
      const derivedPutts = playedLogs.reduce((sum, holeLogs) => sum + (holeLogs || []).filter(s => s.type === "putt").length, 0) || null;
      // Firestore doesn't support nested arrays — convert to map {0: [...shots], 1: [...shots]}
      const hasShots = playedLogs.some(h => h && h.length > 0);
      const shotLogsMap = {};
      if(hasShots) playedLogs.forEach((shots, i) => { shotLogsMap[String(i)] = shots || []; });

      // Determine match type for badge display
      const matchType = activeLeagueMatch
        ? (activeLeagueMatch.isChampionship ? "championship"
          : (()=>{ const m = leagueMatches.find(x=>x.id===activeLeagueMatch.matchId); return m?.roundType==="SF"||m?.roundType==="QF" ? "playoff" : "league"; })())
        : activeTourney ? "pga"
        : null;

      if(p===me||!isLive||isKeeperHost){
        await saveRoundToDB({
          player:p, course:selCourse.name, courseLevel:selCourse.level,
          date:new Date().toISOString().split("T")[0],
          scores:playedScores, total, par:totalPar,
          holesPlayed:holeCount, holeCount:holeCount,
          nineType:holeCount===9?nineType:null,
          diff:total-totalPar, holeInOnes:hio,
          hidden:hideScores, autoHidden:hideScores&&!!activeLeagueMatch, hdcp:hd, adjTotal:hd?total-hd:null,
          sealedMatchId:activeLeagueMatch&&activeLeagueMatch.matchId!=="s1-final"?activeLeagueMatch.matchId:null,
          matchType: matchType,
          shotLogs: hasShots ? shotLogsMap : null,
          totalPutts: derivedPutts,
          courseHoles: playedHoles
        });
        if(activeTourney){
          // Per-round PGA hdcp/adjTotal are NOT persisted: tBoard recomputes
          // adjusted totals from the player's current join-doc hdcp so a
          // mid-tournament hdcp update applies to all rounds, past and future.
          const existing=tEntries.find(e=>e.tournamentId===activeTourney.key&&e.player===p&&e.round===activeTourney.round);
          if(!existing){await addDoc(collection(db,"pgaTourneys"),{tournamentId:activeTourney.key,player:p,round:activeTourney.round,scores:playedScores,total,par:totalPar,holeInOnes:hio,date:new Date().toISOString().split("T")[0],createdAt:Date.now()});}
        }
      }
    }

    // ─── LEAGUE MATCH SAVE ─────────────────────────────
    if(activeLeagueMatch && activeLeagueMatch.matchId !== "s1-final"){
      const match = leagueMatches.find(m=>m.id===activeLeagueMatch.matchId);
      if(match){
        // In keeper-host mode the host scores both players, so we write
        // whichever of player1/player2 are in this round. In any other
        // mode we only have our own totals.
        const playersToWrite = isKeeperHost
          ? [match.player1, match.player2].filter(p => p && roundPlayers.includes(p))
          : [me];
        const updates={};
        let p1Tot=match.p1Total, p2Tot=match.p2Total;
        let p1Done=match.p1Total!=null, p2Done=match.p2Total!=null;
        playersToWrite.forEach(p=>{
          const psc=allScores[p]||Array(18).fill(null);
          const ptot=psc.reduce((s,v)=>s+(v||0),0);
          if(match.player1===p){updates.p1Total=ptot;updates.p1Par=totalPar;updates.p1Scores=psc;p1Tot=ptot;p1Done=true;}
          else if(match.player2===p){updates.p2Total=ptot;updates.p2Par=totalPar;updates.p2Scores=psc;p2Tot=ptot;p2Done=true;}
        });
        if(Object.keys(updates).length){
          if(!match.course)updates.course=selCourse.name;
          if(p1Done&&p2Done&&p1Tot!=null&&p2Tot!=null){
            updates.status="complete";updates.resultsSeenBy=[];
            // Adjusted totals when the league has handicap scoring enabled.
            // We persist both raw totals (already in p1Total/p2Total) and the
            // adjusted values used for winner determination so the match
            // detail can show both.
            const lg=leagues.find(l=>l.id===match.leagueId);
            const useHcp=!!lg?.useHandicapScoring;
            const cap=lg?.handicapCap;
            const clamp=v=>{if(v==null||cap==null)return v;const a=Math.abs(cap);return Math.max(-a,Math.min(a,v));};
            // Resolve handicap from the configured source. Manual reads the
            // creator-set override; auto computes from the player's full
            // round history at score-time.
            const resolveHcp=(player)=>{
              if(!useHcp||!player)return null;
              if((lg?.handicapSource||"manual")==="auto"){
                const pr=rounds.filter(r=>r.player===player&&(r.holeCount||r.holesPlayed||18)===18);
                return clamp(calcHandicap(pr));
              }
              return clamp(lg?.handicaps?.[player]);
            };
            const h1=resolveHcp(match.player1);
            const h2=resolveHcp(match.player2);
            const adj1=useHcp&&h1!=null?p1Tot-h1:p1Tot;
            const adj2=useHcp&&h2!=null?p2Tot-h2:p2Tot;
            if(useHcp){updates.p1Adj=adj1;updates.p2Adj=adj2;updates.handicapApplied=true;}
            if(adj1<adj2){updates.winner=match.player1;updates.margin=adj2-adj1;}
            else if(adj2<adj1){updates.winner=match.player2;updates.margin=adj1-adj2;}
            else{updates.winner="Tie";updates.margin=0;}
          }else{updates.status="in-progress";}
          await updateDoc(doc(db,"leagueMatches",match.id),updates);
          // ─── NOTIFICATIONS for this match save ───
          // If the match is now complete, notify the opponent ("results
          // unlocked"). If it's still in-progress, notify the opponent that
          // it's their turn.
          if(updates.status==="complete"){
            await checkLeagueProgress(match.leagueId);
            const lgName=lg?.name||"League";
            await Promise.all([match.player1, match.player2].filter(Boolean).map(p =>
              writeNotification(p, "results_unlocked", { matchId: match.id, leagueId: match.leagueId, leagueName: lgName, roundType: match.roundType })
            ));
          } else if(updates.status==="in-progress"){
            // The player(s) who just played are the ones in playersToWrite.
            // Notify the OTHER finalist if they haven't played yet.
            const lgName=lg?.name||"League";
            const p1Just = playersToWrite.includes(match.player1);
            const p2Just = playersToWrite.includes(match.player2);
            if(p1Just && match.player2 && match.p2Total == null) {
              await writeNotification(match.player2, "your_turn", { matchId: match.id, leagueId: match.leagueId, leagueName: lgName, opponent: match.player1, roundType: match.roundType });
            }
            if(p2Just && match.player1 && match.p1Total == null) {
              await writeNotification(match.player1, "your_turn", { matchId: match.id, leagueId: match.leagueId, leagueName: lgName, opponent: match.player2, roundType: match.roundType });
            }
          }
        }
      }
    }

    if(isLive){await syncMyScores();}

    // ─── COURSE RECORD CHECK (18-hole only) ───
    // Pick the lowest qualifying total in this round; that's the actual new
    // record holder. Previously this celebrated the first player iterated,
    // even if a later player in the same round shot lower.
    let recordBroken = false;
    if (holeCount === 18) {
      const courseName = selCourse.name;
      const old = preRecords[courseName];
      let best = null;
      for (const p of roundPlayers) {
        const sc = allScores[p] || Array(18).fill(null);
        const total = sc.reduce((s, v) => s + (v || 0), 0);
        const holesPlayed = sc.filter(v => v !== null).length;
        if (holesPlayed !== 18) continue;
        if ((!old || total < old.total) && (!best || total < best.total)) {
          best = { player: p, total };
        }
      }
      if (best) {
        const dest = activeTourney ? "home" : activeLeagueMatch ? "league" : "leaderboard";
        setNewRecordInfo({ player: best.player, course: courseName, newScore: best.total, newPar: totalPar, oldRecord: old || null, navigateTo: dest });
        recordBroken = true;
        // Notify everyone who's played this course (other than the recorder)
        // that the record was broken. Distinct, unsealed players only.
        const recipients = [...new Set(rounds
          .filter(r => r.course === courseName && r.player !== best.player && !isRoundSealed(r, leagueMatches, me))
          .map(r => r.player)
        )];
        await Promise.all(recipients.map(p =>
          writeNotification(p, "course_record", { course: courseName, player: best.player, score: best.total, par: totalPar, oldScore: old?.total || null })
        ));
      }
    }

    if (!recordBroken) {
      if(activeTourney){setActiveTourney(null);setShowTourney(true);setTab("home");}
      else if(activeLeagueMatch){setActiveLeagueMatch(null);setTab("league");}
      else setTab("leaderboard");
    }
    if(isLive)leaveLive();
   }catch(e){alert("Save error: "+e.message);console.error(e);}
  }

  function dismissRecord() {
    const dest = newRecordInfo?.navigateTo || "leaderboard";
    setNewRecordInfo(null);
    if (activeTourney) { setActiveTourney(null); setShowTourney(true); }
    if (activeLeagueMatch) setActiveLeagueMatch(null);
    setTab(dest);
  }

  // ─── CHECK LEAGUE PROGRESS (AUTO-ADVANCE) ────────────
  async function checkLeagueProgress(leagueId){
    const lg=leagues.find(l=>l.id===leagueId);
    if(!lg||lg.status!=="active")return;
    const allMatches=leagueMatches.filter(m=>m.leagueId===leagueId);
    const regMatches=allMatches.filter(m=>m.roundType==="regular");
    const allDone=regMatches.every(m=>m.status==="complete");
    if(allDone&&!allMatches.some(m=>m.roundType!=="regular")){
      const stats={};
      lg.players.forEach(p=>{stats[p]={player:p,pts:0,diff:0};});
      regMatches.forEach(m=>{
        if(m.winner===m.player1){stats[m.player1].pts+=2;}
        else if(m.winner===m.player2){stats[m.player2].pts+=2;}
        else{stats[m.player1].pts+=1;stats[m.player2].pts+=1;}
        stats[m.player1].diff+=(m.p1Total||0)-(m.p1Par||0);
        stats[m.player2].diff+=(m.p2Total||0)-(m.p2Par||0);
      });
      const sorted=Object.values(stats).sort((a,b)=>b.pts-a.pts||(a.diff-b.diff));
      const fmt=LEAGUE_FORMATS[lg.players.length];
      if(!fmt)return;
      const ps=effectivePlayoffSize(lg);
      // No playoffs: league completes immediately after the regular season.
      if(ps===0){
        await updateDoc(doc(db,"leagues",leagueId),{status:"complete"});
        await Promise.all((lg.players||[]).map(p =>
          writeNotification(p, "season_complete", { leagueId, leagueName: lg.name })
        ));
        return;
      }
      const seeds=sorted.slice(0,ps);
      const matches=buildPlayoffMatches(leagueId,lg.totalRounds,seeds,fmt,{
        playoffSize:ps,
        championshipCourse:lg.championshipCourse||null
      });
      await Promise.all(matches.map(m=>addDoc(collection(db,"leagueMatches"),{...m,createdAt:Date.now()})));
      await updateDoc(doc(db,"leagues",leagueId),{status:"playoffs"});
      // Notify every player in the league.
      await Promise.all((lg.players||[]).map(p =>
        writeNotification(p, "playoffs_created", { leagueId, leagueName: lg.name })
      ));
    }
  }

  function parseScoreInput(val){
    if(val==="" || val==null) return null;
    const n=parseInt(val,10);
    if(Number.isNaN(n)) return null;
    return Math.max(1, Math.min(15, n));
  }
  function setQuickScore(player,hole,val){setAllScores(s=>{const ns={...s};ns[player]=[...(ns[player]||Array(18).fill(null))];ns[player][hole]=parseScoreInput(val);return ns;});}
  function getRunningScore(player){
    const sc=allScores[player]||Array(18).fill(null);const thru=curHole;
    const completed=sc.slice(0,thru).reduce((s,v)=>s+(v||0),0);
    const parThru=selCourse.holes.slice(0,thru).reduce((s,h)=>s+h.par,0);
    return{total:completed,par:parThru,thru};
  }

  // ─── FEATURE FUNCTIONS ─────────────────────────────────
  function openRoundDetail(round) {
    // Normalize shotLogs: convert map format {"0":[...],"1":[...]} to array format [[...],[...]]
    const normalized = {...round};
    if(round.shotLogs && !Array.isArray(round.shotLogs)){
      const hc = round.holeCount || round.holesPlayed || 18;
      normalized.shotLogs = Array.from({length:hc},(_,i)=>round.shotLogs[String(i)]||[]);
    }
    setDetailRound(normalized); setEditingRound(false); setEditScores(null); setShareOverlay(false);
  }
  function closeRoundDetail() { setDetailRound(null); setEditingRound(false); setEditScores(null); setShareOverlay(false); }
  function openPlayerProfile(name) { setProfilePlayer(name); }
  function closePlayerProfile() { setProfilePlayer(null); }

  // ─── EDIT ROUND (Feature 10) ───────────────────────────
  async function saveEditedRound() {
    if (!detailRound || !editScores) return;
    const newTotal = editScores.reduce((s, v) => s + (v || 0), 0);
    const newDiff = newTotal - detailRound.par;
    const newHolesPlayed = editScores.filter(v => v !== null).length;
    const newHIO = editScores.filter(v => v === 1).length;

    let newShotLogs = detailRound.shotLogs ? [...detailRound.shotLogs] : null;
    let newTotalPutts = detailRound.totalPutts;
    if (newShotLogs) {
      (detailRound.scores||[]).forEach((orig, i) => {
        if (orig !== editScores[i]) newShotLogs[i] = [];
      });
      newTotalPutts = newShotLogs.reduce((sum, holeLogs) =>
        sum + (holeLogs || []).filter(s => s.type === "putt").length, 0) || null;
    }
    const newAdjTotal = detailRound.hdcp ? newTotal - detailRound.hdcp : null;

    if (detailRound.sealedMatchId) {
      if (!confirm("This round is part of a league match. Editing will update the match result. Continue?")) return;
    }

    // Convert shotLogs back to map format for Firestore
    let shotLogsForSave = null;
    if (newShotLogs) {
      const hasAny = newShotLogs.some(h => h && h.length > 0);
      if (hasAny) {
        shotLogsForSave = {};
        newShotLogs.forEach((shots, i) => { shotLogsForSave[String(i)] = shots || []; });
      }
    }

    await updateDoc(doc(db, "rounds", detailRound.id), {
      scores: editScores, total: newTotal, diff: newDiff,
      holesPlayed: newHolesPlayed, holeInOnes: newHIO,
      shotLogs: shotLogsForSave, totalPutts: newTotalPutts,
      adjTotal: newAdjTotal
    });

    if (detailRound.sealedMatchId) {
      const match = leagueMatches.find(m => m.id === detailRound.sealedMatchId);
      if (match) {
        const isP1 = match.player1 === detailRound.player;
        const updates = {};
        if (isP1) updates.p1Total = newTotal; else updates.p2Total = newTotal;
        const p1T = isP1 ? newTotal : match.p1Total;
        const p2T = isP1 ? match.p2Total : newTotal;
        if (p1T != null && p2T != null) {
          if (p1T < p2T) { updates.winner = match.player1; updates.margin = p2T - p1T; }
          else if (p2T < p1T) { updates.winner = match.player2; updates.margin = p1T - p2T; }
          else { updates.winner = "Tie"; updates.margin = 0; }
        }
        await updateDoc(doc(db, "leagueMatches", match.id), updates);
      }
    }

    setEditingRound(false); setEditScores(null); setDetailRound(null);
  }

  // ─── SHARE CARD (Feature 17) ──────────────────────────
  async function generateShareCard() {
    const el = shareRef.current;
    if (!el) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, { backgroundColor: "#1a2a1a", scale: 2 });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'slideGolf-scorecard.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: 'Slide Golf Scorecard' }); } catch(e) {}
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'slideGolf-scorecard.png';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch(e) { alert("Error generating card: " + e.message); }
  }

  // ─── LOADING / LOGIN ──────────────────────────────────
  if(!loaded)return<div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:C.greenLt,fontSize:18}}>Loading Slide Golf...</div></div>;
  if(!me)return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.text}}>
      <div style={{background:C.headerBg,padding:"14px 20px",borderBottom:`2px solid ${C.green}`,display:"flex",alignItems:"center",gap:12}}><div style={{width:34,height:34,borderRadius:"50%",background:C.accent,border:`2px solid ${C.greenLt}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>⛳</div><div><div style={{fontWeight:700,fontSize:17,letterSpacing:2,textTransform:"uppercase"}}>Slide Golf</div><div style={{fontSize:10,color:C.muted,letterSpacing:1}}>LEAGUE TRACKER</div></div></div>
      <div style={{maxWidth:400,margin:"0 auto",padding:24,display:"flex",flexDirection:"column",gap:16}}>
        <div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:22,fontWeight:700}}>Who are you?</div><div style={{color:C.muted,fontSize:13,marginTop:4}}>Pick your name to get started</div></div>
        {players.map(p=>(<button key={p.id} onClick={()=>selectMe(p.name)} style={{...btnS(false),width:"100%",padding:16,fontSize:16,textAlign:"center"}}>{p.name}</button>))}
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginTop:8}}><div style={{fontSize:13,color:C.muted,marginBottom:8}}>New player?</div><div style={{display:"flex",gap:8}}><input value={newPlayerName} onChange={e=>setNewPlayerName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newPlayerName.trim()){addPlayerToDB(newPlayerName);setNewPlayerName("");}}} placeholder="Your name..." style={inputS}/><button onClick={()=>{if(newPlayerName.trim()){addPlayerToDB(newPlayerName);setNewPlayerName("");}}} style={{...btnS(true),whiteSpace:"nowrap"}}>Add</button></div></div>
      </div>
    </div>
  );

  // ─── COMPUTED VALUES ───────────────────────────────────
  const playerNames=players.map(p=>p.name);
  const champFps=championshipFingerprints(leagueMatches);
  const modeMatch=r=>statsMode==="league"?isLeagueRound(r,champFps):statsMode==="regular"?!isLeagueRound(r,champFps):true;
  const computeStatsFor=(holeCount)=>playerNames.map(name=>{
    const pr=rounds.filter(r=>r.player===name&&roundHoleCount(r)===holeCount&&modeMatch(r));
    const unsealed=pr.filter(r=>!isRoundSealed(r,leagueMatches,me));
    const hcp=calcHandicap(unsealed);
    const best=unsealed.length?Math.min(...unsealed.map(r=>r.total)):null;
    const avg=unsealed.length?Math.round(unsealed.reduce((s,r)=>s+r.total,0)/unsealed.length*10)/10:null;
    const hio=unsealed.reduce((s,r)=>s+(r.holeInOnes||countHIO(r.scores)||0),0);
    return{name,rounds:unsealed.length,handicap:hcp,best,avg,holeInOnes:hio};
  }).sort((a,b)=>(a.handicap??999)-(b.handicap??999));
  const playerStats=computeStatsFor(18);
  const playerStats9=computeStatsFor(9);
  const courseRecords = computeCourseRecords(rounds, leagueMatches, me);
  const pgaThisWeek=getPGACourse();
  const tId=pgaThisWeek?.start;const curTE=tId?tEntries.filter(e=>e.tournamentId===tId):[];
  const tJoined=[...new Set(curTE.map(e=>e.player))];const iMeJoined=tJoined.includes(me);
  const myTRnds=curTE.filter(e=>e.player===me&&e.round>0).sort((a,b)=>a.round-b.round);const myNextRd=myTRnds.length+1;
  const tBoard=tJoined.map(p=>{const rnds=curTE.filter(e=>e.player===p&&e.round>0).sort((a,b)=>a.round-b.round);const tot=rnds.reduce((s,r)=>s+r.total,0);const par=rnds.reduce((s,r)=>s+r.par,0);const joinE=curTE.find(e=>e.player===p&&e.round===0);const hd=joinE?.hdcp||null;const adjTot=hd?rnds.reduce((s,r)=>s+(r.total-hd),0):null;const rScores={};rnds.forEach(r=>{rScores[r.round]={total:r.total,par:r.par};});return{player:p,rnds,tot,par,played:rnds.length,hd,adjTot,rScores};}).filter(p=>p.played>0).sort((a,b)=>tShowAdj&&a.adjTot!=null&&b.adjTot!=null?(a.adjTot-b.adjTot):((a.tot-a.par)-(b.tot-b.par)));
  const tPar=pgaThisWeek?pgaThisWeek.holes.reduce((s,h)=>s+h.par,0):72;

  const LiveBadge=()=>isLive?<div style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:8,padding:"6px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:4,background:C.red,animation:"pulse 1.5s infinite"}}/><span style={{fontSize:12,fontWeight:700,color:C.red}}>LIVE</span><span style={{fontSize:12,color:C.text,fontWeight:700,letterSpacing:2}}>{liveData.code}</span></div><div style={{fontSize:10,color:C.muted}}>{liveData.players.length} player{liveData.players.length!==1?"s":""} · {liveScoreMode==="keeper"?"1 Scorekeeper":"Self-Score"}</div></div>:null;

  const LeagueMatchBadge=()=>activeLeagueMatch?<div style={{background:activeLeagueMatch.isChampionship?"rgba(212,184,74,0.15)":"rgba(74,170,74,0.15)",border:`1px solid ${activeLeagueMatch.isChampionship?"rgba(212,184,74,0.4)":"rgba(74,170,74,0.4)"}`,borderRadius:8,padding:"6px 10px",textAlign:"center"}}><span style={{fontSize:12,fontWeight:700,color:activeLeagueMatch.isChampionship?C.gold:C.greenLt}}>{activeLeagueMatch.isChampionship?"🏆 CHAMPIONSHIP ROUND":"⚡ League Match"}</span></div>:null;

  const scNines=holeCount===9?(nineType==="back"?[9]:[0]):[0,9];
  const ScorecardView=()=>(<div style={{background:C.card,borderRadius:12,border:`1px solid ${C.greenLt}`,overflow:"hidden"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:C.accent}}><span style={{fontWeight:700,fontSize:13}}>📋 Scorecard</span><button onClick={()=>setShowScorecard(false)} style={{background:"transparent",border:"none",color:C.text,cursor:"pointer",fontSize:14}}>✕</button></div><div style={{overflowX:"auto",padding:6}}>{scNines.map(start=>(<table key={start} style={{width:"100%",borderCollapse:"collapse",fontSize:9,marginBottom:scNines.length>1&&start===0?4:0,minWidth:420}}><thead><tr style={{background:C.accent}}><th style={{padding:"3px 4px",textAlign:"left",minWidth:40}}>HOLE</th>{selCourse.holes.slice(start,start+9).map(h=><th key={h.num} style={{padding:"3px 1px",textAlign:"center",minWidth:24,background:h.num-1===curHole?"rgba(74,170,74,0.3)":"transparent"}}>{h.num}</th>)}<th style={{padding:"3px 3px",textAlign:"center",minWidth:30}}>{start===0?"OUT":"IN"}</th>{start===9&&holeCount===18&&<th style={{padding:"3px 3px",textAlign:"center",minWidth:30}}>TOT</th>}</tr></thead><tbody><tr style={{background:C.card2}}><td style={{padding:"2px 4px",fontWeight:600,color:C.greenLt,fontSize:8}}>RNG</td>{selCourse.holes.slice(start,start+9).map(h=><td key={h.num} style={{textAlign:"center",fontSize:7,color:C.muted}}>{fmtR(h.range)}</td>)}<td style={{textAlign:"center",fontSize:7,color:C.muted}}>{fmtRange(selCourse.holes,start,start+9)}</td>{start===9&&holeCount===18&&<td style={{textAlign:"center",fontSize:7,color:C.muted}}>{fmtRange(selCourse.holes,0,18)}</td>}</tr><tr><td style={{padding:"2px 4px",fontWeight:600,fontSize:9}}>PAR</td>{selCourse.holes.slice(start,start+9).map(h=><td key={h.num} style={{textAlign:"center",padding:"2px 1px"}}>{h.par}</td>)}<td style={{textAlign:"center",fontWeight:700}}>{calcPar(selCourse.holes,start,start+9)}</td>{start===9&&holeCount===18&&<td style={{textAlign:"center",fontWeight:700,color:C.greenLt}}>{selCourse.holes.reduce((s,h)=>s+h.par,0)}</td>}</tr>{roundPlayers.filter(p=>!hideScores||p===me).map(p=>{const sc=allScores[p]||Array(18).fill(null);return(<tr key={p} style={{borderTop:`1px solid ${C.border}`}}><td style={{padding:"2px 4px",fontWeight:600,fontSize:8}}>{p}{isLive&&p!==me?<span style={{color:C.blue,fontSize:7}}> 📡</span>:""}</td>{selCourse.holes.slice(start,start+9).map((h,i)=>{const idx=start+i;const v=sc[idx];return<td key={h.num} style={{textAlign:"center",fontSize:9,fontWeight:700,color:v===1?"#ff6b00":v!==null&&v<h.par?C.greenLt:v!==null&&v>h.par?"#ff6b6b":v!==null?C.text:C.muted,background:h.num-1===curHole?"rgba(74,170,74,0.1)":"transparent"}}>{v??"-"}</td>;})}<td style={{textAlign:"center",fontWeight:700,fontSize:9}}>{sc.slice(start,start+9).reduce((s,v)=>s+(v||0),0)||"-"}</td>{start===9&&holeCount===18&&<td style={{textAlign:"center",fontWeight:700,fontSize:9,color:C.greenLt}}>{sc.reduce((s,v)=>s+(v||0),0)||"-"}</td>}</tr>);})}</tbody></table>))}</div></div>);

  // ─── SCORE CELL HELPER (for detail overlay & share card) ───
  function ScoreCell({score, par, size=24, fontSize=12}) {
    if (score == null) return <td style={{textAlign:"center",padding:2}}><span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:size,height:size,color:C.muted,fontSize}}>—</span></td>;
    const diff = score - par;
    const isHIO = score === 1;
    let border = "none", borderRadius = 0, borderWidth = 1, bgColor = "transparent", color = "#222";
    if (isHIO) { bgColor = "#ff6b00"; borderRadius = 50; color = "#fff"; }
    else if (diff <= -2) { border = "solid"; borderRadius = 50; borderWidth = 3; }
    else if (diff === -1) { border = "solid"; borderRadius = 50; borderWidth = 1; }
    else if (diff === 1) { border = "solid"; borderRadius = 0; borderWidth = 1; }
    else if (diff >= 2) { border = "solid"; borderRadius = 0; borderWidth = 3; }
    return (
      <td style={{textAlign:"center",padding:2}}>
        <span style={{
          display:"inline-flex",alignItems:"center",justifyContent:"center",
          width:size,height:size,borderRadius,
          border: border !== "none" ? `${borderWidth}px solid #333` : "none",
          background:bgColor, color, fontWeight:700, fontSize
        }}>{score}</span>
      </td>
    );
  }

  // ─── GROUP ROUNDS for share card ───
  function getGroupRounds(round) {
    return rounds.filter(r => r.course === round.course && r.date === round.date && r.id !== round.id);
  }

  // ─── RENDER ────────────────────────────────────────────
  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.text}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}} @keyframes hioGlow{0%{text-shadow:0 0 10px #ff6b00}50%{text-shadow:0 0 30px #ff6b00,0 0 60px #ff4400}100%{text-shadow:0 0 10px #ff6b00}} @keyframes champGlow{0%{box-shadow:0 0 20px rgba(212,184,74,0.3)}50%{box-shadow:0 0 40px rgba(212,184,74,0.6)}100%{box-shadow:0 0 20px rgba(212,184,74,0.3)}} @keyframes fadeIn{0%{opacity:0;transform:scale(0.95)}100%{opacity:1;transform:scale(1)}}`}</style>
      {/* HEADER */}
      <div style={{background:activeLeagueMatch?.isChampionship?"linear-gradient(135deg,#2a1a00,#3a2a00)":C.headerBg,padding:"14px 20px",borderBottom:`2px solid ${activeLeagueMatch?.isChampionship?"#d4b84a":C.green}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:34,height:34,borderRadius:"50%",background:activeLeagueMatch?.isChampionship?"rgba(212,184,74,0.3)":C.accent,border:`2px solid ${activeLeagueMatch?.isChampionship?"#d4b84a":C.greenLt}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{activeLeagueMatch?.isChampionship?"🏆":"⛳"}</div><div><div style={{fontWeight:700,fontSize:17,letterSpacing:2,textTransform:"uppercase",color:activeLeagueMatch?.isChampionship?"#d4b84a":C.text}}>{activeLeagueMatch?.isChampionship?"Championship":"Slide Golf"}</div><div style={{fontSize:10,color:C.muted,letterSpacing:1}}>{activeLeagueMatch?.isChampionship?"SEASON 1 FINALS":"LEAGUE TRACKER"}</div></div></div><div style={{display:"flex",alignItems:"center",gap:8}}>{isLive&&<span style={{fontSize:10,color:C.red,fontWeight:700}}>🔴 LIVE</span>}{me&&(()=>{const unread=notifications.filter(n=>!n.read).length;return <button onClick={()=>setShowNotifications(true)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:18,position:"relative",padding:"2px 4px",lineHeight:1}}>🔔{unread>0&&<span style={{position:"absolute",top:-2,right:-4,background:C.red,color:"#fff",fontSize:9,fontWeight:700,minWidth:14,height:14,borderRadius:7,padding:"0 3px",display:"flex",alignItems:"center",justifyContent:"center"}}>{unread>9?"9+":unread}</span>}</button>;})()}<span style={{fontSize:12,color:activeLeagueMatch?.isChampionship?"#d4b84a":C.greenLt}}>{me}</span><button onClick={()=>{setMe("");try{localStorage.removeItem("sg-me");}catch(e){}}} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:10}}>Switch</button></div></div>
      {/* TABS */}
      <div style={{display:"flex",background:C.card,borderBottom:`1px solid ${C.border}`}}>{[["home","Home"],["courses","Courses"],["play","Play"],["league","League"],["leaderboard","Board"],["stats","Stats"]].map(([k,l])=>(<button key={k} onClick={()=>{setTab(k);if(k==="courses")setCreating(false);if(k!=="home")setShowTourney(false);}} style={{flex:1,padding:"11px 4px",background:tab===k?C.accent:"transparent",color:tab===k?C.white:C.muted,border:"none",cursor:"pointer",fontSize:11,fontWeight:tab===k?700:400,borderBottom:tab===k?`2px solid ${C.greenLt}`:"2px solid transparent"}}>{l}</button>))}</div>

      <div style={{maxWidth:600,margin:"0 auto",padding:16}}>
        {tab==="home"&&<HomeTab me={me} rounds={rounds} allCourses={allCourses} playerNames={playerNames} pgaThisWeek={pgaThisWeek} showTourney={showTourney} setShowTourney={setShowTourney} showJoin={showJoin} setShowJoin={setShowJoin} joinInput={joinInput} setJoinInput={setJoinInput} joinLive={joinLive} setTab={setTab} setCreating={setCreating} handleGenerate={handleGenerate} iMeJoined={iMeJoined} tJoined={tJoined} curTE={curTE} tEntries={tEntries} tPar={tPar} myTRnds={myTRnds} myNextRd={myNextRd} tBoard={tBoard} tShowAdj={tShowAdj} setTShowAdj={setTShowAdj} myTHdcp={myTHdcp} setMyTHdcp={setMyTHdcp} joinTourney={joinTourney} updateMyTourneyHdcp={updateMyTourneyHdcp} playTourneyRound={playTourneyRound} playCasualPGA={playCasualPGA} leagueMatches={leagueMatches} revealMatchResults={revealMatchResults} openRoundDetail={openRoundDetail}/>}
        {tab==="league"&&<LeagueTab me={me} leagueView={leagueView} setLeagueView={setLeagueView} leagueRdFilter={leagueRdFilter} setLeagueRdFilter={setLeagueRdFilter} leagues={leagues} leagueMatches={leagueMatches} rounds={rounds} allCourses={allCourses} createLeague={createLeague} updateLeagueConfig={updateLeagueConfig} joinLeagueByCode={joinLeagueByCode} startLeagueSeason={startLeagueSeason} playLeagueMatch={playLeagueMatch} selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} openPlayerProfile={openPlayerProfile} renameLeague={renameLeague} swapWeekCourse={swapWeekCourse} setMatchCourse={setMatchCourse} resetMatch={resetMatch} forfeitMatch={forfeitMatch} setLeagueHandicap={setLeagueHandicap} extendMatchDeadline={extendMatchDeadline} replacePlayer={replacePlayer} addPlayerMidSeason={addPlayerMidSeason} removePlayerMidSeason={removePlayerMidSeason}/>}
        {tab==="courses"&&<CoursesTab allCourses={allCourses} creating={creating} setCreating={setCreating} startRound={startRound} deleteCourseFromDB={deleteCourseFromDB} handleGenerate={handleGenerate} ccName={ccName} setCcName={setCcName} ccLevel={ccLevel} setCcLevel={setCcLevel} ccTournament={ccTournament} setCcTournament={setCcTournament} ccHoles={ccHoles} setCcHolePar={setCcHolePar} setCcHoleRange={setCcHoleRange} ccNine={ccNine} setCcNine={setCcNine} saveCreatedCourse={saveCreatedCourse} resetCreator={resetCreator} courseRecords={courseRecords} rounds={rounds} leagueMatches={leagueMatches} me={me}/>}
        {tab==="play"&&<><LeagueMatchBadge/><PlayTab me={me} selCourse={selCourse} setSelCourse={setSelCourse} allCourses={allCourses} playMode={playMode} setPlayMode={setPlayMode} pgaThisWeek={pgaThisWeek} roundPlayers={roundPlayers} setRoundPlayers={setRoundPlayers} playerNames={playerNames} addToRound={addToRound} beginPlay={beginPlay} activeTourney={activeTourney} setActiveTourney={setActiveTourney} setShowTourney={setShowTourney} setTab={setTab} hideScores={hideScores} setHideScores={setHideScores} useHdcp={useHdcp} setUseHdcp={setUseHdcp} hdcps={hdcps} setHdcps={setHdcps} allScores={allScores} setAllScores={setAllScores} allShotLogs={allShotLogs} setAllShotLogs={setAllShotLogs} curHole={curHole} curPlayerIdx={curPlayerIdx} setCurPlayerIdx={setCurPlayerIdx} holeState={holeState} showScorecard={showScorecard} setShowScorecard={setShowScorecard} nine={nine} setNine={setNine} setQuickScore={setQuickScore} isLive={isLive} liveData={liveData} liveScoreMode={liveScoreMode} setLiveScoreMode={setLiveScoreMode} isSpectator={isSpectator} isKeeperHost={isKeeperHost} goLive={goLive} leaveLive={leaveLive} recordShot={recordShot} undoShot={undoShot} finishHole={finishHole} goToPrevHole={goToPrevHole} saveRound={saveRound} getRunningScore={getRunningScore} LiveBadge={LiveBadge} ScorecardView={ScorecardView} shareRef={shareRef} generateShareCard={generateShareCard} ScoreCell={ScoreCell} holeCount={holeCount} setHoleCount={setHoleCount} nineType={nineType} setNineType={setNineType} activeLeagueMatch={activeLeagueMatch}/></>}
        {tab==="leaderboard"&&<LeaderboardTab me={me} playerStats={lbHoleFilter===9?playerStats9:playerStats} rounds={rounds} deleteRoundFromDB={deleteRoundFromDB} leagueMatches={leagueMatches} openRoundDetail={openRoundDetail} openPlayerProfile={openPlayerProfile} allCourses={allCourses} lbHoleFilter={lbHoleFilter} setLbHoleFilter={setLbHoleFilter} statsMode={statsMode} setStatsMode={setStatsMode}/>}
        {tab==="stats"&&<StatsTab playerStats={lbHoleFilter===9?playerStats9:playerStats} rounds={rounds} leagueMatches={leagueMatches} me={me} openPlayerProfile={openPlayerProfile} allCourses={allCourses} lbHoleFilter={lbHoleFilter} setLbHoleFilter={setLbHoleFilter} statsMode={statsMode} setStatsMode={setStatsMode}/>}
      </div>

      {showNotifications && <NotificationsPanel
        notifications={notifications}
        onClose={()=>setShowNotifications(false)}
        markRead={markNotificationRead}
        markAllRead={markAllNotificationsRead}
        deleteNotification={deleteNotification}
        setTab={setTab}
        setSelectedLeague={setSelectedLeague}
      />}

      <RoundDetailOverlay
        detailRound={detailRound} editingRound={editingRound} editScores={editScores}
        setEditingRound={setEditingRound} setEditScores={setEditScores}
        me={me} rounds={rounds} leagueMatches={leagueMatches} allCourses={allCourses} champFps={champFps}
        closeRoundDetail={closeRoundDetail} saveEditedRound={saveEditedRound}
        setShareOverlay={setShareOverlay} deleteRoundFromDB={deleteRoundFromDB}
        parseScoreInput={parseScoreInput} ScoreCell={ScoreCell}
      />

      {/* ═══ SHARE OVERLAY (Feature 17) ═══ */}
      {shareOverlay && detailRound && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.9)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16}} onClick={()=>setShareOverlay(false)}>
          <div style={{background:C.card,borderRadius:16,padding:20,maxWidth:400,width:"100%",animation:"fadeIn 0.3s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:700,fontSize:16,marginBottom:12}}>📤 Share Scorecard</div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <button onClick={()=>setShareMode("single")} style={{flex:1,...btnS(shareMode==="single"),padding:10,fontSize:12}}>My Card</button>
              {getGroupRounds(detailRound).length > 0 && <button onClick={()=>setShareMode("group")} style={{flex:1,...btnS(shareMode==="group"),padding:10,fontSize:12}}>Group Card</button>}
            </div>
            <button onClick={generateShareCard} disabled={!shareMode} style={{...btnS(true),width:"100%",padding:12,fontSize:14,opacity:shareMode?1:0.5}}>📸 Generate & Share</button>
            <button onClick={()=>setShareOverlay(false)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:12,marginTop:8,width:"100%",textAlign:"center"}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Hidden share card render target */}
      {shareOverlay && detailRound && shareMode && (()=>{
        const holes = detailRound.courseHoles || allCourses.find(c=>c.name===detailRound.course)?.holes;
        const groupRounds = shareMode === "group" ? getGroupRounds(detailRound) : [];
        const allRoundsToShow = [detailRound, ...groupRounds];
        const totalPar = holes ? holes.reduce((s,h)=>s+h.par,0) : detailRound.par;
        return <div ref={shareRef} style={{position:"fixed",left:-9999,top:0,width:800,background:"#f5f0e0",fontFamily:"Georgia,serif",padding:0}}>
          {/* Tan header */}
          <div style={{background:"linear-gradient(135deg,#c4a960,#d4b84a)",padding:"16px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:28,fontWeight:900,textTransform:"uppercase",letterSpacing:3,color:"#1a2a00"}}>{detailRound.course}</div>
              <div style={{fontSize:12,color:"#3a4a1a",marginTop:2}}>{detailRound.date}{detailRound.sealedMatchId?" · League Match":""}</div>
            </div>
            <div style={{background:"#1a2a00",color:"#d4b84a",padding:"4px 12px",borderRadius:4,fontSize:11,fontWeight:700}}>
              {(detailRound.courseLevel||"").toUpperCase()}
            </div>
          </div>
          {/* Scorecard tables */}
          {[0,9].map(start => (
            <table key={start} style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:"#2d6a2d",color:"#fff"}}>
                  <th style={{padding:"6px 8px",textAlign:"left",width:80}}>HOLE</th>
                  {(holes||[]).slice(start,start+9).map((h,i)=><th key={i} style={{padding:"6px 4px",textAlign:"center",width:60}}>{start+i+1}</th>)}
                  <th style={{padding:"6px 4px",textAlign:"center",width:60,fontWeight:900}}>{start===0?"OUT":"IN"}</th>
                  {start===9&&<th style={{padding:"6px 4px",textAlign:"center",width:60,fontWeight:900}}>TOT</th>}
                </tr>
              </thead>
              <tbody>
                {holes && <tr style={{background:"#e8f0d8"}}>
                  <td style={{padding:"4px 8px",fontWeight:700,color:"#2d6a2d",fontSize:11}}>RANGE</td>
                  {holes.slice(start,start+9).map((h,i)=><td key={i} style={{textAlign:"center",fontSize:10,color:"#5a7a3a"}}>{fmtR(h.range)}</td>)}
                  <td style={{textAlign:"center",fontSize:10,color:"#5a7a3a"}}>{fmtRange(holes,start,start+9)}</td>
                  {start===9&&<td style={{textAlign:"center",fontSize:10,color:"#5a7a3a"}}>{fmtRange(holes,0,18)}</td>}
                </tr>}
                {holes && <tr style={{background:"#fff"}}>
                  <td style={{padding:"4px 8px",fontWeight:700}}>PAR</td>
                  {holes.slice(start,start+9).map((h,i)=><td key={i} style={{textAlign:"center",fontWeight:600}}>{h.par}</td>)}
                  <td style={{textAlign:"center",fontWeight:900}}>{calcPar(holes,start,start+9)}</td>
                  {start===9&&<td style={{textAlign:"center",fontWeight:900,color:"#2d6a2d"}}>{totalPar}</td>}
                </tr>}
                {allRoundsToShow.map(rd=>{
                  const sc = rd.scores||[];
                  return <tr key={rd.id} style={{borderTop:"1px solid #ccc",background:"#fff"}}>
                    <td style={{padding:"4px 8px",fontWeight:700,fontSize:12}}>{rd.player}</td>
                    {sc.slice(start,start+9).map((v,i)=>{
                      const par = holes?.[start+i]?.par;
                      if(v==null)return<td key={i} style={{textAlign:"center",color:"#999"}}>—</td>;
                      const diff=par!=null?v-par:0;const isHIO=v===1;
                      let bStyle="none",bRadius=0,bWidth=1,bgC="transparent",fColor="#222";
                      if(isHIO){bgC="#ff6b00";bRadius=50;fColor="#fff";}
                      else if(diff<=-2){bStyle="solid";bRadius=50;bWidth=3;}
                      else if(diff===-1){bStyle="solid";bRadius=50;bWidth=1;}
                      else if(diff===1){bStyle="solid";bRadius=0;bWidth=1;}
                      else if(diff>=2){bStyle="solid";bRadius=0;bWidth=3;}
                      return <td key={i} style={{textAlign:"center",padding:3}}>
                        <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:bRadius,border:bStyle!=="none"?`${bWidth}px solid #333`:"none",background:bgC,color:fColor,fontWeight:700,fontSize:13}}>{v}</span>
                      </td>;
                    })}
                    <td style={{textAlign:"center",fontWeight:900}}>{sc.slice(start,start+9).reduce((s,v)=>s+(v||0),0)||"-"}</td>
                    {start===9&&<td style={{textAlign:"center",fontWeight:900,color:"#2d6a2d"}}>{sc.reduce((s,v)=>s+(v||0),0)||"-"}</td>}
                  </tr>;
                })}
              </tbody>
            </table>
          ))}
          {/* Footer */}
          <div style={{borderTop:"2px dashed #2d6a2d",margin:"12px 24px 0",padding:"10px 0",textAlign:"center"}}>
            <span style={{letterSpacing:8,fontSize:14,fontWeight:700,color:"#2d6a2d"}}>S L I D E  G O L F</span>
          </div>
        </div>;
      })()}

      {/* ═══ PLAYER PROFILE OVERLAY (Feature 7) ═══ */}
      {profilePlayer && (()=>{
        const ps = playerStats.find(p=>p.name===profilePlayer);
        const ach = computeAchievements(profilePlayer, rounds, leagueMatches, allCourses, me);
        const puttsRounds = rounds.filter(r=>r.player===profilePlayer&&r.totalPutts!=null&&!isRoundSealed(r,leagueMatches,me));
        const avgPutts = puttsRounds.length?Math.round(puttsRounds.reduce((s,r)=>s+r.totalPutts,0)/puttsRounds.length*10)/10:null;
        return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:9997,overflowY:"auto",padding:"40px 16px"}} onClick={e=>{if(e.target===e.currentTarget)closePlayerProfile();}}>
          <div style={{background:C.bg,borderRadius:16,border:`1px solid ${C.border}`,maxWidth:480,width:"100%",animation:"fadeIn 0.3s ease"}} onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{padding:"20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:22,fontWeight:900}}>{profilePlayer}</div>
              <button onClick={closePlayerProfile} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:20}}>✕</button>
            </div>
            {/* Stats row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4,padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
              {[
                [ps?.handicap!=null?ps.handicap:"-","HDCP",C.greenLt],
                [ps?.rounds||0,"Rounds",C.text],
                [ps?.best??"-","Best",C.text],
                [ps?.avg??"-","Avg",C.text],
                [ps?.holeInOnes||0,"HIOs","#ff6b00"],
                [avgPutts??"-","Avg Putts",C.blue]
              ].map(([v,l,c],i)=><div key={i} style={{textAlign:"center",padding:4}}><div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:8,color:C.muted}}>{l}</div></div>)}
            </div>
            {/* Achievements */}
            <div style={{padding:"12px 16px"}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>🏅 Achievements</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[
                  ["🎯",`${ach.totalHIO} HIOs`,ach.hioMilestone?`${ach.hioMilestone}+ tier`:"","#ff6b00"],
                  ["🏌️",`${ach.roundsPlayed} Rounds`,ach.roundsMilestone?`${ach.roundsMilestone}+ tier`:"",C.greenLt],
                  ["🗺️",`${ach.coursesPlayed} Courses`,ach.coursesMilestone?`${ach.coursesMilestone}+ tier`:"",C.blue],
                  ["🔥",`League Wins`,`${ach.leagueWinStreak.current} cur / ${ach.leagueWinStreak.best} best`,C.gold],
                  ["📉","Under Par",`${ach.underParStreak.current} cur / ${ach.underParStreak.best} best`,C.greenLt],
                  ["🦅",`Birdies (rd)`,`Best: ${ach.mostBirdies}`,C.greenLt],
                  ["💀","Match Win",`Biggest: ${ach.biggestWin}`,C.red],
                  ["⛳","Best to Par",ach.bestToPar!=null?(ach.bestToPar>0?`+${ach.bestToPar}`:ach.bestToPar===0?"E":String(ach.bestToPar)):"-",C.greenLt],
                ].map(([emoji,title,sub,color],i)=><div key={i} style={{background:C.card,borderRadius:8,padding:"8px 10px",border:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:16}}>{emoji}</span>
                    <div><div style={{fontSize:11,fontWeight:700,color}}>{title}</div><div style={{fontSize:9,color:C.muted}}>{sub}</div></div>
                  </div>
                </div>)}
              </div>
            </div>
            {/* Course Bests */}
            {Object.keys(ach.courseBests).length>0 && <div style={{padding:"0 16px 12px"}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>🏟️ Course Bests</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {Object.entries(ach.courseBests).map(([course,data])=><div key={course} style={{background:C.card,borderRadius:6,padding:"6px 10px",border:`1px solid ${C.border}`,fontSize:11}}>
                  <div style={{fontWeight:600,fontSize:10}}>{course}</div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                    <span style={{fontWeight:700}}>{data.total}</span>
                    <RelPar s={data.total} p={data.par}/>
                  </div>
                </div>)}
              </div>
            </div>}
            {/* Recent rounds */}
            {ach.recentRounds.length>0 && <div style={{padding:"0 16px 16px"}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>📋 Recent Rounds</div>
              {ach.recentRounds.map(r=>{const lvl=r.courseLevel;const lvlColor=lvl==="Easy"?"#22c55e":lvl==="Medium"?"#3b82f6":lvl==="Hard"?"#f59e0b":"#ef4444";const mt=r.matchType;const matchTag=mt==="championship"?"🏆":mt==="playoff"?"⚡PO":mt==="league"?"⚡":mt==="pga"?"📺":null;const matchColor=mt==="championship"?C.gold:mt==="pga"?C.blue:C.greenLt;return<div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`,fontSize:12,cursor:"pointer"}} onClick={()=>openRoundDetail(r)}>
                <div><span style={{fontWeight:600}}>{r.course}</span>{lvl&&<span style={{fontSize:8,fontWeight:700,color:lvlColor,marginLeft:4}}>{lvl}</span>}{matchTag&&<span style={{fontSize:8,color:matchColor,marginLeft:3}}>{matchTag}</span>}<span style={{color:C.muted,fontSize:10,marginLeft:6}}>{r.date}</span></div>
                <div style={{display:"flex",gap:4,alignItems:"center"}}><span style={{fontWeight:700}}>{r.total}</span><RelPar s={r.total} p={r.par}/></div>
              </div>;})}
            </div>}
          </div>
        </div>;
      })()}

      {/* ═══ NEW COURSE RECORD CELEBRATION (Feature 2) ═══ */}
      {newRecordInfo && (
        <div style={{
          position:"fixed", top:0, left:0, right:0, bottom:0,
          background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center",
          justifyContent:"center", zIndex:9999, animation:"fadeIn 0.5s ease"
        }} onClick={dismissRecord}>
          <div style={{
            background:"linear-gradient(135deg,#1a2a00,#2a3a00,#1a2a00)",
            borderRadius:20, padding:32, border:"2px solid #d4b84a",
            textAlign:"center", maxWidth:340, width:"90%",
            boxShadow:"0 0 60px rgba(212,184,74,0.3)"
          }}>
            <div style={{fontSize:48}}>🏆</div>
            <div style={{fontSize:11, color:"#d4b84a", textTransform:"uppercase", letterSpacing:4, marginTop:8}}>New Course Record</div>
            <div style={{fontSize:28, fontWeight:900, color:"#fff", marginTop:8}}>{newRecordInfo.player}</div>
            <div style={{fontSize:14, color:"#d4b84a", marginTop:4}}>{newRecordInfo.course}</div>
            <div style={{display:"flex", justifyContent:"center", alignItems:"center", gap:8, marginTop:16}}>
              <span style={{fontSize:40, fontWeight:900, color:"#fff"}}>{newRecordInfo.newScore}</span>
              <RelPar s={newRecordInfo.newScore} p={newRecordInfo.newPar}/>
            </div>
            {newRecordInfo.oldRecord ? (
              <div style={{marginTop:12, fontSize:12, color:C.muted}}>Previous: {newRecordInfo.oldRecord.total} — {newRecordInfo.oldRecord.player}</div>
            ) : (
              <div style={{marginTop:12, fontSize:12, color:"#d4b84a"}}>First record set on this course!</div>
            )}
            <div style={{marginTop:20, fontSize:11, color:C.muted}}>Tap anywhere to continue</div>
          </div>
        </div>
      )}
    </div>
  );
}
