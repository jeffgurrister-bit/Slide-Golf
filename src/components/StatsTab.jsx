import { C } from "../utils/theme.js";
import { isRoundSealed } from "../utils/helpers.jsx";

export default function StatsTab({ playerStats, rounds, leagueMatches, me, openPlayerProfile, allCourses, lbHoleFilter, setLbHoleFilter }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h2 style={{margin:0,fontSize:18}}>📈 Stats</h2>
        <div style={{display:"flex",gap:4}}>
          <button onClick={()=>setLbHoleFilter(18)} style={{padding:"4px 12px",borderRadius:6,border:lbHoleFilter===18?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:lbHoleFilter===18?C.accent:"transparent",color:lbHoleFilter===18?C.white:C.muted,cursor:"pointer",fontSize:11,fontWeight:600}}>18H</button>
          <button onClick={()=>setLbHoleFilter(9)} style={{padding:"4px 12px",borderRadius:6,border:lbHoleFilter===9?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:lbHoleFilter===9?C.accent:"transparent",color:lbHoleFilter===9?C.white:C.muted,cursor:"pointer",fontSize:11,fontWeight:600}}>9H</button>
        </div>
      </div>
      {playerStats.map(p=>{const pr=rounds.filter(r=>r.player===p.name&&(r.holeCount||r.holesPlayed||18)===lbHoleFilter&&!isRoundSealed(r,leagueMatches,me));if(!pr.length)return null;const courseCounts={};pr.forEach(r=>{courseCounts[r.course]=(courseCounts[r.course]||0)+1;});
        // Avg putts
        const puttsRounds = rounds.filter(r => r.player === p.name && r.totalPutts != null && (r.holeCount||r.holesPlayed||18)===lbHoleFilter && !isRoundSealed(r, leagueMatches, me));
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
