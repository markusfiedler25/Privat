import React, { useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon, Verify, Bar } from '../components/ui.jsx';
import { stageProgress } from '../lib/game.js';
import { LESSONS, MARKET } from '../content/index.js';

function Chips({ title, items, color }) {
  return (
    <div className="mt-3">
      <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{title}</div>
      <div className="flex flex-wrap gap-1.5 mt-1">{items.map(i => <span key={i} className="text-[13px] rounded-lg px-2 py-1 border" style={{ borderColor: color, color: 'var(--ink)' }}>{i}</span>)}</div>
    </div>
  );
}

export default function Journey() {
  const { state } = useApp();
  const stages = stageProgress(state);
  const [open, setOpen] = useState(null);
  const sel = open ? stages.find(s => s.id === open) : null;
  const totalDone = Object.keys(state.completedLessons).length;

  return (
    <div className="gutter pagepad flex flex-col gap-4">
      <header>
        <h1 className="text-[26px] font-extrabold leading-tight">Swiss patient journey</h1>
        <p className="mt-1" style={{ color: 'var(--muted)' }}>From referral to cash. Each stop is a module; tap to see systems, standards and lessons.</p>
        <div className="mt-3"><Bar pct={totalDone / Math.max(1, LESSONS.length)} /></div>
        <div className="text-xs mt-1 tnum" style={{ color: 'var(--muted)' }}>{totalDone} of {LESSONS.length} available lessons · {stages.filter(s => s.status === 'ready').length} of {stages.length} stages written</div>
      </header>

      <ol className="list-none p-0 m-0 relative">
        {stages.map((s, i) => {
          const complete = s.total > 0 && s.done === s.total;
          const active = s.done > 0 && !complete;
          const planned = s.status !== 'ready';
          const dotBg = complete ? 'var(--pine)' : active ? 'var(--sky)' : planned ? 'var(--surface-2)' : 'var(--pine-soft)';
          const dotFg = complete || active ? 'var(--on-accent)' : 'var(--muted)';
          const last = i === stages.length - 1;
          return (
            <li key={s.id} className="relative flex gap-3 pb-3">
              {!last && <span className="absolute w-[3px] rounded" style={{ left: 18, top: 40, bottom: 0, background: complete ? 'var(--pine)' : 'var(--line)' }} aria-hidden="true" />}
              <span className="relative z-10 grid place-items-center w-10 h-10 rounded-full font-extrabold tnum flex-none" style={{ background: dotBg, color: dotFg, border: s.id === 'rejections' ? '2px dashed var(--amber)' : 'none' }}>
                {complete ? <Icon n="check" size={18} /> : s.order}
              </span>
              <button type="button" onClick={() => setOpen(s.id)} className="card flex-1 p-3.5 text-left min-w-0" style={planned ? { opacity: .78 } : {}}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-extrabold leading-snug">{s.title}</div>
                    <div className="text-sm" style={{ color: 'var(--muted)' }} lang="de">{s.de}</div>
                  </div>
                  <span className="text-[11px] font-bold rounded-full px-2 py-0.5 flex-none"
                    style={planned ? { background: 'var(--surface-2)', color: 'var(--muted)' } : complete ? { background: 'var(--ok-soft)', color: 'var(--ok)' } : { background: 'var(--sky-soft)', color: 'var(--sky)' }}>
                    {planned ? 'Roadmap' : `${s.done}/${s.total}`}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      <section>
        <h2 className="text-xl font-extrabold">Swiss market context</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Recurring theme. Regulation changes: every card says what to verify.</p>
        <div className="flex flex-col gap-3 mt-3">
          {MARKET.map(c => (
            <details key={c.id} className="card p-4">
              <summary className="font-extrabold cursor-pointer">{c.title}</summary>
              <ul className="mt-2 flex flex-col gap-1.5">{c.bullets.map(b => <li key={b} className="flex gap-2"><span className="mt-2.5 w-1.5 h-1.5 rounded-full flex-none" style={{ background: 'var(--sky)' }} /><span>{b}</span></li>)}</ul>
              <Verify v={c.verify} />
            </details>
          ))}
        </div>
      </section>

      {sel && (
        <div className="overlay" onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label={sel.title}>
          <div className="sheet pop" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="eyebrow" style={{ color: 'var(--pine)' }}>Stage {sel.order}</div>
                <h2 className="text-2xl font-extrabold leading-tight">{sel.title}</h2>
                <div style={{ color: 'var(--muted)' }} lang="de">{sel.de}</div>
              </div>
              <button type="button" onClick={() => setOpen(null)} className="p-2 rounded-full" aria-label="Close"><Icon n="close" /></button>
            </div>
            <p className="mt-3">{sel.summary}</p>
            <Chips title="SAP IS-H" items={sel.ish} color="var(--sky)" />
            <Chips title="Epic" items={sel.epic} color="var(--die)" />
            <Chips title="Standards & partners" items={sel.standards} color="var(--das)" />
            <div className="mt-4">
              <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Lessons</div>
              {sel.status !== 'ready' ? (
                <p className="mt-1">On the roadmap. Lessons for this stage come in a later phase.</p>
              ) : (
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {LESSONS.filter(l => l.stage === sel.id).map(l => {
                    const done = state.completedLessons[l.id];
                    return (
                      <li key={l.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ background: 'var(--surface-2)' }}>
                        <span className="grid place-items-center w-6 h-6 rounded-full flex-none" style={done ? { background: 'var(--ok)', color: 'var(--on-accent)' } : { border: '2px solid var(--line)' }}>{done && <Icon n="check" size={14} />}</span>
                        <span className="flex-1">{l.title}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
