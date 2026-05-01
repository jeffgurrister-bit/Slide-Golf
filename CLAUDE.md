# Slide Golf — Claude Code Project Memory

This file is auto-loaded by Claude Code at the start of every session. Keep it accurate and concise; update it as the project evolves.

---

## What This Is

Slide Golf is a companion app for a tabletop shuffleboard-style golf game. Players slide pucks down a mat targeting numbered zones (1–9) to "play" 18-hole courses. The app tracks scores, courses, players, leagues, PGA tournaments, and live multiplayer rounds.

**Live deployment:** https://slide-golf.vercel.app

---

## The Physical Game (Domain Knowledge)

- **Board zones:** 1–9 only (no 10). 1–2 closest/easiest, 9 farthest/hardest.
- **Water hazards (OB):** between zones. OB = 0 points added, 1 stroke penalty.
- **Each hole has a par (3/4/5) and a range** (e.g., 7–8, 15–15, 19–19).
- **Sliding phase:** Slides accumulate toward the range. Land within range (inclusive) → on green.
- **Over the range:** Subsequent slides *subtract* until back in range. Can bounce over/under repeatedly.
- **Hole Out:** Sink directly = 1 stroke, hole done.
- **Putting phase:** Miss = 1 stroke, stay. Made = 1 stroke, hole complete.
- **Score for a hole** = slides + OB penalties + putts.
- **Difficulty axes:** higher range numbers (harder zones) AND tighter ranges (less margin).

---

## Tech Stack

- **React + Vite** frontend
- **Firebase Firestore** (real-time data via `onSnapshot`)
- **Vercel** deploy (auto from `main` branch)
- Mobile-first, dark green golf theme
- No CSS framework — inline styles via `theme.js` constants (`C`, `btnS`, `inputS`, `smallInput`)

---

## File Structure

```
src/
├── App.jsx                  # Main shell, routing, state, Firebase wiring
├── firebase.js              # Firebase config + db export
├── components/
│   ├── HomeTab.jsx
│   ├── PlayTab.jsx
│   ├── CoursesTab.jsx
│   ├── LeagueTab.jsx
│   ├── LeaderboardTab.jsx
│   └── StatsTab.jsx
├── data/
│   ├── courses.js           # 5 permanent courses (hardcoded)
│   ├── pga2026.js           # 32 PGA Tour events with date ranges
│   └── league.js            # S1 hardcoded data + LEAGUE_FORMATS + computeStandings + generateRRSchedule
└── utils/
    ├── helpers.jsx          # calcPar, fmtRange, calcHandicap, scoreName, genLiveCode, etc.
    ├── theme.js             # C (colors), btnS, inputS, smallInput
    └── generate.js          # Course generator (Easy/Medium/Hard/Expert)
```

`App.jsx` holds nearly all state and passes it as props to tab components. Tab components are presentational + emit handlers back up.

---

## Firestore Collections

| Collection | Purpose |
|---|---|
| `players` | Player names + creation timestamps |
| `rounds` | Saved rounds (scores, course, par, hole-outs, handicap) |
| `customCourses` | User-created and generated courses |
| `pgaTourneys` | PGA tournament entries (joins + per-round scores) |
| `liveRounds` | Active live multiplayer sessions |
| `leagues` | Dynamic leagues (Season 2+) |
| `leagueMatches` | Individual league match records |

---

## Key Features

- **Home:** Start round, join live, PGA course of the week, generate course, league, leaderboard, stats, recent rounds
- **Play:** Shot-by-Shot (full tracking, number pad, OB, hole out, putting phase, callouts) OR Quick Score (manual grid). Multi-player tabbed UI on one device.
- **Live Rounds:** 4-char room code, real-time Firestore sync, host creates / others join. Self-scoring mode uses dot-notation field paths (`scores.${playerName}`) to avoid overwrite collisions. 600ms debounce on writes.
- **PGA System:** 32 events, date-range matched to today (1-day early buffer). Up to 4 scored rounds per tournament. Includes all 4 majors.
- **Leagues:** Season 1 is hardcoded in `S1_STANDINGS / S1_RESULTS / S1_PLAYOFFS`. Season 2+ is dynamic — Firebase-driven via `leagues` and `leagueMatches` collections. Format determined by player count via `LEAGUE_FORMATS`.
- **Course Generator:** 110+ unique fictional names, 5 par templates (total 70–72), difficulty controls range height + tightness, harder handicap holes get tighter ranges.
- **Handicap:** best 40% of score-to-par differentials, averaged. Displayed as ±X.X.

---

## Conventions / Gotchas

- **Single-letter / compressed variable names** are common in `App.jsx` (`C`, `me`, `cur`, etc.) — match the existing style when editing; don't reformat for the sake of it.
- **Inline styles only** — no Tailwind, no styled-components. Pull from `theme.js` (`C.bg`, `C.green`, `C.text`, `btnS(active)`, `inputS`).
- **Score names:** ≤−3 = Albatross 🦅🦅 / −2 = Eagle 🦅 / −1 = Birdie 🐦 / 0 = Par 👍 / +1 = Bogey / +2 = Dbl Bogey / ≥+3 = +X
- **Live round writes:** always use dot-notation (`updateDoc(ref, { [`scores.${name}`]: val })`) — never overwrite the whole `scores` object or you'll wipe other players' data.
- **End live round:** only the *local* player's data writes to `rounds` to avoid duplicates.
- **PGA date check:** uses 1-day early buffer so tournaments show up the day before they start.
- **Range must be inclusive** of both endpoints — `[15,15]` means must hit exactly 15.
- **No 10 zone exists.** Any range ≥10 requires multiple slides.
- **`localStorage` key for current player:** `sg-me`.
- **html2canvas** is dynamically imported only when sharing scorecard images.

---

## Season 1 League Players (10)

Ryan Hangartner, Jimmie Perkins, Josh Baker, Jeff Gurrister, Tyler Shane, Jon Basorka, Jacob Schmiegelt, Danny Zagorski, Kevin Koerner, Kevin Papiernik

S1 status: Semifinals — Ryan vs Jeff, Jimmie vs Jon. Finals to be played at Nebraska.

---

## Permanent Courses (5, undeletable)

| Course | Difficulty |
|---|---|
| TPC Scottsdale Stadium | Hard |
| Nebraska | Hard |
| Maitland Palms | Medium |
| Lanfear Oaks | Medium |
| Orland National | Easy |

---

## Common Tasks

- **Run dev server:** `npm run dev`
- **Build:** `npm run build`
- **Deploy:** push to `main` → Vercel auto-deploys
- **Add a permanent course:** edit `src/data/courses.js`
- **Add a PGA event:** edit `src/data/pga2026.js`
- **Edit theme:** `src/utils/theme.js`

---

## What's Next / Backlog

- Season 2 league system (already partially dynamic — keep migrating away from S1 hardcoded arrays)
- Head-to-head matchup history
- Course-specific stats and records
- Push notifications for live round invites
- Shareable live round links (instead of manual code entry)

---

## Notes for Claude

- When making changes, prefer **smallest diff** that accomplishes the goal — this codebase has a tight, idiosyncratic style.
- Always check whether logic should live in `App.jsx` (stateful, Firebase-touching) or a tab component (presentational).
- Helpers go in `utils/helpers.jsx`; pure data in `data/`.
- Test live-round changes carefully — Firestore dot-notation is fragile.
- Before committing, run `npm run build` to catch import / syntax errors.
