// "Use it today": one small, context-aware challenge per day for real work.
import { MODULE_BY_ID, UT_TEMPLATES, CARD_BY_ID } from '../content/index.js';
import { addDays, isoWeek, weekday, parse, fmt } from './dates.js';
import { nextDrill } from './curriculum.js';

function hash(s) {
  let h = 2166136261;
  for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
const rot = (arr, h) => (arr.length ? arr.slice(h % arr.length).concat(arr.slice(0, h % arr.length)) : arr);

function context(state, moduleId, date) {
  const m = MODULE_BY_ID[moduleId];
  const h = hash(date);
  if (!m) return { ctx: {}, module: null };
  const words = rot(m.german.vocab.map(id => CARD_BY_ID[id] && CARD_BY_ID[id].de.split(' / ')[0]).filter(Boolean), h);
  const phrases = rot((m.german.phrases || []).map(p => p.de), h);
  const terms = rot(m.terms || [], h);
  const drill = nextDrill(state);
  return {
    module: m,
    ctx: {
      w1: words[0], w2: words[1], w3: words[2],
      phrase: phrases[0], term: terms[0],
      ripple: m.ripples && m.ripples[0] ? m.ripples[0].error : null,
      symptom: m.ripples && m.ripples[0] ? m.ripples[0].symptom : null,
      stage: m.stageTitle, topic: m.title.split(':')[0],
      kpi: m.kpis && m.kpis[0] ? m.kpis[0].name : null,
      grammar: drill ? drill.title : null
    }
  };
}

export function pickChallenge(state, date, moduleId, exclude = []) {
  const { ctx, module } = context(state, moduleId, date);
  const history = Object.keys(state.useToday).filter(d => d < date).sort();
  const recentIds = new Set(history.filter(d => d >= addDays(date, -21)).map(d => state.useToday[d].id));
  const lastType = history.length ? state.useToday[history[history.length - 1]].type : null;
  const specific = module ? (module.useToday || []).map(c => ({ ...c, needs: [] })) : [];
  const generic = UT_TEMPLATES.filter(t => t.needs.every(k => ctx[k]));
  const all = [...specific, ...generic].filter(c => !exclude.includes(c.id));
  let pool = all.filter(c => !recentIds.has(c.id) && c.type !== lastType);
  if (!pool.length) pool = all.filter(c => c.type !== lastType);
  if (!pool.length) pool = all;
  const h = hash(date + '|' + exclude.join(','));
  const spec = pool.filter(c => specific.some(s => s.id === c.id));
  const from = spec.length && h % 3 !== 0 ? spec : pool;
  const c = from[h % from.length];
  const text = c.text.replace(/\{(\w+)\}/g, (_, k) => ctx[k] || '');
  return { id: c.id, type: c.type, track: c.track, text, topic: moduleId || null, words: [ctx.w1, ctx.w2, ctx.w3].filter(Boolean), phrase: ctx.phrase || null, status: null };
}

// Most recent challenge from the last 3 days that still waits for a check-in.
export function pendingCheckin(state, today) {
  const dates = Object.keys(state.useToday).filter(d => d < today && d >= addDays(today, -3) && !state.useToday[d].status).sort();
  return dates.length ? { date: dates[dates.length - 1], challenge: state.useToday[dates[dates.length - 1]] } : null;
}

export function weekDates(date) {
  const d = parse(date); const mondayOffset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return fmt(x); });
}

export function weekChallenges(state, date) {
  return weekDates(date).filter(d => state.useToday[d] && d <= date).map(d => ({ date: d, ...state.useToday[d] }));
}

// Weekly reflection: offered Friday to Sunday until saved for that week.
export function reflectionDue(state, today) {
  const wd = weekday(today);
  if (!(wd === 5 || wd === 6 || wd === 0)) return null;
  const wk = isoWeek(today);
  if (state.reflections[wk]) return null;
  return weekChallenges(state, today).length ? wk : null;
}
