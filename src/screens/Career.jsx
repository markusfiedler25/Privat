import React, { useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon, Bar, Verify } from '../components/ui.jsx';
import { CAREERS } from '../content/index.js';
import { skillPoints, roleProgress, readiness } from '../lib/game.js';
import { niceDate } from '../lib/dates.js';

const label = id => (CAREERS.skills.find(s => s.id === id) || { label: id }).label;

export default function Career() {
  const { state, today } = useApp();
  const pts = skillPoints(state);
  const [open, setOpen] = useState(CAREERS.roles[0].id);
  const roles = CAREERS.roles.map(r => ({ ...r, pct: roleProgress(r, pts), ready: readiness(state, r, today) })).sort((a, b) => b.pct - a.pct);

  return (
    <div className="gutter pagepad flex flex-col gap-4">
      <header>
        <h1 className="text-[26px] font-extrabold leading-tight">Career dashboard</h1>
        <p className="mt-1" style={{ color: 'var(--muted)' }}>Every lesson adds skill points. Here you see how close you are to each target role, and when you'll be interview-ready at your current pace.</p>
      </header>

      {roles.map(r => {
        const isOpen = open === r.id;
        return (
          <section key={r.id} className="card overflow-hidden">
            <button type="button" onClick={() => setOpen(isOpen ? null : r.id)} className="w-full text-left p-4" aria-expanded={isOpen}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-extrabold leading-snug">{r.title}</h2>
                <span className="font-extrabold text-xl tnum flex-none" style={{ color: 'var(--pine)' }}>{Math.round(r.pct * 100)}%</span>
              </div>
              <div className="mt-2"><Bar pct={r.pct} /></div>
              <div className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
                {r.ready.ready ? 'Interview-ready on the skills tracked here.' : r.ready.needData ? 'Projection appears after 3 active days.' : `At your pace: ready around ${niceDate(r.ready.date, { day: 'numeric', month: 'long', year: 'numeric' })}`}
              </div>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pop">
                <div className="text-xs font-bold mt-1" style={{ color: 'var(--muted)' }}>Skills</div>
                <div className="flex flex-col gap-2 mt-2">
                  {Object.entries(r.targets).map(([k, t]) => {
                    const have = Math.min(pts[k] || 0, t);
                    return (
                      <div key={k}>
                        <div className="flex justify-between text-sm"><span>{label(k)}</span><span className="tnum" style={{ color: 'var(--muted)' }}>{have}/{t}</span></div>
                        <div className="mt-1"><Bar pct={have / t} h={6} color={have >= t ? 'var(--ok)' : 'var(--sky)'} /></div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs font-bold mt-4" style={{ color: 'var(--muted)' }}>Typical tasks</div>
                <ul className="mt-1 flex flex-col gap-1">{r.tasks.map(t => <li key={t} className="flex gap-2"><span className="mt-2.5 w-1.5 h-1.5 rounded-full flex-none" style={{ background: 'var(--pine)' }} /><span>{t}</span></li>)}</ul>
                <div className="text-xs font-bold mt-4" style={{ color: 'var(--muted)' }}>Certifications</div>
                <div className="flex flex-wrap gap-1.5 mt-1">{r.certs.map(c => <span key={c} className="text-[13px] rounded-lg px-2 py-1 border" style={{ borderColor: 'var(--line)' }}>{c}</span>)}</div>
                <div className="grid grid-cols-1 gap-3 mt-4">
                  <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-2)' }}>
                    <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Salary range Switzerland (indicative)</div>
                    <div className="font-extrabold text-lg tnum">{r.salary}</div>
                  </div>
                  <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--pine-soft)' }}>
                    <div className="text-xs font-bold" style={{ color: 'var(--pine)' }}>Your business degree as an asset</div>
                    <div>{r.asset}</div>
                  </div>
                </div>
                <Verify v={CAREERS.salaryVerify} />
              </div>
            )}
          </section>
        );
      })}

      <section className="card p-4">
        <h2 className="text-lg font-extrabold">All your skill points</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 text-sm">
          {CAREERS.skills.map(s => <div key={s.id} className="flex justify-between gap-2"><span className="truncate">{s.label}</span><b className="tnum">{pts[s.id] || 0}</b></div>)}
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>“Business administration” starts with your Master's degree. German points grow with German XP.</p>
      </section>
    </div>
  );
}
