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
├── site.webmanifest      ← Web app manifest
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
- **Google Sheet ID** — set in js/data.js
- **Apps Script URL** — set in registration.html
- **EmailJS** — set in contact.html
- **Live site** — https://vaughan-adult-hockey-league.github.io

---

## Google Sheet Structure

### Required tabs (exact names):
- Roster
- GoalieRoster
- GameStats
- GoalieStats
- Schedule
- Registration
- Round Robin
- Misc
- Registrations (auto-created by Apps Script on first submission)

---

### Misc tab
Headers in row 1, values in row 2:

| Current Season | Champion | Announcement | Image | Font Size | Align |
|---|---|---|---|---|---|
| 2025-26 | Los Angeles | Welcome to the 2025-26 VAHL season! | 2025-26_Champions.jpeg | 15 | left |

- **Current Season** — season label shown throughout the site
- **Champion** — team name for the VAHL Champions playoff award
- **Announcement** — text on the Home page. Use `\n` for line breaks. Leave blank for none
- **Image** — filename from the `images/` folder shown below the announcement. Leave blank for none
- **Font Size** — font size in pixels (default: 15)
- **Align** — `left`, `center`, or `right` (default: left)

---

### Roster tab
| Name | Team | Jersey | Pos |
|------|------|--------|-----|
| J. Mitchell | Toronto | 19 | F |

Pos values: F (Forward) or D (Defence)

---

### GoalieRoster tab
| Name | Team | Jersey |
|------|------|--------|
| Nello Deluca | Toronto | 1 |

---

### GameStats tab
| Date | Player | Team | Jersey | G | A | PIM |
|------|--------|------|--------|---|---|-----|
| Oct 5, 2025 | J. Mitchell | Toronto | 19 | 2 | 1 | 0 |

- Jersey is optional
- Date must match Schedule tab exactly

---

### GoalieStats tab
| Date | Team | Goalie | Jersey | W | L | T | GA | SO | PIM |
|------|------|--------|--------|---|---|---|----|----|-----|
| Oct 5, 2025 | Toronto | Nello Deluca | 1 | 1 | 0 | 0 | 2 | 0 | 0 |

- Jersey is optional
- Date must match Schedule tab exactly

---

### Schedule tab
| Date | Time | Home | Away | HomeScore | AwayScore | Status | Playoff |
|------|------|------|------|-----------|-----------|--------|---------|
| Oct 5, 2025 | 6:00 PM | Dallas | Toronto | 3 | 5 | Final | 0 |
| Apr 15, 2026 | 6:00 PM | Toronto | Dallas | 4 | 2 | Final | 1 |
| May 1, 2026 | 6:00 PM | Toronto | Dallas | | | Upcoming | 1 |

- Status: `Final`, `Tie`, or `Upcoming`
- Playoff: `1` = playoff game, `0` or blank = regular season
- Leave scores blank for upcoming games
- Time column: use "6:00 PM" format (not a date cell — plain text)

---

### Registration tab
| Key | Value |
|-----|-------|
| StartDate | 2026-09-01 |
| EndDate | 2026-10-15 |

Use YYYY-MM-DD format. The form opens automatically within this window.

---

### Round Robin tab
One column per team, header = team name, value = round robin points:

| Toronto | Philadelphia | Los Angeles | Dallas |
|---------|-------------|-------------|--------|
| 5.5 | 7.5 | 14.5 | 5 |

Used in the Playoffs standings view (RRPTS column) on the Home page.

---

## Updating Stats Week to Week
After each game:
1. **Schedule tab** — change Status to Final or Tie, add scores
2. **GameStats tab** — add one row per skater with G, A, PIM
3. **GoalieStats tab** — add one row per goalie with W/L/T, GA, SO, PIM

---

## Awards Page
The 🏆 Awards nav link appears automatically when all regular season games are played and disappears when registration opens.

**Regular Season Awards:**
1. 🏆 President's Trophy — 1st place team
2. 🎯 Rocket Richard Trophy — Most goals (tiebreaker: fewest PIM)
3. 📊 Art Ross Trophy — Most points (tiebreaker: most goals → fewest PIM)
4. 🛡️ Norris Trophy — Defenceman with most points (same tiebreakers)
5. 🥅 Vezina Trophy — Lowest GAA (tiebreakers: W → SO → fewest PIM)
6. 🤝 Lady Byng Trophy — All players with 0 PIM

**Playoff Awards** (shown after all playoff games played):
1. 🏒 VAHL Champions — from Misc tab Champion column
2. 🌟 Conn Smythe Trophy — Most playoff points (tiebreaker: most goals → fewest PIM)
3. 👑 Prince of Wales Trophy — Top Round Robin team

---

## images/ Folder
Place announcement or feature images here. Reference the filename in the Misc tab Image column to show it on the Home page below the announcement text.

---

## Regular Season / Playoffs / Combined Toggles
All stat pages (Home, Teams, Stats, Roster, Player, Awards) have a Regular Season / Playoffs toggle. Stats and Roster pages also have Combined. The Playoff column in the Schedule tab determines which games count in each view.

---

## Page Summary
| Page | File | Description |
|------|------|-------------|
| Home | index.html | Standings, results, leaders, announcement |
| Teams | teams.html | Team cards, H2H records, streak dots |
| Roster | roster.html | Skater and goalie rosters with stats |
| Player Profile | player.html | Per-player game log |
| Schedule | schedule.html | Full schedule, results, clickable boxscores |
| Stats | stats.html | League-wide leaderboards |
| Awards | awards.html | Season and playoff awards |
| Handouts | handouts.html | PDF documents |
| Registration | registration.html | Date-gated registration form |
| Contact | contact.html | Contact form and rink info |
| Boxscore | boxscore.html | Full game stats |

---

## Setup Steps (for reference / future reinstall)

### Step 2 — Publish Your Google Sheet
1. File > Share > Publish to web
2. Select Entire Document, Web page format
3. Click Publish
4. Copy the Sheet ID from the URL between /d/ and /edit

### Step 3 — Add Sheet ID to the Website
Open js/data.js and update:
```
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
```

### Step 4 — Deploy the Registration Apps Script
1. Open the Google Sheet → Extensions > Apps Script
2. Paste the contents of registration-script.gs
3. Deploy > New Deployment > Web App
4. Execute as: Me, Who has access: Anyone
5. Copy the Web App URL into registration.html

### Step 5 — Set Up EmailJS
Open contact.html and update:
```
const EMAILJS_PUBLIC_KEY  = '...';
const EMAILJS_SERVICE_ID  = '...';
const EMAILJS_TEMPLATE_ID = '...';
```

### Step 6 — PDF Handouts
Place PDF files in handouts/ with these filenames:
- vahl-welcome.pdf
- vahl-rules.pdf
- vahl-waiver.pdf

### Step 7 — Host the Site
Upload all files to GitHub Pages or your web server.

---

## Team Colours
| Team | Primary | Accent | Background |
|------|---------|--------|------------|
| Toronto | #2563eb | #60a5fa | #1e3a8a |
| Philadelphia | #ea580c | #fb923c | #7c2d12 |
| Los Angeles | #9ca3af | #d1d5db | #1f2937 |
| Dallas | #4ade80 | #86efac | #14532d |

---

## Tips & Notes
- Team names must match exactly across all tabs
- Player names in GameStats must match Roster tab exactly
- Dates in GameStats/GoalieStats must match Schedule Date exactly
- Column order in any tab does not matter — read by header name
- Time column in Schedule should be plain text (e.g. "6:00 PM"), not a date cell
- Game nights: Sundays, 6:00 PM – 8:00 PM
- Rink: Sports Village, 2600 Rutherford Road, Vaughan ON L4K 5R1
- League email: communication.vahl@gmail.com
- Payment email: payment.vahl@gmail.com
