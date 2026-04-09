// ─── PGA TOUR 2026 (fixed: unique ranges, par 3 single ranges) ────
export const PGA_2026=[
  {start:"2026-01-12",end:"2026-01-18",tournament:"Sony Open in Hawaii",name:"Waialae Country Club",level:"Hard",holes:[]},
  {start:"2026-01-19",end:"2026-01-25",tournament:"The American Express",name:"PGA West (Stadium Course)",level:"Hard",holes:[]},
  {start:"2026-01-26",end:"2026-02-01",tournament:"Farmers Insurance Open",name:"Torrey Pines (South)",level:"Hard",holes:[]},
  {start:"2026-02-02",end:"2026-02-08",tournament:"WM Phoenix Open",name:"TPC Scottsdale (Stadium)",level:"Hard",holes:[]},
  {start:"2026-02-09",end:"2026-02-15",tournament:"AT&T Pebble Beach Pro-Am",name:"Pebble Beach Golf Links",level:"Hard",holes:[]},
  {start:"2026-02-16",end:"2026-02-22",tournament:"The Genesis Invitational",name:"Riviera Country Club",level:"Hard",holes:[]},
  {start:"2026-02-23",end:"2026-03-01",tournament:"Cognizant Classic",name:"PGA National (Champion)",level:"Hard",holes:[]},
  {start:"2026-03-02",end:"2026-03-08",tournament:"Arnold Palmer Invitational",name:"Bay Hill Club & Lodge",level:"Hard",holes:[]},
  {start:"2026-03-09",end:"2026-03-15",tournament:"THE PLAYERS Championship",name:"TPC Sawgrass (Stadium)",level:"Hard",holes:[]},
  {start:"2026-03-16",end:"2026-03-22",tournament:"Valspar Championship",name:"Innisbrook (Copperhead)",level:"Hard",holes:[]},
  {start:"2026-03-23",end:"2026-03-29",tournament:"Texas Children's Houston Open",name:"Memorial Park GC",level:"Hard",holes:[]},
  {start:"2026-03-30",end:"2026-04-05",tournament:"Valero Texas Open",name:"TPC San Antonio (Oaks)",level:"Hard",holes:[]},
  {start:"2026-04-06",end:"2026-04-12",tournament:"The Masters",name:"Augusta National Golf Club",level:"Hard",holes:[]},
  {start:"2026-04-13",end:"2026-04-19",tournament:"RBC Heritage",name:"Harbour Town Golf Links",level:"Hard",holes:[]},
  {start:"2026-04-20",end:"2026-04-26",tournament:"Zurich Classic of New Orleans",name:"TPC Louisiana",level:"Hard",holes:[]},
  {start:"2026-04-27",end:"2026-05-03",tournament:"Cadillac Championship",name:"Trump Doral (Blue Monster)",level:"Hard",holes:[]},
  {start:"2026-05-04",end:"2026-05-10",tournament:"Truist Championship",name:"Quail Hollow Club",level:"Hard",holes:[]},
  {start:"2026-05-11",end:"2026-05-17",tournament:"PGA Championship",name:"Aronimink Golf Club",level:"Hard",holes:[]},
  {start:"2026-05-18",end:"2026-05-24",tournament:"CJ Cup Byron Nelson",name:"TPC Craig Ranch",level:"Hard",holes:[]},
  {start:"2026-05-25",end:"2026-05-31",tournament:"Charles Schwab Challenge",name:"Colonial Country Club",level:"Hard",holes:[]},
  {start:"2026-06-01",end:"2026-06-07",tournament:"the Memorial Tournament",name:"Muirfield Village GC",level:"Hard",holes:[]},
  {start:"2026-06-08",end:"2026-06-14",tournament:"RBC Canadian Open",name:"TPC Toronto",level:"Hard",holes:[]},
  {start:"2026-06-15",end:"2026-06-21",tournament:"U.S. Open",name:"Shinnecock Hills GC",level:"Hard",holes:[]},
  {start:"2026-06-22",end:"2026-06-28",tournament:"Travelers Championship",name:"TPC River Highlands",level:"Hard",holes:[]},
  {start:"2026-06-29",end:"2026-07-05",tournament:"Rocket Mortgage Classic",name:"Detroit Golf Club",level:"Hard",holes:[]},
  {start:"2026-07-06",end:"2026-07-12",tournament:"John Deere Classic",name:"TPC Deere Run",level:"Hard",holes:[]},
  {start:"2026-07-13",end:"2026-07-19",tournament:"The Open Championship",name:"Royal Birkdale",level:"Hard",holes:[]},
  {start:"2026-07-20",end:"2026-07-26",tournament:"3M Open",name:"TPC Twin Cities",level:"Hard",holes:[]},
  {start:"2026-07-27",end:"2026-08-02",tournament:"Wyndham Championship",name:"Sedgefield CC",level:"Hard",holes:[]},
  {start:"2026-08-03",end:"2026-08-09",tournament:"FedEx St. Jude",name:"TPC Southwind",level:"Hard",holes:[]},
  {start:"2026-08-10",end:"2026-08-16",tournament:"BMW Championship",name:"Caves Valley GC",level:"Hard",holes:[]},
  {start:"2026-08-17",end:"2026-08-23",tournament:"Tour Championship",name:"East Lake Golf Club",level:"Hard",holes:[]}
];


export function getPGACourse(){const now=new Date();return PGA_2026.find(e=>{const s=new Date(e.start+"T00:00:00");const en=new Date(e.end+"T23:59:59");s.setDate(s.getDate()-1);return now>=s&&now<=en;});}
