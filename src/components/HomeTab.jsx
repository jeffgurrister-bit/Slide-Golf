import { useState } from "react";
import { C, btnS, inputS } from "../utils/theme.js";
import { RelPar, countHIO, isRoundSealed } from "../utils/helpers.jsx";

export default function HomeTab({
  me, players, rounds, allCourses, playerNames, pgaThisWeek,
  showTourney, setShowTourney, showJoin, setShowJoin, joinInput, setJoinInput, joinLive,
  setTab, setCreating, handleGenerate, iMeJoined, tJoined,
  // Tournament panel props
  curTE, tEntries, tPar, myTRnds, myNextRd, tBoard, tShowAdj, setTShowAdj,
  myTHdcp, setMyTHdcp, joinTourney, updateMyTourneyHdcp, playTourneyRound, playCasualPGA,
  leagueMatches, revealMatchResults
}) {
  const tId = pgaThisWeek?.start;
  const [revealedMatch, setRevealedMatch] = useState(null);
  const [revealPhase, setRevealPhase] = useState(null);

  // Find matches that are complete but I haven't revealed yet
  const pendingReveals = (leagueMatches || []).filter(m =>
    m.status === "complete" &&
    (m.player1 === me || m.player2 === me) &&
    !(m.resultsSeenBy || []).includes(me)
  );

  if (showTourney && pgaThisWeek) return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <button onClick={()=>setShowTourney(false)} style={{...btnS(false),padding:"6px 12px",fontSize:12,alignSelf:"flex-start"}}>← Back</button>
      <div style={{background:"linear-gradient(135deg,#1a2a4a,#2a3a5a)",borderRadius:12,padding:16,border:"1px solid #3a5a8a",textAlign:"center"}}><div style={{fontSize:11,color:C.blue,textTransform:"uppercase",letterSpacing:2}}>PGA Tournament</div><div style={{fontSize:20,fontWeight:700,marginTop:4,color:C.white}}>{pgaThisWeek.tournament}</div><div style={{fontSize:13,color:C.blue,marginTop:4}}>{pgaThisWeek.name} · Par {tPar}</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>4 rounds · Lowest total wins</div><div style={{marginTop:8,fontSize:12,color:C.greenLt}}>{tJoined.length} player{tJoined.length!==1?"s":""} entered</div></div>
      <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
        {!iMeJoined?<><div style={{fontWeight:600,marginBottom:8}}>Join This Tournament</div><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}><div style={{flex:1}}><div style={{fontSize:10,color:C.muted,marginBottom:3}}>Your HDCP (optional)</div><input value={myTHdcp} onChange={e=>setMyTHdcp(e.target.value)} placeholder={String(tPar)} style={{...inputS,width:"100%",textAlign:"left"}}/></div></div><button onClick={()=>joinTourney(tId)} style={{...btnS(true),width:"100%",padding:12}}>🏌️ Join Tournament</button></>
        :<><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontWeight:600}}>You're In! ✓</div><div style={{fontSize:12,color:C.greenLt}}>{myTRnds.length} of 4 rounds</div></div>
          <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}><div style={{flex:1}}><div style={{fontSize:10,color:C.muted,marginBottom:3}}>Your HDCP</div><input value={myTHdcp} onChange={e=>setMyTHdcp(e.target.value)} placeholder={String(tPar)} style={{...inputS,width:"100%",textAlign:"left"}}/></div><button onClick={()=>updateMyTourneyHdcp(tId)} style={{...btnS(false),padding:"8px 12px",fontSize:11,marginTop:14}}>Save</button></div>
          <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>{[1,2,3,4].map(r=>{const rd=myTRnds.find(e=>e.round===r);return<div key={r} style={{background:C.card2,borderRadius:8,padding:8,textAlign:"center"}}><div style={{fontSize:9,color:C.muted}}>R{r}</div>{rd?<><div style={{fontSize:16,fontWeight:700}}>{rd.total}</div><RelPar s={rd.total} p={rd.par}/></>:<div style={{fontSize:12,color:C.muted,marginTop:4}}>—</div>}</div>;})}</div>
          {myNextRd<=4&&<button onClick={()=>playTourneyRound(pgaThisWeek)} style={{...btnS(true),width:"100%",padding:14,marginTop:10,fontSize:15}}>⛳ Play Round {myNextRd}</button>}
          {myNextRd>4&&<div style={{textAlign:"center",marginTop:10,color:C.gold,fontWeight:600}}>🏆 All 4 rounds complete!</div>}
          <button onClick={()=>playCasualPGA(pgaThisWeek)} style={{...btnS(false),width:"100%",padding:8,marginTop:6,fontSize:11,color:C.muted}}>Play Casual (no tournament)</button>
        </>}
      </div>
      <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:C.accent}}><span style={{fontWeight:700,fontSize:13}}>Tournament Leaderboard</span><button onClick={()=>setTShowAdj(a=>!a)} style={{background:"transparent",border:`1px solid ${C.border}`,color:tShowAdj?C.blue:C.muted,borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:10}}>{tShowAdj?"Adjusted":"Raw"}</button></div>
        {tBoard.length===0?<div style={{textAlign:"center",padding:20,color:C.muted,fontSize:12}}>No rounds played yet.</div>
        :<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:380}}><thead><tr style={{background:C.card2}}><th style={{padding:"6px 4px",textAlign:"left"}}>#</th><th style={{padding:"6px 4px",textAlign:"left"}}>Player</th><th style={{padding:"6px 3px",textAlign:"center"}}>R1</th><th style={{padding:"6px 3px",textAlign:"center"}}>R2</th><th style={{padding:"6px 3px",textAlign:"center"}}>R3</th><th style={{padding:"6px 3px",textAlign:"center"}}>R4</th><th style={{padding:"6px 4px",textAlign:"center"}}>Tot</th><th style={{padding:"6px 4px",textAlign:"center"}}>+/-</th>{tShowAdj&&<th style={{padding:"6px 4px",textAlign:"center",color:C.blue}}>Adj</th>}</tr></thead><tbody>{tBoard.map((p,i)=>{const toPar=p.tot-p.par;return<tr key={p.player} style={{borderTop:`1px solid ${C.border}`,background:p.player===me?"rgba(74,170,74,0.06)":"transparent"}}><td style={{padding:"6px 4px",fontWeight:700,color:i===0?C.gold:C.muted}}>{i+1}</td><td style={{padding:"6px 4px",fontWeight:600,fontSize:11}}>{p.player}{p.hd&&<span style={{fontSize:9,color:C.blue,marginLeft:3}}>({p.hd})</span>}</td>{[1,2,3,4].map(r=><td key={r} style={{padding:"6px 3px",textAlign:"center",color:p.rScores[r]?(p.rScores[r].total-p.rScores[r].par<0?C.greenLt:p.rScores[r].total-p.rScores[r].par>0?C.red:C.text):C.muted}}>{p.rScores[r]?p.rScores[r].total:"—"}</td>)}<td style={{padding:"6px 4px",textAlign:"center",fontWeight:700}}>{p.tot}</td><td style={{padding:"6px 4px",textAlign:"center",fontWeight:700,color:toPar<0?C.greenLt:toPar>0?C.red:C.text}}>{toPar===0?"E":toPar>0?`+${toPar}`:toPar}</td>{tShowAdj&&<td style={{padding:"6px 4px",textAlign:"center",color:C.blue,fontWeight:700}}>{p.adjTot!=null?(p.adjTot>0?`+${p.adjTot}`:p.adjTot||"E"):"—"}</td>}</tr>;})}</tbody></table></div>}
      </div>
      {tJoined.length>0&&<div style={{background:C.card,borderRadius:8,padding:10,border:`1px solid ${C.border}`}}><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Entered Players</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{tJoined.map(p=>{const hasRnds=curTE.some(e=>e.player===p&&e.round>0);return<span key={p} style={{background:hasRnds?C.accent:C.card2,padding:"3px 8px",borderRadius:12,fontSize:11,color:hasRnds?C.greenLt:C.muted}}>{p}{hasRnds?` (${curTE.filter(e=>e.player===p&&e.round>0).length})`:""}</span>;})}</div></div>}
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Match Reveal Cards */}
      {pendingReveals.map(m => {
        const opp = m.player1 === me ? m.player2 : m.player1;
        const isRevealing = revealedMatch === m.id;

        if (isRevealing && revealPhase === "shown") {
          const myScore = m.player1 === me ? m.p1Total : m.p2Total;
          const oppScore = m.player1 === me ? m.p2Total : m.p1Total;
          const iWon = m.winner === me;
          const isTie = m.winner === "Tie";
          return (
            <div key={m.id} style={{
              background: iWon ? "linear-gradient(135deg,#1a2a1a,#2a3a2a)" : isTie ? "linear-gradient(135deg,#2a2a1a,#3a3a2a)" : "linear-gradient(135deg,#2a1a1a,#3a2a2a)",
              borderRadius: 12, padding: 20,
              border: `2px solid ${iWon ? "#4abb4a" : isTie ? "#d4b84a" : "#ef4444"}`,
              textAlign: "center", animation: "fadeIn 0.5s ease"
            }}>
              <div style={{fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 2}}>
                {m.roundType === "F" ? "🏆 Championship" : m.roundType === "SF" ? "Semifinal" : m.roundType === "QF" ? "Quarterfinal" : "League Match"}
              </div>
              <div style={{fontSize: 13, color: C.muted, marginTop: 4}}>{m.course}</div>
              <div style={{display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, marginTop: 16, alignItems: "center"}}>
                <div style={{textAlign: "center"}}>
                  <div style={{fontSize: 14, fontWeight: 700, color: m.winner === m.player1 ? "#4abb4a" : C.text}}>{m.player1}</div>
                  <div style={{fontSize: 28, fontWeight: 900, color: "#fff", marginTop: 4}}>{m.p1Total}</div>
                </div>
                <div style={{fontSize: 16, fontWeight: 700, color: C.muted}}>vs</div>
                <div style={{textAlign: "center"}}>
                  <div style={{fontSize: 14, fontWeight: 700, color: m.winner === m.player2 ? "#4abb4a" : C.text}}>{m.player2}</div>
                  <div style={{fontSize: 28, fontWeight: 900, color: "#fff", marginTop: 4}}>{m.p2Total}</div>
                </div>
              </div>
              <div style={{marginTop: 12, fontSize: 14, fontWeight: 700, color: iWon ? "#4abb4a" : isTie ? C.gold : C.red}}>
                {iWon ? `You win by ${m.margin}!` : isTie ? "It's a tie!" : `${m.winner} wins by ${m.margin}`}
              </div>
            </div>
          );
        }

        return (
          <div key={m.id} style={{
            background: "linear-gradient(135deg,#1a2a4a,#2a3a5a)",
            borderRadius: 12, padding: 20,
            border: "2px solid #d4b84a", textAlign: "center", cursor: "pointer"
          }} onClick={async () => {
            setRevealedMatch(m.id);
            setRevealPhase("animating");
            setTimeout(() => setRevealPhase("shown"), 800);
            await revealMatchResults(m.id);
          }}>
            <div style={{fontSize: 24}}>🏆</div>
            <div style={{fontSize: 16, fontWeight: 700, color: "#d4b84a", marginTop: 8}}>Match Results Are In!</div>
            <div style={{fontSize: 13, color: C.muted, marginTop: 4}}>vs {opp} · {m.course || "Unknown Course"}</div>
            {isRevealing && revealPhase === "animating"
              ? <div style={{marginTop: 12, fontSize: 14, color: "#d4b84a", fontWeight: 600, animation: "pulse 0.8s infinite"}}>Revealing...</div>
              : <div style={{marginTop: 12, padding: "10px 24px", background: "rgba(212,184,74,0.2)", borderRadius: 8, display: "inline-block", fontSize: 14, fontWeight: 700, color: "#d4b84a"}}>Tap to Reveal</div>
            }
          </div>
        );
      })}

      <div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:26,fontWeight:700,letterSpacing:3,textTransform:"uppercase"}}>Slide Golf</div><div style={{color:C.muted,marginTop:4,fontSize:13}}>League Scorecard & Tracker</div></div>
      <button onClick={()=>setTab("play")} style={{...btnS(true),padding:16,fontSize:16,width:"100%"}}>⛳ Start New Round</button>
      <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
        {!showJoin?<button onClick={()=>setShowJoin(true)} style={{...btnS(false),width:"100%",padding:12,fontSize:14,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",color:C.red}}>📡 Join Live Round</button>
        :<div style={{display:"flex",flexDirection:"column",gap:8}}><div style={{fontWeight:600,fontSize:13}}>Enter Room Code</div><div style={{display:"flex",gap:8}}><input value={joinInput} onChange={e=>setJoinInput(e.target.value.toUpperCase().slice(0,4))} placeholder="ABCD" maxLength={4} style={{...inputS,textAlign:"center",fontSize:20,letterSpacing:6,fontWeight:700,textTransform:"uppercase"}}/><button onClick={joinLive} disabled={joinInput.length!==4} style={{...btnS(true),opacity:joinInput.length===4?1:0.4}}>Join</button></div><button onClick={()=>{setShowJoin(false);setJoinInput("");}} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:11}}>Cancel</button></div>}
      </div>
      {pgaThisWeek?<button onClick={()=>setShowTourney(true)} style={{...btnS(false),padding:14,fontSize:14,width:"100%",background:"linear-gradient(135deg,#1a2a4a,#2a3a5a)",border:"1px solid #3a5a8a",color:C.blue}}>📺 {pgaThisWeek.tournament}{iMeJoined?" ✓":""}<span style={{fontSize:11,display:"block",opacity:0.7}}>{pgaThisWeek.name} · {tJoined.length} player{tJoined.length!==1?"s":""} entered</span></button>
      :<button onClick={()=>alert("No PGA Tour event this week!")} style={{...btnS(false),padding:14,fontSize:14,width:"100%",background:"linear-gradient(135deg,#1a2a4a,#2a3a5a)",border:"1px solid #3a5a8a",color:C.blue}}>📺 No PGA Event This Week</button>}
      <button onClick={()=>{setCreating(true);setTab("courses");}} style={{...btnS(false),padding:14,fontSize:14,width:"100%",background:"linear-gradient(135deg,#1a3a2a,#2a4a3a)",border:`1px solid ${C.green}`}}>✏️ Create a Course</button>
      <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}><div style={{fontWeight:600,marginBottom:10,fontSize:14}}>🎲 Generate a Course</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{["Easy","Medium","Hard","Expert"].map(d=>(<button key={d} onClick={()=>handleGenerate(d)} style={{padding:"12px",borderRadius:8,border:`1px solid ${C.border}`,cursor:"pointer",fontWeight:600,fontSize:13,background:d==="Easy"?"rgba(74,170,74,0.15)":d==="Medium"?"rgba(212,184,74,0.15)":d==="Hard"?"rgba(239,68,68,0.15)":"rgba(138,68,239,0.15)",color:d==="Easy"?C.greenLt:d==="Medium"?C.gold:d==="Hard"?C.red:"#b48af8"}}>{d==="Easy"?"🟢":d==="Medium"?"🟡":d==="Hard"?"🔴":"💀"} {d}</button>))}</div></div>
      <button onClick={()=>setTab("league")} style={{...btnS(false),padding:14,fontSize:14,width:"100%",background:"linear-gradient(135deg,#2a1a1a,#3a2a1a)",border:"1px solid #5a4a2a",color:C.gold}}>🏆 League — Season 1</button>
      <button onClick={()=>setTab("leaderboard")} style={{...btnS(false),padding:14,fontSize:14,width:"100%"}}>📊 Leaderboard</button>
      <div style={{background:C.card,borderRadius:12,padding:16,border:`1px solid ${C.border}`}}><div style={{fontWeight:600,marginBottom:10}}>Quick Stats</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>{[[playerNames.length,"Players"],[rounds.length,"Rounds"],[allCourses.length,"Courses"]].map(([v,l])=>(<div key={l} style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:700,color:C.greenLt}}>{v}</div><div style={{fontSize:10,color:C.muted}}>{l}</div></div>))}</div></div>
      {rounds.length>0&&<div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}><div style={{fontWeight:600,marginBottom:8}}>Recent Rounds</div>{rounds.slice(0,5).map(r=>{const hio=r.holeInOnes||countHIO(r.scores)||0;const sealed=isRoundSealed(r,leagueMatches,me);return<div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}><div><span style={{fontWeight:600}}>{r.player}</span><span style={{color:C.muted,fontSize:11,marginLeft:8}}>{r.course}</span></div><div style={{display:"flex",gap:6,alignItems:"center"}}>{sealed?<span style={{color:C.muted,fontSize:11}}>🔒 Sealed</span>:r.hidden?<span style={{color:C.muted,fontSize:11}}>🙈</span>:<><span style={{fontWeight:700}}>{r.total}</span><RelPar s={r.total} p={r.par}/></>}{!sealed&&hio>0&&<span style={{fontSize:10,color:"#ff6b00"}}>🎯{hio}</span>}</div></div>;})}</div>}
    </div>
  );
}
