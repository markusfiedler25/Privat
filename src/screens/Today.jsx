import React from 'react';
import { useApp } from '../App.jsx';
import { Icon, Flame, Bar } from '../components/ui.jsx';
import { HalfTimer } from '../components/Timer.jsx';
import { streakInfo, levelInfo, focusSec, FULL_FOCUS_SEC, previousLesson, stageProgress } from '../lib/game.js';
import { niceDate, isSunday, isoWeek } from '../lib/dates.js';
import { LESSON_BY_ID, LESSONS, CARD_BY_ID } from '../content/index.js';
import HealthHalf from './HealthHalf.jsx';
import GermanHalf from './GermanHalf.jsx';
import Boss from './Boss.jsx';

function greeting(name) {
  const h = new Date().getHours();
  const g = h < 11 ? 'Good morning' : h < 17 ? 'Hello' : 'Good evening';
  return name ? `${g}, ${name}` : g;
}

export default function Today() {
  const { view } = useApp();
  if (view === 'health') return <HealthHalf />;
  if (view === 'german') return <GermanHalf />;
  if (view === 'boss') return <Boss />;
  return <Home />;
}

function Home() {
  const { state, day, today, setView, setTab } = useApp();
  const st = streakInfo(state, today);
  const lesson = day.lessonId ? LESSON_BY_ID[day.lessonId] : null;
  const prev = previousLesson(state, today);
  const hL = levelInfo('health', state.xp.health), gL = levelInfo('german', state.xp.german);
  const focus = focusSec(day);
  const full = day.health && day.german;
  const newWords = (lesson && lesson.german.vocab.length) || 0;
  const sunday = isSunday(today);
  const boss = state.bosses[isoWeek(today)];
  const stages = stageProgress(state);
  const doneLessons = Object.keys(state.completedLessons).length;

  let line;
  if (full) line = day.bonus ? 'Full hour done. That is exactly how careers are built.' : 'Mission complete. Your streak grows.';
  else if (day.health || day.german) line = 'Halfway there. The other 30 minutes are waiting for you.';
  else if (st.streak > 0) line = `Day ${st.streak + 1} is ready. Same time, same rhythm.`;
  else line = 'One hour today: 30 minutes healthcare IT, 30 minutes Deutsch.';

  return (
    <div className="gutter pagepad flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm" style={{ color: 'var(--muted)' }}>{niceDate(today)}</div>
          <h1 className="text-[26px] font-extrabold leading-tight mt-0.5">{greeting(state.settings.name)}</h1>
          <p className="mt-1" style={{ color: 'var(--muted)' }}>{line}</p>
        </div>
        <div className="flex flex-col items-center flex-none">
          <Flame lit={st.streak > 0} size={44} />
          <div className="font-display font-extrabold text-xl tnum leading-none" style={{ fontFamily: '"Bricolage Grotesque Variable", sans-serif' }}>{st.streak}</div>
          <div className="text-[11px] font-bold mt-0.5 flex items-center gap-1" style={{ color: st.freezeAvailable ? 'var(--sky)' : 'var(--muted)' }} title="One streak freeze per week">
            <Icon n="snow" size={12} />{st.freezeAvailable ? 'freeze ready' : 'freeze used'}
          </div>
        </div>
      </header>

      {/* Mission */}
      <section className="card p-4" aria-label="Today's mission">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Today's 60-minute mission</h2>
          <span className="text-xs tnum font-bold" style={{ color: 'var(--muted)' }}>{Math.floor(focus / 60)}/60 min</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <HalfTimer half="health" />
          <HalfTimer half="german" />
        </div>
        <div className="mt-3"><Bar pct={focus / 3600} color="linear-gradient(90deg, var(--pine), var(--sky))" /></div>
        <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
          {day.bonus ? '60-minute bonus earned (+30 XP).' : 'Both halves done + the full 60 minutes on the timer = +30 XP bonus.'}
        </p>
      </section>

      {/* Half 1 */}
      <button type="button" onClick={() => { setView('health'); window.scrollTo(0, 0); }} className="card p-4 text-left flex gap-3.5 items-start">
        <span className="grid place-items-center w-11 h-11 rounded-2xl flex-none" style={{ background: 'var(--pine-soft)', color: 'var(--pine)' }}><Icon n="route" size={22} /></span>
        <span className="min-w-0 flex-1">
          <span className="eyebrow block" style={{ color: 'var(--pine)' }}>Half 1 · Healthcare IT & business · 30 min</span>
          {lesson ? (
            <>
              <span className="block font-extrabold text-lg leading-snug mt-0.5" style={{ fontFamily: '"Bricolage Grotesque Variable", sans-serif' }}>{lesson.title}</span>
              <span className="block text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{lesson.stageTitle} · lesson {lesson.indexInStage + 1}/{lesson.stageCount}{prev ? ' · starts with yesterday\'s follow-up' : ''}</span>
            </>
          ) : (
            <span className="block mt-0.5">All {LESSONS.length} lessons done. Review the journey or take the boss challenge – new stages are on the roadmap.</span>
          )}
        </span>
        <StatusDot done={day.health} />
      </button>

      {/* Half 2 */}
      <button type="button" onClick={() => { setView('german'); window.scrollTo(0, 0); }} className="card p-4 text-left flex gap-3.5 items-start">
        <span className="grid place-items-center w-11 h-11 rounded-2xl flex-none" style={{ background: 'var(--sky-soft)', color: 'var(--sky)' }}><Icon n="chat" size={22} /></span>
        <span className="min-w-0 flex-1">
          <span className="eyebrow block" style={{ color: 'var(--sky)' }}>Half 2 · Deutsch · 30 min</span>
          <span className="block font-extrabold text-lg leading-snug mt-0.5" style={{ fontFamily: '"Bricolage Grotesque Variable", sans-serif' }}>Wörter, Grammatik, Praxis</span>
          <span className="block text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {countDue(state, today)} reviews due · {newWords} new words{lesson ? ` from “${lesson.title}”` : ''}
          </span>
        </span>
        <StatusDot done={day.german} />
      </button>

      {/* Boss */}
      <button type="button" onClick={() => { if (sunday) { setView('boss'); window.scrollTo(0, 0); } }} className="card p-4 text-left flex gap-3.5 items-center" style={sunday ? { borderColor: 'var(--amber)' } : {}} aria-disabled={!sunday}>
        <span className="grid place-items-center w-11 h-11 rounded-2xl flex-none" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}><Icon n={sunday ? 'sword' : 'lock'} size={22} /></span>
        <span className="min-w-0 flex-1">
          <span className="eyebrow block" style={{ color: 'var(--amber)' }}>Sunday boss challenge</span>
          <span className="block font-bold mt-0.5">{sunday ? (boss && boss.done ? 'Beaten this week. Strong!' : 'A mixed case study in German is waiting · +120 XP') : 'Unlocks on Sunday: a real case in German'}</span>
        </span>
        {sunday && <Icon n="next" size={20} />}
      </button>

      {/* Levels */}
      <section className="card p-4 grid grid-cols-2 gap-4" aria-label="Levels">
        <LevelMini label="Healthcare IT" info={hL} xp={state.xp.health} color="var(--pine)" />
        <LevelMini label="Deutsch" info={gL} xp={state.xp.german} color="var(--sky)" />
      </section>

      {/* Journey mini */}
      <button type="button" onClick={() => { setTab('journey'); window.scrollTo(0, 0); }} className="card p-4 text-left">
        <div className="flex items-center justify-between">
          <span className="font-bold">Patient journey</span>
          <span className="text-xs tnum" style={{ color: 'var(--muted)' }}>{doneLessons}/{LESSONS.length} lessons</span>
        </div>
        <div className="flex gap-1 mt-3" aria-hidden="true">
          {stages.map(s => (
            <span key={s.id} className="h-2 flex-1 rounded-full" title={s.title}
              style={{ background: s.total && s.done === s.total ? 'var(--pine)' : s.done > 0 ? 'var(--sky)' : s.status === 'ready' ? 'var(--pine-soft)' : 'var(--surface-2)' }} />
          ))}
        </div>
        <div className="flex justify-between text-[11px] mt-1.5" style={{ color: 'var(--muted)' }}><span>Referral</span><span>Billing & beyond</span></div>
      </button>
    </div>
  );
}

function countDue(state, today) {
  return Object.values(state.srs).filter(c => c.due <= today && c.intro !== today).length;
}

function StatusDot({ done }) {
  return (
    <span className="grid place-items-center w-8 h-8 rounded-full flex-none mt-1"
      style={done ? { background: 'var(--ok)', color: 'var(--on-accent)' } : { border: '2px solid var(--line)', color: 'var(--muted)' }}>
      {done ? <Icon n="check" size={17} /> : <Icon n="next" size={16} />}
    </span>
  );
}

function LevelMini({ label, info, xp, color }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{label}</div>
      <div className="font-extrabold leading-tight mt-0.5 truncate">{info.cur.name}</div>
      <div className="mt-2"><Bar pct={info.pct} color={color} h={7} /></div>
      <div className="text-[11px] mt-1 tnum" style={{ color: 'var(--muted)' }}>{xp.toLocaleString('de-CH')} XP{info.next ? ` · ${(info.next.min - xp).toLocaleString('de-CH')} to ${info.next.name}` : ''}</div>
    </div>
  );
}
