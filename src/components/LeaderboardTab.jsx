import { C } from "../utils/theme.js";
import { RelPar, countHIO, isRoundSealed, computeAchievements } from "../utils/helpers.jsx";

export default function LeaderboardTab({ me, playerStats, rounds, deleteRoundFromDB, leagueMatches, openRoundDetail, openPlayerProfile, allCourses }) {
  // Avg putts per player
  const getAvgPutts = (name) => {
    const pr = rounds.filter(r => r.player === name && r.totalPutts != null && !isRoundSealed(r, leagueMatches, me));
    return pr.length ? Math.round(pr.reduce((s, r) => s + r.totalPutts, 0) / pr.length * 10) / 10 : null;
  };

  // Achievement leaders
  const achievementLeaders = (() => {
    const names = playerStats.map(p => p.name);
    const allAch = {};
    names.forEach(n => { allAch[n] = computeAchievements(n, rounds, leagueMatches, allCourses, me); });

    const categories = [
      { emoji: "🔥", label: "League Win Streak", key: "leagueWinStreak", extract: a => a.leagueWinStreak.best },
      { emoji: "📉", label: "Under Par Streak", key: "underParStreak", extract: a => a.underParStreak.best },
      { emoji: "🎯", label: "Most Hole-in-Ones", key: "totalHIO", extract: a => a.totalHIO },
      { emoji: "🦅", label: "Most Birdies (round)", key: "mostBirdies", extract: a => a.mostBirdies },
      { emoji: "💀", label: "Biggest Match Win", key: "biggestWin", extract: a => a.biggestWin },
      { emoji: "⛳", label: "Best Score to Par", key: "bestToPar", extract: a => a.bestToPar, lower: true },
    ];

    return categories.map(cat => {
      let bestPlayer = null, bestVal = cat.lower ? Infinity : -Infinity;
      names.forEach(n => {
        const val = cat.extract(allAch[n]);
        if (val == null) return;
        if (cat.lower ? val < bestVal : val > bestVal) { bestVal = val; bestPlayer = n; }
      });
      const display = cat.lower ? (bestVal === Infinity ? "-" : bestVal > 0 ? `+${bestVal}` : bestVal === 0 ? "E" : bestVal) : (bestVal === -Infinity ? "-" : bestVal);
      return { ...cat, leader: bestPlayer || "-", record: display };
    });
  })();

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <h2 style={{margin:0,fontSize:18}}>📊 Leaderboard</h2>

      {/* Player Rankings */}
      <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:440}}><thead><tr style={{background:C.accent}}><th style={{padding:"8px 6px",textAlign:"left"}}>#</th><th style={{padding:"8px 4px",textAlign:"left"}}>Player</th><th style={{padding:"8px 4px",textAlign:"center"}}>HDCP</th><th style={{padding:"8px 4px",textAlign:"center"}}>Rnds</th><th style={{padding:"8px 4px",textAlign:"center"}}>Best</th><th style={{padding:"8px 4px",textAlign:"center"}}>Avg</th><th style={{padding:"8px 4px",textAlign:"center"}}>🎯</th><th style={{padding:"8px 4px",textAlign:"center",color:C.blue}}>Putts</th></tr></thead><tbody>{playerStats.map((p,i)=>{
        const avgPutts = getAvgPutts(p.name);
        return (<tr key={p.name} style={{borderTop:`1px solid ${C.border}`,background:p.name===me?"rgba(74,170,74,0.06)":"transparent"}}><td style={{padding:"8px 6px",fontWeight:700,color:i===0?C.gold:i<3?C.greenLt:C.muted}}>{i+1}</td><td style={{padding:"8px 4px",fontWeight:600,cursor:"pointer",color:p.name===me?C.greenLt:C.text}} onClick={()=>openPlayerProfile(p.name)}>{p.name}</td><td style={{padding:"8px 4px",textAlign:"center",fontWeight:700,color:p.handicap!=null&&p.handicap<0?C.greenLt:p.handicap!=null&&p.handicap>0?C.red:C.text}}>{p.handicap!=null?p.handicap:"-"}</td><td style={{padding:"8px 4px",textAlign:"center",color:C.muted}}>{p.rounds}</td><td style={{padding:"8px 4px",textAlign:"center"}}>{p.best??"-"}</td><td style={{padding:"8px 4px",textAlign:"center"}}>{p.avg??"-"}</td><td style={{padding:"8px 4px",textAlign:"center",color:"#ff6b00"}}>{p.holeInOnes||0}</td><td style={{padding:"8px 4px",textAlign:"center",color:C.blue}}>{avgPutts??"-"}</td></tr>);
      })}</tbody></table></div></div>

      {/* All Rounds */}
      <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}><div style={{fontWeight:600,marginBottom:8}}>All Rounds</div>{rounds.map(r=>{const hio=r.holeInOnes||countHIO(r.scores)||0;const sealed=isRoundSealed(r,leagueMatches,me);return<div key={r.id} onClick={()=>openRoundDetail(r)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.border}`,fontSize:12,cursor:"pointer"}}><div><span style={{fontWeight:600}}>{r.player}</span><span style={{color:C.muted,fontSize:10,marginLeft:6}}>{r.course}</span><span style={{color:C.muted,fontSize:10,marginLeft:6}}>{r.date}</span></div><div style={{display:"flex",gap:6,alignItems:"center"}}>{sealed?<span style={{color:C.muted,fontSize:11}}>🔒 Sealed</span>:r.hidden?<span style={{color:C.muted,fontSize:11}}>🙈</span>:<><span style={{fontWeight:700}}>{r.total}</span><RelPar s={r.total} p={r.par}/></>}{!sealed&&hio>0&&<span style={{fontSize:10,color:"#ff6b00"}}>🎯{hio}</span>}<button onClick={e=>{e.stopPropagation();if(confirm(`Delete ${r.player}'s round?`))deleteRoundFromDB(r.id);}} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:10,opacity:0.5}}>🗑</button></div></div>;})}</div>

      {/* Achievement Leaderboard (Feature 7) */}
      <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}>
        <div style={{padding:"10px 14px",background:C.accent,fontWeight:700,fontSize:13}}>🏆 Achievement Leaders</div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{background:C.card2}}>
            <th style={{padding:"6px 10px",textAlign:"left"}}>Achievement</th>
            <th style={{padding:"6px 8px",textAlign:"left"}}>Leader</th>
            <th style={{padding:"6px 8px",textAlign:"center"}}>Record</th>
          </tr></thead>
          <tbody>
            {achievementLeaders.map((cat,i) => (
              <tr key={i} style={{borderTop:`1px solid ${C.border}`}}>
                <td style={{padding:"6px 10px"}}><span>{cat.emoji} {cat.label}</span></td>
                <td style={{padding:"6px 8px",fontWeight:600,color:C.greenLt,cursor:cat.leader!=="-"?"pointer":"default"}} onClick={()=>{if(cat.leader!=="-")openPlayerProfile(cat.leader);}}>{cat.leader}</td>
                <td style={{padding:"6px 8px",textAlign:"center",fontWeight:700,color:C.gold}}>{cat.record}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
