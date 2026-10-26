import React from 'react';
import { useApp } from '../App.jsx';
import { Icon } from './ui.jsx';

const mmss = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
const META = {
  health: { label: 'Healthcare IT', color: 'var(--pine)', soft: 'var(--pine-soft)' },
  german: { label: 'Deutsch', color: 'var(--sky)', soft: 'var(--sky-soft)' }
};

function Ring({ pct, color, soft, size = 64 }) {
  const r = (size - 10) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={soft} strokeWidth="7" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${pct * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
}

export function HalfTimer({ half }) {
  const { timer, day } = useApp();
  const m = META[half];
  const left = timer.liveLeft(half);
  const running = timer.run && timer.run.half === half;
  const done = day[half];
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="relative flex-none">
        <Ring pct={(1800 - left) / 1800} color={m.color} soft={m.soft} />
        <button type="button" onClick={() => running ? timer.pause() : timer.start(half)} disabled={left === 0}
          className="absolute inset-0 grid place-items-center rounded-full" style={{ color: m.color }}
          aria-label={(running ? 'Pause ' : 'Start ') + m.label + ' timer'}>
          {left === 0 ? <Icon n="check" size={22} /> : <Icon n={running ? 'pause' : 'play'} size={22} />}
        </button>
      </div>
      <div className="min-w-0">
        <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{m.label}</div>
        <div className="font-mono text-xl tnum leading-tight">{mmss(left)}</div>
        <div className="text-xs" style={{ color: done ? 'var(--ok)' : 'var(--muted)' }}>{done ? 'Half done ✓' : running ? 'Running' : left === 0 ? 'Time up' : left === 1800 ? 'Not started' : 'Paused'}</div>
      </div>
    </div>
  );
}

export function MiniTimer({ half }) {
  const { timer } = useApp();
  const m = META[half];
  const left = timer.liveLeft(half);
  const running = timer.run && timer.run.half === half;
  return (
    <button type="button" onClick={() => running ? timer.pause() : timer.start(half)} disabled={left === 0}
      className="inline-flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 font-mono text-sm tnum border"
      style={{ borderColor: running ? m.color : 'var(--line)', color: running ? m.color : 'var(--ink)', background: 'var(--surface)' }}
      aria-label={(running ? 'Pause' : 'Start') + ' timer'}>
      <Icon n={left === 0 ? 'check' : running ? 'pause' : 'play'} size={16} />{mmss(left)}
    </button>
  );
}
