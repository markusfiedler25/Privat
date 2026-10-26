import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { loadState, saveState, requestPersistence } from './lib/store.js';
import { todayStr, isoWeek } from './lib/dates.js';
import { applyFreezes, ensureDay, addXP, checkTarget, applyTime, XP, careerLevel, earnedBadges, BADGES } from './lib/game.js';
import { STREAM_INDEX, buildGermanPlan, extraGermanCard } from './lib/curriculum.js';
import { introduce, grade } from './lib/srs.js';
import { germanStatus } from './lib/german.js';
import { pickChallenge } from './lib/usetoday.js';
import { MODULE_BY_ID, STAGE_BA } from './content/index.js';
import { Icon } from './components/ui.jsx';
import Today from './screens/Today.jsx';
import Journey from './screens/Journey.jsx';
import ArchitectureMap from './screens/Architecture.jsx';
import Career from './screens/Career.jsx';
import Me from './screens/Me.jsx';
import Setup from './screens/Setup.jsx';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

function boot() {
  const s = loadState();
  const t = todayStr();
  const used = applyFreezes(s, t);
  ensureDay(s, t);
  return { s, used };
}

export default function App() {
  const [{ s: initial, used: initialFreezes }] = useState(boot);
  const [state, setState] = useState(initial);
  const [tab, setTab] = useState('today');
  const [view, setView] = useState('home'); // home | health | german | boss
  const [toasts, setToasts] = useState([]);
  const [levelUp, setLevelUp] = useState(null);
  const [today, setToday] = useState(todayStr());
  const stateRef = useRef(state); stateRef.current = state;

  const toast = useCallback((text, kind = 'xp') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2900);
  }, []);
  // XP gains in quick succession are merged into one toast.
  const xpRef = useRef({ id: null, total: 0, until: 0 });
  const xpToast = useCallback(amount => {
    const r = xpRef.current, now = Date.now();
    const id = Math.random().toString(36).slice(2);
    const total = r.id && now < r.until ? r.total + amount : amount;
    const old = r.id;
    xpRef.current = { id, total, until: now + 2600 };
    setToasts(t => [...t.filter(x => x.id !== old).slice(-2), { id, text: `+${total} XP`, kind: 'xp' }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2900);
  }, []);

  const mutate = useCallback(fn => {
    setState(prev => { const draft = structuredClone(prev); fn(draft); return draft; });
  }, []);

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => { requestPersistence(); }, []);
  useEffect(() => { if (initialFreezes.length) setTimeout(() => toast('Your weekly freeze saved your streak', 'freeze'), 600); }, []);

  /* ---------------- block clock: counts active time while a block is open ---------------- */
  const clock = useRef({ block: null, cardId: null, last: Date.now(), pending: 0, paused: false });
  const [, setTick] = useState(0);
  const flushClock = useCallback(() => {
    const c = clock.current;
    if (c.block && c.pending > 0) {
      const secs = c.pending, block = c.block, cardId = c.cardId;
      c.pending = 0;
      mutate(d => applyTime(d, todayStr(), block, cardId, secs));
    } else c.pending = 0;
  }, [mutate]);

  useEffect(() => {
    const iv = setInterval(() => {
      const c = clock.current; const now = Date.now();
      if (c.block && !c.paused && document.visibilityState === 'visible') {
        c.pending += Math.min(3, Math.max(0, (now - c.last) / 1000)); // cap: no counting while the phone slept
        c.last = now;
        if (c.pending >= 10) flushClock();
        setTick(t => t + 1);
      } else c.last = now;
    }, 1000);
    const onVis = () => { if (document.visibilityState === 'hidden') flushClock(); clock.current.last = Date.now(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', flushClock);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pagehide', flushClock); };
  }, [flushClock]);

  const clockApi = {
    setActive(block, cardId) {
      const c = clock.current;
      if (c.block !== block || c.cardId !== cardId) { flushClock(); c.block = block; c.cardId = cardId; c.last = Date.now(); }
    },
    clear() { flushClock(); clock.current.block = null; clock.current.cardId = null; },
    setPaused(p) { flushClock(); clock.current.paused = p; clock.current.last = Date.now(); setTick(t => t + 1); },
    get paused() { return clock.current.paused; },
    live(block) { const d = stateRef.current.days[today]; const base = d ? d[block].sec : 0; return base + (clock.current.block === block ? clock.current.pending : 0); },
    liveCard(block, cardId) { const d = stateRef.current.days[today]; const base = d ? (d[block].cardSec[cardId] || 0) : 0; return base + (clock.current.block === block && clock.current.cardId === cardId ? clock.current.pending : 0); },
    running(block) { return clock.current.block === block && !clock.current.paused; }
  };

  /* ---------------- day change while the app stays open ---------------- */
  useEffect(() => {
    const check = () => {
      const t = todayStr();
      if (t !== today) {
        flushClock();
        setToday(t);
        mutate(d => { const used = applyFreezes(d, t); ensureDay(d, t); if (used.length) toast('Your weekly freeze saved your streak', 'freeze'); });
        setView('home');
      }
    };
    const iv = setInterval(check, 30000);
    document.addEventListener('visibilitychange', check);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', check); };
  }, [today, flushClock]);

  /* ---------------- feedback: XP, level-ups, badges ---------------- */
  const prev = useRef({ xp: state.xp, sub: germanStatus(state).sub, reached: state.profile.germanReached });
  const gSub = germanStatus(state).sub;
  useEffect(() => {
    const p = prev.current;
    const gained = (state.xp.health - p.xp.health) + (state.xp.german - p.xp.german);
    if (gained >= 5) xpToast(gained);
    const a = careerLevel(p.xp.health).i, b = careerLevel(state.xp.health).i;
    if (b > a) setLevelUp({ track: 'health', name: careerLevel(state.xp.health).cur.name });
    if (p.reached === state.profile.germanReached && p.sub < gSub) setLevelUp({ track: 'german', name: gSub });
    prev.current = { xp: state.xp, sub: gSub, reached: state.profile.germanReached };
  }, [state.xp.health, state.xp.german, gSub, state.profile.germanReached]);

  useEffect(() => {
    const earned = earnedBadges(state).filter(id => !state.badges[id]);
    if (earned.length) {
      mutate(d => { earned.forEach(id => { d.badges[id] = todayStr(); }); });
      earned.forEach((id, i) => setTimeout(() => toast('Badge: ' + BADGES.find(x => x.id === id).title, 'badge'), 500 + i * 700));
    }
  }, [state]);

  /* ---------------- actions ---------------- */
  const actions = {
    completeCard(card, extra = {}) {
      flushClock();
      mutate(d => {
        const date = todayStr(); const day = ensureDay(d, date); const block = card.block; const b = day[block];
        if (b.cards.includes(card.id)) return;
        b.cards.push(card.id);
        const sec = Math.round(b.cardSec[card.id] || 0);
        d.cardsDone[card.id] = { date, sec, est: card.est, title: card.title, kind: card.kind, block };
        if (sec >= card.est * 60 * 0.3 && sec < card.est * 60) d.stats.fastCards = (d.stats.fastCards || 0) + 1;
        addXP(d, block, XP.card, date);
        if (block === 'health') {
          const i = STREAM_INDEX[card.id];
          if (i !== undefined && i >= d.stream.pos) d.stream.pos = i + 1;
          if (card.kind === 'why' && !d.modulesDone[card.moduleId]) {
            d.modulesDone[card.moduleId] = date;
            for (const [k, v] of Object.entries(MODULE_BY_ID[card.moduleId].skills || {})) d.skills[k] = (d.skills[k] || 0) + v;
          }
          if (card.kind === 'ba' && !d.stagesDone[card.stageId]) {
            d.stagesDone[card.stageId] = date;
            for (const [k, v] of Object.entries(STAGE_BA[card.stageId].skills || {})) d.skills[k] = (d.skills[k] || 0) + v;
            addXP(d, 'health', XP.baExercise, date);
          }
          if (card.kind === 'radar' && card.itemId && !d.radarSeen.includes(card.itemId)) d.radarSeen.push(card.itemId);
        } else {
          if (card.kind === 'g-grammar') d.drillsDone[card.drillId] = { date, score: extra.score ?? 0 };
          if (card.kind === 'g-exercise') d.gExDone[card.exKey] = date;
          if (card.kind === 'g-reading') d.readingsDone[card.moduleId] = date;
          const plan = b.plan || [];
          if (!plan.some(c => !b.cards.includes(c.id)) && !b.met) { plan.push(extraGermanCard(d, date, b.extra || 0)); b.extra = (b.extra || 0) + 1; b.plan = plan; }
        }
        if (b.grace === card.id) b.grace = null;
      });
    },
    ensureGermanPlan() {
      mutate(d => {
        const date = todayStr(); const day = ensureDay(d, date); const b = day.german;
        if (!b.plan) b.plan = buildGermanPlan(d, date);
        if (!b.plan.some(c => !b.cards.includes(c.id)) && !b.met) { b.plan.push(extraGermanCard(d, date, b.extra || 0)); b.extra = (b.extra || 0) + 1; }
      });
    },
    answer(cardId, patch) { mutate(d => { d.answers[cardId] = { ...(d.answers[cardId] || {}), ...patch }; }); },
    xp(track, amount) { mutate(d => addXP(d, track, amount, todayStr())); },
    introduce(ids) { mutate(d => introduce(d, ids, todayStr())); },
    grade(id, g, review) {
      mutate(d => {
        const date = todayStr(); const day = ensureDay(d, date);
        grade(d, id, g, date);
        if (review) { day.reviewed = (day.reviewed || 0) + 1; if (day.reviewed <= XP.reviewCap) addXP(d, 'german', XP.review, date); }
      });
    },
    checkin(date, status) {
      mutate(d => {
        const c = d.useToday[date]; if (!c || c.status) return;
        c.status = status; c.checkedOn = todayStr();
        const amt = status === 'done' ? XP.utDone : status === 'partly' ? XP.utPartly : 0;
        addXP(d, c.track === 'german' ? 'german' : 'health', amt, todayStr());
      });
      if (status === 'not') toast('No problem – today is a new chance', 'info');
    },
    swapChallenge() {
      mutate(d => {
        const date = todayStr(); const day = ensureDay(d, date); const cur = d.useToday[date];
        if (cur.swapped) return;
        d.useToday[date] = { ...pickChallenge(d, date, day.topic, [cur.id]), swapped: true };
      });
    },
    reflect(week, data) {
      mutate(d => { if (d.reflections[week]) return; d.reflections[week] = { ...data, date: todayStr() }; addXP(d, 'health', 15); addXP(d, 'german', 10); });
    },
    logGerman(min, what) { mutate(d => { d.germanLog.push({ date: todayStr(), min, what }); }); },
    note(key, text) { mutate(d => { d.notes[key] = text; }); },
    boss(week, patch, award) {
      mutate(d => {
        const b = d.bosses[week] || {}; d.bosses[week] = { ...b, ...patch };
        if (award && !b.done) { addXP(d, 'health', XP.boss / 2); addXP(d, 'german', XP.boss / 2); }
      });
    },
    archSeen(id) { mutate(d => { if (!d.archSeen.includes(id)) d.archSeen.push(id); }); },
    profile(patch) {
      flushClock();
      mutate(d => {
        d.profile = { ...d.profile, ...patch, split: { ...d.profile.split, ...(patch.split || {}) } };
        const date = todayStr(); ensureDay(d, date);
        checkTarget(d, date, 'health', null); checkTarget(d, date, 'german', null);
      });
    },
    replace(next) { clock.current.block = null; clock.current.pending = 0; prev.current = { xp: next.xp, sub: germanStatus(next).sub, reached: next.profile.germanReached }; const t = todayStr(); ensureDay(next, t); setState(next); }
  };

  const day = state.days[today];
  const ctx = { state, mutate, actions, toast, today, day, tab, setTab, view, setView, clock: clockApi, week: isoWeek(today) };

  const TABS = [
    { id: 'today', label: 'Today', icon: 'today' },
    { id: 'journey', label: 'Journey', icon: 'journey' },
    { id: 'map', label: 'System map', icon: 'map' },
    { id: 'career', label: 'Career', icon: 'career' },
    { id: 'me', label: 'Me', icon: 'me' }
  ];
  const running = clock.current.block && !clock.current.paused;

  return (
    <Ctx.Provider value={ctx}>
      <div className="mx-auto" style={{ maxWidth: 680 }}>
        {tab === 'today' && <Today />}
        {tab === 'journey' && <Journey />}
        {tab === 'map' && <ArchitectureMap />}
        {tab === 'career' && <Career />}
        {tab === 'me' && <Me />}
      </div>

      <nav className="tabbar" aria-label="Main">
        <div className="mx-auto grid grid-cols-5" style={{ maxWidth: 680 }}>
          {TABS.map(t => {
            const on = tab === t.id;
            return (
              <button key={t.id} type="button" onClick={() => { if (t.id !== 'today' || tab !== 'today') clockApi.clear(); setTab(t.id); if (t.id === 'today' && tab === 'today') setView('home'); window.scrollTo(0, 0); }}
                className="flex flex-col items-center gap-0.5 pt-2 pb-2 text-[11px] font-bold" style={{ color: on ? 'var(--pine)' : 'var(--muted)' }} aria-current={on ? 'page' : undefined}>
                <span className="relative">
                  <Icon n={t.icon} size={23} />
                  {t.id === 'today' && running && <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: 'var(--amber)' }} />}
                </span>
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="toasts" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="toast rounded-full px-4 py-2 font-bold text-sm flex items-center gap-2"
            style={{ boxShadow: 'var(--shadow)', background: t.kind === 'xp' ? 'var(--pine)' : t.kind === 'freeze' || t.kind === 'info' ? 'var(--sky)' : 'var(--amber)', color: 'var(--on-accent)' }}>
            <Icon n={t.kind === 'freeze' ? 'snow' : t.kind === 'badge' ? 'star' : t.kind === 'info' ? 'heart' : 'check'} size={16} />{t.text}
          </div>
        ))}
      </div>

      {levelUp && (
        <div className="overlay" style={{ alignItems: 'center', padding: 16 }} role="dialog" aria-modal="true" aria-label="Level up" onClick={() => setLevelUp(null)}>
          <div className="card pop p-6 text-center w-full" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="eyebrow" style={{ color: 'var(--amber)' }}>Level up · {levelUp.track === 'health' ? 'Career' : 'Deutsch'}</div>
            <h2 className="text-3xl font-extrabold mt-2">{levelUp.name}</h2>
            <p className="mt-2" style={{ color: 'var(--muted)' }}>{levelUp.track === 'health' ? 'One step closer to your target role.' : 'Neues Niveau erreicht. Weiter so!'}</p>
            <button type="button" autoFocus onClick={() => setLevelUp(null)} className="mt-5 rounded-full px-6 py-2.5 font-bold" style={{ background: 'var(--pine)', color: 'var(--on-accent)' }}>Keep going</button>
          </div>
        </div>
      )}

      {!state.profile.setupDone && <Setup />}
    </Ctx.Provider>
  );
}
