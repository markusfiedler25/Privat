// Card queues for both blocks.
// Healthcare: one continuous stream of lesson cards (stage → case type → card). Each day pulls
// cards from the stream until the block's time target is reached.
// German: a daily plan built from the day's healthcare topic, plus extra cards when the plan
// is finished before the time target.
import { STAGES, MODULES, MODULE_BY_ID, STAGE_BA, CARD_BY_ID, DRILL_LIST, RADAR, SUBLEVELS } from '../content/index.js';
import { isoWeek, weekday } from './dates.js';
import { dueIds } from './srs.js';
import { germanStatus } from './german.js';

export const MODULE_CARDS = [
  { kind: 'process', est: 3, title: 'Process & roles' },
  { kind: 'systems', est: 3, title: 'SAP IS-H & Epic' },
  { kind: 'interfaces', est: 2, title: 'Interfaces & standards' },
  { kind: 'tariffs', est: 2, title: 'Tariffs & regulation' },
  { kind: 'scenario', est: 3, title: 'Scenario & typical errors' },
  { kind: 'quiz', est: 3, title: 'Quick quiz' },
  { kind: 'kpi', est: 2, title: 'KPIs & BA idea' },
  { kind: 'ripple', est: 2, title: 'Ripple effect' },
  { kind: 'why', est: 1, title: 'Why this matters' }
];

export const STREAM = (() => {
  const out = [];
  for (const st of STAGES) {
    const mods = MODULES.filter(m => m.stage === st.id);
    if (!mods.length) continue;
    for (const m of mods) {
      for (const c of MODULE_CARDS) out.push({ id: `${m.id}:${c.kind}`, kind: c.kind, est: c.est, title: c.title, moduleId: m.id, stageId: st.id, caseType: m.caseType, block: 'health' });
    }
    if (STAGE_BA[st.id]) out.push({ id: `${st.id}:ba`, kind: 'ba', est: 10, title: STAGE_BA[st.id].title, stageId: st.id, block: 'health' });
  }
  return out;
})();
export const STREAM_INDEX = Object.fromEntries(STREAM.map((c, i) => [c.id, i]));
export const STREAM_MINUTES = STREAM.reduce((n, c) => n + c.est, 0);

export function topicAt(pos) {
  for (let i = Math.min(pos, STREAM.length - 1); i >= 0; i--) if (STREAM[i].moduleId) return STREAM[i].moduleId;
  return MODULES.length ? MODULES[0].id : null;
}

// Module of the most recent lesson card finished before `date`.
export function lastModuleBefore(state, date) {
  let best = -1;
  for (const [id, c] of Object.entries(state.cardsDone)) {
    const i = STREAM_INDEX[id];
    if (i !== undefined && c.date < date && i > best) best = i;
  }
  return best >= 0 ? topicAt(best) : null;
}

export function pickRadar(state, week) {
  const unseen = RADAR.filter(r => !state.radarSeen.includes(r.id));
  if (unseen.length) return unseen[0];
  const n = Number(week.split('-W')[1]) || 0;
  return RADAR[n % RADAR.length];
}

// Upcoming healthcare cards: today's follow-up and the weekly radar card first, then the stream.
export function healthPending(state, date, look = 3) {
  const day = state.days[date];
  const done = new Set(day.health.cards);
  const out = [];
  const fu = lastModuleBefore(state, date);
  if (fu && !done.has(`fu:${date}`)) out.push({ id: `fu:${date}`, kind: 'followup', est: 2, title: 'Follow-up from last time', moduleId: fu, block: 'health' });
  const wd = weekday(date);
  if (wd === 0 || wd >= 3) { // Wednesday to Sunday
    const wk = isoWeek(date), id = `radar:${wk}`;
    if (!state.cardsDone[id]) { const item = pickRadar(state, wk); if (item) out.push({ id, kind: 'radar', est: 3, title: 'Regulatory radar', itemId: item.id, block: 'health' }); }
  }
  for (let i = state.stream.pos; i < STREAM.length && out.length < look; i++) out.push(STREAM[i]);
  if (state.stream.pos >= STREAM.length) {
    let k = day.health.cards.filter(id => id.startsWith('review:')).length;
    while (out.length < look) { out.push({ id: `review:${date}:${k}`, kind: 'review', est: 3, title: 'Review quiz', block: 'health' }); k++; }
  }
  return out;
}

/* ---------------- German ---------------- */

export function nextDrill(state, exclude = []) {
  const working = Math.max(SUBLEVELS.indexOf('A2.1'), germanStatus(state).subIdx);
  const done = state.drillsDone;
  const open = DRILL_LIST.filter(d => !done[d.id] && !exclude.includes(d.id));
  const atLevel = open.filter(d => SUBLEVELS.indexOf(d.sub) >= working);
  if (atLevel.length) return atLevel[0];
  if (open.length) return open[open.length - 1];
  const pool = DRILL_LIST.filter(d => !exclude.includes(d.id));
  const sorted = (pool.length ? pool : DRILL_LIST).slice().sort((a, b) => (done[a.id].score - done[b.id].score) || done[a.id].date.localeCompare(done[b.id].date));
  return sorted[0];
}

export function nextExercise(state, moduleId) {
  const m = MODULE_BY_ID[moduleId];
  if (!m) return null;
  const i = m.german.exercises.findIndex((_, k) => !state.gExDone[`${m.id}:${k}`]);
  return i >= 0 ? { key: `${m.id}:${i}`, ex: m.german.exercises[i] } : null;
}

function previousTopic(state, date) {
  const dates = Object.keys(state.days).filter(d => d < date && state.days[d].topic && state.days[d].german && state.days[d].german.cards.length).sort();
  return dates.length ? state.days[dates[dates.length - 1]].topic : null;
}

export function buildGermanPlan(state, date) {
  const day = state.days[date];
  const topic = MODULE_BY_ID[day.topic];
  const plan = [];
  const prev = previousTopic(state, date);
  if (prev) plan.push({ id: `gfu:${date}`, kind: 'g-followup', est: 2, title: 'Follow-up von gestern', moduleId: prev, block: 'german' });
  const due = dueIds(state, date).length;
  if (due > 0) plan.push({ id: `grev:${date}`, kind: 'g-review', est: Math.max(3, Math.min(12, Math.ceil(due * 0.35))), title: 'Wiederholung', block: 'german' });
  const fresh = topic ? topic.german.vocab.filter(id => CARD_BY_ID[id] && !state.srs[id]) : [];
  if (fresh.length) plan.push({ id: `gnew:${date}`, kind: 'g-new', est: Math.max(3, Math.min(8, fresh.length)), title: 'Neue Wörter', ids: fresh, moduleId: topic.id, block: 'german' });
  const drill = nextDrill(state);
  if (drill) plan.push({ id: `ggr:${date}:${drill.id}`, kind: 'g-grammar', est: 8, title: `Grammatik: ${drill.title}`, drillId: drill.id, block: 'german' });
  const ex = topic ? nextExercise(state, topic.id) : null;
  if (ex) plan.push({ id: `gex:${date}`, kind: 'g-exercise', est: 8, title: `Praxis: ${ex.ex.title}`, exKey: ex.key, moduleId: topic.id, block: 'german' });
  if (topic && topic.german.reading && !state.readingsDone[topic.id]) plan.push({ id: `grd:${date}`, kind: 'g-reading', est: 6, title: `Lesen: ${topic.german.reading.title}`, moduleId: topic.id, block: 'german' });
  plan.push({ id: `gbld:${date}:0`, kind: 'g-builder', est: 5, title: 'Satzbau', moduleId: topic ? topic.id : null, set: 0, block: 'german' });
  plan.push({ id: `gut:${date}`, kind: 'g-usetoday', est: 3, title: 'Use it today vorbereiten', block: 'german' });
  return plan;
}

// Extra German cards that unlock when the plan is done before the time target.
export function extraGermanCard(state, date, k) {
  const day = state.days[date];
  const id = `gx:${date}:${k}`;
  const kinds = ['g-dictation', 'g-speed', 'g-grammar', 'g-builder'];
  const kind = kinds[k % kinds.length];
  if (kind === 'g-grammar') {
    const usedToday = (day.german.plan || []).filter(c => c.drillId).map(c => c.drillId);
    const d = nextDrill(state, usedToday);
    return { id, kind, est: 8, title: `Grammatik: ${d.title}`, drillId: d.id, block: 'german', extra: true };
  }
  if (kind === 'g-dictation') return { id, kind, est: 5, title: 'Diktat', moduleId: day.topic, set: k, block: 'german', extra: true };
  if (kind === 'g-speed') return { id, kind, est: 4, title: 'Speed-Runde', set: k, block: 'german', extra: true };
  return { id, kind: 'g-builder', est: 5, title: 'Satzbau', moduleId: day.topic, set: k + 1, block: 'german', extra: true };
}

// Preview of the German plan before it is stored (Today screen).
export function germanQueue(state, date) {
  const day = state.days[date];
  const plan = day.german.plan || buildGermanPlan(state, date);
  const done = new Set(day.german.cards);
  return plan.filter(c => !done.has(c.id));
}

// Sentences for builder and dictation: the topic's example sentences and phrases.
export function practiceSentences(state, moduleId) {
  const m = MODULE_BY_ID[moduleId];
  const out = [];
  if (m) {
    m.german.vocab.forEach(id => { const c = CARD_BY_ID[id]; if (c && c.ex) out.push({ de: c.ex, en: c.exEn }); });
    (m.german.phrases || []).forEach(p => out.push({ de: p.de, en: p.en }));
  }
  if (out.length < 6) {
    Object.keys(state.srs).forEach(id => { const c = CARD_BY_ID[id]; if (c && c.ex && !out.some(o => o.de === c.ex)) out.push({ de: c.ex, en: c.exEn }); });
  }
  return out.filter(s => s.de.split(' ').length >= 3);
}

export function pickSet(list, set, n) {
  if (!list.length) return [];
  const start = (set * n) % list.length;
  const out = [];
  for (let i = 0; i < Math.min(n, list.length); i++) out.push(list[(start + i) % list.length]);
  return out;
}
