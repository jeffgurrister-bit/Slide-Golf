import { useState, useEffect } from "react";
import { db } from "./firebase.js";
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, updateDoc, where, getDocs, getDoc
} from "firebase/firestore";

// ─── PERMANENT COURSES ──────────────────────────────────
const COURSES = [
  {id:"tpc-scottsdale",name:"TPC Scottsdale Stadium",level:"Hard",holes:[{num:1,par:4,range:[10,10]},{num:2,par:4,range:[12,12]},{num:3,par:5,range:[15,16]},{num:4,par:3,range:[4,4]},{num:5,par:4,range:[14,14]},{num:6,par:4,range:[11,11]},{num:7,par:3,range:[6,6]},{num:8,par:4,range:[14,15]},{num:9,par:4,range:[11,13]},{num:10,par:4,range:[10,11]},{num:11,par:4,range:[13,13]},{num:12,par:3,range:[5,5]},{num:13,par:5,range:[16,18]},{num:14,par:4,range:[15,16]},{num:15,par:5,range:[17,18]},{num:16,par:3,range:[3,3]},{num:17,par:4,range:[9,9]},{num:18,par:4,range:[13,14]}]},
  {id:"nebraska",name:"Nebraska",level:"Hard",holes:[{num:1,par:5,range:[17,19]},{num:2,par:4,range:[11,12]},{num:3,par:4,range:[13,13]},{num:4,par:3,range:[4,4]},{num:5,par:4,range:[8,9]},{num:6,par:3,range:[5,5]},{num:7,par:4,range:[12,14]},{num:8,par:4,range:[10,12]},{num:9,par:5,range:[20,21]},{num:10,par:5,range:[16,16]},{num:11,par:3,range:[6,6]},{num:12,par:4,range:[14,15]},{num:13,par:4,range:[11,13]},{num:14,par:4,range:[13,15]},{num:15,par:3,range:[7,7]},{num:16,par:4,range:[12,12]},{num:17,par:4,range:[15,15]},{num:18,par:5,range:[17,17]}]},
  {id:"maitland-palms",name:"Maitland Palms",level:"Medium",holes:[{num:1,par:4,range:[15,16]},{num:2,par:4,range:[10,10]},{num:3,par:3,range:[4,4]},{num:4,par:4,range:[11,12]},{num:5,par:4,range:[13,15]},{num:6,par:5,range:[18,19]},{num:7,par:4,range:[8,9]},{num:8,par:3,range:[3,3]},{num:9,par:5,range:[16,16]},{num:10,par:4,range:[12,13]},{num:11,par:5,range:[17,19]},{num:12,par:4,range:[13,15]},{num:13,par:3,range:[2,2]},{num:14,par:4,range:[10,11]},{num:15,par:5,range:[15,15]},{num:16,par:3,range:[8,8]},{num:17,par:4,range:[13,13]},{num:18,par:4,range:[11,11]}]},
  {id:"lanfear-oaks",name:"Lanfear Oaks",level:"Medium",holes:[{num:1,par:5,range:[18,18]},{num:2,par:4,range:[10,12]},{num:3,par:4,range:[13,14]},{num:4,par:3,range:[5,5]},{num:5,par:5,range:[17,19]},{num:6,par:4,range:[11,13]},{num:7,par:3,range:[3,3]},{num:8,par:4,range:[12,13]},{num:9,par:4,range:[11,11]},{num:10,par:3,range:[4,4]},{num:11,par:4,range:[10,11]},{num:12,par:4,range:[13,13]},{num:13,par:5,range:[18,20]},{num:14,par:3,range:[6,6]},{num:15,par:4,range:[10,10]},{num:16,par:4,range:[11,14]},{num:17,par:4,range:[12,12]},{num:18,par:5,range:[17,19]}]},
  {id:"orland-national",name:"Orland National",level:"Easy",holes:[{num:1,par:4,range:[10,12]},{num:2,par:5,range:[14,16]},{num:3,par:4,range:[12,14]},{num:4,par:4,range:[13,16]},{num:5,par:3,range:[5,5]},{num:6,par:4,range:[8,10]},{num:7,par:4,range:[12,12]},{num:8,par:5,range:[15,17]},{num:9,par:3,range:[2,2]},{num:10,par:4,range:[11,14]},{num:11,par:3,range:[3,3]},{num:12,par:5,range:[16,19]},{num:13,par:4,range:[10,11]},{num:14,par:5,range:[15,16]},{num:15,par:4,range:[9,10]},{num:16,par:3,range:[4,4]},{num:17,par:4,range:[12,14]},{num:18,par:4,range:[13,14]}]}
];

// ─── PGA TOUR 2026 ──────────────────────────────────────
const PGA_2026=[
  {start:"2026-01-12",end:"2026-01-18",tournament:"Sony Open in Hawaii",name:"Waialae Country Club",level:"Hard",holes:[{num:1,par:4,range:[12,13]},{num:2,par:5,range:[16,17]},{num:3,par:3,range:[5,6]},{num:4,par:4,range:[10,12]},{num:5,par:4,range:[13,14]},{num:6,par:4,range:[11,11]},{num:7,par:4,range:[10,10]},{num:8,par:3,range:[6,7]},{num:9,par:5,range:[17,18]},{num:10,par:4,range:[13,13]},{num:11,par:4,range:[11,12]},{num:12,par:3,range:[4,4]},{num:13,par:5,range:[16,16]},{num:14,par:4,range:[12,14]},{num:15,par:4,range:[13,13]},{num:16,par:3,range:[6,6]},{num:17,par:4,range:[11,12]},{num:18,par:4,range:[10,11]}]},
  {start:"2026-01-19",end:"2026-01-25",tournament:"The American Express",name:"PGA West (Stadium Course)",level:"Hard",holes:[{num:1,par:4,range:[11,12]},{num:2,par:4,range:[13,14]},{num:3,par:3,range:[6,6]},{num:4,par:4,range:[12,14]},{num:5,par:4,range:[14,15]},{num:6,par:5,range:[17,18]},{num:7,par:4,range:[10,10]},{num:8,par:3,range:[4,4]},{num:9,par:5,range:[18,19]},{num:10,par:4,range:[13,13]},{num:11,par:5,range:[16,17]},{num:12,par:4,range:[11,12]},{num:13,par:3,range:[5,5]},{num:14,par:4,range:[12,12]},{num:15,par:4,range:[14,14]},{num:16,par:3,range:[7,7]},{num:17,par:5,range:[17,17]},{num:18,par:4,range:[13,14]}]},
  {start:"2026-01-26",end:"2026-02-01",tournament:"Farmers Insurance Open",name:"Torrey Pines (South)",level:"Hard",holes:[{num:1,par:4,range:[13,14]},{num:2,par:4,range:[12,12]},{num:3,par:3,range:[7,8]},{num:4,par:4,range:[14,15]},{num:5,par:5,range:[17,18]},{num:6,par:4,range:[15,15]},{num:7,par:4,range:[11,12]},{num:8,par:3,range:[5,6]},{num:9,par:5,range:[18,19]},{num:10,par:4,range:[13,14]},{num:11,par:3,range:[6,6]},{num:12,par:4,range:[15,15]},{num:13,par:5,range:[18,18]},{num:14,par:4,range:[11,12]},{num:15,par:4,range:[12,13]},{num:16,par:3,range:[4,5]},{num:17,par:4,range:[13,13]},{num:18,par:5,range:[17,18]}]},
  {start:"2026-02-02",end:"2026-02-08",tournament:"WM Phoenix Open",name:"TPC Scottsdale (Stadium)",level:"Hard",holes:[{num:1,par:4,range:[10,11]},{num:2,par:4,range:[12,12]},{num:3,par:5,range:[16,17]},{num:4,par:3,range:[4,4]},{num:5,par:4,range:[14,14]},{num:6,par:4,range:[11,11]},{num:7,par:3,range:[6,6]},{num:8,par:4,range:[14,15]},{num:9,par:4,range:[12,13]},{num:10,par:4,range:[10,11]},{num:11,par:4,range:[13,13]},{num:12,par:3,range:[5,5]},{num:13,par:5,range:[17,18]},{num:14,par:4,range:[15,16]},{num:15,par:5,range:[17,18]},{num:16,par:3,range:[3,3]},{num:17,par:4,range:[9,9]},{num:18,par:4,range:[13,14]}]},
  {start:"2026-02-09",end:"2026-02-15",tournament:"AT&T Pebble Beach Pro-Am",name:"Pebble Beach Golf Links",level:"Hard",holes:[{num:1,par:4,range:[10,11]},{num:2,par:5,range:[15,16]},{num:3,par:4,range:[11,13]},{num:4,par:4,range:[8,10]},{num:5,par:3,range:[5,6]},{num:6,par:5,range:[16,16]},{num:7,par:3,range:[3,3]},{num:8,par:4,range:[13,13]},{num:9,par:4,range:[15,15]},{num:10,par:4,range:[13,14]},{num:11,par:4,range:[11,11]},{num:12,par:3,range:[6,7]},{num:13,par:4,range:[13,14]},{num:14,par:5,range:[19,19]},{num:15,par:4,range:[11,13]},{num:16,par:4,range:[12,13]},{num:17,par:3,range:[5,5]},{num:18,par:5,range:[17,18]}]},
  {start:"2026-02-16",end:"2026-02-22",tournament:"The Genesis Invitational",name:"Riviera Country Club",level:"Hard",holes:[{num:1,par:5,range:[16,17]},{num:2,par:4,range:[12,12]},{num:3,par:4,range:[13,14]},{num:4,par:3,range:[7,7]},{num:5,par:4,range:[11,12]},{num:6,par:3,range:[5,5]},{num:7,par:4,range:[14,14]},{num:8,par:4,range:[13,13]},{num:9,par:4,range:[12,13]},{num:10,par:4,range:[15,15]},{num:11,par:5,range:[17,18]},{num:12,par:4,range:[12,13]},{num:13,par:4,range:[11,11]},{num:14,par:3,range:[4,4]},{num:15,par:4,range:[13,14]},{num:16,par:3,range:[6,6]},{num:17,par:5,range:[17,17]},{num:18,par:4,range:[14,14]}]},
  {start:"2026-02-23",end:"2026-03-01",tournament:"Cognizant Classic",name:"PGA National (Champion)",level:"Hard",holes:[{num:1,par:4,range:[12,13]},{num:2,par:5,range:[17,18]},{num:3,par:4,range:[13,13]},{num:4,par:3,range:[5,6]},{num:5,par:4,range:[11,12]},{num:6,par:4,range:[14,14]},{num:7,par:3,range:[6,6]},{num:8,par:4,range:[12,13]},{num:9,par:5,range:[16,17]},{num:10,par:4,range:[13,14]},{num:11,par:4,range:[11,12]},{num:12,par:3,range:[4,4]},{num:13,par:4,range:[12,12]},{num:14,par:4,range:[11,11]},{num:15,par:3,range:[7,7]},{num:16,par:4,range:[14,14]},{num:17,par:4,range:[13,13]},{num:18,par:5,range:[18,18]}]},
  {start:"2026-03-02",end:"2026-03-08",tournament:"Arnold Palmer Invitational",name:"Bay Hill Club & Lodge",level:"Hard",holes:[{num:1,par:4,range:[13,14]},{num:2,par:5,range:[17,18]},{num:3,par:4,range:[11,12]},{num:4,par:3,range:[6,7]},{num:5,par:4,range:[12,13]},{num:6,par:5,range:[18,18]},{num:7,par:4,range:[13,13]},{num:8,par:3,range:[5,5]},{num:9,par:4,range:[14,14]},{num:10,par:4,range:[12,13]},{num:11,par:4,range:[13,14]},{num:12,par:5,range:[17,18]},{num:13,par:3,range:[4,4]},{num:14,par:4,range:[12,12]},{num:15,par:4,range:[11,12]},{num:16,par:5,range:[16,17]},{num:17,par:3,range:[7,7]},{num:18,par:4,range:[14,14]}]},
  {start:"2026-03-09",end:"2026-03-15",tournament:"THE PLAYERS Championship",name:"TPC Sawgrass (Stadium)",level:"Hard",holes:[{num:1,par:4,range:[12,13]},{num:2,par:5,range:[17,18]},{num:3,par:3,range:[5,6]},{num:4,par:4,range:[12,12]},{num:5,par:4,range:[11,12]},{num:6,par:4,range:[13,13]},{num:7,par:4,range:[14,14]},{num:8,par:3,range:[6,6]},{num:9,par:5,range:[17,17]},{num:10,par:4,range:[13,14]},{num:11,par:5,range:[18,18]},{num:12,par:4,range:[11,12]},{num:13,par:3,range:[5,5]},{num:14,par:4,range:[13,13]},{num:15,par:4,range:[12,13]},{num:16,par:5,range:[16,17]},{num:17,par:3,range:[3,3]},{num:18,par:4,range:[14,14]}]},
  {start:"2026-03-16",end:"2026-03-22",tournament:"Valspar Championship",name:"Innisbrook (Copperhead)",level:"Hard",holes:[{num:1,par:4,range:[12,13]},{num:2,par:5,range:[17,18]},{num:3,par:3,range:[5,5]},{num:4,par:4,range:[13,14]},{num:5,par:4,range:[11,12]},{num:6,par:4,range:[12,12]},{num:7,par:4,range:[13,13]},{num:8,par:3,range:[6,7]},{num:9,par:5,range:[16,17]},{num:10,par:4,range:[11,11]},{num:11,par:4,range:[14,14]},{num:12,par:4,range:[12,13]},{num:13,par:3,range:[4,4]},{num:14,par:5,range:[17,18]},{num:15,par:4,range:[13,13]},{num:16,par:4,range:[11,12]},{num:17,par:3,range:[7,7]},{num:18,par:4,range:[14,14]}]},
  {start:"2026-03-23",end:"2026-03-29",tournament:"Texas Children's Houston Open",name:"Memorial Park GC",level:"Hard",holes:[{num:1,par:4,range:[13,14]},{num:2,par:4,range:[11,12]},{num:3,par:4,range:[14,14]},{num:4,par:3,range:[6,6]},{num:5,par:5,range:[17,18]},{num:6,par:4,range:[12,13]},{num:7,par:3,range:[5,5]},{num:8,par:4,range:[13,13]},{num:9,par:4,range:[12,12]},{num:10,par:4,range:[11,12]},{num:11,par:3,range:[4,4]},{num:12,par:4,range:[14,14]},{num:13,par:5,range:[18,18]},{num:14,par:4,range:[13,14]},{num:15,par:4,range:[12,13]},{num:16,par:3,range:[7,7]},{num:17,par:4,range:[11,11]},{num:18,par:4,range:[13,13]}]},
  {start:"2026-03-30",end:"2026-04-05",tournament:"Valero Texas Open",name:"TPC San Antonio (Oaks)",level:"Hard",holes:[{num:1,par:4,range:[13,14]},{num:2,par:4,range:[12,12]},{num:3,par:5,range:[17,18]},{num:4,par:4,range:[11,12]},{num:5,par:3,range:[5,6]},{num:6,par:4,range:[14,14]},{num:7,par:4,range:[12,13]},{num:8,par:3,range:[6,6]},{num:9,par:5,range:[18,18]},{num:10,par:4,range:[13,14]},{num:11,par:3,range:[4,4]},{num:12,par:4,range:[11,12]},{num:13,par:4,range:[13,13]},{num:14,par:5,range:[17,18]},{num:15,par:4,range:[12,13]},{num:16,par:4,range:[14,14]},{num:17,par:3,range:[7,7]},{num:18,par:4,range:[15,15]}]},
  {start:"2026-04-06",end:"2026-04-12",tournament:"The Masters",name:"Augusta National Golf Club",level:"Hard",holes:[{num:1,par:4,range:[13,14]},{num:2,par:5,range:[17,18]},{num:3,par:4,range:[11,12]},{num:4,par:3,range:[7,7]},{num:5,par:4,range:[14,14]},{num:6,par:3,range:[5,6]},{num:7,par:4,range:[12,13]},{num:8,par:5,range:[17,18]},{num:9,par:4,range:[13,13]},{num:10,par:4,range:[15,15]},{num:11,par:4,range:[14,14]},{num:12,par:3,range:[4,4]},{num:13,par:5,range:[16,17]},{num:14,par:4,range:[13,14]},{num:15,par:5,range:[16,17]},{num:16,par:3,range:[5,5]},{num:17,par:4,range:[12,12]},{num:18,par:4,range:[14,14]}]},
  {start:"2026-04-13",end:"2026-04-19",tournament:"RBC Heritage",name:"Harbour Town Golf Links",level:"Hard",holes:[{num:1,par:4,range:[11,12]},{num:2,par:5,range:[16,17]},{num:3,par:4,range:[10,11]},{num:4,par:3,range:[5,6]},{num:5,par:5,range:[17,18]},{num:6,par:4,range:[12,12]},{num:7,par:3,range:[4,4]},{num:8,par:4,range:[13,13]},{num:9,par:4,range:[11,12]},{num:10,par:4,range:[12,12]},{num:11,par:4,range:[11,11]},{num:12,par:4,range:[13,13]},{num:13,par:4,range:[10,11]},{num:14,par:3,range:[6,7]},{num:15,par:5,range:[17,17]},{num:16,par:4,range:[12,13]},{num:17,par:3,range:[5,5]},{num:18,par:4,range:[13,13]}]},
  {start:"2026-04-20",end:"2026-04-26",tournament:"Zurich Classic of New Orleans",name:"TPC Louisiana",level:"Hard",holes:[{num:1,par:4,range:[12,13]},{num:2,par:5,range:[17,18]},{num:3,par:4,range:[11,12]},{num:4,par:4,range:[13,14]},{num:5,par:3,range:[5,5]},{num:6,par:4,range:[12,12]},{num:7,par:5,range:[17,18]},{num:8,par:3,range:[6,6]},{num:9,par:4,range:[14,14]},{num:10,par:4,range:[11,12]},{num:11,par:4,range:[13,13]},{num:12,par:3,range:[4,5]},{num:13,par:5,range:[18,18]},{num:14,par:4,range:[13,14]},{num:15,par:4,range:[12,13]},{num:16,par:3,range:[6,6]},{num:17,par:4,range:[14,14]},{num:18,par:5,range:[17,17]}]},
  {start:"2026-04-27",end:"2026-05-03",tournament:"Cadillac Championship",name:"Trump Doral (Blue Monster)",level:"Hard",holes:[{num:1,par:5,range:[17,18]},{num:2,par:4,range:[12,13]},{num:3,par:4,range:[13,14]},{num:4,par:3,range:[7,7]},{num:5,par:5,range:[18,18]},{num:6,par:4,range:[11,12]},{num:7,par:4,range:[13,13]},{num:8,par:3,range:[5,6]},{num:9,par:4,range:[14,14]},{num:10,par:5,range:[17,18]},{num:11,par:4,range:[12,12]},{num:12,par:4,range:[14,14]},{num:13,par:3,range:[6,6]},{num:14,par:4,range:[13,14]},{num:15,par:4,range:[11,11]},{num:16,par:3,range:[4,5]},{num:17,par:4,range:[15,15]},{num:18,par:4,range:[14,14]}]},
  {start:"2026-05-04",end:"2026-05-10",tournament:"Truist Championship",name:"Quail Hollow Club",level:"Hard",holes:[{num:1,par:4,range:[12,13]},{num:2,par:4,range:[14,14]},{num:3,par:4,range:[11,12]},{num:4,par:3,range:[7,7]},{num:5,par:4,range:[13,14]},{num:6,par:3,range:[5,5]},{num:7,par:5,range:[17,18]},{num:8,par:4,range:[12,12]},{num:9,par:4,range:[13,13]},{num:10,par:5,range:[18,18]},{num:11,par:4,range:[14,14]},{num:12,par:3,range:[4,4]},{num:13,par:4,range:[12,13]},{num:14,par:4,range:[15,15]},{num:15,par:5,range:[17,17]},{num:16,par:4,range:[13,14]},{num:17,par:3,range:[6,6]},{num:18,par:4,range:[14,14]}]},
  {start:"2026-05-11",end:"2026-05-17",tournament:"PGA Championship",name:"Aronimink Golf Club",level:"Hard",holes:[{num:1,par:4,range:[13,14]},{num:2,par:5,range:[18,18]},{num:3,par:3,range:[6,6]},{num:4,par:4,range:[14,14]},{num:5,par:4,range:[12,13]},{num:6,par:4,range:[13,13]},{num:7,par:4,range:[11,12]},{num:8,par:3,range:[5,5]},{num:9,par:4,range:[14,14]},{num:10,par:4,range:[13,13]},{num:11,par:4,range:[15,15]},{num:12,par:3,range:[4,4]},{num:13,par:5,range:[17,18]},{num:14,par:4,range:[12,13]},{num:15,par:4,range:[13,14]},{num:16,par:3,range:[7,7]},{num:17,par:4,range:[11,11]},{num:18,par:4,range:[14,14]}]},
  {start:"2026-05-18",end:"2026-05-24",tournament:"CJ Cup Byron Nelson",name:"TPC Craig Ranch",level:"Hard",holes:[{num:1,par:4,range:[11,12]},{num:2,par:4,range:[12,13]},{num:3,par:5,range:[17,18]},{num:4,par:3,range:[5,6]},{num:5,par:4,range:[14,14]},{num:6,par:4,range:[13,13]},{num:7,par:3,range:[4,4]},{num:8,par:4,range:[12,13]},{num:9,par:5,range:[17,18]},{num:10,par:4,range:[13,14]},{num:11,par:4,range:[11,12]},{num:12,par:3,range:[6,6]},{num:13,par:4,range:[14,14]},{num:14,par:5,range:[16,17]},{num:15,par:4,range:[12,12]},{num:16,par:4,range:[13,14]},{num:17,par:3,range:[5,5]},{num:18,par:5,range:[17,17]}]},
  {start:"2026-05-25",end:"2026-05-31",tournament:"Charles Schwab Challenge",name:"Colonial Country Club",level:"Hard",holes:[{num:1,par:5,range:[17,18]},{num:2,par:4,range:[12,12]},{num:3,par:4,range:[13,13]},{num:4,par:3,range:[6,6]},{num:5,par:4,range:[14,14]},{num:6,par:4,range:[11,12]},{num:7,par:4,range:[10,11]},{num:8,par:3,range:[5,5]},{num:9,par:4,range:[12,13]},{num:10,par:4,range:[13,13]},{num:11,par:5,range:[17,18]},{num:12,par:3,range:[4,4]},{num:13,par:4,range:[14,14]},{num:14,par:4,range:[11,12]},{num:15,par:4,range:[12,12]},{num:16,par:4,range:[13,14]},{num:17,par:3,range:[5,5]},{num:18,par:4,range:[12,12]}]},
  {start:"2026-06-01",end:"2026-06-07",tournament:"the Memorial Tournament",name:"Muirfield Village GC",level:"Hard",holes:[{num:1,par:4,range:[13,14]},{num:2,par:4,range:[14,14]},{num:3,par:4,range:[12,13]},{num:4,par:3,range:[6,6]},{num:5,par:5,range:[17,18]},{num:6,par:4,range:[12,12]},{num:7,par:5,range:[17,18]},{num:8,par:3,range:[5,5]},{num:9,par:4,range:[13,13]},{num:10,par:4,range:[14,14]},{num:11,par:5,range:[18,18]},{num:12,par:3,range:[4,5]},{num:13,par:4,range:[13,14]},{num:14,par:4,range:[12,12]},{num:15,par:5,range:[16,17]},{num:16,par:3,range:[7,7]},{num:17,par:4,range:[13,13]},{num:18,par:4,range:[14,14]}]},
  {start:"2026-06-08",end:"2026-06-14",tournament:"RBC Canadian Open",name:"TPC Toronto",level:"Hard",holes:[{num:1,par:4,range:[12,13]},{num:2,par:5,range:[17,18]},{num:3,par:4,range:[11,12]},{num:4,par:3,range:[5,6]},{num:5,par:4,range:[13,13]},{num:6,par:4,range:[14,14]},{num:7,par:3,range:[6,6]},{num:8,par:4,range:[12,13]},{num:9,par:5,range:[16,17]},{num:10,par:4,range:[13,14]},{num:11,par:4,range:[11,12]},{num:12,par:3,range:[4,4]},{num:13,par:5,range:[18,18]},{num:14,par:4,range:[12,12]},{num:15,par:4,range:[13,13]},{num:16,par:3,range:[6,7]},{num:17,par:4,range:[14,14]},{num:18,par:4,range:[13,14]}]},
  {start:"2026-06-15",end:"2026-06-21",tournament:"U.S. Open",name:"Shinnecock Hills GC",level:"Hard",holes:[{num:1,par:4,range:[13,14]},{num:2,par:3,range:[7,7]},{num:3,par:4,range:[14,14]},{num:4,par:4,range:[12,13]},{num:5,par:5,range:[18,18]},{num:6,par:4,range:[13,13]},{num:7,par:3,range:[5,5]},{num:8,par:4,range:[14,14]},{num:9,par:4,range:[15,15]},{num:10,par:4,range:[13,14]},{num:11,par:3,range:[6,6]},{num:12,par:4,range:[14,14]},{num:13,par:4,range:[12,12]},{num:14,par:4,range:[13,13]},{num:15,par:4,range:[11,12]},{num:16,par:5,range:[18,18]},{num:17,par:3,range:[4,4]},{num:18,par:4,range:[14,14]}]},
  {start:"2026-06-22",end:"2026-06-28",tournament:"Travelers Championship",name:"TPC River Highlands",level:"Hard",holes:[{num:1,par:4,range:[12,13]},{num:2,par:4,range:[11,12]},{num:3,par:3,range:[5,5]},{num:4,par:4,range:[13,13]},{num:5,par:4,range:[14,14]},{num:6,par:5,range:[17,18]},{num:7,par:4,range:[10,11]},{num:8,par:3,range:[6,6]},{num:9,par:4,range:[12,13]},{num:10,par:4,range:[13,14]},{num:11,par:3,range:[4,4]},{num:12,par:4,range:[12,12]},{num:13,par:5,range:[16,17]},{num:14,par:4,range:[11,12]},{num:15,par:5,range:[17,17]},{num:16,par:4,range:[13,14]},{num:17,par:3,range:[5,5]},{num:18,par:4,range:[13,13]}]},
  {start:"2026-06-29",end:"2026-07-05",tournament:"Rocket Mortgage Classic",name:"Detroit Golf Club",level:"Hard",holes:[{num:1,par:4,range:[11,12]},{num:2,par:5,range:[17,18]},{num:3,par:4,range:[12,13]},{num:4,par:3,range:[5,5]},{num:5,par:4,range:[13,14]},{num:6,par:4,range:[12,12]},{num:7,par:4,range:[13,13]},{num:8,par:3,range:[6,7]},{num:9,par:5,range:[16,17]},{num:10,par:4,range:[11,12]},{num:11,par:4,range:[13,14]},{num:12,par:3,range:[4,4]},{num:13,par:4,range:[14,14]},{num:14,par:5,range:[17,18]},{num:15,par:4,range:[12,12]},{num:16,par:4,range:[13,13]},{num:17,par:3,range:[5,6]},{num:18,par:4,range:[12,13]}]},
  {start:"2026-07-06",end:"2026-07-12",tournament:"John Deere Classic",name:"TPC Deere Run",level:"Hard",holes:[{num:1,par:4,range:[12,13]},{num:2,par:5,range:[16,17]},{num:3,par:4,range:[11,12]},{num:4,par:3,range:[5,5]},{num:5,par:4,range:[13,14]},{num:6,par:4,range:[12,12]},{num:7,par:4,range:[10,11]},{num:8,par:3,range:[6,6]},{num:9,par:5,range:[17,18]},{num:10,par:4,range:[13,13]},{num:11,par:4,range:[11,12]},{num:12,par:3,range:[4,5]},{num:13,par:4,range:[12,13]},{num:14,par:5,range:[17,18]},{num:15,par:4,range:[13,13]},{num:16,par:4,range:[14,14]},{num:17,par:3,range:[5,5]},{num:18,par:4,range:[12,12]}]},
  {start:"2026-07-13",end:"2026-07-19",tournament:"The Open Championship",name:"Royal Birkdale",level:"Hard",holes:[{num:1,par:4,range:[13,14]},{num:2,par:4,range:[13,13]},{num:3,par:4,range:[14,14]},{num:4,par:3,range:[6,6]},{num:5,par:4,range:[11,12]},{num:6,par:4,range:[15,15]},{num:7,par:3,range:[5,5]},{num:8,par:4,range:[12,13]},{num:9,par:4,range:[13,13]},{num:10,par:4,range:[12,12]},{num:11,par:4,range:[14,14]},{num:12,par:3,range:[7,7]},{num:13,par:4,range:[15,15]},{num:14,par:3,range:[5,6]},{num:15,par:5,range:[17,18]},{num:16,par:4,range:[12,12]},{num:17,par:5,range:[17,17]},{num:18,par:4,range:[14,14]}]},
  {start:"2026-07-20",end:"2026-07-26",tournament:"3M Open",name:"TPC Twin Cities",level:"Hard",holes:[{num:1,par:4,range:[11,12]},{num:2,par:4,range:[13,14]},{num:3,par:5,range:[17,18]},{num:4,par:3,range:[5,5]},{num:5,par:4,range:[12,13]},{num:6,par:4,range:[14,14]},{num:7,par:4,range:[11,11]},{num:8,par:3,range:[6,6]},{num:9,par:5,range:[16,17]},{num:10,par:4,range:[13,13]},{num:11,par:4,range:[12,12]},{num:12,par:3,range:[4,5]},{num:13,par:4,range:[13,14]},{num:14,par:4,range:[14,14]},{num:15,par:5,range:[17,18]},{num:16,par:4,range:[12,13]},{num:17,par:3,range:[5,5]},{num:18,par:4,range:[13,13]}]},
  {start:"2026-07-27",end:"2026-08-02",tournament:"Wyndham Championship",name:"Sedgefield CC",level:"Hard",holes:[{num:1,par:4,range:[12,13]},{num:2,par:5,range:[16,17]},{num:3,par:4,range:[11,12]},{num:4,par:3,range:[5,5]},{num:5,par:4,range:[13,14]},{num:6,par:4,range:[12,12]},{num:7,par:4,range:[14,14]},{num:8,par:3,range:[6,6]},{num:9,par:4,range:[13,13]},{num:10,par:5,range:[17,18]},{num:11,par:4,range:[12,12]},{num:12,par:4,range:[11,12]},{num:13,par:3,range:[4,4]},{num:14,par:5,range:[17,17]},{num:15,par:4,range:[13,14]},{num:16,par:4,range:[12,12]},{num:17,par:3,range:[5,6]},{num:18,par:4,range:[14,14]}]},
  {start:"2026-08-03",end:"2026-08-09",tournament:"FedEx St. Jude",name:"TPC Southwind",level:"Hard",holes:[{num:1,par:4,range:[13,14]},{num:2,par:4,range:[12,12]},{num:3,par:3,range:[6,6]},{num:4,par:4,range:[14,14]},{num:5,par:4,range:[11,12]},{num:6,par:5,range:[17,18]},{num:7,par:4,range:[13,13]},{num:8,par:3,range:[5,5]},{num:9,par:4,range:[14,14]},{num:10,par:4,range:[12,13]},{num:11,par:5,range:[17,17]},{num:12,par:3,range:[4,4]},{num:13,par:4,range:[13,13]},{num:14,par:4,range:[12,13]},{num:15,par:4,range:[14,14]},{num:16,par:3,range:[5,5]},{num:17,par:4,range:[11,12]},{num:18,par:4,range:[13,13]}]},
  {start:"2026-08-10",end:"2026-08-16",tournament:"BMW Championship",name:"Caves Valley GC",level:"Hard",holes:[{num:1,par:4,range:[12,13]},{num:2,par:4,range:[14,14]},{num:3,par:5,range:[18,18]},{num:4,par:3,range:[6,6]},{num:5,par:4,range:[13,14]},{num:6,par:4,range:[12,12]},{num:7,par:4,range:[13,13]},{num:8,par:3,range:[5,5]},{num:9,par:5,range:[17,18]},{num:10,par:4,range:[13,13]},{num:11,par:4,range:[14,14]},{num:12,par:3,range:[4,5]},{num:13,par:5,range:[17,18]},{num:14,par:4,range:[12,13]},{num:15,par:4,range:[15,15]},{num:16,par:3,range:[6,6]},{num:17,par:4,range:[13,14]},{num:18,par:4,range:[14,14]}]},
  {start:"2026-08-17",end:"2026-08-23",tournament:"Tour Championship",name:"East Lake Golf Club",level:"Hard",holes:[{num:1,par:4,range:[13,14]},{num:2,par:4,range:[14,14]},{num:3,par:3,range:[6,6]},{num:4,par:4,range:[12,13]},{num:5,par:3,range:[5,5]},{num:6,par:5,range:[17,18]},{num:7,par:4,range:[13,13]},{num:8,par:4,range:[14,14]},{num:9,par:5,range:[18,18]},{num:10,par:4,range:[12,12]},{num:11,par:4,range:[13,14]},{num:12,par:3,range:[4,4]},{num:13,par:4,range:[14,14]},{num:14,par:5,range:[17,17]},{num:15,par:4,range:[12,13]},{num:16,par:4,range:[13,13]},{num:17,par:3,range:[7,7]},{num:18,par:5,range:[17,18]}]}
];
function getPGACourse(){const now=new Date();return PGA_2026.find(e=>{const s=new Date(e.start+"T00:00:00");const en=new Date(e.end+"T23:59:59");s.setDate(s.getDate()-1);return now>=s&&now<=en;});}

// ─── SEASON 1 LEAGUE DATA ───────────────────────────────
const S1_STANDINGS=[{r:1,seed:1,p:"Ryan Hangartner",pts:12,gp:6,w:6,l:0,t:0,tAdj:-23,aAdj:-4,aScr:68,tScr:405},{r:2,seed:2,p:"Jimmie Perkins",pts:11,gp:7,w:5,l:1,t:1,tAdj:-40,aAdj:-6,aScr:66,tScr:462},{r:3,seed:3,p:"Josh Baker",pts:8,gp:7,w:4,l:3,t:0,tAdj:-36,aAdj:-5,aScr:66,tScr:462},{r:4,seed:4,p:"Jeff Gurrister",pts:8,gp:7,w:4,l:3,t:0,tAdj:-29,aAdj:-4,aScr:70,tScr:493},{r:5,seed:5,p:"Tyler Shane",pts:8,gp:7,w:4,l:3,t:0,tAdj:26,aAdj:4,aScr:86,tScr:600},{r:6,seed:6,p:"Jon Basorka",pts:8,gp:7,w:4,l:3,t:0,tAdj:29,aAdj:4,aScr:86,tScr:599},{r:7,seed:7,p:"Jacob Schmiegelt",pts:4,gp:7,w:2,l:5,t:0,tAdj:2,aAdj:0,aScr:76,tScr:529},{r:8,seed:0,p:"Danny Zagorski",pts:3,gp:6,w:1,l:4,t:1,tAdj:-3,aAdj:-1,aScr:74,tScr:441},{r:9,seed:0,p:"Kevin Koerner",pts:2,gp:6,w:1,l:5,t:0,tAdj:50,aAdj:8,aScr:90,tScr:540},{r:10,seed:0,p:"Kevin Papiernik",pts:2,gp:6,w:1,l:5,t:0,tAdj:71,aAdj:12,aScr:94,tScr:563}];
const S1_RESULTS=[[1,1,1,"Maitland Palms","Danny Zagorski",70,"Jimmie Perkins",70,"Tie",0],[2,1,1,"Maitland Palms","Josh Baker",71,"Kevin Papiernik",94,"Josh Baker",-23],[3,1,1,"Maitland Palms","Tyler Shane",91,"Jon Basorka",88,"Jon Basorka",-3],[4,1,1,"Maitland Palms","Kevin Koerner",90,"Jacob Schmiegelt",75,"Jacob Schmiegelt",-15],[5,1,1,"Maitland Palms","Ryan Hangartner",69,"Jeff Gurrister",76,"Ryan Hangartner",-7],[6,1,2,"Nebraska","Danny Zagorski",75,"Kevin Papiernik",90,"Danny Zagorski",-15],[7,1,2,"Nebraska","Jimmie Perkins",71,"Jon Basorka",92,"Jimmie Perkins",-21],[8,1,2,"Nebraska","Josh Baker",67,"Jacob Schmiegelt",77,"Josh Baker",-10],[9,1,2,"Nebraska","Tyler Shane",92,"Jeff Gurrister",75,"Jeff Gurrister",-17],[10,1,2,"Nebraska","Kevin Koerner",92,"Ryan Hangartner",70,"Ryan Hangartner",-22],[11,2,3,"Lanfear Oaks","Danny Zagorski",75,"Jon Basorka",88,"Jon Basorka",-4],[12,2,3,"Lanfear Oaks","Kevin Papiernik",89,"Jacob Schmiegelt",79,"Kevin Papiernik",-6],[13,2,3,"Lanfear Oaks","Jimmie Perkins",66,"Jeff Gurrister",74,"Jimmie Perkins",-3],[14,2,3,"Lanfear Oaks","Josh Baker",66,"Ryan Hangartner",66,"Ryan Hangartner",-1],[15,2,3,"Lanfear Oaks","Tyler Shane",84,"Kevin Koerner",89,"Tyler Shane",-6],[16,2,4,"Orland National","Danny Zagorski",76,"Jacob Schmiegelt",66,"Jacob Schmiegelt",-13],[17,2,4,"Orland National","Jon Basorka",75,"Jeff Gurrister",68,"Jon Basorka",-7],[18,2,4,"Orland National","Kevin Papiernik",95,"Ryan Hangartner",67,"Ryan Hangartner",-6],[19,2,4,"Orland National","Jimmie Perkins",62,"Kevin Koerner",90,"Jimmie Perkins",-8],[20,2,4,"Orland National","Josh Baker",62,"Tyler Shane",83,"Tyler Shane",-2],[21,3,5,"Nebraska","Danny Zagorski",73,"Jeff Gurrister",68,"Jeff Gurrister",-5],[22,3,5,"Nebraska","Jacob Schmiegelt",86,"Ryan Hangartner",67,"Ryan Hangartner",-14],[23,3,5,"Nebraska","Jon Basorka",92,"Kevin Koerner",90,"Kevin Koerner",-2],[24,3,5,"Nebraska","Kevin Papiernik",96,"Tyler Shane",91,"Tyler Shane",-5],[25,3,5,"Nebraska","Jimmie Perkins",66,"Josh Baker",62,"Josh Baker",-4],[26,3,6,"Maitland Palms","Danny Zagorski",72,"Ryan Hangartner",66,"Ryan Hangartner",-1],[27,3,6,"Maitland Palms","Jeff Gurrister",70,"Kevin Koerner",89,"Jeff Gurrister",-14],[28,3,6,"Maitland Palms","Jacob Schmiegelt",74,"Tyler Shane",77,"Tyler Shane",-2],[29,3,6,"Maitland Palms","Jon Basorka",85,"Josh Baker",64,"Josh Baker",-11],[30,3,6,"Maitland Palms","Kevin Papiernik",99,"Jimmie Perkins",64,"Jimmie Perkins",-25]];
const S1_PLAYOFFS=[[31,4,7,"Lanfear Oaks","QF","Tyler Shane",82,"Jeff Gurrister",62,"Jeff Gurrister",-10],[32,4,7,"Lanfear Oaks","QF","Jimmie Perkins",63,"Jacob Schmiegelt",72,"Jimmie Perkins",-4],[33,4,7,"Lanfear Oaks","QF","Josh Baker",70,"Jon Basorka",79,"Jon Basorka",-1],[34,5,8,"Maitland Palms","SF","Ryan Hangartner",null,"Jeff Gurrister",null,null,null],[35,5,8,"Maitland Palms","SF","Jimmie Perkins",null,"Jon Basorka",null,null,null],[36,6,9,"Nebraska","F",null,null,null,null,null,null]];

// ─── COURSE GENERATION ──────────────────────────────────
const RAND_NAMES=["Whistling Pines","Shadow Ridge","Eagle Bluff","Iron Horse","Cedar Valley","Falcon Crest","Timber Ridge","Stone Creek","Hawk's Landing","Silver Lakes","Canyon Ridge","Elk Run","Fox Hollow","Bear Creek","Wolf Run","Deer Path","Osprey Point","Heron Bay","Pelican Hill","Cypress Point","Magnolia Springs","Willow Bend","Oak Hollow","Maple Ridge","Pine Valley","Birch Creek","Aspen Hills","Cherry Blossom","Dogwood Trails","Juniper Hills","Sawgrass Bluffs","Dunes West","Seaside Links","Ocean Breeze","Windswept Dunes","Links at Stonebridge","Royal Palms","Grand Oaks","Heritage Pines","Plantation Bay","Marsh Harbor","Tidal Creek","Sunset Cove","Moonlight Bay","Starlight Ranch","Thunder Canyon","Lightning Ridge","Storm Peak","Whispering Oaks","Hidden Falls","Crystal Springs","Emerald Hills","Diamond Creek","Ruby Falls","Sapphire Bay","Golden Eagle","Bronze Bell","Copper Ridge","Ironwood","Steelhead Run","Summit Ridge","Vista Grande","Panorama Hills","Horizon Links","Skyline Bluffs","Prairie Wind","Tallgrass","Buffalo Run","Bison Ridge","Mustang Creek","Stallion Springs","Colt Meadow","Bronco Hills","Pinto Valley","Maverick Ridge","Lakeside Links","River Bend","Mill Creek","Bridge Valley","Covered Bridge","Old Mill Run","Waterford Glen","Canterbury Downs","Wellington Park","Sherwood Forest","Nottingham Links","Windsor Greens","Kingston Heath","Stratford Hills","Oxford Run","Cambridge Links","Princeton Oaks","Yale Ridge","Stanford Hills","Dartmouth Green","Ridgewood CC","Lakeview National","Mountain Shadows","Desert Springs","Coral Ridge","Palm Desert Dunes","Cactus Canyon","Mesa Verde","Red Rock Canyon","Sandstone Ridge","Limestone Creek","Granite Falls","Marble Ridge","Obsidian Links","Flint Hills","Cobblestone Creek","Fieldstone Manor"];
function generateCourse(difficulty,existingNames=[]){
  const avail=RAND_NAMES.filter(n=>!existingNames.includes(n));const name=avail.length?avail[Math.floor(Math.random()*avail.length)]:`Course ${Math.floor(Math.random()*1000)}`;
  const templates=[[4,5,4,4,3,4,4,3,4,4,4,3,5,4,4,3,4,5],[4,4,4,4,3,5,4,3,5,4,4,3,4,5,4,3,4,5],[4,5,3,4,4,4,4,3,4,4,4,3,5,4,4,3,4,4],[4,4,4,3,5,4,3,4,5,4,4,3,4,5,4,4,3,4],[5,4,4,3,4,4,3,4,5,4,3,4,5,4,4,3,4,4]];
  const tmpl=templates[Math.floor(Math.random()*templates.length)];
  const dm={Easy:{bM:0.6,tight:0.1,mx:16},Medium:{bM:0.8,tight:0.25,mx:19},Hard:{bM:1.0,tight:0.45,mx:21},Expert:{bM:1.2,tight:0.65,mx:23}}[difficulty]||{bM:1,tight:0.3,mx:21};
  const hO=Array.from({length:18},(_,i)=>i);for(let i=17;i>0;i--){const j=Math.floor(Math.random()*(i+1));[hO[i],hO[j]]=[hO[j],hO[i]];}
  const holes=tmpl.map((par,i)=>{const hcp=hO.indexOf(i)+1;let base=par===3?Math.round((3+Math.random()*5)*dm.bM):par===4?Math.round((10+Math.random()*5)*dm.bM):Math.round((15+Math.random()*4)*dm.bM);base=Math.max(2,Math.min(dm.mx,base));const isTight=hcp<=6?Math.random()<dm.tight+0.4:hcp<=12?Math.random()<dm.tight:Math.random()<dm.tight*0.3;const spread=isTight?0:hcp<=6?Math.floor(Math.random()*2):hcp<=12?Math.floor(Math.random()*3):1+Math.floor(Math.random()*3);return{num:i+1,par,range:[Math.max(2,base),Math.min(dm.mx,Math.max(base,base+spread))]};});
  return{name,level:difficulty,holes,generated:true};
}

// ─── HELPERS ────────────────────────────────────────────
const calcPar=(h,s,e)=>h.slice(s,e).reduce((a,x)=>a+x.par,0);
const fmtRange=(h,s,e)=>{const mn=h.slice(s,e).reduce((a,x)=>a+x.range[0],0);const mx=h.slice(s,e).reduce((a,x)=>a+x.range[1],0);return`${mn}-${mx}`;};
const fmtR=r=>`${r[0]}-${r[1]}`;
function calcHandicap(rnds){if(!rnds.length)return null;const diffs=rnds.map(r=>r.total-r.par).sort((a,b)=>a-b);const n=Math.max(1,Math.floor(diffs.length*0.4));return Math.round((diffs.slice(0,n).reduce((s,d)=>s+d,0)/n)*10)/10;}
function scoreName(s,p){const d=s-p;if(d<=-3)return{l:"Albatross!",c:"#d4b84a",e:"🦅🦅"};if(d===-2)return{l:"Eagle!",c:"#d4b84a",e:"🦅"};if(d===-1)return{l:"Birdie!",c:"#22c55e",e:"🐦"};if(d===0)return{l:"Par",c:"#aaa",e:"👍"};if(d===1)return{l:"Bogey",c:"#ef4444",e:""};if(d===2)return{l:"Dbl Bogey",c:"#dc2626",e:""};return{l:`+${d}`,c:"#b91c1c",e:""};}
function RelPar({s,p}){if(s==null)return null;const d=s-p;return<span style={{color:d<0?"#22c55e":d>0?"#ef4444":"#aaa",fontWeight:700,fontSize:12}}>{d===0?"E":d>0?`+${d}`:d}</span>;}
function genLiveCode(){const ch="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let c="";for(let i=0;i<4;i++)c+=ch[Math.floor(Math.random()*ch.length)];return c;}

const C={bg:"#0a1a0a",card:"#142414",card2:"#1c301c",accent:"#1e4a1e",green:"#2d6a2d",greenLt:"#4aaa4a",gold:"#d4b84a",text:"#e4e4d8",muted:"#8a9a8a",border:"#243a24",white:"#fff",red:"#ef4444",blue:"#8ab4f8",headerBg:"linear-gradient(135deg,#0f2a0f,#1e4a1e)"};
const btnS=p=>({padding:"10px 20px",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:14,background:p?`linear-gradient(135deg,${C.green},${C.accent})`:C.card2,color:p?C.white:C.text,...(p?{}:{border:`1px solid ${C.border}`})});
const inputS={padding:"8px 12px",borderRadius:6,border:`1px solid ${C.border}`,background:C.card2,color:C.text,fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"};
const smallInput={padding:"6px 4px",borderRadius:4,border:`1px solid ${C.border}`,background:C.card2,color:C.text,fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",textAlign:"center"};

// ─── MAIN APP ───────────────────────────────────────────
export default function App(){
  const[tab,setTab]=useState("home");
  const[me,setMe]=useState(()=>{try{return localStorage.getItem("sg-me")||"";}catch(e){return"";}});
  const[players,setPlayers]=useState([]);const[rounds,setRounds]=useState([]);const[customCourses,setCustomCourses]=useState([]);const[loaded,setLoaded]=useState(false);
  const[selCourse,setSelCourse]=useState(null);const[roundPlayers,setRoundPlayers]=useState([]);const[playMode,setPlayMode]=useState("setup");
  const[curPlayerIdx,setCurPlayerIdx]=useState(0);const[curHole,setCurHole]=useState(0);const[holeState,setHoleState]=useState({});
  const[allScores,setAllScores]=useState({});const[allShotLogs,setAllShotLogs]=useState({});
  const[hideScores,setHideScores]=useState(false);const[nine,setNine]=useState(0);const[newPlayerName,setNewPlayerName]=useState("");
  const[showScorecard,setShowScorecard]=useState(false);
  const[useHdcp,setUseHdcp]=useState(false);const[hdcps,setHdcps]=useState({});
  const[creating,setCreating]=useState(false);const[ccName,setCcName]=useState("");const[ccLevel,setCcLevel]=useState("Medium");
  const[ccTournament,setCcTournament]=useState("");const[ccHoles,setCcHoles]=useState(()=>Array.from({length:18},(_,i)=>({num:i+1,par:4,rangeMin:10,rangeMax:12})));const[ccNine,setCcNine]=useState(0);
  const[leagueView,setLeagueView]=useState("standings");const[leagueRdFilter,setLeagueRdFilter]=useState("all");
  const[tEntries,setTEntries]=useState([]);const[showTourney,setShowTourney]=useState(false);
  const[activeTourney,setActiveTourney]=useState(null);const[tShowAdj,setTShowAdj]=useState(false);
  const[myTHdcp,setMyTHdcp]=useState("");
  // ─── LIVE ROUND STATE ──────────────────────────────────
  const[liveId,setLiveId]=useState(null);const[liveData,setLiveData]=useState(null);
  const[joinInput,setJoinInput]=useState("");const[showJoin,setShowJoin]=useState(false);

  const allCourses=[...COURSES,...customCourses];
  const isLive=!!liveId&&!!liveData;

  useEffect(()=>{const u=[];u.push(onSnapshot(collection(db,"players"),s=>{setPlayers(s.docs.map(d=>({id:d.id,...d.data()})));}));u.push(onSnapshot(query(collection(db,"rounds"),orderBy("createdAt","desc")),s=>{setRounds(s.docs.map(d=>({id:d.id,...d.data()})));}));u.push(onSnapshot(collection(db,"customCourses"),s=>{setCustomCourses(s.docs.map(d=>({id:d.id,...d.data(),generated:true})));}));u.push(onSnapshot(collection(db,"pgaTourneys"),s=>{setTEntries(s.docs.map(d=>({id:d.id,...d.data()})));}));setLoaded(true);return()=>u.forEach(x=>x());},[]);

  // ─── LIVE ROUND LISTENER ───────────────────────────────
  useEffect(()=>{
    if(!liveId){setLiveData(null);return;}
    const unsub=onSnapshot(doc(db,"liveRounds",liveId),snap=>{
      if(snap.exists())setLiveData({id:snap.id,...snap.data()});
      else{setLiveId(null);setLiveData(null);}
    });
    return()=>unsub();
  },[liveId]);

  // ─── MERGE LIVE SCORES FROM OTHER PLAYERS ──────────────
  useEffect(()=>{
    if(!liveData||!me)return;
    // Add any new remote players to roundPlayers
    setRoundPlayers(prev=>{
      const all=new Set([...prev,...liveData.players]);
      return[...all];
    });
    // Merge other players' scores into local state
    setAllScores(prev=>{
      const m={...prev};
      liveData.players.forEach(p=>{
        if(p!==me&&liveData.scores?.[p])m[p]=liveData.scores[p];
      });
      return m;
    });
  },[liveData,me]);

  // ─── AUTO-SYNC MY SCORES (debounced) ───────────────────
  const myScoresJson=JSON.stringify(allScores[me]||[]);
  useEffect(()=>{
    if(!liveId||!me)return;
    const t=setTimeout(()=>syncMyScores(),600);
    return()=>clearTimeout(t);
  },[myScoresJson,liveId]);

  async function addPlayerToDB(name){const n=name.trim();if(!n||players.some(p=>p.name===n))return;await addDoc(collection(db,"players"),{name:n,createdAt:Date.now()});}
  async function saveRoundToDB(rd){await addDoc(collection(db,"rounds"),{...rd,createdAt:Date.now()});}
  async function deleteRoundFromDB(id){await deleteDoc(doc(db,"rounds",id));}
  async function saveCoursetoDB(course){return(await addDoc(collection(db,"customCourses"),{name:course.name,level:course.level,holes:course.holes,pga:course.pga||false,tournament:course.tournament||"",createdAt:Date.now()})).id;}
  async function deleteCourseFromDB(id){await deleteDoc(doc(db,"customCourses",id));}
  function selectMe(name){setMe(name);try{localStorage.setItem("sg-me",name);}catch(e){}}

  // ─── LIVE ROUND FUNCTIONS ──────────────────────────────
  async function goLive(){
    if(!selCourse||!me)return;
    const code=genLiveCode();
    const ref=await addDoc(collection(db,"liveRounds"),{
      code,host:me,courseName:selCourse.name,courseData:{name:selCourse.name,level:selCourse.level,holes:selCourse.holes,pga:selCourse.pga||false,tournament:selCourse.tournament||""},
      players:[me,...roundPlayers.filter(p=>p!==me)],status:"playing",
      scores:{[me]:allScores[me]||Array(18).fill(null),...Object.fromEntries(roundPlayers.filter(p=>p!==me).map(p=>[p,allScores[p]||Array(18).fill(null)]))},
      holeOuts:{[me]:0,...Object.fromEntries(roundPlayers.filter(p=>p!==me).map(p=>[p,0]))},
      hideScores,useHdcp,hdcps,activeTourney,createdAt:Date.now()
    });
    setLiveId(ref.id);
  }
  async function joinLive(){
    const code=joinInput.trim().toUpperCase();if(!code)return;
    try{
      const q2=query(collection(db,"liveRounds"),where("code","==",code));
      const snap=await getDocs(q2);
      if(snap.empty){alert("No round found with code: "+code);return;}
      const d=snap.docs[0];const data=d.data();
      if(data.status==="finished"){alert("That round is already finished!");return;}
      const pls=[...data.players];if(!pls.includes(me))pls.push(me);
      const scores={...data.scores,[me]:data.scores[me]||Array(18).fill(null)};
      const holeOuts={...data.holeOuts,[me]:data.holeOuts[me]||0};
      await updateDoc(doc(db,"liveRounds",d.id),{players:pls,scores,holeOuts});
      setLiveId(d.id);
      setSelCourse(data.courseData);setActiveTourney(data.activeTourney||null);
      setRoundPlayers(pls);setAllScores(scores);
      setAllShotLogs(prev=>({...prev,[me]:prev[me]||Array.from({length:18},()=>[])}));
      setHideScores(data.hideScores||false);setUseHdcp(data.useHdcp||false);setHdcps(data.hdcps||{});
      setPlayMode("setup");setTab("play");setShowJoin(false);setJoinInput("");
    }catch(e){alert("Error joining: "+e.message);}
  }
  async function leaveLive(){
    if(liveId&&liveData&&liveData.host===me){
      try{await updateDoc(doc(db,"liveRounds",liveId),{status:"finished"});}catch(e){}
    }
    setLiveId(null);setLiveData(null);
  }
  async function syncMyScores(){
    if(!liveId||!me)return;
    try{
      const ref=doc(db,"liveRounds",liveId);const snap=await getDoc(ref);
      if(!snap.exists())return;const d=snap.data();
      const sc=allScores[me]||Array(18).fill(null);
      const ho=(allShotLogs[me]||[]).filter(shots=>shots.some(s=>s.type==="holeout")).length;
      await updateDoc(ref,{scores:{...d.scores,[me]:sc},holeOuts:{...d.holeOuts,[me]:ho}});
    }catch(e){}
  }

  // ─── PGA TOURNAMENT FUNCTIONS ──────────────────────────
  async function joinTourney(tId){
    if(tEntries.some(e=>e.tournamentId===tId&&e.player===me))return;
    const hd=parseInt(myTHdcp)||null;
    await addDoc(collection(db,"pgaTourneys"),{tournamentId:tId,player:me,round:0,hdcp:hd,createdAt:Date.now()});
  }
  async function updateMyTourneyHdcp(tId){
    const entry=tEntries.find(e=>e.tournamentId===tId&&e.player===me&&e.round===0);
    const hd=parseInt(myTHdcp)||null;
    if(entry)await updateDoc(doc(db,"pgaTourneys",entry.id),{hdcp:hd});
  }
  function playTourneyRound(pga){
    const tid=pga.start;const myRnds=tEntries.filter(e=>e.tournamentId===tid&&e.player===me&&e.round>0);
    const nextRd=myRnds.length+1;if(nextRd>4)return;
    if(!tEntries.some(e=>e.tournamentId===tid&&e.player===me)){
      const hd=parseInt(myTHdcp)||null;
      addDoc(collection(db,"pgaTourneys"),{tournamentId:tid,player:me,round:0,hdcp:hd,createdAt:Date.now()});
    }
    setActiveTourney({key:tid,round:nextRd,tournament:pga.tournament});
    const course={name:pga.name,level:pga.level,holes:pga.holes,pga:true,tournament:pga.tournament};
    setSelCourse(course);setRoundPlayers([me]);setAllScores({[me]:Array(18).fill(null)});
    setAllShotLogs({[me]:Array.from({length:18},()=>[])});setPlayMode("setup");
    setCurHole(0);setCurPlayerIdx(0);setHideScores(false);setTab("play");
  }
  function playCasualPGA(pga){
    setActiveTourney(null);
    const course={name:pga.name,level:pga.level,holes:pga.holes,pga:true,tournament:pga.tournament};
    setSelCourse(course);setRoundPlayers([]);setAllScores({});setAllShotLogs({});setPlayMode("setup");setTab("play");
  }

  function resetCreator(){setCcName("");setCcLevel("Medium");setCcTournament("");setCcHoles(Array.from({length:18},(_,i)=>({num:i+1,par:4,rangeMin:10,rangeMax:12})));setCcNine(0);}
  function setCcHolePar(idx,par){setCcHoles(prev=>{const n=[...prev];n[idx]={...n[idx],par};return n;});}
  function setCcHoleRange(idx,field,val){const v=parseInt(val)||0;setCcHoles(prev=>{const n=[...prev];n[idx]={...n[idx],[field]:Math.max(1,Math.min(30,v))};return n;});}
  async function saveCreatedCourse(){if(!ccName.trim())return;const holes=ccHoles.map(h=>({num:h.num,par:h.par,range:[h.rangeMin,Math.max(h.rangeMin,h.rangeMax)]}));await saveCoursetoDB({name:ccName.trim(),level:ccLevel,holes,tournament:ccTournament.trim()});setCreating(false);resetCreator();}
  async function handleGenerate(diff){const en=[...allCourses.map(c=>c.name),...PGA_2026.map(c=>c.name)];const course=generateCourse(diff,en);await saveCoursetoDB(course);setSelCourse({...course,generated:true});setRoundPlayers([]);setAllScores({});setAllShotLogs({});setPlayMode("setup");setCurHole(0);setCurPlayerIdx(0);setHideScores(false);setTab("play");}
  function startRound(course){setSelCourse(course);setRoundPlayers([]);setAllScores({});setAllShotLogs({});setPlayMode("setup");setCurHole(0);setCurPlayerIdx(0);setHideScores(false);setActiveTourney(null);setLiveId(null);setLiveData(null);setTab("play");}
  function addToRound(name){if(!name||roundPlayers.includes(name))return;setRoundPlayers(p=>[...p,name]);setAllScores(s=>({...s,[name]:Array(18).fill(null)}));setAllShotLogs(s=>({...s,[name]:Array.from({length:18},()=>[])}));}
  function beginPlay(){if(!roundPlayers.length||!selCourse)return;setPlayMode("holes");setCurHole(0);setCurPlayerIdx(0);initHole();}
  function initHole(){const hs={};roundPlayers.forEach(p=>{hs[p]={shots:[],total:0,onGreen:false,putts:0,done:false,score:null,holeOut:false};});setHoleState(hs);setCurPlayerIdx(0);}

  function recordShot(player,value){
    setHoleState(prev=>{
      const ps={...prev[player]};const hole=selCourse.holes[curHole];if(ps.done)return prev;
      if(value==="HOLEOUT"){ps.holeOut=true;ps.done=true;ps.score=ps.shots.filter(s=>s.type==="slide"||s.type==="OB").length+1;ps.shots.push({type:"holeout",val:"Hole Out!"});return{...prev,[player]:ps};}
      if(ps.onGreen){if(value==="MADE"){ps.putts+=1;ps.shots.push({type:"putt",val:"Made"});ps.done=true;ps.score=ps.shots.filter(s=>s.type==="slide"||s.type==="OB").length+ps.putts;}else{ps.putts+=1;ps.shots.push({type:"putt",val:"Miss"});}}
      else{if(value==="OB"){ps.shots.push({type:"OB",val:0});}else{const num=parseInt(value);const isOver=ps.total>hole.range[1];if(isOver){ps.total-=num;ps.shots.push({type:"slide",val:num,dir:"sub"});}else{ps.total+=num;ps.shots.push({type:"slide",val:num,dir:"add"});}if(ps.total>=hole.range[0]&&ps.total<=hole.range[1])ps.onGreen=true;}}
      return{...prev,[player]:ps};
    });
  }
  function undoShot(player){setHoleState(prev=>{const ps={...prev[player]};if(!ps.shots.length||ps.done)return prev;const last=ps.shots.pop();if(last.type==="putt")ps.putts-=1;else if(last.type==="slide"){if(last.dir==="sub")ps.total+=last.val;else ps.total-=last.val;const hole=selCourse.holes[curHole];ps.onGreen=ps.total>=hole.range[0]&&ps.total<=hole.range[1];}return{...prev,[player]:ps};});}
  function finishHole(){
    setAllScores(prev=>{const ns={...prev};roundPlayers.forEach(p=>{const ps=holeState[p];ns[p]=[...(ns[p]||Array(18).fill(null))];ns[p][curHole]=ps.done?ps.score:(ps.shots.length>0?ps.shots.filter(s=>s.type==="slide"||s.type==="OB").length+(ps.onGreen?ps.putts:0):null);});return ns;});
    setAllShotLogs(prev=>{const ns={...prev};roundPlayers.forEach(p=>{ns[p]=[...(ns[p]||Array.from({length:18},()=>[]))];ns[p][curHole]=[...(holeState[p]?.shots||[])];});return ns;});
    if(curHole<17){setCurHole(curHole+1);initHole();}else setPlayMode("review");
  }
  async function saveRound(){
    const totalPar=selCourse.holes.reduce((s,h)=>s+h.par,0);
    for(const p of roundPlayers){
      const sc=allScores[p]||Array(18).fill(null);const total=sc.reduce((s,v)=>s+(v||0),0);
      const ho=(allShotLogs[p]||[]).filter(shots=>shots.some(s=>s.type==="holeout")).length;
      const hd=useHdcp?(hdcps[p]||null):null;
      // Only save rounds for players on this device (me + local players)
      if(p===me||!isLive){
        await saveRoundToDB({player:p,course:selCourse.name,courseLevel:selCourse.level,date:new Date().toISOString().split("T")[0],scores:sc,total,par:totalPar,holesPlayed:sc.filter(v=>v!==null).length,diff:total-totalPar,holeOuts:ho,hidden:hideScores,hdcp:hd,adjTotal:hd?total-hd:null});
        if(activeTourney){
          const tJoin=tEntries.find(e=>e.tournamentId===activeTourney.key&&e.player===p&&e.round===0);
          const tHd=tJoin?.hdcp||hd;
          const existing=tEntries.find(e=>e.tournamentId===activeTourney.key&&e.player===p&&e.round===activeTourney.round);
          if(!existing){
            await addDoc(collection(db,"pgaTourneys"),{tournamentId:activeTourney.key,player:p,round:activeTourney.round,scores:sc,total,par:totalPar,hdcp:tHd,adjTotal:tHd?total-tHd:null,holeOuts:ho,date:new Date().toISOString().split("T")[0],createdAt:Date.now()});
          }
        }
      }
    }
    // Sync final scores and end live round
    if(isLive){await syncMyScores();}
    if(activeTourney){setActiveTourney(null);setShowTourney(true);setTab("home");}
    else setTab("leaderboard");
    if(isLive)leaveLive();
  }
  function setQuickScore(player,hole,val){setAllScores(s=>{const ns={...s};ns[player]=[...(ns[player]||Array(18).fill(null))];ns[player][hole]=val===""?null:Math.max(1,Math.min(15,parseInt(val)||null));return ns;});}
  function getRunningScore(player){const sc=allScores[player]||Array(18).fill(null);const completed=sc.slice(0,curHole).reduce((s,v)=>s+(v||0),0);const curDone=holeState[player]?.done?holeState[player].score:0;const total=completed+curDone;const parThru=selCourse.holes.slice(0,curHole+(holeState[player]?.done?1:0)).reduce((s,h)=>s+h.par,0);return{total,par:parThru};}

  if(!loaded)return<div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:C.greenLt,fontSize:18}}>Loading Slide Golf...</div></div>;
  if(!me)return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.text}}>
      <div style={{background:C.headerBg,padding:"14px 20px",borderBottom:`2px solid ${C.green}`,display:"flex",alignItems:"center",gap:12}}><div style={{width:34,height:34,borderRadius:"50%",background:C.accent,border:`2px solid ${C.greenLt}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>⛳</div><div><div style={{fontWeight:700,fontSize:17,letterSpacing:2,textTransform:"uppercase"}}>Slide Golf</div><div style={{fontSize:10,color:C.muted,letterSpacing:1}}>LEAGUE TRACKER</div></div></div>
      <div style={{maxWidth:400,margin:"0 auto",padding:24,display:"flex",flexDirection:"column",gap:16}}>
        <div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:22,fontWeight:700}}>Who are you?</div><div style={{color:C.muted,fontSize:13,marginTop:4}}>Pick your name to get started</div></div>
        {players.map(p=>(<button key={p.id} onClick={()=>selectMe(p.name)} style={{...btnS(false),width:"100%",padding:16,fontSize:16,textAlign:"center"}}>{p.name}</button>))}
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginTop:8}}><div style={{fontSize:13,color:C.muted,marginBottom:8}}>New player?</div><div style={{display:"flex",gap:8}}><input value={newPlayerName} onChange={e=>setNewPlayerName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newPlayerName.trim()){addPlayerToDB(newPlayerName);setNewPlayerName("");}}} placeholder="Your name..." style={inputS}/><button onClick={()=>{if(newPlayerName.trim()){addPlayerToDB(newPlayerName);setNewPlayerName("");}}} style={{...btnS(true),whiteSpace:"nowrap"}}>Add</button></div></div>
      </div>
    </div>
  );

  const playerNames=players.map(p=>p.name);
  const playerStats=playerNames.map(name=>{const pr=rounds.filter(r=>r.player===name&&r.holesPlayed===18);const hcp=calcHandicap(pr);const best=pr.length?Math.min(...pr.map(r=>r.total)):null;const avg=pr.length?Math.round(pr.reduce((s,r)=>s+r.total,0)/pr.length*10)/10:null;const ho=rounds.filter(r=>r.player===name).reduce((s,r)=>s+(r.holeOuts||0),0);return{name,rounds:pr.length,handicap:hcp,best,avg,holeOuts:ho};}).sort((a,b)=>(a.handicap??999)-(b.handicap??999));
  const curPlayer=roundPlayers[curPlayerIdx];const curHS=holeState[curPlayer];const curHD=selCourse?.holes[curHole];const pgaThisWeek=getPGACourse();
  const filteredResults=leagueRdFilter==="all"?S1_RESULTS:S1_RESULTS.filter(r=>r[2]===parseInt(leagueRdFilter));
  const tId=pgaThisWeek?.start;const curTE=tId?tEntries.filter(e=>e.tournamentId===tId):[];
  const tJoined=[...new Set(curTE.map(e=>e.player))];const iMeJoined=tJoined.includes(me);
  const myTRnds=curTE.filter(e=>e.player===me&&e.round>0).sort((a,b)=>a.round-b.round);const myNextRd=myTRnds.length+1;
  const tBoard=tJoined.map(p=>{const rnds=curTE.filter(e=>e.player===p&&e.round>0).sort((a,b)=>a.round-b.round);const tot=rnds.reduce((s,r)=>s+r.total,0);const par=rnds.reduce((s,r)=>s+r.par,0);const joinE=curTE.find(e=>e.player===p&&e.round===0);const hd=joinE?.hdcp||null;const adjTot=hd?rnds.reduce((s,r)=>s+(r.total-hd),0):null;const rScores={};rnds.forEach(r=>{rScores[r.round]={total:r.total,par:r.par};});return{player:p,rnds,tot,par,played:rnds.length,hd,adjTot,rScores};}).filter(p=>p.played>0).sort((a,b)=>tShowAdj&&a.adjTot!=null&&b.adjTot!=null?(a.adjTot-b.adjTot):((a.tot-a.par)-(b.tot-b.par)));
  const tPar=pgaThisWeek?pgaThisWeek.holes.reduce((s,h)=>s+h.par,0):72;

  // ─── LIVE ROUND BADGE ──────────────────────────────────
  const LiveBadge=()=>isLive?<div style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:8,padding:"6px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:4,background:C.red,animation:"pulse 1.5s infinite"}}/>
    <span style={{fontSize:12,fontWeight:700,color:C.red}}>LIVE</span><span style={{fontSize:12,color:C.text,fontWeight:700,letterSpacing:2}}>{liveData.code}</span></div>
    <div style={{fontSize:10,color:C.muted}}>{liveData.players.length} player{liveData.players.length!==1?"s":""}</div>
  </div>:null;

  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.text}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <div style={{background:C.headerBg,padding:"14px 20px",borderBottom:`2px solid ${C.green}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:34,height:34,borderRadius:"50%",background:C.accent,border:`2px solid ${C.greenLt}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>⛳</div><div><div style={{fontWeight:700,fontSize:17,letterSpacing:2,textTransform:"uppercase"}}>Slide Golf</div><div style={{fontSize:10,color:C.muted,letterSpacing:1}}>LEAGUE TRACKER</div></div></div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>{isLive&&<span style={{fontSize:10,color:C.red,fontWeight:700}}>🔴 LIVE</span>}<span style={{fontSize:12,color:C.greenLt}}>{me}</span><button onClick={()=>{setMe("");try{localStorage.removeItem("sg-me");}catch(e){}}} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:10}}>Switch</button></div>
      </div>

      <div style={{display:"flex",background:C.card,borderBottom:`1px solid ${C.border}`}}>
        {[["home","Home"],["courses","Courses"],["play","Play"],["league","League"],["leaderboard","Board"],["stats","Stats"]].map(([k,l])=>(
          <button key={k} onClick={()=>{setTab(k);if(k==="courses")setCreating(false);if(k!=="home")setShowTourney(false);}} style={{flex:1,padding:"11px 4px",background:tab===k?C.accent:"transparent",color:tab===k?C.white:C.muted,border:"none",cursor:"pointer",fontSize:11,fontWeight:tab===k?700:400,borderBottom:tab===k?`2px solid ${C.greenLt}`:"2px solid transparent"}}>{l}</button>
        ))}
      </div>

      <div style={{maxWidth:600,margin:"0 auto",padding:16}}>

        {/* ═══ HOME ═══ */}
        {tab==="home"&&!showTourney&&(<div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:26,fontWeight:700,letterSpacing:3,textTransform:"uppercase"}}>Slide Golf</div><div style={{color:C.muted,marginTop:4,fontSize:13}}>League Scorecard & Tracker</div></div>
          <button onClick={()=>setTab("play")} style={{...btnS(true),padding:16,fontSize:16,width:"100%"}}>⛳ Start New Round</button>
          {/* ─── JOIN LIVE ROUND ─────────────────────── */}
          <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
            {!showJoin?(<button onClick={()=>setShowJoin(true)} style={{...btnS(false),width:"100%",padding:12,fontSize:14,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",color:C.red}}>📡 Join Live Round</button>
            ):(<div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{fontWeight:600,fontSize:13}}>Enter Room Code</div>
              <div style={{display:"flex",gap:8}}><input value={joinInput} onChange={e=>setJoinInput(e.target.value.toUpperCase().slice(0,4))} placeholder="ABCD" maxLength={4} style={{...inputS,textAlign:"center",fontSize:20,letterSpacing:6,fontWeight:700,textTransform:"uppercase"}}/><button onClick={joinLive} disabled={joinInput.length!==4} style={{...btnS(true),opacity:joinInput.length===4?1:0.4}}>Join</button></div>
              <button onClick={()=>{setShowJoin(false);setJoinInput("");}} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:11}}>Cancel</button>
            </div>)}
          </div>
          {pgaThisWeek&&(<button onClick={()=>setShowTourney(true)} style={{...btnS(false),padding:14,fontSize:14,width:"100%",background:"linear-gradient(135deg,#1a2a4a,#2a3a5a)",border:"1px solid #3a5a8a",color:C.blue}}>
            📺 {pgaThisWeek.tournament}{iMeJoined?" ✓":""}<span style={{fontSize:11,display:"block",opacity:0.7}}>{pgaThisWeek.name} · {tJoined.length} player{tJoined.length!==1?"s":""} entered</span>
          </button>)}
          {!pgaThisWeek&&(<button onClick={()=>alert("No PGA Tour event this week!")} style={{...btnS(false),padding:14,fontSize:14,width:"100%",background:"linear-gradient(135deg,#1a2a4a,#2a3a5a)",border:"1px solid #3a5a8a",color:C.blue}}>📺 No PGA Event This Week</button>)}
          <button onClick={()=>{setCreating(true);resetCreator();setTab("courses");}} style={{...btnS(false),padding:14,fontSize:14,width:"100%",background:"linear-gradient(135deg,#1a3a2a,#2a4a3a)",border:`1px solid ${C.green}`}}>✏️ Create a Course</button>
          <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:600,marginBottom:10,fontSize:14}}>🎲 Generate a Course</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {["Easy","Medium","Hard","Expert"].map(d=>(<button key={d} onClick={()=>handleGenerate(d)} style={{padding:"12px",borderRadius:8,border:`1px solid ${C.border}`,cursor:"pointer",fontWeight:600,fontSize:13,background:d==="Easy"?"rgba(74,170,74,0.15)":d==="Medium"?"rgba(212,184,74,0.15)":d==="Hard"?"rgba(239,68,68,0.15)":"rgba(138,68,239,0.15)",color:d==="Easy"?C.greenLt:d==="Medium"?C.gold:d==="Hard"?C.red:"#b48af8"}}>{d==="Easy"?"🟢":d==="Medium"?"🟡":d==="Hard"?"🔴":"💀"} {d}</button>))}
            </div>
          </div>
          <button onClick={()=>setTab("league")} style={{...btnS(false),padding:14,fontSize:14,width:"100%",background:"linear-gradient(135deg,#2a1a1a,#3a2a1a)",border:"1px solid #5a4a2a",color:C.gold}}>🏆 League — Season 1</button>
          <button onClick={()=>setTab("leaderboard")} style={{...btnS(false),padding:14,fontSize:14,width:"100%"}}>📊 Leaderboard</button>
          <div style={{background:C.card,borderRadius:12,padding:16,border:`1px solid ${C.border}`}}><div style={{fontWeight:600,marginBottom:10}}>Quick Stats</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>{[[playerNames.length,"Players"],[rounds.length,"Rounds"],[allCourses.length,"Courses"]].map(([v,l])=>(<div key={l} style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:700,color:C.greenLt}}>{v}</div><div style={{fontSize:10,color:C.muted}}>{l}</div></div>))}</div></div>
          {rounds.length>0&&(<div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}><div style={{fontWeight:600,marginBottom:8}}>Recent Rounds</div>{rounds.slice(0,5).map(r=>(<div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}><div><span style={{fontWeight:600}}>{r.player}</span><span style={{color:C.muted,fontSize:11,marginLeft:8}}>{r.course}</span></div><div style={{display:"flex",gap:6,alignItems:"center"}}>{r.hidden?<span style={{color:C.muted,fontSize:11}}>🙈</span>:<><span style={{fontWeight:700}}>{r.total}</span><RelPar s={r.total} p={r.par}/></>}{(r.holeOuts||0)>0&&<span style={{fontSize:10,color:C.gold}}>🏌️{r.holeOuts}</span>}</div></div>))}</div>)}
        </div>)}

        {/* ═══ PGA TOURNAMENT PANEL ═══ */}
        {tab==="home"&&showTourney&&pgaThisWeek&&(<div style={{display:"flex",flexDirection:"column",gap:14}}>
          <button onClick={()=>setShowTourney(false)} style={{...btnS(false),padding:"6px 12px",fontSize:12,alignSelf:"flex-start"}}>← Back</button>
          <div style={{background:"linear-gradient(135deg,#1a2a4a,#2a3a5a)",borderRadius:12,padding:16,border:"1px solid #3a5a8a",textAlign:"center"}}><div style={{fontSize:11,color:C.blue,textTransform:"uppercase",letterSpacing:2}}>PGA Tournament</div><div style={{fontSize:20,fontWeight:700,marginTop:4,color:C.white}}>{pgaThisWeek.tournament}</div><div style={{fontSize:13,color:C.blue,marginTop:4}}>{pgaThisWeek.name} · Par {tPar}</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>4 rounds · Lowest total wins</div><div style={{marginTop:8,fontSize:12,color:C.greenLt}}>{tJoined.length} player{tJoined.length!==1?"s":""} entered</div></div>
          <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
            {!iMeJoined?(<><div style={{fontWeight:600,marginBottom:8}}>Join This Tournament</div><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}><div style={{flex:1}}><div style={{fontSize:10,color:C.muted,marginBottom:3}}>Your HD CP (optional)</div><input value={myTHdcp} onChange={e=>setMyTHdcp(e.target.value)} placeholder={String(tPar)} style={{...smallInput,width:"100%",textAlign:"left"}}/></div></div><button onClick={()=>joinTourney(tId)} style={{...btnS(true),width:"100%",padding:12}}>🏌️ Join Tournament</button></>):(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontWeight:600}}>You're In! ✓</div><div style={{fontSize:12,color:C.greenLt}}>{myTRnds.length} of 4 rounds</div></div>
              <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}><div style={{flex:1}}><div style={{fontSize:10,color:C.muted,marginBottom:3}}>Your HD CP</div><input value={myTHdcp} onChange={e=>setMyTHdcp(e.target.value)} placeholder={String(tPar)} style={{...smallInput,width:"100%",textAlign:"left"}}/></div><button onClick={()=>updateMyTourneyHdcp(tId)} style={{...btnS(false),padding:"8px 12px",fontSize:11,marginTop:14}}>Save</button></div>
              <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>{[1,2,3,4].map(r=>{const rd=myTRnds.find(e=>e.round===r);return<div key={r} style={{background:C.card2,borderRadius:8,padding:8,textAlign:"center"}}><div style={{fontSize:9,color:C.muted}}>R{r}</div>{rd?<><div style={{fontSize:16,fontWeight:700}}>{rd.total}</div><RelPar s={rd.total} p={rd.par}/></>:<div style={{fontSize:12,color:C.muted,marginTop:4}}>—</div>}</div>;})}</div>
              {myNextRd<=4&&(<button onClick={()=>playTourneyRound(pgaThisWeek)} style={{...btnS(true),width:"100%",padding:14,marginTop:10,fontSize:15}}>⛳ Play Round {myNextRd}</button>)}
              {myNextRd>4&&<div style={{textAlign:"center",marginTop:10,color:C.gold,fontWeight:600}}>🏆 All 4 rounds complete!</div>}
              <button onClick={()=>playCasualPGA(pgaThisWeek)} style={{...btnS(false),width:"100%",padding:8,marginTop:6,fontSize:11,color:C.muted}}>Play Casual (no tournament)</button>
            </>)}
          </div>
          <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:C.accent}}><span style={{fontWeight:700,fontSize:13}}>Tournament Leaderboard</span><button onClick={()=>setTShowAdj(a=>!a)} style={{background:"transparent",border:`1px solid ${C.border}`,color:tShowAdj?C.blue:C.muted,borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:10}}>{tShowAdj?"Adjusted":"Raw"}</button></div>
            {tBoard.length===0?(<div style={{textAlign:"center",padding:20,color:C.muted,fontSize:12}}>No rounds played yet.</div>):(<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:380}}><thead><tr style={{background:C.card2}}><th style={{padding:"6px 4px",textAlign:"left"}}>#</th><th style={{padding:"6px 4px",textAlign:"left"}}>Player</th><th style={{padding:"6px 3px",textAlign:"center"}}>R1</th><th style={{padding:"6px 3px",textAlign:"center"}}>R2</th><th style={{padding:"6px 3px",textAlign:"center"}}>R3</th><th style={{padding:"6px 3px",textAlign:"center"}}>R4</th><th style={{padding:"6px 4px",textAlign:"center"}}>Tot</th><th style={{padding:"6px 4px",textAlign:"center"}}>+/-</th>{tShowAdj&&<th style={{padding:"6px 4px",textAlign:"center",color:C.blue}}>Adj</th>}</tr></thead><tbody>{tBoard.map((p,i)=>{const toPar=p.tot-p.par;return(<tr key={p.player} style={{borderTop:`1px solid ${C.border}`,background:p.player===me?"rgba(74,170,74,0.06)":"transparent"}}><td style={{padding:"6px 4px",fontWeight:700,color:i===0?C.gold:C.muted}}>{i+1}</td><td style={{padding:"6px 4px",fontWeight:600,fontSize:11}}>{p.player}{p.hd&&<span style={{fontSize:9,color:C.blue,marginLeft:3}}>({p.hd})</span>}</td>{[1,2,3,4].map(r=><td key={r} style={{padding:"6px 3px",textAlign:"center",color:p.rScores[r]?(p.rScores[r].total-p.rScores[r].par<0?C.greenLt:p.rScores[r].total-p.rScores[r].par>0?C.red:C.text):C.muted}}>{p.rScores[r]?p.rScores[r].total:"—"}</td>)}<td style={{padding:"6px 4px",textAlign:"center",fontWeight:700}}>{p.tot}</td><td style={{padding:"6px 4px",textAlign:"center",fontWeight:700,color:toPar<0?C.greenLt:toPar>0?C.red:C.text}}>{toPar===0?"E":toPar>0?`+${toPar}`:toPar}</td>{tShowAdj&&<td style={{padding:"6px 4px",textAlign:"center",color:C.blue,fontWeight:700}}>{p.adjTot!=null?(p.adjTot>0?`+${p.adjTot}`:p.adjTot||"E"):"—"}</td>}</tr>);})}</tbody></table></div>)}
          </div>
          {tJoined.length>0&&(<div style={{background:C.card,borderRadius:8,padding:10,border:`1px solid ${C.border}`}}><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Entered Players</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{tJoined.map(p=>{const hasRnds=curTE.some(e=>e.player===p&&e.round>0);return<span key={p} style={{background:hasRnds?C.accent:C.card2,padding:"3px 8px",borderRadius:12,fontSize:11,color:hasRnds?C.greenLt:C.muted}}>{p}{hasRnds?` (${curTE.filter(e=>e.player===p&&e.round>0).length})`:""}</span>;})}</div></div>)}
        </div>)}

        {/* ═══ LEAGUE ═══ */}
        {tab==="league"&&(<div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{margin:0,fontSize:18}}>🏆 Season 1</h2><span style={{background:"rgba(212,184,74,0.2)",color:C.gold,padding:"3px 10px",borderRadius:12,fontSize:11,fontWeight:600}}>Semifinals</span></div>
          <div style={{display:"flex",gap:4}}>{[["standings","Standings"],["results","Results"],["bracket","Bracket"]].map(([k,l])=>(<button key={k} onClick={()=>setLeagueView(k)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:leagueView===k?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:leagueView===k?C.accent:C.card,color:leagueView===k?C.white:C.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>{l}</button>))}</div>
          {leagueView==="standings"&&(<div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:520}}><thead><tr style={{background:C.accent}}><th style={{padding:"8px 6px",textAlign:"left"}}>#</th><th style={{padding:"8px 4px",textAlign:"left"}}>Player</th><th style={{padding:"8px 4px",textAlign:"center"}}>Pts</th><th style={{padding:"8px 4px",textAlign:"center"}}>W</th><th style={{padding:"8px 4px",textAlign:"center"}}>L</th><th style={{padding:"8px 4px",textAlign:"center"}}>T</th><th style={{padding:"8px 4px",textAlign:"center"}}>Adj+/-</th><th style={{padding:"8px 4px",textAlign:"center"}}>Avg</th><th style={{padding:"8px 4px",textAlign:"center"}}>Tot</th></tr></thead><tbody>{S1_STANDINGS.map((s,i)=>(<tr key={s.p} style={{borderTop:`1px solid ${C.border}`,background:i<7?"rgba(74,170,74,0.04)":"transparent"}}><td style={{padding:"8px 6px",fontWeight:700,color:i===0?C.gold:i<7?C.greenLt:C.muted}}>{i+1}</td><td style={{padding:"8px 4px",fontWeight:600,fontSize:11}}>{s.p}{s.seed>0&&<span style={{fontSize:9,color:C.gold,marginLeft:4}}>#{s.seed}</span>}</td><td style={{padding:"8px 4px",textAlign:"center",fontWeight:700,color:C.gold}}>{s.pts}</td><td style={{padding:"8px 4px",textAlign:"center",color:C.greenLt}}>{s.w}</td><td style={{padding:"8px 4px",textAlign:"center",color:C.red}}>{s.l}</td><td style={{padding:"8px 4px",textAlign:"center",color:C.muted}}>{s.t}</td><td style={{padding:"8px 4px",textAlign:"center",fontWeight:700,color:s.tAdj<0?C.greenLt:s.tAdj>0?C.red:C.muted}}>{s.tAdj>0?`+${s.tAdj}`:s.tAdj}</td><td style={{padding:"8px 4px",textAlign:"center"}}>{s.aScr}</td><td style={{padding:"8px 4px",textAlign:"center",color:C.muted}}>{s.tScr}</td></tr>))}</tbody></table></div><div style={{padding:"8px 12px",background:C.card2,fontSize:10,color:C.muted,borderTop:`1px solid ${C.border}`}}>Top 7 qualify for playoffs · Win=2pts, Tie=1pt</div></div>)}
          {leagueView==="results"&&(<><div style={{display:"flex",gap:4,flexWrap:"wrap"}}><button onClick={()=>setLeagueRdFilter("all")} style={{padding:"5px 10px",borderRadius:6,border:leagueRdFilter==="all"?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:leagueRdFilter==="all"?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:10,fontWeight:600}}>All</button>{[1,2,3,4,5,6].map(rd=>(<button key={rd} onClick={()=>setLeagueRdFilter(String(rd))} style={{padding:"5px 10px",borderRadius:6,border:leagueRdFilter===String(rd)?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:leagueRdFilter===String(rd)?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:10,fontWeight:600}}>R{rd}</button>))}</div>{filteredResults.map(r=>{const[gm,wk,rd,course,p1,s1,p2,s2,winner,diff]=r;const isP1Win=winner===p1;const isP2Win=winner===p2;const isTie=winner==="Tie";return(<div key={gm} style={{background:C.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12}}><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontWeight:isP1Win?700:400,color:isP1Win?C.greenLt:C.text}}>{p1}</span><span style={{fontWeight:700,fontSize:14}}>{s1}</span></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:2}}><span style={{fontWeight:isP2Win?700:400,color:isP2Win?C.greenLt:C.text}}>{p2}</span><span style={{fontWeight:700,fontSize:14}}>{s2}</span></div></div><div style={{textAlign:"right",marginLeft:12,minWidth:80}}><div style={{fontSize:10,color:C.muted}}>{course}</div><div style={{fontSize:10,color:C.muted}}>Wk{wk} R{rd} Gm{gm}</div><div style={{fontWeight:700,fontSize:11,color:isTie?C.muted:C.gold,marginTop:2}}>{isTie?"Tie":diff}</div></div></div>);})}</>)}
          {leagueView==="bracket"&&(<div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{fontSize:13,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:2}}>Quarterfinals</div>
            {S1_PLAYOFFS.filter(g=>g[4]==="QF").map(g=>{const[gm,,,course,,p1,s1,p2,s2,winner,diff]=g;return(<div key={gm} style={{background:C.card,borderRadius:8,padding:10,border:`1px solid ${C.border}`}}><div style={{fontSize:10,color:C.muted,marginBottom:4}}>{course} · Game {gm}</div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:winner===p1?700:400,color:winner===p1?C.greenLt:C.text}}>{p1}</span><span style={{fontWeight:700}}>{s1}</span></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:winner===p2?700:400,color:winner===p2?C.greenLt:C.text}}>{p2}</span><span style={{fontWeight:700}}>{s2}</span></div>{winner&&<div style={{textAlign:"right",fontSize:10,color:C.gold,marginTop:4}}>Winner: {winner} ({diff})</div>}</div>);})}
            <div style={{fontSize:13,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginTop:8}}>Semifinals</div>
            <div style={{background:C.card,borderRadius:8,padding:10,border:`1px solid ${C.border}`}}><div style={{fontSize:10,color:C.muted,marginBottom:4}}>Maitland Palms · Game 34</div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600}}>#1 Ryan Hangartner</span><span style={{color:C.muted}}>vs</span></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600}}>Jeff Gurrister</span><span style={{color:C.gold,fontSize:10}}>In Progress</span></div></div>
            <div style={{background:C.card,borderRadius:8,padding:10,border:`1px solid ${C.border}`}}><div style={{fontSize:10,color:C.muted,marginBottom:4}}>Maitland Palms · Game 35</div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600}}>#2 Jimmie Perkins</span><span style={{color:C.muted}}>vs</span></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600}}>Jon Basorka</span><span style={{color:C.gold,fontSize:10}}>In Progress</span></div></div>
            <div style={{fontSize:13,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginTop:8}}>Finals</div>
            <div style={{background:C.card,borderRadius:8,padding:10,border:`1px solid ${C.gold}`,textAlign:"center"}}><div style={{fontSize:10,color:C.muted,marginBottom:4}}>Nebraska · Game 36</div><div style={{color:C.gold,fontWeight:700}}>🏆 TBD vs TBD</div><div style={{fontSize:10,color:C.muted,marginTop:4}}>Awaiting Semifinal Results</div></div>
          </div>)}
        </div>)}

        {/* ═══ COURSES ═══ */}
        {tab==="courses"&&!creating&&(<div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}><h2 style={{margin:0,fontSize:18}}>Courses</h2><div style={{display:"flex",gap:4,flexWrap:"wrap"}}><button onClick={()=>{setCreating(true);resetCreator();}} style={{...btnS(true),padding:"5px 10px",fontSize:10}}>✏️ Create</button>{["Easy","Medium","Hard","Expert"].map(d=>(<button key={d} onClick={()=>handleGenerate(d)} style={{...btnS(false),padding:"5px 8px",fontSize:10,color:d==="Easy"?C.greenLt:d==="Medium"?C.gold:d==="Hard"?C.red:"#b48af8"}}>+{d}</button>))}</div></div>
          {allCourses.map(c=>{const tp=c.holes.reduce((s,h)=>s+h.par,0);return(<div key={c.id} style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{background:C.headerBg,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,fontSize:14,textTransform:"uppercase",letterSpacing:1}}>{c.name}</div>{c.tournament&&<div style={{fontSize:10,color:C.blue}}>{c.tournament}</div>}</div><span style={{background:c.level==="Hard"?"#6a2222":c.level==="Medium"?"#5a4a1a":c.level==="Expert"?"#4a2a6a":C.green,padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600}}>{c.level}</span></div>
            <div style={{padding:10,overflowX:"auto"}}>{[0,9].map(start=>(<table key={start} style={{width:"100%",borderCollapse:"collapse",fontSize:10,marginBottom:start===0?4:0,minWidth:460}}><thead><tr style={{background:C.accent}}><th style={{padding:"4px 6px",textAlign:"left",fontWeight:700,minWidth:44}}>HOLE</th>{c.holes.slice(start,start+9).map(h=><th key={h.num} style={{padding:"4px 2px",textAlign:"center",minWidth:30}}>{h.num}</th>)}<th style={{padding:"4px 4px",textAlign:"center",fontWeight:700,minWidth:42}}>{start===0?"OUT":"IN"}</th>{start===9&&<th style={{padding:"4px 4px",textAlign:"center",fontWeight:700,minWidth:42}}>TOT</th>}</tr></thead><tbody><tr style={{background:C.card2}}><td style={{padding:"3px 6px",fontWeight:600,color:C.greenLt,fontSize:9}}>RANGE</td>{c.holes.slice(start,start+9).map(h=><td key={h.num} style={{padding:"2px 1px",textAlign:"center",fontSize:9,color:C.muted}}>{fmtR(h.range)}</td>)}<td style={{textAlign:"center",fontSize:9,color:C.muted}}>{fmtRange(c.holes,start,start+9)}</td>{start===9&&<td style={{textAlign:"center",fontSize:9,color:C.muted}}>{fmtRange(c.holes,0,18)}</td>}</tr><tr><td style={{padding:"3px 6px",fontWeight:600}}>PAR</td>{c.holes.slice(start,start+9).map(h=><td key={h.num} style={{padding:"2px",textAlign:"center"}}>{h.par}</td>)}<td style={{textAlign:"center",fontWeight:700}}>{calcPar(c.holes,start,start+9)}</td>{start===9&&<td style={{textAlign:"center",fontWeight:700,color:C.greenLt}}>{tp}</td>}</tr></tbody></table>))}</div>
            <div style={{padding:"6px 10px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between"}}>{c.generated?<button onClick={()=>deleteCourseFromDB(c.id)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:11}}>Remove</button>:<div/>}<button onClick={()=>startRound(c)} style={{...btnS(true),padding:"6px 14px",fontSize:11}}>Play</button></div></div>);})}
        </div>)}

        {/* ═══ COURSE CREATOR ═══ */}
        {tab==="courses"&&creating&&(<div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{margin:0,fontSize:18}}>✏️ Create Course</h2><button onClick={()=>setCreating(false)} style={{...btnS(false),padding:"4px 10px",fontSize:11}}>Cancel</button></div>
          <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:10}}><div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Course Name</div><input value={ccName} onChange={e=>setCcName(e.target.value)} placeholder="e.g. Pebble Beach" style={inputS}/></div><div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Tournament (optional)</div><input value={ccTournament} onChange={e=>setCcTournament(e.target.value)} placeholder="e.g. AT&T Pro-Am" style={inputS}/></div><div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Difficulty</div><div style={{display:"flex",gap:6}}>{["Easy","Medium","Hard","Expert"].map(d=>(<button key={d} onClick={()=>setCcLevel(d)} style={{flex:1,padding:"8px 4px",borderRadius:6,border:ccLevel===d?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:ccLevel===d?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:11,fontWeight:ccLevel===d?700:400}}>{d}</button>))}</div></div></div>
          <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{display:"flex"}}><button onClick={()=>setCcNine(0)} style={{flex:1,padding:10,background:ccNine===0?C.accent:"transparent",color:ccNine===0?C.white:C.muted,border:"none",cursor:"pointer",fontWeight:600,fontSize:12}}>Front 9</button><button onClick={()=>setCcNine(1)} style={{flex:1,padding:10,background:ccNine===1?C.accent:"transparent",color:ccNine===1?C.white:C.muted,border:"none",cursor:"pointer",fontWeight:600,fontSize:12}}>Back 9</button></div>
            <div style={{padding:10}}>{ccHoles.slice(ccNine*9,ccNine*9+9).map((h,i)=>{const idx=ccNine*9+i;return(<div key={h.num} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}><div style={{width:36,fontWeight:700,fontSize:13,color:C.greenLt}}>#{h.num}</div><div style={{flex:1}}><div style={{fontSize:9,color:C.muted,marginBottom:3}}>PAR</div><div style={{display:"flex",gap:4}}>{[3,4,5].map(p=>(<button key={p} onClick={()=>setCcHolePar(idx,p)} style={{width:32,height:28,borderRadius:6,border:h.par===p?`2px solid ${C.greenLt}`:`1px solid ${C.border}`,background:h.par===p?C.accent:C.card2,color:C.text,cursor:"pointer",fontSize:13,fontWeight:700}}>{p}</button>))}</div></div><div style={{flex:1}}><div style={{fontSize:9,color:C.muted,marginBottom:3}}>RANGE</div><div style={{display:"flex",gap:4,alignItems:"center"}}><input value={h.rangeMin} onChange={e=>setCcHoleRange(idx,"rangeMin",e.target.value)} style={{...smallInput,width:40}}/><span style={{color:C.muted,fontSize:11}}>-</span><input value={h.rangeMax} onChange={e=>setCcHoleRange(idx,"rangeMax",e.target.value)} style={{...smallInput,width:40}}/></div></div></div>);})}</div>
            <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,background:C.card2,display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{color:C.muted}}>{ccNine===0?"Front":"Back"} 9 Par: <strong style={{color:C.text}}>{ccHoles.slice(ccNine*9,ccNine*9+9).reduce((s,h)=>s+h.par,0)}</strong></span><span style={{color:C.muted}}>Total Par: <strong style={{color:C.greenLt}}>{ccHoles.reduce((s,h)=>s+h.par,0)}</strong></span></div></div>
          <button onClick={saveCreatedCourse} disabled={!ccName.trim()} style={{...btnS(true),width:"100%",padding:14,fontSize:15,opacity:ccName.trim()?1:0.5}}>💾 Save Course</button>
        </div>)}

        {/* ═══ PLAY ═══ */}
        {tab==="play"&&(<div style={{display:"flex",flexDirection:"column",gap:14}}>
          {!selCourse&&(<><h2 style={{margin:0,fontSize:18}}>Select Course</h2>{pgaThisWeek&&(<button onClick={()=>{setShowTourney(true);setTab("home");}} style={{...btnS(false),width:"100%",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(135deg,#1a2a4a,#2a3a5a)",border:"1px solid #3a5a8a"}}><span style={{fontWeight:600,color:C.blue}}>📺 {pgaThisWeek.tournament}</span><span style={{fontSize:11,opacity:0.7,color:C.blue}}>Tournament</span></button>)}{allCourses.map(c=>(<button key={c.id} onClick={()=>{setSelCourse(c);setRoundPlayers([]);setAllScores({});setAllShotLogs({});setPlayMode("setup");setActiveTourney(null);}} style={{...btnS(false),width:"100%",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontWeight:600}}>{c.name}</span><span style={{fontSize:11,opacity:0.7}}>Par {c.holes.reduce((s,h)=>s+h.par,0)} · {c.level}</span></button>))}</>)}

          {selCourse&&playMode==="setup"&&(<>
            {activeTourney&&(<div style={{background:"linear-gradient(135deg,#1a2a4a,#2a3a5a)",borderRadius:10,padding:10,border:"1px solid #3a5a8a",textAlign:"center"}}><div style={{fontSize:11,color:C.blue}}>🏌️ Tournament Round {activeTourney.round}</div><div style={{fontSize:13,fontWeight:700,color:C.white}}>{activeTourney.tournament}</div></div>)}
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
            {useHdcp&&roundPlayers.length>0&&(<div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}><div style={{fontWeight:600,marginBottom:8,fontSize:13}}>Handicap Course Par</div>{roundPlayers.map(p=>(<div key={p} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:12,fontWeight:600}}>{p}</span><input value={hdcps[p]||""} onChange={e=>setHdcps(h=>({...h,[p]:parseInt(e.target.value)||0}))} placeholder="72" style={{...smallInput,width:50}}/></div>))}</div>)}
            {/* ─── GO LIVE BUTTON ─────────────────────── */}
            {!isLive&&roundPlayers.length>0&&(
              <div style={{background:"red",padding:20,color:"white",fontSize:20}}>GO LIVE SHOULD BE HERE - isLive:{String(isLive)} players:{roundPlayers.length}</div>
            )}
            {isLive&&(<div style={{background:C.card,borderRadius:12,padding:14,border:"1px solid rgba(239,68,68,0.3)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:4,background:C.red,animation:"pulse 1.5s infinite"}}/><span style={{fontWeight:700,color:C.red,fontSize:13}}>LIVE ROUND</span></div>
                <button onClick={leaveLive} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:10}}>End Live</button>
              </div>
              <div style={{textAlign:"center",padding:"8px 0"}}><div style={{fontSize:11,color:C.muted}}>Share this code with friends:</div><div style={{fontSize:36,fontWeight:700,letterSpacing:8,color:C.white,marginTop:4}}>{liveData.code}</div></div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:8}}>{liveData.players.map(p=><span key={p} style={{background:C.accent,padding:"3px 8px",borderRadius:12,fontSize:11,color:p===me?C.greenLt:C.text}}>{p}{p===me?" (you)":""}</span>)}</div>
            </div>)}
            {roundPlayers.length>0&&(<div style={{display:"flex",gap:8}}><button onClick={beginPlay} style={{...btnS(true),flex:1,padding:14,fontSize:15}}>⛳ Shot-by-Shot</button><button onClick={()=>setPlayMode("quick")} style={{...btnS(false),padding:14,fontSize:12}}>Quick Score</button></div>)}
          </>)}

          {/* ═══ SHOT-BY-SHOT ═══ */}
          {selCourse&&playMode==="holes"&&curHD&&curHS&&(<>
            {showScorecard&&(<div style={{background:C.card,borderRadius:12,border:`1px solid ${C.greenLt}`,overflow:"hidden"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:C.accent}}><span style={{fontWeight:700,fontSize:13}}>📋 Scorecard</span><button onClick={()=>setShowScorecard(false)} style={{background:"transparent",border:"none",color:C.text,cursor:"pointer",fontSize:14}}>✕</button></div>
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
                      <tr style={{background:C.card2}}><td style={{padding:"2px 4px",fontWeight:600,color:C.greenLt,fontSize:8}}>RNG</td>{selCourse.holes.slice(start,start+9).map(h=><td key={h.num} style={{textAlign:"center",fontSize:7,color:C.muted}}>{fmtR(h.range)}</td>)}<td style={{textAlign:"center",fontSize:7,color:C.muted}}>{fmtRange(selCourse.holes,start,start+9)}</td>{start===9&&<td style={{textAlign:"center",fontSize:7,color:C.muted}}>{fmtRange(selCourse.holes,0,18)}</td>}</tr>
                      <tr><td style={{padding:"2px 4px",fontWeight:600,fontSize:9}}>PAR</td>{selCourse.holes.slice(start,start+9).map(h=><td key={h.num} style={{textAlign:"center",padding:"2px 1px"}}>{h.par}</td>)}<td style={{textAlign:"center",fontWeight:700}}>{calcPar(selCourse.holes,start,start+9)}</td>{start===9&&<td style={{textAlign:"center",fontWeight:700,color:C.greenLt}}>{selCourse.holes.reduce((s,h)=>s+h.par,0)}</td>}</tr>
                      {!hideScores&&roundPlayers.map(p=>{
                        const sc=allScores[p]||Array(18).fill(null);
                        return(<tr key={p} style={{borderTop:`1px solid ${C.border}`}}>
                          <td style={{padding:"2px 4px",fontWeight:600,fontSize:8}}>{p}{isLive&&p!==me?<span style={{color:C.blue,fontSize:7}}> 📡</span>:""}</td>
                          {selCourse.holes.slice(start,start+9).map((h,i)=>{const idx=start+i;const v=sc[idx];const un=v!==null&&v<h.par;const ov=v!==null&&v>h.par;
                            return <td key={h.num} style={{textAlign:"center",fontSize:9,fontWeight:700,color:un?C.greenLt:ov?"#ff6b6b":v!==null?C.text:C.muted,background:h.num-1===curHole?"rgba(74,170,74,0.1)":"transparent"}}>{v??"-"}</td>;
                          })}
                          <td style={{textAlign:"center",fontWeight:700,fontSize:9}}>{sc.slice(start,start+9).reduce((s,v)=>s+(v||0),0)||"-"}</td>
                          {start===9&&<td style={{textAlign:"center",fontWeight:700,fontSize:9,color:C.greenLt}}>{sc.reduce((s,v)=>s+(v||0),0)||"-"}</td>}
                        </tr>);
                      })}
                    </tbody>
                  </table>
                ))}
              </div>
            </div>)}
            <LiveBadge/>
            {activeTourney&&(<div style={{background:"linear-gradient(135deg,#1a2a4
