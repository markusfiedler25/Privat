import { CAREERS, MODULES, MODULE_BY_ID, STAGES, STAGE_BA, ARCH, READY_STAGES } from '../content/index.js';
import { addDays, diffDays, isoWeek, todayStr } from './dates.js';
import { newDay } from './store.js';
import { topicAt } from './curriculum.js';
import { pickChallenge } from './usetoday.js';
import { germanStatus, germanPace, LEVEL_END_HOURS } from './german.js';
import { learnedCount } from './srs.js';

export const XP = {
  card: 5, quizCorrect: 10, followUp: 5, radarCorrect: 5,
  grammarCorrect: 3, gapCorrect: 4, readingCorrect: 4, builderCorrect: 3, dictationCorrect: 4, speedCorrect: 2,
  review: 1, reviewCap: 40, writeDone: 15, baExercise: 25,
  target: 20, full: 20, boss: 120, utDone: 15, utPartly: 7, reflection: 25
};

export function careerLevel(xp) {
  const ls = CAREERS.levels;
  let i = 0; ls.forEach((l, k) => { if (xp >= l.min) i = k; });
  const cur = ls[i], next = ls[i + 1];
  return { i, cur, next, pct: next ? (xp - cur.min) / (next.min - cur.min) : 1 };
}

/* ---------------- day record ---------------- */
export function ensureDay(d, date = todayStr()) {
  let day = d.days[date];
  if (!day) { day = newDay(topicAt(d.stream.pos)); d.days[date] = day; }
  if (!day.topic) day.topic = topicAt(d.stream.pos);
  if (!day.health.cards) Object.assign(day.health, { cards: [], cardSec: {}, grace: null });
  if (!day.german.cards) Object.assign(day.german, { cards: [], cardSec: {}, grace: null, plan: null, extra: 0 });
  if (!d.useToday[date]) d.useToday[date] = pickChallenge(d, date, day.topic);
  return day;
}

export function addXP(d, track, amount, date = todayStr()) {
  if (!amount) return;
  d.xp[track] = Math.max(0, d.xp[track] + amount);
  const day = d.days[date];
  if (day) day.xp[track] = Math.max(0, (day.xp[track] || 0) + amount);
}

export const isFullDay = day => !!(day && day.health && day.german && day.health.met && day.german.met);
export const targetSec = (state, block) => Math.max(5, state.profile.split[block]) * 60;

// Mark a block's target as reached (once) and award the full-mission bonus.
export function checkTarget(d, date, block, cardId) {
  const day = d.days[date];
  if (!day) return;
  const b = day[block];
  if (!b.met && b.sec >= targetSec(d, block)) {
    b.met = true; b.grace = cardId || null;
    addXP(d, block, XP.target, date);
  }
  if (isFullDay(day) && !day.bonus) {
    day.bonus = true;
    addXP(d, 'health', XP.full / 2, date); addXP(d, 'german', XP.full / 2, date);
  }
}

export function applyTime(d, date, block, cardId, secs) {
  const day = ensureDay(d, date);
  const b = day[block];
  b.sec += secs;
  if (cardId) b.cardSec[cardId] = (b.cardSec[cardId] || 0) + secs;
  checkTarget(d, date, block, cardId);
}

/* ---------------- streak with weekly freeze ---------------- */
export function applyFreezes(d, today = todayStr()) {
  const used = [];
  let day = d.evaluatedUntil && d.evaluatedUntil > d.createdAt ? d.evaluatedUntil : d.createdAt;
  const last = addDays(today, -1);
  while (day <= last) {
    if (!isFullDay(d.days[day]) && !d.frozen.includes(day)) {
      const wk = isoWeek(day);
      const weekUsed = d.frozen.some(f => isoWeek(f) === wk);
      const prev = addDays(day, -1);
      const alive = isFullDay(d.days[prev]) || d.frozen.includes(prev);
      if (!weekUsed && alive) { d.frozen.push(day); used.push(day); }
    }
    day = addDays(day, 1);
  }
  d.evaluatedUntil = today;
  return used;
}

export function streakInfo(state, today = todayStr()) {
  const ok = x => isFullDay(state.days[x]) || state.frozen.includes(x);
  const todayDone = isFullDay(state.days[today]);
  let n = 0; let x = todayDone ? today : addDays(today, -1);
  while (x >= state.createdAt && ok(x)) { n++; x = addDays(x, -1); }
  let best = 0, run = 0;
  const span = Math.max(0, diffDays(state.createdAt, today));
  for (let i = 0; i <= span; i++) {
    const day = addDays(state.createdAt, i);
    if (ok(day)) { run++; best = Math.max(best, run); } else if (day !== today) run = 0;
  }
  const wk = isoWeek(today);
  return { streak: n, best: Math.max(best, n), todayDone, freezeAvailable: !state.frozen.some(f => isoWeek(f) === wk) };
}

/* ---------------- skills and career ---------------- */
export function skillPoints(state) {
  const pts = { ...CAREERS.baseline };
  for (const [k, v] of Object.entries(state.skills)) pts[k] = (pts[k] || 0) + v;
  const h = germanStatus(state).total;
  // 25 German points = end of B2 (working German for most hospital roles).
  pts.german = Math.max(0, Math.min(30, Math.round(25 * (h - LEVEL_END_HOURS.A1) / (LEVEL_END_HOURS.B2 - LEVEL_END_HOURS.A1))));
  return pts;
}

export function roleProgress(role, pts) {
  let have = 0, need = 0;
  for (const [k, t] of Object.entries(role.targets)) { need += t; have += Math.min(pts[k] || 0, t); }
  return need ? have / need : 0;
}

export function readiness(state, role, today = todayStr()) {
  const pts = skillPoints(state);
  const keys = Object.keys(role.targets).filter(k => k !== 'german');
  const remaining = keys.reduce((n, k) => n + Math.max(0, role.targets[k] - (pts[k] || 0)), 0);
  const gTarget = role.targets.german || 0;
  const gRemaining = Math.max(0, gTarget - (pts.german || 0));
  if (remaining <= 0 && gRemaining <= 0) return { ready: true };
  const lessons = Object.keys(state.modulesDone).length;
  if (lessons < 2) return { needData: true };
  const elapsed = Math.max(1, diffDays(state.createdAt, today) + 1);
  const earned = keys.reduce((n, k) => n + (state.skills[k] || 0), 0);
  const rate = earned / elapsed;
  const skillDays = remaining > 0 ? (rate > 0 ? Math.ceil(remaining / rate) : Infinity) : 0;
  let gDays = 0;
  if (gRemaining > 0) {
    const needHours = LEVEL_END_HOURS.A1 + (gTarget / 25) * (LEVEL_END_HOURS.B2 - LEVEL_END_HOURS.A1) - germanStatus(state).total;
    const pace = germanPace(state, today);
    const perDay = pace.activeDays < 3 ? state.profile.split.german : pace.perDay;
    gDays = perDay > 0.5 ? Math.ceil((needHours * 60) / perDay) : Infinity;
  }
  const days = Math.max(skillDays, gDays);
  return isFinite(days) ? { days, date: addDays(today, days) } : { needData: true };
}

// Points a lesson adds per role (for the "Why this matters" card).
export function careerImpact(module) {
  return CAREERS.roles.map(r => {
    const gained = Object.entries(module.skills || {}).filter(([k]) => r.targets[k]).map(([k, v]) => ({ skill: k, points: v }));
    return { role: r, gained, total: gained.reduce((n, g) => n + g.points, 0) };
  }).filter(x => x.total > 0).sort((a, b) => b.total - a.total);
}

/* ---------------- journey progress ---------------- */
export function moduleStatus(state, moduleId) {
  if (state.modulesDone[moduleId]) return 'done';
  const started = Object.keys(state.cardsDone).some(id => id.startsWith(moduleId + ':'));
  return started ? 'started' : 'open';
}

export function stageProgress(state) {
  return STAGES.map(s => {
    const mods = MODULES.filter(m => m.stage === s.id);
    const cases = Object.fromEntries(mods.map(m => [m.caseType, { module: m, status: moduleStatus(state, m.id) }]));
    const done = mods.filter(m => state.modulesDone[m.id]).length;
    return { ...s, ready: READY_STAGES.has(s.id), cases, total: mods.length, done, baDone: !!state.stagesDone[s.id], hasBa: !!STAGE_BA[s.id] };
  });
}

/* ---------------- badges ---------------- */
export const BADGES = [
  { id: 'first-mission', title: 'First full mission', desc: 'Both time targets reached in one day.' },
  { id: 'first-lesson', title: 'First lesson', desc: 'A full lesson, ripple effect included.' },
  { id: 'perfect-quiz', title: 'Perfect quiz', desc: 'All questions right in a lesson quiz.' },
  { id: 'fast-track', title: 'Ahead of schedule', desc: '10 cards finished faster than estimated.' },
  { id: 'streak-7', title: '7-day streak', desc: 'Seven days in a row.' },
  { id: 'streak-30', title: '30-day streak', desc: 'Thirty days in a row.' },
  { id: 'freeze-saver', title: 'Saved by the freeze', desc: 'A weekly freeze kept your streak alive.' },
  { id: 'first-stage', title: 'Stage complete', desc: 'All three case types of a stage plus its BA exercise.' },
  { id: 'words-100', title: '100 words', desc: '100 words learned (box 2 or higher).' },
  { id: 'words-500', title: '500 words', desc: '500 words learned.' },
  { id: 'use-it-5', title: 'Used it at work', desc: 'Five "Use it today" challenges done.' },
  { id: 'reflect-1', title: 'Reflective', desc: 'First weekly reflection saved.' },
  { id: 'radar-4', title: 'Radar watcher', desc: 'Four regulatory radar cards.' },
  { id: 'boss-1', title: 'Boss beaten', desc: 'Completed a Sunday boss challenge.' },
  { id: 'architect', title: 'System architect', desc: 'Explored the whole system map.' }
];

export function earnedBadges(state) {
  const out = [];
  const days = Object.values(state.days);
  if (days.some(isFullDay)) out.push('first-mission');
  if (Object.keys(state.modulesDone).length) out.push('first-lesson');
  if (MODULES.some(m => { const a = state.answers[`${m.id}:quiz`]; return a && m.quiz.every((q, i) => a[i] === q.a); })) out.push('perfect-quiz');
  if ((state.stats.fastCards || 0) >= 10) out.push('fast-track');
  const { best } = streakInfo(state);
  if (best >= 7) out.push('streak-7');
  if (best >= 30) out.push('streak-30');
  if (state.frozen.length) out.push('freeze-saver');
  if (STAGES.some(s => { const mods = MODULES.filter(m => m.stage === s.id); return mods.length && mods.every(m => state.modulesDone[m.id]) && state.stagesDone[s.id]; })) out.push('first-stage');
  const learned = learnedCount(state);
  if (learned >= 100) out.push('words-100');
  if (learned >= 500) out.push('words-500');
  if (Object.values(state.useToday).filter(c => c.status === 'done').length >= 5) out.push('use-it-5');
  if (Object.keys(state.reflections).length) out.push('reflect-1');
  if (state.radarSeen.length >= 4) out.push('radar-4');
  if (Object.values(state.bosses).some(b => b.done)) out.push('boss-1');
  if (state.archSeen.length >= ARCH.nodes.length) out.push('architect');
  return out;
}

export { MODULE_BY_ID };
