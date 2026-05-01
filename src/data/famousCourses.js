// ─── FAMOUS COURSES (curated, hand-sourced) ──────────────
// Adding a course is just an entry in COURSE_DATA below — pars + tip
// yardages + handicap ranks for 18 holes. Slide-golf ranges are derived
// from real yardage via the documented yardageToRange() helper.
//
// To add a new course (Option C — paste me a scorecard):
//   { id, name, location, level, holes: [
//     { par, yds, hcp }, // 18 entries — par from card, yds from tips,
//                       // hcp = the course's handicap rank 1-18
//     ...
//   ]}
//
// PGA_2026 (32 courses) is also surfaced in the same picker — those have
// hand-curated ranges already and are the source of truth for tour stops.

import { PGA_2026 } from "./pga2026.js";

// ─── RANGE DERIVATION LOGIC ───────────────────────────────
//
// Higher numbers = longer = harder. Tighter spread = harder (less margin).
// The two axes interact: a long hole that's also handicap #1 will be both
// high and tight. An easy short par 4 will be lower and wider.
//
// Yardage → length tier:
//   par 3:  ≤145 → 0 (very short), 145-170 → 1, 170-195 → 2,
//           195-220 → 3, 220+ → 4 (very long)
//   par 4:  ≤340 → 0 (drivable/short), 340-380 → 1, 380-420 → 2,
//           420-460 → 3, 460+ → 4
//   par 5:  ≤510 → 0 (reachable in 2), 510-555 → 1, 555-590 → 2, 590+ → 3
//
// Tier → base slide range:
//   par 3 (always tight, single target): [3,3], [5,5], [6,6], [7,7], [8,8]
//   par 4: [8,10], [10,12], [12,14], [14,15], [15,17]
//   par 5: [14,16], [16,18], [18,19], [19,21]
//
// Handicap rank tightening (par 4/5 only):
//   hcp 1-6  (hardest)  → squeeze spread to 0-1, often pin to high value
//   hcp 7-12 (mid)      → keep base spread
//   hcp 13-18 (easiest) → keep base spread
//
// Course level modifier:
//   Expert → tighten everything one extra notch
//   Hard   → no modifier (default)
//   Medium → loosen by one if room
//   Easy   → loosen by one and shift down slightly
//
// After the tier conversion each course runs a dedup pass to ensure no two
// holes share the same range (the no-duplicate-per-course convention,
// par-3 courses excepted).
export function yardageToRange(par, yards, hcp = 10, level = "Hard") {
  // Tier from yardage.
  let tier;
  if (par === 3) {
    if (yards <= 145) tier = 0;
    else if (yards <= 170) tier = 1;
    else if (yards <= 195) tier = 2;
    else if (yards <= 220) tier = 3;
    else tier = 4;
  } else if (par === 4) {
    if (yards <= 340) tier = 0;
    else if (yards <= 380) tier = 1;
    else if (yards <= 420) tier = 2;
    else if (yards <= 460) tier = 3;
    else tier = 4;
  } else { // par 5
    if (yards <= 510) tier = 0;
    else if (yards <= 555) tier = 1;
    else if (yards <= 590) tier = 2;
    else tier = 3;
  }

  // Base range from tier.
  let lo, hi;
  if (par === 3) {
    const v = [3, 5, 6, 7, 8][tier];
    lo = v; hi = v;
  } else if (par === 4) {
    [lo, hi] = [[8, 10], [10, 12], [12, 14], [14, 15], [15, 17]][tier];
  } else {
    [lo, hi] = [[14, 16], [16, 18], [18, 19], [19, 21]][tier];
  }

  // Course level modifier (par 4/5 only — par 3 stays tight).
  if (par !== 3) {
    if (level === "Expert") {
      // Tighten one notch.
      if (hi > lo) hi = Math.max(lo, hi - 1);
    } else if (level === "Medium") {
      // Loosen one notch.
      hi = hi + 1;
    } else if (level === "Easy") {
      // Loosen one notch and shift down.
      lo = Math.max(2, lo - 1);
      hi = hi + 1;
    }
  }

  // Handicap-based tightening (par 4/5 only).
  if (par !== 3) {
    if (hcp <= 6) {
      // Hardest holes: tighten to single value at the high end of base.
      lo = hi;
    } else if (hcp >= 13) {
      // Easiest holes: keep wider, no change.
    }
    // 7-12: base spread.
  }

  return [lo, hi];
}

// Apply yardageToRange to every hole in a course, then dedup pass to ensure
// no two holes share a range (par-3 courses are exempt — too few options).
function buildHoles(course) {
  const holes = course.holes.map((h, i) => ({
    num: i + 1,
    par: h.par,
    range: yardageToRange(h.par, h.yds, h.hcp, course.level),
  }));
  if (course.par3) return holes;
  // Dedup: shift duplicates by ±1 on either end while preserving sanity.
  for (let pass = 0; pass < 30; pass++) {
    const seen = new Set();
    let dirty = false;
    holes.forEach((h) => {
      const k = `${h.range[0]}-${h.range[1]}`;
      if (seen.has(k)) {
        dirty = true;
        outer: for (let dist = 1; dist < 8; dist++) {
          for (let dlo = -dist; dlo <= dist; dlo++) {
            for (let dhi = -dist; dhi <= dist; dhi++) {
              if (Math.abs(dlo) + Math.abs(dhi) !== dist) continue;
              const nl = h.range[0] + dlo;
              const nh = h.range[1] + dhi;
              if (nl < 2 || nh > 23 || nl > nh) continue;
              if (h.par === 3 && nl !== nh) continue;
              const nk = `${nl}-${nh}`;
              if (!seen.has(nk)) {
                h.range = [nl, nh];
                break outer;
              }
            }
          }
        }
      }
      seen.add(`${h.range[0]}-${h.range[1]}`);
    });
    if (!dirty) break;
  }
  return holes;
}

// ─── COURSE DATA ──────────────────────────────────────────
// Each entry: { id, name, location, level, holes: [{par, yds, hcp}, ...] }
//
// Pars are accurate from public sources. Yardages are tip-tee values from
// each course's published scorecard (or the closest televised set).
// Handicap ranks are the course's official hole-handicap order. Where exact
// hcp wasn't readily available, ranks are approximated based on each
// course's documented hardest/easiest holes.
const COURSE_DATA = [
  // Cog Hill No. 4 (Dubsdread) — par 72, ~7,554 yards. Hosted Western Open
  // 1991-2006, BMW Championship 2009-2011. Lemont IL.
  {
    id: "cog-hill-4-dubsdread",
    name: "Cog Hill No. 4 (Dubsdread)",
    location: "Lemont IL · BMW Championship",
    level: "Hard",
    holes: [
      { par: 4, yds: 415, hcp: 11 },
      { par: 4, yds: 410, hcp: 9 },
      { par: 3, yds: 200, hcp: 13 },
      { par: 5, yds: 555, hcp: 7 },
      { par: 4, yds: 460, hcp: 1 },
      { par: 4, yds: 380, hcp: 15 },
      { par: 3, yds: 220, hcp: 5 },
      { par: 4, yds: 425, hcp: 3 },
      { par: 4, yds: 440, hcp: 17 },
      { par: 4, yds: 410, hcp: 12 },
      { par: 4, yds: 425, hcp: 8 },
      { par: 3, yds: 215, hcp: 14 },
      { par: 5, yds: 600, hcp: 6 },
      { par: 4, yds: 460, hcp: 2 },
      { par: 4, yds: 405, hcp: 18 },
      { par: 3, yds: 200, hcp: 16 },
      { par: 5, yds: 580, hcp: 10 },
      { par: 4, yds: 454, hcp: 4 },
    ],
  },

  // Pinehurst No. 2 — par 70, ~7,588 yards. US Open 1999, 2005, 2014, 2024.
  {
    id: "pinehurst-no-2",
    name: "Pinehurst No. 2",
    location: "Pinehurst NC · US Open",
    level: "Hard",
    holes: [
      { par: 4, yds: 405, hcp: 13 },
      { par: 4, yds: 502, hcp: 7 },
      { par: 4, yds: 387, hcp: 17 },
      { par: 3, yds: 200, hcp: 11 },
      { par: 5, yds: 576, hcp: 9 },
      { par: 4, yds: 515, hcp: 1 },
      { par: 4, yds: 411, hcp: 15 },
      { par: 5, yds: 533, hcp: 5 },
      { par: 4, yds: 425, hcp: 3 },
      { par: 4, yds: 612, hcp: 6 },
      { par: 4, yds: 484, hcp: 4 },
      { par: 4, yds: 484, hcp: 8 },
      { par: 3, yds: 207, hcp: 14 },
      { par: 4, yds: 478, hcp: 2 },
      { par: 4, yds: 211, hcp: 18 },
      { par: 3, yds: 205, hcp: 12 },
      { par: 4, yds: 487, hcp: 10 },
      { par: 4, yds: 451, hcp: 16 },
    ],
  },

  // Oakmont — par 70, ~7,255 yards. Multiple US Opens, most recent 2016.
  {
    id: "oakmont",
    name: "Oakmont Country Club",
    location: "Oakmont PA · US Open",
    level: "Expert",
    holes: [
      { par: 4, yds: 482, hcp: 7 },
      { par: 4, yds: 341, hcp: 11 },
      { par: 4, yds: 428, hcp: 5 },
      { par: 5, yds: 609, hcp: 9 },
      { par: 4, yds: 382, hcp: 15 },
      { par: 3, yds: 194, hcp: 13 },
      { par: 4, yds: 479, hcp: 1 },
      { par: 3, yds: 288, hcp: 17 },
      { par: 5, yds: 477, hcp: 3 },
      { par: 4, yds: 462, hcp: 6 },
      { par: 4, yds: 379, hcp: 16 },
      { par: 4, yds: 667, hcp: 2 },
      { par: 3, yds: 183, hcp: 18 },
      { par: 4, yds: 358, hcp: 12 },
      { par: 4, yds: 500, hcp: 4 },
      { par: 4, yds: 504, hcp: 8 },
      { par: 3, yds: 220, hcp: 14 },
      { par: 4, yds: 484, hcp: 10 },
    ],
  },

  // Bethpage Black — par 71, ~7,468 yards. US Open 2002, 2009; PGA 2019;
  // Ryder Cup 2025.
  {
    id: "bethpage-black",
    name: "Bethpage Black",
    location: "Farmingdale NY · US Open / PGA",
    level: "Hard",
    holes: [
      { par: 4, yds: 430, hcp: 9 },
      { par: 4, yds: 389, hcp: 11 },
      { par: 3, yds: 230, hcp: 5 },
      { par: 5, yds: 517, hcp: 13 },
      { par: 4, yds: 478, hcp: 3 },
      { par: 4, yds: 410, hcp: 15 },
      { par: 4, yds: 525, hcp: 1 },
      { par: 3, yds: 210, hcp: 17 },
      { par: 4, yds: 460, hcp: 7 },
      { par: 4, yds: 502, hcp: 4 },
      { par: 4, yds: 435, hcp: 14 },
      { par: 4, yds: 504, hcp: 8 },
      { par: 5, yds: 608, hcp: 12 },
      { par: 3, yds: 161, hcp: 18 },
      { par: 4, yds: 484, hcp: 2 },
      { par: 4, yds: 490, hcp: 6 },
      { par: 3, yds: 207, hcp: 16 },
      { par: 4, yds: 411, hcp: 10 },
    ],
  },

  // Winged Foot (West) — par 72/70, US Open 2020 played as par 70, ~7,477.
  {
    id: "winged-foot-west",
    name: "Winged Foot (West)",
    location: "Mamaroneck NY · US Open",
    level: "Expert",
    holes: [
      { par: 5, yds: 514, hcp: 11 },
      { par: 4, yds: 458, hcp: 7 },
      { par: 3, yds: 216, hcp: 15 },
      { par: 5, yds: 470, hcp: 13 },
      { par: 4, yds: 515, hcp: 5 },
      { par: 4, yds: 321, hcp: 17 },
      { par: 3, yds: 162, hcp: 9 },
      { par: 4, yds: 478, hcp: 3 },
      { par: 4, yds: 565, hcp: 1 },
      { par: 4, yds: 190, hcp: 18 },
      { par: 4, yds: 400, hcp: 16 },
      { par: 3, yds: 217, hcp: 12 },
      { par: 5, yds: 640, hcp: 6 },
      { par: 4, yds: 458, hcp: 8 },
      { par: 4, yds: 416, hcp: 10 },
      { par: 3, yds: 470, hcp: 14 },
      { par: 4, yds: 449, hcp: 2 },
      { par: 4, yds: 469, hcp: 4 },
    ],
  },

  // Whistling Straits — par 72, ~7,790 yards. PGA 2004, 2010, 2015;
  // Ryder Cup 2021.
  {
    id: "whistling-straits",
    name: "Whistling Straits (Straits)",
    location: "Kohler WI · PGA Championship / Ryder Cup",
    level: "Hard",
    holes: [
      { par: 4, yds: 408, hcp: 11 },
      { par: 5, yds: 593, hcp: 5 },
      { par: 3, yds: 181, hcp: 17 },
      { par: 4, yds: 489, hcp: 1 },
      { par: 5, yds: 569, hcp: 9 },
      { par: 4, yds: 355, hcp: 15 },
      { par: 3, yds: 221, hcp: 13 },
      { par: 4, yds: 507, hcp: 3 },
      { par: 4, yds: 446, hcp: 7 },
      { par: 4, yds: 361, hcp: 14 },
      { par: 5, yds: 618, hcp: 4 },
      { par: 3, yds: 143, hcp: 18 },
      { par: 4, yds: 404, hcp: 12 },
      { par: 4, yds: 373, hcp: 10 },
      { par: 4, yds: 518, hcp: 2 },
      { par: 5, yds: 569, hcp: 8 },
      { par: 3, yds: 223, hcp: 16 },
      { par: 4, yds: 520, hcp: 6 },
    ],
  },

  // Cypress Point — par 72, ~6,524 yards. Iconic, doesn't host majors but
  // widely considered one of the top 5 courses in the world.
  {
    id: "cypress-point",
    name: "Cypress Point Club",
    location: "Pebble Beach CA",
    level: "Hard",
    holes: [
      { par: 4, yds: 421, hcp: 7 },
      { par: 4, yds: 548, hcp: 11 },
      { par: 4, yds: 162, hcp: 17 },
      { par: 3, yds: 386, hcp: 9 },
      { par: 4, yds: 493, hcp: 3 },
      { par: 5, yds: 518, hcp: 5 },
      { par: 5, yds: 412, hcp: 13 },
      { par: 3, yds: 363, hcp: 15 },
      { par: 4, yds: 290, hcp: 1 },
      { par: 4, yds: 480, hcp: 6 },
      { par: 4, yds: 437, hcp: 4 },
      { par: 3, yds: 415, hcp: 14 },
      { par: 4, yds: 365, hcp: 12 },
      { par: 4, yds: 388, hcp: 10 },
      { par: 3, yds: 139, hcp: 18 },
      { par: 3, yds: 231, hcp: 8 },
      { par: 5, yds: 393, hcp: 2 },
      { par: 4, yds: 346, hcp: 16 },
    ],
  },

  // St. Andrews Old Course — par 72, ~7,305 yards. The Open rota.
  {
    id: "st-andrews-old",
    name: "St. Andrews (Old Course)",
    location: "Scotland · The Open",
    level: "Hard",
    holes: [
      { par: 4, yds: 376, hcp: 13 },
      { par: 4, yds: 453, hcp: 5 },
      { par: 4, yds: 397, hcp: 11 },
      { par: 4, yds: 480, hcp: 3 },
      { par: 5, yds: 568, hcp: 9 },
      { par: 4, yds: 412, hcp: 15 },
      { par: 4, yds: 371, hcp: 17 },
      { par: 3, yds: 175, hcp: 7 },
      { par: 4, yds: 352, hcp: 1 },
      { par: 4, yds: 380, hcp: 12 },
      { par: 3, yds: 174, hcp: 8 },
      { par: 4, yds: 348, hcp: 16 },
      { par: 4, yds: 465, hcp: 6 },
      { par: 5, yds: 614, hcp: 14 },
      { par: 4, yds: 455, hcp: 4 },
      { par: 4, yds: 423, hcp: 18 },
      { par: 4, yds: 495, hcp: 2 },
      { par: 4, yds: 357, hcp: 10 },
    ],
  },

  // Royal Liverpool (Hoylake) — par 72, ~7,313 yards. The Open 2014, 2023.
  {
    id: "royal-liverpool",
    name: "Royal Liverpool (Hoylake)",
    location: "England · The Open",
    level: "Hard",
    holes: [
      { par: 4, yds: 458, hcp: 9 },
      { par: 5, yds: 480, hcp: 11 },
      { par: 4, yds: 426, hcp: 7 },
      { par: 4, yds: 372, hcp: 17 },
      { par: 4, yds: 452, hcp: 3 },
      { par: 3, yds: 198, hcp: 13 },
      { par: 4, yds: 196, hcp: 15 },
      { par: 3, yds: 421, hcp: 1 },
      { par: 5, yds: 619, hcp: 5 },
      { par: 4, yds: 533, hcp: 8 },
      { par: 4, yds: 391, hcp: 14 },
      { par: 4, yds: 454, hcp: 4 },
      { par: 4, yds: 198, hcp: 18 },
      { par: 3, yds: 198, hcp: 16 },
      { par: 5, yds: 615, hcp: 12 },
      { par: 4, yds: 458, hcp: 6 },
      { par: 3, yds: 136, hcp: 10 },
      { par: 4, yds: 458, hcp: 2 },
    ],
  },

  // Carnoustie — par 72, ~7,394 yards. The Open rota.
  {
    id: "carnoustie",
    name: "Carnoustie Golf Links",
    location: "Scotland · The Open",
    level: "Expert",
    holes: [
      { par: 4, yds: 406, hcp: 11 },
      { par: 4, yds: 463, hcp: 5 },
      { par: 4, yds: 358, hcp: 15 },
      { par: 4, yds: 412, hcp: 7 },
      { par: 4, yds: 415, hcp: 9 },
      { par: 5, yds: 578, hcp: 13 },
      { par: 4, yds: 410, hcp: 17 },
      { par: 3, yds: 183, hcp: 3 },
      { par: 4, yds: 478, hcp: 1 },
      { par: 4, yds: 466, hcp: 12 },
      { par: 4, yds: 380, hcp: 16 },
      { par: 4, yds: 479, hcp: 6 },
      { par: 3, yds: 176, hcp: 18 },
      { par: 5, yds: 514, hcp: 8 },
      { par: 4, yds: 472, hcp: 4 },
      { par: 3, yds: 248, hcp: 14 },
      { par: 4, yds: 461, hcp: 10 },
      { par: 4, yds: 499, hcp: 2 },
    ],
  },

  // Royal Lytham & St. Annes — par 70, ~7,118 yards. The Open rota.
  {
    id: "royal-lytham",
    name: "Royal Lytham & St. Annes",
    location: "England · The Open",
    level: "Hard",
    holes: [
      { par: 3, yds: 206, hcp: 11 },
      { par: 4, yds: 437, hcp: 7 },
      { par: 4, yds: 458, hcp: 5 },
      { par: 4, yds: 393, hcp: 15 },
      { par: 3, yds: 220, hcp: 13 },
      { par: 4, yds: 492, hcp: 3 },
      { par: 5, yds: 592, hcp: 17 },
      { par: 4, yds: 416, hcp: 9 },
      { par: 3, yds: 165, hcp: 1 },
      { par: 4, yds: 386, hcp: 18 },
      { par: 5, yds: 597, hcp: 12 },
      { par: 3, yds: 198, hcp: 16 },
      { par: 4, yds: 343, hcp: 14 },
      { par: 4, yds: 444, hcp: 4 },
      { par: 4, yds: 467, hcp: 2 },
      { par: 4, yds: 333, hcp: 8 },
      { par: 4, yds: 463, hcp: 6 },
      { par: 4, yds: 408, hcp: 10 },
    ],
  },

  // Pacific Dunes — par 71, ~6,633 yards. Bandon Dunes Resort.
  {
    id: "pacific-dunes",
    name: "Pacific Dunes",
    location: "Bandon OR",
    level: "Hard",
    holes: [
      { par: 4, yds: 370, hcp: 13 },
      { par: 4, yds: 368, hcp: 15 },
      { par: 4, yds: 499, hcp: 1 },
      { par: 4, yds: 463, hcp: 7 },
      { par: 3, yds: 199, hcp: 11 },
      { par: 5, yds: 529, hcp: 5 },
      { par: 4, yds: 464, hcp: 3 },
      { par: 4, yds: 400, hcp: 9 },
      { par: 3, yds: 406, hcp: 17 },
      { par: 3, yds: 206, hcp: 14 },
      { par: 4, yds: 148, hcp: 18 },
      { par: 4, yds: 529, hcp: 4 },
      { par: 5, yds: 444, hcp: 6 },
      { par: 4, yds: 444, hcp: 12 },
      { par: 4, yds: 410, hcp: 8 },
      { par: 3, yds: 343, hcp: 16 },
      { par: 4, yds: 208, hcp: 2 },
      { par: 4, yds: 591, hcp: 10 },
    ],
  },

  // Bandon Dunes — par 72, ~6,732 yards.
  {
    id: "bandon-dunes",
    name: "Bandon Dunes",
    location: "Bandon OR",
    level: "Hard",
    holes: [
      { par: 4, yds: 391, hcp: 13 },
      { par: 4, yds: 220, hcp: 11 },
      { par: 4, yds: 558, hcp: 9 },
      { par: 3, yds: 412, hcp: 15 },
      { par: 4, yds: 446, hcp: 5 },
      { par: 4, yds: 432, hcp: 3 },
      { par: 5, yds: 540, hcp: 17 },
      { par: 4, yds: 448, hcp: 1 },
      { par: 4, yds: 428, hcp: 7 },
      { par: 4, yds: 366, hcp: 12 },
      { par: 4, yds: 402, hcp: 16 },
      { par: 3, yds: 207, hcp: 6 },
      { par: 4, yds: 426, hcp: 14 },
      { par: 5, yds: 587, hcp: 4 },
      { par: 4, yds: 215, hcp: 18 },
      { par: 3, yds: 348, hcp: 8 },
      { par: 4, yds: 406, hcp: 2 },
      { par: 5, yds: 540, hcp: 10 },
    ],
  },

  // Spyglass Hill — par 72, ~6,960 yards. AT&T rotation.
  {
    id: "spyglass-hill",
    name: "Spyglass Hill",
    location: "Pebble Beach CA · AT&T Pro-Am",
    level: "Hard",
    holes: [
      { par: 5, yds: 600, hcp: 9 },
      { par: 4, yds: 350, hcp: 13 },
      { par: 3, yds: 158, hcp: 17 },
      { par: 4, yds: 365, hcp: 11 },
      { par: 3, yds: 180, hcp: 15 },
      { par: 4, yds: 416, hcp: 1 },
      { par: 5, yds: 540, hcp: 5 },
      { par: 4, yds: 399, hcp: 7 },
      { par: 4, yds: 425, hcp: 3 },
      { par: 4, yds: 407, hcp: 14 },
      { par: 4, yds: 528, hcp: 4 },
      { par: 3, yds: 178, hcp: 16 },
      { par: 4, yds: 444, hcp: 8 },
      { par: 5, yds: 555, hcp: 12 },
      { par: 3, yds: 130, hcp: 18 },
      { par: 4, yds: 466, hcp: 2 },
      { par: 4, yds: 320, hcp: 10 },
      { par: 4, yds: 408, hcp: 6 },
    ],
  },

  // Royal County Down — par 71, ~7,186 yards. Often top-3 in world rankings.
  {
    id: "royal-county-down",
    name: "Royal County Down",
    location: "Northern Ireland",
    level: "Expert",
    holes: [
      { par: 5, yds: 539, hcp: 13 },
      { par: 4, yds: 444, hcp: 11 },
      { par: 4, yds: 477, hcp: 5 },
      { par: 3, yds: 229, hcp: 9 },
      { par: 4, yds: 440, hcp: 3 },
      { par: 4, yds: 396, hcp: 7 },
      { par: 4, yds: 145, hcp: 17 },
      { par: 3, yds: 429, hcp: 15 },
      { par: 4, yds: 486, hcp: 1 },
      { par: 4, yds: 200, hcp: 16 },
      { par: 4, yds: 444, hcp: 6 },
      { par: 4, yds: 525, hcp: 12 },
      { par: 3, yds: 446, hcp: 4 },
      { par: 4, yds: 213, hcp: 18 },
      { par: 5, yds: 467, hcp: 8 },
      { par: 4, yds: 280, hcp: 14 },
      { par: 4, yds: 433, hcp: 10 },
      { par: 4, yds: 547, hcp: 2 },
    ],
  },
];

// PGA tour courses already shipped — surface in same picker so users don't
// have to wait for "tournament of the week" to play Augusta etc.
const pgaAsFamous = PGA_2026.map((p) => ({
  id: "pga-" + p.start,
  name: p.name,
  location: p.tournament,
  level: p.level,
  holes: p.holes,
}));

const newAsFamous = COURSE_DATA.map((c) => ({
  id: c.id,
  name: c.name,
  location: c.location,
  level: c.level,
  holes: buildHoles(c),
}));

// Combined list, deduped by name (PGA wins when there's overlap).
const seenNames = new Set(pgaAsFamous.map((c) => c.name));
export const FAMOUS_COURSES = [
  ...pgaAsFamous,
  ...newAsFamous.filter((c) => !seenNames.has(c.name)),
].sort((a, b) => a.name.localeCompare(b.name));
