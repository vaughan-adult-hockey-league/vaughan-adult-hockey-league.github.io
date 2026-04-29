// ============================================================
//  VAHL DATA LAYER — powered by Google Sheets
//
//  SHEET TABS REQUIRED:
//    Roster       — player registry (Name, Team, Jersey, Pos)
//    GoalieRoster — goalie registry (Name, Team, Jersey)
//    GameStats    — one row per skater per game
//    GoalieStats  — one row per goalie per game
//    Schedule     — game schedule and results
//    Registration — registration window dates
//
//  Teams and player totals are AUTO-CALCULATED from raw game data.
//  You never need to update running totals manually.
//
//  SETUP:
//  1. Publish your Google Sheet (File > Share > Publish to web)
//  2. Paste your Sheet ID below
// ============================================================

const SHEET_ID = '1M9EnwzwTgtJqMJid-z1YQ4cah4gsP4Wozv53wlwG1VQ';

const TAB_NAMES = {
  roster:       'Roster',
  gameStats:    'GameStats',
  schedule:     'Schedule',
  registration: 'Registration',
  roundRobin:   'Round Robin',
  misc:         'Misc',
};

const TEAM_COLORS = {
  'Toronto':      { primary: '#2563eb', light: '#dbeafe', muted: '#60a5fa' },
  'Philadelphia': { primary: '#ea580c', light: '#ffedd5', muted: '#fb923c' },
  'Los Angeles':  { primary: '#9ca3af', light: '#f3f4f6', muted: '#d1d5db' },
  'Dallas':       { primary: '#4ade80', light: '#dcfce7', muted: '#86efac' },
};

const TEAM_ABBR = {
  'Toronto': 'TOR', 'Philadelphia': 'PHI', 'Los Angeles': 'LAK', 'Dallas': 'DAL'
};

const TEAM_NAMES = ['Toronto', 'Philadelphia', 'Los Angeles', 'Dallas'];

// ── Fetch a single tab ─────────────────────────────────────────
const PLACEHOLDER_SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatSheetDate(val) {
  // Google Sheets gviz returns dates as Date(year,month,day) — month is 0-based
  if (typeof val === 'string' && val.startsWith('Date(')) {
    const parts = val.replace('Date(','').replace(')','').split(',').map(Number);
    // parts[0]=year, parts[1]=month (0-based), parts[2]=day
    return `${MONTH_ABBR[parts[1]]} ${parts[2]}, ${parts[0]}`;
  }
  // Also handle formatted date values from cell.f like "10/5/2025" or "Oct 5, 2025"
  if (typeof val === 'string') {
    // Convert M/D/YYYY format to "Oct 5, 2025"
    const mdyMatch = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdyMatch) {
      const mo = parseInt(mdyMatch[1]) - 1;
      return `${MONTH_ABBR[mo]} ${parseInt(mdyMatch[2])}, ${mdyMatch[3]}`;
    }
  }
  return val;
}

// Normalise any date string to "Oct 5, 2025" format for consistent lookups
function normaliseDate(val) {
  return formatSheetDate(String(val).trim());
}

async function fetchTab(tabName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${tabName}`);
  const text = await res.text();
  if (!text.includes('google.visualization.Query.setResponse')) {
    throw new Error(`Invalid response for tab: ${tabName}`);
  }
  const json = JSON.parse(text.substring(47, text.length - 2));
  if (!json.table) throw new Error(`No table data in tab: ${tabName}`);
  const cols = json.table.cols.map(c => c.label.trim());
  return (json.table.rows || [])
    .filter(row => row.c && row.c.some(cell => cell && cell.v !== null && cell.v !== ''))
    .map(row => {
      const obj = {};
      cols.forEach((col, i) => {
        const cell = row.c[i];
        let val = cell ? (cell.v !== null && cell.v !== undefined ? cell.v : '') : '';
        // For time/date cells, prefer the formatted string (cell.f) over the raw value
        if (cell && cell.f) {
          // Always use formatted value for non-numeric or date-like values
          const formatted = cell.f;
          // Only skip cell.f if it looks like a plain number we want to keep as-is
          if (!/^\d+(\.\d+)?$/.test(formatted)) {
            val = formatted;
          } else if (typeof val !== 'string') {
            val = formatted;
          }
        }
        val = formatSheetDate(String(val));
        // Store under the column name — if blank header, try to detect date and store as 'Date'
        if (col === '' && val && String(val).match(/[A-Z][a-z]{2}\s+\d|\d{1,2}[\/-]\d{1,2}[\/-]\d{4}/)) {
          obj['Date'] = val;
        } else if (col !== '') {
          obj[col] = val;
        }
      });
      return obj;
    });
}

function showSheetError() {
  const msg = `
    <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:1.5rem;margin:1rem 0;font-size:15px;color:#991b1b;">
      <strong>⚠️ Could not load data from Google Sheets.</strong><br>
      Please check that your Sheet ID is correct, the sheet is published to the web,
      and all required tabs exist (Roster, GameStats, Schedule).
    </div>`;
  document.querySelectorAll('main .container, main').forEach(el => {
    if (!el.querySelector('.sheet-error')) {
      const div = document.createElement('div');
      div.className = 'sheet-error';
      div.innerHTML = msg;
      el.prepend(div);
    }
  });
}

// ── Build a fast date+team → game info lookup from Schedule ────
// Includes Playoff flag from Schedule tab
function buildGameLookup(schedule) {
  const lookup = {};
  schedule.filter(g => g.Status !== 'Upcoming').forEach(g => {
    const d = normaliseDate(g.Date);
    const isPlayoff = Number(g.Playoff || 0) === 1;
    lookup[`${d}|${g.Home}`] = { opponent: g.Away, home: g.Home, away: g.Away, playoff: isPlayoff };
    lookup[`${d}|${g.Away}`] = { opponent: g.Home, home: g.Home, away: g.Away, playoff: isPlayoff };
  });
  return lookup;
}

// ── Filter schedule rows by season type ───────────────────────
// Schedule Playoff column: 1 = playoff, 0 or missing = regular season
function filterScheduleByPlayoff(rows, seasonType) {
  if (seasonType === 'all') return rows;
  return rows.filter(g => {
    const p = Number(g.Playoff || 0);
    return seasonType === 'playoff' ? p === 1 : p === 0;
  });
}

// ── Aggregate skater stats from GameStats ──────────────────────
// Accepts all roster players including goalies (Pos = G)
// seasonType: 'regular' | 'playoff' | 'all'
function aggregateSkaters(roster, gameStats, schedule, seasonType = 'all') {
  const gameLookup = buildGameLookup(schedule);
  const hasPlayoffData = schedule.some(g => Number(g.Playoff || 0) === 1);
  const players = {};
  roster.forEach(p => {
    const key = `${p.Name}|${p.Team}`;
    players[key] = { Name: p.Name, Team: p.Team, Jersey: p.Jersey || '', Pos: p.Pos || 'F', G: 0, A: 0, PTS: 0, PIM: 0 };
  });
  gameStats.forEach(row => {
    const playerName = row.Player || row.Name || row.player || '';
    const team = row.Team || row.team || '';
    const dateRaw = row.Date || row.GameDate || row['Game Date'] || row.date ||
      Object.values(row).find(v => v && String(v).match(/\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|[A-Z][a-z]{2}\s+\d/)) || '';
    const dateStr = normaliseDate(dateRaw);

    // Filter by season type using Schedule's Playoff flag
    if (seasonType !== 'all') {
      if (!hasPlayoffData) {
        if (seasonType === 'playoff') return;
      } else {
        const gameInfo = gameLookup[`${dateStr}|${team}`] || {};
        const isPlayoff = gameInfo.playoff === true;
        if (seasonType === 'playoff' && !isPlayoff) return;
        if (seasonType === 'regular' && isPlayoff) return;
      }
    }

    const key = `${playerName}|${team}`;
    if (!players[key]) {
      players[key] = { Name: playerName, Team: team, Jersey: '', Pos: 'F', G: 0, A: 0, PTS: 0, PIM: 0 };
    }
    players[key].G   += Number(row.G   || 0);
    players[key].A   += Number(row.A   || 0);
    players[key].PIM += Number(row.PIM || 0);
    players[key].PTS  = players[key].G + players[key].A;
  });
  return Object.values(players);
}

// ── Aggregate goalie stats ─────────────────────────────────────
// W/L/T/GA/SO/GAA are derived from the Schedule tab (source of truth).
// A tie is detected when HomeScore === AwayScore (regardless of Status).
// PIM is read from GameStats rows where Pos = G, or falls back to GoalieStats.
// seasonType: 'regular' | 'playoff' | 'all'
function aggregateGoalies(goalieRoster, gameStats, schedule, seasonType = 'all') {
  const hasPlayoffData = schedule.some(g => Number(g.Playoff || 0) === 1);

  // Build PIM lookup from GameStats rows with Pos = G
  // Key: goalieName|team|dateStr → PIM
  const pimLookup = {};
  gameStats.forEach(row => {
    const pos = (row.Pos || row.pos || '').toUpperCase();
    if (pos !== 'G') return;
    const name = row.Player || row.Name || '';
    const team = row.Team || row.team || '';
    const dateRaw = row.Date || row.GameDate || row['Game Date'] || '';
    const dateStr = normaliseDate(dateRaw);
    const key = `${name}|${team}|${dateStr}`;
    pimLookup[key] = (pimLookup[key] || 0) + Number(row.PIM || 0);
  });

  // Build goalie registry from GoalieRoster
  const goalies = {};
  goalieRoster.forEach(g => {
    const key = `${g.Name}|${g.Team}`;
    goalies[key] = { Name: g.Name, Team: g.Team, Jersey: g.Jersey || '', W: 0, L: 0, T: 0, GA: 0, SO: 0, PIM: 0, GAA: 0 };
  });

  // Process each played schedule game and derive goalie stats
  const playedGames = schedule.filter(g => {
    if (g.Status === 'Upcoming' || g.HomeScore === '' || g.AwayScore === '') return false;
    // Season type filter
    if (seasonType !== 'all') {
      if (!hasPlayoffData) return seasonType === 'regular';
      const isPlayoff = Number(g.Playoff || 0) === 1;
      return seasonType === 'playoff' ? isPlayoff : !isPlayoff;
    }
    return true;
  });

  playedGames.forEach(g => {
    const homeScore = Number(g.HomeScore);
    const awayScore = Number(g.AwayScore);
    const isTie = homeScore === awayScore;
    const dateStr = normaliseDate(g.Date);

    for (const [team, oppScore, myScore] of [
      [g.Home, awayScore, homeScore],
      [g.Away, homeScore, awayScore]
    ]) {
      // Find this team's goalie from GoalieRoster
      const goalie = goalieRoster.find(gr => gr.Team === team);
      if (!goalie) continue;

      const key = `${goalie.Name}|${team}`;
      if (!goalies[key]) {
        goalies[key] = { Name: goalie.Name, Team: team, Jersey: goalie.Jersey || '', W: 0, L: 0, T: 0, GA: 0, SO: 0, PIM: 0, GAA: 0 };
      }

      // Derive W/L/T from scores
      if (isTie)          { goalies[key].T += 1; }
      else if (myScore > oppScore) { goalies[key].W += 1; }
      else                { goalies[key].L += 1; }

      // GA = opposing team's score
      goalies[key].GA += oppScore;

      // SO = shutout if opposing team scored 0
      if (oppScore === 0) goalies[key].SO += 1;

      // PIM from GameStats (Pos=G rows), fallback to 0
      const pimKey = `${goalie.Name}|${team}|${dateStr}`;
      goalies[key].PIM += pimLookup[pimKey] || 0;
    }
  });

  // Calculate GAA
  Object.values(goalies).forEach(g => {
    const gp = g.W + g.L + g.T;
    g.GAA = gp > 0 ? g.GA / gp : 0;
  });

  return Object.values(goalies);
}

// ── Build team standings from Schedule ─────────────────────────
// seasonType: 'regular' | 'playoff' | 'all'
// Uses Schedule's Playoff column to filter games
function buildTeams(schedule, seasonType = 'all') {
  const teams = {};
  TEAM_NAMES.forEach(name => {
    teams[name] = { Team: name, W: 0, L: 0, T: 0, PTS: 0, GF: 0, GA: 0 };
  });
  const hasPlayoffData = schedule.some(g => Number(g.Playoff || 0) === 1);
  const rows = schedule.filter(g => {
    if (g.Status === 'Upcoming') return false;
    if (g.HomeScore === '' || g.AwayScore === '') return false;
    return true;
  });
  const filtered = (seasonType === 'all') ? rows :
    !hasPlayoffData ? (seasonType === 'playoff' ? [] : rows) :
    filterScheduleByPlayoff(rows, seasonType);

  filtered.forEach(g => {
    const hs = Number(g.HomeScore), as = Number(g.AwayScore);
    // Treat equal scores as tie regardless of Status label
    const isTie = hs === as;
    if (!teams[g.Home]) teams[g.Home] = { Team: g.Home, W:0, L:0, T:0, PTS:0, GF:0, GA:0 };
    if (!teams[g.Away]) teams[g.Away] = { Team: g.Away, W:0, L:0, T:0, PTS:0, GF:0, GA:0 };
    teams[g.Home].GF += hs; teams[g.Home].GA += as;
    teams[g.Away].GF += as; teams[g.Away].GA += hs;
    if (isTie) {
      teams[g.Home].T += 1; teams[g.Home].PTS += 1;
      teams[g.Away].T += 1; teams[g.Away].PTS += 1;
    } else if (hs > as) {
      teams[g.Home].W += 1; teams[g.Home].PTS += 2;
      teams[g.Away].L += 1;
    } else {
      teams[g.Away].W += 1; teams[g.Away].PTS += 2;
      teams[g.Home].L += 1;
    }
  });
  return Object.values(teams);
}

// ── Main data loader ───────────────────────────────────────────
let _cache = null;
let _miscCache = null;
let _rrCache = null;

async function loadData() {
  if (_cache) return _cache;
  const usingPlaceholder = SHEET_ID === PLACEHOLDER_SHEET_ID;
  try {
    // Fetch all tabs in parallel — including Misc and Round Robin
    const [roster, gameStats, schedule, miscRaw, rrRaw] = await Promise.all([
      fetchTab(TAB_NAMES.roster),
      fetchTab(TAB_NAMES.gameStats),
      fetchTab(TAB_NAMES.schedule),
      fetchTab(TAB_NAMES.misc).catch(() => []),
      fetchTab(TAB_NAMES.roundRobin).catch(() => []),
    ]);

    // Parse Misc tab — fetchTab already returns row objects keyed by column header
    _miscCache = miscRaw.length ? miscRaw[0] : {};

    // Parse Round Robin tab
    _rrCache = rrRaw.length ? rrRaw[0] : {};

    // Split roster into skaters (non-G) and goalies (Pos = G)
    const skaterRoster = roster.filter(p => (p.Pos || '').toUpperCase() !== 'G');
    const goalieRoster = roster.filter(p => (p.Pos || '').toUpperCase() === 'G');

    const skaters = aggregateSkaters(skaterRoster, gameStats, schedule, 'all');
    const goalies = aggregateGoalies(goalieRoster, gameStats, schedule, 'all');
    const teams   = buildTeams(schedule, 'all');
    _cache = { teams, skaters, goalies, schedule, roster, skaterRoster, goalieRoster, gameStats, misc: _miscCache, roundRobin: _rrCache };
    return _cache;
  } catch (e) {
    console.error('Failed to load Google Sheets data:', e);
    if (!usingPlaceholder) {
      document.addEventListener('DOMContentLoaded', showSheetError);
      showSheetError();
    }
    FALLBACK_DATA.teams = buildTeams(FALLBACK_DATA.schedule);
    FALLBACK_DATA.goalies.forEach(g => {
      const gp = g.W + g.L + g.T;
      g.GAA = gp > 0 ? g.GA / gp : 0;
    });
    FALLBACK_DATA.gameStats = [];
    FALLBACK_DATA.roster = [];
    FALLBACK_DATA.skaterRoster = [];
    FALLBACK_DATA.goalieRoster = [];
    FALLBACK_DATA.misc = {};
    FALLBACK_DATA.roundRobin = {};
    return FALLBACK_DATA;
  }
}

// ── Registration window ────────────────────────────────────────
async function fetchRegistrationWindow() {
  try {
    const rows = await fetchTab(TAB_NAMES.registration);
    const obj = {};
    rows.forEach(r => { if (r.Key) obj[r.Key.trim()] = String(r.Value).trim(); });
    return obj;
  } catch (e) { return null; }
}

// ── Round Robin points ─────────────────────────────────────────
async function fetchRoundRobin() {
  if (_rrCache) return _rrCache;
  try {
    const rows = await fetchTab(TAB_NAMES.roundRobin);
    _rrCache = rows.length ? rows[0] : {};
    return _rrCache;
  } catch (e) { return {}; }
}

// ── Misc tab helpers ───────────────────────────────────────────
// Data is fetched as part of loadData() for performance.
// These helpers use the in-memory cache when available.
async function fetchMisc() {
  if (_miscCache) return _miscCache;
  try {
    const url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:json&sheet=' + encodeURIComponent(TAB_NAMES.misc);
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}')+1));
    const cols = json.table.cols.map(c => c.label.trim());
    const rows = json.table.rows || [];
    const obj = {};
    if (cols.some(c => c) && rows[0]) {
      rows[0].c.forEach((cell, i) => { if (cols[i]) obj[cols[i]] = cell && cell.v != null ? String(cell.v).trim() : ''; });
    } else if (rows.length >= 2) {
      const headers = rows[0].c.map(cell => cell && cell.v != null ? String(cell.v).trim() : '');
      rows[1].c.forEach((cell, i) => { if (headers[i]) obj[headers[i]] = cell && cell.v != null ? String(cell.v).trim() : ''; });
    }
    _miscCache = obj;
    return obj;
  } catch(e) { return {}; }
}

async function fetchSeason() {
  const misc = _miscCache || await fetchMisc();
  return misc['Current Season'] || '2025-26';
}

async function fetchChampion() {
  const misc = _miscCache || await fetchMisc();
  return misc['Champion'] || '';
}

async function fetchAnnouncement() {
  const misc = _miscCache || await fetchMisc();
  return { text: misc['Announcement'] || '', image: misc['Image'] || '', fontSize: misc['Font Size'] || '15', align: misc['Align'] || 'left' };
}
function teamDot(team, size = 8) {
  const color = TEAM_COLORS[team]?.primary || '#999';
  return `<span style="display:inline-block;width:${size}px;height:${size}px;border-radius:50%;background:${color};margin-right:6px;flex-shrink:0;"></span>`;
}

// ── Standings sort with full tiebreaker chain ──────────────────
function standingsSort(teams, schedule, skaters = [], goalies = []) {
  const withDiff = teams.map(t => ({ ...t, DIFF: Number(t.GF||0) - Number(t.GA||0) }));
  const teamPIM = {};
  [...skaters, ...goalies].forEach(p => {
    if (!p.Team) return;
    teamPIM[p.Team] = (teamPIM[p.Team] || 0) + Number(p.PIM || 0);
  });
  function h2hPoints(teamA, teamB) {
    const pts = { [teamA]: 0, [teamB]: 0 };
    schedule.filter(g => g.Status !== 'Upcoming')
      .filter(g => (g.Home===teamA&&g.Away===teamB)||(g.Home===teamB&&g.Away===teamA))
      .forEach(g => {
        const hs = Number(g.HomeScore), as = Number(g.AwayScore);
        if (g.Status==='Tie') { pts[g.Home]+=1; pts[g.Away]+=1; }
        else if (hs>as) pts[g.Home]+=2;
        else pts[g.Away]+=2;
      });
    return pts;
  }
  return [...withDiff].sort((a,b) => {
    if (b.PTS!==a.PTS) return b.PTS-a.PTS;
    if (b.W!==a.W) return b.W-a.W;
    const h2h = h2hPoints(a.Team,b.Team);
    if (h2h[b.Team]!==h2h[a.Team]) return h2h[b.Team]-h2h[a.Team];
    if (b.DIFF!==a.DIFF) return b.DIFF-a.DIFF;
    return (teamPIM[a.Team]||0)-(teamPIM[b.Team]||0);
  });
}

// ── Fallback data (shown before Sheet is configured) ───────────
const FALLBACK_DATA = {
  teams: [],
  skaters: [
    { Name: 'J. Mitchell',  Team: 'Toronto',      Jersey: 19, Pos: 'F', G: 8, A: 11, PTS: 19, PIM: 4  },
    { Name: 'R. Svensson',  Team: 'Philadelphia', Jersey: 10, Pos: 'F', G: 7, A: 9,  PTS: 16, PIM: 6  },
    { Name: 'D. Kowalski',  Team: 'Toronto',      Jersey: 7,  Pos: 'F', G: 5, A: 7,  PTS: 12, PIM: 6  },
    { Name: 'K. Okafor',    Team: 'Los Angeles',  Jersey: 11, Pos: 'F', G: 5, A: 8,  PTS: 13, PIM: 2  },
    { Name: 'P. Lavoie',    Team: 'Toronto',      Jersey: 11, Pos: 'F', G: 4, A: 6,  PTS: 10, PIM: 2  },
    { Name: 'C. Beaumont',  Team: 'Philadelphia', Jersey: 14, Pos: 'F', G: 3, A: 7,  PTS: 10, PIM: 4  },
    { Name: 'M. Tremblay',  Team: 'Dallas',       Jersey: 21, Pos: 'F', G: 4, A: 6,  PTS: 10, PIM: 8  },
    { Name: 'T. Garza',     Team: 'Los Angeles',  Jersey: 22, Pos: 'D', G: 4, A: 5,  PTS: 9,  PIM: 10 },
    { Name: 'B. Hartley',   Team: 'Toronto',      Jersey: 44, Pos: 'D', G: 2, A: 5,  PTS: 7,  PIM: 10 },
    { Name: 'N. Volkov',    Team: 'Dallas',       Jersey: 18, Pos: 'F', G: 3, A: 3,  PTS: 6,  PIM: 4  },
    { Name: 'F. Marchetti', Team: 'Philadelphia', Jersey: 9,  Pos: 'F', G: 2, A: 3,  PTS: 5,  PIM: 12 },
    { Name: 'S. Nguyen',    Team: 'Toronto',      Jersey: 23, Pos: 'D', G: 1, A: 4,  PTS: 5,  PIM: 4  },
    { Name: 'T. Brennan',   Team: 'Toronto',      Jersey: 88, Pos: 'F', G: 2, A: 2,  PTS: 4,  PIM: 0  },
    { Name: 'C. Orenstein', Team: 'Toronto',      Jersey: 16, Pos: 'F', G: 1, A: 3,  PTS: 4,  PIM: 8  },
    { Name: 'J. Park',      Team: 'Los Angeles',  Jersey: 17, Pos: 'F', G: 2, A: 2,  PTS: 4,  PIM: 2  },
    { Name: 'L. Johansson', Team: 'Dallas',       Jersey: 12, Pos: 'F', G: 2, A: 1,  PTS: 3,  PIM: 6  },
    { Name: 'M. Deluca',    Team: 'Toronto',      Jersey: 55, Pos: 'D', G: 1, A: 2,  PTS: 3,  PIM: 6  },
  ],
  goalies: [
    { Name: 'A. Petrov',   Team: 'Toronto',      Jersey: 31, W: 5, L: 1, T: 0, GA: 12, SO: 1, PIM: 0 },
    { Name: 'M. Dubois',   Team: 'Philadelphia', Jersey: 30, W: 4, L: 2, T: 1, GA: 18, SO: 0, PIM: 2 },
    { Name: 'C. Holt',     Team: 'Los Angeles',  Jersey: 33, W: 3, L: 3, T: 1, GA: 22, SO: 0, PIM: 0 },
    { Name: 'R. Flanagan', Team: 'Toronto',      Jersey: 35, W: 1, L: 0, T: 1, GA: 6,  SO: 0, PIM: 2 },
    { Name: 'B. Santos',   Team: 'Dallas',       Jersey: 31, W: 1, L: 5, T: 1, GA: 28, SO: 0, PIM: 4 },
  ],
  schedule: [
    { Date: 'Apr 25', Time: 'Final',   Home: 'Dallas',       Away: 'Toronto',      HomeScore: 2, AwayScore: 4, Status: 'Final' },
    { Date: 'Apr 22', Time: 'Final',   Home: 'Los Angeles',  Away: 'Philadelphia', HomeScore: 1, AwayScore: 3, Status: 'Final' },
    { Date: 'Apr 18', Time: 'Final',   Home: 'Toronto',      Away: 'Los Angeles',  HomeScore: 2, AwayScore: 2, Status: 'Tie'   },
    { Date: 'Apr 15', Time: 'Final',   Home: 'Philadelphia', Away: 'Toronto',      HomeScore: 2, AwayScore: 5, Status: 'Final' },
    { Date: 'Apr 11', Time: 'Final',   Home: 'Dallas',       Away: 'Philadelphia', HomeScore: 1, AwayScore: 4, Status: 'Final' },
    { Date: 'Apr 8',  Time: 'Final',   Home: 'Los Angeles',  Away: 'Toronto',      HomeScore: 1, AwayScore: 3, Status: 'Final' },
    { Date: 'Apr 4',  Time: 'Final',   Home: 'Los Angeles',  Away: 'Dallas',       HomeScore: 2, AwayScore: 3, Status: 'Final' },
    { Date: 'Apr 1',  Time: 'Final',   Home: 'Dallas',       Away: 'Philadelphia', HomeScore: 3, AwayScore: 3, Status: 'Tie'   },
    { Date: 'May 2',  Time: '8:00 PM', Home: 'Toronto',      Away: 'Philadelphia', HomeScore: '', AwayScore: '', Status: 'Upcoming' },
    { Date: 'May 2',  Time: '9:30 PM', Home: 'Los Angeles',  Away: 'Dallas',       HomeScore: '', AwayScore: '', Status: 'Upcoming' },
    { Date: 'May 9',  Time: '7:30 PM', Home: 'Dallas',       Away: 'Toronto',      HomeScore: '', AwayScore: '', Status: 'Upcoming' },
    { Date: 'May 9',  Time: '9:00 PM', Home: 'Philadelphia', Away: 'Los Angeles',  HomeScore: '', AwayScore: '', Status: 'Upcoming' },
  ],
};
