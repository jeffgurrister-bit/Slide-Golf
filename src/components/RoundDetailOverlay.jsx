import { C, btnS, smallInput } from "../utils/theme.js";
import { RelPar, fmtR, fmtRange, calcPar, isRoundSealed, isRoundHiddenForDisplay, roundHoleCount } from "../utils/helpers.jsx";

export default function RoundDetailOverlay({
  detailRound, editingRound, editScores,
  setEditingRound, setEditScores,
  me, rounds, leagueMatches, allCourses, champFps,
  closeRoundDetail, saveEditedRound,
  setShareOverlay, deleteRoundFromDB, parseScoreInput, ScoreCell
}) {
  if (!detailRound) return null;

  const isMyRound = detailRound.player === me;
  const sealed = isRoundSealed(detailRound, leagueMatches, me);
  const hidden = isRoundHiddenForDisplay(detailRound, leagueMatches, rounds, me, champFps);
  const hiddenFromMe = !isMyRound && (sealed || hidden);
  const canSeeScores = isMyRound || (!sealed && !hidden);

  const hc = roundHoleCount(detailRound);
  const nt = detailRound.nineType || "front";
  const holes = detailRound.courseHoles || allCourses.find(c => c.name === detailRound.course)?.holes;
  // For 9-hole rounds, scores/courseHoles are 9 elements indexed 0-8.
  // holeNumOffset adjusts display numbers for back 9.
  const nines = hc === 9 ? [0] : [0, 9];
  const holeNumOffset = (hc === 9 && nt === "back") ? 9 : 0;
  const dOffset = holeNumOffset; // shot timeline reuses the same offset

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:9998,overflowY:"auto",padding:"40px 16px"}} onClick={e=>{if(e.target===e.currentTarget)closeRoundDetail();}}>
      <div style={{background:C.bg,borderRadius:16,border:`1px solid ${C.border}`,maxWidth:560,width:"100%",animation:"fadeIn 0.3s ease"}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:700,fontSize:18}}>{detailRound.player}</div>
            <div style={{fontSize:12,color:C.muted}}>{detailRound.course} · {detailRound.date}{detailRound.courseLevel&&<span style={{fontSize:9,fontWeight:700,marginLeft:6,color:detailRound.courseLevel==="Easy"?"#22c55e":detailRound.courseLevel==="Medium"?"#3b82f6":detailRound.courseLevel==="Hard"?"#f59e0b":"#ef4444"}}>{detailRound.courseLevel}</span>}{hc===9&&<span style={{color:C.blue,marginLeft:6}}>9H {nt==="back"?"Back":"Front"}</span>}</div>
            {(detailRound.matchType||detailRound.sealedMatchId) && <div style={{fontSize:10,color:detailRound.matchType==="championship"?C.gold:detailRound.matchType==="pga"?C.blue:C.greenLt,marginTop:2}}>{detailRound.matchType==="championship"?"🏆 Championship Round":detailRound.matchType==="playoff"?"⚡ Playoff Match":detailRound.matchType==="pga"?"📺 PGA Tournament":"⚡ League Match"}</div>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {!editingRound && isMyRound && <button onClick={()=>{setEditingRound(true);setEditScores([...(detailRound.scores||Array(18).fill(null))]);}} style={{...btnS(false),padding:"6px 12px",fontSize:11}}>✏️ Edit</button>}
            {!editingRound && canSeeScores && <button onClick={()=>setShareOverlay(true)} style={{...btnS(false),padding:"6px 12px",fontSize:11}}>📤 Share</button>}
            <button onClick={closeRoundDetail} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:20,lineHeight:1}}>✕</button>
          </div>
        </div>

        {hiddenFromMe && (
          <div style={{padding:"40px 20px",textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:12}}>{sealed?"🔒":"🙈"}</div>
            <div style={{fontWeight:700,fontSize:16,marginBottom:6}}>{sealed?"Scores Sealed":"Scores Hidden"}</div>
            <div style={{color:C.muted,fontSize:13}}>{sealed?"Both players must finish before scores are revealed":"This round was played with hidden scores"}</div>
          </div>
        )}

        {canSeeScores && <>
          {/* Scorecard */}
          <div style={{padding:"12px 10px",overflowX:"auto"}}>
            {nines.map(start => {
              const displayStart = start + holeNumOffset;
              return <table key={start} style={{width:"100%",borderCollapse:"collapse",fontSize:10,marginBottom:nines.length>1&&start===0?6:0,minWidth:420}}>
                <thead><tr style={{background:C.accent}}>
                  <th style={{padding:"4px 6px",textAlign:"left",minWidth:44}}>HOLE</th>
                  {(holes||[]).slice(start,start+9).map((h,i)=><th key={i} style={{padding:"4px 2px",textAlign:"center",minWidth:28}}>{displayStart+i+1}</th>)}
                  <th style={{padding:"4px 4px",textAlign:"center",fontWeight:700,minWidth:36}}>{displayStart===0?"OUT":"IN"}</th>
                  {start===9&&hc===18&&<th style={{padding:"4px 4px",textAlign:"center",fontWeight:700,minWidth:36}}>TOT</th>}
                </tr></thead>
                <tbody>
                  {holes && <tr style={{background:C.card2}}>
                    <td style={{padding:"3px 6px",fontWeight:600,color:C.greenLt,fontSize:9}}>RANGE</td>
                    {holes.slice(start,start+9).map((h,i)=><td key={i} style={{textAlign:"center",fontSize:8,color:C.muted}}>{fmtR(h.range)}</td>)}
                    <td style={{textAlign:"center",fontSize:8,color:C.muted}}>{fmtRange(holes,start,start+9)}</td>
                    {start===9&&hc===18&&<td style={{textAlign:"center",fontSize:8,color:C.muted}}>{fmtRange(holes,0,18)}</td>}
                  </tr>}
                  {holes && <tr>
                    <td style={{padding:"3px 6px",fontWeight:600}}>PAR</td>
                    {holes.slice(start,start+9).map((h,i)=><td key={i} style={{textAlign:"center"}}>{h.par}</td>)}
                    <td style={{textAlign:"center",fontWeight:700}}>{calcPar(holes,start,start+9)}</td>
                    {start===9&&hc===18&&<td style={{textAlign:"center",fontWeight:700,color:C.greenLt}}>{holes.reduce((s,h)=>s+h.par,0)}</td>}
                  </tr>}
                  <tr style={{borderTop:`1px solid ${C.border}`}}>
                    <td style={{padding:"3px 6px",fontWeight:600,fontSize:9}}>SCORE</td>
                    {(editingRound ? editScores : detailRound.scores || []).slice(start,start+9).map((v,i)=>{
                      const idx = start+i;
                      if (editingRound) {
                        return <td key={i} style={{padding:2}}><input value={editScores[idx]??""} onChange={e=>{const ns=[...editScores];ns[idx]=parseScoreInput(e.target.value);setEditScores(ns);}} style={{...smallInput,width:28,fontSize:11}}/></td>;
                      }
                      const par = holes?.[idx]?.par;
                      return par != null ? <ScoreCell key={i} score={v} par={par} size={22} fontSize={11}/> :
                        <td key={i} style={{textAlign:"center",fontWeight:700,fontSize:11}}>{v??"-"}</td>;
                    })}
                    <td style={{textAlign:"center",fontWeight:700,fontSize:10}}>{(editingRound?editScores:detailRound.scores||[]).slice(start,start+9).reduce((s,v)=>s+(v||0),0)||"-"}</td>
                    {start===9&&hc===18&&<td style={{textAlign:"center",fontWeight:700,fontSize:10,color:C.greenLt}}>{(editingRound?editScores:detailRound.scores||[]).reduce((s,v)=>s+(v||0),0)||"-"}</td>}
                  </tr>
                </tbody>
              </table>;
            })}
          </div>

          {editingRound && <div style={{padding:"8px 16px",display:"flex",gap:8}}>
            <button onClick={()=>{setEditingRound(false);setEditScores(null);}} style={{...btnS(false),flex:1,padding:10,fontSize:12}}>Cancel</button>
            <button onClick={saveEditedRound} style={{...btnS(true),flex:1,padding:10,fontSize:12}}>💾 Save Changes</button>
          </div>}

          {!editingRound && <div style={{display:"flex",justifyContent:"space-around",padding:"12px 16px",borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700}}>{detailRound.total}</div><div style={{fontSize:9,color:C.muted}}>Total</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700}}><RelPar s={detailRound.total} p={detailRound.par}/></div><div style={{fontSize:9,color:C.muted}}>To Par</div></div>
            {detailRound.totalPutts != null && <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:C.blue}}>{detailRound.totalPutts}</div><div style={{fontSize:9,color:C.muted}}>Putts</div></div>}
            {detailRound.shotLogs && <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:C.red}}>{detailRound.shotLogs.reduce((s,h)=>s+(h||[]).filter(sh=>sh.type==="OB").length,0)}</div><div style={{fontSize:9,color:C.muted}}>OB</div></div>}
            <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:"#ff6b00"}}>{detailRound.holeInOnes||0}</div><div style={{fontSize:9,color:C.muted}}>HIO</div></div>
          </div>}

          {!editingRound && detailRound.shotLogs && <div style={{padding:"12px 16px",maxHeight:400,overflowY:"auto"}}>
            <div style={{fontWeight:600,fontSize:12,marginBottom:8}}>Shot Timeline</div>
            {detailRound.shotLogs.map((holeLogs,hIdx)=>{
              const par = holes?.[hIdx]?.par;
              const range = holes?.[hIdx]?.range;
              const score = detailRound.scores?.[hIdx];
              if (!holeLogs || !holeLogs.length) return null;
              return <div key={hIdx} style={{marginBottom:8,padding:8,background:C.card,borderRadius:8,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontWeight:700,fontSize:11}}>Hole {hIdx+1+dOffset} {par!=null&&<span style={{color:C.muted,fontWeight:400}}>· Par {par}{range?` · ${fmtR(range)}`:""}</span>}</span>
                  {score!=null && <span style={{fontWeight:700,fontSize:12,color:par!=null&&score<par?C.red:par!=null&&score>par?C.greenLt:C.text}}>{score}</span>}
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
        </>}

        {!editingRound && isMyRound && <div style={{padding:"8px 16px 16px",borderTop:`1px solid ${C.border}`}}>
          <button onClick={()=>{if(confirm(`Delete this round?`)){deleteRoundFromDB(detailRound.id);closeRoundDetail();}}} style={{background:"transparent",border:`1px solid rgba(239,68,68,0.3)`,color:C.red,borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:11,width:"100%"}}>🗑 Delete Round</button>
        </div>}
      </div>
    </div>
  );
}
