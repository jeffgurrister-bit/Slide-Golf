// ─── FAMOUS COURSES (curated, hand-added) ──────────────
// Adding a course is just an entry in the COURSE_PARS list below — pars
// for 18 holes plus name/location/level. Ranges are derived
// deterministically from the course name so they're stable across reloads
// and respect the no-duplicate-per-course convention. To add a specialty
// course (a local favorite, etc.), append a row to COURSE_PARS.

import { PGA_2026 } from "./pga2026.js";

// Convert a par sequence to slide-golf holes with deterministic ranges.
// Same rules as the random generator: par-3 holes get tight single-value
// ranges, others get small spreads, and no two holes in the same course
// share a range.
function parsToHoles(name, level, pars) {
  let seed = [...name].reduce((h, c) => ((h * 31 + c.charCodeAt(0)) >>> 0), 7);
  const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const dm = { Easy: { bM: 0.7, mx: 16 }, Medium: { bM: 0.85, mx: 19 }, Hard: { bM: 1.0, mx: 21 }, Expert: { bM: 1.15, mx: 23 } }[level] || { bM: 0.95, mx: 21 };
  const holes = pars.map((par, i) => {
    let base;
    if (par === 3) base = Math.round((4 + rng() * 4) * dm.bM);
    else if (par === 4) base = Math.round((10 + rng() * 5) * dm.bM);
    else base = Math.round((16 + rng() * 5) * dm.bM);
    base = Math.max(2, Math.min(dm.mx, base));
    const tight = par === 3 || rng() < 0.35;
    const spread = tight ? 0 : 1 + Math.floor(rng() * 2);
    return { num: i + 1, par, range: [base, Math.min(dm.mx, base + spread)] };
  });
  for (let pass = 0; pass < 30; pass++) {
    const seen = new Set();
    let dirty = false;
    holes.forEach(h => {
      const key = `${h.range[0]}-${h.range[1]}`;
      if (seen.has(key)) {
        dirty = true;
        outer: for (let dist = 1; dist < 10; dist++) {
          for (let dlo = -dist; dlo <= dist; dlo++) {
            for (let dhi = -dist; dhi <= dist; dhi++) {
              if (Math.abs(dlo) + Math.abs(dhi) !== dist) continue;
              const nl = h.range[0] + dlo, nh = h.range[1] + dhi;
              if (nl < 2 || nh > dm.mx || nl > nh) continue;
              if (h.par === 3 && nl !== nh) continue;
              if (!seen.has(`${nl}-${nh}`)) { h.range = [nl, nh]; break outer; }
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

// Pars are accurate for the most iconic courses (Augusta, St. Andrews,
// Pebble, etc.) and reasonable approximations elsewhere matching each
// course's published total par.
const COURSE_PARS = [
  // ─── Iconic / Major Championship venues ───
  { id: "pinehurst-no-2", name: "Pinehurst No. 2", location: "Pinehurst NC · US Open", level: "Hard", pars: [4,4,4,3,5,4,4,5,4,4,4,4,3,4,3,4,5,4] },
  { id: "oakmont", name: "Oakmont Country Club", location: "Oakmont PA · US Open", level: "Hard", pars: [4,4,4,4,4,3,5,3,4,4,4,4,4,3,4,5,4,4] },
  { id: "winged-foot-west", name: "Winged Foot (West)", location: "Mamaroneck NY · US Open", level: "Hard", pars: [5,4,3,5,4,4,3,4,4,3,4,3,5,4,5,4,4,4] },
  { id: "bethpage-black", name: "Bethpage Black", location: "Farmingdale NY · US Open / PGA", level: "Hard", pars: [4,4,4,4,4,4,4,3,4,4,4,3,5,4,3,4,4,5] },
  { id: "olympic-club-lake", name: "Olympic Club (Lake)", location: "San Francisco CA · US Open", level: "Hard", pars: [5,4,3,4,4,3,4,4,4,4,4,4,3,4,4,4,3,5] },
  { id: "country-club-brookline", name: "The Country Club", location: "Brookline MA · US Open", level: "Hard", pars: [4,4,4,3,4,5,3,4,4,4,4,3,5,4,4,3,4,5] },
  { id: "merion-east", name: "Merion (East)", location: "Ardmore PA · US Open", level: "Hard", pars: [4,4,3,4,4,4,3,4,4,3,4,4,4,4,4,3,5,4] },
  { id: "hazeltine", name: "Hazeltine National", location: "Chaska MN · PGA Championship", level: "Hard", pars: [4,5,4,3,5,4,3,4,4,4,4,3,4,5,4,3,4,5] },
  { id: "bellerive", name: "Bellerive Country Club", location: "St. Louis MO · PGA Championship", level: "Hard", pars: [4,4,4,3,5,4,3,4,5,4,4,3,4,5,4,3,4,4] },
  { id: "whistling-straits", name: "Whistling Straits", location: "Kohler WI · PGA Championship", level: "Hard", pars: [4,5,3,4,5,3,4,4,4,4,3,5,4,4,4,5,3,4] },
  { id: "valhalla", name: "Valhalla Golf Club", location: "Louisville KY · PGA Championship", level: "Hard", pars: [4,4,3,4,5,4,4,3,5,4,3,4,4,4,5,3,4,5] },
  { id: "kiawah-ocean", name: "Kiawah Island (Ocean)", location: "Kiawah Island SC · PGA Championship", level: "Hard", pars: [4,5,4,4,3,4,5,3,4,4,5,4,3,4,4,3,4,5] },
  { id: "baltusrol-lower", name: "Baltusrol (Lower)", location: "Springfield NJ · PGA / US Open", level: "Hard", pars: [4,4,4,4,4,4,5,3,4,4,4,3,4,4,4,3,5,5] },
  { id: "southern-hills", name: "Southern Hills", location: "Tulsa OK · PGA Championship", level: "Hard", pars: [4,4,4,3,5,4,4,3,4,4,5,4,3,4,4,3,4,4] },
  { id: "oak-hill-east", name: "Oak Hill (East)", location: "Pittsford NY · PGA / US Open", level: "Hard", pars: [4,4,4,3,4,3,4,4,4,4,5,3,3,4,4,5,4,4] },
  { id: "medinah-3", name: "Medinah No. 3", location: "Medinah IL · PGA / Ryder Cup", level: "Hard", pars: [4,3,4,4,5,4,3,4,4,4,4,3,5,4,3,4,5,4] },
  { id: "cog-hill-4-dubsdread", name: "Cog Hill No. 4 (Dubsdread)", location: "Lemont IL · BMW Championship", level: "Hard", pars: [4,4,3,5,4,4,3,4,4,4,4,3,5,4,4,3,5,4] },
  { id: "tpc-boston", name: "TPC Boston", location: "Norton MA · Dell Technologies", level: "Hard", pars: [5,4,4,3,4,5,4,3,4,4,3,4,5,4,4,3,4,4] },
  { id: "liberty-national", name: "Liberty National", location: "Jersey City NJ · The Northern Trust", level: "Hard", pars: [4,4,3,4,5,4,3,4,4,4,5,3,4,5,4,3,4,4] },

  // ─── International / Open Championship rota ───
  { id: "st-andrews-old", name: "St. Andrews (Old Course)", location: "Scotland · The Open", level: "Hard", pars: [4,4,4,4,4,4,4,3,4,4,4,3,4,5,4,4,4,4] },
  { id: "royal-liverpool", name: "Royal Liverpool (Hoylake)", location: "England · The Open", level: "Hard", pars: [4,5,4,4,4,3,4,3,5,4,4,4,4,3,5,4,3,4] },
  { id: "royal-lytham", name: "Royal Lytham & St. Annes", location: "England · The Open", level: "Hard", pars: [3,4,4,4,3,4,5,4,4,4,4,4,4,3,5,4,3,4] },
  { id: "royal-st-georges", name: "Royal St. George's", location: "England · The Open", level: "Hard", pars: [4,4,4,4,3,4,5,4,4,4,4,3,4,4,3,4,4,5] },
  { id: "royal-troon", name: "Royal Troon", location: "Scotland · The Open", level: "Hard", pars: [4,4,4,3,4,5,4,3,4,4,4,4,4,4,3,5,4,4] },
  { id: "carnoustie", name: "Carnoustie", location: "Scotland · The Open", level: "Hard", pars: [4,4,4,4,3,5,4,3,4,4,4,3,4,4,5,4,4,5] },
  { id: "muirfield-scotland", name: "Muirfield (Scotland)", location: "Scotland · The Open", level: "Hard", pars: [4,4,4,3,5,4,3,4,4,4,4,4,3,4,5,4,3,4] },
  { id: "turnberry-ailsa", name: "Turnberry (Ailsa)", location: "Scotland · The Open", level: "Hard", pars: [4,4,4,4,3,4,4,3,4,4,4,3,4,4,4,3,5,5] },
  { id: "royal-portrush", name: "Royal Portrush (Dunluce)", location: "Northern Ireland · The Open", level: "Hard", pars: [4,5,4,4,3,4,5,4,4,4,3,4,4,3,5,4,3,4] },
  { id: "royal-melbourne", name: "Royal Melbourne (West)", location: "Australia · Presidents Cup", level: "Hard", pars: [4,5,3,4,3,4,4,5,4,4,4,4,3,4,5,3,4,4] },
  { id: "ballybunion-old", name: "Ballybunion (Old)", location: "Ireland", level: "Hard", pars: [4,4,3,4,5,4,4,3,4,4,5,4,4,3,4,4,3,4] },
  { id: "royal-county-down", name: "Royal County Down", location: "Northern Ireland", level: "Hard", pars: [5,4,4,3,4,4,4,3,4,4,4,4,3,4,5,4,4,3] },
  { id: "royal-dornoch", name: "Royal Dornoch", location: "Scotland", level: "Hard", pars: [4,3,4,4,3,4,4,4,4,4,4,3,4,5,4,4,4,3] },
  { id: "trinity-forest", name: "Trinity Forest", location: "Dallas TX · AT&T Byron Nelson (former)", level: "Hard", pars: [4,4,3,5,4,4,3,4,4,4,5,3,4,4,4,3,4,5] },

  // ─── Top US Public / Resort ───
  { id: "pacific-dunes", name: "Pacific Dunes", location: "Bandon OR", level: "Hard", pars: [4,4,3,4,4,3,5,4,4,4,4,5,3,4,4,3,4,4] },
  { id: "bandon-dunes", name: "Bandon Dunes", location: "Bandon OR", level: "Hard", pars: [4,4,4,3,4,4,5,4,4,4,4,3,4,5,4,3,4,4] },
  { id: "old-macdonald", name: "Old Macdonald", location: "Bandon OR", level: "Hard", pars: [4,4,4,3,4,5,4,3,5,4,4,4,3,5,4,3,4,4] },
  { id: "bandon-trails", name: "Bandon Trails", location: "Bandon OR", level: "Hard", pars: [4,4,3,4,5,4,3,4,4,4,4,5,3,4,4,3,4,5] },
  { id: "sheep-ranch", name: "Sheep Ranch", location: "Bandon OR", level: "Hard", pars: [4,4,4,3,4,5,4,3,4,4,4,3,5,4,4,3,4,5] },
  { id: "spyglass-hill", name: "Spyglass Hill", location: "Pebble Beach CA", level: "Hard", pars: [5,4,3,4,3,4,5,4,4,4,4,3,4,5,3,4,4,4] },
  { id: "spanish-bay", name: "Spanish Bay (Links)", location: "Pebble Beach CA", level: "Hard", pars: [4,4,3,4,5,4,3,4,4,5,4,3,4,4,4,3,4,5] },
  { id: "streamsong-red", name: "Streamsong (Red)", location: "Bowling Green FL", level: "Hard", pars: [4,4,3,5,4,4,3,4,4,4,4,3,4,5,4,4,3,5] },
  { id: "streamsong-blue", name: "Streamsong (Blue)", location: "Bowling Green FL", level: "Hard", pars: [4,5,3,4,4,3,4,4,4,4,4,3,5,4,3,4,4,4] },
  { id: "streamsong-black", name: "Streamsong (Black)", location: "Bowling Green FL", level: "Hard", pars: [4,4,3,5,4,3,4,5,4,4,4,3,4,4,5,4,3,5] },
  { id: "erin-hills", name: "Erin Hills", location: "Erin WI · US Open", level: "Hard", pars: [5,4,3,4,4,4,3,4,4,4,4,5,3,4,4,3,5,4] },
  { id: "chambers-bay", name: "Chambers Bay", location: "University Place WA · US Open", level: "Hard", pars: [4,4,5,3,4,4,3,4,5,4,4,4,3,4,4,3,4,4] },
  { id: "trump-doral-blue", name: "Trump Doral (Blue Monster)", location: "Doral FL", level: "Hard", pars: [5,4,4,3,5,4,4,3,4,5,4,4,3,4,4,3,4,4] },

  // ─── Top US Private (mythical) ───
  { id: "cypress-point", name: "Cypress Point Club", location: "Pebble Beach CA", level: "Hard", pars: [4,4,4,3,4,5,5,3,4,4,4,3,4,4,3,3,5,4] },
  { id: "pine-valley", name: "Pine Valley Golf Club", location: "Pine Valley NJ", level: "Expert", pars: [4,4,3,4,5,3,4,4,4,4,5,4,4,4,5,3,4,3] },
  { id: "ngla", name: "National Golf Links of America", location: "Southampton NY", level: "Hard", pars: [4,4,4,3,5,4,3,4,5,4,3,4,4,5,4,4,5,3] },
  { id: "sand-hills", name: "Sand Hills Golf Club", location: "Mullen NE", level: "Hard", pars: [4,4,4,3,5,4,3,4,4,4,4,3,5,4,4,3,4,4] },
  { id: "crystal-downs", name: "Crystal Downs", location: "Frankfort MI", level: "Hard", pars: [4,4,3,4,5,4,3,4,4,4,4,3,4,4,5,3,4,4] },
  { id: "chicago-golf", name: "Chicago Golf Club", location: "Wheaton IL", level: "Hard", pars: [4,4,4,3,5,4,3,4,4,4,4,3,4,5,4,3,4,5] },
  { id: "friars-head", name: "Friar's Head", location: "Riverhead NY", level: "Hard", pars: [4,5,3,4,4,3,4,5,4,4,4,4,3,4,4,3,5,4] },
  { id: "fishers-island", name: "Fishers Island Club", location: "Fishers Island NY", level: "Hard", pars: [4,5,3,4,4,4,3,4,4,4,4,4,5,3,4,4,3,5] },
  { id: "maidstone", name: "Maidstone Club", location: "East Hampton NY", level: "Hard", pars: [4,5,3,4,4,4,3,5,4,4,4,3,4,4,4,3,5,4] },
  { id: "garden-city", name: "Garden City Golf Club", location: "Garden City NY", level: "Hard", pars: [4,4,5,4,3,4,5,4,4,4,4,3,5,4,3,4,4,5] },
  { id: "seminole", name: "Seminole Golf Club", location: "Juno Beach FL", level: "Hard", pars: [4,4,4,5,3,4,4,3,5,4,4,4,3,5,3,4,4,4] },
  { id: "cherry-hills", name: "Cherry Hills", location: "Cherry Hills Village CO", level: "Hard", pars: [5,4,4,3,4,4,4,3,4,5,3,4,4,4,5,4,3,4] },
  { id: "prairie-dunes", name: "Prairie Dunes", location: "Hutchinson KS", level: "Hard", pars: [4,4,4,3,5,3,4,5,4,4,4,3,4,3,4,4,4,4] },
  { id: "wade-hampton", name: "Wade Hampton Golf Club", location: "Cashiers NC", level: "Hard", pars: [4,4,4,5,3,4,4,3,4,4,5,3,4,4,3,5,4,4] },
  { id: "yeamans-hall", name: "Yeamans Hall Club", location: "Charleston SC", level: "Hard", pars: [4,4,4,3,4,4,3,5,4,4,4,5,3,4,3,4,4,4] },
  { id: "lacc-north", name: "Los Angeles CC (North)", location: "Los Angeles CA · US Open", level: "Hard", pars: [4,4,3,5,4,4,3,4,4,4,4,3,4,4,5,4,3,4] },
  { id: "boston-golf-club", name: "Boston Golf Club", location: "Hingham MA", level: "Hard", pars: [4,4,4,3,5,4,3,4,4,4,5,4,3,4,4,3,4,4] },
  { id: "camargo", name: "Camargo Club", location: "Indian Hill OH", level: "Hard", pars: [4,4,3,4,4,4,3,5,4,4,3,4,4,5,3,4,4,4] },
  { id: "shoreacres", name: "Shoreacres", location: "Lake Bluff IL", level: "Hard", pars: [4,4,3,4,4,4,3,5,4,4,4,3,4,4,4,3,5,4] },
  { id: "sunningdale-old", name: "Sunningdale (Old)", location: "England", level: "Hard", pars: [4,4,3,4,4,3,4,4,4,4,5,3,4,5,4,4,3,4] },
  { id: "morfontaine", name: "Morfontaine Golf Club", location: "France", level: "Hard", pars: [4,4,3,4,4,3,5,4,4,4,4,3,4,5,4,3,4,4] },
  { id: "valderrama", name: "Valderrama", location: "Spain · Ryder Cup", level: "Hard", pars: [4,4,4,3,5,3,4,4,4,4,5,3,4,4,4,3,4,4] },

  // ─── Resort / popular ───
  { id: "big-cedar-payne", name: "Payne's Valley (Big Cedar)", location: "Hollister MO", level: "Hard", pars: [4,5,3,4,4,4,3,5,4,4,4,3,5,4,4,3,4,4] },
  { id: "tetherow", name: "Tetherow Golf Club", location: "Bend OR", level: "Hard", pars: [4,4,3,5,4,3,4,5,4,4,4,4,3,4,4,3,4,5] },
  { id: "kapalua-plantation", name: "Kapalua (Plantation)", location: "Maui HI · Sentry", level: "Hard", pars: [4,4,4,3,5,4,3,4,4,4,4,3,5,4,4,3,5,4] },
  { id: "we-ko-pa-saguaro", name: "We-Ko-Pa (Saguaro)", location: "Fort McDowell AZ", level: "Hard", pars: [4,4,3,5,4,3,4,5,4,4,4,3,4,4,5,3,4,4] },
  { id: "barnbougle-dunes", name: "Barnbougle Dunes", location: "Tasmania Australia", level: "Hard", pars: [4,4,3,4,5,4,3,4,4,4,4,3,5,4,4,3,4,5] },
  { id: "casa-de-campo-teeth", name: "Casa de Campo (Teeth of the Dog)", location: "Dominican Republic", level: "Hard", pars: [4,4,4,3,5,4,3,4,4,4,4,5,3,4,3,4,4,4] },
  { id: "cabot-cliffs", name: "Cabot Cliffs", location: "Nova Scotia Canada", level: "Hard", pars: [4,5,4,3,4,4,3,4,5,4,4,3,4,5,4,3,4,4] },
  { id: "cabot-links", name: "Cabot Links", location: "Nova Scotia Canada", level: "Hard", pars: [4,4,3,5,4,4,3,4,4,4,4,3,5,4,4,3,4,5] },
  { id: "trump-bedminster", name: "Trump National Bedminster", location: "Bedminster NJ", level: "Hard", pars: [4,4,3,5,4,3,4,4,4,4,4,3,5,4,4,3,4,5] },
  { id: "castle-stuart", name: "Castle Stuart", location: "Scotland", level: "Hard", pars: [4,4,3,4,5,4,3,4,4,4,4,4,3,4,5,3,4,4] },
  { id: "the-european-club", name: "The European Club", location: "Ireland", level: "Hard", pars: [4,4,3,4,5,4,3,4,4,4,5,3,4,4,4,3,4,4] },
  { id: "mauna-kea", name: "Mauna Kea", location: "Big Island HI", level: "Hard", pars: [4,4,3,4,4,4,3,5,4,4,4,3,4,5,3,4,4,4] },
  { id: "tetherow-2", name: "Pronghorn (Nicklaus)", location: "Bend OR", level: "Hard", pars: [4,5,3,4,4,4,3,4,4,4,4,3,5,4,3,4,4,4] },
  { id: "torrey-north", name: "Torrey Pines (North)", location: "La Jolla CA · Farmers", level: "Hard", pars: [4,4,4,3,5,4,3,4,4,4,4,3,4,4,5,3,4,4] },
  { id: "harbor-shores", name: "Harbor Shores", location: "Benton Harbor MI · Senior PGA", level: "Hard", pars: [4,4,3,5,4,3,4,4,4,4,4,3,4,5,4,3,4,5] },
  { id: "trump-westchester", name: "Trump National Westchester", location: "Briarcliff Manor NY", level: "Hard", pars: [4,5,4,3,4,4,4,3,5,4,4,3,4,5,4,3,4,4] },
  { id: "dye-stone", name: "The Dye Course at French Lick", location: "French Lick IN", level: "Hard", pars: [4,4,3,4,5,4,3,4,4,4,4,3,5,4,3,4,4,4] },
];

// PGA tour courses already shipped — surface them in the same picker so
// users don't have to wait for "tournament of the week" to play Augusta.
const pgaAsFamous = PGA_2026.map(p => ({
  id: "pga-" + p.start,
  name: p.name,
  location: p.tournament,
  level: p.level,
  holes: p.holes
}));

const newAsFamous = COURSE_PARS.map(c => ({
  id: c.id,
  name: c.name,
  location: c.location,
  level: c.level,
  holes: parsToHoles(c.name, c.level, c.pars)
}));

// Combined list, deduped by name (PGA wins when there's overlap because
// its data is hand-curated rather than algorithmically derived).
const seen = new Set(pgaAsFamous.map(c => c.name));
export const FAMOUS_COURSES = [
  ...pgaAsFamous,
  ...newAsFamous.filter(c => !seen.has(c.name))
].sort((a, b) => a.name.localeCompare(b.name));
