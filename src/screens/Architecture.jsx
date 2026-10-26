import React, { useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon } from '../components/ui.jsx';
import { ARCH } from '../content/index.js';

const LAYER_COLOR = { ui: 'var(--pine)', app: 'var(--sky)', db: 'var(--das)', ext: 'var(--amber)' };

export default function ArchitectureMap() {
  const { state, actions } = useApp();
  const [sel, setSel] = useState(null);
  const [path, setPath] = useState(false);
  const node = sel ? ARCH.nodes.find(n => n.id === sel) : null;
  const pathIndex = Object.fromEntries(ARCH.path.steps.map((s, i) => [s.node, i + 1]));
  const open = id => { setSel(id); actions.archSeen(id); };
  const linkedFrom = node ? ARCH.nodes.filter(n => n.links.includes(node.id)) : [];
  const neighbours = node ? Array.from(new Set([...node.links, ...linkedFrom.map(n => n.id)])) : [];

  return (
    <div className="gutter pagepad flex flex-col gap-4">
      <header>
        <h1 className="text-[26px] font-extrabold leading-tight">System map</h1>
        <p className="mt-1" style={{ color: 'var(--muted)' }}>What you click in SAP GUI, the logic behind it, the tables underneath, and the systems around IS-H. Tap any box.</p>
        <div className="flex items-center justify-between gap-3 mt-3">
          <button type="button" onClick={() => setPath(!path)} aria-pressed={path} aria-label="Show my Kostensicherung path"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-bold text-sm border"
            style={path ? { background: 'var(--amber)', color: 'var(--on-accent)', borderColor: 'var(--amber)' } : { borderColor: 'var(--line)', background: 'var(--surface)' }}>
            <Icon n="route" size={17} />Kostensicherung path
          </button>
          <span className="text-xs tnum" style={{ color: 'var(--muted)' }}>{state.archSeen.length}/{ARCH.nodes.length} explored</span>
        </div>
      </header>

      {ARCH.layers.map((L, li) => (
        <React.Fragment key={L.id}>
          {li > 0 && <div className="flex justify-center -my-2" aria-hidden="true"><svg width="20" height="22" viewBox="0 0 20 22"><path d="M10 0v18M4 13l6 6 6-6" fill="none" stroke="var(--line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>}
          <section className="rounded-2xl p-3 border" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }} aria-label={L.title}>
            <div className="flex items-baseline gap-2 px-1">
              <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: LAYER_COLOR[L.id] }} />
              <h2 className="text-base font-extrabold">{L.title}</h2>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{L.sub}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ARCH.nodes.filter(n => n.layer === L.id).map(n => {
                const step = path ? pathIndex[n.id] : null;
                const dim = path && !step;
                return (
                  <button key={n.id} type="button" onClick={() => open(n.id)}
                    className="relative text-left rounded-xl border p-2.5 min-w-0 transition"
                    style={{ background: 'var(--surface)', borderColor: step ? 'var(--amber)' : 'var(--line)', borderWidth: step ? 2 : 1, opacity: dim ? .45 : 1 }}>
                    {step && <span className="absolute -top-2 -right-2 grid place-items-center w-6 h-6 rounded-full text-xs font-extrabold" style={{ background: 'var(--amber)', color: 'var(--on-accent)' }}>{step}</span>}
                    <div className="font-mono text-[12px] truncate" style={{ color: LAYER_COLOR[L.id] }}>{n.code}</div>
                    <div className="font-bold leading-snug text-[15px]">{n.label}</div>
                    <div className="text-[12px] leading-snug mt-0.5" style={{ color: 'var(--muted)' }}>{n.short}</div>
                    {state.archSeen.includes(n.id) && !step && <span className="absolute top-2 right-2" style={{ color: 'var(--ok)' }}><Icon n="check" size={14} /></span>}
                  </button>
                );
              })}
            </div>
          </section>
        </React.Fragment>
      ))}

      {path && (
        <section className="card p-4">
          <h2 className="text-lg font-extrabold">{ARCH.path.title}</h2>
          <ol className="list-none p-0 mt-2 flex flex-col gap-2">
            {ARCH.path.steps.map((s, i) => (
              <li key={i}>
                <button type="button" onClick={() => open(s.node)} className="w-full text-left flex gap-3 rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-2)' }}>
                  <span className="font-extrabold tnum flex-none" style={{ color: 'var(--amber)' }}>{i + 1}</span><span>{s.text}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>Your homework: in SAP GUI click into the remark field → F1 → Technical information. Note the table/structure and field name. That one fact turns this map from “probably” into “known”.</p>
        </section>
      )}

      {node && (
        <div className="overlay" onClick={() => setSel(null)} role="dialog" aria-modal="true" aria-label={node.label}>
          <div className="sheet pop" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-sm" style={{ color: LAYER_COLOR[node.layer] }}>{node.code}</div>
                <h2 className="text-2xl font-extrabold leading-tight">{node.label}</h2>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>{ARCH.layers.find(l => l.id === node.layer).title}</div>
              </div>
              <button type="button" onClick={() => setSel(null)} className="p-2 rounded-full" aria-label="Close"><Icon n="close" /></button>
            </div>
            <p className="mt-3 font-bold">{node.short}</p>
            <p className="mt-2">{node.detail}</p>
            <div className="mt-3 rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-2)' }}>
              <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>In Epic</div>
              <div>{node.epic}</div>
            </div>
            {node.verify && (
              <div className="mt-3 rounded-xl border px-3 py-2.5 text-sm flex gap-2" style={{ borderColor: 'var(--amber)', background: 'var(--amber-soft)' }}>
                <Icon n="flag" size={17} style={{ color: 'var(--amber)', flex: 'none', marginTop: 2 }} />
                <span><b>Verify in your system:</b> F1 → Technical information on the field, or ask your IS-H application team which table holds it. Customizing differs between hospitals.</span>
              </div>
            )}
            {neighbours.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Connected to</div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {neighbours.map(id => { const n = ARCH.nodes.find(x => x.id === id); return (
                    <button key={id} type="button" onClick={() => open(id)} className="text-[14px] rounded-lg px-2.5 py-1.5 border font-bold" style={{ borderColor: LAYER_COLOR[n.layer] }}>{n.label}</button>
                  ); })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
