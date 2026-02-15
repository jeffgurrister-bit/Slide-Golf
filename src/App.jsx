import { useState, useEffect, useCallback } from "react";
import { db } from "./firebase.js";
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  query, orderBy
} from "firebase/firestore";

// ─── PERMANENT COURSES ──────────────────────────────────
const COURSES = [
  {
    id:"tpc-scottsdale",name:"TPC Scottsdale Stadium",level:"Hard",
    holes:[
      {num:1,par:4,range:[10,10]},{num:2,par:4,range:[12,12]},{num:3,par:5,range:[15,16]},{num:4,par:3,range:[4,4]},
      {num:5,par:4,range:[14,14]},{num:6,par:4,range:[11,11]},{num:7,par:3,range:[6,6]},{num:8,par:4,range:[14,15]},
      {num:9,par:4,range:[11,13]},{num:10,par:4,range:[10,11]},{num:11,par:4,range:[13,13]},{num:12,par:3,range:[5,5]},
      {num:13,par:5,range:[16,18]},{num:14,par:4,range:[15,16]},{num:15,par:5,range:[17,18]},{num:16,par:3,range:[3,3]},
      {num:17,par:4,range:[9,9]},{num:18,par:4,range:[13,14]}
    ]
  },
  {
    id:"nebraska",name:"Nebraska",level:"Hard",
    holes:[
      {num:1,par:5,range:[17,19]},{num:2,par:4,range:[11,12]},{num:3,par:4,range:[13,13]},{num:4,par:3,range:[4,4]},
      {num:5,par:4,range:[8,9]},{num:6,par:3,range:[5,5]},{num:7,par:4,range:[12,14]},{num:8,par:4,range:[10,12]},
      {num:9,par:5,range:[20,21]},{num:10,par:5,range:[16,16]},{num:11,par:3,range:[6,6]},{num:12,par:4,range:[14,15]},
      {num:13,par:4,range:[11,13]},{num:14,par:4,range:[13,15]},{num:15,par:3,range:[7,7]},{num:16,par:4,range:[12,12]},
      {num:17,par:4,range:[15,15]},{num:18,par:5,range:[17,17]}
    ]
  },
  {
    id:"maitland-palms",name:"Maitland Palms",level:"Medium",
    holes:[
      {num:1,par:4,range:[15,16]},{num:2,par:4,range:[10,10]},{num:3,par:3,range:[4,4]},{num:4,par:4,range:[11,12]},
      {num:5,par:4,range:[13,15]},{num:6,par:5,range:[18,19]},{num:7,par:4,range:[8,9]},{num:8,par:3,range:[3,3]},
      {num:9,par:5,range:[16,16]},{num:10,par:4,range:[12,13]},{num:11,par:5,range:[17,19]},{num:12,par:4,range:[13,15]},
      {num:13,par:3,range:[2,2]},{num:14,par:4,range:[10,11]},{num:15,par:5,range:[15,15]},{num:16,par:3,range:[8,8]},
      {num:17,par:4,range:[13,13]},{num:18,par:4,range:[11,11]}
    ]
  },
  {
    id:"lanfear-oaks",name:"Lanfear Oaks",level:"Medium",
    holes:[
      {num:1,par:5,range:[18,18]},{num:2,par:4,range:[10,12]},{num:3,par:4,range:[13,14]},{num:4,par:3,range:[5,5]},
      {num:5,par:5,range:[17,19]},{num:6,par:4,range:[11,13]},{num:7,par:3,range:[3,3]},{num:8,par:4,range:[12,13]},
      {num:9,par:4,range:[11,11]},{num:10,par:3,range:[4,4]},{num:11,par:4,range:[10,11]},{num:12,par:4,range:[13,13]},
      {num:13,par:5,range:[18,20]},{num:14,par:3,range:[6,6]},{num:15,par:4,range:[10,10]},{num:16,par:4,range:[11,14]},
      {num:17,par:4,range:[12,12]},{num:18,par:5,range:[17,19]}
    ]
  },
  {
    id:"orland-national",name:"Orland National",level:"Easy",
    holes:[
      {num:1,par:4,range:[10,12]},{num:2,par:5,range:[14,16]},{num:3,par:4,range:[12,14]},{num:4,par:4,range:[13,16]},
      {num:5,par:3,range:[5,5]},{num:6,par:4,range:[8,10]},{num:7,par:4,range:[12,12]},{num:8,par:5,range:[15,17]},
      {num:9,par:3,range:[2,2]},{num:10,par:4,range:[11,14]},{num:11,par:3,range:[3,3]},{num:12,par:5,range:[16,19]},
      {num:13,par:4,range:[10,11]},{num:14,par:5,range:[15,16]},{num:15,par:4,range:[9,10]},{num:16,par:3,range:[4,4]},
      {num:17,par:4,range:[12,14]},{num:18,par:4,range:[13,14]}
    ]
  }
];

// ─── PGA TOUR 2026 SCHEDULE ─────────────────────────────
// Each course converted from real yardage/handicap data
// Hardest handicap holes = tightest ranges
// Par 5s reachable in 2 IRL = reachable in 2 in slide golf (≤18)
const PGA_2026 = [
  {
    start:"2026-01-12",end:"2026-01-18",tournament:"Sony Open in Hawaii",
    name:"Waialae Country Club",level:"Hard",
    holes:[
      {num:1,par:4,range:[12,13]},{num:2,par:5,range:[16,17]},{num:3,par:3,range:[5,6]},{num:4,par:4,range:[10,12]},
      {num:5,par:4,range:[13,14]},{num:6,par:4,range:[11,11]},{num:7,par:4,range:[10,10]},{num:8,par:3,range:[6,7]},
      {num:9,par:5,range:[17,18]},{num:10,par:4,range:[13,13]},{num:11,par:4,range:[11,12]},{num:12,par:3,range:[4,4]},
      {num:13,par:5,range:[16,16]},{num:14,par:4,range:[12,14]},{num:15,par:4,range:[13,13]},{num:16,par:3,range:[6,6]},
      {num:17,par:4,range:[11,12]},{num:18,par:4,range:[10,11]}
    ]
  },
  {
    start:"2026-01-19",end:"2026-01-25",tournament:"The American Express",
    name:"PGA West (Stadium Course)",level:"Hard",
    holes:[
      {num:1,par:4,range:[11,12]},{num:2,par:4,range:[13,14]},{num:3,par:3,range:[6,6]},{num:4,par:4,range:[12,14]},
      {num:5,par:4,range:[14,15]},{num:6,par:5,range:[17,18]},{num:7,par:4,range:[10,10]},{num:8,par:3,range:[4,4]},
      {num:9,par:5,range:[18,19]},{num:10,par:4,range:[13,13]},{num:11,par:5,range:[16,17]},{num:12,par:4,range:[11,12]},
      {num:13,par:3,range:[5,5]},{num:14,par:4,range:[12,12]},{num:15,par:4,range:[14,14]},{num:16,par:3,range:[7,7]},
      {num:17,par:5,range:[17,17]},{num:18,par:4,range:[13,14]}
    ]
  },
  {
    start:"2026-01-26",end:"2026-02-01",tournament:"Farmers Insurance Open",
    name:"Torrey Pines (South Course)",level:"Hard",
    holes:[
      {num:1,par:4,range:[13,14]},{num:2,par:4,range:[12,12]},{num:3,par:3,range:[7,8]},{num:4,par:4,range:[14,15]},
      {num:5,par:5,range:[17,18]},{num:6,par:4,range:[15,15]},{num:7,par:4,range:[11,12]},{num:8,par:3,range:[5,6]},
      {num:9,par:5,range:[18,19]},{num:10,par:4,range:[13,14]},{num:11,par:3,range:[6,6]},{num:12,par:4,range:[15,15]},
      {num:13,par:5,range:[18,18]},{num:14,par:4,range:[11,12]},{num:15,par:4,range:[12,13]},{num:16,par:3,range:[4,5]},
      {num:17,par:4,range:[13,13]},{num:18,par:5,range:[17,18]}
    ]
  },
  {
    start:"2026-02-02",end:"2026-02-08",tournament:"WM Phoenix Open",
    name:"TPC Scottsdale (Stadium)",level:"Hard",
    holes:[
      {num:1,par:4,range:[10,11]},{num:2,par:4,range:[12,12]},{num:3,par:5,range:[16,17]},{num:4,par:3,range:[4,4]},
      {num:5,par:4,range:[14,14]},{num:6,par:4,range:[11,11]},{num:7,par:3,range:[6,6]},{num:8,par:4,range:[14,15]},
      {num:9,par:4,range:[12,13]},{num:10,par:4,range:[10,11]},{num:11,par:4,range:[13,13]},{num:12,par:3,range:[5,5]},
      {num:13,par:5,range:[17,18]},{num:14,par:4,range:[15,16]},{num:15,par:5,range:[17,18]},{num:16,par:3,range:[3,3]},
      {num:17,par:4,range:[9,9]},{num:18,par:4,range:[13,14]}
    ]
  },
  {
    start:"2026-02-09",end:"2026-02-15",tournament:"AT&T Pebble Beach Pro-Am",
    name:"Pebble Beach Golf Links",level:"Hard",
    holes:[
      {num:1,par:4,range:[10,11]},{num:2,par:5,range:[15,16]},{num:3,par:4,range:[11,13]},{num:4,par:4,range:[8,10]},
      {num:5,par:3,range:[5,6]},{num:6,par:5,range:[16,16]},{num:7,par:3,range:[3,3]},{num:8,par:4,range:[13,13]},
      {num:9,par:4,range:[15,15]},{num:10,par:4,range:[13,14]},{num:11,par:4,range:[11,11]},{num:12,par:3,range:[6,7]},
      {num:13,par:4,range:[13,14]},{num:14,par:5,range:[19,19]},{num:15,par:4,range:[11,13]},{num:16,par:4,range:[12,13]},
      {num:17,par:3,range:[5,5]},{num:18,par:5,range:[17,18]}
    ]
  },
  {
    start:"2026-02-16",end:"2026-02-22",tournament:"The Genesis Invitational",
    name:"Riviera Country Club",level:"Hard",
    holes:[
      {num:1,par:5,range:[16,17]},{num:2,par:4,range:[12,12]},{num:3,par:4,range:[13,14]},{num:4,par:3,range:[7,7]},
      {num:5,par:4,range:[11,12]},{num:6,par:3,range:[5,5]},{num:7,par:4,range:[14,14]},{num:8,par:4,range:[13,13]},
      {num:9,par:4,range:[12,13]},{num:10,par:4,range:[15,15]},{num:11,par:5,range:[17,18]},{num:12,par:4,range:[12,13]},
      {num:13,par:4,range:[11,11]},{num:14,par:3,range:[4,4]},{num:15,par:4,range:[13,14]},{num:16,par:3,range:[6,6]},
      {num:17,par:5,range:[17,17]},{num:18,par:4,range:[14,14]}
    ]
  },
  {
    start:"2026-02-23",end:"2026-03-01",tournament:"Cognizant Classic",
    name:"PGA National (Champion)",level:"Hard",
    holes:[
      {num:1,par:4,range:[12,13]},{num:2,par:5,range:[17,18]},{num:3,par:4,range:[13,13]},{num:4,par:3,range:[5,6]},
      {num:5,par:4,range:[11,12]},{num:6,par:4,range:[14,14]},{num:7,par:3,range:[6,6]},{num:8,par:4,range:[12,13]},
      {num:9,par:5,range:[16,17]},{num:10,par:4,range:[13,14]},{num:11,par:4,range:[11,12]},{num:12,par:3,range:[4,4]},
      {num:13,par:4,range:[12,12]},{num:14,par:4,range:[11,11]},{num:15,par:3,range:[7,7]},{num:16,par:4,range:[14,14]},
      {num:17,par:4,range:[13,13]},{num:18,par:5,range:[18,18]}
    ]
  },
  {
    start:"2026-03-02",end:"2026-03-08",tournament:"Arnold Palmer Invitational",
    name:"Bay Hill Club & Lodge",level:"Hard",
    holes:[
      {num:1,par:4,range:[13,14]},{num:2,par:5,range:[17,18]},{num:3,par:4,range:[11,12]},{num:4,par:3,range:[6,7]},
      {num:5,par:4,range:[12,13]},{num:6,par:5,range:[18,18]},{num:7,par:4,range:[13,13]},{num:8,par:3,range:[5,5]},
      {num:9,par:4,range:[14,14]},{num:10,par:4,range:[12,13]},{num:11,par:4,range:[13,14]},{num:12,par:5,range:[17,18]},
      {num:13,par:3,range:[4,4]},{num:14,par:4,range:[12,12]},{num:15,par:4,range:[11,12]},{num:16,par:5,range:[16,17]},
      {num:17,par:3,range:[7,7]},{num:18,par:4,range:[14,14]}
    ]
  },
  {
    start:"2026-03-09",end:"2026-03-15",tournament:"THE PLAYERS Championship",
    name:"TPC Sawgrass (Stadium)",level:"Hard",
    holes:[
      {num:1,par:4,range:[12,13]},{num:2,par:5,range:[17,18]},{num:3,par:3,range:[5,6]},{num:4,par:4,range:[12,12]},
      {num:5,par:4,range:[11,12]},{num:6,par:4,range:[13,13]},{num:7,par:4,range:[14,14]},{num:8,par:3,range:[6,6]},
      {num:9,par:5,range:[17,17]},{num:10,par:4,range:[13,14]},{num:11,par:5,range:[18,18]},{num:12,par:4,range:[11,12]},
      {num:13,par:3,range:[5,5]},{num:14,par:4,range:[13,13]},{num:15,par:4,range:[12,13]},{num:16,par:5,range:[16,17]},
      {num:17,par:3,range:[3,3]},{num:18,par:4,range:[14,14]}
    ]
  },
  {
    start:"2026-03-16",end:"2026-03-22",tournament:"Valspar Championship",
    name:"Innisbrook (Copperhead)",level:"Hard",
    holes:[
      {num:1,par:4,range:[12,13]},{num:2,par:5,range:[17,18]},{num:3,par:3,range:[5,5]},{num:4,par:4,range:[13,14]},
      {num:5,par:4,range:[11,12]},{num:6,par:4,range:[12,12]},{num:7,par:4,range:[13,13]},{num:8,par:3,range:[6,7]},
      {num:9,par:5,range:[16,17]},{num:10,par:4,range:[11,11]},{num:11,par:4,range:[14,14]},{num:12,par:4,range:[12,13]},
      {num:13,par:3,range:[4,4]},{num:14,par:5,range:[17,18]},{num:15,par:4,range:[13,13]},{num:16,par:4,range:[11,12]},
      {num:17,par:3,range:[7,7]},{num:18,par:4,range:[14,14]}
    ]
  },
  {
    start:"2026-03-23",end:"2026-03-29",tournament:"Texas Children's Houston Open",
    name:"Memorial Park Golf Course",level:"Hard",
    holes:[
      {num:1,par:4,range:[13,14]},{num:2,par:4,range:[11,12]},{num:3,par:4,range:[14,14]},{num:4,par:3,range:[6,6]},
      {num:5,par:5,range:[17,18]},{num:6,par:4,range:[12,13]},{num:7,par:3,range:[5,5]},{num:8,par:4,range:[13,13]},
      {num:9,par:4,range:[12,12]},{num:10,par:4,range:[11,12]},{num:11,par:3,range:[4,4]},{num:12,par:4,range:[14,14]},
      {num:13,par:5,range:[18,18]},{num:14,par:4,range:[13,14]},{num:15,par:4,range:[12,13]},{num:16,par:3,range:[7,7]},
      {num:17,par:4,range:[11,11]},{num:18,par:4,range:[13,13]}
    ]
  },
  {
    start:"2026-03-30",end:"2026-04-05",tournament:"Valero Texas Open",
    name:"TPC San Antonio (Oaks)",level:"Hard",
    holes:[
      {num:1,par:4,range:[13,14]},{num:2,par:4,range:[12,12]},{num:3,par:5,range:[17,18]},{num:4,par:4,range:[11,12]},
      {num:5,par:3,range:[5,6]},{num:6,par:4,range:[14,14]},{num:7,par:4,range:[12,13]},{num:8,par:3,range:[6,6]},
      {num:9,par:5,range:[18,18]},{num:10,par:4,range:[13,14]},{num:11,par:3,range:[4,4]},{num:12,par:4,range:[11,12]},
      {num:13,par:4,range:[13,13]},{num:14,par:5,range:[17,18]},{num:15,par:4,range:[12,13]},{num:16,par:4,range:[14,14]},
      {num:17,par:3,range:[7,7]},{num:18,par:4,range:[15,15]}
    ]
  },
  {
    start:"2026-04-06",end:"2026-04-12",tournament:"The Masters",
    name:"Augusta National Golf Club",level:"Hard",
    holes:[
      {num:1,par:4,range:[13,14]},{num:2,par:5,range:[17,18]},{num:3,par:4,range:[11,12]},{num:4,par:3,range:[7,7]},
      {num:5,par:4,range:[14,14]},{num:6,par:3,range:[5,6]},{num:7,par:4,range:[12,13]},{num:8,par:5,range:[17,18]},
      {num:9,par:4,range:[13,13]},{num:10,par:4,range:[15,15]},{num:11,par:4,range:[14,14]},{num:12,par:3,range:[4,4]},
      {num:13,par:5,range:[16,17]},{num:14,par:4,range:[13,14]},{num:15,par:5,range:[16,17]},{num:16,par:3,range:[5,5]},
      {num:17,par:4,range:[12,12]},{num:18,par:4,range:[14,14]}
    ]
  },
  {
    start:"2026-04-13",end:"2026-04-19",tournament:"RBC Heritage",
    name:"Harbour Town Golf Links",level:"Hard",
    holes:[
      {num:1,par:4,range:[11,12]},{num:2,par:5,range:[16,17]},{num:3,par:4,range:[10,11]},{num:4,par:3,range:[5,6]},
      {num:5,par:5,range:[17,18]},{num:6,par:4,range:[12,12]},{num:7,par:3,range:[4,4]},{num:8,par:4,range:[13,13]},
      {num:9,par:4,range:[11,12]},{num:10,par:4,range:[12,12]},{num:11,par:4,range:[11,11]},{num:12,par:4,range:[13,13]},
      {num:13,par:4,range:[10,11]},{num:14,par:3,range:[6,7]},{num:15,par:5,range:[17,17]},{num:16,par:4,range:[12,13]},
      {num:17,par:3,range:[5,5]},{num:18,par:4,range:[13,13]}
    ]
  },
  {
    start:"2026-04-20",end:"2026-04-26",tournament:"Zurich Classic of New Orleans",
    name:"TPC Louisiana",level:"Hard",
    holes:[
      {num:1,par:4,range:[12,13]},{num:2,par:5,range:[17,18]},{num:3,par:4,range:[11,12]},{num:4,par:4,range:[13,14]},
      {num:5,par:3,range:[5,5]},{num:6,par:4,range:[12,12]},{num:7,par:5,range:[17,18]},{num:8,par:3,range:[6,6]},
      {num:9,par:4,range:[14,14]},{num:10,par:4,range:[11,12]},{num:11,par:4,range:[13,13]},{num:12,par:3,range:[4,5]},
      {num:13,par:5,range:[18,18]},{num:14,par:4,range:[13,14]},{num:15,par:4,range:[12,13]},{num:16,par:3,range:[6,6]},
      {num:17,par:4,range:[14,14]},{num:18,par:5,range:[17,17]}
    ]
  },
  {
    start:"2026-04-27",end:"2026-05-03",tournament:"Cadillac Championship",
    name:"Trump National Doral (Blue Monster)",level:"Hard",
    holes:[
      {num:1,par:5,range:[17,18]},{num:2,par:4,range:[12,13]},{num:3,par:4,range:[13,14]},{num:4,par:3,range:[7,7]},
      {num:5,par:5,range:[18,18]},{num:6,par:4,range:[11,12]},{num:7,par:4,range:[13,13]},{num:8,par:3,range:[5,6]},
      {num:9,par:4,range:[14,14]},{num:10,par:5,range:[17,18]},{num:11,par:4,range:[12,12]},{num:12,par:4,range:[14,14]},
      {num:13,par:3,range:[6,6]},{num:14,par:4,range:[13,14]},{num:15,par:4,range:[11,11]},{num:16,par:3,range:[4,5]},
      {num:17,par:4,range:[15,15]},{num:18,par:4,range:[14,14]}
    ]
  },
  {
    start:"2026-05-04",end:"2026-05-10",tournament:"Truist Championship",
    name:"Quail Hollow Club",level:"Hard",
    holes:[
      {num:1,par:4,range:[12,13]},{num:2,par:4,range:[14,14]},{num:3,par:4,range:[11,12]},{num:4,par:3,range:[7,7]},
      {num:5,par:4,range:[13,14]},{num:6,par:3,range:[5,5]},{num:7,par:5,range:[17,18]},{num:8,par:4,range:[12,12]},
      {num:9,par:4,range:[13,13]},{num:10,par:5,range:[18,18]},{num:11,par:4,range:[14,14]},{num:12,par:3,range:[4,4]},
      {num:13,par:4,range:[12,13]},{num:14,par:4,range:[15,15]},{num:15,par:5,range:[17,17]},{num:16,par:4,range:[13,14]},
      {num:17,par:3,range:[6,6]},{num:18,par:4,range:[14,14]}
    ]
  },
  {
    start:"2026-05-11",end:"2026-05-17",tournament:"PGA Championship",
    name:"Aronimink Golf Club",level:"Hard",
    holes:[
      {num:1,par:4,range:[13,14]},{num:2,par:5,range:[18,18]},{num:3,par:3,range:[6,6]},{num:4,par:4,range:[14,14]},
      {num:5,par:4,range:[12,13]},{num:6,par:4,range:[13,13]},{num:7,par:4,range:[11,12]},{num:8,par:3,range:[5,5]},
      {num:9,par:4,range:[14,14]},{num:10,par:4,range:[13,13]},{num:11,par:4,range:[15,15]},{num:12,par:3,range:[4,4]},
      {num:13,par:5,range:[17,18]},{num:14,par:4,range:[12,13]},{num:15,par:4,range:[13,14]},{num:16,par:3,range:[7,7]},
      {num:17,par:4,range:[11,11]},{num:18,par:4,range:[14,14]}
    ]
  },
  {
    start:"2026-05-18",end:"2026-05-24",tournament:"CJ Cup Byron Nelson",
    name:"TPC Craig Ranch",level:"Hard",
    holes:[
      {num:1,par:4,range:[11,12]},{num:2,par:4,range:[12,13]},{num:3,par:5,range:[17,18]},{num:4,par:3,range:[5,6]},
      {num:5,par:4,range:[14,14]},{num:6,par:4,range:[13,13]},{num:7,par:3,range:[4,4]},{num:8,par:4,range:[12,13]},
      {num:9,par:5,range:[17,18]},{num:10,par:4,range:[13,14]},{num:11,par:4,range:[11,12]},{num:12,par:3,range:[6,6]},
      {num:13,par:4,range:[14,14]},{num:14,par:5,range:[16,17]},{num:15,par:4,range:[12,12]},{num:16,par:4,range:[13,14]},
      {num:17,par:3,range:[5,5]},{num:18,par:5,range:[17,17]}
    ]
  },
  {
    start:"2026-05-25",end:"2026-05-31",tournament:"Charles Schwab Challenge",
    name:"Colonial Country Club",level:"Hard",
    holes:[
      {num:1,par:5,range:[17,18]},{num:2,par:4,range:[12,12]},{num:3,par:4,range:[13,13]},{num:4,par:3,range:[6,6]},
      {num:5,par:4,range:[14,14]},{num:6,par:4,range:[11,12]},{num:7,par:4,range:[10,11]},{num:8,par:3,range:[5,5]},
      {num:9,par:4,range:[12,13]},{num:10,par:4,range:[13,13]},{num:11,par:5,range:[17,18]},{num:12,par:3,range:[4,4]},
      {num:13,par:4,range:[14,14]},{num:14,par:4,range:[11,12]},{num:15,par:4,range:[12,12]},{num:16,par:4,range:[13,14]},
      {num:17,par:3,range:[5,5]},{num:18,par:4,range:[12,12]}
    ]
  },
  {
    start:"2026-06-01",end:"2026-06-07",tournament:"the Memorial Tournament",
    name:"Muirfield Village Golf Club",level:"Hard",
    holes:[
      {num:1,par:4,range:[13,14]},{num:2,par:4,range:[14,14]},{num:3,par:4,range:[12,13]},{num:4,par:3,range:[6,6]},
      {num:5,par:5,range:[17,18]},{num:6,par:4,range:[12,12]},{num:7,par:5,range:[17,18]},{num:8,par:3,range:[5,5]},
      {num:9,par:4,range:[13,13]},{num:10,par:4,range:[14,14]},{num:11,par:5,range:[18,18]},{num:12,par:3,range:[4,5]},
      {num:13,par:4,range:[13,14]},{num:14,par:4,range:[12,12]},{num:15,par:5,range:[16,17]},{num:16,par:3,range:[7,7]},
      {num:17,par:4,range:[13,13]},{num:18,par:4,range:[14,14]}
    ]
  },
  {
    start:"2026-06-08",end:"2026-06-14",tournament:"RBC Canadian Open",
    name:"TPC Toronto at Osprey Valley",level:"Hard",
    holes:[
      {num:1,par:4,range:[12,13]},{num:2,par:5,range:[17,18]},{num:3,par:4,range:[11,12]},{num:4,par:3,range:[5,6]},
      {num:5,par:4,range:[13,13]},{num:6,par:4,range:[14,14]},{num:7,par:3,range:[6,6]},{num:8,par:4,range:[12,13]},
      {num:9,par:5,range:[16,17]},{num:10,par:4,range:[13,14]},{num:11,par:4,range:[11,12]},{num:12,par:3,range:[4,4]},
      {num:13,par:5,range:[18,18]},{num:14,par:4,range:[12,12]},{num:15,par:4,range:[13,13]},{num:16,par:3,range:[6,7]},
      {num:17,par:4,range:[14,14]},{num:18,par:4,range:[13,14]}
    ]
  },
  {
    start:"2026-06-15",end:"2026-06-21",tournament:"U.S. Open",
    name:"Shinnecock Hills Golf Club",level:"Hard",
    holes:[
      {num:1,par:4,range:[13,14]},{num:2,par:3,range:[7,7]},{num:3,par:4,range:[14,14]},{num:4,par:4,range:[12,13]},
      {num:5,par:5,range:[18,18]},{num:6,par:4,range:[13,13]},{num:7,par:3,range:[5,5]},{num:8,par:4,range:[14,14]},
      {num:9,par:4,range:[15,15]},{num:10,par:4,range:[13,14]},{num:11,par:3,range:[6,6]},{num:12,par:4,range:[14,14]},
      {num:13,par:4,range:[12,12]},{num:14,par:4,range:[13,13]},{num:15,par:4,range:[11,12]},{num:16,par:5,range:[18,18]},
      {num:17,par:3,range:[4,4]},{num:18,par:4,range:[14,14]}
    ]
  },
  {
    start:"2026-06-22",end:"2026-06-28",tournament:"Travelers Championship",
    name:"TPC River Highlands",level:"Hard",
    holes:[
      {num:1,par:4,range:[12,13]},{num:2,par:4,range:[11,12]},{num:3,par:3,range:[5,5]},{num:4,par:4,range:[13,13]},
      {num:5,par:4,range:[14,14]},{num:6,par:5,range:[17,18]},{num:7,par:4,range:[10,11]},{num:8,par:3,range:[6,6]},
      {num:9,par:4,range:[12,13]},{num:10,par:4,range:[13,14]},{num:11,par:3,range:[4,4]},{num:12,par:4,range:[12,12]},
      {num:13,par:5,range:[16,17]},{num:14,par:4,range:[11,12]},{num:15,par:5,range:[17,17]},{num:16,par:4,range:[13,14]},
      {num:17,par:3,range:[5,5]},{num:18,par:4,range:[13,13]}
    ]
  },
  {
    start:"2026-06-29",end:"2026-07-05",tournament:"Rocket Mortgage Classic",
    name:"Detroit Golf Club",level:"Hard",
    holes:[
      {num:1,par:4,range:[11,12]},{num:2,par:5,range:[17,18]},{num:3,par:4,range:[12,13]},{num:4,par:3,range:[5,5]},
      {num:5,par:4,range:[13,14]},{num:6,par:4,range:[12,12]},{num:7,par:4,range:[13,13]},{num:8,par:3,range:[6,7]},
      {num:9,par:5,range:[16,17]},{num:10,par:4,range:[11,12]},{num:11,par:4,range:[13,14]},{num:12,par:3,range:[4,4]},
      {num:13,par:4,range:[14,14]},{num:14,par:5,range:[17,18]},{num:15,par:4,range:[12,12]},{num:16,par:4,range:[13,13]},
      {num:17,par:3,range:[5,6]},{num:18,par:4,range:[12,13]}
    ]
  },
  {
    start:"2026-07-06",end:"2026-07-12",tournament:"John Deere Classic",
    name:"TPC Deere Run",level:"Hard",
    holes:[
      {num:1,par:4,range:[12,13]},{num:2,par:5,range:[16,17]},{num:3,par:4,range:[11,12]},{num:4,par:3,range:[5,5]},
      {num:5,par:4,range:[13,14]},{num:6,par:4,range:[12,12]},{num:7,par:4,range:[10,11]},{num:8,par:3,range:[6,6]},
      {num:9,par:5,range:[17,18]},{num:10,par:4,range:[13,13]},{num:11,par:4,range:[11,12]},{num:12,par:3,range:[4,5]},
      {num:13,par:4,range:[12,13]},{num:14,par:5,range:[17,18]},{num:15,par:4,range:[13,13]},{num:16,par:4,range:[14,14]},
      {num:17,par:3,range:[5,5]},{num:18,par:4,range:[12,12]}
    ]
  },
  {
    start:"2026-07-13",end:"2026-07-19",tournament:"The Open Championship",
    name:"Royal Birkdale",level:"Hard",
    holes:[
      {num:1,par:4,range:[13,14]},{num:2,par:4,range:[13,13]},{num:3,par:4,range:[14,14]},{num:4,par:3,range:[6,6]},
      {num:5,par:4,range:[11,12]},{num:6,par:4,range:[15,15]},{num:7,par:3,range:[5,5]},{num:8,par:4,range:[12,13]},
      {num:9,par:4,range:[13,13]},{num:10,par:4,range:[12,12]},{num:11,par:4,range:[14,14]},{num:12,par:3,range:[7,7]},
      {num:13,par:4,range:[15,15]},{num:14,par:3,range:[5,6]},{num:15,par:5,range:[17,18]},{num:16,par:4,range:[12,12]},
      {num:17,par:5,range:[17,17]},{num:18,par:4,range:[14,14]}
    ]
  },
  {
    start:"2026-07-20",end:"2026-07-26",tournament:"3M Open",
    name:"TPC Twin Cities",level:"Hard",
    holes:[
      {num:1,par:4,range:[11,12]},{num:2,par:4,range:[13,14]},{num:3,par:5,range:[17,18]},{num:4,par:3,range:[5,5]},
      {num:5,par:4,range:[12,13]},{num:6,par:4,range:[14,14]},{num:7,par:4,range:[11,11]},{num:8,par:3,range:[6,6]},
      {num:9,par:5,range:[16,17]},{num:10,par:4,range:[13,13]},{num:11,par:4,range:[12,12]},{num:12,par:3,range:[4,5]},
      {num:13,par:4,range:[13,14]},{num:14,par:4,range:[14,14]},{num:15,par:5,range:[17,18]},{num:16,par:4,range:[12,13]},
      {num:17,par:3,range:[5,5]},{num:18,par:4,range:[13,13]}
    ]
  },
  {
    start:"2026-07-27",end:"2026-08-02",tournament:"Wyndham Championship",
    name:"Sedgefield Country Club",level:"Hard",
    holes:[
      {num:1,par:4,range:[12,13]},{num:2,par:5,range:[16,17]},{num:3,par:4,range:[11,12]},{num:4,par:3,range:[5,5]},
      {num:5,par:4,range:[13,14]},{num:6,par:4,range:[12,12]},{num:7,par:4,range:[14,14]},{num:8,par:3,range:[6,6]},
      {num:9,par:4,range:[13,13]},{num:10,par:5,range:[17,18]},{num:11,par:4,range:[12,12]},{num:12,par:4,range:[11,12]},
      {num:13,par:3,range:[4,4]},{num:14,par:5,range:[17,17]},{num:15,par:4,range:[13,14]},{num:16,par:4,range:[12,12]},
      {num:17,par:3,range:[5,6]},{num:18,par:4,range:[14,14]}
    ]
  },
  {
    start:"2026-08-03",end:"2026-08-09",tournament:"FedEx St. Jude Championship",
    name:"TPC Southwind",level:"Hard",
    holes:[
      {num:1,par:4,range:[13,14]},{num:2,par:4,range:[12,12]},{num:3,par:3,range:[6,6]},{num:4,par:4,range:[14,14]},
      {num:5,par:4,range:[11,12]},{num:6,par:5,range:[17,18]},{num:7,par:4,range:[13,13]},{num:8,par:3,range:[5,5]},
      {num:9,par:4,range:[14,14]},{num:10,par:4,range:[12,13]},{num:11,par:5,range:[17,17]},{num:12,par:3,range:[4,4]},
      {num:13,par:4,range:[13,13]},{num:14,par:4,range:[12,13]},{num:15,par:4,range:[14,14]},{num:16,par:3,range:[5,5]},
      {num:17,par:4,range:[11,12]},{num:18,par:4,range:[13,13]}
    ]
  },
  {
    start:"2026-08-10",end:"2026-08-16",tournament:"BMW Championship",
    name:"Caves Valley Golf Club",level:"Hard",
    holes:[
      {num:1,par:4,range:[12,13]},{num:2,par:4,range:[14,14]},{num:3,par:5,range:[18,18]},{num:4,par:3,range:[6,6]},
      {num:5,par:4,range:[13,14]},{num:6,par:4,range:[12,12]},{num:7,par:4,range:[13,13]},{num:8,par:3,range:[5,5]},
      {num:9,par:5,range:[17,18]},{num:10,par:4,range:[13,13]},{num:11,par:4,range:[14,14]},{num:12,par:3,range:[4,5]},
      {num:13,par:5,range:[17,18]},{num:14,par:4,range:[12,13]},{num:15,par:4,range:[15,15]},{num:16,par:3,range:[6,6]},
      {num:17,par:4,range:[13,14]},{num:18,par:4,range:[14,14]}
    ]
  },
  {
    start:"2026-08-17",end:"2026-08-23",tournament:"Tour Championship",
    name:"East Lake Golf Club",level:"Hard",
    holes:[
      {num:1,par:4,range:[13,14]},{num:2,par:4,range:[14,14]},{num:3,par:3,range:[6,6]},{num:4,par:4,range:[12,13]},
      {num:5,par:3,range:[5,5]},{num:6,par:5,range:[17,18]},{num:7,par:4,range:[13,13]},{num:8,par:4,range:[14,14]},
      {num:9,par:5,range:[18,18]},{num:10,par:4,range:[12,12]},{num:11,par:4,range:[13,14]},{num:12,par:3,range:[4,4]},
      {num:13,par:4,range:[14,14]},{num:14,par:5,range:[17,17]},{num:15,par:4,range:[12,13]},{num:16,par:4,range:[13,13]},
      {num:17,par:3,range:[7,7]},{num:18,par:5,range:[17,18]}
    ]
  }
];

function getPGACourse(){
  const now=new Date();
  return PGA_2026.find(e=>{
    const s=new Date(e.start+"T00:00:00");
    const en=new Date(e.end+"T23:59:59");
    s.setDate(s.getDate()-1);
    return now>=s&&now<=en;
  });
}

// ─── COURSE GENERATION ──────────────────────────────────
const RAND_NAMES = [
  "Whistling Pines","Shadow Ridge","Eagle Bluff","Iron Horse","Cedar Valley",
  "Falcon Crest","Timber Ridge","Stone Creek","Hawk's Landing","Silver Lakes",
  "Canyon Ridge","Elk Run","Fox Hollow","Bear Creek","Wolf Run",
  "Deer Path","Osprey Point","Heron Bay","Pelican Hill","Cypress Point",
  "Magnolia Springs","Willow Bend","Oak Hollow","Maple Ridge","Pine Valley",
  "Birch Creek","Aspen Hills","Cherry Blossom","Dogwood Trails","Juniper Hills",
  "Sawgrass Bluffs","Dunes West","Seaside Links","Ocean Breeze","Windswept Dunes",
  "Links at Stonebridge","Royal Palms","Grand Oaks","Heritage Pines","Plantation Bay",
  "Marsh Harbor","Tidal Creek","Sunset Cove","Moonlight Bay","Starlight Ranch",
  "Thunder Canyon","Lightning Ridge","Storm Peak","Whispering Oaks","Hidden Falls",
  "Crystal Springs","Emerald Hills","Diamond Creek","Ruby Falls","Sapphire Bay",
  "Golden Eagle","Bronze Bell","Copper Ridge","Ironwood","Steelhead Run",
  "Summit Ridge","Vista Grande","Panorama Hills","Horizon Links","Skyline Bluffs",
  "Prairie Wind","Tallgrass","Buffalo Run","Bison Ridge","Mustang Creek",
  "Stallion Springs","Colt Meadow","Bronco Hills","Pinto Valley","Maverick Ridge",
  "Lakeside Links","River Bend","Mill Creek","Bridge Valley","Covered Bridge",
  "Old Mill Run","Waterford Glen","Canterbury Downs","Wellington Park","Sherwood Forest",
  "Nottingham Links","Windsor Greens","Kingston Heath","Stratford Hills","Oxford Run",
  "Cambridge Links","Princeton Oaks","Yale Ridge","Stanford Hills","Dartmouth Green",
  "Ridgewood CC","Lakeview National","Mountain Shadows","Desert Springs","Coral Ridge",
  "Palm Desert Dunes","Cactus Canyon","Mesa Verde","Red Rock Canyon","Sandstone Ridge",
  "Limestone Creek","Granite Falls","Marble Ridge","Obsidian Links","Flint Hills",
  "Cobblestone Creek","Fieldstone Manor","Milestone Links","Cornerstone CC","Keystone Ridge"
];

function generateCourse(difficulty,existingNames=[]){
  const avail=RAND_NAMES.filter(n=>!existingNames.includes(n));
  const name=avail.length?avail[Math.floor(Math.random()*avail.length)]:
    `${RAND_NAMES[Math.floor(Math.random()*RAND_NAMES.length)]} ${Math.floor(Math.random()*100)}`;

  // Realistic par distribution: target 70-72
  const templates=[
    [4,5,4,4,3,4,4,3,4, 4,4,3,5,4,4,3,4,5], // par 72
    [4,4,4,4,3,5,4,3,5, 4,4,3,4,5,4,3,4,5], // par 72
    [4,5,3,4,4,4,4,3,4, 4,4,3,5,4,4,3,4,4], // par 70
    [4,4,4,3,5,4,3,4,5, 4,4,3,4,5,4,4,3,4], // par 71
    [5,4,4,3,4,4,3,4,5, 4,4,3,5,4,4,3,4,4], // par 71
    [4,5,4,3,4,4,4,3,5, 4,3,4,5,4,4,3,4,5], // par 72
  ];
  const tmpl=templates[Math.floor(Math.random()*templates.length)];

  const dm={Easy:{baseM:0.6,tight:0.1,maxR:16},Medium:{baseM:0.8,tight:0.25,maxR:19},
    Hard:{baseM:1.0,tight:0.45,maxR:21},Expert:{baseM:1.2,tight:0.65,maxR:23}}[difficulty]||{baseM:1,tight:0.3,maxR:21};

  // Assign random handicap order
  const hcpOrder=Array.from({length:18},(_,i)=>i);
  for(let i=17;i>0;i--){const j=Math.floor(Math.random()*(i+1));[hcpOrder[i],hcpOrder[j]]=[hcpOrder[j],hcpOrder[i]];}

  const holes=tmpl.map((par,i)=>{
    const hcp=hcpOrder.indexOf(i)+1; // 1=hardest, 18=easiest
    let base;
    if(par===3) base=Math.round((3+Math.random()*5)*dm.baseM);
    else if(par===4) base=Math.round((10+Math.random()*5)*dm.baseM);
    else base=Math.round((15+Math.random()*4)*dm.baseM);
    base=Math.max(2,Math.min(dm.maxR,base));

    // Tighter ranges for harder holes
    const isTight=hcp<=6?Math.random()<dm.tight+0.4:
      hcp<=12?Math.random()<dm.tight:Math.random()<dm.tight*0.3;
    const spread=isTight?0:hcp<=6?Math.floor(Math.random()*2):
      hcp<=12?Math.floor(Math.random()*3):1+Math.floor(Math.random()*3);

    return{num:i+1,par,range:[Math.max(2,base),Math.min(dm.maxR,Math.max(base,base+spread))]};
  });
  return{name,level:difficulty,holes,generated:true};
}

// ─── HELPERS ────────────────────────────────────────────
const calcPar=(h,s,e)=>h.slice(s,e).reduce((a,x)=>a+x.par,0);
const fmtRange=(h,s,e)=>{
  const mn=h.slice(s,e).reduce((a,x)=>a+x.range[0],0);
  const mx=h.slice(s,e).reduce((a,x)=>a+x.range[1],0);
  return`${mn} - ${mx}`;
};
const fmtR=r=>`${r[0]} - ${r[1]}`;

function calcHandicap(rounds){
  if(!rounds.length)return null;
  const diffs=rounds.map(r=>r.total-r.par).sort((a,b)=>a-b);
  const n=Math.max(1,Math.floor(diffs.length*0.4));
  return Math.round((diffs.slice(0,n).reduce((s,d)=>s+d,0)/n)*10)/10;
}

function scoreName(score,par){
  const d=score-par;
  if(d<=-3)return{label:"Albatross!",color:"#d4b84a",emoji:"🦅🦅"};
  if(d===-2)return{label:"Eagle!",color:"#d4b84a",emoji:"🦅"};
  if(d===-1)return{label:"Birdie!",color:"#22c55e",emoji:"🐦"};
  if(d===0)return{label:"Par",color:"#aaa",emoji:"👍"};
  if(d===1)return{label:"Bogey",color:"#ef4444",emoji:""};
  if(d===2)return{label:"Double Bogey",color:"#dc2626",emoji:""};
  return{label:`+${d}`,color:"#b91c1c",emoji:""};
}

function RelPar({s,p}){
  if(s==null)return null;
  const d=s-p;
  return<span style={{color:d<0?"#22c55e":d>0?"#ef4444":"#aaa",fontWeight:700,fontSize:12}}>{d===0?"E":d>0?`+${d}`:d}</span>;
}

// ─── THEME ──────────────────────────────────────────────
const C={
  bg:"#0a1a0a",card:"#142414",card2:"#1c301c",accent:"#1e4a1e",green:"#2d6a2d",
  greenLt:"#4aaa4a",gold:"#d4b84a",text:"#e4e4d8",muted:"#8a9a8a",border:"#243a24",
  white:"#fff",red:"#ef4444",blue:"#8ab4f8",headerBg:"linear-gradient(135deg,#0f2a0f,#1e4a1e)"
};
const btnS=p=>({
  padding:"10px 20px",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:14,
  background:p?`linear-gradient(135deg,${C.green},${C.accent})`:C.card2,
  color:p?C.white:C.text,...(p?{}:{border:`1px solid ${C.border}`})
});
const inputS={padding:"8px 12px",borderRadius:6,border:`1px solid ${C.border}`,background:C.card2,color:C.text,fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"};
const smallInput={padding:"6px 4px",borderRadius:4,border:`1px solid ${C.border}`,background:C.card2,color:C.text,fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",textAlign:"center"};

// ─── MAIN APP ───────────────────────────────────────────
export default function App(){
  const[tab,setTab]=useState("home");
  const[me,setMe]=useState(()=>{try{return localStorage.getItem("sg-me")||"";}catch(e){return"";}});
  const[players,setPlayers]=useState([]);
  const[rounds,setRounds]=useState([]);
  const[customCourses,setCustomCourses]=useState([]);
  const[loaded,setLoaded]=useState(false);

  const[selCourse,setSelCourse]=useState(null);
  const[roundPlayers,setRoundPlayers]=useState([]);
  const[playMode,setPlayMode]=useState("setup");
  const[curPlayerIdx,setCurPlayerIdx]=useState(0);
  const[curHole,setCurHole]=useState(0);
  const[holeState,setHoleState]=useState({});
  const[allScores,setAllScores]=useState({});
  const[allShotLogs,setAllShotLogs]=useState({});
  const[hideScores,setHideScores]=useState(false);
  const[nine,setNine]=useState(0);
  const[newPlayerName,setNewPlayerName]=useState("");
  const[showScorecard,setShowScorecard]=useState(false);

  // Course Creator state
  const[creating,setCreating]=useState(false);
  const[ccName,setCcName]=useState("");
  const[ccLevel,setCcLevel]=useState("Medium");
  const[ccTournament,setCcTournament]=useState("");
  const[ccHoles,setCcHoles]=useState(()=>Array.from({length:18},(_,i)=>({num:i+1,par:4,rangeMin:10,rangeMax:12})));
  const[ccNine,setCcNine]=useState(0);

  const allCourses=[...COURSES,...customCourses];

  // ─── Firebase Listeners ──────────────────────────────
  useEffect(()=>{
    const unsubs=[];
    unsubs.push(onSnapshot(collection(db,"players"),snap=>{
      setPlayers(snap.docs.map(d=>({id:d.id,...d.data()})));
    }));
    unsubs.push(onSnapshot(query(collection(db,"rounds"),orderBy("createdAt","desc")),snap=>{
      setRounds(snap.docs.map(d=>({id:d.id,...d.data()})));
    }));
    unsubs.push(onSnapshot(collection(db,"customCourses"),snap=>{
      setCustomCourses(snap.docs.map(d=>({id:d.id,...d.data(),generated:true})));
    }));
    setLoaded(true);
    return()=>unsubs.forEach(u=>u());
  },[]);

  async function addPlayerToDB(name){
    const n=name.trim();
    if(!n||players.some(p=>p.name===n))return;
    await addDoc(collection(db,"players"),{name:n,createdAt:Date.now()});
  }
  async function saveRoundToDB(rd){await addDoc(collection(db,"rounds"),{...rd,createdAt:Date.now()});}
  async function deleteRoundFromDB(id){await deleteDoc(doc(db,"rounds",id));}
  async function saveCoursetoDB(course){
    const d=await addDoc(collection(db,"customCourses"),{
      name:course.name,level:course.level,holes:course.holes,
      pga:course.pga||false,tournament:course.tournament||"",createdAt:Date.now()
    });
    return d.id;
  }
  async function deleteCourseFromDB(id){await deleteDoc(doc(db,"customCourses",id));}

  function selectMe(name){setMe(name);try{localStorage.setItem("sg-me",name);}catch(e){}}

  // ─── Course Creator ──────────────────────────────────
  function resetCreator(){
    setCcName("");setCcLevel("Medium");setCcTournament("");
    setCcHoles(Array.from({length:18},(_,i)=>({num:i+1,par:4,rangeMin:10,rangeMax:12})));
    setCcNine(0);
  }
  function setCcHolePar(idx,par){setCcHoles(prev=>{const n=[...prev];n[idx]={...n[idx],par};return n;});}
  function setCcHoleRange(idx,field,val){
    const v=parseInt(val)||0;
    setCcHoles(prev=>{const n=[...prev];n[idx]={...n[idx],[field]:Math.max(1,Math.min(30,v))};return n;});
  }
  async function saveCreatedCourse(){
    if(!ccName.trim())return;
    const holes=ccHoles.map(h=>({num:h.num,par:h.par,range:[h.rangeMin,Math.max(h.rangeMin,h.rangeMax)]}));
    await saveCoursetoDB({name:ccName.trim(),level:ccLevel,holes,tournament:ccTournament.trim()});
    setCreating(false);resetCreator();
  }

  // ─── Generate & Navigate ─────────────────────────────
  async function handleGenerate(diff){
    const existingNames=[...allCourses.map(c=>c.name),...PGA_2026.map(c=>c.name)];
    const course=generateCourse(diff,existingNames);
    await saveCoursetoDB(course);
    // Navigate to the course - it will appear via Firebase listener
    // Set up for play with a slight delay for Firebase
    const c={...course,generated:true};
    setSelCourse(c);setRoundPlayers([]);setAllScores({});
    setAllShotLogs({});setPlayMode("setup");setCurHole(0);
    setCurPlayerIdx(0);setHideScores(false);setTab("play");
  }

  // ─── PGA Course ──────────────────────────────────────
  function handlePGACourse(){
    const pga=getPGACourse();
    if(!pga){alert("No PGA Tour event this week! Check back during the season (Jan–Aug).");return;}
    const course={name:pga.name,level:pga.level,holes:pga.holes,pga:true,tournament:pga.tournament};
    setSelCourse(course);setRoundPlayers([]);setAllScores({});
    setAllShotLogs({});setPlayMode("setup");setCurHole(0);
    setCurPlayerIdx(0);setHideScores(false);setTab("play");
  }

  // ─── Play Functions ──────────────────────────────────
  function startRound(course){
    setSelCourse(course);setRoundPlayers([]);setAllScores({});
    setAllShotLogs({});setPlayMode("setup");setCurHole(0);
    setCurPlayerIdx(0);setHideScores(false);setTab("play");
  }
  function addToRound(name){
    if(!name||roundPlayers.includes(name))return;
    setRoundPlayers(p=>[...p,name]);
    setAllScores(s=>({...s,[name]:Array(18).fill(null)}));
    setAllShotLogs(s=>({...s,[name]:Array.from({length:18},()=>[])}));
  }
  function beginPlay(){
    if(!roundPlayers.length||!selCourse)return;
    setPlayMode("holes");setCurHole(0);setCurPlayerIdx(0);initHole();
  }
  function initHole(){
    const hs={};
    roundPlayers.forEach(p=>{hs[p]={shots:[],total:0,onGreen:false,putts:0,done:false,score:null,holeOut:false};});
    setHoleState(hs);setCurPlayerIdx(0);
  }

  function recordShot(player,value){
    setHoleState(prev=>{
      const ps={...prev[player]};const hole=selCourse.holes[curHole];
      if(ps.done)return prev;
      if(value==="HOLEOUT"){
        ps.holeOut=true;ps.done=true;
        ps.score=ps.shots.filter(s=>s.type==="slide"||s.type==="OB").length+1;
        ps.shots.push({type:"holeout",val:"Hole Out!"});
        return{...prev,[player]:ps};
      }
      if(ps.onGreen){
        if(value==="MADE"){
          ps.putts+=1;ps.shots.push({type:"putt",val:"Made"});ps.done=true;
          ps.score=ps.shots.filter(s=>s.type==="slide"||s.type==="OB").length+ps.putts;
        }else{ps.putts+=1;ps.shots.push({type:"putt",val:"Miss"});}
      }else{
        if(value==="OB"){
          ps.shots.push({type:"OB",val:0});
        }else{
          const num=parseInt(value);
          const isOver=ps.total>hole.range[1];
          if(isOver){
            ps.total-=num;
            ps.shots.push({type:"slide",val:num,dir:"sub"});
          }else{
            ps.total+=num;
            ps.shots.push({type:"slide",val:num,dir:"add"});
          }
          // Check if on green (within range inclusive)
          if(ps.total>=hole.range[0]&&ps.total<=hole.range[1]){
            ps.onGreen=true;
          }
        }
      }
      return{...prev,[player]:ps};
    });
  }

  function undoShot(player){
    setHoleState(prev=>{
      const ps={...prev[player]};
      if(!ps.shots.length||ps.done)return prev;
      const last=ps.shots.pop();
      if(last.type==="putt"){ps.putts-=1;}
      else if(last.type==="slide"){
        if(last.dir==="sub")ps.total+=last.val;
        else ps.total-=last.val;
        const hole=selCourse.holes[curHole];
        ps.onGreen=ps.total>=hole.range[0]&&ps.total<=hole.range[1];
      }
      // OB: just remove the shot entry, no total change
      return{...prev,[player]:ps};
    });
  }

  function finishHole(){
    setAllScores(prev=>{
      const ns={...prev};
      roundPlayers.forEach(p=>{
        const ps=holeState[p];ns[p]=[...(ns[p]||Array(18).fill(null))];
        ns[p][curHole]=ps.done?ps.score:(ps.shots.length>0?ps.shots.filter(s=>s.type==="slide"||s.type==="OB").length+(ps.onGreen?ps.putts:0):null);
      });return ns;
    });
    setAllShotLogs(prev=>{
      const ns={...prev};
      roundPlayers.forEach(p=>{ns[p]=[...(ns[p]||Array.from({length:18},()=>[]))];ns[p][curHole]=[...(holeState[p]?.shots||[])];});
      return ns;
    });
    if(curHole<17){setCurHole(curHole+1);initHole();}else setPlayMode("review");
  }

  async function saveRound(){
    const totalPar=selCourse.holes.reduce((s,h)=>s+h.par,0);
    for(const p of roundPlayers){
      const sc=allScores[p]||Array(18).fill(null);const total=sc.reduce((s,v)=>s+(v||0),0);
      const ho=(allShotLogs[p]||[]).filter(shots=>shots.some(s=>s.type==="holeout")).length;
      await saveRoundToDB({player:p,course:selCourse.name,courseLevel:selCourse.level,
        date:new Date().toISOString().split("T")[0],scores:sc,total,par:totalPar,
        holesPlayed:sc.filter(v=>v!==null).length,diff:total-totalPar,holeOuts:ho,hidden:hideScores});
    }
    setTab("leaderboard");
  }

  function setQuickScore(player,hole,val){
    setAllScores(s=>{const ns={...s};ns[player]=[...(ns[player]||Array(18).fill(null))];
      ns[player][hole]=val===""?null:Math.max(1,Math.min(15,parseInt(val)||null));return ns;});
  }

  // ─── Running Score Helper ────────────────────────────
  function getRunningScore(player){
    const sc=allScores[player]||Array(18).fill(null);
    const completed=sc.slice(0,curHole).reduce((s,v)=>s+(v||0),0);
    const curDone=holeState[player]?.done?holeState[player].score:0;
    const total=completed+curDone;
    const parThru=selCourse.holes.slice(0,curHole+(holeState[player]?.done?1:0)).reduce((s,h)=>s+h.par,0);
    return{total,par:parThru,diff:total-parThru};
  }

  if(!loaded)return<div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:C.greenLt,fontSize:18}}>Loading Slide Golf...</div></div>;

  // ─── PLAYER SELECT ───────────────────────────────────
  if(!me)return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.text}}>
      <div style={{background:C.headerBg,padding:"14px 20px",borderBottom:`2px solid ${C.green}`,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:34,height:34,borderRadius:"50%",background:C.accent,border:`2px solid ${C.greenLt}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>⛳</div>
        <div><div style={{fontWeight:700,fontSize:17,letterSpacing:2,textTransform:"uppercase"}}>Slide Golf</div><div style={{fontSize:10,color:C.muted,letterSpacing:1}}>LEAGUE TRACKER</div></div>
      </div>
      <div style={{maxWidth:400,margin:"0 auto",padding:24,display:"flex",flexDirection:"column",gap:16}}>
        <div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:22,fontWeight:700}}>Who are you?</div><div style={{color:C.muted,fontSize:13,marginTop:4}}>Pick your name to get started</div></div>
        {players.map(p=>(<button key={p.id} onClick={()=>selectMe(p.name)} style={{...btnS(false),width:"100%",padding:16,fontSize:16,textAlign:"center"}}>{p.name}</button>))}
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginTop:8}}>
          <div style={{fontSize:13,color:C.muted,marginBottom:8}}>New player?</div>
          <div style={{display:"flex",gap:8}}>
            <input value={newPlayerName} onChange={e=>setNewPlayerName(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&newPlayerName.trim()){addPlayerToDB(newPlayerName);setNewPlayerName("");}}}
              placeholder="Your name..." style={inputS}/>
            <button onClick={()=>{if(newPlayerName.trim()){addPlayerToDB(newPlayerName);setNewPlayerName("");}}} style={{...btnS(true),whiteSpace:"nowrap"}}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );

  const playerNames=players.map(p=>p.name);
  const playerStats=playerNames.map(name=>{
    const pr=rounds.filter(r=>r.player===name&&r.holesPlayed===18);
    const hcp=calcHandicap(pr);const best=pr.length?Math.min(...pr.map(r=>r.total)):null;
    const avg=pr.length?Math.round(pr.reduce((s,r)=>s+r.total,0)/pr.length*10)/10:null;
    const ho=rounds.filter(r=>r.player===name).reduce((s,r)=>s+(r.holeOuts||0),0);
    return{name,rounds:pr.length,handicap:hcp,best,avg,holeOuts:ho};
  }).sort((a,b)=>(a.handicap??999)-(b.handicap??999));

  const curPlayer=roundPlayers[curPlayerIdx];
  const curHS=holeState[curPlayer];
  const curHD=selCourse?.holes[curHole];
  const pgaThisWeek=getPGACourse();

  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.text}}>
      <div style={{background:C.headerBg,padding:"14px 20px",borderBottom:`2px solid ${C.green}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:34,height:34,borderRadius:"50%",background:C.accent,border:`2px solid ${C.greenLt}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>⛳</div>
          <div><div style={{fontWeight:700,fontSize:17,letterSpacing:2,textTransform:"uppercase"}}>Slide Golf</div><div style={{fontSize:10,color:C.muted,letterSpacing:1}}>LEAGUE TRACKER</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,color:C.greenLt}}>{me}</span>
          <button onClick={()=>{setMe("");try{localStorage.removeItem("sg-me");}catch(e){}}} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:10}}>Switch</button>
        </div>
      </div>

      <div style={{display:"flex",background:C.card,borderBottom:`1px solid ${C.border}`}}>
        {[["home","Home"],["courses","Courses"],["play","Play"],["leaderboard","Board"],["stats","Stats"]].map(([k,l])=>(
          <button key={k} onClick={()=>{setTab(k);if(k==="courses")setCreating(false);}} style={{
            flex:1,padding:"11px 6px",background:tab===k?C.accent:"transparent",color:tab===k?C.white:C.muted,
            border:"none",cursor:"pointer",fontSize:12,fontWeight:tab===k?700:400,
            borderBottom:tab===k?`2px solid ${C.greenLt}`:"2px solid transparent"
          }}>{l}</button>
        ))}
      </div>

      <div style={{maxWidth:600,margin:"0 auto",padding:16}}>

        {/* ═══ HOME ═══ */}
        {tab==="home"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:26,fontWeight:700,letterSpacing:3,textTransform:"uppercase"}}>Slide Golf</div><div style={{color:C.muted,marginTop:4,fontSize:13}}>League Scorecard & Tracker</div></div>
            <button onClick={()=>setTab("play")} style={{...btnS(true),padding:16,fontSize:16,width:"100%"}}>⛳ Start New Round</button>
            <button onClick={handlePGACourse} style={{...btnS(false),padding:14,fontSize:14,width:"100%",background:"linear-gradient(135deg,#1a2a4a,#2a3a5a)",border:`1px solid #3a5a8a`,color:C.blue}}>
              📺 {pgaThisWeek?`This Week: ${pgaThisWeek.tournament}`:"Get This Week's PGA Course"}
            </button>
            <button onClick={()=>{setCreating(true);resetCreator();setTab("courses");}} style={{...btnS(false),padding:14,fontSize:14,width:"100%",background:"linear-gradient(135deg,#1a3a2a,#2a4a3a)",border:`1px solid ${C.green}`}}>
              ✏️ Create a Course
            </button>
            <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
              <div style={{fontWeight:600,marginBottom:10,fontSize:14}}>🎲 Generate a Course</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {["Easy","Medium","Hard","Expert"].map(d=>(
                  <button key={d} onClick={()=>handleGenerate(d)} style={{padding:"12px",borderRadius:8,border:`1px solid ${C.border}`,cursor:"pointer",fontWeight:600,fontSize:13,
                    background:d==="Easy"?"rgba(74,170,74,0.15)":d==="Medium"?"rgba(212,184,74,0.15)":d==="Hard"?"rgba(239,68,68,0.15)":"rgba(138,68,239,0.15)",
                    color:d==="Easy"?C.greenLt:d==="Medium"?C.gold:d==="Hard"?C.red:"#b48af8"}}>
                    {d==="Easy"?"🟢":d==="Medium"?"🟡":d==="Hard"?"🔴":"💀"} {d}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={()=>setTab("leaderboard")} style={{...btnS(false),padding:14,fontSize:14,width:"100%"}}>🏆 Leaderboard</button>
            <div style={{background:C.card,borderRadius:12,padding:16,border:`1px solid ${C.border}`}}>
              <div style={{fontWeight:600,marginBottom:10}}>Quick Stats</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                {[[playerNames.length,"Players"],[rounds.length,"Rounds"],[allCourses.length,"Courses"]].map(([v,l])=>(
                  <div key={l} style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:700,color:C.greenLt}}>{v}</div><div style={{fontSize:10,color:C.muted}}>{l}</div></div>
                ))}
              </div>
            </div>
            {rounds.length>0&&(
              <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
                <div style={{fontWeight:600,marginBottom:8}}>Recent Rounds</div>
                {rounds.slice(0,5).map(r=>(
                  <div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
                    <div><span style={{fontWeight:600}}>{r.player}</span><span style={{color:C.muted,fontSize:11,marginLeft:8}}>{r.course}</span></div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      {r.hidden?<span style={{color:C.muted,fontSize:11}}>🙈</span>:<><span style={{fontWeight:700}}>{r.total}</span><RelPar s={r.total} p={r.par}/></>}
                      {(r.holeOuts||0)>0&&<span style={{fontSize:10,color:C.gold}}>🏌️{r.holeOuts}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ COURSES ═══ */}
        {tab==="courses"&&!creating&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
              <h2 style={{margin:0,fontSize:18}}>Courses</h2>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                <button onClick={()=>{setCreating(true);resetCreator();}} style={{...btnS(true),padding:"5px 10px",fontSize:10}}>✏️ Create</button>
                {["Easy","Medium","Hard","Expert"].map(d=>(
                  <button key={d} onClick={()=>handleGenerate(d)} style={{...btnS(false),padding:"5px 8px",fontSize:10,
                    color:d==="Easy"?C.greenLt:d==="Medium"?C.gold:d==="Hard"?C.red:"#b48af8"}}>+{d}</button>
                ))}
              </div>
            </div>
            {allCourses.map(c=>{
              const tp=c.holes.reduce((s,h)=>s+h.par,0);
              return(
                <div key={c.id} style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}>
                  <div style={{background:C.headerBg,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,textTransform:"uppercase",letterSpacing:1}}>{c.name}</div>
                      {c.tournament&&<div style={{fontSize:10,color:C.blue}}>{c.tournament}</div>}
                    </div>
                    <span style={{background:c.level==="Hard"?"#6a2222":c.level==="Medium"?"#5a4a1a":c.level==="Expert"?"#4a2a6a":C.green,padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600}}>{c.level}</span>
                  </div>
                  <div style={{padding:10,overflowX:"auto"}}>
                    {[0,9].map(start=>(
                      <table key={start} style={{width:"100%",borderCollapse:"collapse",fontSize:10,marginBottom:start===0?4:0,minWidth:460}}>
                        <thead><tr style={{background:C.accent}}>
                          <th style={{padding:"4px 6px",textAlign:"left",fontWeight:700,minWidth:44}}>HOLE</th>
                          {c.holes.slice(start,start+9).map(h=><th key={h.num} style={{padding:"4px 2px",textAlign:"center",minWidth:30}}>{h.num}</th>)}
                          <th style={{padding:"4px 4px",textAlign:"center",fontWeight:700,minWidth:42}}>{start===0?"OUT":"IN"}</th>
                          {start===9&&<th style={{padding:"4px 4px",textAlign:"center",fontWeight:700,minWidth:42}}>TOT</th>}
                        </tr></thead>
                        <tbody>
                          <tr style={{background:C.card2}}>
                            <td style={{padding:"3px 6px",fontWeight:600,color:C.greenLt,fontSize:9}}>RANGE</td>
                            {c.holes.slice(start,start+9).map(h=><td key={h.num} style={{padding:"2px 1px",textAlign:"center",fontSize:9,color:C.muted}}>{fmtR(h.range)}</td>)}
                            <td style={{textAlign:"center",fontSize:9,color:C.muted}}>{fmtRange(c.holes,start,start+9)}</td>
                            {start===9&&<td style={{textAlign:"center",fontSize:9,color:C.muted}}>{fmtRange(c.holes,0,18)}</td>}
                          </tr>
                          <tr>
                            <td style={{padding:"3px 6px",fontWeight:600}}>PAR</td>
                            {c.holes.slice(start,start+9).map(h=><td key={h.num} style={{padding:"2px",textAlign:"center"}}>{h.par}</td>)}
                            <td style={{textAlign:"center",fontWeight:700}}>{calcPar(c.holes,start,start+9)}</td>
                            {start===9&&<td style={{textAlign:"center",fontWeight:700,color:C.greenLt}}>{tp}</td>}
                          </tr>
                        </tbody>
                      </table>
                    ))}
                  </div>
                  <div style={{padding:"6px 10px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between"}}>
                    {c.generated?<button onClick={()=>deleteCourseFromDB(c.id)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:11}}>Remove</button>:<div/>}
                    <button onClick={()=>startRound(c)} style={{...btnS(true),padding:"6px 14px",fontSize:11}}>Play</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ COURSE CREATOR ═══ */}
        {tab==="courses"&&creating&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h2 style={{margin:0,fontSize:18}}>✏️ Create Course</h2>
              <button onClick={()=>setCreating(false)} style={{...btnS(false),padding:"4px 10px",fontSize:11}}>Cancel</button>
            </div>
            <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:10}}>
              <div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Course Name</div><input value={ccName} onChange={e=>setCcName(e.target.value)} placeholder="e.g. Pebble Beach Golf Links" style={inputS}/></div>
              <div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Tournament (optional)</div><input value={ccTournament} onChange={e=>setCcTournament(e.target.value)} placeholder="e.g. AT&T Pebble Beach Pro-Am" style={inputS}/></div>
              <div>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Difficulty</div>
                <div style={{display:"flex",gap:6}}>
                  {["Easy","Medium","Hard","Expert"].map(d=>(
                    <button key={d} onClick={()=>setCcLevel(d)} style={{flex:1,padding:"8px 4px",borderRadius:6,border:ccLevel===d?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:ccLevel===d?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:11,fontWeight:ccLevel===d?700:400}}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}>
              <div style={{display:"flex"}}>
                <button onClick={()=>setCcNine(0)} style={{flex:1,padding:10,background:ccNine===0?C.accent:"transparent",color:ccNine===0?C.white:C.muted,border:"none",cursor:"pointer",fontWeight:600,fontSize:12}}>Front 9</button>
                <button onClick={()=>setCcNine(1)} style={{flex:1,padding:10,background:ccNine===1?C.accent:"transparent",color:ccNine===1?C.white:C.muted,border:"none",cursor:"pointer",fontWeight:600,fontSize:12}}>Back 9</button>
              </div>
              <div style={{padding:10}}>
                {ccHoles.slice(ccNine*9,ccNine*9+9).map((h,i)=>{
                  const idx=ccNine*9+i;
                  return(
                    <div key={h.num} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div style={{width:36,fontWeight:700,fontSize:13,color:C.greenLt}}>#{h.num}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:9,color:C.muted,marginBottom:3}}>PAR</div>
                        <div style={{display:"flex",gap:4}}>
                          {[3,4,5].map(p=>(<button key={p} onClick={()=>setCcHolePar(idx,p)} style={{width:32,height:28,borderRadius:6,border:h.par===p?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:h.par===p?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:13,fontWeight:700}}>{p}</button>))}
                        </div>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:9,color:C.muted,marginBottom:3}}>RANGE</div>
                        <div style={{display:"flex",gap:4,alignItems:"center"}}>
                          <input value={h.rangeMin} onChange={e=>setCcHoleRange(idx,"rangeMin",e.target.value)} style={{...smallInput,width:40}}/>
                          <span style={{color:C.muted,fontSize:11}}>-</span>
                          <input value={h.rangeMax} onChange={e=>setCcHoleRange(idx,"rangeMax",e.target.value)} style={{...smallInput,width:40}}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,background:C.card2,display:"flex",justifyContent:"space-between",fontSize:12}}>
                <span style={{color:C.muted}}>{ccNine===0?"Front":"Back"} 9 Par: <strong style={{color:C.text}}>{ccHoles.slice(ccNine*9,ccNine*9+9).reduce((s,h)=>s+h.par,0)}</strong></span>
                <span style={{color:C.muted}}>Total Par: <strong style={{color:C.greenLt}}>{ccHoles.reduce((s,h)=>s+h.par,0)}</strong></span>
              </div>
            </div>
            <button onClick={saveCreatedCourse} disabled={!ccName.trim()} style={{...btnS(true),width:"100%",padding:14,fontSize:15,opacity:ccName.trim()?1:0.5,cursor:ccName.trim()?"pointer":"not-allowed"}}>💾 Save Course</button>
          </div>
        )}

        {/* ═══ PLAY ═══ */}
        {tab==="play"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {!selCourse&&(
              <>
                <h2 style={{margin:0,fontSize:18}}>Select Course</h2>
                {pgaThisWeek&&(
                  <button onClick={handlePGACourse} style={{...btnS(false),width:"100%",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(135deg,#1a2a4a,#2a3a5a)",border:`1px solid #3a5a8a`}}>
                    <span style={{fontWeight:600,color:C.blue}}>📺 {pgaThisWeek.tournament}</span>
                    <span style={{fontSize:11,opacity:0.7,color:C.blue}}>{pgaThisWeek.name}</span>
                  </button>
                )}
                {allCourses.map(c=>(
                  <button key={c.id} onClick={()=>{setSelCourse(c);setRoundPlayers([]);setAllScores({});setAllShotLogs({});setPlayMode("setup");}}
                    style={{...btnS(false),width:"100%",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontWeight:600}}>{c.name}</span>
                    <span style={{fontSize:11,opacity:0.7}}>Par {c.holes.reduce((s,h)=>s+h.par,0)} · {c.level}</span>
                  </button>
                ))}
              </>
            )}
            {selCourse&&playMode==="setup"&&(
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontWeight:700,fontSize:16}}>{selCourse.name}</div><div style={{fontSize:11,color:C.muted}}>{selCourse.tournament?`${selCourse.tournament} · `:""}Par {selCourse.holes.reduce((s,h)=>s+h.par,0)} · {selCourse.level}</div></div>
                  <button onClick={()=>setSelCourse(null)} style={{...btnS(false),padding:"4px 10px",fontSize:11}}>Change</button>
                </div>
                <div style={{background:C.card,borderRadius:12,padding:12,border:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontWeight:600,fontSize:13}}>🙈 Hidden Scores</div><div style={{fontSize:10,color:C.muted}}>Tournament play</div></div>
                  <button onClick={()=>setHideScores(h=>!h)} style={{width:48,height:26,borderRadius:13,border:"none",cursor:"pointer",position:"relative",background:hideScores?C.greenLt:C.card2,transition:"all 0.2s"}}>
                    <div style={{width:20,height:20,borderRadius:10,background:C.white,position:"absolute",top:3,left:hideScores?25:3,transition:"left 0.2s"}}/>
                  </button>
                </div>
                <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
                  <div style={{fontWeight:600,marginBottom:8}}>Players</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                    {roundPlayers.map(p=>(<span key={p} style={{background:C.accent,padding:"4px 10px",borderRadius:20,fontSize:12}}>{p} <span onClick={()=>setRoundPlayers(rp=>rp.filter(x=>x!==p))} style={{cursor:"pointer",opacity:0.6,marginLeft:4}}>×</span></span>))}
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {playerNames.filter(n=>!roundPlayers.includes(n)).map(n=>(
                      <button key={n} onClick={()=>addToRound(n)} style={{background:C.card2,border:`1px solid ${C.border}`,color:C.text,padding:"6px 12px",borderRadius:8,fontSize:12,cursor:"pointer"}}>{n}</button>
                    ))}
                  </div>
                </div>
                {roundPlayers.length>0&&(
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={beginPlay} style={{...btnS(true),flex:1,padding:14,fontSize:15}}>⛳ Shot-by-Shot</button>
                    <button onClick={()=>setPlayMode("quick")} style={{...btnS(false),padding:14,fontSize:12}}>Quick Score</button>
                  </div>
                )}
              </>
            )}

            {/* ═══ SHOT-BY-SHOT PLAY ═══ */}
            {selCourse&&playMode==="holes"&&curHD&&curHS&&(
              <>
                {/* Scorecard Overlay */}
                {showScorecard&&(
                  <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.greenLt}`,overflow:"hidden"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:C.accent}}>
                      <span style={{fontWeight:700,fontSize:13}}>📋 Full Scorecard</span>
                      <button onClick={()=>setShowScorecard(false)} style={{background:"transparent",border:"none",color:C.text,cursor:"pointer",fontSize:14}}>✕</button>
                    </div>
                    <div style={{overflowX:"auto",padding:6}}>
                      {[0,9].map(start=>(
                        <table key={start} style={{width:"100%",borderCollapse:"collapse",fontSize:9,marginBottom:start===0?4:0,minWidth:420}}>
                          <thead><tr style={{background:C.accent}}>
                            <th style={{padding:"3px 4px",textAlign:"left",minWidth:40}}>HOLE</th>
                            {selCourse.holes.slice(start,start+9).map(h=><th key={h.num} style={{padding:"3px 1px",textAlign:"center",minWidth:24,background:h.num-1===curHole?"rgba(74,170,74,0.3)":"transparent"}}>{h.num}</th>)}
                            <th style={{padding:"3px 3px",textAlign:"center",minWidth:30}}>{start===0?"OUT":"IN"}</th>
                            {start===9&&<th style={{padding:"3px 3px",textAlign:"center",minWidth:30}}>TOT</th>}
                          </tr></thead>
                          <tbody>
                            <tr style={{background:C.card2}}>
                              <td style={{padding:"2px 4px",fontWeight:600,color:C.greenLt,fontSize:8}}>RNG</td>
                              {selCourse.holes.slice(start,start+9).map(h=><td key={h.num} style={{textAlign:"center",fontSize:7,color:C.muted}}>{fmtR(h.range)}</td>)}
                              <td style={{textAlign:"center",fontSize:7,color:C.muted}}>{fmtRange(selCourse.holes,start,start+9)}</td>
                              {start===9&&<td style={{textAlign:"center",fontSize:7,color:C.muted}}>{fmtRange(selCourse.holes,0,18)}</td>}
                            </tr>
                            <tr>
                              <td style={{padding:"2px 4px",fontWeight:600,fontSize:9}}>PAR</td>
                              {selCourse.holes.slice(start,start+9).map(h=><td key={h.num} style={{textAlign:"center",padding:"2px 1px"}}>{h.par}</td>)}
                              <td style={{textAlign:"center",fontWeight:700}}>{calcPar(selCourse.holes,start,start+9)}</td>
                              {start===9&&<td style={{textAlign:"center",fontWeight:700,color:C.greenLt}}>{selCourse.holes.reduce((s,h)=>s+h.par,0)}</td>}
                            </tr>
                            {!hideScores&&roundPlayers.map(p=>{
                              const sc=allScores[p]||Array(18).fill(null);
                              const ns=sc.slice(start,start+9);const tot=ns.reduce((s,v)=>s+(v||0),0);
                              return(<tr key={p} style={{borderTop:`1px solid ${C.border}`}}>
                                <td style={{padding:"2px 4px",fontWeight:600,fontSize:8}}>{p}</td>
                                {selCourse.holes.slice(start,start+9).map((h,i)=>{const idx=start+i;const v=sc[idx];
                                  const un=v!==null&&v<h.par;const ov=v!==null&&v>h.par;
                                  return<td key={h.num} style={{textAlign:"center",fontSize:9,fontWeight:700,color:un?C.greenLt:ov?"#ff6b6b":v!==null?C.text:C.muted,background:h.num-1===curHole?"rgba(74,170,74,0.1)":"transparent"}}>{v??"-"}</td>;
                                })}
                                <td style={{textAlign:"center",fontWeight:700,fontSize:9}}>{tot>0?tot:"-"}</td>
                                {start===9&&<td style={{textAlign:"center",fontWeight:700,fontSize:9,color:C.greenLt}}>{(sc.reduce((s,v)=>s+(v||0),0))||"-"}</td>}
                              </tr>);
                            })}
                          </tbody>
                        </table>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hole Info */}
                <div style={{background:`linear-gradient(135deg,${C.accent},${C.card})`,borderRadius:12,padding:14,border:`1px solid ${C.border}`,textAlign:"center"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <button onClick={()=>setShowScorecard(s=>!s)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:10}}>📋 Card</button>
                    <div>
                      <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:2}}>Hole {curHD.num} of 18</div>
                      <div style={{fontSize:28,fontWeight:700,margin:"4px 0"}}>Par {curHD.par}</div>
                      <div style={{fontSize:14,color:C.greenLt,fontWeight:600}}>Range: {fmtR(curHD.range)}</div>
                    </div>
                    <div style={{minWidth:50}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"center",gap:3,marginTop:8}}>
                    {Array.from({length:18}).map((_,i)=><div key={i} style={{width:i===curHole?10:5,height:5,borderRadius:3,background:i<curHole?C.greenLt:i===curHole?C.gold:C.border}}/>)}
                  </div>
                </div>

                {/* Running Scores */}
                {!hideScores&&(
                  <div style={{display:"flex",gap:6,overflowX:"auto"}}>
                    {roundPlayers.map(p=>{const rs=getRunningScore(p);
                      return<div key={p} style={{flex:1,background:C.card,borderRadius:8,padding:"6px 8px",border:`1px solid ${C.border}`,textAlign:"center",minWidth:70}}>
                        <div style={{fontSize:10,color:C.muted,fontWeight:600}}>{p}</div>
                        <div style={{fontSize:18,fontWeight:700}}>{rs.total}</div>
                        <RelPar s={rs.total} p={rs.par}/>
                      </div>;
                    })}
                  </div>
                )}

                {/* Player Tabs */}
                <div style={{display:"flex",gap:4,overflowX:"auto"}}>
                  {roundPlayers.map((p,i)=>{const hs=holeState[p];return(
                    <button key={p} onClick={()=>setCurPlayerIdx(i)} style={{padding:"8px 14px",borderRadius:8,border:i===curPlayerIdx?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:i===curPlayerIdx?C.accent:C.card,color:C.text,cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>
                      {p}{hs?.done&&<span style={{marginLeft:4,color:hs?.holeOut?C.gold:C.greenLt}}>{hs?.holeOut?"🏌️":"✓"}</span>}
                    </button>
                  );})}
                </div>

                {/* Shot Area */}
                <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
                  <div style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                      <span style={{color:C.muted}}>
                        Slide Total {curHS.total>curHD.range[1]&&<span style={{color:C.red,fontWeight:700}}> — OVER! (shots subtract)</span>}
                      </span>
                      <span style={{fontWeight:700,fontSize:16,color:curHS.onGreen?C.greenLt:curHS.total>curHD.range[1]?C.red:C.text}}>{curHS.total}</span>
                    </div>
                    <div style={{background:C.card2,borderRadius:8,height:12,overflow:"hidden",position:"relative"}}>
                      <div style={{height:"100%",borderRadius:8,transition:"width 0.3s",
                        background:curHS.onGreen?`linear-gradient(90deg,${C.green},${C.greenLt})`:
                          curHS.total>curHD.range[1]?`linear-gradient(90deg,#ef4444,#dc2626)`:
                          `linear-gradient(90deg,${C.accent},${C.green})`,
                        width:`${Math.min(100,(curHS.total/Math.max(curHD.range[1]+3,1))*100)}%`}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.muted,marginTop:2}}><span>0</span><span>Target: {fmtR(curHD.range)}</span></div>
                  </div>

                  {curHS.done?(
                    <div style={{textAlign:"center",padding:"16px 0"}}>
                      {curHS.holeOut&&<div style={{fontSize:14,color:C.gold,fontWeight:700,marginBottom:4}}>🏌️ HOLE OUT!</div>}
                      {(()=>{const sn=scoreName(curHS.score,curHD.par);return<>
                        <div style={{fontSize:36,fontWeight:700}}>{curHS.score}</div>
                        <div style={{fontSize:18,fontWeight:700,color:sn.color,marginTop:4}}>{sn.emoji} {sn.label}</div>
                      </>;})()}
                    </div>
                  ):curHS.onGreen?(
                    <div>
                      <div style={{textAlign:"center",marginBottom:12}}><div style={{color:C.greenLt,fontWeight:700,fontSize:14}}>On the Green!</div><div style={{color:C.muted,fontSize:11}}>Total: {curHS.total} · Putts: {curHS.putts}</div></div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>recordShot(curPlayer,"MISS")} style={{...btnS(false),flex:1,padding:14,fontSize:14}}>Miss</button>
                        <button onClick={()=>recordShot(curPlayer,"MADE")} style={{...btnS(true),flex:1,padding:14,fontSize:14,background:`linear-gradient(135deg,${C.greenLt},${C.green})`}}>Made It! ⛳</button>
                      </div>
                    </div>
                  ):(
                    <div>
                      <div style={{textAlign:"center",marginBottom:8,fontSize:11,color:curHS.total>curHD.range[1]?C.red:C.muted}}>
                        {curHS.total>curHD.range[1]?
                          `OVER by ${curHS.total-curHD.range[1]} — shots now subtract! Need ${curHS.total-curHD.range[1]} to ${curHS.total-curHD.range[0]} to land on green`:
                          `Shots: ${curHS.shots.filter(s=>s.type!=="OB").length} · Need ${Math.max(0,curHD.range[0]-curHS.total)} more`
                        }
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:8}}>
                        {[1,2,3,4,5,6,7,8,9].map(n=>(<button key={n} onClick={()=>recordShot(curPlayer,n)} style={{padding:"14px 0",borderRadius:10,border:`2px solid ${curHS.total>curHD.range[1]?"rgba(239,68,68,0.4)":C.border}`,background:curHS.total>curHD.range[1]?"rgba(239,68,68,0.08)":C.card2,color:C.text,fontSize:20,fontWeight:700,cursor:"pointer"}}>
                          {curHS.total>curHD.range[1]?`-${n}`:n}
                        </button>))}
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>recordShot(curPlayer,"OB")} style={{...btnS(false),flex:1,padding:10,fontSize:12,background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.4)",color:C.red}}>💧 OB / Water</button>
                        <button onClick={()=>recordShot(curPlayer,"HOLEOUT")} style={{...btnS(false),flex:1,padding:10,fontSize:12,background:"rgba(212,184,74,0.15)",border:"1px solid rgba(212,184,74,0.5)",color:C.gold}}>🏌️ Hole Out!</button>
                      </div>
                    </div>
                  )}
                  {curHS.shots.length>0&&(
                    <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:10,color:C.muted}}>Shot Log</span>{!curHS.done&&<button onClick={()=>undoShot(curPlayer)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:11}}>↩ Undo</button>}</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>
                        {curHS.shots.map((s,i)=>(<span key={i} style={{padding:"3px 8px",borderRadius:6,fontSize:11,fontWeight:600,
                          background:s.type==="OB"?"rgba(239,68,68,0.2)":s.type==="putt"?"rgba(74,170,74,0.2)":s.type==="holeout"?"rgba(212,184,74,0.25)":s.dir==="sub"?"rgba(239,68,68,0.15)":C.card2,
                          color:s.type==="OB"?C.red:s.type==="putt"?C.greenLt:s.type==="holeout"?C.gold:s.dir==="sub"?C.red:C.text}}>
                          {s.type==="OB"?"OB":s.type==="putt"?`Putt: ${s.val}`:s.type==="holeout"?"🏌️ Hole Out!":s.dir==="sub"?`-${s.val}`:s.val}
                        </span>))}
                      </div>
                    </div>
                  )}
                </div>

                {hideScores&&roundPlayers.length>1&&<div style={{background:C.card,borderRadius:8,padding:10,border:`1px solid ${C.border}`,textAlign:"center",fontSize:12,color:C.muted}}>🙈 Hidden scores mode</div>}
                {roundPlayers.every(p=>holeState[p]?.done)?(<button onClick={finishHole} style={{...btnS(true),width:"100%",padding:14,fontSize:15}}>{curHole<17?`→ Hole ${curHole+2}`:"Finish Round →"}</button>):(<button onClick={finishHole} style={{...btnS(false),width:"100%",padding:10,fontSize:12,color:C.muted}}>Skip to {curHole<17?`Hole ${curHole+2}`:"Review"}</button>)}
              </>
            )}

            {/* ═══ QUICK SCORE ═══ */}
            {selCourse&&playMode==="quick"&&(
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontWeight:700,fontSize:16}}>{selCourse.name}</div><div style={{fontSize:11,color:C.muted}}>Quick Score</div></div>
                  <button onClick={()=>setPlayMode("setup")} style={{...btnS(false),padding:"4px 10px",fontSize:11}}>Back</button>
                </div>
                <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}>
                  <div style={{display:"flex"}}>
                    <button onClick={()=>setNine(0)} style={{flex:1,padding:10,background:nine===0?C.accent:"transparent",color:nine===0?C.white:C.muted,border:"none",cursor:"pointer",fontWeight:600,fontSize:12}}>Front 9</button>
                    <button onClick={()=>setNine(1)} style={{flex:1,padding:10,background:nine===1?C.accent:"transparent",color:nine===1?C.white:C.muted,border:"none",cursor:"pointer",fontWeight:600,fontSize:12}}>Back 9</button>
                  </div>
                  <div style={{overflowX:"auto",padding:8}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:420}}>
                      <thead><tr style={{background:C.accent}}>
                        <th style={{padding:"5px 6px",textAlign:"left",position:"sticky",left:0,background:C.accent,zIndex:1,minWidth:50}}>Hole</th>
                        {selCourse.holes.slice(nine*9,nine*9+9).map(h=><th key={h.num} style={{padding:"5px 2px",textAlign:"center",minWidth:30}}>{h.num}</th>)}
                        <th style={{padding:"5px 4px",textAlign:"center",minWidth:34}}>{nine===0?"OUT":"IN"}</th>
                      </tr></thead>
                      <tbody>
                        <tr style={{background:C.card2}}>
                          <td style={{padding:"3px 6px",fontWeight:600,fontSize:9,color:C.greenLt,position:"sticky",left:0,background:C.card2}}>RNG</td>
                          {selCourse.holes.slice(nine*9,nine*9+9).map(h=><td key={h.num} style={{textAlign:"center",fontSize:8,color:C.muted}}>{fmtR(h.range)}</td>)}<td/>
                        </tr>
                        <tr>
                          <td style={{padding:"3px 6px",fontWeight:600,position:"sticky",left:0,background:C.card}}>PAR</td>
                          {selCourse.holes.slice(nine*9,nine*9+9).map(h=><td key={h.num} style={{textAlign:"center",padding:"3px 2px"}}>{h.par}</td>)}
                          <td style={{textAlign:"center",fontWeight:700}}>{calcPar(selCourse.holes,nine*9,nine*9+9)}</td>
                        </tr>
                        {roundPlayers.map(p=>{const sc=allScores[p]||Array(18).fill(null);const ns=sc.slice(nine*9,nine*9+9);const tot=ns.reduce((s,v)=>s+(v||0),0);
                          return(<tr key={p} style={{borderTop:`1px solid ${C.border}`}}>
                            <td style={{padding:"4px 6px",fontWeight:600,fontSize:10,position:"sticky",left:0,background:C.card}}>{p}</td>
                            {selCourse.holes.slice(nine*9,nine*9+9).map((h,i)=>{const idx=nine*9+i;const v=sc[idx];const un=v!==null&&v<h.par;const ov=v!==null&&v>h.par;
                              return<td key={h.num} style={{textAlign:"center",padding:"2px 1px"}}><input value={v??""} onChange={e=>setQuickScore(p,idx,e.target.value)} style={{width:26,height:26,textAlign:"center",padding:0,fontSize:12,fontWeight:700,outline:"none",background:un?"transparent":ov?"rgba(239,68,68,0.15)":"transparent",border:un?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,borderRadius:un?"50%":4,color:un?C.greenLt:ov?"#ff6b6b":C.text}}/></td>;})}
                            <td style={{textAlign:"center",fontWeight:700,fontSize:12}}>{tot>0&&<>{tot} <RelPar s={tot} p={calcPar(selCourse.holes,nine*9,nine*9+9)}/></>}</td>
                          </tr>);})}
                      </tbody>
                    </table>
                  </div>
                </div>
                <button onClick={saveRound} style={{...btnS(true),width:"100%",padding:14,fontSize:15}}>✓ Finish & Save</button>
              </>
            )}

            {/* ═══ REVIEW ═══ */}
            {selCourse&&playMode==="review"&&(
              <>
                <div style={{textAlign:"center",padding:"16px 0"}}><div style={{fontSize:22,fontWeight:700}}>Round Complete!</div><div style={{color:C.muted}}>{selCourse.name}</div></div>
                {roundPlayers.map(p=>{const sc=allScores[p]||Array(18).fill(null);const t=sc.reduce((s,v)=>s+(v||0),0);const tp=selCourse.holes.reduce((s,h)=>s+h.par,0);const ho=(allShotLogs[p]||[]).filter(shots=>shots.some(s=>s.type==="holeout")).length;
                  return(<div key={p} style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><span style={{fontWeight:700,fontSize:16}}>{p}</span>{ho>0&&<span style={{fontSize:11,color:C.gold,marginLeft:8}}>🏌️ {ho}</span>}</div>
                    <div style={{textAlign:"right"}}>{hideScores?<div style={{color:C.muted}}>🙈 Hidden</div>:<><div style={{fontSize:28,fontWeight:700}}>{t}</div><RelPar s={t} p={tp}/></>}</div>
                  </div>);})}
                <button onClick={saveRound} style={{...btnS(true),width:"100%",padding:14,fontSize:15}}>💾 Save Round</button>
              </>
            )}
          </div>
        )}

        {/* ═══ LEADERBOARD ═══ */}
        {tab==="leaderboard"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <h2 style={{margin:0,fontSize:18}}>🏆 Leaderboard</h2>
            {playerStats.length===0?<div style={{textAlign:"center",padding:40,color:C.muted}}>No rounds yet!</div>:(
              <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr style={{background:C.accent}}>
                    <th style={{padding:"10px 8px",textAlign:"left"}}>#</th><th style={{padding:"10px 6px",textAlign:"left"}}>Player</th>
                    <th style={{padding:"10px 6px",textAlign:"center"}}>HCP</th><th style={{padding:"10px 6px",textAlign:"center"}}>Avg</th>
                    <th style={{padding:"10px 6px",textAlign:"center"}}>Best</th><th style={{padding:"10px 6px",textAlign:"center"}}>Rnds</th>
                    <th style={{padding:"10px 6px",textAlign:"center"}}>🏌️</th>
                  </tr></thead>
                  <tbody>{playerStats.map((p,i)=>(
                    <tr key={p.name} style={{borderTop:`1px solid ${C.border}`,background:i===0&&p.rounds>0?"rgba(212,184,74,0.08)":"transparent"}}>
                      <td style={{padding:"10px 8px",fontWeight:700,color:i===0?C.gold:C.muted}}>{i+1}</td>
                      <td style={{padding:"10px 6px",fontWeight:600}}>{p.name}</td>
                      <td style={{padding:"10px 6px",textAlign:"center",fontWeight:700,color:p.handicap!=null?(p.handicap<=0?C.greenLt:"#ff6b6b"):C.muted}}>{p.handicap!=null?(p.handicap>0?`+${p.handicap}`:p.handicap):"—"}</td>
                      <td style={{padding:"10px 6px",textAlign:"center"}}>{p.avg??"—"}</td>
                      <td style={{padding:"10px 6px",textAlign:"center",color:C.greenLt}}>{p.best??"—"}</td>
                      <td style={{padding:"10px 6px",textAlign:"center",color:C.muted}}>{p.rounds}</td>
                      <td style={{padding:"10px 6px",textAlign:"center",color:C.gold}}>{p.holeOuts||0}</td>
                    </tr>))}</tbody>
                </table>
              </div>
            )}
            {rounds.length>0&&(
              <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
                <div style={{fontWeight:600,marginBottom:10}}>All Rounds</div>
                {rounds.map(r=>(
                  <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
                    <div><div style={{fontWeight:600}}>{r.player}</div><div style={{fontSize:10,color:C.muted}}>{r.course} · {r.date}</div></div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      {r.hidden?<span style={{color:C.muted}}>🙈</span>:<><span style={{fontWeight:700,fontSize:15}}>{r.total}</span><RelPar s={r.total} p={r.par}/></>}
                      {(r.holeOuts||0)>0&&<span style={{fontSize:10,color:C.gold}}>🏌️{r.holeOuts}</span>}
                      <button onClick={()=>deleteRoundFromDB(r.id)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:13}}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ STATS ═══ */}
        {tab==="stats"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <h2 style={{margin:0,fontSize:18}}>Player Stats</h2>
            {playerStats.length===0?<div style={{textAlign:"center",padding:40,color:C.muted}}>No players yet.</div>:
            playerStats.map(p=>{const pr=rounds.filter(r=>r.player===p.name);
              return(<div key={p.name} style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,padding:14}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:10}}>{p.name}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:6}}>
                  {[["HCP",p.handicap!=null?(p.handicap>0?`+${p.handicap}`:p.handicap):"—"],["Rnds",p.rounds],["Best",p.best??"—"],["Avg",p.avg??"—"],["🏌️",p.holeOuts]].map(([l,v])=>(
                    <div key={l} style={{background:C.card2,borderRadius:8,padding:6,textAlign:"center"}}><div style={{fontSize:15,fontWeight:700,color:C.greenLt}}>{v}</div><div style={{fontSize:9,color:C.muted}}>{l}</div></div>
                  ))}
                </div>
                {pr.length>0&&(<div style={{marginTop:10}}><div style={{fontSize:11,fontWeight:600,marginBottom:4}}>History</div>
                  {pr.slice(0,10).map(r=>(<div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:11,borderBottom:`1px solid ${C.border}`}}>
                    <span style={{color:C.muted}}>{r.date} · {r.course}</span>
                    <span>{r.hidden?"🙈":<><strong>{r.total}</strong> <RelPar s={r.total} p={r.par}/></>} {(r.holeOuts||0)>0&&<span style={{color:C.gold}}>🏌️{r.holeOuts}</span>}</span>
                  </div>))}</div>)}
              </div>);})}
          </div>
        )}
      </div>
      <div style={{textAlign:"center",padding:"20px 16px 14px",borderTop:`1px dashed ${C.border}`,marginTop:20}}><span style={{color:C.muted,fontSize:10,letterSpacing:3,textTransform:"uppercase"}}>· · · Slide Golf · · ·</span></div>
    </div>
  );
}
