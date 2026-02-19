// ─── SEASON 1 LEAGUE DATA ───────────────────────────────
export const S1_STANDINGS=[{r:1,seed:1,p:"Ryan Hangartner",pts:12,gp:6,w:6,l:0,t:0,tAdj:-23,aAdj:-4,aScr:68,tScr:405},{r:2,seed:2,p:"Jimmie Perkins",pts:11,gp:7,w:5,l:1,t:1,tAdj:-40,aAdj:-6,aScr:66,tScr:462},{r:3,seed:3,p:"Josh Baker",pts:8,gp:7,w:4,l:3,t:0,tAdj:-36,aAdj:-5,aScr:66,tScr:462},{r:4,seed:4,p:"Jeff Gurrister",pts:8,gp:7,w:4,l:3,t:0,tAdj:-29,aAdj:-4,aScr:70,tScr:493},{r:5,seed:5,p:"Tyler Shane",pts:8,gp:7,w:4,l:3,t:0,tAdj:26,aAdj:4,aScr:86,tScr:600},{r:6,seed:6,p:"Jon Basorka",pts:8,gp:7,w:4,l:3,t:0,tAdj:29,aAdj:4,aScr:86,tScr:599},{r:7,seed:7,p:"Jacob Schmiegelt",pts:4,gp:7,w:2,l:5,t:0,tAdj:2,aAdj:0,aScr:76,tScr:529},{r:8,seed:0,p:"Danny Zagorski",pts:3,gp:6,w:1,l:4,t:1,tAdj:-3,aAdj:-1,aScr:74,tScr:441},{r:9,seed:0,p:"Kevin Koerner",pts:2,gp:6,w:1,l:5,t:0,tAdj:50,aAdj:8,aScr:90,tScr:540},{r:10,seed:0,p:"Kevin Papiernik",pts:2,gp:6,w:1,l:5,t:0,tAdj:71,aAdj:12,aScr:94,tScr:563}];
export const S1_RESULTS=[[1,1,1,"Maitland Palms","Danny Zagorski",70,"Jimmie Perkins",70,"Tie",0],[2,1,1,"Maitland Palms","Josh Baker",71,"Kevin Papiernik",94,"Josh Baker",-23],[3,1,1,"Maitland Palms","Tyler Shane",91,"Jon Basorka",88,"Jon Basorka",-3],[4,1,1,"Maitland Palms","Kevin Koerner",90,"Jacob Schmiegelt",75,"Jacob Schmiegelt",-15],[5,1,1,"Maitland Palms","Ryan Hangartner",69,"Jeff Gurrister",76,"Ryan Hangartner",-7],[6,1,2,"Nebraska","Danny Zagorski",75,"Kevin Papiernik",90,"Danny Zagorski",-15],[7,1,2,"Nebraska","Jimmie Perkins",71,"Jon Basorka",92,"Jimmie Perkins",-21],[8,1,2,"Nebraska","Josh Baker",67,"Jacob Schmiegelt",77,"Josh Baker",-10],[9,1,2,"Nebraska","Tyler Shane",92,"Jeff Gurrister",75,"Jeff Gurrister",-17],[10,1,2,"Nebraska","Kevin Koerner",92,"Ryan Hangartner",70,"Ryan Hangartner",-22],[11,2,3,"Lanfear Oaks","Danny Zagorski",75,"Jon Basorka",88,"Jon Basorka",-4],[12,2,3,"Lanfear Oaks","Kevin Papiernik",89,"Jacob Schmiegelt",79,"Kevin Papiernik",-6],[13,2,3,"Lanfear Oaks","Jimmie Perkins",66,"Jeff Gurrister",74,"Jimmie Perkins",-3],[14,2,3,"Lanfear Oaks","Josh Baker",66,"Ryan Hangartner",66,"Ryan Hangartner",-1],[15,2,3,"Lanfear Oaks","Tyler Shane",84,"Kevin Koerner",89,"Tyler Shane",-6],[16,2,4,"Orland National","Danny Zagorski",76,"Jacob Schmiegelt",66,"Jacob Schmiegelt",-13],[17,2,4,"Orland National","Jon Basorka",75,"Jeff Gurrister",68,"Jon Basorka",-7],[18,2,4,"Orland National","Kevin Papiernik",95,"Ryan Hangartner",67,"Ryan Hangartner",-6],[19,2,4,"Orland National","Jimmie Perkins",62,"Kevin Koerner",90,"Jimmie Perkins",-8],[20,2,4,"Orland National","Josh Baker",62,"Tyler Shane",83,"Tyler Shane",-2],[21,3,5,"Nebraska","Danny Zagorski",73,"Jeff Gurrister",68,"Jeff Gurrister",-5],[22,3,5,"Nebraska","Jacob Schmiegelt",86,"Ryan Hangartner",67,"Ryan Hangartner",-14],[23,3,5,"Nebraska","Jon Basorka",92,"Kevin Koerner",90,"Kevin Koerner",-2],[24,3,5,"Nebraska","Kevin Papiernik",96,"Tyler Shane",91,"Tyler Shane",-5],[25,3,5,"Nebraska","Jimmie Perkins",66,"Josh Baker",62,"Josh Baker",-4],[26,3,6,"Maitland Palms","Danny Zagorski",72,"Ryan Hangartner",66,"Ryan Hangartner",-1],[27,3,6,"Maitland Palms","Jeff Gurrister",70,"Kevin Koerner",89,"Jeff Gurrister",-14],[28,3,6,"Maitland Palms","Jacob Schmiegelt",74,"Tyler Shane",77,"Tyler Shane",-2],[29,3,6,"Maitland Palms","Jon Basorka",85,"Josh Baker",64,"Josh Baker",-11],[30,3,6,"Maitland Palms","Kevin Papiernik",99,"Jimmie Perkins",64,"Jimmie Perkins",-25]];
export const S1_PLAYOFFS=[
  [31,4,7,"Lanfear Oaks","QF","Tyler Shane",82,"Jeff Gurrister",62,"Jeff Gurrister",-10],
  [32,4,7,"Lanfear Oaks","QF","Jimmie Perkins",63,"Jacob Schmiegelt",72,"Jimmie Perkins",-4],
  [33,4,7,"Lanfear Oaks","QF","Josh Baker",70,"Jon Basorka",79,"Jon Basorka",-1],
  [34,5,8,"Maitland Palms","SF","Ryan Hangartner",66,"Jeff Gurrister",64,"Jeff Gurrister",-2],
  [35,5,8,"Maitland Palms","SF","Jimmie Perkins",69,"Jon Basorka",81,"Jimmie Perkins",-12],
  [36,6,9,"Nebraska","F","Jeff Gurrister",null,"Jimmie Perkins",null,null,null]
];

// ─── LEAGUE FORMAT OPTIONS ──────────────────────────────
export const LEAGUE_FORMATS = {
  4: { name: "4-Player Showdown", playoffSize: 2, desc: "Full round-robin → Championship Final" },
  5: { name: "5-Player Classic", playoffSize: 4, desc: "Full round-robin → Top 4 playoffs" },
  6: { name: "6-Player League", playoffSize: 4, desc: "Full round-robin → Top 4 playoffs" },
  7: { name: "7-Player Challenge", playoffSize: 4, desc: "Full round-robin → Top 4 playoffs" },
  8: { name: "8-Player Tournament", playoffSize: 4, desc: "Full round-robin → Top 4 playoffs" },
  9: { name: "9-Player Series", playoffSize: 6, desc: "Round-robin → Top 6 playoffs (1-2 seeds bye)" },
  10: { name: "10-Player League", playoffSize: 7, desc: "Round-robin → Top 7 playoffs (#1 seed bye)" },
};

// ─── ROUND ROBIN SCHEDULE GENERATOR ────────────────────
export function generateRRSchedule(players) {
  const list = [...players];
  if (list.length % 2 !== 0) list.push("__BYE__");
  const total = list.length;
  const rounds = [];
  for (let r = 0; r < total - 1; r++) {
    const rm = [];
    for (let i = 0; i < total / 2; i++) {
      const p1 = list[i], p2 = list[total - 1 - i];
      if (p1 !== "__BYE__" && p2 !== "__BYE__") rm.push([p1, p2]);
    }
    rounds.push(rm);
    const last = list.pop();
    list.splice(1, 0, last);
  }
  return rounds;
}

// ─── COMPUTE STANDINGS ─────────────────────────────────
export function computeStandings(players, matches) {
  const stats = {};
  players.forEach(p => { stats[p] = { player: p, pts: 0, w: 0, l: 0, t: 0, gp: 0, totalScore: 0, totalPar: 0 }; });
  matches.forEach(m => {
    if (m.status !== "complete" || m.roundType !== "regular") return;
    const { player1: p1, player2: p2 } = m;
    if (!stats[p1] || !stats[p2]) return;
    stats[p1].gp++; stats[p2].gp++;
    stats[p1].totalScore += (m.p1Total || 0); stats[p2].totalScore += (m.p2Total || 0);
    stats[p1].totalPar += (m.p1Par || 0); stats[p2].totalPar += (m.p2Par || 0);
    if (m.winner === p1) { stats[p1].pts += 2; stats[p1].w++; stats[p2].l++; }
    else if (m.winner === p2) { stats[p2].pts += 2; stats[p2].w++; stats[p1].l++; }
    else if (m.winner === "Tie") { stats[p1].pts++; stats[p2].pts++; stats[p1].t++; stats[p2].t++; }
  });
  return Object.values(stats)
    .map(s => ({ ...s, diff: s.totalScore - s.totalPar, avg: s.gp ? Math.round(s.totalScore / s.gp * 10) / 10 : 0 }))
    .sort((a, b) => b.pts - a.pts || (a.diff - b.diff));
}
