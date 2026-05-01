import { useState, useEffect } from "react";
import { C, btnS, inputS, smallInput } from "../utils/theme.js";
import { calcPar, fmtRange, fmtR, computeCourseStats } from "../utils/helpers.jsx";

// Favorites are stored per-player in localStorage. Cheap and private — no
// schema change. Keyed by player name.
const favKey = (me) => `sg-fav-courses-${me || "_anon"}`;

export default function CoursesTab({
  allCourses, creating, setCreating, startRound, deleteCourseFromDB, handleGenerate,
  // Creator state
  ccName, setCcName, ccLevel, setCcLevel, ccTournament, setCcTournament,
  ccHoles, setCcHolePar, setCcHoleRange, ccNine, setCcNine, saveCreatedCourse, resetCreator,
  courseRecords, rounds, leagueMatches, me
}) {
  const [statsOpen, setStatsOpen] = useState({});
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(favKey(me)) || "[]"); } catch { return []; }
  });
  const [filter, setFilter] = useState("all"); // "all" | "favorites" | level
  // useState initializer only runs on first mount; if `me` changes (player
  // switch via the Switch button), we'd otherwise show User A's stars to
  // User B. Reload from localStorage whenever me changes.
  useEffect(() => {
    try { setFavorites(JSON.parse(localStorage.getItem(favKey(me)) || "[]")); } catch { setFavorites([]); }
  }, [me]);
  useEffect(() => {
    try { localStorage.setItem(favKey(me), JSON.stringify(favorites)); } catch {}
  }, [favorites, me]);
  const toggleFav = (name) => setFavorites(f => f.includes(name) ? f.filter(x => x !== name) : [...f, name]);
  const isFav = (name) => favorites.includes(name);
  const filtered = (allCourses || []).filter(c => {
    if (filter === "all") return true;
    if (filter === "favorites") return isFav(c.name);
    return c.level === filter;
  }).sort((a, b) => {
    // Favorites first within whatever filter is active.
    const af = isFav(a.name) ? 0 : 1;
    const bf = isFav(b.name) ? 0 : 1;
    return af - bf;
  });
  if (creating) return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{margin:0,fontSize:18}}>✏️ Create Course</h2><button onClick={()=>setCreating(false)} style={{...btnS(false),padding:"4px 10px",fontSize:11}}>Cancel</button></div>
      <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:10}}><div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Course Name</div><input value={ccName} onChange={e=>setCcName(e.target.value)} placeholder="e.g. Pebble Beach" style={inputS}/></div><div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Tournament (optional)</div><input value={ccTournament} onChange={e=>setCcTournament(e.target.value)} placeholder="e.g. AT&T Pro-Am" style={inputS}/></div><div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Difficulty</div><div style={{display:"flex",gap:6}}>{["Easy","Medium","Hard","Expert"].map(d=>(<button key={d} onClick={()=>setCcLevel(d)} style={{flex:1,padding:"8px 4px",borderRadius:6,border:ccLevel===d?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:ccLevel===d?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:11,fontWeight:ccLevel===d?700:400}}>{d}</button>))}</div></div></div>
      <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{display:"flex"}}><button onClick={()=>setCcNine(0)} style={{flex:1,padding:10,background:ccNine===0?C.accent:"transparent",color:ccNine===0?C.white:C.muted,border:"none",cursor:"pointer",fontWeight:600,fontSize:12}}>Front 9</button><button onClick={()=>setCcNine(1)} style={{flex:1,padding:10,background:ccNine===1?C.accent:"transparent",color:ccNine===1?C.white:C.muted,border:"none",cursor:"pointer",fontWeight:600,fontSize:12}}>Back 9</button></div>
        <div style={{padding:10}}>{ccHoles.slice(ccNine*9,ccNine*9+9).map((h,i)=>{const idx=ccNine*9+i;return<div key={h.num} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}><div style={{width:36,fontWeight:700,fontSize:13,color:C.greenLt}}>#{h.num}</div><div style={{flex:1}}><div style={{fontSize:9,color:C.muted,marginBottom:3}}>PAR</div><div style={{display:"flex",gap:4}}>{[3,4,5].map(p=>(<button key={p} onClick={()=>setCcHolePar(idx,p)} style={{width:32,height:28,borderRadius:6,border:h.par===p?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:h.par===p?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:13,fontWeight:700}}>{p}</button>))}</div></div><div style={{flex:1}}><div style={{fontSize:9,color:C.muted,marginBottom:3}}>RANGE</div><div style={{display:"flex",gap:4,alignItems:"center"}}><input value={h.rangeMin} onChange={e=>setCcHoleRange(idx,"rangeMin",e.target.value)} style={{...smallInput,width:40}}/><span style={{color:C.muted,fontSize:11}}>-</span><input value={h.rangeMax} onChange={e=>setCcHoleRange(idx,"rangeMax",e.target.value)} style={{...smallInput,width:40}}/></div></div></div>;})}</div>
        <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,background:C.card2,display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{color:C.muted}}>{ccNine===0?"Front":"Back"} 9 Par: <strong style={{color:C.text}}>{ccHoles.slice(ccNine*9,ccNine*9+9).reduce((s,h)=>s+h.par,0)}</strong></span><span style={{color:C.muted}}>Total Par: <strong style={{color:C.greenLt}}>{ccHoles.reduce((s,h)=>s+h.par,0)}</strong></span></div></div>
      <button onClick={saveCreatedCourse} disabled={!ccName.trim()} style={{...btnS(true),width:"100%",padding:14,fontSize:15,opacity:ccName.trim()?1:0.5}}>💾 Save Course</button>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}><h2 style={{margin:0,fontSize:18}}>Courses</h2><div style={{display:"flex",gap:4,flexWrap:"wrap"}}><button onClick={()=>{setCreating(true);resetCreator();}} style={{...btnS(true),padding:"5px 10px",fontSize:10}}>✏️ Create</button>{["Easy","Medium","Hard","Expert"].map(d=>(<button key={d} onClick={()=>handleGenerate(d)} style={{...btnS(false),padding:"5px 8px",fontSize:10,color:d==="Easy"?C.greenLt:d==="Medium"?C.gold:d==="Hard"?C.red:"#b48af8"}}>+{d}</button>))}</div></div>
      {/* Filter pills */}
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {[["all","All"],["favorites","★ Favorites"],["Easy","Easy"],["Medium","Medium"],["Hard","Hard"],["Expert","Expert"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding:"4px 10px",borderRadius:6,border:filter===v?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:filter===v?C.accent:"transparent",color:filter===v?C.text:C.muted,cursor:"pointer",fontSize:10,fontWeight:filter===v?700:400}}>{l}</button>
        ))}
      </div>
      {filtered.length===0 && <div style={{textAlign:"center",padding:30,color:C.muted,fontSize:12,background:C.card,borderRadius:12,border:`1px solid ${C.border}`}}>{filter==="favorites"?"No favorites yet — tap the ☆ on a course to add one":"No courses match this filter"}</div>}
      {filtered.map(c=>{const tp=c.holes.reduce((s,h)=>s+h.par,0);const rec=courseRecords?.[c.name];const open=statsOpen[c.name];const stats=open?computeCourseStats(c.name,rounds,leagueMatches,me):null;const fav=isFav(c.name);return<div key={c.id} style={{background:C.card,borderRadius:12,border:`1px solid ${fav?C.gold:C.border}`,overflow:"hidden"}}><div style={{background:C.headerBg,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><div style={{display:"flex",alignItems:"center",gap:8,minWidth:0,flex:1}}><button onClick={(e)=>{e.stopPropagation();toggleFav(c.name);}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:18,color:fav?C.gold:C.muted,padding:0,lineHeight:1}} title={fav?"Remove from favorites":"Add to favorites"}>{fav?"★":"☆"}</button><div style={{minWidth:0}}><div style={{fontWeight:700,fontSize:14,textTransform:"uppercase",letterSpacing:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>{c.tournament&&<div style={{fontSize:10,color:C.blue}}>{c.tournament}</div>}</div></div><span style={{background:c.level==="Hard"?"#6a2222":c.level==="Medium"?"#5a4a1a":c.level==="Expert"?"#4a2a6a":C.green,padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600,whiteSpace:"nowrap"}}>{c.level}</span></div>
        {rec && (
          <div style={{padding:"6px 14px",background:"rgba(212,184,74,0.06)",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11}}>
            <span style={{color:C.gold}}>🏆 Course Record</span>
            <span><strong style={{color:"#fff"}}>{rec.total}</strong><span style={{color:C.muted,marginLeft:6}}>— {rec.player}</span></span>
          </div>
        )}
        <div style={{padding:10,overflowX:"auto"}}>{[0,9].map(start=>(<table key={start} style={{width:"100%",borderCollapse:"collapse",fontSize:10,marginBottom:start===0?4:0,minWidth:460}}><thead><tr style={{background:C.accent}}><th style={{padding:"4px 6px",textAlign:"left",fontWeight:700,minWidth:44}}>HOLE</th>{c.holes.slice(start,start+9).map(h=><th key={h.num} style={{padding:"4px 2px",textAlign:"center",minWidth:30}}>{h.num}</th>)}<th style={{padding:"4px 4px",textAlign:"center",fontWeight:700,minWidth:42}}>{start===0?"OUT":"IN"}</th>{start===9&&<th style={{padding:"4px 4px",textAlign:"center",fontWeight:700,minWidth:42}}>TOT</th>}</tr></thead><tbody><tr style={{background:C.card2}}><td style={{padding:"3px 6px",fontWeight:600,color:C.greenLt,fontSize:9}}>RANGE</td>{c.holes.slice(start,start+9).map(h=><td key={h.num} style={{padding:"2px 1px",textAlign:"center",fontSize:9,color:C.muted}}>{fmtR(h.range)}</td>)}<td style={{textAlign:"center",fontSize:9,color:C.muted}}>{fmtRange(c.holes,start,start+9)}</td>{start===9&&<td style={{textAlign:"center",fontSize:9,color:C.muted}}>{fmtRange(c.holes,0,18)}</td>}</tr><tr><td style={{padding:"3px 6px",fontWeight:600}}>PAR</td>{c.holes.slice(start,start+9).map(h=><td key={h.num} style={{padding:"2px",textAlign:"center"}}>{h.par}</td>)}<td style={{textAlign:"center",fontWeight:700}}>{calcPar(c.holes,start,start+9)}</td>{start===9&&<td style={{textAlign:"center",fontWeight:700,color:C.greenLt}}>{tp}</td>}</tr>{open&&stats&&<><tr style={{background:C.card2}}><td style={{padding:"3px 6px",fontWeight:600,color:C.blue,fontSize:9}}>AVG</td>{c.holes.slice(start,start+9).map((h,i)=>{const idx=start+i;const a=stats.holeAvgs[idx];const d=stats.overUnderPerHole?.[idx];const color=d==null?C.muted:d<0?C.greenLt:d>0?"#ff6b6b":C.text;return<td key={h.num} style={{padding:"2px 1px",textAlign:"center",fontSize:9,color,fontWeight:600}}>{a==null?"—":a}</td>;})}<td style={{padding:"2px",textAlign:"center",fontSize:9,color:C.muted}}>—</td>{start===9&&<td style={{textAlign:"center",fontSize:9,color:C.blue,fontWeight:700}}>{stats.avg??"—"}</td>}</tr></>}</tbody></table>))}</div>
        {open&&stats&&<div style={{padding:"6px 14px",background:C.card2,borderTop:`1px solid ${C.border}`,fontSize:11,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6}}><span style={{color:C.muted}}>{stats.rounds} round{stats.rounds!==1?"s":""}</span>{stats.hardestIdx!=null&&<span style={{color:"#ff6b6b"}}>Hardest: #{stats.hardestIdx+1}</span>}{stats.easiestIdx!=null&&<span style={{color:C.greenLt}}>Easiest: #{stats.easiestIdx+1}</span>}</div>}
        {open&&!stats&&<div style={{padding:"8px 14px",background:C.card2,borderTop:`1px solid ${C.border}`,fontSize:11,color:C.muted,textAlign:"center"}}>No 18-hole rounds yet</div>}
        <div style={{padding:"6px 10px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {c.generated?<button onClick={()=>deleteCourseFromDB(c.id)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:11}}>Remove</button>:<div/>}
            <button onClick={()=>setStatsOpen(s=>({...s,[c.name]:!s[c.name]}))} style={{background:"transparent",border:"none",color:open?C.blue:C.muted,cursor:"pointer",fontSize:11}}>{open?"▾":"▸"} Stats</button>
          </div>
          <button onClick={()=>startRound(c)} style={{...btnS(true),padding:"6px 14px",fontSize:11}}>Play</button>
        </div></div>;})}
    </div>
  );
}
