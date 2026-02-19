// ─── THEME & STYLE CONSTANTS ────────────────────────────
export const C={bg:"#0a1a0a",card:"#142414",card2:"#1c301c",accent:"#1e4a1e",green:"#2d6a2d",greenLt:"#4aaa4a",gold:"#d4b84a",text:"#e4e4d8",muted:"#8a9a8a",border:"#243a24",white:"#fff",red:"#ef4444",blue:"#8ab4f8",headerBg:"linear-gradient(135deg,#0f2a0f,#1e4a1e)"};
export const btnS=p=>({padding:"10px 20px",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:14,background:p?`linear-gradient(135deg,${C.green},${C.accent})`:C.card2,color:p?C.white:C.text,...(p?{}:{border:`1px solid ${C.border}`})});
export const inputS={padding:"8px 12px",borderRadius:6,border:`1px solid ${C.border}`,background:C.card2,color:C.text,fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"};
export const smallInput={padding:"6px 4px",borderRadius:4,border:`1px solid ${C.border}`,background:C.card2,color:C.text,fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",textAlign:"center"};
