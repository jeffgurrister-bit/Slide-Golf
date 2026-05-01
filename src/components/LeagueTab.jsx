import { useState } from "react";
import { S1_STANDINGS, S1_RESULTS, S1_PLAYOFFS, LEAGUE_FORMATS, MIN_LEAGUE_PLAYERS, MAX_LEAGUE_PLAYERS, PLAYOFF_SIZE_OPTIONS, effectivePlayoffSize, computeStandings, generateRRSchedule } from "../data/league.js";
import { C, btnS, inputS } from "../utils/theme.js";
import { effectiveMatchType, championshipFingerprints } from "../utils/helpers.jsx";

export default function LeagueTab({
  me, leagueView, setLeagueView, leagueRdFilter, setLeagueRdFilter,
  leagues, leagueMatches, rounds, allCourses,
  createLeague, updateLeagueConfig, joinLeagueByCode, startLeagueSeason, playLeagueMatch,
  selectedLeague, setSelectedLeague,
  openPlayerProfile,
  renameLeague, swapWeekCourse, setMatchCourse, resetMatch, forfeitMatch, setLeagueHandicap,
  extendMatchDeadline, replacePlayer, addPlayerMidSeason, removePlayerMidSeason
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [newName, setNewName] = useState("");
  // Configurable league options collected at create time.
  const [newHoleCount, setNewHoleCount] = useState(18);
  const [newScheduleType, setNewScheduleType] = useState("single");
  const [newCourseRotation, setNewCourseRotation] = useState("free");
  const [newPlayoffSize, setNewPlayoffSize] = useState("auto"); // "auto" | "0" | "2" | "4" | "8"
  const [newUseHcpScoring, setNewUseHcpScoring] = useState(false);
  const [newHcpSource, setNewHcpSource] = useState("manual"); // "manual" | "auto"
  const [newHcpCap, setNewHcpCap] = useState("");
  const [newDeadlineDays, setNewDeadlineDays] = useState(""); // "" = no deadline
  const [joinCode, setJoinCode] = useState("");
  const [showManage, setShowManage] = useState(false);
  const [showSchedulePreview, setShowSchedulePreview] = useState(false);
  const [manageNameDraft, setManageNameDraft] = useState("");
  const [forfeitTarget, setForfeitTarget] = useState(null); // matchId
  const [hcpDrafts, setHcpDrafts] = useState({}); // { player: stringValue }
  const [nickDrafts, setNickDrafts] = useState({}); // { player: stringValue }
  const [manageDeadline, setManageDeadline] = useState("");
  const [addPlayerName, setAddPlayerName] = useState("");
  const [replaceFrom, setReplaceFrom] = useState("");
  const [replaceTo, setReplaceTo] = useState("");
  const [removeTarget, setRemoveTarget] = useState(""); // playerName
  // Nickname helper: if a league has a nickname for a player, show "Nick (Real)"
  // when expanded, or just nickname when compact.
  const nick = (player) => {
    if (!curLeague || !curLeague.nicknames) return player;
    const n = curLeague.nicknames[player];
    return n ? n : player;
  };
  const champFps = championshipFingerprints(leagueMatches);

  const myLeagues = (leagues || []).filter(lg => lg.players?.includes(me));
  const isSeason1 = selectedLeague === "s1" || (!selectedLeague && myLeagues.length === 0);
  const curLeague = isSeason1 ? null : myLeagues.find(lg => lg.id === selectedLeague);
  const curMatches = curLeague ? (leagueMatches || []).filter(m => m.leagueId === curLeague.id) : [];
  const dynStandings = curLeague ? computeStandings(curLeague.players || [], curMatches) : [];

  // S1 Finals — completion derived from hardcoded data OR from saved championship
  // rounds in Firestore (matchType === "championship", Nebraska, both finalists).
  const s1FinalRaw = S1_PLAYOFFS.find(g => g[4] === "F");
  const s1FinalP1 = s1FinalRaw?.[5], s1FinalP2 = s1FinalRaw?.[7];
  // Accept any round whose effective matchType is "championship" — covers
  // explicit tags AND the hidden-Nebraska fallback for legacy saves.
  const champRoundFor = (name) => (rounds || [])
    .filter(r => r.player === name && r.course === "Nebraska" && effectiveMatchType(r, champFps) === "championship")
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
  const p1ChampRd = s1FinalP1 && champRoundFor(s1FinalP1);
  const p2ChampRd = s1FinalP2 && champRoundFor(s1FinalP2);
  const s1Final = (() => {
    if (s1FinalRaw?.[9] != null) return s1FinalRaw;
    if (p1ChampRd && p2ChampRd) {
      const t1 = p1ChampRd.total, t2 = p2ChampRd.total;
      const winner = t1 < t2 ? s1FinalP1 : t2 < t1 ? s1FinalP2 : "Tie";
      const diff = winner === "Tie" ? 0 : (winner === s1FinalP1 ? t1 - t2 : t2 - t1);
      return [...s1FinalRaw.slice(0, 6), t1, s1FinalRaw[7], t2, winner, diff];
    }
    return s1FinalRaw;
  })();
  const s1FinalComplete = s1Final?.[9] != null;
  const s1Champion = s1Final?.[9];
  const canPlayS1Final = !s1FinalComplete && s1FinalP1 && s1FinalP2 && (me === s1FinalP1 || me === s1FinalP2) && !((me === s1FinalP1 && p1ChampRd) || (me === s1FinalP2 && p2ChampRd));
  const s1Status = s1FinalComplete ? "Complete" : "Finals";

  // ─── (forms inlined in render below) ───────────────────

  // ─── S1 CHAMPIONSHIP PRE-MATCH ────────────────────────
  const ChampPreMatch = () => {
    const jeff = S1_STANDINGS.find(s=>s.p==="Jeff Gurrister");
    const jimmie = S1_STANDINGS.find(s=>s.p==="Jimmie Perkins");
    return (
      <div style={{background:"linear-gradient(135deg,#2a1a00,#1a0f00,#2a1a00)",borderRadius:16,padding:20,border:"2px solid #d4b84a",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"radial-gradient(ellipse at 50% 0%, rgba(212,184,74,0.15) 0%, transparent 70%)",pointerEvents:"none"}}/>
        <div style={{textAlign:"center",position:"relative",zIndex:1}}>
          <div style={{fontSize:11,color:"#d4b84a",textTransform:"uppercase",letterSpacing:4,fontWeight:600}}>Season 1</div>
          <div style={{fontSize:28,fontWeight:900,color:"#fff",marginTop:4,textShadow:"0 0 20px rgba(212,184,74,0.4)"}}>🏆 CHAMPIONSHIP 🏆</div>
          <div style={{fontSize:13,color:"#d4b84a",marginTop:4,letterSpacing:2}}>Nebraska</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,marginTop:20,alignItems:"center"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:800,color:"#fff"}}>Jeff Gurrister</div>
              <div style={{fontSize:10,color:"#d4b84a",marginTop:2}}>#4 Seed</div>
              <div style={{marginTop:8,fontSize:11,color:C.muted}}><div>{jeff?.w}W-{jeff?.l}L · {jeff?.aScr} avg</div><div style={{color:C.greenLt,marginTop:2}}>Beat Tyler (-10)</div><div style={{color:C.greenLt}}>Beat Ryan (-2)</div></div>
            </div>
            <div style={{fontSize:24,fontWeight:900,color:"#d4b84a",padding:"0 8px"}}>VS</div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:800,color:"#fff"}}>Jimmie Perkins</div>
              <div style={{fontSize:10,color:"#d4b84a",marginTop:2}}>#2 Seed</div>
              <div style={{marginTop:8,fontSize:11,color:C.muted}}><div>{jimmie?.w}W-{jimmie?.l}L-{jimmie?.t}T · {jimmie?.aScr} avg</div><div style={{color:C.greenLt,marginTop:2}}>Beat Jacob (-4)</div><div style={{color:C.greenLt}}>Beat Jon (-12)</div></div>
            </div>
          </div>
          {canPlayS1Final && <button onClick={()=>playLeagueMatch&&playLeagueMatch("s1-final")} style={{marginTop:20,padding:"16px 40px",fontSize:18,fontWeight:900,borderRadius:12,border:"2px solid #d4b84a",background:"linear-gradient(135deg,#2d6a2d,#1e4a1e)",color:"#fff",cursor:"pointer",letterSpacing:2,textTransform:"uppercase",boxShadow:"0 0 30px rgba(212,184,74,0.3)"}}>⛳ TEE OFF</button>}
          {!canPlayS1Final && !s1FinalComplete && (me === s1FinalP1 || me === s1FinalP2) && ((me === s1FinalP1 && p1ChampRd) || (me === s1FinalP2 && p2ChampRd)) && <div style={{marginTop:16,fontSize:12,color:C.greenLt,fontWeight:600}}>✓ You played — waiting for opponent</div>}
          {!canPlayS1Final && !s1FinalComplete && !((me === s1FinalP1 && p1ChampRd) || (me === s1FinalP2 && p2ChampRd)) && <div style={{marginTop:16,fontSize:12,color:C.muted}}>Championship awaits...</div>}
        </div>
      </div>
    );
  };

  // ─── S1 CHAMPION CELEBRATION ──────────────────────────
  const ChampCelebration = () => (
    <div style={{background:"linear-gradient(135deg,#2a1a00,#1a0f00,#2a1a00)",borderRadius:16,padding:24,border:"2px solid #d4b84a",position:"relative",overflow:"hidden",textAlign:"center"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"radial-gradient(ellipse at 50% 30%, rgba(212,184,74,0.2) 0%, transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{fontSize:48}}>🏆</div>
        <div style={{fontSize:11,color:"#d4b84a",textTransform:"uppercase",letterSpacing:4,marginTop:8}}>Season 1 Champion</div>
        <div style={{fontSize:32,fontWeight:900,color:"#fff",marginTop:8,textShadow:"0 0 30px rgba(212,184,74,0.5)"}}>{s1Champion}</div>
        <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,fontSize:12}}>
          <div style={{background:"rgba(212,184,74,0.1)",borderRadius:8,padding:10}}><div style={{color:"#d4b84a",fontWeight:700}}>{s1Final[5]}</div><div style={{fontSize:18,fontWeight:800,color:"#fff",marginTop:2}}>{s1Final[6]}</div></div>
          <div style={{background:"rgba(212,184,74,0.1)",borderRadius:8,padding:10}}><div style={{color:"#d4b84a",fontWeight:700}}>{s1Final[7]}</div><div style={{fontSize:18,fontWeight:800,color:"#fff",marginTop:2}}>{s1Final[8]}</div></div>
        </div>
        <div style={{marginTop:8,fontSize:11,color:C.muted}}>Nebraska · {s1Final[9]} wins by {Math.abs(s1Final[10])}</div>
      </div>
    </div>
  );

  // ─── S1 VIEW ──────────────────────────────────────────
  const Season1View = () => {
    const filtered = leagueRdFilter==="all"?S1_RESULTS:S1_RESULTS.filter(r=>r[2]===parseInt(leagueRdFilter));
    return (<div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{margin:0,fontSize:18}}>🏆 Season 1</h2><span style={{background:s1FinalComplete?"rgba(74,170,74,0.2)":"rgba(212,184,74,0.2)",color:s1FinalComplete?C.greenLt:C.gold,padding:"3px 10px",borderRadius:12,fontSize:11,fontWeight:600}}>{s1Status}</span></div>
      <div style={{display:"flex",gap:4}}>{[["standings","Standings"],["results","Results"],["bracket","Bracket"]].map(([k,l])=>(<button key={k} onClick={()=>setLeagueView(k)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:leagueView===k?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:leagueView===k?C.accent:C.card,color:leagueView===k?C.white:C.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>{l}</button>))}</div>

      {leagueView==="standings"&&<div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:520}}><thead><tr style={{background:C.accent}}><th style={{padding:"8px 6px",textAlign:"left"}}>#</th><th style={{padding:"8px 4px",textAlign:"left"}}>Player</th><th style={{padding:"8px 4px",textAlign:"center"}}>Pts</th><th style={{padding:"8px 4px",textAlign:"center"}}>W</th><th style={{padding:"8px 4px",textAlign:"center"}}>L</th><th style={{padding:"8px 4px",textAlign:"center"}}>T</th><th style={{padding:"8px 4px",textAlign:"center"}}>Adj+/-</th><th style={{padding:"8px 4px",textAlign:"center"}}>Avg</th><th style={{padding:"8px 4px",textAlign:"center"}}>Tot</th></tr></thead><tbody>{S1_STANDINGS.map((s,i)=>(<tr key={s.p} style={{borderTop:`1px solid ${C.border}`,background:i<7?"rgba(74,170,74,0.04)":"transparent"}}><td style={{padding:"8px 6px",fontWeight:700,color:i===0?C.gold:i<7?C.greenLt:C.muted}}>{i+1}</td><td style={{padding:"8px 4px",fontWeight:600,fontSize:11}}>{s.p}{s.seed>0&&<span style={{fontSize:9,color:C.gold,marginLeft:4}}>#{s.seed}</span>}{s1FinalComplete&&s.p===s1Champion&&<span style={{fontSize:9,marginLeft:4}}>🏆</span>}</td><td style={{padding:"8px 4px",textAlign:"center",fontWeight:700,color:C.gold}}>{s.pts}</td><td style={{padding:"8px 4px",textAlign:"center",color:C.greenLt}}>{s.w}</td><td style={{padding:"8px 4px",textAlign:"center",color:C.red}}>{s.l}</td><td style={{padding:"8px 4px",textAlign:"center",color:C.muted}}>{s.t}</td><td style={{padding:"8px 4px",textAlign:"center",fontWeight:700,color:s.tAdj<0?C.greenLt:s.tAdj>0?C.red:C.muted}}>{s.tAdj>0?`+${s.tAdj}`:s.tAdj}</td><td style={{padding:"8px 4px",textAlign:"center"}}>{s.aScr}</td><td style={{padding:"8px 4px",textAlign:"center",color:C.muted}}>{s.tScr}</td></tr>))}</tbody></table></div><div style={{padding:"8px 12px",background:C.card2,fontSize:10,color:C.muted,borderTop:`1px solid ${C.border}`}}>Top 7 qualify for playoffs · Win=2pts, Tie=1pt</div></div>}

      {leagueView==="results"&&<><div style={{display:"flex",gap:4,flexWrap:"wrap"}}><button onClick={()=>setLeagueRdFilter("all")} style={{padding:"5px 10px",borderRadius:6,border:leagueRdFilter==="all"?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:leagueRdFilter==="all"?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:10,fontWeight:600}}>All</button>{[1,2,3,4,5,6].map(rd=>(<button key={rd} onClick={()=>setLeagueRdFilter(String(rd))} style={{padding:"5px 10px",borderRadius:6,border:leagueRdFilter===String(rd)?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:leagueRdFilter===String(rd)?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:10,fontWeight:600}}>R{rd}</button>))}</div>{filtered.map(r=>{const[gm,wk,rd,course,p1,s1,p2,s2,winner,diff]=r;return<div key={gm} style={{background:C.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12}}><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontWeight:winner===p1?700:400,color:winner===p1?C.greenLt:C.text}}>{p1}</span><span style={{fontWeight:700,fontSize:14}}>{s1}</span></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:2}}><span style={{fontWeight:winner===p2?700:400,color:winner===p2?C.greenLt:C.text}}>{p2}</span><span style={{fontWeight:700,fontSize:14}}>{s2}</span></div></div><div style={{textAlign:"right",marginLeft:12,minWidth:80}}><div style={{fontSize:10,color:C.muted}}>{course}</div><div style={{fontSize:10,color:C.muted}}>Wk{wk} R{rd} Gm{gm}</div><div style={{fontWeight:700,fontSize:11,color:winner==="Tie"?C.muted:C.gold,marginTop:2}}>{winner==="Tie"?"Tie":diff}</div></div></div>;})}</>}

      {leagueView==="bracket"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{fontSize:13,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:2}}>Quarterfinals</div>
        {S1_PLAYOFFS.filter(g=>g[4]==="QF").map(g=>{const[gm,,,course,,p1,s1,p2,s2,winner,diff]=g;return<div key={gm} style={{background:C.card,borderRadius:8,padding:10,border:`1px solid ${C.border}`}}><div style={{fontSize:10,color:C.muted,marginBottom:4}}>{course} · Game {gm}</div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:winner===p1?700:400,color:winner===p1?C.greenLt:C.text}}>{p1}</span><span style={{fontWeight:700}}>{s1}</span></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:winner===p2?700:400,color:winner===p2?C.greenLt:C.text}}>{p2}</span><span style={{fontWeight:700}}>{s2}</span></div>{winner&&<div style={{textAlign:"right",fontSize:10,color:C.gold,marginTop:4}}>Winner: {winner} ({diff})</div>}</div>;})}
        <div style={{fontSize:13,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginTop:8}}>Semifinals</div>
        {S1_PLAYOFFS.filter(g=>g[4]==="SF").map(g=>{const[gm,,,course,,p1,s1,p2,s2,winner,diff]=g;return<div key={gm} style={{background:C.card,borderRadius:8,padding:10,border:`1px solid ${C.border}`}}><div style={{fontSize:10,color:C.muted,marginBottom:4}}>{course} · Game {gm}</div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:winner===p1?700:600,color:winner===p1?C.greenLt:C.text}}>{p1}</span><span style={{fontWeight:700}}>{s1??""}</span></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:winner===p2?700:600,color:winner===p2?C.greenLt:C.text}}>{p2}</span><span style={{fontWeight:700}}>{s2??""}</span></div>{winner&&<div style={{textAlign:"right",fontSize:10,color:C.gold,marginTop:4}}>Winner: {winner} ({diff})</div>}</div>;})}
        <div style={{fontSize:13,fontWeight:700,color:"#d4b84a",textTransform:"uppercase",letterSpacing:2,marginTop:8}}>🏆 Championship</div>
        {s1FinalComplete ? <ChampCelebration/> : <ChampPreMatch/>}
      </div>}
    </div>);
  };

  // ─── DYNAMIC LEAGUE: LOBBY ────────────────────────────
  const Lobby = () => {
    const playerCount = curLeague.players?.length || 0;
    const fmt = LEAGUE_FORMATS[playerCount];
    const isCreator = curLeague.creator === me;
    const scheduleType = curLeague.scheduleType || "single";
    const courseRotation = curLeague.courseRotation || "free";
    const holeCount = curLeague.holeCount === 9 ? 9 : 18;
    // Preview the schedule once we have enough players. The schedule depends
    // on player order, so it's only meaningful when we know the final lineup.
    const schedulePreview = fmt ? generateRRSchedule(curLeague.players, scheduleType) : null;
    const totalWeeks = schedulePreview?.length || 0;
    const coursesByRound = curLeague.coursesByRound || [];
    const setRoundCourse = async (idx, courseName) => {
      const next = [...coursesByRound];
      next[idx] = courseName || null;
      await updateLeagueConfig(curLeague.id, { coursesByRound: next });
    };
    const allCoursesAssigned = courseRotation !== "scheduled" || (totalWeeks > 0 && schedulePreview.every((_, i) => coursesByRound[i]));

    return (<div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{margin:0,fontSize:18}}>⚡ {curLeague.name}</h2><span style={{background:"rgba(138,180,248,0.2)",color:C.blue,padding:"3px 10px",borderRadius:12,fontSize:11,fontWeight:600}}>Lobby</span></div>

      <div style={{background:"linear-gradient(135deg,#1a2a1a,#2a3a2a)",borderRadius:12,padding:20,border:`2px solid ${C.greenLt}`,textAlign:"center"}}><div style={{fontSize:11,color:C.greenLt,textTransform:"uppercase",letterSpacing:3}}>Invite Code</div><div style={{fontSize:40,fontWeight:900,letterSpacing:8,color:C.white,marginTop:8}}>{curLeague.code}</div><div style={{fontSize:12,color:C.muted,marginTop:8}}>Share this code with friends</div></div>

      {/* Configuration summary */}
      <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
        <div style={{fontWeight:700,marginBottom:8,fontSize:13}}>League Settings</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:11}}>
          <div><span style={{color:C.muted}}>Match length: </span><span style={{fontWeight:600}}>{holeCount} holes</span></div>
          <div><span style={{color:C.muted}}>Schedule: </span><span style={{fontWeight:600}}>{scheduleType==="double"?"Double round-robin":"Single round-robin"}</span></div>
          <div><span style={{color:C.muted}}>Courses: </span><span style={{fontWeight:600}}>{courseRotation==="scheduled"?"Course-of-the-week":"Free choice"}</span></div>
          {fmt && <div><span style={{color:C.muted}}>Weeks: </span><span style={{fontWeight:600}}>{totalWeeks}</span></div>}
        </div>
      </div>

      <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}><div style={{fontWeight:700,marginBottom:10}}>Players ({playerCount}{fmt?` · ${fmt.name}`:""})</div>{(curLeague.players||[]).map(p=>{const nm=nick(p);return(<div key={p} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.card2,borderRadius:8,padding:"8px 12px",marginBottom:4}}><span style={{fontWeight:600,color:p===me?C.greenLt:C.text}}>{nm}{nm!==p&&<span style={{fontSize:10,color:C.muted,fontWeight:400,marginLeft:4}}>({p})</span>}{p===me?" (you)":""}</span>{p===curLeague.creator&&<span style={{fontSize:10,color:C.gold}}>👑</span>}</div>);})}{!fmt&&playerCount>0&&<div style={{fontSize:10,color:C.muted,marginTop:6,textAlign:"center"}}>Need {MIN_LEAGUE_PLAYERS}-{MAX_LEAGUE_PLAYERS} players to start</div>}</div>

      {/* Course-of-the-week picker (creator only, when scheduled) */}
      {isCreator && fmt && courseRotation === "scheduled" && schedulePreview && <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
        <div style={{fontWeight:700,marginBottom:8,fontSize:13}}>Pick a Course for Each Week</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {schedulePreview.map((wk, i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontSize:11,fontWeight:600,color:C.muted,minWidth:60}}>Week {i + 1}</div>
              <select value={coursesByRound[i] || ""} onChange={e => setRoundCourse(i, e.target.value)} style={{flex:1,padding:"6px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:C.card2,color:C.text,fontSize:12}}>
                <option value="">— Pick a course —</option>
                {(allCourses || []).map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
              </select>
              <span style={{fontSize:9,color:C.muted,minWidth:50,textAlign:"right"}}>{wk.length} match{wk.length !== 1 ? "es" : ""}</span>
            </div>
          ))}
        </div>
      </div>}

      {/* Championship course pre-pick (creator only, if there'll be a final) */}
      {isCreator && fmt && (curLeague.playoffSizeOverride !== 0) && <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
        <div style={{fontWeight:700,marginBottom:6,fontSize:13}}>🏆 Championship Course</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <select value={curLeague.championshipCourse || ""} onChange={e => updateLeagueConfig(curLeague.id, { championshipCourse: e.target.value || null })} style={{flex:1,padding:"6px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:C.card2,color:C.text,fontSize:12}}>
            <option value="">— Decide later —</option>
            {(allCourses || []).map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div style={{fontSize:9,color:C.muted,marginTop:4}}>The Final match will be played on this course. Optional.</div>
      </div>}

      {/* Schedule preview */}
      {isCreator && fmt && schedulePreview && <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setShowSchedulePreview(s=>!s)}>
          <div style={{fontWeight:700,fontSize:13}}>📅 Schedule Preview</div>
          <span style={{fontSize:11,color:C.muted}}>{showSchedulePreview ? "▾" : "▸"}</span>
        </div>
        {showSchedulePreview && <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
          {schedulePreview.map((wk, i) => (
            <div key={i} style={{background:C.card2,borderRadius:6,padding:"6px 10px",fontSize:11}}>
              <div style={{fontWeight:600,color:C.muted,marginBottom:3}}>Week {i + 1}{coursesByRound[i] ? ` · ${coursesByRound[i]}` : ""}</div>
              {wk.map((pair, j) => <div key={j} style={{paddingLeft:8}}>{pair[0]} vs {pair[1]}</div>)}
            </div>
          ))}
        </div>}
      </div>}

      {isCreator && fmt && <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}><div style={{fontWeight:700,marginBottom:8}}>Ready to Start?</div><div style={{background:C.card2,borderRadius:8,padding:10,marginBottom:10}}><div style={{fontWeight:600,fontSize:13}}>{fmt.name}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{fmt.desc}</div><div style={{fontSize:10,color:C.muted,marginTop:4}}>{totalWeeks} week{totalWeeks !== 1 ? "s" : ""} · {schedulePreview?.reduce((s, w) => s + w.length, 0) || 0} regular-season matches</div></div><button onClick={()=>startLeagueSeason(curLeague.id)} disabled={!allCoursesAssigned} style={{...btnS(allCoursesAssigned),width:"100%",padding:14,fontSize:15,opacity:allCoursesAssigned?1:0.5,cursor:allCoursesAssigned?"pointer":"not-allowed"}}>🏆 Start Season</button>{!allCoursesAssigned && <div style={{fontSize:10,color:C.gold,marginTop:6,textAlign:"center"}}>Pick a course for every week first</div>}</div>}
      {!isCreator&&<div style={{textAlign:"center",padding:20,color:C.muted,fontSize:12}}>Waiting for {curLeague.creator} to start...</div>}
    </div>);
  };

  // ─── DYNAMIC LEAGUE: ACTIVE ───────────────────────────
  const Active = () => {
    const totalRds = curLeague.totalRounds||1;
    const regMatches = curMatches.filter(m=>m.roundType==="regular");
    const poMatches = curMatches.filter(m=>m.roundType!=="regular");
    const done = regMatches.filter(m=>m.status==="complete").length;
    const myPending = [...regMatches,...poMatches].filter(m=>m.status!=="complete"&&(m.player1===me||m.player2===me));
    const isCreator = curLeague.creator === me;
    const handicaps = curLeague.handicaps || {};
    const coursesByRound = curLeague.coursesByRound || [];

    return (<div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
        <h2 style={{margin:0,fontSize:18}}>⚡ {curLeague.name}</h2>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{background:curLeague.status==="playoffs"?"rgba(212,184,74,0.2)":"rgba(74,170,74,0.2)",color:curLeague.status==="playoffs"?C.gold:C.greenLt,padding:"3px 10px",borderRadius:12,fontSize:11,fontWeight:600}}>{curLeague.status==="playoffs"?"Playoffs":curLeague.status==="complete"?"Complete":`${done}/${regMatches.length} played`}</span>
          {isCreator && <button onClick={()=>{setShowManage(s=>!s);setManageNameDraft(curLeague.name);}} style={{...btnS(showManage),padding:"5px 10px",fontSize:11}}>{showManage?"Done":"⚙️ Manage"}</button>}
        </div>
      </div>
      {/* Champion / season-complete celebration. Fires when league.status
          flips to "complete" — either via the F match finishing or the
          no-playoffs short-circuit at the end of regular season. */}
      {curLeague.status === "complete" && (() => {
        const finalMatch = poMatches.find(m => m.roundType === "F" && m.winner);
        const champion = finalMatch?.winner || (dynStandings[0]?.player);
        const finalLine = finalMatch
          ? `${nick(finalMatch.player1)} ${finalMatch.p1Total ?? "—"}  vs  ${nick(finalMatch.player2)} ${finalMatch.p2Total ?? "—"}`
          : `Top of standings · ${regMatches.length} matches played`;
        if (!champion) return null;
        return (
          <div style={{background:"linear-gradient(135deg,#2a1a00,#1a0f00,#2a1a00)",borderRadius:16,padding:24,border:"2px solid #d4b84a",position:"relative",overflow:"hidden",textAlign:"center"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"radial-gradient(ellipse at 50% 30%, rgba(212,184,74,0.2) 0%, transparent 70%)",pointerEvents:"none"}}/>
            <div style={{position:"relative",zIndex:1}}>
              <div style={{fontSize:48}}>🏆</div>
              <div style={{fontSize:11,color:"#d4b84a",textTransform:"uppercase",letterSpacing:4,marginTop:8}}>{curLeague.name} Champion</div>
              <div style={{fontSize:32,fontWeight:900,color:"#fff",marginTop:8,textShadow:"0 0 30px rgba(212,184,74,0.5)"}}>{nick(champion)}</div>
              <div style={{marginTop:12,fontSize:11,color:C.muted}}>{finalMatch?.course ? `${finalMatch.course} · ` : ""}{finalLine}</div>
              {finalMatch?.winner && finalMatch.margin > 0 && <div style={{marginTop:6,fontSize:11,color:C.muted}}>Wins by {finalMatch.margin}{finalMatch.handicapApplied ? " (adjusted)" : ""}</div>}
              {!finalMatch && <div style={{marginTop:6,fontSize:11,color:C.muted}}>Season ended without playoffs</div>}
            </div>
          </div>
        );
      })()}

      <div style={{display:"flex",gap:4}}>{[["standings","Standings"],["schedule","Schedule"],["bracket","Bracket"]].map(([k,l])=>(<button key={k} onClick={()=>setLeagueView(k)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:leagueView===k?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:leagueView===k?C.accent:C.card,color:leagueView===k?C.white:C.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>{l}</button>))}</div>

      {showManage && isCreator && <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.gold}`,display:"flex",flexDirection:"column",gap:14}}>
        <div style={{fontWeight:700,fontSize:14,color:C.gold}}>⚙️ League Management</div>

        {/* Rename */}
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>League Name</div>
          <div style={{display:"flex",gap:6}}>
            <input value={manageNameDraft} onChange={e=>setManageNameDraft(e.target.value)} style={{...inputS,flex:1}}/>
            <button onClick={async()=>{await renameLeague(curLeague.id, manageNameDraft);}} disabled={!manageNameDraft.trim()||manageNameDraft===curLeague.name} style={{...btnS(manageNameDraft.trim()&&manageNameDraft!==curLeague.name),padding:"6px 12px",fontSize:11,opacity:(manageNameDraft.trim()&&manageNameDraft!==curLeague.name)?1:0.5}}>Save</button>
          </div>
        </div>

        {/* Weekly deadline */}
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Weekly Deadline</div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <input value={manageDeadline !== "" ? manageDeadline : (curLeague.weeklyDeadlineDays != null ? String(curLeague.weeklyDeadlineDays) : "")} onChange={e=>setManageDeadline(e.target.value.replace(/[^0-9]/g,""))} placeholder="off" inputMode="numeric" style={{...inputS,width:80}}/>
            <button onClick={async()=>{const v=manageDeadline.trim()===""?null:parseInt(manageDeadline,10)||null;await updateLeagueConfig(curLeague.id,{weeklyDeadlineDays:v});setManageDeadline("");}} style={{...btnS(true),padding:"6px 12px",fontSize:11}}>Save</button>
            <span style={{fontSize:9,color:C.muted}}>{curLeague.weeklyDeadlineDays?`Currently ${curLeague.weeklyDeadlineDays}d / week`:"No deadline"}</span>
          </div>
          <div style={{fontSize:9,color:C.muted,marginTop:4}}>Both miss → both lose. One misses → opponent wins. Use Extend below to grant extensions.</div>
        </div>

        {/* Course-of-the-week edits (only if league uses scheduled rotation) */}
        {curLeague.courseRotation === "scheduled" && <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Weekly Courses</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {Array.from({length: totalRds}, (_, i) => {
              const week = i + 1;
              const playedInWeek = regMatches.filter(m => m.round === week && m.status === "complete").length;
              const totalInWeek = regMatches.filter(m => m.round === week).length;
              const partiallyPlayed = playedInWeek > 0;
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontSize:11,fontWeight:600,color:C.muted,minWidth:60}}>Week {week}</div>
                  <select value={coursesByRound[i] || ""} onChange={e => swapWeekCourse(curLeague.id, i, e.target.value)} style={{flex:1,padding:"6px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:C.card2,color:C.text,fontSize:12}}>
                    <option value="">— No course —</option>
                    {(allCourses || []).map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <span style={{fontSize:9,color:partiallyPlayed?C.gold:C.muted,minWidth:60,textAlign:"right"}}>{playedInWeek}/{totalInWeek} played{partiallyPlayed?" *":""}</span>
                </div>
              );
            })}
          </div>
          <div style={{fontSize:9,color:C.muted,marginTop:6}}>* Already-played matches keep their original course — only pending matches in the week update.</div>
        </div>}

        {/* Per-match course override */}
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Override an Individual Match</div>
          <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:240,overflowY:"auto"}}>
            {curMatches.filter(m => m.status !== "complete" && m.player1 && m.player2).sort((a,b) => a.round - b.round || a.matchNum - b.matchNum).map(m => (
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:6,fontSize:11}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{nick(m.player1)} vs {nick(m.player2)}</div>
                  <div style={{fontSize:9,color:C.muted}}>Wk {m.round} · {m.roundType==="regular"?"Reg":m.roundType}</div>
                </div>
                <select value={m.course || ""} onChange={e => setMatchCourse(m.id, e.target.value)} style={{padding:"4px 6px",borderRadius:4,border:`1px solid ${C.border}`,background:C.card2,color:C.text,fontSize:11,maxWidth:140}}>
                  <option value="">— None —</option>
                  {(allCourses || []).map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            ))}
            {curMatches.filter(m => m.status !== "complete").length === 0 && <div style={{fontSize:10,color:C.muted,fontStyle:"italic"}}>No pending matches.</div>}
          </div>
        </div>

        {/* Reset / forfeit */}
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Match Actions</div>
          <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:240,overflowY:"auto"}}>
            {curMatches.sort((a,b) => a.round - b.round || a.matchNum - b.matchNum).map(m => (
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,background:C.card2,borderRadius:6,padding:"6px 8px"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.player1?nick(m.player1):"TBD"} vs {m.player2?nick(m.player2):"TBD"}</div>
                  <div style={{fontSize:9,color:C.muted}}>Wk {m.round} · {m.roundType==="regular"?"Reg":m.roundType} · {m.status==="complete"?<span style={{color:C.greenLt}}>{m.winner==="Tie"?"Tie":m.doubleForfeit?"Double forfeit":`${nick(m.winner)} won`}{m.forfeit?" (forfeit)":""}</span>:<span>pending{m.deadlineOverride?` · ext to ${new Date(m.deadlineOverride).toLocaleDateString()}`:""}</span>}</div>
                </div>
                {m.status === "complete"
                  ? <button onClick={()=>{if(confirm(`Reset this match? Scores will be cleared and players can re-record.`)) resetMatch(m.id);}} style={{...btnS(false),padding:"4px 8px",fontSize:10}}>↺ Reset</button>
                  : (m.player1 && m.player2 && <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {curLeague.weeklyDeadlineDays && <button onClick={()=>extendMatchDeadline(m.id, 1)} style={{...btnS(false),padding:"4px 6px",fontSize:10}} title="Extend by 1 day">+1d</button>}
                      {curLeague.weeklyDeadlineDays && <button onClick={()=>extendMatchDeadline(m.id, 3)} style={{...btnS(false),padding:"4px 6px",fontSize:10}} title="Extend by 3 days">+3d</button>}
                      {curLeague.weeklyDeadlineDays && m.deadlineOverride && <button onClick={()=>extendMatchDeadline(m.id, null)} style={{...btnS(false),padding:"4px 6px",fontSize:10,color:C.muted}} title="Clear extension">↺</button>}
                      <button onClick={()=>setForfeitTarget(forfeitTarget===m.id?null:m.id)} style={{...btnS(forfeitTarget===m.id),padding:"4px 8px",fontSize:10}}>Forfeit</button>
                    </div>)
                }
              </div>
            ))}
          </div>
          {forfeitTarget && (() => {
            const m = curMatches.find(x => x.id === forfeitTarget);
            if (!m) return null;
            return <div style={{marginTop:6,padding:"8px 10px",background:"rgba(212,184,74,0.06)",border:`1px solid ${C.gold}`,borderRadius:6,fontSize:11}}>
              <div style={{marginBottom:6}}>Declare winner of <strong>{nick(m.player1)} vs {nick(m.player2)}</strong>:</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={async()=>{await forfeitMatch(m.id, m.player1); setForfeitTarget(null);}} style={{...btnS(true),padding:"4px 10px",fontSize:11}}>{nick(m.player1)}</button>
                <button onClick={async()=>{await forfeitMatch(m.id, m.player2); setForfeitTarget(null);}} style={{...btnS(true),padding:"4px 10px",fontSize:11}}>{nick(m.player2)}</button>
                <button onClick={async()=>{await forfeitMatch(m.id, "Tie"); setForfeitTarget(null);}} style={{...btnS(false),padding:"4px 10px",fontSize:11}}>Tie</button>
                <button onClick={()=>setForfeitTarget(null)} style={{...btnS(false),padding:"4px 10px",fontSize:11,color:C.muted}}>Cancel</button>
              </div>
            </div>;
          })()}
        </div>

        {/* Championship course (post-start edit) */}
        {(curLeague.playoffSizeOverride !== 0) && <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>🏆 Championship Course</div>
          <select value={curLeague.championshipCourse || ""} onChange={e => updateLeagueConfig(curLeague.id, { championshipCourse: e.target.value || null })} style={{width:"100%",padding:"6px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:C.card2,color:C.text,fontSize:12}}>
            <option value="">— Decide at the time —</option>
            {(allCourses || []).map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
          </select>
          <div style={{fontSize:9,color:C.muted,marginTop:4}}>Updates the F match's course (if it's been created and not yet played).</div>
        </div>}

        {/* Player nicknames */}
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Player Nicknames</div>
          <div style={{fontSize:9,color:C.muted,marginBottom:6}}>Optional display name for each player in this league.</div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {(curLeague.players||[]).map(p => {
              const current = (curLeague.nicknames||{})[p] || "";
              const draftKey = p;
              const draftVal = nickDrafts[draftKey] != null ? nickDrafts[draftKey] : current;
              return (
                <div key={p} style={{display:"flex",alignItems:"center",gap:6,fontSize:11}}>
                  <div style={{flex:1,fontWeight:600,color:C.muted}}>{p}</div>
                  <input value={draftVal} onChange={e=>setNickDrafts(d=>({...d,[draftKey]:e.target.value}))} placeholder="(no nickname)" style={{...inputS,width:120}}/>
                  <button onClick={async()=>{const v=draftVal.trim();const next={...(curLeague.nicknames||{})};if(v)next[p]=v;else delete next[p];await updateLeagueConfig(curLeague.id,{nicknames:next});setNickDrafts(d=>{const n={...d};delete n[draftKey];return n;});}} disabled={draftVal === current} style={{...btnS(draftVal !== current),padding:"4px 8px",fontSize:10,opacity:draftVal===current?0.5:1}}>Save</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-player handicap override */}
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Player Handicaps {curLeague.useHandicapScoring && curLeague.handicapSource==="auto" && <span style={{fontSize:9,color:C.muted}}>(auto from rounds — read only)</span>}</div>
          <div style={{fontSize:9,color:C.muted,marginBottom:6}}>{curLeague.useHandicapScoring ? (curLeague.handicapSource === "auto" ? "Computed live from each player's saved 18-hole rounds." : "Used to compute adjusted totals when matches are saved.") : "Display only — not used for scoring."}{curLeague.handicapCap != null && ` · Capped at ±${Math.abs(curLeague.handicapCap)}`}</div>
          {curLeague.handicapSource !== "auto" && <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {(curLeague.players||[]).map(p => {
              const current = handicaps[p];
              const draftKey = p;
              const draftVal = hcpDrafts[draftKey] != null ? hcpDrafts[draftKey] : (current != null ? String(current) : "");
              return (
                <div key={p} style={{display:"flex",alignItems:"center",gap:6,fontSize:11}}>
                  <div style={{flex:1,fontWeight:600}}>{nick(p)}</div>
                  <input value={draftVal} onChange={e=>setHcpDrafts(d=>({...d,[draftKey]:e.target.value}))} placeholder="—" inputMode="numeric" style={{...inputS,width:60,textAlign:"center"}}/>
                  <button onClick={async()=>{const v=draftVal.trim();await setLeagueHandicap(curLeague.id, p, v===""?null:parseInt(v,10));setHcpDrafts(d=>{const n={...d};delete n[draftKey];return n;});}} style={{...btnS(true),padding:"4px 8px",fontSize:10}}>Save</button>
                  {current != null && <button onClick={async()=>{await setLeagueHandicap(curLeague.id, p, null);setHcpDrafts(d=>{const n={...d};delete n[draftKey];return n;});}} style={{...btnS(false),padding:"4px 8px",fontSize:10}}>Clear</button>}
                </div>
              );
            })}
          </div>}
        </div>

        {/* Player management */}
        {curLeague.status === "active" && <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:6,fontWeight:600}}>Player Management</div>

          {/* Add */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:4}}>Add a player mid-season</div>
            <div style={{display:"flex",gap:6}}>
              <input value={addPlayerName} onChange={e=>setAddPlayerName(e.target.value)} placeholder="Player name" style={{...inputS,flex:1}}/>
              <button onClick={async()=>{if(!addPlayerName.trim())return;await addPlayerMidSeason(curLeague.id, addPlayerName.trim());setAddPlayerName("");}} style={{...btnS(addPlayerName.trim()),padding:"6px 10px",fontSize:11,opacity:addPlayerName.trim()?1:0.5}}>+ Add</button>
            </div>
            <div style={{fontSize:9,color:C.muted,marginTop:3}}>Catch-up matches against everyone get appended to the schedule.</div>
          </div>

          {/* Replace */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:4}}>Replace a player (sub)</div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <select value={replaceFrom} onChange={e=>setReplaceFrom(e.target.value)} style={{padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,background:C.card2,color:C.text,fontSize:11,flex:1}}>
                <option value="">— Old player —</option>
                {(curLeague.players||[]).map(p => <option key={p} value={p}>{nick(p)}</option>)}
              </select>
              <span style={{fontSize:11,color:C.muted}}>→</span>
              <input value={replaceTo} onChange={e=>setReplaceTo(e.target.value)} placeholder="New name" style={{...inputS,flex:1}}/>
              <button onClick={async()=>{if(!replaceFrom||!replaceTo.trim())return;await replacePlayer(curLeague.id, replaceFrom, replaceTo.trim());setReplaceFrom("");setReplaceTo("");}} style={{...btnS(replaceFrom&&replaceTo.trim()),padding:"6px 10px",fontSize:11,opacity:(replaceFrom&&replaceTo.trim())?1:0.5}}>Swap</button>
            </div>
            <div style={{fontSize:9,color:C.muted,marginTop:3}}>Pending matches re-point to the new player. Completed stay attributed to the original.</div>
          </div>

          {/* Remove */}
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:4}}>Remove a player</div>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              <select value={removeTarget} onChange={e=>setRemoveTarget(e.target.value)} style={{padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,background:C.card2,color:C.text,fontSize:11,flex:1,minWidth:120}}>
                <option value="">— Pick player —</option>
                {(curLeague.players||[]).filter(p=>p!==me).map(p => <option key={p} value={p}>{nick(p)}</option>)}
              </select>
              {removeTarget && <>
                <button onClick={async()=>{if(!confirm(`Remove ${nick(removeTarget)}? Their pending matches will be FORFEITED to opponents.`))return;await removePlayerMidSeason(curLeague.id, removeTarget, "forfeit");setRemoveTarget("");}} style={{...btnS(true),padding:"6px 10px",fontSize:11}}>Forfeit pending</button>
                <button onClick={async()=>{if(!confirm(`Remove ${nick(removeTarget)}? Their pending matches will be DELETED (no points awarded).`))return;await removePlayerMidSeason(curLeague.id, removeTarget, "void");setRemoveTarget("");}} style={{...btnS(false),padding:"6px 10px",fontSize:11}}>Void pending</button>
              </>}
            </div>
            <div style={{fontSize:9,color:C.muted,marginTop:3}}>Forfeit = opponents win pending matches. Void = pending matches deleted entirely.</div>
          </div>
        </div>}
      </div>}

      {/* My pending matches */}
      {leagueView==="standings"&&myPending.length>0&&<div style={{background:"rgba(74,170,74,0.06)",borderRadius:12,padding:14,border:`1px solid ${C.greenLt}`}}>
        <div style={{fontWeight:700,marginBottom:8,fontSize:13}}>🎯 Your Matches</div>
        {myPending.map(m=>{const opp=m.player1===me?m.player2:m.player1;const iPlayed=(m.player1===me&&m.p1Total!=null)||(m.player2===me&&m.p2Total!=null);const isF=m.roundType==="F";return(<div key={m.id} style={{background:isF?"linear-gradient(135deg,#2a1a00,#1a0f00)":C.card,borderRadius:8,padding:12,border:`1px solid ${isF?"#d4b84a":C.border}`,marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,fontSize:14,color:isF?"#d4b84a":C.text}}>{isF?"🏆 Championship vs ":"vs "}{nick(opp)}</div><div style={{fontSize:10,color:C.muted}}>Rd {m.round}{m.roundType!=="regular"?` · ${m.roundType}`:""}{m.course?` · ${m.course}`:""}</div></div>{iPlayed?<div style={{fontSize:11,color:C.greenLt,fontWeight:600}}>✓ Played — Waiting for opponent</div>:<button onClick={()=>playLeagueMatch(m.id)} style={{...btnS(true),padding:"8px 16px",fontSize:12}}>⛳ {isF?"TEE OFF":"Play"}</button>}</div></div>);})}
      </div>}

      {/* Standings table */}
      {leagueView==="standings"&&(()=>{const lgHcps=curLeague.handicaps||{};const ps=effectivePlayoffSize(curLeague);const showHcpCol=curLeague.useHandicapScoring||Object.keys(lgHcps).length>0;return <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:400}}><thead><tr style={{background:C.accent}}><th style={{padding:"8px 6px",textAlign:"left"}}>#</th><th style={{padding:"8px 4px",textAlign:"left"}}>Player</th>{showHcpCol&&<th style={{padding:"8px 4px",textAlign:"center"}}>HDCP</th>}<th style={{padding:"8px 4px",textAlign:"center"}}>Pts</th><th style={{padding:"8px 4px",textAlign:"center"}}>W</th><th style={{padding:"8px 4px",textAlign:"center"}}>L</th><th style={{padding:"8px 4px",textAlign:"center"}}>T</th><th style={{padding:"8px 4px",textAlign:"center"}}>+/-</th><th style={{padding:"8px 4px",textAlign:"center"}}>Avg</th></tr></thead><tbody>{dynStandings.map((s,i)=>{const inPO=i<ps;const hcp=lgHcps[s.player];return(<tr key={s.player} style={{borderTop:`1px solid ${C.border}`,background:inPO?"rgba(74,170,74,0.04)":"transparent"}}><td style={{padding:"8px 6px",fontWeight:700,color:i===0?C.gold:inPO?C.greenLt:C.muted}}>{i+1}</td><td style={{padding:"8px 4px",fontWeight:600,fontSize:11,color:s.player===me?C.greenLt:C.text,cursor:"pointer"}} onClick={()=>openPlayerProfile(s.player)}>{nick(s.player)}{s.player===me?" (you)":""}</td>{showHcpCol&&<td style={{padding:"8px 4px",textAlign:"center",color:hcp!=null?(hcp<0?C.greenLt:hcp>0?C.red:C.text):C.muted}}>{hcp!=null?(hcp>0?`+${hcp}`:hcp):"—"}</td>}<td style={{padding:"8px 4px",textAlign:"center",fontWeight:700,color:C.gold}}>{s.pts}</td><td style={{padding:"8px 4px",textAlign:"center",color:C.greenLt}}>{s.w}</td><td style={{padding:"8px 4px",textAlign:"center",color:C.red}}>{s.l}</td><td style={{padding:"8px 4px",textAlign:"center",color:C.muted}}>{s.t}</td><td style={{padding:"8px 4px",textAlign:"center",fontWeight:700,color:s.diff<0?C.greenLt:s.diff>0?C.red:C.muted}}>{s.diff===0?"E":s.diff>0?`+${s.diff}`:s.diff}</td><td style={{padding:"8px 4px",textAlign:"center"}}>{s.avg||"—"}</td></tr>);})}</tbody></table></div>{ps>0?<div style={{padding:"8px 12px",background:C.card2,fontSize:10,color:C.muted,borderTop:`1px solid ${C.border}`}}>Top {ps} qualify · Win=2pts, Tie=1pt</div>:<div style={{padding:"8px 12px",background:C.card2,fontSize:10,color:C.muted,borderTop:`1px solid ${C.border}`}}>No playoffs · Win=2pts, Tie=1pt</div>}</div>;})()}

      {/* Schedule */}
      {leagueView==="schedule"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>{Array.from({length:totalRds},(_,ri)=>{const rd=ri+1;const rm=regMatches.filter(m=>m.round===rd);if(!rm.length)return null;return(<div key={rd}><div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:6}}>Round {rd}</div>{rm.map(m=>{const my=m.player1===me||m.player2===me;const p1Score=m.p1Total!=null?(m.status==="complete"||m.player1===me?String(m.p1Total):"🔒"):"";const p2Score=m.p2Total!=null?(m.status==="complete"||m.player2===me?String(m.p2Total):"🔒"):"";return(<div key={m.id} style={{background:my?"rgba(74,170,74,0.06)":C.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${my?C.greenLt:C.border}`,marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12}}><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:m.winner===m.player1?700:400,color:m.winner===m.player1?C.greenLt:C.text}}>{nick(m.player1)}</span><span style={{fontWeight:700}}>{p1Score}</span></div><div style={{display:"flex",justifyContent:"space-between",marginTop:2}}><span style={{fontWeight:m.winner===m.player2?700:400,color:m.winner===m.player2?C.greenLt:C.text}}>{nick(m.player2)}</span><span style={{fontWeight:700}}>{p2Score}</span></div></div><div style={{textAlign:"right",marginLeft:12,minWidth:70}}><div style={{fontSize:10,color:C.muted}}>{m.course||"TBD"}</div>{m.status==="complete"?<div style={{fontWeight:700,fontSize:11,color:m.winner==="Tie"?C.muted:C.gold,marginTop:2}}>{m.winner==="Tie"?"Tie":nick(m.winner)}</div>:my?<button onClick={()=>playLeagueMatch(m.id)} style={{...btnS(true),padding:"4px 10px",fontSize:10,marginTop:2}}>Play</button>:<div style={{fontSize:10,color:C.muted,marginTop:2}}>Pending</div>}</div></div>);})}</div>);})}</div>}

      {/* Bracket */}
      {leagueView==="bracket"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
        {(curLeague.status==="playoffs"||curLeague.status==="complete")&&poMatches.length>0?
          poMatches.sort((a,b)=>{const o={QF:0,SF:1,F:2};return(o[a.roundType]||0)-(o[b.roundType]||0);}).map(m=>{const my=m.player1===me||m.player2===me;const isF=m.roundType==="F";const p1Score=m.p1Total!=null?(m.status==="complete"||m.player1===me?m.p1Total:"🔒"):"";const p2Score=m.p2Total!=null?(m.status==="complete"||m.player2===me?m.p2Total:"🔒"):"";return(<div key={m.id} style={{background:isF?"linear-gradient(135deg,#2a1a00,#1a0f00)":C.card,borderRadius:8,padding:12,border:`1px solid ${isF?"#d4b84a":C.border}`}}><div style={{fontSize:10,color:isF?C.gold:C.muted,marginBottom:4,fontWeight:600}}>{m.roundType==="QF"?"Quarterfinal":m.roundType==="SF"?"Semifinal":"🏆 Championship"}{m.course?` · ${m.course}`:""}</div>{m.player1&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:m.winner===m.player1?700:400,color:m.winner===m.player1?C.greenLt:C.text}}>{nick(m.player1)}</span><span style={{fontWeight:700}}>{p1Score}</span></div>}{m.player2&&<div style={{display:"flex",justifyContent:"space-between",marginTop:2}}><span style={{fontWeight:m.winner===m.player2?700:400,color:m.winner===m.player2?C.greenLt:C.text}}>{nick(m.player2)}</span><span style={{fontWeight:700}}>{p2Score}</span></div>}{m.status==="complete"&&m.winner&&<div style={{textAlign:"right",fontSize:10,color:C.gold,marginTop:4}}>Winner: {nick(m.winner)}</div>}{m.status!=="complete"&&my&&m.player1&&m.player2&&<button onClick={()=>playLeagueMatch(m.id)} style={{...btnS(true),width:"100%",padding:10,marginTop:8,fontSize:12}}>⛳ Play</button>}{m.status!=="complete"&&(!m.player1||!m.player2)&&<div style={{textAlign:"center",fontSize:11,color:C.muted,marginTop:4}}>Awaiting results...</div>}</div>);})
        :<div style={{textAlign:"center",padding:30,color:C.muted}}><div style={{fontSize:14}}>🏆</div><div style={{marginTop:8}}>Bracket unlocks after regular season</div><div style={{fontSize:11,marginTop:4}}>{done}/{regMatches.length} matches complete</div></div>}
      </div>}
    </div>);
  };

  // ─── MAIN RENDER ──────────────────────────────────────
  return (<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
      <select value={selectedLeague||"s1"} onChange={e=>{setSelectedLeague(e.target.value);setShowCreate(false);setShowJoinCode(false);}} style={{flex:1,padding:"8px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:C.card2,color:C.text,fontSize:13,fontWeight:600,outline:"none"}}>
        <option value="s1">🏆 Season 1{s1FinalComplete?" — Champ: "+s1Champion:""}</option>
        {myLeagues.map(lg=>(<option key={lg.id} value={lg.id}>{lg.status==="complete"?"🏆":"⚡"} {lg.name} ({lg.players?.length||0}p)</option>))}
      </select>
      <button onClick={()=>{setShowCreate(c=>!c);setShowJoinCode(false);}} style={{...btnS(true),padding:"8px 12px",fontSize:11,whiteSpace:"nowrap"}}>+ New</button>
      <button onClick={()=>{setShowJoinCode(j=>!j);setShowCreate(false);}} style={{...btnS(false),padding:"8px 12px",fontSize:11,whiteSpace:"nowrap"}}>Join</button>
    </div>
    {showCreate&&<div style={{background:C.card,borderRadius:12,padding:16,border:`1px solid ${C.greenLt}`,marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontWeight:700,fontSize:15}}>Create New League</div><button onClick={()=>setShowCreate(false)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button></div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>League Name</div><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Season 2" style={inputS}/></div>
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Match Length</div>
          <div style={{display:"flex",gap:6}}>
            {[[18,"18 holes"],[9,"9 holes"]].map(([v,l])=>(
              <button key={v} onClick={()=>setNewHoleCount(v)} style={{flex:1,padding:"8px 6px",borderRadius:6,border:newHoleCount===v?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:newHoleCount===v?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:12,fontWeight:newHoleCount===v?700:400}}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Schedule Type</div>
          <div style={{display:"flex",gap:6}}>
            {[["single","Single round-robin"],["double","Double round-robin"]].map(([v,l])=>(
              <button key={v} onClick={()=>setNewScheduleType(v)} style={{flex:1,padding:"8px 6px",borderRadius:6,border:newScheduleType===v?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:newScheduleType===v?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:11,fontWeight:newScheduleType===v?700:400}}>{l}</button>
            ))}
          </div>
          <div style={{fontSize:9,color:C.muted,marginTop:4}}>{newScheduleType==="double"?"Each pair plays twice — twice as many weeks":"Each pair plays once"}</div>
        </div>
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Course Rotation</div>
          <div style={{display:"flex",gap:6}}>
            {[["free","Free choice"],["scheduled","Course-of-the-week"]].map(([v,l])=>(
              <button key={v} onClick={()=>setNewCourseRotation(v)} style={{flex:1,padding:"8px 6px",borderRadius:6,border:newCourseRotation===v?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:newCourseRotation===v?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:11,fontWeight:newCourseRotation===v?700:400}}>{l}</button>
            ))}
          </div>
          <div style={{fontSize:9,color:C.muted,marginTop:4}}>{newCourseRotation==="scheduled"?"You'll pick a course per week in the lobby":"First player to tee off picks the course"}</div>
        </div>
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Playoffs</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[["auto","Auto"],["0","None"],["2","Top 2"],["4","Top 4"],["8","Top 8"]].map(([v,l])=>(
              <button key={v} onClick={()=>setNewPlayoffSize(v)} style={{flex:"1 1 60px",padding:"6px 4px",borderRadius:6,border:newPlayoffSize===v?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:newPlayoffSize===v?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:11,fontWeight:newPlayoffSize===v?700:400}}>{l}</button>
            ))}
          </div>
          <div style={{fontSize:9,color:C.muted,marginTop:4}}>{newPlayoffSize==="auto"?"Bracket size based on player count":newPlayoffSize==="0"?"League ends after regular season":`Top ${newPlayoffSize} qualify`}</div>
        </div>
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Handicap Scoring</div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button onClick={()=>setNewUseHcpScoring(h=>!h)} style={{width:48,height:26,borderRadius:13,border:"none",cursor:"pointer",position:"relative",background:newUseHcpScoring?C.greenLt:C.card2,transition:"all 0.2s"}}><div style={{width:20,height:20,borderRadius:10,background:C.white,position:"absolute",top:3,left:newUseHcpScoring?25:3,transition:"left 0.2s"}}/></button>
            <div style={{fontSize:11,color:C.muted}}>{newUseHcpScoring?"Adjusted totals decide winners":"Raw scores decide winners"}</div>
          </div>
          {newUseHcpScoring && <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
            <div style={{fontSize:10,color:C.muted}}>Source</div>
            <div style={{display:"flex",gap:6}}>
              {[["manual","Manual"],["auto","Auto from rounds"]].map(([v,l])=>(
                <button key={v} onClick={()=>setNewHcpSource(v)} style={{flex:1,padding:"6px 6px",borderRadius:6,border:newHcpSource===v?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:newHcpSource===v?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:11,fontWeight:newHcpSource===v?700:400}}>{l}</button>
              ))}
            </div>
            <div style={{fontSize:9,color:C.muted}}>{newHcpSource==="manual"?"Set each player's handicap from the Manage panel":"Computed from each player's saved rounds (best 40% diff). Updates automatically."}</div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <div style={{fontSize:11,color:C.muted}}>Cap:</div>
              <input value={newHcpCap} onChange={e=>setNewHcpCap(e.target.value)} placeholder="e.g. 6" inputMode="numeric" style={{...inputS,width:80}}/>
              <div style={{fontSize:9,color:C.muted}}>Max ±X strokes</div>
            </div>
          </div>}
        </div>
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Weekly Deadline</div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <input value={newDeadlineDays} onChange={e=>setNewDeadlineDays(e.target.value.replace(/[^0-9]/g,""))} placeholder="off" inputMode="numeric" style={{...inputS,width:80}}/>
            <div style={{fontSize:9,color:C.muted}}>{newDeadlineDays?`Auto-forfeit after ${newDeadlineDays} day${newDeadlineDays==="1"?"":"s"} per week`:"No deadline — matches stay open"}</div>
          </div>
        </div>
        <button onClick={async()=>{
          if(!newName.trim())return;
          const playoffSizeOverride = newPlayoffSize==="auto" ? null : parseInt(newPlayoffSize,10);
          const handicapCap = newHcpCap.trim()==="" ? null : (parseInt(newHcpCap,10) || null);
          const weeklyDeadlineDays = newDeadlineDays.trim()==="" ? null : (parseInt(newDeadlineDays,10) || null);
          await createLeague(newName.trim(),{holeCount:newHoleCount,scheduleType:newScheduleType,courseRotation:newCourseRotation,playoffSizeOverride,useHandicapScoring:newUseHcpScoring,handicapSource:newHcpSource,handicapCap,weeklyDeadlineDays});
          setNewName("");setNewHoleCount(18);setNewScheduleType("single");setNewCourseRotation("free");setNewPlayoffSize("auto");setNewUseHcpScoring(false);setNewHcpSource("manual");setNewHcpCap("");setNewDeadlineDays("");setShowCreate(false);
        }} style={{...btnS(true),width:"100%",padding:12,fontSize:14}}>🏆 Create League</button>
        <div style={{fontSize:10,color:C.muted,textAlign:"center"}}>{MIN_LEAGUE_PLAYERS}-{MAX_LEAGUE_PLAYERS} players · You'll get an invite code to share</div>
      </div>
    </div>}
    {showJoinCode&&<div style={{background:C.card,borderRadius:12,padding:16,border:`1px solid ${C.blue}`,marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontWeight:700,fontSize:15}}>Join a League</div><button onClick={()=>setShowJoinCode(false)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button></div>
      <div style={{display:"flex",gap:8}}><input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} placeholder="Enter code..." maxLength={6} style={{...inputS,flex:1,letterSpacing:4,textAlign:"center",fontSize:18,fontWeight:700}}/><button onClick={async()=>{if(!joinCode.trim())return;await joinLeagueByCode(joinCode.trim());setJoinCode("");setShowJoinCode(false);}} style={{...btnS(true),padding:"8px 16px",fontSize:13}}>Join</button></div>
    </div>}
    {isSeason1?<Season1View/>:curLeague?(curLeague.status==="lobby"?<Lobby/>:<Active/>):<div style={{textAlign:"center",padding:30,color:C.muted}}>No league selected. Create or join one above.</div>}
  </div>);
}
