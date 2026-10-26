import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { loadState, saveState, requestPersistence } from './lib/store.js';
import { todayStr } from './lib/dates.js';
import { applyFreezes, ensureDay, addXP, checkBonus, XP, levelInfo, earnedBadges, BADGES, introduce, grade } from './lib/game.js';
import { LESSON_BY_ID, LESSONS } from './content/index.js';
import { Icon } from './components/ui.jsx';
import Today from './screens/Today.jsx';
import Journey from './screens/Journey.jsx';
import ArchitectureMap from './screens/Architecture.jsx';
import Career from './screens/Career.jsx';
import Me from './screens/Me.jsx';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
const TIMER_KEY = 'shq-timer-v1';

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
  const [view, setView] = useState('home'); // Today sub-view: home | health | german | boss
  const [toasts, setToasts] = useState([]);
  const [levelUp, setLevelUp] = useState(null);
  const [today, setToday] = useState(todayStr());
  const stateRef = useRef(state); stateRef.current = state;

  const toast = useCallback((text, kind = 'xp') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2900);
  }, []);

  const mutate = useCallback(fn => {
    setState(prev => { const draft = structuredClone(prev); fn(draft); return draft; });
  }, []);

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => { requestPersistence(); }, []);
  useEffect(() => { if (initialFreezes.length) setTimeout(() => toast('Your weekly freeze saved your streak', 'freeze'), 600); }, []);

  // Day change while the app stays open
  useEffect(() => {
    const check = () => {
      const t = todayStr();
      if (t !== today) {
        setToday(t);
        mutate(d => { const used = applyFreezes(d, t); ensureDay(d, t); if (used.length) toast('Your weekly freeze saved your streak', 'freeze'); });
        setView('home');
      }
    };
    const iv = setInterval(check, 30000);
    document.addEventListener('visibilitychange', check);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', check); };
  }, [today]);

  // XP, level-up and badge feedback
  const prevXp = useRef(state.xp);
  useEffect(() => {
    const p = prevXp.current;
    const gained = (state.xp.health - p.health) + (state.xp.german - p.german);
    if (gained >= 5) toast(`+${gained} XP`);
    for (const tr of ['health', 'german']) {
      const a = levelInfo(tr, p[tr]).i, b = levelInfo(tr, state.xp[tr]).i;
      if (b > a) setLevelUp({ track: tr, name: levelInfo(tr, state.xp[tr]).cur.name });
    }
    prevXp.current = state.xp;
  }, [state.xp.health, state.xp.german]);

  useEffect(() => {
    const earned = earnedBadges(state).filter(id => !state.badges[id]);
    if (earned.length) {
      mutate(d => { earned.forEach(id => { d.badges[id] = todayStr(); }); });
      earned.forEach((id, i) => setTimeout(() => toast('Badge: ' + BADGES.find(b => b.id === id).title, 'badge'), 400 + i * 700));
    }
  }, [state]);

  /* ---------------- timer ---------------- */
  const [run, setRun] = useState(() => { try { const r = JSON.parse(localStorage.getItem(TIMER_KEY)); return r && r.date === todayStr() ? r : null; } catch { return null; } });
  const [now, setNow] = useState(Date.now());
  useEffect(() => { try { localStorage.setItem(TIMER_KEY, JSON.stringify(run)); } catch { /* ignore */ } }, [run]);
  useEffect(() => {
    if (!run) return;
    const iv = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(iv);
  }, [run]);
  const day = state.days[today] || ensureDay(structuredClone(state), today);
  const liveLeft = half => (run && run.half === half) ? Math.max(0, Math.ceil((run.endAt - now) / 1000)) : day.timer[half];
  const lastCommit = useRef(0);
  useEffect(() => {
    if (!run) return;
    const left = liveLeft(run.half);
    if (left === 0) {
      const half = run.half;
      mutate(d => { const dd = ensureDay(d); dd.timer[half] = 0; checkBonus(d); });
      setRun(null);
      toast(half === 'health' ? '30 minutes Healthcare IT done' : '30 Minuten Deutsch geschafft', 'done');
      try { navigator.vibrate && navigator.vibrate([120, 60, 120]); } catch { /* ignore */ }
      return;
    }
    if (now - lastCommit.current > 5000) {
      lastCommit.current = now;
      const half = run.half;
      mutate(d => { ensureDay(d).timer[half] = left; });
    }
  }, [now]);
  const wake = useRef(null);
  const startTimer = half => {
    const left = day.timer[half] > 0 ? day.timer[half] : 1800;
    if (run && run.half !== half) pauseTimer();
    setNow(Date.now());
    setRun({ half, endAt: Date.now() + left * 1000, date: todayStr() });
    try { navigator.wakeLock && navigator.wakeLock.request('screen').then(w => { wake.current = w; }).catch(() => {}); } catch { /* ignore */ }
  };
  const pauseTimer = () => {
    if (!run) return;
    const half = run.half, left = liveLeft(half);
    mutate(d => { ensureDay(d).timer[half] = left; });
    setRun(null);
    try { wake.current && wake.current.release(); } catch { /* ignore */ }
  };

  /* ---------------- actions ---------------- */
  const actions = {
    markHalf(half, val) {
      mutate(d => {
        const t = todayStr(); const dd = ensureDay(d, t);
        if (dd[half] === val) return;
        dd[half] = val;
        const track = half;
        addXP(d, track, val ? XP.half : -XP.half, t);
        if (half === 'health' && dd.lessonId) {
          const lesson = LESSON_BY_ID[dd.lessonId];
          if (val && !d.completedLessons[lesson.id]) {
            d.completedLessons[lesson.id] = t;
            for (const [k, v] of Object.entries(lesson.skills || {})) d.skills[k] = (d.skills[k] || 0) + v;
            const idx = LESSONS.findIndex(l => l.id === lesson.id);
            d.lessonIndex = Math.max(d.lessonIndex, idx + 1);
          } else if (!val && d.completedLessons[lesson.id] === t) {
            delete d.completedLessons[lesson.id];
            for (const [k, v] of Object.entries(lesson.skills || {})) d.skills[k] = Math.max(0, (d.skills[k] || 0) - v);
            const idx = LESSONS.findIndex(l => l.id === lesson.id);
            if (d.lessonIndex === idx + 1) d.lessonIndex = idx;
          }
        }
        if (!val && dd.bonus) { dd.bonus = false; addXP(d, 'health', -XP.fullBonus / 2, t); addXP(d, 'german', -XP.fullBonus / 2, t); }
        if (val) checkBonus(d, t);
      });
      if (val) setTimeout(() => {
        const dd = stateRef.current.days[todayStr()];
        if (dd && dd.health && dd.german) toast(dd.bonus ? 'Full hour! Mission complete' : 'Mission complete · streak +1', 'done');
      }, 50);
    },
    followUp(half) { mutate(d => { const dd = ensureDay(d); if (!dd.followUp[half]) { dd.followUp[half] = true; addXP(d, half, XP.followUp); } }); },
    quiz(i, oi) {
      mutate(d => { const dd = ensureDay(d); if (dd.quiz[i] !== undefined) return; dd.quiz[i] = oi; const l = LESSON_BY_ID[dd.lessonId]; if (l && l.quiz[i].a === oi) addXP(d, 'health', XP.quizCorrect); });
    },
    scenario() { mutate(d => { const dd = ensureDay(d); if (!dd.scenario) { dd.scenario = true; addXP(d, 'health', XP.scenario); } }); },
    saveBA(lessonId, text, award) {
      mutate(d => { d.notes[lessonId] = text; const dd = ensureDay(d); if (award && !dd.baDone) { dd.baDone = true; addXP(d, 'health', XP.baExercise); } });
    },
    grammar(i, oi, correct) { mutate(d => { const dd = ensureDay(d); if (dd.grammar[i] !== undefined) return; dd.grammar[i] = oi; if (correct) addXP(d, 'german', XP.grammarCorrect); }); },
    exercise(result) {
      mutate(d => {
        const dd = ensureDay(d); if (dd.exercise && dd.exercise.done) return;
        dd.exercise = { ...result, done: true };
        addXP(d, 'german', result.type === 'write' ? XP.writeDone : (result.correct || 0) * XP.gapCorrect);
      });
    },
    introduce(ids) { mutate(d => { const dd = ensureDay(d); introduce(d, ids); dd.newCards = Array.from(new Set([...(dd.newCards || []), ...ids])); }); },
    grade(id, g) {
      mutate(d => { const dd = ensureDay(d); grade(d, id, g); dd.reviewed = (dd.reviewed || 0) + 1; if (dd.reviewed <= XP.reviewCap) addXP(d, 'german', XP.review); });
    },
    boss(week, patch, award) {
      mutate(d => {
        const b = d.bosses[week] || {}; d.bosses[week] = { ...b, ...patch };
        if (award && !b.done) { addXP(d, 'health', XP.boss / 2); addXP(d, 'german', XP.boss / 2); }
      });
    },
    archSeen(id) { mutate(d => { if (!d.archSeen.includes(id)) d.archSeen.push(id); }); },
    settings(patch) { mutate(d => { d.settings = { ...d.settings, ...patch }; }); },
    replace(next) { prevXp.current = next.xp; setRun(null); setState(next); }
  };

  const ctx = { state, mutate, actions, toast, today, day, tab, setTab, view, setView, timer: { run, liveLeft, start: startTimer, pause: pauseTimer } };

  const TABS = [
    { id: 'today', label: 'Today', icon: 'today' },
    { id: 'journey', label: 'Journey', icon: 'journey' },
    { id: 'map', label: 'System map', icon: 'map' },
    { id: 'career', label: 'Career', icon: 'career' },
    { id: 'me', label: 'Me', icon: 'me' }
  ];

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
              <button key={t.id} type="button" onClick={() => { setTab(t.id); if (t.id === 'today' && tab === 'today') setView('home'); window.scrollTo(0, 0); }}
                className="flex flex-col items-center gap-0.5 pt-2 pb-2 text-[11px] font-bold" style={{ color: on ? 'var(--pine)' : 'var(--muted)' }} aria-current={on ? 'page' : undefined}>
                <span className="relative">
                  <Icon n={t.icon} size={23} />
                  {t.id === 'today' && run && <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: 'var(--amber)' }} />}
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
            style={{ boxShadow: 'var(--shadow)', background: t.kind === 'xp' ? 'var(--pine)' : t.kind === 'freeze' ? 'var(--sky)' : 'var(--amber)', color: 'var(--on-accent)' }}>
            <Icon n={t.kind === 'freeze' ? 'snow' : t.kind === 'badge' ? 'star' : 'check'} size={16} />{t.text}
          </div>
        ))}
      </div>

      {levelUp && (
        <div className="overlay" style={{ alignItems: 'center', padding: 16 }} role="dialog" aria-modal="true" aria-label="Level up" onClick={() => setLevelUp(null)}>
          <div className="card pop p-6 text-center w-full" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="eyebrow" style={{ color: 'var(--amber)' }}>Level up · {levelUp.track === 'health' ? 'Healthcare IT' : 'Deutsch'}</div>
            <div className="font-display font-extrabold text-3xl mt-2" style={{ fontFamily: 'inherit' }}><h2 className="m-0">{levelUp.name}</h2></div>
            <p className="mt-2" style={{ color: 'var(--muted)' }}>{levelUp.track === 'health' ? 'One step closer to your next role.' : 'Dein Deutsch wird jeden Tag stärker.'}</p>
            <button type="button" autoFocus onClick={() => setLevelUp(null)} className="mt-5 rounded-full px-6 py-2.5 font-bold" style={{ background: 'var(--pine)', color: 'var(--on-accent)' }}>Keep going</button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
