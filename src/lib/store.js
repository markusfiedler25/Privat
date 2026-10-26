import { todayStr, addMonths } from './dates.js';

// Same key as v1 so existing progress on a phone is found and migrated.
export const STORE_KEY = 'shq-state-v1';

export function defaultProfile(today = todayStr()) {
  return {
    name: '',
    germanReached: 'A2',          // highest CEFR level already reached (could pass the exam)
    germanTarget: 'C1',
    targetDate: addMonths(today, 6),
    split: { german: 45, health: 15 },
    morning: '07:00', evening: '19:30',
    setupDone: false
  };
}

export function defaultState() {
  const t = todayStr();
  return {
    v: 2,
    createdAt: t,
    evaluatedUntil: t,
    profile: defaultProfile(t),
    xp: { health: 0, german: 0 },
    stream: { pos: 0 },            // position in the healthcare card stream
    days: {},                      // date -> day record
    cardsDone: {},                 // cardId -> { date, sec, est, title, kind, block }
    answers: {},                   // cardId -> card-specific answers
    modulesDone: {}, stagesDone: {},
    drillsDone: {}, gExDone: {}, readingsDone: {}, radarSeen: [],
    srs: {}, skills: {}, frozen: [], badges: {}, bosses: {}, notes: {}, archSeen: [],
    useToday: {},                  // date -> challenge { id, type, track, text, status }
    reflections: {},               // ISO week -> { applied, changed, date }
    germanLog: [],                 // German practice outside the app: { date, min, what }
    stats: { fastCards: 0 },
    legacy: null
  };
}

export function newDay(topic = null) {
  return {
    v: 2,
    topic,
    health: { sec: 0, cards: [], cardSec: {}, met: false, grace: null },
    german: { sec: 0, cards: [], cardSec: {}, met: false, grace: null, plan: null, extra: 0 },
    bonus: false,
    xp: { health: 0, german: 0 }
  };
}

// v1 (30/30 halves) → v2 (time-based blocks with card queues)
function fromV1(raw) {
  const d = defaultState();
  d.createdAt = raw.createdAt || d.createdAt;
  d.evaluatedUntil = raw.evaluatedUntil || d.evaluatedUntil;
  const s = raw.settings || {};
  d.profile = { ...d.profile, name: s.name || '', morning: s.morning || d.profile.morning, evening: s.evening || d.profile.evening };
  d.xp = { health: raw.xp?.health || 0, german: raw.xp?.german || 0 };
  d.srs = raw.srs || {};
  d.skills = raw.skills || {};
  d.frozen = raw.frozen || [];
  d.bosses = raw.bosses || {};
  d.notes = raw.notes || {};
  d.archSeen = raw.archSeen || [];
  const keep = ['first-mission', 'perfect-quiz', 'streak-7', 'streak-30', 'freeze-saver', 'first-stage', 'words-100', 'words-500', 'boss-1', 'architect'];
  d.badges = Object.fromEntries(Object.entries(raw.badges || {}).filter(([k]) => keep.includes(k)));
  for (const [date, od] of Object.entries(raw.days || {})) {
    const day = newDay(null);
    day.health.sec = Math.max(0, 1800 - (od.timer?.health ?? 1800));
    day.german.sec = Math.max(0, 1800 - (od.timer?.german ?? 1800));
    day.health.met = !!od.health;
    day.german.met = !!od.german;
    day.bonus = !!od.bonus;
    day.xp = { health: od.xp?.health || 0, german: od.xp?.german || 0 };
    day.legacy = true;
    d.days[date] = day;
  }
  d.legacy = { lessons: Object.keys(raw.completedLessons || {}), migratedOn: todayStr() };
  return d;
}

export function migrate(raw) {
  if (!raw || typeof raw !== 'object') return defaultState();
  if (raw.v === 1) return fromV1(raw);
  if (raw.v !== 2) return defaultState();
  const d = defaultState();
  return {
    ...d, ...raw,
    profile: { ...d.profile, ...(raw.profile || {}), split: { ...d.profile.split, ...(raw.profile?.split || {}) } },
    xp: { ...d.xp, ...(raw.xp || {}) },
    stream: { ...d.stream, ...(raw.stream || {}) },
    stats: { ...d.stats, ...(raw.stats || {}) }
  };
}

export function loadState() {
  try { const raw = localStorage.getItem(STORE_KEY); return migrate(raw ? JSON.parse(raw) : null); }
  catch { return defaultState(); }
}

export function saveState(s) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); return true; } catch { return false; }
}

export function requestPersistence() {
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch { /* ignore */ }
}

export function downloadText(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

export function exportState(s) {
  downloadText(`health-quest-progress-${todayStr()}.json`, JSON.stringify({ app: 'swiss-health-quest', exportedAt: new Date().toISOString(), state: s }, null, 2));
}

export function parseImport(text) {
  const obj = JSON.parse(text);
  const st = obj && obj.app === 'swiss-health-quest' ? obj.state : obj;
  if (!st || (st.v !== 1 && st.v !== 2) || !st.xp) throw new Error('This file is not a Health Quest progress export.');
  return migrate(st);
}
