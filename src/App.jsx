import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "./firebase.js";
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, updateDoc, where, getDocs, getDoc
} from "firebase/firestore";

// ─── DATA IMPORTS ───────────────────────────────────────
import { COURSES } from "./data/courses.js";
import { PGA_2026, getPGACourse } from "./data/pga2026.js";

// ─── UTILITY IMPORTS ────────────────────────────────────
import { calcPar, fmtRange, fmtR, calcHandicap, countHIO, scoreName, RelPar, genLiveCode, calcNeed, isRoundSealed, computeCourseRecords, computeAchievements } from "./utils/helpers.jsx";
import { generateCourse } from "./utils/generate.js";
import { C, btnS, inputS, smallInput } from "./utils/theme.js";
import { generateRRSchedule, LEAGUE_FORMATS } from "./data/league.js";

// ─── COMPONENT IMPORTS ──────────────────────────────────
import HomeTab from "./components/HomeTab.jsx";
import LeagueTab from "./components/LeagueTab.jsx";
import CoursesTab from "./components/CoursesTab.jsx";
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

  // ─── LEAGUE STATE ─────────────────────────────────────
  const[leagues,setLeagues]=useState([]);
  const[leagueMatches,setLeagueMatches]=useState([]);
  const[selectedLeague,setSelectedLeague]=useState("s1");
  const[activeLeagueMatch,setActiveLeagueMatch]=useState(null);

  // ─── FEATURE STATE (Course Records, Round Detail, Player Profile, Edit Round, Share) ───
  const[newRecordInfo,setNewRecordInfo]=useState(null);
  const[detailRound,setDetailRound]=useState(null);
  const[profilePlayer,setProfilePlayer]=useState(null);
  const[editingRound,setEditingRound]=useState(false);
  const[editScores,setEditScores]=useState(null);
  const[shareMode,setShareMode]=useState(null); // null | "single" | "group"
  const[shareOverlay,setShareOverlay]=useState(false);
  const shareRef=useRef(null);

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
  async function saveCoursetoDB(course){return(await addDoc(collection(db,"customCourses"),{name:course.name,level:course.level,holes:course.holes,pga:course.pga||false,tournament:course.tournament||"",createdAt:Date.now()})).id;}
  async function deleteCourseFromDB(id){await deleteDoc(doc(db,"customCourses",id));}
  function selectMe(name){setMe(name);try{localStorage.setItem("sg-me",name);}catch(e){}}

  // ─── LIVE ROUND FUNCTIONS ──────────────────────────────
  async function goLive(){
    if(!selCourse||!me)return;
    const code=genLiveCode();
    const playersArr=[me,...roundPlayers.filter(p=>p!==me)];
    const scoresObj={};const hioObj={};
    playersArr.forEach(p=>{scoresObj[p]=allScores[p]||Array(18).fill(null);hioObj[p]=0;});
    const ref=await addDoc(collection(db,"liveRounds"),{code,host:me,courseName:selCourse.name,courseData:{name:selCourse.name,level:selCourse.level,holes:selCourse.holes,pga:selCourse.pga||false,tournament:selCourse.tournament||""},players:playersArr,status:"playing",scores:scoresObj,holeInOnes:hioObj,hideScores,useHdcp,hdcps,activeTourney:activeTourney||null,scoreMode:liveScoreMode,createdAt:Date.now()});
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
      await updateDoc(doc(db,"liveRounds",d.id),{players:pls,scores,holeInOnes:hio});
      setLiveId(d.id);setSelCourse(data.courseData);setActiveTourney(data.activeTourney||null);
      setLiveScoreMode(data.scoreMode||"self");setRoundPlayers(pls);setAllScores(scores);
      setAllShotLogs(prev=>({...prev,[me]:prev[me]||Array.from({length:18},()=>[])}));
      setHideScores(data.hideScores||false);setUseHdcp(data.useHdcp||false);setHdcps(data.hdcps||{});
      setPlayMode("setup");setTab("play");setShowJoin(false);setJoinInput("");
    }catch(e){alert("Error joining: "+e.message);}
  }
  async function leaveLive(){
    if(liveId&&liveData&&liveData.host===me){try{await updateDoc(doc(db,"liveRounds",liveId),{status:"finished"});}catch(e){}}
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
  async function createLeague(name, useHandicap) {
    const code = genLiveCode() + genLiveCode().slice(0,2);
    const ref = await addDoc(collection(db,"leagues"), {
      name, code: code.toUpperCase(), creator: me, status: "lobby",
      players: [me], useHdcp: useHandicap || false,
      createdAt: Date.now()
    });
    setSelectedLeague(ref.id);
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
    if (!fmt) { alert("Need 4-10 players to start"); return; }
    const schedule = generateRRSchedule(lg.players);
    let matchNum = 0;
    for (let rIdx = 0; rIdx < schedule.length; rIdx++) {
      for (const [p1, p2] of schedule[rIdx]) {
        matchNum++;
        await addDoc(collection(db,"leagueMatches"), {
          leagueId, round: rIdx + 1, matchNum, roundType: "regular",
          player1: p1, player2: p2,
          course: null, p1Total: null, p2Total: null, p1Par: null, p2Par: null,
          p1Scores: null, p2Scores: null,
          winner: null, margin: null, status: "pending",
          createdAt: Date.now()
        });
      }
    }
    await updateDoc(doc(db,"leagues",leagueId), {
      status: "active", totalRounds: schedule.length, currentRound: 1,
      playoffSize: fmt.playoffSize, formatName: fmt.name
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
    const isP1 = match.player1 === me;
    let course = null;
    if (match.course) {
      course = allCourses.find(c => c.name === match.course);
      if (!course) { alert("Course not found: " + match.course); return; }
    }
    setActiveLeagueMatch({ matchId: match.id, leagueId: match.leagueId, isChampionship: match.roundType === "F", roundType: match.roundType });
    if (course) setSelCourse(course); else setSelCourse(null);
    setRoundPlayers([me]);setAllScores({[me]: Array(18).fill(null)});setAllShotLogs({[me]: Array.from({length:18},()=>[])});
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
  async function handleGenerate(diff){const en=[...allCourses.map(c=>c.name),...PGA_2026.map(c=>c.name)];const course=generateCourse(diff,en);await saveCoursetoDB(course);setSelCourse({...course,generated:true});setRoundPlayers([]);setAllScores({});setAllShotLogs({});setPlayMode("setup");setCurHole(0);setCurPlayerIdx(0);setHideScores(false);setTab("play");}

  // ─── PLAY FUNCTIONS ────────────────────────────────────
  function startRound(course){setSelCourse(course);setRoundPlayers([]);setAllScores({});setAllShotLogs({});setPlayMode("setup");setCurHole(0);setCurPlayerIdx(0);setHideScores(false);setActiveTourney(null);setActiveLeagueMatch(null);setLiveId(null);setLiveData(null);setSavedHoleStates({});setTab("play");}
  function addToRound(name){if(!name||roundPlayers.includes(name))return;setRoundPlayers(p=>[...p,name]);setAllScores(s=>({...s,[name]:Array(18).fill(null)}));setAllShotLogs(s=>({...s,[name]:Array.from({length:18},()=>[])}));}
  function beginPlay(){
    if(!roundPlayers.length||!selCourse)return;setPlayMode("holes");setCurHole(0);setSavedHoleStates({});
    if(isLive&&liveScoreMode==="self"){const myIdx=roundPlayers.indexOf(me);setCurPlayerIdx(myIdx>=0?myIdx:0);}else{setCurPlayerIdx(0);}
    initHoleFor(0);
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
  function finishHole(){saveCurrentHole();if(curHole<17){navigateToHole(curHole+1);}else setPlayMode("review");}
  function goToPrevHole(){if(curHole<=0)return;saveCurrentHole();navigateToHole(curHole-1);}

  async function saveRound(){
    const totalPar=selCourse.holes.reduce((s,h)=>s+h.par,0);
    // Snapshot current records BEFORE saving
    const preRecords = { ...courseRecords };

    for(const p of roundPlayers){
      const sc=allScores[p]||Array(18).fill(null);const total=sc.reduce((s,v)=>s+(v||0),0);const hio=countHIO(sc);const hd=useHdcp?(hdcps[p]||null):null;
      // Derive totalPutts from shotLogs
      const logs = allShotLogs[p] || [];
      const derivedPutts = logs.reduce((sum, holeLogs) => sum + (holeLogs || []).filter(s => s.type === "putt").length, 0) || null;

      if(p===me||!isLive||isKeeperHost){
        await saveRoundToDB({
          player:p, course:selCourse.name, courseLevel:selCourse.level,
          date:new Date().toISOString().split("T")[0],
          scores:sc, total, par:totalPar,
          holesPlayed:sc.filter(v=>v!==null).length,
          diff:total-totalPar, holeInOnes:hio,
          hidden:hideScores, hdcp:hd, adjTotal:hd?total-hd:null,
          sealedMatchId:activeLeagueMatch&&activeLeagueMatch.matchId!=="s1-final"?activeLeagueMatch.matchId:null,
          // ─── NEW FIELDS (Feature 3) ───
          shotLogs: allShotLogs[p] || null,
          totalPutts: derivedPutts,
          courseHoles: selCourse.holes
        });
        if(activeTourney){
          const tJoin=tEntries.find(e=>e.tournamentId===activeTourney.key&&e.player===p&&e.round===0);const tHd=tJoin?.hdcp||hd;
          const existing=tEntries.find(e=>e.tournamentId===activeTourney.key&&e.player===p&&e.round===activeTourney.round);
          if(!existing){await addDoc(collection(db,"pgaTourneys"),{tournamentId:activeTourney.key,player:p,round:activeTourney.round,scores:sc,total,par:totalPar,hdcp:tHd,adjTotal:tHd?total-tHd:null,holeInOnes:hio,date:new Date().toISOString().split("T")[0],createdAt:Date.now()});}
        }
      }
    }

    // ─── LEAGUE MATCH SAVE ─────────────────────────────
    if(activeLeagueMatch && activeLeagueMatch.matchId !== "s1-final"){
      const match = leagueMatches.find(m=>m.id===activeLeagueMatch.matchId);
      if(match){
        const sc=allScores[me]||Array(18).fill(null);
        const total=sc.reduce((s,v)=>s+(v||0),0);
        const isP1=match.player1===me;
        const updates={};
        if(isP1){
          updates.p1Total=total;updates.p1Par=totalPar;updates.p1Scores=sc;
          if(!match.course)updates.course=selCourse.name;
        }else{
          updates.p2Total=total;updates.p2Par=totalPar;updates.p2Scores=sc;
          if(!match.course)updates.course=selCourse.name;
        }
        const p1Done=isP1?true:(match.p1Total!=null);
        const p2Done=isP1?(match.p2Total!=null):true;
        const p1Tot=isP1?total:match.p1Total;
        const p2Tot=isP1?match.p2Total:total;
        if(p1Done&&p2Done&&p1Tot!=null&&p2Tot!=null){
          updates.status="complete";updates.resultsSeenBy=[];
          if(p1Tot<p2Tot){updates.winner=match.player1;updates.margin=p2Tot-p1Tot;}
          else if(p2Tot<p1Tot){updates.winner=match.player2;updates.margin=p1Tot-p2Tot;}
          else{updates.winner="Tie";updates.margin=0;}
        }else{updates.status="in-progress";}
        await updateDoc(doc(db,"leagueMatches",match.id),updates);
        if(updates.status==="complete"){await checkLeagueProgress(match.leagueId);}
      }
    }

    if(isLive){await syncMyScores();}

    // ─── COURSE RECORD CHECK (Feature 2) ───
    let recordBroken = false;
    const courseName = selCourse.name;
    for (const p of roundPlayers) {
      const sc = allScores[p] || Array(18).fill(null);
      const total = sc.reduce((s, v) => s + (v || 0), 0);
      const holesPlayed = sc.filter(v => v !== null).length;
      if (holesPlayed !== 18) continue;
      const old = preRecords[courseName];
      if (!old || total < old.total) {
        const dest = activeTourney ? "home" : activeLeagueMatch ? "league" : "leaderboard";
        setNewRecordInfo({ player: p, course: courseName, newScore: total, newPar: totalPar, oldRecord: old || null, navigateTo: dest });
        recordBroken = true;
        break;
      }
    }

    if (!recordBroken) {
      if(activeTourney){setActiveTourney(null);setShowTourney(true);setTab("home");}
      else if(activeLeagueMatch){setActiveLeagueMatch(null);setTab("league");}
      else setTab("leaderboard");
    }
    if(isLive)leaveLive();
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
      const ps=fmt.playoffSize;
      const seeds=sorted.slice(0,ps);
      if(ps<=2){
        await addDoc(collection(db,"leagueMatches"),{leagueId,round:lg.totalRounds+1,matchNum:1,roundType:"F",player1:seeds[0]?.player,player2:seeds[1]?.player,course:null,p1Total:null,p2Total:null,p1Par:null,p2Par:null,p1Scores:null,p2Scores:null,winner:null,margin:null,status:"pending",createdAt:Date.now()});
      }else if(ps<=4){
        await addDoc(collection(db,"leagueMatches"),{leagueId,round:lg.totalRounds+1,matchNum:1,roundType:"SF",player1:seeds[0]?.player,player2:seeds[3]?.player,course:null,p1Total:null,p2Total:null,p1Par:null,p2Par:null,p1Scores:null,p2Scores:null,winner:null,margin:null,status:"pending",createdAt:Date.now()});
        await addDoc(collection(db,"leagueMatches"),{leagueId,round:lg.totalRounds+1,matchNum:2,roundType:"SF",player1:seeds[1]?.player,player2:seeds[2]?.player,course:null,p1Total:null,p2Total:null,p1Par:null,p2Par:null,p1Scores:null,p2Scores:null,winner:null,margin:null,status:"pending",createdAt:Date.now()});
        await addDoc(collection(db,"leagueMatches"),{leagueId,round:lg.totalRounds+2,matchNum:1,roundType:"F",player1:null,player2:null,course:null,p1Total:null,p2Total:null,p1Par:null,p2Par:null,p1Scores:null,p2Scores:null,winner:null,margin:null,status:"pending",createdAt:Date.now()});
      }else{
        const qfMatches=[];
        if(ps>=7){qfMatches.push([seeds[4]?.player,seeds[3]?.player]);qfMatches.push([seeds[1]?.player,seeds[6]?.player]);qfMatches.push([seeds[2]?.player,seeds[5]?.player]);}
        else{qfMatches.push([seeds[2]?.player,seeds[5]?.player]);qfMatches.push([seeds[3]?.player,seeds[4]?.player]);}
        for(let i=0;i<qfMatches.length;i++){await addDoc(collection(db,"leagueMatches"),{leagueId,round:lg.totalRounds+1,matchNum:i+1,roundType:"QF",player1:qfMatches[i][0],player2:qfMatches[i][1],course:null,p1Total:null,p2Total:null,p1Par:null,p2Par:null,p1Scores:null,p2Scores:null,winner:null,margin:null,status:"pending",createdAt:Date.now()});}
        await addDoc(collection(db,"leagueMatches"),{leagueId,round:lg.totalRounds+2,matchNum:1,roundType:"SF",player1:seeds[0]?.player,player2:null,course:null,p1Total:null,p2Total:null,p1Par:null,p2Par:null,p1Scores:null,p2Scores:null,winner:null,margin:null,status:"pending",createdAt:Date.now()});
        await addDoc(collection(db,"leagueMatches"),{leagueId,round:lg.totalRounds+2,matchNum:2,roundType:"SF",player1:ps>=7?null:seeds[1]?.player,player2:null,course:null,p1Total:null,p2Total:null,p1Par:null,p2Par:null,p1Scores:null,p2Scores:null,winner:null,margin:null,status:"pending",createdAt:Date.now()});
        await addDoc(collection(db,"leagueMatches"),{leagueId,round:lg.totalRounds+3,matchNum:1,roundType:"F",player1:null,player2:null,course:null,p1Total:null,p2Total:null,p1Par:null,p2Par:null,p1Scores:null,p2Scores:null,winner:null,margin:null,status:"pending",createdAt:Date.now()});
      }
      await updateDoc(doc(db,"leagues",leagueId),{status:"playoffs"});
    }
  }

  function setQuickScore(player,hole,val){setAllScores(s=>{const ns={...s};ns[player]=[...(ns[player]||Array(18).fill(null))];ns[player][hole]=val===""?null:Math.max(1,Math.min(15,parseInt(val)||null));return ns;});}
  function getRunningScore(player){
    const sc=allScores[player]||Array(18).fill(null);const thru=curHole;
    const completed=sc.slice(0,thru).reduce((s,v)=>s+(v||0),0);
    const parThru=selCourse.holes.slice(0,thru).reduce((s,h)=>s+h.par,0);
    return{total:completed,par:parThru,thru};
  }

  // ─── FEATURE FUNCTIONS ─────────────────────────────────
  function openRoundDetail(round) { setDetailRound(round); setEditingRound(false); setEditScores(null); setShareOverlay(false); }
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

    await updateDoc(doc(db, "rounds", detailRound.id), {
      scores: editScores, total: newTotal, diff: newDiff,
      holesPlayed: newHolesPlayed, holeInOnes: newHIO,
      shotLogs: newShotLogs, totalPutts: newTotalPutts,
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
  const playerStats=playerNames.map(name=>{const pr=rounds.filter(r=>r.player===name&&r.holesPlayed===18);const unsealed=pr.filter(r=>!isRoundSealed(r,leagueMatches,me));const hcp=calcHandicap(unsealed);const best=unsealed.length?Math.min(...unsealed.map(r=>r.total)):null;const avg=unsealed.length?Math.round(unsealed.reduce((s,r)=>s+r.total,0)/unsealed.length*10)/10:null;const hio=rounds.filter(r=>r.player===name&&!isRoundSealed(r,leagueMatches,me)).reduce((s,r)=>s+(r.holeInOnes||countHIO(r.scores)||0),0);return{name,rounds:unsealed.length,handicap:hcp,best,avg,holeInOnes:hio};}).sort((a,b)=>(a.handicap??999)-(b.handicap??999));
  const courseRecords = computeCourseRecords(rounds, leagueMatches, me);
  const pgaThisWeek=getPGACourse();
  const tId=pgaThisWeek?.start;const curTE=tId?tEntries.filter(e=>e.tournamentId===tId):[];
  const tJoined=[...new Set(curTE.map(e=>e.player))];const iMeJoined=tJoined.includes(me);
  const myTRnds=curTE.filter(e=>e.player===me&&e.round>0).sort((a,b)=>a.round-b.round);const myNextRd=myTRnds.length+1;
  const tBoard=tJoined.map(p=>{const rnds=curTE.filter(e=>e.player===p&&e.round>0).sort((a,b)=>a.round-b.round);const tot=rnds.reduce((s,r)=>s+r.total,0);const par=rnds.reduce((s,r)=>s+r.par,0);const joinE=curTE.find(e=>e.player===p&&e.round===0);const hd=joinE?.hdcp||null;const adjTot=hd?rnds.reduce((s,r)=>s+(r.total-hd),0):null;const rScores={};rnds.forEach(r=>{rScores[r.round]={total:r.total,par:r.par};});return{player:p,rnds,tot,par,played:rnds.length,hd,adjTot,rScores};}).filter(p=>p.played>0).sort((a,b)=>tShowAdj&&a.adjTot!=null&&b.adjTot!=null?(a.adjTot-b.adjTot):((a.tot-a.par)-(b.tot-b.par)));
  const tPar=pgaThisWeek?pgaThisWeek.holes.reduce((s,h)=>s+h.par,0):72;

  const LiveBadge=()=>isLive?<div style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:8,padding:"6px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:4,background:C.red,animation:"pulse 1.5s infinite"}}/><span style={{fontSize:12,fontWeight:700,color:C.red}}>LIVE</span><span style={{fontSize:12,color:C.text,fontWeight:700,letterSpacing:2}}>{liveData.code}</span></div><div style={{fontSize:10,color:C.muted}}>{liveData.players.length} player{liveData.players.length!==1?"s":""} · {liveScoreMode==="keeper"?"1 Scorekeeper":"Self-Score"}</div></div>:null;

  const LeagueMatchBadge=()=>activeLeagueMatch?<div style={{background:activeLeagueMatch.isChampionship?"rgba(212,184,74,0.15)":"rgba(74,170,74,0.15)",border:`1px solid ${activeLeagueMatch.isChampionship?"rgba(212,184,74,0.4)":"rgba(74,170,74,0.4)"}`,borderRadius:8,padding:"6px 10px",textAlign:"center"}}><span style={{fontSize:12,fontWeight:700,color:activeLeagueMatch.isChampionship?C.gold:C.greenLt}}>{activeLeagueMatch.isChampionship?"🏆 CHAMPIONSHIP ROUND":"⚡ League Match"}</span></div>:null;

  const ScorecardView=()=>(<div style={{background:C.card,borderRadius:12,border:`1px solid ${C.greenLt}`,overflow:"hidden"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:C.accent}}><span style={{fontWeight:700,fontSize:13}}>📋 Scorecard</span><button onClick={()=>setShowScorecard(false)} style={{background:"transparent",border:"none",color:C.text,cursor:"pointer",fontSize:14}}>✕</button></div><div style={{overflowX:"auto",padding:6}}>{[0,9].map(start=>(<table key={start} style={{width:"100%",borderCollapse:"collapse",fontSize:9,marginBottom:start===0?4:0,minWidth:420}}><thead><tr style={{background:C.accent}}><th style={{padding:"3px 4px",textAlign:"left",minWidth:40}}>HOLE</th>{selCourse.holes.slice(start,start+9).map(h=><th key={h.num} style={{padding:"3px 1px",textAlign:"center",minWidth:24,background:h.num-1===curHole?"rgba(74,170,74,0.3)":"transparent"}}>{h.num}</th>)}<th style={{padding:"3px 3px",textAlign:"center",minWidth:30}}>{start===0?"OUT":"IN"}</th>{start===9&&<th style={{padding:"3px 3px",textAlign:"center",minWidth:30}}>TOT</th>}</tr></thead><tbody><tr style={{background:C.card2}}><td style={{padding:"2px 4px",fontWeight:600,color:C.greenLt,fontSize:8}}>RNG</td>{selCourse.holes.slice(start,start+9).map(h=><td key={h.num} style={{textAlign:"center",fontSize:7,color:C.muted}}>{fmtR(h.range)}</td>)}<td style={{textAlign:"center",fontSize:7,color:C.muted}}>{fmtRange(selCourse.holes,start,start+9)}</td>{start===9&&<td style={{textAlign:"center",fontSize:7,color:C.muted}}>{fmtRange(selCourse.holes,0,18)}</td>}</tr><tr><td style={{padding:"2px 4px",fontWeight:600,fontSize:9}}>PAR</td>{selCourse.holes.slice(start,start+9).map(h=><td key={h.num} style={{textAlign:"center",padding:"2px 1px"}}>{h.par}</td>)}<td style={{textAlign:"center",fontWeight:700}}>{calcPar(selCourse.holes,start,start+9)}</td>{start===9&&<td style={{textAlign:"center",fontWeight:700,color:C.greenLt}}>{selCourse.holes.reduce((s,h)=>s+h.par,0)}</td>}</tr>{!hideScores&&roundPlayers.map(p=>{const sc=allScores[p]||Array(18).fill(null);return(<tr key={p} style={{borderTop:`1px solid ${C.border}`}}><td style={{padding:"2px 4px",fontWeight:600,fontSize:8}}>{p}{isLive&&p!==me?<span style={{color:C.blue,fontSize:7}}> 📡</span>:""}</td>{selCourse.holes.slice(start,start+9).map((h,i)=>{const idx=start+i;const v=sc[idx];return<td key={h.num} style={{textAlign:"center",fontSize:9,fontWeight:700,color:v===1?"#ff6b00":v!==null&&v<h.par?C.greenLt:v!==null&&v>h.par?"#ff6b6b":v!==null?C.text:C.muted,background:h.num-1===curHole?"rgba(74,170,74,0.1)":"transparent"}}>{v??"-"}</td>;})}<td style={{textAlign:"center",fontWeight:700,fontSize:9}}>{sc.slice(start,start+9).reduce((s,v)=>s+(v||0),0)||"-"}</td>{start===9&&<td style={{textAlign:"center",fontWeight:700,fontSize:9,color:C.greenLt}}>{sc.reduce((s,v)=>s+(v||0),0)||"-"}</td>}</tr>);})}</tbody></table>))}</div></div>);

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
      <div style={{background:activeLeagueMatch?.isChampionship?"linear-gradient(135deg,#2a1a00,#3a2a00)":C.headerBg,padding:"14px 20px",borderBottom:`2px solid ${activeLeagueMatch?.isChampionship?"#d4b84a":C.green}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:34,height:34,borderRadius:"50%",background:activeLeagueMatch?.isChampionship?"rgba(212,184,74,0.3)":C.accent,border:`2px solid ${activeLeagueMatch?.isChampionship?"#d4b84a":C.greenLt}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{activeLeagueMatch?.isChampionship?"🏆":"⛳"}</div><div><div style={{fontWeight:700,fontSize:17,letterSpacing:2,textTransform:"uppercase",color:activeLeagueMatch?.isChampionship?"#d4b84a":C.text}}>{activeLeagueMatch?.isChampionship?"Championship":"Slide Golf"}</div><div style={{fontSize:10,color:C.muted,letterSpacing:1}}>{activeLeagueMatch?.isChampionship?"SEASON 1 FINALS":"LEAGUE TRACKER"}</div></div></div><div style={{display:"flex",alignItems:"center",gap:8}}>{isLive&&<span style={{fontSize:10,color:C.red,fontWeight:700}}>🔴 LIVE</span>}<span style={{fontSize:12,color:activeLeagueMatch?.isChampionship?"#d4b84a":C.greenLt}}>{me}</span><button onClick={()=>{setMe("");try{localStorage.removeItem("sg-me");}catch(e){}}} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:10}}>Switch</button></div></div>
      {/* TABS */}
      <div style={{display:"flex",background:C.card,borderBottom:`1px solid ${C.border}`}}>{[["home","Home"],["courses","Courses"],["play","Play"],["league","League"],["leaderboard","Board"],["stats","Stats"]].map(([k,l])=>(<button key={k} onClick={()=>{setTab(k);if(k==="courses")setCreating(false);if(k!=="home")setShowTourney(false);}} style={{flex:1,padding:"11px 4px",background:tab===k?C.accent:"transparent",color:tab===k?C.white:C.muted,border:"none",cursor:"pointer",fontSize:11,fontWeight:tab===k?700:400,borderBottom:tab===k?`2px solid ${C.greenLt}`:"2px solid transparent"}}>{l}</button>))}</div>

      <div style={{maxWidth:600,margin:"0 auto",padding:16}}>
        {tab==="home"&&<HomeTab me={me} players={players} rounds={rounds} allCourses={allCourses} playerNames={playerNames} pgaThisWeek={pgaThisWeek} showTourney={showTourney} setShowTourney={setShowTourney} showJoin={showJoin} setShowJoin={setShowJoin} joinInput={joinInput} setJoinInput={setJoinInput} joinLive={joinLive} setTab={setTab} setCreating={setCreating} handleGenerate={handleGenerate} iMeJoined={iMeJoined} tJoined={tJoined} curTE={curTE} tEntries={tEntries} tPar={tPar} myTRnds={myTRnds} myNextRd={myNextRd} tBoard={tBoard} tShowAdj={tShowAdj} setTShowAdj={setTShowAdj} myTHdcp={myTHdcp} setMyTHdcp={setMyTHdcp} joinTourney={joinTourney} updateMyTourneyHdcp={updateMyTourneyHdcp} playTourneyRound={playTourneyRound} playCasualPGA={playCasualPGA} leagueMatches={leagueMatches} revealMatchResults={revealMatchResults} openRoundDetail={openRoundDetail}/>}
        {tab==="league"&&<LeagueTab me={me} leagueView={leagueView} setLeagueView={setLeagueView} leagueRdFilter={leagueRdFilter} setLeagueRdFilter={setLeagueRdFilter} leagues={leagues} leagueMatches={leagueMatches} allCourses={allCourses} createLeague={createLeague} joinLeagueByCode={joinLeagueByCode} startLeagueSeason={startLeagueSeason} playLeagueMatch={playLeagueMatch} selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} openPlayerProfile={openPlayerProfile}/>}
        {tab==="courses"&&<CoursesTab allCourses={allCourses} creating={creating} setCreating={setCreating} startRound={startRound} deleteCourseFromDB={deleteCourseFromDB} handleGenerate={handleGenerate} ccName={ccName} setCcName={setCcName} ccLevel={ccLevel} setCcLevel={setCcLevel} ccTournament={ccTournament} setCcTournament={setCcTournament} ccHoles={ccHoles} setCcHolePar={setCcHolePar} setCcHoleRange={setCcHoleRange} ccNine={ccNine} setCcNine={setCcNine} saveCreatedCourse={saveCreatedCourse} resetCreator={resetCreator} courseRecords={courseRecords}/>}
        {tab==="play"&&<><LeagueMatchBadge/><PlayTab me={me} selCourse={selCourse} setSelCourse={setSelCourse} allCourses={allCourses} playMode={playMode} setPlayMode={setPlayMode} pgaThisWeek={pgaThisWeek} roundPlayers={roundPlayers} setRoundPlayers={setRoundPlayers} playerNames={playerNames} addToRound={addToRound} beginPlay={beginPlay} activeTourney={activeTourney} setActiveTourney={setActiveTourney} setShowTourney={setShowTourney} setTab={setTab} hideScores={hideScores} setHideScores={setHideScores} useHdcp={useHdcp} setUseHdcp={setUseHdcp} hdcps={hdcps} setHdcps={setHdcps} allScores={allScores} setAllScores={setAllScores} allShotLogs={allShotLogs} setAllShotLogs={setAllShotLogs} curHole={curHole} curPlayerIdx={curPlayerIdx} setCurPlayerIdx={setCurPlayerIdx} holeState={holeState} showScorecard={showScorecard} setShowScorecard={setShowScorecard} nine={nine} setNine={setNine} setQuickScore={setQuickScore} isLive={isLive} liveData={liveData} liveScoreMode={liveScoreMode} setLiveScoreMode={setLiveScoreMode} isSpectator={isSpectator} isKeeperHost={isKeeperHost} goLive={goLive} leaveLive={leaveLive} recordShot={recordShot} undoShot={undoShot} finishHole={finishHole} goToPrevHole={goToPrevHole} saveRound={saveRound} getRunningScore={getRunningScore} LiveBadge={LiveBadge} ScorecardView={ScorecardView} shareRef={shareRef} generateShareCard={generateShareCard} ScoreCell={ScoreCell}/></>}
        {tab==="leaderboard"&&<LeaderboardTab me={me} playerStats={playerStats} rounds={rounds} deleteRoundFromDB={deleteRoundFromDB} leagueMatches={leagueMatches} openRoundDetail={openRoundDetail} openPlayerProfile={openPlayerProfile} allCourses={allCourses}/>}
        {tab==="stats"&&<StatsTab playerStats={playerStats} rounds={rounds} leagueMatches={leagueMatches} me={me} openPlayerProfile={openPlayerProfile} allCourses={allCourses}/>}
      </div>

      {/* ═══ ROUND DETAIL OVERLAY (Feature 3 + 10 + 17) ═══ */}
      {detailRound && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:9998,overflowY:"auto",padding:"40px 16px"}} onClick={e=>{if(e.target===e.currentTarget)closeRoundDetail();}}>
          <div style={{background:C.bg,borderRadius:16,border:`1px solid ${C.border}`,maxWidth:560,width:"100%",animation:"fadeIn 0.3s ease"}} onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,fontSize:18}}>{detailRound.player}</div>
                <div style={{fontSize:12,color:C.muted}}>{detailRound.course} · {detailRound.date}</div>
                {detailRound.sealedMatchId && <div style={{fontSize:10,color:C.gold,marginTop:2}}>⚡ League Match</div>}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {!editingRound && detailRound.player === me && <button onClick={()=>{setEditingRound(true);setEditScores([...(detailRound.scores||Array(18).fill(null))]);}} style={{...btnS(false),padding:"6px 12px",fontSize:11}}>✏️ Edit</button>}
                {!editingRound && <button onClick={()=>setShareOverlay(true)} style={{...btnS(false),padding:"6px 12px",fontSize:11}}>📤 Share</button>}
                <button onClick={closeRoundDetail} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:20,lineHeight:1}}>✕</button>
              </div>
            </div>

            {/* Scorecard */}
            <div style={{padding:"12px 10px",overflowX:"auto"}}>
              {[0,9].map(start=>{
                const holes = detailRound.courseHoles || allCourses.find(c=>c.name===detailRound.course)?.holes;
                return <table key={start} style={{width:"100%",borderCollapse:"collapse",fontSize:10,marginBottom:start===0?6:0,minWidth:420}}>
                  <thead><tr style={{background:C.accent}}>
                    <th style={{padding:"4px 6px",textAlign:"left",minWidth:44}}>HOLE</th>
                    {(holes||[]).slice(start,start+9).map((h,i)=><th key={i} style={{padding:"4px 2px",textAlign:"center",minWidth:28}}>{start+i+1}</th>)}
                    <th style={{padding:"4px 4px",textAlign:"center",fontWeight:700,minWidth:36}}>{start===0?"OUT":"IN"}</th>
                    {start===9&&<th style={{padding:"4px 4px",textAlign:"center",fontWeight:700,minWidth:36}}>TOT</th>}
                  </tr></thead>
                  <tbody>
                    {holes && <tr style={{background:C.card2}}>
                      <td style={{padding:"3px 6px",fontWeight:600,color:C.greenLt,fontSize:9}}>RANGE</td>
                      {holes.slice(start,start+9).map((h,i)=><td key={i} style={{textAlign:"center",fontSize:8,color:C.muted}}>{fmtR(h.range)}</td>)}
                      <td style={{textAlign:"center",fontSize:8,color:C.muted}}>{holes?fmtRange(holes,start,start+9):""}</td>
                      {start===9&&<td style={{textAlign:"center",fontSize:8,color:C.muted}}>{holes?fmtRange(holes,0,18):""}</td>}
                    </tr>}
                    {holes && <tr>
                      <td style={{padding:"3px 6px",fontWeight:600}}>PAR</td>
                      {holes.slice(start,start+9).map((h,i)=><td key={i} style={{textAlign:"center"}}>{h.par}</td>)}
                      <td style={{textAlign:"center",fontWeight:700}}>{holes?calcPar(holes,start,start+9):""}</td>
                      {start===9&&<td style={{textAlign:"center",fontWeight:700,color:C.greenLt}}>{holes?holes.reduce((s,h)=>s+h.par,0):""}</td>}
                    </tr>}
                    <tr style={{borderTop:`1px solid ${C.border}`}}>
                      <td style={{padding:"3px 6px",fontWeight:600,fontSize:9}}>SCORE</td>
                      {(editingRound ? editScores : detailRound.scores || []).slice(start,start+9).map((v,i)=>{
                        const idx = start+i;
                        if (editingRound) {
                          return <td key={i} style={{padding:2}}><input value={editScores[idx]??""} onChange={e=>{const ns=[...editScores];ns[idx]=e.target.value===""?null:Math.max(1,Math.min(15,parseInt(e.target.value)||null));setEditScores(ns);}} style={{...smallInput,width:28,fontSize:11}}/></td>;
                        }
                        const par = holes?.[idx]?.par;
                        return par != null ? <ScoreCell key={i} score={v} par={par} size={22} fontSize={11}/> :
                          <td key={i} style={{textAlign:"center",fontWeight:700,fontSize:11}}>{v??"-"}</td>;
                      })}
                      <td style={{textAlign:"center",fontWeight:700,fontSize:10}}>{(editingRound?editScores:detailRound.scores||[]).slice(start,start+9).reduce((s,v)=>s+(v||0),0)||"-"}</td>
                      {start===9&&<td style={{textAlign:"center",fontWeight:700,fontSize:10,color:C.greenLt}}>{(editingRound?editScores:detailRound.scores||[]).reduce((s,v)=>s+(v||0),0)||"-"}</td>}
                    </tr>
                  </tbody>
                </table>;
              })}
            </div>

            {/* Edit buttons */}
            {editingRound && <div style={{padding:"8px 16px",display:"flex",gap:8}}>
              <button onClick={()=>{setEditingRound(false);setEditScores(null);}} style={{...btnS(false),flex:1,padding:10,fontSize:12}}>Cancel</button>
              <button onClick={saveEditedRound} style={{...btnS(true),flex:1,padding:10,fontSize:12}}>💾 Save Changes</button>
            </div>}

            {/* Summary stats */}
            {!editingRound && <div style={{display:"flex",justifyContent:"space-around",padding:"12px 16px",borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700}}>{detailRound.total}</div><div style={{fontSize:9,color:C.muted}}>Total</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700}}><RelPar s={detailRound.total} p={detailRound.par}/></div><div style={{fontSize:9,color:C.muted}}>To Par</div></div>
              {detailRound.totalPutts != null && <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:C.blue}}>{detailRound.totalPutts}</div><div style={{fontSize:9,color:C.muted}}>Putts</div></div>}
              {detailRound.shotLogs && <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:C.red}}>{detailRound.shotLogs.reduce((s,h)=>s+(h||[]).filter(sh=>sh.type==="OB").length,0)}</div><div style={{fontSize:9,color:C.muted}}>OB</div></div>}
              <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:"#ff6b00"}}>{detailRound.holeInOnes||0}</div><div style={{fontSize:9,color:C.muted}}>HIO</div></div>
            </div>}

            {/* Shot timeline */}
            {!editingRound && detailRound.shotLogs && <div style={{padding:"12px 16px",maxHeight:400,overflowY:"auto"}}>
              <div style={{fontWeight:600,fontSize:12,marginBottom:8}}>Shot Timeline</div>
              {detailRound.shotLogs.map((holeLogs,hIdx)=>{
                const holes = detailRound.courseHoles || allCourses.find(c=>c.name===detailRound.course)?.holes;
                const par = holes?.[hIdx]?.par;
                const range = holes?.[hIdx]?.range;
                const score = detailRound.scores?.[hIdx];
                if (!holeLogs || !holeLogs.length) return null;
                return <div key={hIdx} style={{marginBottom:8,padding:8,background:C.card,borderRadius:8,border:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <span style={{fontWeight:700,fontSize:11}}>Hole {hIdx+1} {par!=null&&<span style={{color:C.muted,fontWeight:400}}>· Par {par}{range?` · ${fmtR(range)}`:""}</span>}</span>
                    {score!=null && <span style={{fontWeight:700,fontSize:12,color:par!=null&&score<par?C.greenLt:par!=null&&score>par?C.red:C.text}}>{score}</span>}
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {holeLogs.map((shot,sIdx)=>{
                      let bg=C.card2, color=C.text, label="";
                      if(shot.type==="slide"){
                        label = shot.dir==="sub"?`-${shot.val}`:`+${shot.val}`;
                        bg = shot.dir==="sub"?"rgba(138,180,248,0.15)":"rgba(74,170,74,0.15)";
                        color = shot.dir==="sub"?C.blue:C.greenLt;
                      } else if(shot.type==="OB"){
                        label="OB"; bg="rgba(239,68,68,0.15)"; color=C.red;
                      } else if(shot.type==="putt"){
                        label=shot.val==="Made"?"Putt: Made ✓":"Putt: Miss";
                        bg=shot.val==="Made"?"rgba(74,170,74,0.15)":"rgba(138,180,248,0.15)";
                        color=shot.val==="Made"?C.greenLt:C.blue;
                      } else if(shot.type==="holeout"){
                        label="Hole Out!"; bg="rgba(255,107,0,0.15)"; color="#ff6b00";
                      }
                      return <span key={sIdx} style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:600,background:bg,color}}>{label}</span>;
                    })}
                  </div>
                </div>;
              })}
            </div>}

            {!editingRound && !detailRound.shotLogs && <div style={{padding:"16px",textAlign:"center",color:C.muted,fontSize:12}}>Shot data not available for this round</div>}

            {/* Delete button */}
            {!editingRound && detailRound.player === me && <div style={{padding:"8px 16px 16px",borderTop:`1px solid ${C.border}`}}>
              <button onClick={()=>{if(confirm(`Delete this round?`)){deleteRoundFromDB(detailRound.id);closeRoundDetail();}}} style={{background:"transparent",border:`1px solid rgba(239,68,68,0.3)`,color:C.red,borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:11,width:"100%"}}>🗑 Delete Round</button>
            </div>}
          </div>
        </div>
      )}

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
              {ach.recentRounds.map(r=><div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`,fontSize:12,cursor:"pointer"}} onClick={()=>openRoundDetail(r)}>
                <div><span style={{fontWeight:600}}>{r.course}</span><span style={{color:C.muted,fontSize:10,marginLeft:6}}>{r.date}</span></div>
                <div style={{display:"flex",gap:4,alignItems:"center"}}><span style={{fontWeight:700}}>{r.total}</span><RelPar s={r.total} p={r.par}/></div>
              </div>)}
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
