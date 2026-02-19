import { useState, useEffect } from "react";
import { db } from "./firebase.js";
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, updateDoc, where, getDocs, getDoc
} from "firebase/firestore";

// ─── DATA IMPORTS ───────────────────────────────────────
import { COURSES } from "./data/courses.js";
import { PGA_2026, getPGACourse } from "./data/pga2026.js";

// ─── UTILITY IMPORTS ────────────────────────────────────
import { calcPar, fmtRange, fmtR, calcHandicap, countHIO, scoreName, RelPar, genLiveCode, calcNeed } from "./utils/helpers.jsx";
import { generateCourse } from "./utils/generate.js";
import { C, btnS, inputS, smallInput } from "./utils/theme.js";

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

  const allCourses=[...COURSES,...customCourses];
  const isLive=!!liveId&&!!liveData;
  const isKeeperHost=isLive&&liveScoreMode==="keeper"&&liveData?.host===me;
  const isSpectator=isLive&&liveScoreMode==="keeper"&&liveData?.host!==me;

  // ─── FIREBASE LISTENERS ────────────────────────────────
  useEffect(()=>{const u=[];u.push(onSnapshot(collection(db,"players"),s=>{setPlayers(s.docs.map(d=>({id:d.id,...d.data()})));}));u.push(onSnapshot(query(collection(db,"rounds"),orderBy("createdAt","desc")),s=>{setRounds(s.docs.map(d=>({id:d.id,...d.data()})));}));u.push(onSnapshot(collection(db,"customCourses"),s=>{setCustomCourses(s.docs.map(d=>({id:d.id,...d.data(),generated:true})));}));u.push(onSnapshot(collection(db,"pgaTourneys"),s=>{setTEntries(s.docs.map(d=>({id:d.id,...d.data()})));}));setLoaded(true);return()=>u.forEach(x=>x());},[]);

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

  // ─── COURSE CREATOR ────────────────────────────────────
  function resetCreator(){setCcName("");setCcLevel("Medium");setCcTournament("");setCcHoles(Array.from({length:18},(_,i)=>({num:i+1,par:4,rangeMin:10,rangeMax:12})));setCcNine(0);}
  function setCcHolePar(idx,par){setCcHoles(prev=>{const n=[...prev];n[idx]={...n[idx],par};return n;});}
  function setCcHoleRange(idx,field,val){const v=parseInt(val)||0;setCcHoles(prev=>{const n=[...prev];n[idx]={...n[idx],[field]:Math.max(1,Math.min(30,v))};return n;});}
  async function saveCreatedCourse(){if(!ccName.trim())return;const holes=ccHoles.map(h=>({num:h.num,par:h.par,range:[h.rangeMin,Math.max(h.rangeMin,h.rangeMax)]}));await saveCoursetoDB({name:ccName.trim(),level:ccLevel,holes,tournament:ccTournament.trim()});setCreating(false);resetCreator();}
  async function handleGenerate(diff){const en=[...allCourses.map(c=>c.name),...PGA_2026.map(c=>c.name)];const course=generateCourse(diff,en);await saveCoursetoDB(course);setSelCourse({...course,generated:true});setRoundPlayers([]);setAllScores({});setAllShotLogs({});setPlayMode("setup");setCurHole(0);setCurPlayerIdx(0);setHideScores(false);setTab("play");}

  // ─── PLAY FUNCTIONS ────────────────────────────────────
  function startRound(course){setSelCourse(course);setRoundPlayers([]);setAllScores({});setAllShotLogs({});setPlayMode("setup");setCurHole(0);setCurPlayerIdx(0);setHideScores(false);setActiveTourney(null);setLiveId(null);setLiveData(null);setSavedHoleStates({});setTab("play");}
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
    for(const p of roundPlayers){
      const sc=allScores[p]||Array(18).fill(null);const total=sc.reduce((s,v)=>s+(v||0),0);const hio=countHIO(sc);const hd=useHdcp?(hdcps[p]||null):null;
      if(p===me||!isLive||isKeeperHost){
        await saveRoundToDB({player:p,course:selCourse.name,courseLevel:selCourse.level,date:new Date().toISOString().split("T")[0],scores:sc,total,par:totalPar,holesPlayed:sc.filter(v=>v!==null).length,diff:total-totalPar,holeInOnes:hio,hidden:hideScores,hdcp:hd,adjTotal:hd?total-hd:null});
        if(activeTourney){
          const tJoin=tEntries.find(e=>e.tournamentId===activeTourney.key&&e.player===p&&e.round===0);const tHd=tJoin?.hdcp||hd;
          const existing=tEntries.find(e=>e.tournamentId===activeTourney.key&&e.player===p&&e.round===activeTourney.round);
          if(!existing){await addDoc(collection(db,"pgaTourneys"),{tournamentId:activeTourney.key,player:p,round:activeTourney.round,scores:sc,total,par:totalPar,hdcp:tHd,adjTotal:tHd?total-tHd:null,holeInOnes:hio,date:new Date().toISOString().split("T")[0],createdAt:Date.now()});}
        }
      }
    }
    if(isLive){await syncMyScores();}
    if(activeTourney){setActiveTourney(null);setShowTourney(true);setTab("home");}else setTab("leaderboard");
    if(isLive)leaveLive();
  }
  function setQuickScore(player,hole,val){setAllScores(s=>{const ns={...s};ns[player]=[...(ns[player]||Array(18).fill(null))];ns[player][hole]=val===""?null:Math.max(1,Math.min(15,parseInt(val)||null));return ns;});}
  function getRunningScore(player){
    const sc=allScores[player]||Array(18).fill(null);const thru=curHole;
    const completed=sc.slice(0,thru).reduce((s,v)=>s+(v||0),0);
    const parThru=selCourse.holes.slice(0,thru).reduce((s,h)=>s+h.par,0);
    return{total:completed,par:parThru,thru};
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
  const playerStats=playerNames.map(name=>{const pr=rounds.filter(r=>r.player===name&&r.holesPlayed===18);const hcp=calcHandicap(pr);const best=pr.length?Math.min(...pr.map(r=>r.total)):null;const avg=pr.length?Math.round(pr.reduce((s,r)=>s+r.total,0)/pr.length*10)/10:null;const hio=rounds.filter(r=>r.player===name).reduce((s,r)=>s+(r.holeInOnes||countHIO(r.scores)||0),0);return{name,rounds:pr.length,handicap:hcp,best,avg,holeInOnes:hio};}).sort((a,b)=>(a.handicap??999)-(b.handicap??999));
  const pgaThisWeek=getPGACourse();
  const tId=pgaThisWeek?.start;const curTE=tId?tEntries.filter(e=>e.tournamentId===tId):[];
  const tJoined=[...new Set(curTE.map(e=>e.player))];const iMeJoined=tJoined.includes(me);
  const myTRnds=curTE.filter(e=>e.player===me&&e.round>0).sort((a,b)=>a.round-b.round);const myNextRd=myTRnds.length+1;
  const tBoard=tJoined.map(p=>{const rnds=curTE.filter(e=>e.player===p&&e.round>0).sort((a,b)=>a.round-b.round);const tot=rnds.reduce((s,r)=>s+r.total,0);const par=rnds.reduce((s,r)=>s+r.par,0);const joinE=curTE.find(e=>e.player===p&&e.round===0);const hd=joinE?.hdcp||null;const adjTot=hd?rnds.reduce((s,r)=>s+(r.total-hd),0):null;const rScores={};rnds.forEach(r=>{rScores[r.round]={total:r.total,par:r.par};});return{player:p,rnds,tot,par,played:rnds.length,hd,adjTot,rScores};}).filter(p=>p.played>0).sort((a,b)=>tShowAdj&&a.adjTot!=null&&b.adjTot!=null?(a.adjTot-b.adjTot):((a.tot-a.par)-(b.tot-b.par)));
  const tPar=pgaThisWeek?pgaThisWeek.holes.reduce((s,h)=>s+h.par,0):72;

  const LiveBadge=()=>isLive?<div style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:8,padding:"6px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:4,background:C.red,animation:"pulse 1.5s infinite"}}/><span style={{fontSize:12,fontWeight:700,color:C.red}}>LIVE</span><span style={{fontSize:12,color:C.text,fontWeight:700,letterSpacing:2}}>{liveData.code}</span></div><div style={{fontSize:10,color:C.muted}}>{liveData.players.length} player{liveData.players.length!==1?"s":""} · {liveScoreMode==="keeper"?"1 Scorekeeper":"Self-Score"}</div></div>:null;

  const ScorecardView=()=>(<div style={{background:C.card,borderRadius:12,border:`1px solid ${C.greenLt}`,overflow:"hidden"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:C.accent}}><span style={{fontWeight:700,fontSize:13}}>📋 Scorecard</span><button onClick={()=>setShowScorecard(false)} style={{background:"transparent",border:"none",color:C.text,cursor:"pointer",fontSize:14}}>✕</button></div><div style={{overflowX:"auto",padding:6}}>{[0,9].map(start=>(<table key={start} style={{width:"100%",borderCollapse:"collapse",fontSize:9,marginBottom:start===0?4:0,minWidth:420}}><thead><tr style={{background:C.accent}}><th style={{padding:"3px 4px",textAlign:"left",minWidth:40}}>HOLE</th>{selCourse.holes.slice(start,start+9).map(h=><th key={h.num} style={{padding:"3px 1px",textAlign:"center",minWidth:24,background:h.num-1===curHole?"rgba(74,170,74,0.3)":"transparent"}}>{h.num}</th>)}<th style={{padding:"3px 3px",textAlign:"center",minWidth:30}}>{start===0?"OUT":"IN"}</th>{start===9&&<th style={{padding:"3px 3px",textAlign:"center",minWidth:30}}>TOT</th>}</tr></thead><tbody><tr style={{background:C.card2}}><td style={{padding:"2px 4px",fontWeight:600,color:C.greenLt,fontSize:8}}>RNG</td>{selCourse.holes.slice(start,start+9).map(h=><td key={h.num} style={{textAlign:"center",fontSize:7,color:C.muted}}>{fmtR(h.range)}</td>)}<td style={{textAlign:"center",fontSize:7,color:C.muted}}>{fmtRange(selCourse.holes,start,start+9)}</td>{start===9&&<td style={{textAlign:"center",fontSize:7,color:C.muted}}>{fmtRange(selCourse.holes,0,18)}</td>}</tr><tr><td style={{padding:"2px 4px",fontWeight:600,fontSize:9}}>PAR</td>{selCourse.holes.slice(start,start+9).map(h=><td key={h.num} style={{textAlign:"center",padding:"2px 1px"}}>{h.par}</td>)}<td style={{textAlign:"center",fontWeight:700}}>{calcPar(selCourse.holes,start,start+9)}</td>{start===9&&<td style={{textAlign:"center",fontWeight:700,color:C.greenLt}}>{selCourse.holes.reduce((s,h)=>s+h.par,0)}</td>}</tr>{!hideScores&&roundPlayers.map(p=>{const sc=allScores[p]||Array(18).fill(null);return(<tr key={p} style={{borderTop:`1px solid ${C.border}`}}><td style={{padding:"2px 4px",fontWeight:600,fontSize:8}}>{p}{isLive&&p!==me?<span style={{color:C.blue,fontSize:7}}> 📡</span>:""}</td>{selCourse.holes.slice(start,start+9).map((h,i)=>{const idx=start+i;const v=sc[idx];return<td key={h.num} style={{textAlign:"center",fontSize:9,fontWeight:700,color:v===1?"#ff6b00":v!==null&&v<h.par?C.greenLt:v!==null&&v>h.par?"#ff6b6b":v!==null?C.text:C.muted,background:h.num-1===curHole?"rgba(74,170,74,0.1)":"transparent"}}>{v??"-"}</td>;})}<td style={{textAlign:"center",fontWeight:700,fontSize:9}}>{sc.slice(start,start+9).reduce((s,v)=>s+(v||0),0)||"-"}</td>{start===9&&<td style={{textAlign:"center",fontWeight:700,fontSize:9,color:C.greenLt}}>{sc.reduce((s,v)=>s+(v||0),0)||"-"}</td>}</tr>);})}</tbody></table>))}</div></div>);

  // ─── RENDER ────────────────────────────────────────────
  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.text}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}} @keyframes hioGlow{0%{text-shadow:0 0 10px #ff6b00}50%{text-shadow:0 0 30px #ff6b00,0 0 60px #ff4400}100%{text-shadow:0 0 10px #ff6b00}}`}</style>
      {/* HEADER */}
      <div style={{background:C.headerBg,padding:"14px 20px",borderBottom:`2px solid ${C.green}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:34,height:34,borderRadius:"50%",background:C.accent,border:`2px solid ${C.greenLt}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>⛳</div><div><div style={{fontWeight:700,fontSize:17,letterSpacing:2,textTransform:"uppercase"}}>Slide Golf</div><div style={{fontSize:10,color:C.muted,letterSpacing:1}}>LEAGUE TRACKER</div></div></div><div style={{display:"flex",alignItems:"center",gap:8}}>{isLive&&<span style={{fontSize:10,color:C.red,fontWeight:700}}>🔴 LIVE</span>}<span style={{fontSize:12,color:C.greenLt}}>{me}</span><button onClick={()=>{setMe("");try{localStorage.removeItem("sg-me");}catch(e){}}} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:10}}>Switch</button></div></div>
      {/* TABS */}
      <div style={{display:"flex",background:C.card,borderBottom:`1px solid ${C.border}`}}>{[["home","Home"],["courses","Courses"],["play","Play"],["league","League"],["leaderboard","Board"],["stats","Stats"]].map(([k,l])=>(<button key={k} onClick={()=>{setTab(k);if(k==="courses")setCreating(false);if(k!=="home")setShowTourney(false);}} style={{flex:1,padding:"11px 4px",background:tab===k?C.accent:"transparent",color:tab===k?C.white:C.muted,border:"none",cursor:"pointer",fontSize:11,fontWeight:tab===k?700:400,borderBottom:tab===k?`2px solid ${C.greenLt}`:"2px solid transparent"}}>{l}</button>))}</div>

      <div style={{maxWidth:600,margin:"0 auto",padding:16}}>
        {tab==="home"&&<HomeTab me={me} players={players} rounds={rounds} allCourses={allCourses} playerNames={playerNames} pgaThisWeek={pgaThisWeek} showTourney={showTourney} setShowTourney={setShowTourney} showJoin={showJoin} setShowJoin={setShowJoin} joinInput={joinInput} setJoinInput={setJoinInput} joinLive={joinLive} setTab={setTab} setCreating={setCreating} handleGenerate={handleGenerate} iMeJoined={iMeJoined} tJoined={tJoined} curTE={curTE} tEntries={tEntries} tPar={tPar} myTRnds={myTRnds} myNextRd={myNextRd} tBoard={tBoard} tShowAdj={tShowAdj} setTShowAdj={setTShowAdj} myTHdcp={myTHdcp} setMyTHdcp={setMyTHdcp} joinTourney={joinTourney} updateMyTourneyHdcp={updateMyTourneyHdcp} playTourneyRound={playTourneyRound} playCasualPGA={playCasualPGA}/>}
        {tab==="league"&&<LeagueTab leagueView={leagueView} setLeagueView={setLeagueView} leagueRdFilter={leagueRdFilter} setLeagueRdFilter={setLeagueRdFilter}/>}
        {tab==="courses"&&<CoursesTab allCourses={allCourses} creating={creating} setCreating={setCreating} startRound={startRound} deleteCourseFromDB={deleteCourseFromDB} handleGenerate={handleGenerate} ccName={ccName} setCcName={setCcName} ccLevel={ccLevel} setCcLevel={setCcLevel} ccTournament={ccTournament} setCcTournament={setCcTournament} ccHoles={ccHoles} setCcHolePar={setCcHolePar} setCcHoleRange={setCcHoleRange} ccNine={ccNine} setCcNine={setCcNine} saveCreatedCourse={saveCreatedCourse} resetCreator={resetCreator}/>}
        {tab==="play"&&<PlayTab me={me} selCourse={selCourse} setSelCourse={setSelCourse} allCourses={allCourses} playMode={playMode} setPlayMode={setPlayMode} pgaThisWeek={pgaThisWeek} roundPlayers={roundPlayers} setRoundPlayers={setRoundPlayers} playerNames={playerNames} addToRound={addToRound} beginPlay={beginPlay} activeTourney={activeTourney} setActiveTourney={setActiveTourney} setShowTourney={setShowTourney} setTab={setTab} hideScores={hideScores} setHideScores={setHideScores} useHdcp={useHdcp} setUseHdcp={setUseHdcp} hdcps={hdcps} setHdcps={setHdcps} allScores={allScores} setAllScores={setAllScores} allShotLogs={allShotLogs} setAllShotLogs={setAllShotLogs} curHole={curHole} curPlayerIdx={curPlayerIdx} setCurPlayerIdx={setCurPlayerIdx} holeState={holeState} showScorecard={showScorecard} setShowScorecard={setShowScorecard} nine={nine} setNine={setNine} setQuickScore={setQuickScore} isLive={isLive} liveData={liveData} liveScoreMode={liveScoreMode} setLiveScoreMode={setLiveScoreMode} isSpectator={isSpectator} isKeeperHost={isKeeperHost} goLive={goLive} leaveLive={leaveLive} recordShot={recordShot} undoShot={undoShot} finishHole={finishHole} goToPrevHole={goToPrevHole} saveRound={saveRound} getRunningScore={getRunningScore} LiveBadge={LiveBadge} ScorecardView={ScorecardView}/>}
        {tab==="leaderboard"&&<LeaderboardTab me={me} playerStats={playerStats} rounds={rounds} deleteRoundFromDB={deleteRoundFromDB}/>}
        {tab==="stats"&&<StatsTab playerStats={playerStats} rounds={rounds}/>}
      </div>
    </div>
  );
}
