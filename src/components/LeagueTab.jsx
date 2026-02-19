import { useState } from "react";
import { S1_STANDINGS, S1_RESULTS, S1_PLAYOFFS, LEAGUE_FORMATS, computeStandings } from "../data/league.js";
import { C, btnS, inputS } from "../utils/theme.js";

export default function LeagueTab({
  me, leagueView, setLeagueView, leagueRdFilter, setLeagueRdFilter,
  leagues, leagueMatches, allCourses,
  createLeague, joinLeagueByCode, startLeagueSeason, playLeagueMatch,
  selectedLeague, setSelectedLeague
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHdcp, setNewHdcp] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const myLeagues = (leagues || []).filter(lg => lg.players?.includes(me));
  const isSeason1 = selectedLeague === "s1" || (!selectedLeague && myLeagues.length === 0);
  const curLeague = isSeason1 ? null : myLeagues.find(lg => lg.id === selectedLeague);
  const curMatches = curLeague ? (leagueMatches || []).filter(m => m.leagueId === curLeague.id) : [];
  const dynStandings = curLeague ? computeStandings(curLeague.players || [], curMatches) : [];

  // S1 Finals
  const s1Final = S1_PLAYOFFS.find(g => g[4] === "F");
  const s1FinalP1 = s1Final?.[5], s1FinalP2 = s1Final?.[7];
  const s1FinalComplete = s1Final?.[9] != null;
  const s1Champion = s1Final?.[9];
  const canPlayS1Final = !s1FinalComplete && s1FinalP1 && s1FinalP2 && (me === s1FinalP1 || me === s1FinalP2);
  const s1Status = s1FinalComplete ? "Complete" : "Finals";

  // ─── LEAGUE SELECTOR ───────────────────────────────────
  const LeagueSelector = () => (
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
      <select value={selectedLeague||"s1"} onChange={e=>{setSelectedLeague(e.target.value);setShowCreate(false);setShowJoinCode(false);}} style={{flex:1,padding:"8px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:C.card2,color:C.text,fontSize:13,fontWeight:600,outline:"none"}}>
        <option value="s1">🏆 Season 1{s1FinalComplete?" — Champ: "+s1Champion:""}</option>
        {myLeagues.map(lg=>(<option key={lg.id} value={lg.id}>{lg.status==="complete"?"🏆":"⚡"} {lg.name} ({lg.players?.length||0}p)</option>))}
      </select>
      <button onClick={()=>{setShowCreate(c=>!c);setShowJoinCode(false);}} style={{...btnS(true),padding:"8px 12px",fontSize:11,whiteSpace:"nowrap"}}>+ New</button>
      <button onClick={()=>{setShowJoinCode(j=>!j);setShowCreate(false);}} style={{...btnS(false),padding:"8px 12px",fontSize:11,whiteSpace:"nowrap"}}>Join</button>
    </div>
  );

  // ─── CREATE LEAGUE ─────────────────────────────────────
  const CreateForm = () => (
    <div style={{background:C.card,borderRadius:12,padding:16,border:`1px solid ${C.greenLt}`,marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontWeight:700,fontSize:15}}>Create New League</div><button onClick={()=>setShowCreate(false)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button></div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>League Name</div><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Season 2" style={inputS}/></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600,fontSize:13}}>📊 Handicaps</div><div style={{fontSize:10,color:C.muted}}>Adjusted scoring</div></div><button onClick={()=>setNewHdcp(h=>!h)} style={{width:48,height:26,borderRadius:13,border:"none",cursor:"pointer",position:"relative",background:newHdcp?C.greenLt:C.card2,transition:"all 0.2s"}}><div style={{width:20,height:20,borderRadius:10,background:C.white,position:"absolute",top:3,left:newHdcp?25:3,transition:"left 0.2s"}}/></button></div>
        <button onClick={async()=>{if(!newName.trim())return;await createLeague(newName.trim(),newHdcp);setNewName("");setNewHdcp(false);setShowCreate(false);}} style={{...btnS(true),width:"100%",padding:12,fontSize:14}}>🏆 Create League</button>
        <div style={{fontSize:10,color:C.muted,textAlign:"center"}}>You'll get an invite code to share</div>
      </div>
    </div>
  );

  // ─── JOIN LEAGUE ───────────────────────────────────────
  const JoinForm = () => (
    <div style={{background:C.card,borderRadius:12,padding:16,border:`1px solid ${C.blue}`,marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontWeight:700,fontSize:15}}>Join a League</div><button onClick={()=>setShowJoinCode(false)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button></div>
      <div style={{display:"flex",gap:8}}><input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase().slice(0,6))} placeholder="CODE" maxLength={6} style={{...inputS,textAlign:"center",fontSize:18,letterSpacing:4,fontWeight:700}}/><button onClick={async()=>{if(!joinCode.trim())return;await joinLeagueByCode(joinCode.trim());setJoinCode("");setShowJoinCode(false);}} style={{...btnS(true),whiteSpace:"nowrap"}}>Join</button></div>
    </div>
  );

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
          {!canPlayS1Final && !s1FinalComplete && <div style={{marginTop:16,fontSize:12,color:C.muted}}>Championship awaits...</div>}
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
  const Lobby = () => (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{margin:0,fontSize:18}}>⚡ {curLeague.name}</h2><span style={{background:"rgba(138,180,248,0.2)",color:C.blue,padding:"3px 10px",borderRadius:12,fontSize:11,fontWeight:600}}>Lobby</span></div>
      <div style={{background:"linear-gradient(135deg,#1a2a1a,#2a3a2a)",borderRadius:12,padding:20,border:`2px solid ${C.greenLt}`,textAlign:"center"}}><div style={{fontSize:11,color:C.greenLt,textTransform:"uppercase",letterSpacing:3}}>Invite Code</div><div style={{fontSize:40,fontWeight:900,letterSpacing:8,color:C.white,marginTop:8}}>{curLeague.code}</div><div style={{fontSize:12,color:C.muted,marginTop:8}}>Share this code with friends</div></div>
      <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}><div style={{fontWeight:700,marginBottom:10}}>Players ({curLeague.players?.length||0})</div>{(curLeague.players||[]).map(p=>(<div key={p} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.card2,borderRadius:8,padding:"8px 12px",marginBottom:4}}><span style={{fontWeight:600,color:p===me?C.greenLt:C.text}}>{p}{p===me?" (you)":""}</span>{p===curLeague.creator&&<span style={{fontSize:10,color:C.gold}}>👑</span>}</div>))}</div>
      {curLeague.creator===me&&(curLeague.players?.length||0)>=4&&LEAGUE_FORMATS[curLeague.players.length]&&<div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}><div style={{fontWeight:700,marginBottom:8}}>Ready to Start?</div><div style={{background:C.card2,borderRadius:8,padding:10,marginBottom:10}}><div style={{fontWeight:600,fontSize:13}}>{LEAGUE_FORMATS[curLeague.players.length].name}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{LEAGUE_FORMATS[curLeague.players.length].desc}</div></div><button onClick={()=>startLeagueSeason(curLeague.id)} style={{...btnS(true),width:"100%",padding:14,fontSize:15}}>🏆 Start Season</button></div>}
      {curLeague.creator!==me&&<div style={{textAlign:"center",padding:20,color:C.muted,fontSize:12}}>Waiting for {curLeague.creator} to start...</div>}
    </div>
  );

  // ─── DYNAMIC LEAGUE: ACTIVE ───────────────────────────
  const Active = () => {
    const totalRds = curLeague.totalRounds||1;
    const regMatches = curMatches.filter(m=>m.roundType==="regular");
    const poMatches = curMatches.filter(m=>m.roundType!=="regular");
    const done = regMatches.filter(m=>m.status==="complete").length;
    const myPending = [...regMatches,...poMatches].filter(m=>m.status!=="complete"&&(m.player1===me||m.player2===me));

    return (<div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{margin:0,fontSize:18}}>⚡ {curLeague.name}</h2><span style={{background:curLeague.status==="playoffs"?"rgba(212,184,74,0.2)":"rgba(74,170,74,0.2)",color:curLeague.status==="playoffs"?C.gold:C.greenLt,padding:"3px 10px",borderRadius:12,fontSize:11,fontWeight:600}}>{curLeague.status==="playoffs"?"Playoffs":curLeague.status==="complete"?"Complete":`${done}/${regMatches.length} played`}</span></div>
      <div style={{display:"flex",gap:4}}>{[["standings","Standings"],["schedule","Schedule"],["bracket","Bracket"]].map(([k,l])=>(<button key={k} onClick={()=>setLeagueView(k)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:leagueView===k?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:leagueView===k?C.accent:C.card,color:leagueView===k?C.white:C.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>{l}</button>))}</div>

      {/* My pending matches */}
      {leagueView==="standings"&&myPending.length>0&&<div style={{background:"rgba(74,170,74,0.06)",borderRadius:12,padding:14,border:`1px solid ${C.greenLt}`}}>
        <div style={{fontWeight:700,marginBottom:8,fontSize:13}}>🎯 Your Matches</div>
        {myPending.map(m=>{const opp=m.player1===me?m.player2:m.player1;const iPlayed=(m.player1===me&&m.p1Total!=null)||(m.player2===me&&m.p2Total!=null);const isF=m.roundType==="F";return(<div key={m.id} style={{background:isF?"linear-gradient(135deg,#2a1a00,#1a0f00)":C.card,borderRadius:8,padding:12,border:`1px solid ${isF?"#d4b84a":C.border}`,marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,fontSize:14,color:isF?"#d4b84a":C.text}}>{isF?"🏆 Championship vs ":"vs "}{opp}</div><div style={{fontSize:10,color:C.muted}}>Rd {m.round}{m.roundType!=="regular"?` · ${m.roundType}`:""}{m.course?` · ${m.course}`:""}</div></div>{iPlayed?<div style={{fontSize:11,color:C.greenLt,fontWeight:600}}>✓ Played — Waiting for opponent</div>:<button onClick={()=>playLeagueMatch(m.id)} style={{...btnS(true),padding:"8px 16px",fontSize:12}}>⛳ {isF?"TEE OFF":"Play"}</button>}</div></div>);})}
      </div>}

      {/* Standings table */}
      {leagueView==="standings"&&<div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:400}}><thead><tr style={{background:C.accent}}><th style={{padding:"8px 6px",textAlign:"left"}}>#</th><th style={{padding:"8px 4px",textAlign:"left"}}>Player</th><th style={{padding:"8px 4px",textAlign:"center"}}>Pts</th><th style={{padding:"8px 4px",textAlign:"center"}}>W</th><th style={{padding:"8px 4px",textAlign:"center"}}>L</th><th style={{padding:"8px 4px",textAlign:"center"}}>T</th><th style={{padding:"8px 4px",textAlign:"center"}}>+/-</th><th style={{padding:"8px 4px",textAlign:"center"}}>Avg</th></tr></thead><tbody>{dynStandings.map((s,i)=>{const fmt=LEAGUE_FORMATS[curLeague.players?.length];const inPO=fmt&&i<fmt.playoffSize;return(<tr key={s.player} style={{borderTop:`1px solid ${C.border}`,background:inPO?"rgba(74,170,74,0.04)":"transparent"}}><td style={{padding:"8px 6px",fontWeight:700,color:i===0?C.gold:inPO?C.greenLt:C.muted}}>{i+1}</td><td style={{padding:"8px 4px",fontWeight:600,fontSize:11,color:s.player===me?C.greenLt:C.text}}>{s.player}{s.player===me?" (you)":""}</td><td style={{padding:"8px 4px",textAlign:"center",fontWeight:700,color:C.gold}}>{s.pts}</td><td style={{padding:"8px 4px",textAlign:"center",color:C.greenLt}}>{s.w}</td><td style={{padding:"8px 4px",textAlign:"center",color:C.red}}>{s.l}</td><td style={{padding:"8px 4px",textAlign:"center",color:C.muted}}>{s.t}</td><td style={{padding:"8px 4px",textAlign:"center",fontWeight:700,color:s.diff<0?C.greenLt:s.diff>0?C.red:C.muted}}>{s.diff===0?"E":s.diff>0?`+${s.diff}`:s.diff}</td><td style={{padding:"8px 4px",textAlign:"center"}}>{s.avg||"—"}</td></tr>);})}</tbody></table></div>{LEAGUE_FORMATS[curLeague.players?.length]&&<div style={{padding:"8px 12px",background:C.card2,fontSize:10,color:C.muted,borderTop:`1px solid ${C.border}`}}>Top {LEAGUE_FORMATS[curLeague.players.length].playoffSize} qualify · Win=2pts, Tie=1pt</div>}</div>}

      {/* Schedule */}
      {leagueView==="schedule"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>{Array.from({length:totalRds},(_,ri)=>{const rd=ri+1;const rm=regMatches.filter(m=>m.round===rd);if(!rm.length)return null;return(<div key={rd}><div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:6}}>Round {rd}</div>{rm.map(m=>{const my=m.player1===me||m.player2===me;const p1Score=m.p1Total!=null?(m.status==="complete"||m.player1===me?String(m.p1Total):"🔒"):"";const p2Score=m.p2Total!=null?(m.status==="complete"||m.player2===me?String(m.p2Total):"🔒"):"";return(<div key={m.id} style={{background:my?"rgba(74,170,74,0.06)":C.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${my?C.greenLt:C.border}`,marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12}}><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:m.winner===m.player1?700:400,color:m.winner===m.player1?C.greenLt:C.text}}>{m.player1}</span><span style={{fontWeight:700}}>{p1Score}</span></div><div style={{display:"flex",justifyContent:"space-between",marginTop:2}}><span style={{fontWeight:m.winner===m.player2?700:400,color:m.winner===m.player2?C.greenLt:C.text}}>{m.player2}</span><span style={{fontWeight:700}}>{p2Score}</span></div></div><div style={{textAlign:"right",marginLeft:12,minWidth:70}}><div style={{fontSize:10,color:C.muted}}>{m.course||"TBD"}</div>{m.status==="complete"?<div style={{fontWeight:700,fontSize:11,color:m.winner==="Tie"?C.muted:C.gold,marginTop:2}}>{m.winner==="Tie"?"Tie":m.winner}</div>:my?<button onClick={()=>playLeagueMatch(m.id)} style={{...btnS(true),padding:"4px 10px",fontSize:10,marginTop:2}}>Play</button>:<div style={{fontSize:10,color:C.muted,marginTop:2}}>Pending</div>}</div></div>);})}</div>);})}</div>}

      {/* Bracket */}
      {leagueView==="bracket"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
        {(curLeague.status==="playoffs"||curLeague.status==="complete")&&poMatches.length>0?
          poMatches.sort((a,b)=>{const o={QF:0,SF:1,F:2};return(o[a.roundType]||0)-(o[b.roundType]||0);}).map(m=>{const my=m.player1===me||m.player2===me;const isF=m.roundType==="F";const p1Score=m.p1Total!=null?(m.status==="complete"||m.player1===me?m.p1Total:"🔒"):"";const p2Score=m.p2Total!=null?(m.status==="complete"||m.player2===me?m.p2Total:"🔒"):"";return(<div key={m.id} style={{background:isF?"linear-gradient(135deg,#2a1a00,#1a0f00)":C.card,borderRadius:8,padding:12,border:`1px solid ${isF?"#d4b84a":C.border}`}}><div style={{fontSize:10,color:isF?C.gold:C.muted,marginBottom:4,fontWeight:600}}>{m.roundType==="QF"?"Quarterfinal":m.roundType==="SF"?"Semifinal":"🏆 Championship"}{m.course?` · ${m.course}`:""}</div>{m.player1&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:m.winner===m.player1?700:400,color:m.winner===m.player1?C.greenLt:C.text}}>{m.player1}</span><span style={{fontWeight:700}}>{p1Score}</span></div>}{m.player2&&<div style={{display:"flex",justifyContent:"space-between",marginTop:2}}><span style={{fontWeight:m.winner===m.player2?700:400,color:m.winner===m.player2?C.greenLt:C.text}}>{m.player2}</span><span style={{fontWeight:700}}>{p2Score}</span></div>}{m.status==="complete"&&m.winner&&<div style={{textAlign:"right",fontSize:10,color:C.gold,marginTop:4}}>Winner: {m.winner}</div>}{m.status!=="complete"&&my&&m.player1&&m.player2&&<button onClick={()=>playLeagueMatch(m.id)} style={{...btnS(true),width:"100%",padding:10,marginTop:8,fontSize:12}}>⛳ Play</button>}{m.status!=="complete"&&(!m.player1||!m.player2)&&<div style={{textAlign:"center",fontSize:11,color:C.muted,marginTop:4}}>Awaiting results...</div>}</div>);})
        :<div style={{textAlign:"center",padding:30,color:C.muted}}><div style={{fontSize:14}}>🏆</div><div style={{marginTop:8}}>Bracket unlocks after regular season</div><div style={{fontSize:11,marginTop:4}}>{done}/{regMatches.length} matches complete</div></div>}
      </div>}
    </div>);
  };

  // ─── MAIN RENDER ──────────────────────────────────────
  return (<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <LeagueSelector/>
    {showCreate&&<CreateForm/>}
    {showJoinCode&&<JoinForm/>}
    {isSeason1?<Season1View/>:curLeague?(curLeague.status==="lobby"?<Lobby/>:<Active/>):<div style={{textAlign:"center",padding:30,color:C.muted}}>No league selected. Create or join one above.</div>}
  </div>);
}
