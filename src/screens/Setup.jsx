import React, { useState } from 'react';
import { useApp } from '../App.jsx';
import { Btn, Icon } from '../components/ui.jsx';
import { addMonths } from '../lib/dates.js';

export const REACHED = [
  { id: 'A1', label: 'A1', hint: 'Simple phrases' },
  { id: 'A2', label: 'A2', hint: 'Routine conversations' },
  { id: 'B1', label: 'B1', hint: 'Work topics, with effort' },
  { id: 'B2', label: 'B2', hint: 'Fluent at work, some errors' }
];
export const TARGETS = ['B2', 'C1'];
export const SPLITS = [
  { german: 45, health: 15 }, { german: 40, health: 20 }, { german: 30, health: 30 }
];

export function SplitPicker({ value, onChange }) {
  const custom = !SPLITS.some(s => s.german === value.german && s.health === value.health);
  const step = (block, delta) => {
    const v = Math.max(5, Math.min(90, value[block] + delta));
    onChange({ ...value, [block]: v });
  };
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {SPLITS.map(s => {
          const on = s.german === value.german && s.health === value.health;
          return (
            <button key={s.german} type="button" onClick={() => onChange(s)} aria-pressed={on}
              className="rounded-xl border px-2 py-2.5 text-sm font-bold"
              style={on ? { borderColor: 'var(--pine)', background: 'var(--pine-soft)', color: 'var(--pine)' } : { borderColor: 'var(--line)', background: 'var(--surface)' }}>
              {s.german} / {s.health}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        {[['german', 'Deutsch'], ['health', 'Healthcare IT']].map(([k, label]) => (
          <div key={k} className="rounded-xl border px-3 py-2" style={{ borderColor: custom ? 'var(--pine)' : 'var(--line)' }}>
            <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{label}</div>
            <div className="flex items-center justify-between mt-1">
              <button type="button" onClick={() => step(k, -5)} className="w-8 h-8 rounded-full border font-bold" style={{ borderColor: 'var(--line)' }} aria-label={`Less ${label}`}>−</button>
              <span className="font-bold tnum">{value[k]} min</span>
              <button type="button" onClick={() => step(k, 5)} className="w-8 h-8 rounded-full border font-bold" style={{ borderColor: 'var(--line)' }} aria-label={`More ${label}`}>+</button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Total {value.german + value.health} min per day.</p>
    </div>
  );
}

export default function Setup() {
  const { state, actions, today } = useApp();
  const p = state.profile;
  const [name, setName] = useState(p.name);
  const [reached, setReached] = useState(p.germanReached);
  const [target, setTarget] = useState(p.germanTarget);
  const [date, setDate] = useState(p.targetDate || addMonths(today, 6));
  const [split, setSplit] = useState(p.split);
  const migrated = !!state.legacy;

  return (
    <div className="overlay" style={{ alignItems: 'stretch' }} role="dialog" aria-modal="true" aria-label="Set up your plan">
      <div className="sheet pop" style={{ maxHeight: '100%', borderRadius: 0, paddingTop: 'calc(20px + env(safe-area-inset-top, 0px))' }}>
        <div className="eyebrow" style={{ color: 'var(--pine)' }}>{migrated ? 'New version' : 'Welcome'}</div>
        <h1 className="text-[28px] font-extrabold leading-tight mt-1">Set up your daily plan</h1>
        <p className="mt-1.5" style={{ color: 'var(--muted)' }}>
          {migrated
            ? 'The app now works with time-based blocks and card queues. Your XP, streak and words are kept; lessons restart in the new case-type structure.'
            : 'One hour a day: German and Swiss healthcare IT, each feeding the other. You can change everything later under Me.'}
        </p>

        <label htmlFor="setup-name" className="block text-sm font-bold mt-5">First name</label>
        <input id="setup-name" value={name} onChange={e => setName(e.target.value)} placeholder="For greetings"
          className="mt-1 w-full rounded-xl border px-3 py-2.5" style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' }} />

        <div className="text-sm font-bold mt-5">German level you have already reached</div>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          {REACHED.map(r => {
            const on = reached === r.id;
            return (
              <button key={r.id} type="button" onClick={() => setReached(r.id)} aria-pressed={on} className="rounded-xl border px-3 py-2 text-left"
                style={on ? { borderColor: 'var(--sky)', background: 'var(--sky-soft)' } : { borderColor: 'var(--line)', background: 'var(--surface)' }}>
                <div className="font-extrabold">{r.label}</div><div className="text-xs" style={{ color: 'var(--muted)' }}>{r.hint}</div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div>
            <div className="text-sm font-bold">Target level</div>
            <div className="flex gap-2 mt-1.5">
              {TARGETS.map(t => (
                <button key={t} type="button" onClick={() => setTarget(t)} aria-pressed={target === t} className="flex-1 rounded-xl border py-2 font-extrabold"
                  style={target === t ? { borderColor: 'var(--sky)', background: 'var(--sky-soft)' } : { borderColor: 'var(--line)', background: 'var(--surface)' }}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="setup-date" className="text-sm font-bold">By</label>
            <input id="setup-date" type="date" value={date} min={today} onChange={e => setDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border px-3 py-2" style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' }} />
          </div>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>The app projects a realistic date from your real pace and shows what would close the gap.</p>

        <div className="text-sm font-bold mt-5">Daily split (minutes Deutsch / Healthcare IT)</div>
        <div className="mt-1.5"><SplitPicker value={split} onChange={setSplit} /></div>

        <div className="mt-6 flex justify-end">
          <Btn onClick={() => actions.profile({ name: name.trim(), germanReached: reached, germanTarget: target, targetDate: date || addMonths(today, 6), split, setupDone: true })}>
            <Icon n="check" size={18} />Start
          </Btn>
        </div>
      </div>
    </div>
  );
}
