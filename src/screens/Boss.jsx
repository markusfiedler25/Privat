import React, { useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon, Btn, MCQ, SpeakBtn } from '../components/ui.jsx';
import { BOSSES } from '../content/index.js';
import { isoWeek } from '../lib/dates.js';
import { XP } from '../lib/game.js';

export function bossForWeek(week) {
  const n = Number(week.split('-W')[1]) || 0;
  return BOSSES[n % BOSSES.length];
}

export default function Boss() {
  const { today, state, actions, setView } = useApp();
  const week = isoWeek(today);
  const ch = bossForWeek(week);
  const rec = state.bosses[week] || { id: ch.id, q: {}, a: {}, text: '' };
  const [text, setText] = useState(rec.text || '');
  const [show, setShow] = useState(!!rec.done);
  const allAnswered = Object.keys(rec.q || {}).length === ch.questions.length && Object.keys(rec.a || {}).length === ch.analysis.length;
  const back = () => { setView('home'); window.scrollTo(0, 0); };

  return (
    <div>
      <div className="topbar gutter"><div className="flex items-center gap-2 py-2.5">
        <button type="button" onClick={back} className="p-2 -ml-2 rounded-full" aria-label="Back to today"><Icon n="back" size={22} /></button>
        <div className="font-bold flex-1 truncate">Sunday boss challenge</div>
      </div></div>
      <div className="gutter flex flex-col gap-4 pt-2" style={{ paddingBottom: 'calc(110px + env(safe-area-inset-bottom, 0px))' }}>
        <header>
          <div className="eyebrow" style={{ color: 'var(--amber)' }}>Boss · {week} · +{XP.boss} XP</div>
          <h1 className="text-[26px] font-extrabold leading-tight mt-1">{ch.title}</h1>
          <p className="mt-1" style={{ color: 'var(--muted)' }}>{ch.intro}</p>
        </header>

        <section className="card p-4">
          <div className="flex items-center justify-between"><div className="eyebrow" style={{ color: 'var(--muted)' }}>E-Mail</div><SpeakBtn text={ch.email} /></div>
          <pre className="whitespace-pre-wrap m-0 mt-2 text-[16px]" style={{ fontFamily: 'inherit' }} lang="de">{ch.email}</pre>
        </section>

        <section className="card p-4">
          <h3 className="text-lg font-extrabold">Verstehen</h3>
          <div className="flex flex-col gap-5 mt-3">
            {ch.questions.map((q, i) => <MCQ key={i} q={q} seed={ch.id + 'q' + i} chosen={rec.q?.[i]} correctLabel="Richtig" onPick={oi => actions.boss(week, { id: ch.id, q: { ...(rec.q || {}), [i]: oi } })} />)}
          </div>
        </section>

        <section className="card p-4">
          <h3 className="text-lg font-extrabold">Analyse (BA view)</h3>
          <div className="flex flex-col gap-5 mt-3">
            {ch.analysis.map((q, i) => <MCQ key={i} q={q} seed={ch.id + 'a' + i} chosen={rec.a?.[i]} onPick={oi => actions.boss(week, { id: ch.id, a: { ...(rec.a || {}), [i]: oi } })} />)}
          </div>
        </section>

        <section className="card p-4">
          <h3 className="text-lg font-extrabold">Antworten</h3>
          <p className="text-[15px] mt-1" style={{ color: 'var(--muted)' }}>{ch.write.instruction}</p>
          <label htmlFor="boss-text" className="sr-only">Your reply</label>
          <textarea id="boss-text" rows={7} lang="de" value={text} disabled={rec.done} onChange={e => setText(e.target.value)}
            className="mt-2 w-full rounded-xl border p-3 text-[16px]" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }} placeholder="Guten Tag …" />
          {!show ? (
            <div className="mt-2"><Btn kind="amber" disabled={text.trim().length < 40 || !allAnswered} onClick={() => setShow(true)}>Compare with model</Btn>
              {!allAnswered && <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Answer all questions above first.</p>}</div>
          ) : (
            <div className="pop mt-3">
              <div className="text-sm font-bold">Model answer</div>
              <pre className="whitespace-pre-wrap m-0 mt-1 rounded-xl p-3 text-[15px]" style={{ background: 'var(--amber-soft)', fontFamily: 'inherit' }}>{ch.write.model}</pre>
              <ul className="text-[15px] flex flex-col gap-1 mt-3">{ch.write.checklist.map(c => <li key={c}>☐ {c}</li>)}</ul>
              {rec.done ? <p className="mt-3 font-bold" style={{ color: 'var(--ok)' }}>Boss beaten ✓</p>
                : <div className="mt-3"><Btn kind="ok" onClick={() => actions.boss(week, { id: ch.id, text, done: true }, true)}><Icon n="star" size={18} />Finish boss · +{XP.boss} XP</Btn></div>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
