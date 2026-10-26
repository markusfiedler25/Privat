import React from 'react';

const P = {
  today: <g><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></g>,
  journey: <g><circle cx="5.5" cy="18" r="2" /><circle cx="18.5" cy="6" r="2" /><path d="M7.5 18h5a3 3 0 0 0 0-6h-1a3 3 0 0 1 0-6h5" /></g>,
  map: <g><rect x="3.5" y="3.5" width="7" height="5" rx="1.2" /><rect x="13.5" y="3.5" width="7" height="5" rx="1.2" /><rect x="8.5" y="15.5" width="7" height="5" rx="1.2" /><path d="M7 8.5v3.5h10V8.5M12 12v3.5" /></g>,
  career: <g><rect x="3.5" y="7.5" width="17" height="12" rx="2" /><path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M3.5 12.5h17" /></g>,
  me: <g><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></g>,
  play: <path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" />,
  pause: <g fill="currentColor" stroke="none"><rect x="6.5" y="5" width="4" height="14" rx="1" /><rect x="13.5" y="5" width="4" height="14" rx="1" /></g>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  back: <path d="M15 5l-7 7 7 7" />,
  next: <path d="M9 5l7 7-7 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  lock: <g><rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></g>,
  star: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" />,
  snow: <g><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" /><path d="M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5" /></g>,
  speak: <g><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M15.5 9.2a4 4 0 0 1 0 5.6" /><path d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8" /></g>,
  eye: <g><path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></g>,
  alert: <g><path d="M12 3.5l9.5 16.5h-19z" /><path d="M12 10v4.5M12 17.2v.3" /></g>,
  link: <g><path d="M10 14l4-4" /><path d="M8.5 11.5l-2 2a3 3 0 0 0 4.2 4.2l2-2" /><path d="M15.5 12.5l2-2a3 3 0 0 0-4.2-4.2l-2 2" /></g>,
  book: <g><path d="M4 5.5A2 2 0 0 1 6 3.5h13v15H6a2 2 0 0 0-2 2z" /><path d="M4 20.5V5.5" /></g>,
  chat: <path d="M4.5 5.5h15v10h-8l-4.5 3.5v-3.5h-2.5z" />,
  sword: <g><path d="M14.5 4.5h5v5L10 19l-5-5z" /><path d="M7 14l3 3M4 20l2-2" /></g>,
  bell: <g><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></g>,
  download: <g><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5" /><path d="M5 19.5h14" /></g>,
  upload: <g><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5" /><path d="M5 19.5h14" /></g>,
  flag: <g><path d="M5 21V4" /><path d="M5 4.5h11l-2 3.5 2 3.5H5" /></g>,
  route: <g><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 6h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h7" /></g>
};

export function Icon({ n, size = 20, className = '', style }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">{P[n]}</svg>;
}

export function Flame({ size = 40, lit }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className={lit ? 'flicker' : ''}>
      <path d="M24 3c1.4 7 8 10.6 10.6 17.2 3.4 8.6-2 20.8-10.6 20.8S9.6 33.4 12 25.4c1.1-3.8 3.7-6.2 5.4-7.9.4 3.6 1.9 5.9 4.2 6.8C20.4 17.2 22 10 24 3z" fill={lit ? 'var(--amber)' : 'var(--line)'} />
      <path d="M24 26c.6 3 3.6 4.4 3.6 8a3.6 3.6 0 0 1-7.2 0c0-2.4 1.4-3.6 2-4.8.2 1.2.8 2 1.6 2.2-.4-2 .2-3.8 0-5.4z" fill={lit ? 'var(--amber-soft)' : 'var(--surface-2)'} />
    </svg>
  );
}

export function Bar({ pct, color = 'var(--pine)', track = 'var(--surface-2)', h = 8 }) {
  return (
    <div className="rounded-full overflow-hidden" style={{ background: track, height: h }}>
      <div className="bar h-full rounded-full" style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%`, background: color }} />
    </div>
  );
}

export function Verify({ v }) {
  if (!v) return null;
  return (
    <div className="mt-3 rounded-xl border px-3 py-2.5 text-sm flex gap-2.5" style={{ borderColor: 'var(--amber)', background: 'var(--amber-soft)' }}>
      <Icon n="flag" size={17} style={{ color: 'var(--amber)', flex: 'none', marginTop: 2 }} />
      <div className="min-w-0">
        <div><b>Verify:</b> {v.note}</div>
        {v.sources && v.sources.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {v.sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-2" style={{ color: 'var(--ink)' }}>{s.name}</a>)}
          </div>
        )}
      </div>
    </div>
  );
}

export function Word({ de }) {
  const m = /^(der|die|das)\s+(.*)$/.exec(de);
  if (!m) return <span>{de}</span>;
  return <span><span className={'art-' + m[1] + ' font-bold'}>{m[1]}</span> {m[2]}</span>;
}

export function Btn({ children, onClick, kind = 'primary', disabled, className = '', type = 'button', ...rest }) {
  const styles = {
    primary: { background: 'var(--pine)', color: 'var(--on-accent)' },
    sky: { background: 'var(--sky)', color: 'var(--on-accent)' },
    amber: { background: 'var(--amber)', color: 'var(--on-accent)' },
    ghost: { background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)' },
    ok: { background: 'var(--ok-soft)', color: 'var(--ok)', border: '1px solid var(--ok)' }
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} {...rest}
      className={'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 font-bold text-[15px] disabled:opacity-40 active:scale-[.98] transition ' + className}
      style={styles[kind]}>{children}</button>
  );
}

// Deterministic shuffle so options don't jump around between renders.
export function shuffled(arr, seed) {
  const idx = arr.map((_, i) => i);
  let h = 2166136261;
  for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  for (let i = idx.length - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 15), 2246822507); const j = Math.abs(h) % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
export function speak(text) {
  if (!canSpeak) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\(.*?\)/g, ''));
    u.lang = 'de-CH'; u.rate = 0.92;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang === 'de-CH') || voices.find(v => v.lang && v.lang.startsWith('de'));
    if (v) { u.voice = v; u.lang = v.lang; }
    window.speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

export function SpeakBtn({ text, size = 18 }) {
  if (!canSpeak) return null;
  return <button type="button" onClick={e => { e.stopPropagation(); speak(text); }} className="p-1.5 rounded-full text-muted hover:text-ink flex-none" aria-label={'Read aloud: ' + text}><Icon n="speak" size={size} /></button>;
}

export function MCQ({ q, chosen, onPick, seed, correctLabel = 'Correct', xp }) {
  const order = shuffled(q.o, seed);
  const done = chosen !== undefined && chosen !== null;
  return (
    <div>
      <div className="font-bold">{q.q}</div>
      <div className="flex flex-col gap-2 mt-2.5">
        {order.map(oi => {
          let st = { borderColor: 'var(--line)', background: 'var(--surface)' };
          if (done) {
            if (oi === q.a) st = { borderColor: 'var(--ok)', background: 'var(--ok-soft)', color: 'var(--ok)' };
            else if (oi === chosen) st = { borderColor: 'var(--err)', background: 'var(--err-soft)', color: 'var(--err)' };
            else st = { borderColor: 'var(--line)', background: 'var(--surface)', opacity: .55 };
          }
          return (
            <button key={oi} type="button" disabled={done} onClick={() => onPick(oi)}
              className="text-left rounded-xl border px-3.5 py-3 font-medium flex items-center gap-2" style={st}>
              <span className="flex-1">{q.o[oi]}</span>{done && oi === q.a && <Icon n="check" size={18} />}
            </button>
          );
        })}
      </div>
      {done && q.x && <p className="pop text-sm mt-2" style={{ color: chosen === q.a ? 'var(--ok)' : 'var(--muted)' }}>{chosen === q.a ? `${correctLabel}${xp ? ` · +${xp} XP` : ''}. ` : 'Not quite. '}{q.x}</p>}
    </div>
  );
}
