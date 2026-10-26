import { todayStr } from './dates.js';

export const STORE_KEY = 'shq-state-v1';

export function defaultState() {
  const t = todayStr();
  return {
    v: 1,
    createdAt: t,
    evaluatedUntil: t, // last date checked for streak freezes
    settings: { morning: '07:00', evening: '19:30', name: '' },
    xp: { health: 0, german: 0 },
    lessonIndex: 0,
    completedLessons: {}, // lessonId -> date
    days: {}, // date -> day record
    srs: {}, // cardId -> { box, due, reps }
    skills: {}, // skillId -> points from lessons
    frozen: [], // dates covered by a streak freeze
    badges: {}, // badgeId -> date
    bosses: {}, // "<week>" -> { id, done, score }
    notes: {}, // lessonId -> BA exercise text
    archSeen: []
  };
}

export function emptyDay(lessonId) {
  return {
    lessonId,
    health: false, german: false, bonus: false,
    timer: { health: 1800, german: 1800 },
    followUp: { health: false, german: false },
    quiz: {}, scenario: false, sectionsRead: false,
    grammar: {}, exercise: null, newCards: [], reviewed: 0,
    xp: { health: 0, german: 0 }
  };
}

export function migrate(raw) {
  const d = defaultState();
  if (!raw || typeof raw !== 'object' || raw.v !== 1) return d;
  return {
    ...d, ...raw,
    settings: { ...d.settings, ...(raw.settings || {}) },
    xp: { ...d.xp, ...(raw.xp || {}) }
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
  if (!st || st.v !== 1 || !st.xp) throw new Error('This file is not a Health Quest progress export.');
  return migrate(st);
}
