import React, { useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon, Flame, Bar, Btn, CaseTag } from '../components/ui.jsx';
import { streakInfo, careerLevel, targetSec, stageProgress, XP } from '../lib/game.js';
import { healthPending, germanQueue, STREAM } from '../lib/curriculum.js';
import { germanStatus, projection } from '../lib/german.js';
import { pendingCheckin, reflectionDue, weekChallenges } from '../lib/usetoday.js';
import { niceDate, isSunday, isoWeek, monthYear, shortDate, addDays } from '../lib/dates.js';
import { MODULE_BY_ID, UT_TYPES } from '../content/index.js';
import Block from './Block.jsx';
import Boss from './Boss.jsx';

function greeting(name) {
  const h = new Date().getHours();
  const g = h < 11 ? 'Good morning' : h < 17 ? 'Hello' : 'Good evening';
  return name ? `${g}, ${name}` : g;
}

export default function Today() {
  const { view } = useApp();
  if (view === 'health') return <Block block="health" />;
  if (view === 'german') return <Block block="german" />;
  if (view === 'boss') return <Boss />;
  return <Home />;
}

function BlockRow({ block, label, color, soft, icon, note }) {
  const { state, today, day, setView, clock } = useApp();
  const b = day[block];
  const target = targetSec(state, block);
  const sec = clock.live(block);
  const met = b.met;
  const q = block === 'health' ? healthPending(state, today) : germanQueue(state, today);
  const next = q[0];
  const locked = met && b.grace !== (next && next.id);
  return (
    <button type="button" onClick={() => { setView(block); window.scrollTo(0, 0); }} className="w-full text-left flex gap-3 items-center py-3">
      <span className="grid place-items-center w-11 h-11 rounded-2xl flex-none" style={{ background: met ? 'var(--ok-soft)' : soft, color: met ? 'var(--ok)' : color }}><Icon n={met ? 'check' : icon} size={22} /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-extrabold">{label}</span>
          <span className="text-xs font-bold tnum" style={{ color: met ? 'var(--ok)' : 'var(--muted)' }}>{Math.floor(sec / 60)}/{target / 60} min</span>
        </span>
        <span className="block mt-1.5"><Bar pct={sec / target} color={met ? 'var(--ok)' : color} h={6} /></span>
        <span className="block text-[13px] mt-1.5 truncate" style={{ color: 'var(--muted)' }}>
          {met ? (locked ? 'Target reached ✓' : 'Target reached – finish the open card') : next ? `Next: ${next.title} · ${next.est} min` : note}
        </span>
      </span>
      <Icon n="next" size={18} style={{ color: 'var(--muted)', flex: 'none' }} />
    </button>
  );
}

function CheckIn() {
  const { state, today, actions } = useApp();
  const p = pendingCheckin(state, today);
  if (!p) return null;
  const isYesterday = p.date === addDays(today, -1);
  return (
    <section className="card p-4" style={{ borderColor: 'var(--amber)' }} aria-label="Check-in">
      <div className="eyebrow" style={{ color: 'var(--amber)' }}>Check-in · {isYesterday ? "yesterday's" : 'last'} challenge</div>
      <p className="font-bold mt-1.5">{p.challenge.text}</p>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <Btn kind="ok" onClick={() => actions.checkin(p.date, 'done')}>Done</Btn>
        <Btn kind="ghost" onClick={() => actions.checkin(p.date, 'partly')}>Partly</Btn>
        <Btn kind="ghost" onClick={() => actions.checkin(p.date, 'not')}>Not today</Btn>
      </div>
      <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Done +{XP.utDone} XP · partly +{XP.utPartly} XP · no penalty.</p>
    </section>
  );
}

function UseToday() {
  const { state, today, actions } = useApp();
  const c = state.useToday[today];
  if (!c) return null;
  const m = MODULE_BY_ID[c.topic];
  return (
    <section className="card p-4" aria-label="Use it today">
      <div className="flex items-center justify-between gap-2">
        <div className="eyebrow flex items-center gap-1.5" style={{ color: 'var(--amber)' }}><Icon n="bolt" size={14} />Use it today · {UT_TYPES[c.type] || c.type}</div>
        <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>under 5 min</span>
      </div>
      <p className="font-bold text-[17px] mt-1.5 leading-snug">{c.text}</p>
      {m && <div className="flex flex-wrap items-center gap-2 mt-2 text-xs" style={{ color: 'var(--muted)' }}>Linked to <b>{m.title.split(':')[0]}</b> <CaseTag type={m.caseType} small /></div>}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs" style={{ color: 'var(--muted)' }}>Check-in tomorrow</span>
        {!c.swapped && <button type="button" onClick={actions.swapChallenge} className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--sky)' }}><Icon n="swap" size={16} />Swap once</button>}
      </div>
    </section>
  );
}

function Reflection() {
  const { state, today, actions } = useApp();
  const wk = reflectionDue(state, today);
  const [applied, setApplied] = useState('');
  const [changed, setChanged] = useState('');
  if (!wk) return null;
  const items = weekChallenges(state, today);
  const icon = { done: '✓', partly: '½', not: '–' };
  return (
    <section className="card p-4" aria-label="Weekly reflection">
      <div className="eyebrow" style={{ color: 'var(--pine)' }}>Weekly reflection · {wk}</div>
      <ul className="mt-2 flex flex-col gap-1 text-[14px]">
        {items.map(i => <li key={i.date} className="flex gap-2"><span className="w-4 text-center font-bold" style={{ color: i.status === 'done' ? 'var(--ok)' : 'var(--muted)' }}>{icon[i.status] || '·'}</span><span className="flex-1 min-w-0">{i.text}</span></li>)}
      </ul>
      <label htmlFor="refl-applied" className="block text-sm font-bold mt-3">What did I apply at work?</label>
      <textarea id="refl-applied" rows={2} value={applied} onChange={e => setApplied(e.target.value)} className="mt-1 w-full rounded-xl border p-2.5" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }} />
      <label htmlFor="refl-changed" className="block text-sm font-bold mt-2">What changed?</label>
      <textarea id="refl-changed" rows={2} value={changed} onChange={e => setChanged(e.target.value)} className="mt-1 w-full rounded-xl border p-2.5" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }} />
      <div className="mt-3"><Btn disabled={!applied.trim()} onClick={() => actions.reflect(wk, { applied, changed })}>Save reflection · +25 XP</Btn></div>
    </section>
  );
}

function Home() {
  const { state, today, day, setView, setTab } = useApp();
  const st = streakInfo(state, today);
  const cl = careerLevel(state.xp.health);
  const gs = germanStatus(state);
  const pr = projection(state, today);
  const sunday = isSunday(today);
  const boss = state.bosses[isoWeek(today)];
  const stages = stageProgress(state);
  const full = day.health.met && day.german.met;
  const anyTime = day.health.sec + day.german.sec > 0;
  const healthFirst = !day.health.met;
  const lessonsDone = Object.keys(state.modulesDone).length;
  const totalLessons = Object.keys(MODULE_BY_ID).length;

  let line;
  if (full) line = 'Both targets reached. That is how careers are built.';
  else if (anyTime) line = 'Good start. Keep going until both bars are full.';
  else if (st.streak > 0) line = `Day ${st.streak + 1}. Start with Healthcare IT – it sets today's German topic.`;
  else line = "Start with Healthcare IT – it sets today's German topic.";

  return (
    <div className="gutter pagepad flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm" style={{ color: 'var(--muted)' }}>{niceDate(today)}</div>
          <h1 className="text-[26px] font-extrabold leading-tight mt-0.5">{greeting(state.profile.name)}</h1>
          <p className="mt-1" style={{ color: 'var(--muted)' }}>{line}</p>
        </div>
        <div className="flex flex-col items-center flex-none">
          <Flame lit={st.streak > 0} size={44} />
          <div className="font-extrabold text-xl tnum leading-none">{st.streak}</div>
          <div className="text-[11px] font-bold mt-0.5 flex items-center gap-1" style={{ color: st.freezeAvailable ? 'var(--sky)' : 'var(--muted)' }}><Icon n="snow" size={12} />{st.freezeAvailable ? 'freeze ready' : 'freeze used'}</div>
        </div>
      </header>

      <CheckIn />

      <section className="card px-4 pt-3 pb-2" aria-label="Today's mission">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Today's mission</h2>
          <span className="text-xs font-bold" style={{ color: full ? 'var(--ok)' : 'var(--muted)' }}>{full ? `Streak day ✓ · +${XP.full} XP bonus` : `Both targets = streak day`}</span>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
          {healthFirst ? (
            <>
              <BlockRow block="health" label="Healthcare IT" color="var(--pine)" soft="var(--pine-soft)" icon="route" />
              <BlockRow block="german" label="Deutsch" color="var(--sky)" soft="var(--sky-soft)" icon="chat" />
            </>
          ) : (
            <>
              <BlockRow block="german" label="Deutsch" color="var(--sky)" soft="var(--sky-soft)" icon="chat" />
              <BlockRow block="health" label="Healthcare IT" color="var(--pine)" soft="var(--pine-soft)" icon="route" />
            </>
          )}
        </div>
      </section>

      <UseToday />
      <Reflection />

      {sunday && (
        <button type="button" onClick={() => { setView('boss'); window.scrollTo(0, 0); }} className="card p-4 text-left flex gap-3.5 items-center" style={{ borderColor: 'var(--amber)' }}>
          <span className="grid place-items-center w-11 h-11 rounded-2xl flex-none" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}><Icon n="sword" size={22} /></span>
          <span className="min-w-0 flex-1">
            <span className="eyebrow block" style={{ color: 'var(--amber)' }}>Sunday boss challenge</span>
            <span className="block font-bold mt-0.5">{boss && boss.done ? 'Beaten this week. Strong!' : `A real case in German · +${XP.boss} XP`}</span>
          </span>
          <Icon n="next" size={20} />
        </button>
      )}

      <section className="card p-4 grid grid-cols-2 gap-4" aria-label="Levels">
        <button type="button" className="text-left min-w-0" onClick={() => { setTab('career'); window.scrollTo(0, 0); }}>
          <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Career level</div>
          <div className="font-extrabold leading-tight mt-0.5 truncate">{cl.cur.name}</div>
          <div className="mt-2"><Bar pct={cl.pct} color="var(--pine)" h={7} /></div>
          <div className="text-[11px] mt-1 tnum" style={{ color: 'var(--muted)' }}>{state.xp.health.toLocaleString('de-CH')} XP{cl.next ? ` · next: ${cl.next.name}` : ''}</div>
        </button>
        <button type="button" className="text-left min-w-0" onClick={() => { setTab('me'); window.scrollTo(0, 0); }}>
          <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Deutsch</div>
          <div className="font-extrabold leading-tight mt-0.5">{gs.sub}</div>
          <div className="mt-2"><Bar pct={gs.pct} color="var(--sky)" h={7} /></div>
          <div className="text-[11px] mt-1 tnum" style={{ color: 'var(--muted)' }}>{Math.round(gs.hoursToNext)} h to the next step</div>
        </button>
      </section>

      <button type="button" onClick={() => { setTab('me'); window.scrollTo(0, 0); }} className="card p-4 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold">{pr.target} at your pace</span>
          <span className="text-xs font-bold rounded-full px-2.5 py-1" style={pr.onTrack ? { background: 'var(--ok-soft)', color: 'var(--ok)' } : { background: 'var(--amber-soft)', color: 'var(--amber)' }}>{pr.onTrack ? 'On track' : 'Gap to close'}</span>
        </div>
        <div className="text-[15px] mt-1">
          {pr.date ? <><b>{monthYear(pr.date)}</b> <span style={{ color: 'var(--muted)' }}>· target {shortDate(state.profile.targetDate)}</span></> : 'Projection starts with your first German minutes.'}
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{pr.usePlanned ? `Based on your plan (${state.profile.split.german} min/day) until 3 active days.` : `Based on your last ${pr.pace.windowDays} days: ${Math.round(pr.perDay)} min/day.`} {!pr.onTrack && `To make it: ~${pr.neededPerDay} min/day.`}</div>
      </button>

      <button type="button" onClick={() => { setTab('journey'); window.scrollTo(0, 0); }} className="card p-4 text-left">
        <div className="flex items-center justify-between">
          <span className="font-bold">Patient journey</span>
          <span className="text-xs tnum" style={{ color: 'var(--muted)' }}>{lessonsDone}/{totalLessons} lessons · {STREAM.length} cards</span>
        </div>
        <div className="flex gap-1 mt-3" aria-hidden="true">
          {stages.map(s => (
            <span key={s.id} className="h-2 flex-1 rounded-full" title={s.title}
              style={{ background: s.total && s.done === s.total && s.baDone ? 'var(--pine)' : s.done > 0 ? 'var(--sky)' : s.ready ? 'var(--pine-soft)' : 'var(--surface-2)' }} />
          ))}
        </div>
        <div className="flex justify-between text-[11px] mt-1.5" style={{ color: 'var(--muted)' }}><span>Referral</span><span>Analytics</span></div>
      </button>
    </div>
  );
}
