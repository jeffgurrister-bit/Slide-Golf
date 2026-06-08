import { C } from "../utils/theme.js";
import { isRoundSealed, isLeagueRound, championshipFingerprints, roundHoleCount } from "../utils/helpers.jsx";

export default function StatsTab({ playerStats, rounds, leagueMatches, me, openPlayerProfile, allCourses, lbHoleFilter, setLbHoleFilter, statsMode, setStatsMode, lvlFilter, setLvlFilter }) {
  const champFps = championshipFingerprints(leagueMatches);
  const modeMatch = r => statsMode==="league" ? isLeagueRound(r, champFps) : statsMode==="regular" ? !isLeagueRound(r, champFps) : true;
  const lvlMatch = r => lvlFilter==="all" || r.courseLevel===lvlFilter;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
        <h2 style={{margin:0,fontSize:18}}>📈 Stats</h2>
        <div style={{display:"flex",gap:4}}>
          <button onClick={()=>setLbHoleFilter(18)} style={{padding:"4px 12px",borderRadius:6,border:lbHoleFilter===18?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:lbHoleFilter===18?C.accent:"transparent",color:lbHoleFilter===18?C.white:C.muted,cursor:"pointer",fontSize:11,fontWeight:600}}>18H</button>
          <button onClick={()=>setLbHoleFilter(9)} style={{padding:"4px 12px",borderRadius:6,border:lbHoleFilter===9?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:lbHoleFilter===9?C.accent:"transparent",color:lbHoleFilter===9?C.white:C.muted,cursor:"pointer",fontSize:11,fontWeight:600}}>9H</button>
        </div>
      </div>
      <div style={{display:"flex",gap:4,justifyContent:"flex-end",flexWrap:"wrap"}}>
        {[["all","All"],["regular","Regular"],["league","League"]].map(([v,l])=>(
          <button key={v} onClick={()=>setStatsMode(v)} style={{padding:"3px 10px",borderRadius:6,border:statsMode===v?`2px solid ${C.gold}`:`1px solid ${C.border}`,background:statsMode===v?"rgba(212,184,74,0.15)":"transparent",color:statsMode===v?C.gold:C.muted,cursor:"pointer",fontSize:10,fontWeight:600}}>{l}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:4,justifyContent:"flex-end",flexWrap:"wrap"}}>
        {[["all","All"],["Easy","Easy"],["Medium","Medium"],["Hard","Hard"],["Expert","Expert"]].map(([v,l])=>{const col=v==="Easy"?"#22c55e":v==="Medium"?"#3b82f6":v==="Hard"?"#f59e0b":v==="Expert"?"#ef4444":C.greenLt;return (
          <button key={v} onClick={()=>setLvlFilter(v)} style={{padding:"3px 10px",borderRadius:6,border:lvlFilter===v?`2px solid ${col}`:`1px solid ${C.border}`,background:lvlFilter===v?"rgba(74,170,74,0.08)":"transparent",color:lvlFilter===v?col:C.muted,cursor:"pointer",fontSize:10,fontWeight:600}}>{l}</button>
        );})}
      </div>
      {playerStats.map(p=>{const pr=rounds.filter(r=>r.player===p.name&&roundHoleCount(r)===lbHoleFilter&&!isRoundSealed(r,leagueMatches,me)&&modeMatch(r)&&lvlMatch(r));if(!pr.length)return null;const courseCounts={};pr.forEach(r=>{courseCounts[r.course]=(courseCounts[r.course]||0)+1;});
        const puttsRounds = rounds.filter(r => r.player === p.name && r.totalPutts != null && roundHoleCount(r)===lbHoleFilter && !isRoundSealed(r, leagueMatches, me) && modeMatch(r) && lvlMatch(r));
        const avgPutts = puttsRounds.length ? Math.round(puttsRounds.reduce((s, r) => s + r.totalPutts, 0) / puttsRounds.length * 10) / 10 : null;

        return <div key={p.name} style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:8,cursor:"pointer"}} onClick={()=>openPlayerProfile(p.name)}>{p.name}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:8,marginBottom:8}}>
          <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:C.greenLt}}>{p.handicap!=null?p.handicap:"-"}</div><div style={{fontSize:9,color:C.muted}}>HDCP</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:700}}>{p.best??"-"}</div><div style={{fontSize:9,color:C.muted}}>Best</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:700}}>{p.avg??"-"}</div><div style={{fontSize:9,color:C.muted}}>Avg</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:"#ff6b00"}}>{p.holeInOnes}</div><div style={{fontSize:9,color:C.muted}}>Hole-in-1s</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:C.blue}}>{avgPutts??"-"}</div><div style={{fontSize:9,color:C.muted}}>Avg Putts</div></div>
        </div>
        <div style={{fontSize:11,color:C.muted}}>{p.rounds} round{p.rounds!==1?"s":""}</div>
        <div style={{marginTop:6,display:"flex",flexWrap:"wrap",gap:4}}>{Object.entries(courseCounts).map(([c,n])=>(<span key={c} style={{background:C.card2,padding:"2px 6px",borderRadius:4,fontSize:10}}>{c}: {n}</span>))}</div>
        {pr.length>1&&<div style={{marginTop:8}}><div style={{fontSize:10,color:C.muted,marginBottom:4}}>Recent Scores</div><div style={{display:"flex",gap:2,alignItems:"end",height:40}}>{pr.slice(0,20).reverse().map((r,i)=>{const mx=Math.max(...pr.map(x=>x.total));const mn=Math.min(...pr.map(x=>x.total));const range=mx-mn||1;const h=8+((r.total-mn)/range)*30;return<div key={i} style={{width:8,height:h,background:r.total-r.par<0?C.greenLt:r.total-r.par>0?"rgba(239,68,68,0.6)":C.muted,borderRadius:2}} title={`${r.total} (${r.course})`}/>;})}</div></div>}
      </div>;})}
    </div>
  );
}
