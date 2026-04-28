# Vaughan Adult Hockey League — Website Setup Guide

## Folder Structure
```
vahl/
├── index.html            ← Home page (standings, results, points leaders)
├── teams.html            ← Teams overview with standings & streak dots
├── roster.html           ← Roster page for all 4 teams (skaters + goalies)
├── schedule.html         ← Schedule & results
├── stats.html            ← League-wide skater & goalie leaderboards
├── handouts.html         ← Downloadable PDF documents
├── registration.html     ← Player registration form (date-gated)
├── player.html           ← Individual player profile & game log
├── contact.html          ← Contact form + rink info
├── registration-script.gs ← Google Apps Script (already deployed)
├── favicon.ico           ← Browser tab icon
├── site.webmanifest      ← Web app manifest for home screen icons
├── css/
│   └── style.css         ← All shared styles (mobile responsive)
├── js/
│   └── data.js           ← Google Sheets data loader & standings sort
├── logos/
│   ├── vahl-logo.jpg     ← VAHL league logo
│   ├── toronto.svg
│   ├── philadelphia.svg
│   ├── losangeles.svg
│   └── dallas.svg
├── icons/                ← App icons for all device sizes (16px–512px)
└── handouts/
    ├── README.txt        ← Instructions for adding PDF files
    ├── vahl-welcome.pdf  ← Place your welcome PDF here
    ├── vahl-rules.pdf    ← Place your rules PDF here
    └── vahl-waiver.pdf   ← Place your waiver PDF here
```

---

## Already Configured

The following are already set up in the website files:

- **Google Sheet ID** — set in js/data.js
- **Apps Script URL** — set in registration.html (handles registration form submissions)
- **EmailJS** — set in contact.html (handles contact form messages)
- **Live site** — https://www.furysoftware.com/vahl/index.html

---

## Google Sheet Structure

Sheet ID: already configured in js/data.js

### Required tabs (exact names):
- Roster
- GoalieRoster
- GameStats
- GoalieStats
- Schedule
- Registration
- Season
- Round Robin
- Misc
- Registrations (auto-created by Apps Script on first registration submission)

### Misc tab
Single tab with four columns — headers in row 1, values in row 2:

| Current Season | Champion | Announcement | Image | Font Size | Align |
|---|---|---|---|---|---|
| 2025-26 | Los Angeles | Welcome to... | 2025-26_Champions.jpeg | 15 | left |

- **Current Season** — displayed throughout the site as the season label
- **Champion** — team name shown in the VAHL Champions playoff award
- **Announcement** — text shown on the Home page. Use `\n` in the cell for line breaks. Leave blank for no announcement
- **Image** — filename from the `images/` folder shown below the announcement. Leave blank for none
- **Font Size** — font size in pixels for the announcement text (default: 15)
- **Align** — text alignment: `left`, `center`, or `right` (default: left)

- **Current Season** — displayed throughout the site as the season label
- **Champion** — team name shown in the VAHL Champions playoff award
- **Announcement** — text shown on the Home page below the logo. Leave blank for no announcement
- **Image** — filename of an image in the `images/` folder. Leave blank for no image. Image appears below the announcement text on the Home page

### images/ folder
Place any announcement or feature images here. Reference the filename (e.g. `2025-26_Champions.jpeg`) in the Misc tab Image column to display it on the Home page.

### Season tab (REMOVED)
The Season tab has NO column headers. Row 1 contains the label "Season" and row 2 contains the actual value:

| (no header) |
|-------------|
| Season      |
| 2025-26     |

Update the value in row 2 each year and the entire site refreshes automatically — no code changes needed.

### Champions tab
Single column, no header needed. Put the winning team name in the first cell:

| (first cell) |
|--------------|
| Toronto      |

This is read by the Awards page to display the VAHL Champions playoff award.

### Round Robin tab
One column per team, header = team name, value row = round robin points total:

| Toronto | Philadelphia | Los Angeles | Dallas |
|---------|-------------|-------------|--------|
| 5.5     | 7.5         | 14.5        | 5      |

This is only used in the Playoffs standings view on the Home page (RRPTS column).

---

### Roster tab — player registry (one row per player)
| Name | Team | Jersey | Pos |
|------|------|--------|-----|
| J. Mitchell | Toronto | 19 | F |
| B. Hartley | Toronto | 44 | D |

- Pos values: F (Forward) or D (Defence)
- Add or remove players at any time during the season
- Column order does not matter — the site reads by header name

---

### GoalieRoster tab — goalie registry
| Name | Team | Jersey |
|------|------|--------|
| Nello Deluca | Toronto | 1 |

---

### GameStats tab — one row per skater per game
| GameDate | Player | Team | Jersey | G | A | PIM |
|----------|--------|------|--------|---|---|-----|
| Oct 5, 2025 | J. Mitchell | Toronto | 19 | 2 | 1 | 0 |

- **Jersey** is optional — for convenience when reading from game sheets, ignored by the website
- GameDate must match the Date column in the Schedule tab exactly
- Player name must match the Roster tab exactly
- Home and Away teams are looked up automatically from the Schedule tab
- G, A, PIM: enter 0 if none (or leave blank — treated as 0)
- The website sums all rows per player across all games automatically

---

### GoalieStats tab — one row per goalie per game
| GameDate | Team | Goalie | Jersey | W | L | T | GA | SO | PIM |
|----------|------|--------|--------|---|---|---|----|----|-----|
| Oct 5, 2025 | Toronto | Nello Deluca | 1 | 1 | 0 | 0 | 3 | 0 | 0 |

- **Jersey** is optional — for convenience, ignored by the website
- GameDate must match the Date column in the Schedule tab exactly
- W/L/T: enter 1 for the result, 0 for the others (only one should be 1 per game)
- GAA is calculated automatically — do NOT add a GAA column

---

### Schedule tab columns
| Date | Time | Home | Away | HomeScore | AwayScore | Status | Playoff |
|------|------|------|------|-----------|-----------|--------|--------|
| Oct 5, 2025 | 6:00 PM | Dallas | Toronto | 3 | 5 | Final | 0 |
| Oct 26, 2025 | 6:00 PM | Philadelphia | Toronto | 0 | 0 | Tie | 0 |
| Apr 27, 2026 | 6:00 PM | Toronto | Dallas | | | Upcoming | 0 |
| May 5, 2026 | 6:00 PM | Toronto | Dallas | 4 | 2 | Final | 1 |

Status values: Final, Tie, or Upcoming
Playoff column: 1 = playoff game, 0 or blank = regular season
Leave HomeScore and AwayScore blank for upcoming games.

The website uses the Playoff column in the Schedule tab to determine which games count
in Regular Season vs Playoff views across all pages — standings, stats, points leaders,
and individual player game logs all filter by this column.

---

### Registration tab — controls when the registration form is open
| Key | Value |
|-----|-------|
| StartDate | 2026-09-01 |
| EndDate | 2026-10-15 |

Use YYYY-MM-DD format. The form opens and closes automatically based on today's date.

---

### Standings Tiebreaker Order
1. Points — most points
2. Wins — most wins
3. Head-to-Head — points earned in games directly between tied teams
4. Goal Differential — GF minus GA
5. Penalty Minutes — fewest total PIM across all players on the roster

---


## Setup Steps (for reference / future reinstall)

These are already configured on the live site but kept here for reference if you ever need to set up the site fresh.

---

## Step 2 — Publish Your Google Sheet

1. In your Google Sheet, go to File > Share > Publish to web
2. Select Entire Document and format Web page
3. Click Publish and confirm
4. Copy the Sheet ID from the URL — the long string between /d/ and /edit:

   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit

---

## Step 3 — Add Your Sheet ID to the Website

Open js/data.js and replace the placeholder near the top:

   const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';

With your actual Sheet ID. Save the file.

---

## Step 4 — Deploy the Registration Apps Script

This is a one-time setup that lets registration form submissions write
directly to your Google Sheet and email you automatically.

1. Open your VAHL Google Sheet
2. Click Extensions > Apps Script
3. Delete any existing code
4. Copy the entire contents of registration-script.gs and paste it in
5. Click Save (floppy disk icon)
6. Click Deploy > New Deployment
7. Click the gear icon next to Type and choose Web App
8. Set:
     Description:   VAHL Registration Handler
     Execute as:    Me (your Google account)
     Who has access: Anyone
9. Click Deploy
10. Click Authorize Access and follow the Google permission prompts
11. Copy the Web App URL — it looks like:
    https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
12. Open registration.html and replace the placeholder:

    const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';

    With your actual Web App URL. Save the file.

Each registration will then:
- Add a new row automatically to the Registrations tab in your Sheet
- Send a notification email to communication.vahl@gmail.com

---

## Step 5 — Set Up EmailJS (Contact Form)

The contact page form uses EmailJS (emailjs.com) to send messages.
The following keys are already configured in contact.html:
- Public Key: set
- Service ID: set
- Template ID: set

If you ever need to update these, open contact.html and find:

   const EMAILJS_PUBLIC_KEY  = '...';
   const EMAILJS_SERVICE_ID  = '...';
   const EMAILJS_TEMPLATE_ID = '...';

WARNING: Never share your Private Key — it should never appear in any website file.

---

## Step 6 — Add Your PDF Handouts

Place your PDF files in the handouts/ folder with these exact filenames:
- vahl-welcome.pdf   — Welcome document
- vahl-rules.pdf     — League rules
- vahl-waiver.pdf    — Release, waiver & indemnity form

The handouts page links to them automatically.

---

## Step 7 — Host the Site

Upload all files in this folder to your web server or hosting provider.
The site is currently live at: https://www.furysoftware.com/vahl/index.html

For GitHub Pages (free alternative):
1. Create a free account at github.com
2. Click New repository, name it vahl
3. Set visibility to Public
4. Upload all files (drag & drop works in the browser)
   NOTE: Do not upload registration-script.gs — deployed separately via Apps Script
5. Go to Settings > Pages, select main branch, click Save
6. Your site will be live at: https://YOUR-USERNAME.github.io/vahl/

---
## Updating Stats Week to Week

After each game:

1. **Schedule tab** — change Status from Upcoming to Final or Tie, add scores
2. **GameStats tab** — add one row per skater with G, A, PIM for that game
3. **GoalieStats tab** — add one row per goalie with W/L/T, GA, SO, PIM

Standings, player totals, GAA, goal diff, points leaders all update automatically on page refresh.

---

## Managing Players

- **Add a player** — add a row to Roster (or GoalieRoster)
- **Remove a player** — delete their Roster row. Their historical game log is preserved
- **Mid-season additions** — players in GameStats but not yet in Roster will still appear

---

## Registration Form

The registration form is date-gated — it shows when today's date is within the Registration tab window.

**Preview mode** (for testing locally):
1. Open registration.html in a text editor
2. Find: `const PREVIEW_MODE = false;`
3. Change to: `const PREVIEW_MODE = true;`
4. Open in browser to see the open form
5. Change back to false before uploading

---

## PDF Handouts

Place PDF files in the handouts/ folder with these exact filenames:
- vahl-welcome.pdf — Welcome document
- vahl-rules.pdf — League rules
- vahl-waiver.pdf — Release, waiver & indemnity form

---

## Page Summary

| Page | File | Description |
|------|------|-------------|
| Home | index.html | Standings, recent results, upcoming games, points leaders |
| Teams | teams.html | All 4 teams with record, streak dots, goal diff |
| Roster | roster.html | Per-team skater and goalie roster, sortable, with totals |
| Player Profile | player.html | Per-player game-by-game stats log |
| Schedule/Results | schedule.html | Full schedule and results, filterable by team |
| Stats | stats.html | League-wide leaderboards, sortable, filterable |
| Handouts | handouts.html | Downloadable PDF documents |
| Registration | registration.html | Date-gated registration form, auto-fills Google Sheet |
| Boxscore | boxscore.html | Full game stats — skaters + goalies for a single game |
| Awards | awards.html | Season and playoff awards, auto-calculated from Sheet data |
| Contact | contact.html | Contact form + rink info and map |

---

## Stats & Roster Page Features

- Sortable columns — click any header to sort
- Pos sort: Forwards first (F↑) or Defence first (D↑), sorted by points within group
- Player names clickable — links to individual game-by-game profile page
- Team names clickable — links to that team's roster page
- Roster always shows Forwards first, then Defence, regardless of Sheet order
- Goalie GAA calculated automatically from W+L+T and GA (60-min games)

---

## Team Colours

| Team | Dot Colour | Accent | Logo Background |
|------|-----------|--------|-----------------|
| Toronto | #2563eb | #60a5fa | #1e3a8a |
| Philadelphia | #ea580c | #fb923c | #7c2d12 |
| Los Angeles | #9ca3af | #d1d5db | #1f2937 |
| Dallas | #4ade80 | #86efac | #14532d |

---

## Awards Page

The Awards nav link (🏆 Awards) appears automatically between Stats and Handouts when:
- All regular season games (Playoff = 0) have been played
- Registration for the next season has not yet opened

It disappears automatically when registration opens.

**Regular Season Awards:** President's Trophy, Rocket Richard, Art Ross, Norris, Vezina, Lady Byng
**Playoff Awards:** VAHL Champions (from Champions tab), Conn Smythe (most playoff pts), Prince of Wales (top Round Robin team)

## Tips & Notes

- Team names must match exactly across all tabs (e.g. Los Angeles not LA)
- Player names in GameStats must match the Roster tab exactly
- Game dates in GameStats/GoalieStats must match the Schedule tab Date column exactly
- Column order in any tab does not matter — the site reads by header name
- Conditional formatting in Google Sheets (by team colour) works on entire columns — set range to C:C not C1:C1000
- Game nights: Sundays, 6:00 PM – 8:00 PM
- Rink: Sports Village, 2600 Rutherford Road, Vaughan ON L4K 5R1
- League email: communication.vahl@gmail.com
- Payment email: payment.vahl@gmail.com
