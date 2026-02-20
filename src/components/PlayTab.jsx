import { C, btnS, smallInput } from "../utils/theme.js";
import { calcPar, fmtR, fmtRange, calcNeed, scoreName, countHIO, RelPar } from "../utils/helpers.jsx";

export default function PlayTab({
  me, selCourse, setSelCourse, allCourses, playMode, setPlayMode, pgaThisWeek,
  roundPlayers, setRoundPlayers, playerNames, addToRound, beginPlay,
  activeTourney, setActiveTourney, setShowTourney, setTab,
  hideScores, setHideScores, useHdcp, setUseHdcp, hdcps, setHdcps,
  allScores, setAllScores, allShotLogs, setAllShotLogs,
  curHole, curPlayerIdx, setCurPlayerIdx, holeState,
  showScorecard, setShowScorecard,
  nine, setNine, setQuickScore,
  isLive, liveData, liveScoreMode, setLiveScoreMode, isSpectator, isKeeperHost,
  goLive, leaveLive,
  recordShot, undoShot, finishHole, goToPrevHole, saveRound, getRunningScore,
  LiveBadge, ScorecardView,
  // Feature 17
  shareRef, generateShareCard, ScoreCell
}) {
  const curPlayer = roundPlayers[curPlayerIdx];
  const curHS = holeState[curPlayer];
  const curHD = selCourse?.holes[curHole];

  // Share card for review screen (pre-save, single player only)
  function renderReviewShareCard(playerName) {
    if (!selCourse || !shareRef) return null;
    const sc = allScores[playerName] || Array(18).fill(null);
    const totalPar = selCourse.holes.reduce((s,h)=>s+h.par,0);
    return <div ref={shareRef} style={{position:"fixed",left:-9999,top:0,width:800,background:"#f5f0e0",fontFamily:"Georgia,serif",padding:0}}>
      <div style={{background:"linear-gradient(135deg,#c4a960,#d4b84a)",padding:"16px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:28,fontWeight:900,textTransform:"uppercase",letterSpacing:3,color:"#1a2a00"}}>{selCourse.name}</div>
          <div style={{fontSize:12,color:"#3a4a1a",marginTop:2}}>{new Date().toISOString().split("T")[0]}</div>
        </div>
        <div style={{background:"#1a2a00",color:"#d4b84a",padding:"4px 12px",borderRadius:4,fontSize:11,fontWeight:700}}>{(selCourse.level||"").toUpperCase()}</div>
      </div>
      {[0,9].map(start => (
        <table key={start} style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{background:"#2d6a2d",color:"#fff"}}>
            <th style={{padding:"6px 8px",textAlign:"left",width:80}}>HOLE</th>
            {selCourse.holes.slice(start,start+9).map((h,i)=><th key={i} style={{padding:"6px 4px",textAlign:"center",width:60}}>{start+i+1}</th>)}
            <th style={{padding:"6px 4px",textAlign:"center",width:60,fontWeight:900}}>{start===0?"OUT":"IN"}</th>
            {start===9&&<th style={{padding:"6px 4px",textAlign:"center",width:60,fontWeight:900}}>TOT</th>}
          </tr></thead>
          <tbody>
            <tr style={{background:"#e8f0d8"}}>
              <td style={{padding:"4px 8px",fontWeight:700,color:"#2d6a2d",fontSize:11}}>RANGE</td>
              {selCourse.holes.slice(start,start+9).map((h,i)=><td key={i} style={{textAlign:"center",fontSize:10,color:"#5a7a3a"}}>{fmtR(h.range)}</td>)}
              <td style={{textAlign:"center",fontSize:10,color:"#5a7a3a"}}>{fmtRange(selCourse.holes,start,start+9)}</td>
              {start===9&&<td style={{textAlign:"center",fontSize:10,color:"#5a7a3a"}}>{fmtRange(selCourse.holes,0,18)}</td>}
            </tr>
            <tr style={{background:"#fff"}}>
              <td style={{padding:"4px 8px",fontWeight:700}}>PAR</td>
              {selCourse.holes.slice(start,start+9).map((h,i)=><td key={i} style={{textAlign:"center",fontWeight:600}}>{h.par}</td>)}
              <td style={{textAlign:"center",fontWeight:900}}>{calcPar(selCourse.holes,start,start+9)}</td>
              {start===9&&<td style={{textAlign:"center",fontWeight:900,color:"#2d6a2d"}}>{totalPar}</td>}
            </tr>
            <tr style={{borderTop:"1px solid #ccc",background:"#fff"}}>
              <td style={{padding:"4px 8px",fontWeight:700,fontSize:12}}>{playerName}</td>
              {sc.slice(start,start+9).map((v,i)=>{
                const par = selCourse.holes[start+i]?.par;
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
            </tr>
          </tbody>
        </table>
      ))}
      <div style={{borderTop:"2px dashed #2d6a2d",margin:"12px 24px 0",padding:"10px 0",textAlign:"center"}}>
        <span style={{letterSpacing:8,fontSize:14,fontWeight:700,color:"#2d6a2d"}}>S L I D E  G O L F</span>
      </div>
    </div>;
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Course selection */}
      {!selCourse&&<><h2 style={{margin:0,fontSize:18}}>Select Course</h2>{pgaThisWeek&&<button onClick={()=>{setShowTourney(true);setTab("home");}} style={{...btnS(false),width:"100%",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(135deg,#1a2a4a,#2a3a5a)",border:"1px solid #3a5a8a"}}><span style={{fontWeight:600,color:C.blue}}>📺 {pgaThisWeek.tournament}</span><span style={{fontSize:11,opacity:0.7,color:C.blue}}>Tournament</span></button>}{allCourses.map(c=>(<button key={c.id} onClick={()=>{setSelCourse(c);setRoundPlayers([]);setAllScores({});setAllShotLogs({});setPlayMode("setup");setActiveTourney(null);}} style={{...btnS(false),width:"100%",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontWeight:600}}>{c.name}</span><span style={{fontSize:11,opacity:0.7}}>Par {c.holes.reduce((s,h)=>s+h.par,0)} · {c.level}</span></button>))}</>}

      {/* Setup */}
      {selCourse&&playMode==="setup"&&<>
        {activeTourney&&<div style={{background:"linear-gradient(135deg,#1a2a4a,#2a3a5a)",borderRadius:10,padding:10,border:"1px solid #3a5a8a",textAlign:"center"}}><div style={{fontSize:11,color:C.blue}}>🏌️ Tournament Round {activeTourney.round}</div><div style={{fontSize:13,fontWeight:700,color:C.white}}>{activeTourney.tournament}</div></div>}
        <LiveBadge/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,fontSize:16}}>{selCourse.name}</div><div style={{fontSize:11,color:C.muted}}>Par {selCourse.holes.reduce((s,h)=>s+h.par,0)}</div></div><button onClick={()=>{setSelCourse(null);setActiveTourney(null);if(isLive)leaveLive();}} style={{...btnS(false),padding:"4px 10px",fontSize:11}}>Change</button></div>
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1,background:C.card,borderRadius:12,padding:12,border:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600,fontSize:13}}>🙈 Hidden</div><div style={{fontSize:10,color:C.muted}}>Tournament</div></div><button onClick={()=>setHideScores(h=>!h)} style={{width:48,height:26,borderRadius:13,border:"none",cursor:"pointer",position:"relative",background:hideScores?C.greenLt:C.card2,transition:"all 0.2s"}}><div style={{width:20,height:20,borderRadius:10,background:C.white,position:"absolute",top:3,left:hideScores?25:3,transition:"left 0.2s"}}/></button></div>
          <div style={{flex:1,background:C.card,borderRadius:12,padding:12,border:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600,fontSize:13}}>📊 Handicaps</div><div style={{fontSize:10,color:C.muted}}>Adjusted</div></div><button onClick={()=>setUseHdcp(h=>!h)} style={{width:48,height:26,borderRadius:13,border:"none",cursor:"pointer",position:"relative",background:useHdcp?C.greenLt:C.card2,transition:"all 0.2s"}}><div style={{width:20,height:20,borderRadius:10,background:C.white,position:"absolute",top:3,left:useHdcp?25:3,transition:"left 0.2s"}}/></button></div>
        </div>
        <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
          <div style={{fontWeight:600,marginBottom:8}}>Players {isLive&&<span style={{fontSize:10,color:C.muted,fontWeight:400}}>(live synced)</span>}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>{roundPlayers.map(p=>(<span key={p} style={{background:C.accent,padding:"4px 10px",borderRadius:20,fontSize:12}}>{p}{p===me&&isLive?" (you)":""} {!isLive&&<span onClick={()=>{setRoundPlayers(rp=>rp.filter(x=>x!==p));setHdcps(h=>{const n={...h};delete n[p];return n;});}} style={{cursor:"pointer",opacity:0.6,marginLeft:4}}>×</span>}</span>))}</div>
          {!isLive&&<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{playerNames.filter(n=>!roundPlayers.includes(n)).map(n=>(<button key={n} onClick={()=>addToRound(n)} style={{background:C.card2,border:`1px solid ${C.border}`,color:C.text,padding:"6px 12px",borderRadius:8,fontSize:12,cursor:"pointer"}}>{n}</button>))}</div>}
        </div>
        {useHdcp&&roundPlayers.length>0&&<div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}><div style={{fontWeight:600,marginBottom:8,fontSize:13}}>Handicap Course Par</div>{roundPlayers.map(p=>(<div key={p} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:12,fontWeight:600}}>{p}</span><input value={hdcps[p]||""} onChange={e=>setHdcps(h=>({...h,[p]:parseInt(e.target.value)||0}))} placeholder="72" style={{...smallInput,width:50}}/></div>))}</div>}
        {!isLive&&roundPlayers.length>0&&<>
          <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}><div style={{fontWeight:600,marginBottom:8,fontSize:13}}>📡 Live Scoring Mode</div><div style={{display:"flex",gap:8}}><button onClick={()=>setLiveScoreMode("keeper")} style={{flex:1,padding:10,borderRadius:8,border:liveScoreMode==="keeper"?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:liveScoreMode==="keeper"?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:11,textAlign:"center"}}><div style={{fontWeight:700}}>1 Scorekeeper</div><div style={{fontSize:9,color:C.muted,marginTop:2}}>Host keeps all scores</div></button><button onClick={()=>setLiveScoreMode("self")} style={{flex:1,padding:10,borderRadius:8,border:liveScoreMode==="self"?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:liveScoreMode==="self"?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:11,textAlign:"center"}}><div style={{fontWeight:700}}>Self Score</div><div style={{fontSize:9,color:C.muted,marginTop:2}}>Everyone scores themselves</div></button></div></div>
          <button onClick={goLive} style={{...btnS(false),width:"100%",padding:12,fontSize:14,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",color:C.red}}>📡 Go Live — Share with Friends</button>
        </>}
        {isLive&&<div style={{background:C.card,borderRadius:12,padding:14,border:"1px solid rgba(239,68,68,0.3)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:4,background:C.red,animation:"pulse 1.5s infinite"}}/><span style={{fontWeight:700,color:C.red,fontSize:13}}>LIVE ROUND</span></div><button onClick={leaveLive} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:10}}>End Live</button></div><div style={{textAlign:"center",padding:"8px 0"}}><div style={{fontSize:11,color:C.muted}}>Share this code with friends:</div><div style={{fontSize:36,fontWeight:700,letterSpacing:8,color:C.white,marginTop:4}}>{liveData.code}</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>{liveScoreMode==="keeper"?"Mode: 1 Scorekeeper (host keeps all scores)":"Mode: Everyone scores themselves"}</div></div><div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:8}}>{liveData.players.map(p=><span key={p} style={{background:C.accent,padding:"3px 8px",borderRadius:12,fontSize:11,color:p===me?C.greenLt:C.text}}>{p}{p===me?" (you)":""}{p===liveData.host?" 👑":""}</span>)}</div></div>}
        {roundPlayers.length>0&&<div style={{display:"flex",gap:8}}><button onClick={beginPlay} style={{...btnS(true),flex:1,padding:14,fontSize:15}}>⛳ Shot-by-Shot</button><button onClick={()=>setPlayMode("quick")} style={{...btnS(false),padding:14,fontSize:12}}>Quick Score</button></div>}
      </>}

      {/* ═══ SHOT-BY-SHOT ═══ */}
      {selCourse&&playMode==="holes"&&curHD&&<>
        <LiveBadge/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><h2 style={{margin:0,fontSize:16}}>Hole {curHole+1} <span style={{fontWeight:400,color:C.muted}}>of 18</span></h2><div style={{fontSize:11,color:C.muted}}>Par {curHD.par} · Range {fmtR(curHD.range)}</div></div><button onClick={()=>setShowScorecard(s=>!s)} style={{...btnS(false),padding:"4px 10px",fontSize:11}}>📋</button></div>
        {showScorecard&&<ScorecardView/>}
        {roundPlayers.map((p,pIdx)=>{
          const hs=holeState[p];if(!hs)return null;
          const need=calcNeed(hs,curHD);
          const isMyTurn=(!isLive||liveScoreMode==="keeper"||p===me);
          const showPlayer=(!isLive||liveScoreMode==="keeper"||(liveScoreMode==="self"&&p===me));
          if(!showPlayer)return null;
          return<div key={p} style={{background:C.card,borderRadius:12,padding:12,border:`1px solid ${hs.done?C.greenLt:C.border}`,opacity:hs.done?0.7:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontWeight:700,fontSize:14}}>{p}{isLive&&p!==me?<span style={{color:C.blue,fontSize:10}}> 📡</span>:""}</div>
              {hs.done?<div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontWeight:700,fontSize:16}}>{hs.score}</span>{curHD&&<span style={{fontSize:11,color:scoreName(hs.score,curHD.par,hs.holeOut).c}}>{scoreName(hs.score,curHD.par,hs.holeOut).l}</span>}</div>
              :need?<div style={{fontSize:12,color:need.dir==="add"?C.greenLt:C.blue,fontWeight:600}}>Need {need.lo===need.hi?need.lo:`${need.lo}-${need.hi}`} ({need.dir==="add"?"slide to range":"subtract to range"})</div>
              :hs.onGreen?<div style={{fontSize:12,color:C.greenLt,fontWeight:600}}>🏁 On the Green</div>:null}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:6}}>{hs.shots.map((s,i)=>{let c=C.text,bg=C.card2,label="";if(s.type==="slide"){label=s.dir==="sub"?`-${s.val}`:`+${s.val}`;bg=s.dir==="sub"?"rgba(138,180,248,0.15)":"rgba(74,170,74,0.15)";c=s.dir==="sub"?C.blue:C.greenLt;}else if(s.type==="OB"){label="OB";bg="rgba(239,68,68,0.15)";c=C.red;}else if(s.type==="putt"){label=s.val==="Made"?"✓":"Miss";bg=s.val==="Made"?"rgba(74,170,74,0.15)":"rgba(138,180,248,0.15)";c=s.val==="Made"?C.greenLt:C.blue;}else if(s.type==="holeout"){label="🎯 HOLE OUT";bg="rgba(255,107,0,0.15)";c="#ff6b00";}return<span key={i} style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:600,background:bg,color:c}}>{label}</span>;})}</div>
            {!hs.done&&isMyTurn&&<>
              {!hs.onGreen&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(n=>(<button key={n} onClick={()=>recordShot(p,n)} style={{width:36,height:30,borderRadius:6,border:`1px solid ${C.border}`,background:C.card2,color:C.text,cursor:"pointer",fontSize:12,fontWeight:700}}>{hs.total>curHD.range[1]?`-${n}`:`+${n}`}</button>))}
                <button onClick={()=>recordShot(p,"OB")} style={{padding:"4px 8px",borderRadius:6,border:"1px solid rgba(239,68,68,0.4)",background:"rgba(239,68,68,0.1)",color:C.red,cursor:"pointer",fontSize:11,fontWeight:700}}>OB</button>
                <button onClick={()=>recordShot(p,"HOLEOUT")} style={{padding:"4px 8px",borderRadius:6,border:"1px solid rgba(255,107,0,0.4)",background:"rgba(255,107,0,0.1)",color:"#ff6b00",cursor:"pointer",fontSize:11,fontWeight:700}}>🎯 Hole Out</button>
              </div>}
              {hs.onGreen&&<div style={{display:"flex",gap:4,marginBottom:4}}><button onClick={()=>recordShot(p,"MISS")} style={{flex:1,padding:10,borderRadius:8,border:"1px solid rgba(239,68,68,0.4)",background:"rgba(239,68,68,0.1)",color:C.red,cursor:"pointer",fontWeight:700}}>Putt: Miss</button><button onClick={()=>recordShot(p,"MADE")} style={{flex:1,padding:10,borderRadius:8,border:`1px solid ${C.greenLt}`,background:"rgba(74,170,74,0.1)",color:C.greenLt,cursor:"pointer",fontWeight:700}}>Putt: Made ✓</button></div>}
              {hs.shots.length>0&&<button onClick={()=>undoShot(p)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,padding:"4px 8px",borderRadius:4,cursor:"pointer",fontSize:10}}>↩ Undo</button>}
            </>}
          </div>;
        })}
        <div style={{display:"flex",gap:8}}>
          {curHole>0&&<button onClick={goToPrevHole} style={{...btnS(false),padding:"10px 16px",fontSize:12}}>← Hole {curHole}</button>}
          <button onClick={finishHole} style={{...btnS(true),flex:1,padding:14,fontSize:15}}>{curHole<17?`Hole ${curHole+1} Done →`:"Finish Round"}</button>
        </div>
      </>}

      {/* ═══ QUICK SCORE ═══ */}
      {selCourse&&playMode==="quick"&&<>
        <LiveBadge/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{margin:0,fontSize:16}}>Quick Score — {selCourse.name}</h2><button onClick={()=>setPlayMode("setup")} style={{...btnS(false),padding:"4px 10px",fontSize:11}}>← Back</button></div>
        <div style={{display:"flex",gap:4,marginBottom:4}}><button onClick={()=>setNine(0)} style={{flex:1,padding:8,borderRadius:8,border:nine===0?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:nine===0?C.accent:C.card,color:nine===0?C.white:C.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>Front 9</button><button onClick={()=>setNine(1)} style={{flex:1,padding:8,borderRadius:8,border:nine===1?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:nine===1?C.accent:C.card,color:nine===1?C.white:C.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>Back 9</button></div>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:10,minWidth:420}}><thead><tr style={{background:C.accent}}><th style={{padding:"4px 6px",textAlign:"left",minWidth:50}}>HOLE</th>{selCourse.holes.slice(nine*9,nine*9+9).map(h=><th key={h.num} style={{padding:"4px 2px",textAlign:"center",minWidth:30}}>{h.num}</th>)}<th style={{padding:"4px 4px",textAlign:"center",minWidth:35}}>{nine===0?"OUT":"IN"}</th></tr></thead><tbody>
          <tr style={{background:C.card2}}><td style={{padding:"3px 6px",fontWeight:600,color:C.greenLt,fontSize:9}}>RANGE</td>{selCourse.holes.slice(nine*9,nine*9+9).map(h=><td key={h.num} style={{textAlign:"center",fontSize:8,color:C.muted}}>{fmtR(h.range)}</td>)}<td/></tr>
          <tr><td style={{padding:"3px 6px",fontWeight:600}}>PAR</td>{selCourse.holes.slice(nine*9,nine*9+9).map(h=><td key={h.num} style={{textAlign:"center"}}>{h.par}</td>)}<td style={{textAlign:"center",fontWeight:700}}>{calcPar(selCourse.holes,nine*9,nine*9+9)}</td></tr>
          {roundPlayers.map(p=>{const sc=allScores[p]||Array(18).fill(null);return<tr key={p} style={{borderTop:`1px solid ${C.border}`}}><td style={{padding:"3px 6px",fontWeight:600,fontSize:9}}>{p}</td>{selCourse.holes.slice(nine*9,nine*9+9).map((h,i)=>{const idx=nine*9+i;return<td key={h.num} style={{padding:"2px"}}><input value={sc[idx]??""} onChange={e=>setQuickScore(p,idx,e.target.value)} style={{...smallInput,width:"100%",fontSize:11,color:sc[idx]!=null&&sc[idx]<h.par?C.greenLt:sc[idx]!=null&&sc[idx]>h.par?C.red:C.text}}/></td>;})} <td style={{textAlign:"center",fontWeight:700,fontSize:10}}>{sc.slice(nine*9,nine*9+9).reduce((s,v)=>s+(v||0),0)||"-"}</td></tr>;})}
        </tbody></table></div>
        {roundPlayers.map(p=>{const sc=allScores[p]||Array(18).fill(null);const tot=sc.reduce((s,v)=>s+(v||0),0);const par=selCourse.holes.reduce((s,h)=>s+h.par,0);return tot>0&&<div key={p} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span style={{fontWeight:600}}>{p}</span><span><strong>{tot}</strong> <RelPar s={tot} p={par}/></span></div>;})}
        <button onClick={()=>setPlayMode("review")} style={{...btnS(true),width:"100%",padding:14,fontSize:15,marginTop:8}}>Review & Save</button>
      </>}

      {/* ═══ REVIEW ═══ */}
      {selCourse&&playMode==="review"&&<>
        <h2 style={{margin:0,fontSize:18}}>📋 Round Review</h2>
        <div style={{background:C.card,borderRadius:12,padding:12,border:`1px solid ${C.border}`,overflowX:"auto"}}>{[0,9].map(start=>(<table key={start} style={{width:"100%",borderCollapse:"collapse",fontSize:9,marginBottom:start===0?6:0,minWidth:420}}><thead><tr style={{background:C.accent}}><th style={{padding:"4px 6px",textAlign:"left",minWidth:50}}>HOLE</th>{selCourse.holes.slice(start,start+9).map(h=><th key={h.num} style={{padding:"3px 2px",textAlign:"center",minWidth:24}}>{h.num}</th>)}<th style={{padding:"3px 4px",textAlign:"center",minWidth:30}}>{start===0?"OUT":"IN"}</th>{start===9&&<th style={{padding:"3px 4px",textAlign:"center",minWidth:30}}>TOT</th>}</tr></thead><tbody><tr><td style={{padding:"2px 6px",fontWeight:600}}>PAR</td>{selCourse.holes.slice(start,start+9).map(h=><td key={h.num} style={{textAlign:"center"}}>{h.par}</td>)}<td style={{textAlign:"center",fontWeight:700}}>{calcPar(selCourse.holes,start,start+9)}</td>{start===9&&<td style={{textAlign:"center",fontWeight:700,color:C.greenLt}}>{selCourse.holes.reduce((s,h)=>s+h.par,0)}</td>}</tr>{roundPlayers.map(p=>{const sc=allScores[p]||Array(18).fill(null);return<tr key={p} style={{borderTop:`1px solid ${C.border}`}}><td style={{padding:"2px 6px",fontWeight:600,fontSize:8}}>{p}</td>{selCourse.holes.slice(start,start+9).map((h,i)=>{const idx=start+i;const v=sc[idx];return<td key={h.num} style={{textAlign:"center",fontWeight:700,color:v===1?"#ff6b00":v!=null&&v<h.par?C.greenLt:v!=null&&v>h.par?"#ff6b6b":v!=null?C.text:C.muted}}>{v??"-"}</td>;})}<td style={{textAlign:"center",fontWeight:700}}>{sc.slice(start,start+9).reduce((s,v)=>s+(v||0),0)||"-"}</td>{start===9&&<td style={{textAlign:"center",fontWeight:700,color:C.greenLt}}>{sc.reduce((s,v)=>s+(v||0),0)||"-"}</td>}</tr>;})}</tbody></table>))}</div>
        {roundPlayers.map(p=>{const sc=allScores[p]||Array(18).fill(null);const tot=sc.reduce((s,v)=>s+(v||0),0);const par=selCourse.holes.reduce((s,h)=>s+h.par,0);const hio=countHIO(sc);return<div key={p} style={{background:C.card,borderRadius:8,padding:10,border:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700}}>{p}</div>{useHdcp&&hdcps[p]&&<div style={{fontSize:10,color:C.blue}}>HDCP: {hdcps[p]} · Adj: {tot-hdcps[p]}</div>}</div><div style={{textAlign:"right"}}><div style={{fontSize:20,fontWeight:700}}>{tot} <RelPar s={tot} p={par}/></div>{hio>0&&<div style={{fontSize:10,color:"#ff6b00"}}>🎯 {hio} hole-in-one{hio>1?"s":""}</div>}</div></div>;})}
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setPlayMode("setup")} style={{...btnS(false),padding:12}}>← Edit</button>
          <button onClick={saveRound} style={{...btnS(true),flex:1,padding:14,fontSize:15}}>💾 Save Round</button>
          <button onClick={()=>{renderReviewShareCard(me);setTimeout(generateShareCard,100);}} style={{...btnS(false),padding:"12px 16px",fontSize:12}}>📤</button>
        </div>
        {/* Hidden share render for review screen */}
        {renderReviewShareCard(me)}
      </>}
    </div>
  );
}
