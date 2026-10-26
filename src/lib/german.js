// German level model and C1 projection.
// Source: Goethe-Institut guidance in teaching units of 45 minutes (cumulative):
// A1 80–200, A2 200–350, B1 350–650, B2 600–800, C1 800–1000, C2 1000+.
// We use the midpoint of each range, converted to clock hours, as the end of each level.
// It is a rough guide for guided learning; self-study and immersion vary a lot.
import { SUBLEVELS } from '../content/index.js';
import { addDays, diffDays } from './dates.js';

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const LEVEL_END_HOURS = { A1: 105, A2: 206, B1: 375, B2: 525, C1: 675, C2: 825 };
export const GOETHE_SOURCE = { name: 'Goethe-Institut – course FAQ', url: 'https://www.goethe.de/ins/gb/de/sta/lon/kur/faq.html' };

export const levelStart = level => { const i = LEVELS.indexOf(level); return i <= 0 ? 0 : LEVEL_END_HOURS[LEVELS[i - 1]]; };

// Minutes of German on one day: time in the app's German block + practice logged outside the app.
export function germanMinutesOn(state, date) {
  const d = state.days[date];
  const app = d && d.german ? d.german.sec / 60 : 0;
  const ext = state.germanLog.filter(l => l.date === date).reduce((n, l) => n + (Number(l.min) || 0), 0);
  return app + ext;
}

export function germanHours(state) {
  const app = Object.values(state.days).reduce((n, d) => n + (d.german ? d.german.sec : 0), 0) / 3600;
  const ext = state.germanLog.reduce((n, l) => n + (Number(l.min) || 0), 0) / 60;
  return app + ext;
}

export function germanStatus(state) {
  const base = LEVEL_END_HOURS[state.profile.germanReached] || 0;
  const studied = germanHours(state);
  const total = base + studied;
  const level = LEVELS.find(l => LEVEL_END_HOURS[l] > total) || 'C2';
  const start = levelStart(level), end = LEVEL_END_HOURS[level], mid = (start + end) / 2;
  const first = total < mid;
  const sub = level === 'C2' ? 'C2' : `${level}.${first ? 1 : 2}`;
  const subStart = first ? start : mid, subEnd = first ? mid : end;
  return {
    level, sub, subIdx: SUBLEVELS.indexOf(sub), total, studied, base,
    pct: Math.max(0, Math.min(1, (total - subStart) / (subEnd - subStart))),
    hoursToNext: Math.max(0, subEnd - total)
  };
}

// Average German minutes per day over the last 14 days (or since the start, if shorter).
export function germanPace(state, today) {
  const from = state.createdAt > addDays(today, -13) ? state.createdAt : addDays(today, -13);
  const days = Math.max(1, diffDays(from, today) + 1);
  let min = 0, active = 0;
  for (let i = 0; i < days; i++) {
    const m = germanMinutesOn(state, addDays(from, i));
    min += m; if (m >= 1) active++;
  }
  return { perDay: min / days, activeDays: active, windowDays: days };
}

export function projection(state, today) {
  const st = germanStatus(state);
  const target = state.profile.germanTarget || 'C1';
  const targetHours = LEVEL_END_HOURS[target];
  const remainingH = Math.max(0, targetHours - st.total);
  const pace = germanPace(state, today);
  const planned = state.profile.split.german;
  const usePlanned = pace.activeDays < 3;
  const perDay = usePlanned ? planned : pace.perDay;
  const daysNeeded = perDay > 0.5 ? Math.ceil((remainingH * 60) / perDay) : Infinity;
  const date = isFinite(daysNeeded) ? addDays(today, daysNeeded) : null;
  const daysLeft = Math.max(1, diffDays(today, state.profile.targetDate));
  const neededPerDay = Math.ceil((remainingH * 60) / daysLeft);
  const milestones = LEVELS
    .filter(l => LEVEL_END_HOURS[l] > st.total && LEVELS.indexOf(l) <= LEVELS.indexOf(target))
    .map(l => {
      const h = LEVEL_END_HOURS[l] - st.total;
      const dd = perDay > 0.5 ? Math.ceil((h * 60) / perDay) : Infinity;
      return { level: l, hours: h, date: isFinite(dd) ? addDays(today, dd) : null };
    });
  return { target, targetHours, remainingH, perDay, usePlanned, pace, date, daysNeeded, neededPerDay, daysLeft, onTrack: remainingH === 0 || neededPerDay <= perDay, milestones, status: st };
}
