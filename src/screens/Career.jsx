import React, { useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon, Bar, Verify, Sheet, SheetHead } from '../components/ui.jsx';
import { CAREERS } from '../content/index.js';
import { skillPoints, roleProgress, readiness, careerLevel } from '../lib/game.js';
import { shortDate } from '../lib/dates.js';

const label = id => (CAREERS.skills.find(s => s.id === id) || { label: id }).label;

export default function Career() {
  const { state, today } = useApp();
  const pts = skillPoints(state);
  const cl = careerLevel(state.xp.health);
  const [open, setOpen] = useState(null);
  const role = open ? CAREERS.roles.find(r => r.id === open) : null;

  return (
    <div className="gutter pagepad flex flex-col gap-4">
      <header>
        <h1 className="text-[26px] font-extrabold leading-tight">Career map</h1>
        <p className="mt-1" style={{ color: 'var(--muted)' }}>Your path to the dream job, step by step. Every lesson adds skill points; new branches open as your career level grows.</p>
      </header>

      <section className="card p-4" style={{ background: 'var(--pine-soft)', borderColor: 'var(--pine-soft)' }}>
        <div className="eyebrow" style={{ color: 'var(--pine)' }}>Level {cl.i + 1} of {CAREERS.levels.length}</div>
        <div className="text-2xl font-extrabold leading-tight mt-0.5">{cl.cur.name}</div>
        <p className="mt-1">{cl.cur.meaning}</p>
        <div className="mt-3"><Bar pct={cl.pct} track="var(--surface)" /></div>
        <div className="text-xs mt-1 tnum" style={{ color: 'var(--muted)' }}>{state.xp.health.toLocaleString('de-CH')} XP{cl.next ? ` · ${(cl.next.min - state.xp.health).toLocaleString('de-CH')} XP to ${cl.next.name}` : ' · top level'}</div>
      </section>

      <ol className="list-none p-0 m-0 relative" aria-label="Career levels">
        {CAREERS.levels.map((lv, i) => {
          const done = i < cl.i, cur = i === cl.i, visible = i <= cl.i + 1;
          const roles = CAREERS.roles.filter(r => r.atLevel === i);
          const last = i === CAREERS.levels.length - 1;
          return (
            <li key={lv.name} className="relative flex gap-3 pb-4">
              {!last && <span className="absolute w-[3px] rounded" style={{ left: 18, top: 40, bottom: 0, background: done ? 'var(--pine)' : 'var(--line)' }} aria-hidden="true" />}
              <span className="relative z-10 grid place-items-center w-10 h-10 rounded-full font-extrabold flex-none"
                style={done ? { background: 'var(--pine)', color: 'var(--on-accent)' } : cur ? { background: 'var(--amber)', color: 'var(--on-accent)' } : { background: 'var(--surface-2)', color: 'var(--muted)', border: '2px dashed var(--line)' }}>
                {done ? <Icon n="check" size={18} /> : visible ? i + 1 : <Icon n="lock" size={16} />}
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-extrabold" style={{ color: visible ? 'var(--ink)' : 'var(--muted)' }}>{lv.name}</span>
                  <span className="text-xs tnum flex-none" style={{ color: 'var(--muted)' }}>{lv.min.toLocaleString('de-CH')} XP</span>
                </div>
                <div className="text-[15px] mt-0.5" style={{ color: 'var(--muted)' }}>{visible ? lv.meaning : 'Revealed when you get closer.'}</div>
                {roles.map(r => {
                  const pct = roleProgress(r, pts);
                  const opened = i <= cl.i;
                  return (
                    <button key={r.id} type="button" onClick={() => setOpen(r.id)} className="mt-2 w-full text-left rounded-2xl border p-3 flex items-center gap-3"
                      style={{ borderColor: opened ? 'var(--pine)' : 'var(--line)', background: 'var(--surface)', opacity: visible ? 1 : 0.75 }}>
                      <Ring pct={pct} on={opened} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold" style={{ color: opened ? 'var(--pine)' : 'var(--muted)' }}>{opened ? 'Branch open' : `Branch opens at ${lv.name}`}</span>
                        <span className="block font-bold leading-snug">{r.title}</span>
                      </span>
                      <Icon n="next" size={18} style={{ color: 'var(--muted)', flex: 'none' }} />
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      <section className="card p-4">
        <h2 className="text-lg font-extrabold">Your skill points</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 text-sm">
          {CAREERS.skills.map(s => <div key={s.id} className="flex justify-between gap-2"><span className="truncate" style={{ color: pts[s.id] ? 'var(--ink)' : 'var(--muted)' }}>{s.label}</span><b className="tnum">{pts[s.id] || 0}</b></div>)}
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>“Business administration” starts with your Master's degree. “German for work” grows with your German hours (25 points = end of B2).</p>
      </section>

      {role && <RoleSheet role={role} pts={pts} onClose={() => setOpen(null)} ready={readiness(state, role, today)} opened={role.atLevel <= cl.i} />}
    </div>
  );
}

function Ring({ pct, on }) {
  const r = 17, c = 2 * Math.PI * r;
  return (
    <span className="relative flex-none" style={{ width: 44, height: 44 }}>
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="5" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={on ? 'var(--pine)' : 'var(--muted)'} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${pct * c} ${c}`} transform="rotate(-90 22 22)" />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-extrabold tnum">{Math.round(pct * 100)}%</span>
    </span>
  );
}

function RoleSheet({ role, pts, onClose, ready, opened }) {
  const { state } = useApp();
  return (
    <Sheet onClose={onClose} label={role.title}>
      <SheetHead eyebrow={opened ? 'Branch open' : `Opens at ${CAREERS.levels[role.atLevel].name}`} title={role.title} onClose={onClose} />
      <div className="mt-3 rounded-2xl p-3.5" style={{ background: 'var(--surface-2)' }}>
        <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Readiness</div>
        <div className="flex items-center gap-3 mt-1"><div className="flex-1"><Bar pct={roleProgress(role, pts)} /></div><b className="tnum">{Math.round(roleProgress(role, pts) * 100)}%</b></div>
        <div className="text-sm mt-1.5">{ready.ready ? 'Interview-ready on the skills tracked here.' : ready.needData ? 'A projected date appears after your first two lessons.' : <>At your pace: ready around <b>{shortDate(ready.date)}</b></>}</div>
      </div>
      <div className="text-xs font-bold mt-4" style={{ color: 'var(--muted)' }}>Skill stations</div>
      <div className="flex flex-col gap-2 mt-2">
        {Object.entries(role.targets).map(([k, t]) => {
          const have = Math.min(pts[k] || 0, t);
          const fog = !(pts[k] > 0) && !(state.skills[k] > 0);
          return (
            <div key={k} style={{ opacity: fog ? 0.6 : 1 }}>
              <div className="flex justify-between text-sm"><span>{fog ? <><Icon n="lock" size={12} /> {label(k)} <span style={{ color: 'var(--muted)' }}>· discovered in later lessons</span></> : label(k)}</span><span className="tnum" style={{ color: 'var(--muted)' }}>{have}/{t}</span></div>
              <div className="mt-1"><Bar pct={have / t} h={6} color={have >= t ? 'var(--ok)' : 'var(--sky)'} /></div>
            </div>
          );
        })}
      </div>
      <div className="text-xs font-bold mt-4" style={{ color: 'var(--muted)' }}>Typical tasks</div>
      <ul className="mt-1 flex flex-col gap-1">{role.tasks.map(t => <li key={t} className="flex gap-2"><span className="mt-2.5 w-1.5 h-1.5 rounded-full flex-none" style={{ background: 'var(--pine)' }} /><span>{t}</span></li>)}</ul>
      <div className="text-xs font-bold mt-4" style={{ color: 'var(--muted)' }}>Certifications</div>
      <div className="flex flex-wrap gap-1.5 mt-1">{role.certs.map(c => <span key={c} className="text-[13px] rounded-lg px-2 py-1 border" style={{ borderColor: 'var(--line)' }}>{c}</span>)}</div>
      <div className="grid gap-3 mt-4">
        <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-2)' }}>
          <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Salary range Switzerland (indicative)</div>
          <div className="font-extrabold text-lg tnum">{role.salary}</div>
        </div>
        <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--pine-soft)' }}>
          <div className="text-xs font-bold" style={{ color: 'var(--pine)' }}>Your business degree as an asset</div>
          <div>{role.asset}</div>
        </div>
      </div>
      <Verify v={CAREERS.salaryVerify} />
    </Sheet>
  );
}
