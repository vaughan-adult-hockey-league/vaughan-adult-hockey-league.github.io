# Vaughan Adult Hockey League — Website

**Live site:** https://vaughan-adult-hockey-league.github.io

---

## Folder Structure
```
vahl/
├── index.html            ← Home (standings, results, points leaders, announcement)
├── teams.html            ← Teams overview with standings, H2H records, streak dots
├── roster.html           ← Per-team skater and goalie rosters with stats
├── schedule.html         ← Full schedule and results, clickable rows → boxscore
├── stats.html            ← League-wide skater and goalie leaderboards
├── handouts.html         ← Downloadable PDF documents
├── registration.html     ← Player registration form (date-gated)
├── contact.html          ← Contact form and rink info
├── awards.html           ← Season and playoff awards (auto-shown when season ends)
├── player.html           ← Individual player profile and game log
├── boxscore.html         ← Full game stats for a single game
├── registration-script.gs ← Google Apps Script (already deployed)
├── robots.txt            ← Search engine crawl rules
├── sitemap.xml           ← Search engine sitemap
├── favicon.ico           ← Browser tab icon
├── site.webmanifest      ← Web app manifest (PWA)
├── css/style.css         ← All shared styles (mobile responsive)
├── js/data.js            ← Google Sheets data loader and all helpers
├── logos/                ← Team and league logo SVGs
├── icons/                ← App icons (16px – 512px)
├── images/               ← Announcement and feature images
│   └── 2025-26_Champions.jpeg
└── handouts/             ← PDF files for download
```

---

## Already Configured
- **Google Sheet ID** — set in js/data.js (`SHEET_ID`)
- **Apps Script URL** — set in registration.html (`APPS_SCRIPT_URL`)
- **Private Registrations Sheet ID** — set in registration-script.gs (`PRIVATE_SHEET_ID`)
- **EmailJS** — set in contact.html (public key, service ID, template ID)

---

## Google Sheet Structure

### Required tabs (exact names):
| Tab | Purpose |
|-----|---------|
| Roster | All players including goalies (Pos = G) |
| GameStats | Per-game player stats including goalies |
| Schedule | Full season schedule and results |
| Registration | Registration window dates |
| Round Robin | Playoff round robin points per team |
| Misc | Season label, champion, announcement, image settings |

**Removed tabs (no longer needed):**
- ~~GoalieRoster~~ — goalies now in Roster tab with Pos = G
- ~~GoalieStats~~ — goalie W/L/T/GA/SO/GAA derived from Schedule scores

---

### Roster tab
All players in one tab — skaters and goalies together.

| Name | Team | Jersey | Pos |
|------|------|--------|-----|
| Darren Desrosiers | Toronto | 10 | F |
| Joe Muraca | Toronto | 4 | D |
| Nello Deluca | Toronto | 1 | G |
| Rental | Philadelphia | – | G |

**Pos values:** `F` (forward), `D` (defence), `G` (goalie)

**Rental goalies:** Any player whose name contains "Rental" (case-insensitive) is treated as a rental goalie:
- Excluded from: skater tables, stats leaderboard, player profiles
- Included in: Goaltenders tables (Roster page), Boxscore, team-filtered Stats goalie view
- Always sorted last in Goaltenders tables

---

### GameStats tab
One row per player per game. Goalies can be included here too.

| Date | Player | Team | Jersey | Pos | G | A | PIM |
|------|--------|------|--------|-----|---|---|-----|
| Oct 5, 2025 | Darren Desrosiers | Toronto | 10 | F | 2 | 1 | 0 |
| Oct 5, 2025 | Nello Deluca | Toronto | 1 | G | 0 | 0 | 0 |
| Oct 5, 2025 | Rental | Philadelphia | – | G | 0 | 0 | 0 |

**Key rules:**
- Date must match Schedule tab exactly (e.g. `Oct 5, 2025`)
- Player name must match Roster tab exactly
- Jersey is optional (for reference only)
- Pos can be left blank for skaters — only `G` matters for goalie game assignment
- G/A/PIM default to 0 if blank
- You can add extra columns (e.g. Notes) to the right — they are ignored
- **Goalie assignment:** The goalie with `Pos = G` for a given date/team gets that game's W/L/T/GA/SO. If no Pos=G row exists, the primary (first listed) goalie for that team in the Roster tab is used

**Multiple goalies per team:** If a backup goalie plays, add their row with `Pos = G` for that game. The primary goalie row can be left without `Pos = G` or omitted entirely for that game.

---

### Schedule tab
| Date | Time | Home | Away | HomeScore | AwayScore | Status | Playoff |
|------|------|------|------|-----------|-----------|--------|---------|
| Oct 5, 2025 | 6:00 PM | Dallas | Toronto | 3 | 7 | Final | |
| Apr 15, 2026 | 6:00 PM | Toronto | Dallas | 4 | 2 | Final | 1 |
| May 1, 2026 | 6:00 PM | Toronto | Dallas | | | Upcoming | 1 |

**Key rules:**
- Status: `Final` or `Upcoming` (no need for `Tie` — ties detected automatically when HomeScore = AwayScore)
- Playoff: `1` = playoff game, blank = regular season (no need to enter 0)
- Leave HomeScore/AwayScore blank for upcoming games
- Time column: plain text (e.g. `6:00 PM`), not a date cell

---

### Registration tab
| Key | Value |
|-----|-------|
| StartDate | 2026-09-01 |
| EndDate | 2026-10-15 |

Use YYYY-MM-DD format. The registration form opens automatically within this window.

---

### Round Robin tab
One column per team, header = team name, value = round robin points:

| Toronto | Philadelphia | Los Angeles | Dallas |
|---------|-------------|-------------|--------|
| 5.5 | 7.5 | 14.5 | 5 |

Used in Playoffs standings view and Prince of Wales Trophy award.

---

### Misc tab
Headers in row 1, values in row 2:

| Current Season | Champion | Announcement | Image | Font Size | Align |
|---|---|---|---|---|---|
| 2025-26 | Los Angeles | 🏆 LA are your champions! | 2025-26_Champions.jpeg | 18 | center |

- **Current Season** — season label shown throughout the site
- **Champion** — team name for the VAHL Champions playoff award
- **Announcement** — text shown on the Home page. Use `\n` for line breaks. Leave blank for none
- **Image** — filename from the `images/` folder shown below the announcement. Leave blank for none
- **Font Size** — font size in pixels for announcement text (default: 15)
- **Align** — `left`, `center`, or `right` (default: left)

---

## Goalie Stats — How They Work

Goalie W/L/T/GA/SO/GAA are **derived automatically from the Schedule tab** — you never need to enter them manually. The Schedule scores are the source of truth:

- **W/L/T** — compared from HomeScore vs AwayScore per game
- **GA** — the opposing team's score
- **SO** — shutout when opposing team scored 0
- **GAA** — total GA ÷ games played
- **PIM** — read from GameStats rows where `Pos = G`

Ties are detected when HomeScore = AwayScore, regardless of Status field.

---

## Updating Stats After Each Game
1. **Schedule tab** — change Status to `Final`, add scores
2. **GameStats tab** — add one row per player (including goalie if tracking PIM or rare G/A)

That's it — goalie W/L/T/GA/SO are calculated automatically.

---

## Awards Page

The 🏆 Awards nav link appears automatically between Stats and Handouts when all regular season games are played, and disappears when registration opens.

**Regular Season Awards** (when all regular season games are Final):
1. 🏆 President's Trophy — 1st place team
2. 🎯 Rocket Richard Trophy — Most goals (tiebreaker: fewest PIM)
3. 📊 Art Ross Trophy — Most points (tiebreaker: most goals → fewest PIM)
4. 🛡️ Norris Trophy — Defenceman with most points (same tiebreakers)
5. 🥅 Vezina Trophy — Lowest GAA, min 12 GP (tiebreakers: W → SO → fewest PIM). GAA compared to 2 decimal places to avoid float precision issues.
6. 🤝 Lady Byng Trophy — All players with 0 PIM

**Playoff Awards** (when all playoff games are Final):
1. 🏒 VAHL Champions — from Misc tab Champion column
2. 🌟 Conn Smythe Trophy — Most playoff points (tiebreaker: most goals → fewest PIM)
3. 👑 Prince of Wales Trophy — Top Round Robin team

All trophy ties are shared if still equal after all tiebreakers.

---

## Privacy & Security
- **Registration data** goes to a separate private Google Sheet (`PRIVATE_SHEET_ID` in Apps Script) that is never published to the web
- **Honeypot fields** on both registration and contact forms catch and silently reject spam bots
- **Privacy notice** shown to players on the registration form
- **Google Sheets gviz endpoint** is read-only — no API key required, works as long as the main Sheet is published to the web

---

## Performance
All Google Sheet data (Roster, GameStats, Schedule, Misc, Round Robin) is fetched in a single parallel batch on first page load and cached in `sessionStorage` for 5 minutes. Subsequent page navigations within the same session are instant — no network requests. Season label and Awards button visibility are also cached and applied synchronously before first paint to avoid any flash.

---

## Stats Page Sort Tiebreakers
**Skaters:**
- PTS sort: most goals → fewest PIM
- G sort: fewest PIM
- A sort: fewest PIM

**Goalies:**
- Default/GAA sort: lowest GAA (to 2dp) → most W → most SO → fewest PIM
- Other columns: tiebreaker falls back to lowest GAA

---

## images/ Folder
Place announcement or feature images here. Reference the filename in the Misc tab Image column to show it on the Home page below the announcement text.

---

## Page Summary
| Page | File | Description |
|------|------|-------------|
| Home | index.html | Standings, results, leaders, announcement banner |
| Teams | teams.html | Team cards, H2H records, streak dots, RR pts in playoffs |
| Roster | roster.html | Skater and goalie tables with stats per team |
| Player Profile | player.html | Per-player game log and career stats |
| Schedule | schedule.html | Full schedule, results, clickable boxscores |
| Stats | stats.html | League-wide leaderboards, team filter with totals row |
| Awards | awards.html | Season and playoff awards, auto-calculated |
| Handouts | handouts.html | PDF documents for download |
| Registration | registration.html | Date-gated registration form |
| Contact | contact.html | Contact form and rink info |
| Boxscore | boxscore.html | Full game stats — skaters and goalies |

---

## Setup Steps (for future reinstall)

### Step 1 — Publish Your Google Sheet
1. File → Share → Publish to web
2. Select Entire Document, Web page format
3. Click Publish
4. **Do NOT publish the separate Registrations sheet** — keep that private

### Step 2 — Add Sheet ID to the Website
Open `js/data.js` and update:
```javascript
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
```

### Step 3 — Set Up the Registration Apps Script
1. Open your main VAHL Google Sheet → Extensions → Apps Script
2. Paste `registration-script.gs` contents
3. Set `PRIVATE_SHEET_ID` to your private Registrations Sheet ID
4. Deploy → New Deployment → Web App (Execute as: Me, Anyone can access)
5. Paste the Web App URL into `registration.html` as `APPS_SCRIPT_URL`

### Step 4 — Set Up EmailJS (Contact Form)
Update `contact.html`:
```javascript
const EMAILJS_PUBLIC_KEY  = 'your_key';
const EMAILJS_SERVICE_ID  = 'your_service';
const EMAILJS_TEMPLATE_ID = 'your_template';
```
Add your domain to the allowed domains list in your EmailJS dashboard.

### Step 5 — PDF Handouts
Place PDF files in `handouts/` folder and update `handouts.html` to reference them.

### Step 6 — Host on GitHub Pages
Upload all files to your GitHub repository. The site is configured for:
`https://vaughan-adult-hockey-league.github.io`

---

## Team Colours
| Team | Primary | Light | Muted |
|------|---------|-------|-------|
| Toronto | #2563eb | #dbeafe | #60a5fa |
| Philadelphia | #ea580c | #ffedd5 | #fb923c |
| Los Angeles | #9ca3af | #f3f4f6 | #d1d5db |
| Dallas | #4ade80 | #dcfce7 | #86efac |

---

## League Info
- **Game nights:** Sundays, 6:00 PM – 8:00 PM
- **Rink:** Sports Village, 2600 Rutherford Road, Vaughan ON L4K 5R1
- **League email:** communication.vahl@gmail.com
- **Payment email:** payment.vahl@gmail.com
