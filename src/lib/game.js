import { addDays, diffDays, isoWeek, todayStr } from './dates.js';
import { LESSONS, STAGES, CAREERS, ARCH } from '../content/index.js';
import { emptyDay } from './store.js';

export const XP = {
  half: 50, quizCorrect: 10, followUp: 5, grammarCorrect: 3, gapCorrect: 4, writeDone: 15,
  review: 1, reviewCap: 30, scenario: 5, baExercise: 20, fullBonus: 30, boss: 120
};
export const FULL_FOCUS_SEC = 3540; // ~60 minutes on the timer

export const LEVELS = {
  health: [
    { name: 'Observer', min: 0 }, { name: 'Key User', min: 1000 }, { name: 'Junior Analyst', min: 3000 },
    { name: 'Analyst', min: 6000 }, { name: 'Application Manager', min: 10000 }, { name: 'Senior Analyst', min: 15000 }
  ],
  german: [
    { name: 'A2 Starter', min: 0 }, { name: 'A2+ Builder', min: 1500 }, { name: 'B1 Communicator', min: 4000 },
    { name: 'B1+ Professional', min: 8000 }, { name: 'B2 Ready', min: 13000 }
  ]
};

export function levelInfo(track, xp) {
  const ls = LEVELS[track];
  let i = 0; ls.forEach((l, k) => { if (xp >= l.min) i = k; });
  const cur = ls[i], next = ls[i + 1];
  return { i, cur, next, pct: next ? (xp - cur.min) / (next.min - cur.min) : 1 };
}

/* ---------- day & lesson ---------- */
export function ensureDay(draft, date = todayStr()) {
  if (!draft.days[date]) {
    const lesson = LESSONS[Math.min(draft.lessonIndex, LESSONS.length - 1)];
    draft.days[date] = emptyDay(draft.lessonIndex < LESSONS.length ? lesson.id : null);
  }
  return draft.days[date];
}

export function addXP(draft, track, amount, date = todayStr()) {
  if (!amount) return;
  draft.xp[track] = Math.max(0, draft.xp[track] + amount);
  const d = ensureDay(draft, date);
  d.xp[track] = Math.max(0, (d.xp[track] || 0) + amount);
}

export const isFullDay = d => !!(d && d.health && d.german);
export const focusSec = d => d ? (1800 - d.timer.health) + (1800 - d.timer.german) : 0;

// Award the 60-minute bonus once both halves are done and the timer has run ~60 min.
export function checkBonus(draft, date = todayStr()) {
  const d = draft.days[date];
  if (d && !d.bonus && isFullDay(d) && focusSec(d) >= FULL_FOCUS_SEC) {
    d.bonus = true;
    addXP(draft, 'health', XP.fullBonus / 2, date);
    addXP(draft, 'german', XP.fullBonus / 2, date);
    return true;
  }
  return false;
}

// Previous completed lesson (for the "follow-up from yesterday" card).
export function previousLesson(state, date = todayStr()) {
  let best = null;
  for (const [id, d] of Object.entries(state.completedLessons)) {
    if (d < date && (!best || d > best.date || (d === best.date && LESSONS.findIndex(l => l.id === id) > LESSONS.findIndex(l => l.id === best.id)))) best = { id, date: d };
  }
  return best ? LESSONS.find(l => l.id === best.id) : null;
}

/* ---------- streak with weekly freeze ---------- */
// Walk days that have passed since the last evaluation. A missed day is covered by a freeze
// if no freeze was used in that ISO week yet.
export function applyFreezes(draft, today = todayStr()) {
  const used = [];
  let d = addDays(draft.evaluatedUntil || draft.createdAt, 0);
  const last = addDays(today, -1);
  if (d < draft.createdAt) d = draft.createdAt;
  while (d <= last) {
    if (!isFullDay(draft.days[d]) && !draft.frozen.includes(d)) {
      const wk = isoWeek(d);
      const weekUsed = draft.frozen.some(f => isoWeek(f) === wk);
      // only freeze if the streak was alive the day before (otherwise nothing to protect)
      const prev = addDays(d, -1);
      const alive = isFullDay(draft.days[prev]) || draft.frozen.includes(prev);
      if (!weekUsed && alive) { draft.frozen.push(d); used.push(d); }
    }
    d = addDays(d, 1);
  }
  draft.evaluatedUntil = today;
  return used;
}

export function streakInfo(state, today = todayStr()) {
  const ok = d => isFullDay(state.days[d]) || state.frozen.includes(d);
  const todayDone = isFullDay(state.days[today]);
  let n = 0; let d = todayDone ? today : addDays(today, -1);
  while (ok(d) && d >= state.createdAt) { n++; d = addDays(d, -1); }
  // best streak
  let best = 0, run = 0;
  const span = Math.max(0, diffDays(state.createdAt, today));
  for (let i = 0; i <= span; i++) {
    const day = addDays(state.createdAt, i);
    if (ok(day)) { run++; best = Math.max(best, run); } else if (day !== today) run = 0;
  }
  const wk = isoWeek(today);
  const freezeAvailable = !state.frozen.some(f => isoWeek(f) === wk);
  return { streak: n, best: Math.max(best, n), todayDone, freezeAvailable };
}

/* ---------- SRS (Leitner boxes) ---------- */
const INTERVALS = [0, 1, 2, 4, 8, 16, 32, 64];
export function introduce(draft, ids, date = todayStr()) {
  ids.forEach(id => { if (!draft.srs[id]) draft.srs[id] = { box: 0, due: date, reps: 0, intro: date }; });
}
export function grade(draft, id, g, date = todayStr()) {
  const c = draft.srs[id] || { box: 0, due: date, reps: 0, intro: date };
  if (g === 'again') { c.box = 0; c.due = addDays(date, 1); }
  else { c.box = Math.min(INTERVALS.length - 1, c.box + (g === 'easy' ? 2 : 1)); c.due = addDays(date, INTERVALS[c.box]); }
  c.reps += 1; c.last = date;
  draft.srs[id] = c;
}
export function dueCards(state, date = todayStr()) {
  return Object.entries(state.srs).filter(([, c]) => c.due <= date).map(([id]) => id);
}
export const learnedCount = state => Object.values(state.srs).filter(c => c.box >= 2).length;

/* ---------- skills & career ---------- */
export function skillPoints(state) {
  const pts = { ...CAREERS.baseline };
  for (const [k, v] of Object.entries(state.skills)) pts[k] = (pts[k] || 0) + v;
  pts.german = Math.round(state.xp.german / 520); // 13,000 German XP ≈ 25 points (B2-ready track)
  return pts;
}
export function roleProgress(role, pts) {
  let have = 0, need = 0;
  for (const [k, t] of Object.entries(role.targets)) { need += t; have += Math.min(pts[k] || 0, t); }
  return need ? have / need : 0;
}
export function readiness(state, role, today = todayStr()) {
  const pts = skillPoints(state);
  const remaining = Object.entries(role.targets).reduce((n, [k, t]) => n + Math.max(0, t - (pts[k] || 0)), 0);
  const activeDays = Object.values(state.days).filter(d => d.health || d.german).length;
  const elapsed = Math.max(1, diffDays(state.createdAt, today) + 1);
  const earned = Object.values(state.skills).reduce((a, b) => a + b, 0) + pts.german;
  if (remaining <= 0) return { ready: true };
  if (activeDays < 3 || earned <= 0) return { ready: false, needData: true, remaining };
  // points per calendar day, share that goes to this role's skills roughly proportional
  const roleKeys = Object.keys(role.targets);
  const roleEarned = roleKeys.reduce((n, k) => n + (k === 'german' ? pts.german : (state.skills[k] || 0)), 0);
  const rate = roleEarned / elapsed;
  if (rate <= 0) return { ready: false, needData: true, remaining };
  const days = Math.ceil(remaining / rate);
  return { ready: false, days, date: addDays(today, days), remaining };
}

/* ---------- badges ---------- */
export const BADGES = [
  { id: 'first-mission', title: 'First full mission', desc: 'Both halves done in one day.' },
  { id: 'full-60', title: 'Full hour', desc: 'Both halves done with 60 minutes on the timer.' },
  { id: 'perfect-quiz', title: 'Perfect quiz', desc: 'All quiz questions right in one lesson.' },
  { id: 'streak-7', title: '7-day streak', desc: 'Seven days in a row.' },
  { id: 'streak-30', title: '30-day streak', desc: 'Thirty days in a row.' },
  { id: 'freeze-saver', title: 'Saved by the freeze', desc: 'A weekly freeze kept your streak alive.' },
  { id: 'first-stage', title: 'First stage done', desc: 'Completed a full patient-journey stage.' },
  { id: 'words-100', title: '100 words', desc: '100 words learned (box 2 or higher).' },
  { id: 'words-500', title: '500 words', desc: '500 words learned.' },
  { id: 'boss-1', title: 'Boss beaten', desc: 'Completed a Sunday boss challenge.' },
  { id: 'architect', title: 'System architect', desc: 'Explored the whole architecture map.' }
];

export function earnedBadges(state) {
  const out = [];
  const days = Object.values(state.days);
  if (days.some(isFullDay)) out.push('first-mission');
  if (days.some(d => d.bonus)) out.push('full-60');
  if (days.some(d => { const l = LESSONS.find(x => x.id === d.lessonId); return l && l.quiz.length && l.quiz.every((q, i) => d.quiz[i] === q.a); })) out.push('perfect-quiz');
  const { best } = streakInfo(state);
  if (best >= 7) out.push('streak-7');
  if (best >= 30) out.push('streak-30');
  if (state.frozen.length > 0) out.push('freeze-saver');
  if (STAGES.some(s => { const ls = LESSONS.filter(l => l.stage === s.id); return ls.length && ls.every(l => state.completedLessons[l.id]); })) out.push('first-stage');
  const learned = learnedCount(state);
  if (learned >= 100) out.push('words-100');
  if (learned >= 500) out.push('words-500');
  if (Object.values(state.bosses).some(b => b.done)) out.push('boss-1');
  if (state.archSeen.length >= ARCH.nodes.length) out.push('architect');
  return out;
}

export function stageProgress(state) {
  return STAGES.map(s => {
    const ls = LESSONS.filter(l => l.stage === s.id);
    const done = ls.filter(l => state.completedLessons[l.id]).length;
    return { ...s, total: ls.length, done };
  });
}
