import React, { useMemo, useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon, Bar, Seg, Sheet, SheetHead, CaseTag, CASE_COLOR, CASE_SOFT, CASE_LABEL, CASE_SHORT, MCQ, Btn } from '../components/ui.jsx';
import { ProcessBody, SystemsBody, ListBody, KpiBody, RippleBody, WhyBody, RadarItemBody } from '../components/HealthCards.jsx';
import { stageProgress, moduleStatus } from '../lib/game.js';
import { STAGES, STAGE_BY_ID, MODULES, CASE_TYPES, RADAR, RADAR_CHECKED_ON, STAGE_BA } from '../content/index.js';
import { shortDate } from '../lib/dates.js';

const STATUS_STYLE = {
  done: { background: 'var(--ok)', color: 'var(--on-accent)' },
  started: { background: 'var(--sky)', color: 'var(--on-accent)' },
  open: { background: 'var(--surface)', color: 'var(--muted)', border: '1.5px solid var(--line)' },
  planned: { background: 'transparent', color: 'var(--muted)', border: '1.5px dashed var(--line)' },
  no: { background: 'var(--surface-2)', color: 'var(--muted)' }
};

function caseState(stage, ct) {
  if (stage.applies[ct] === 'no') return 'no';
  const c = stage.cases[ct];
  if (!c) return 'planned';
  return c.status;
}

export default function Journey() {
  const [seg, setSeg] = useState('stages');
  return (
    <div className="gutter pagepad flex flex-col gap-4">
      <header>
        <h1 className="text-[26px] font-extrabold leading-tight">Swiss patient journey</h1>
        <p className="mt-1" style={{ color: 'var(--muted)' }}>Ten stages from referral to controlling, each for external orders, outpatients and inpatients.</p>
      </header>
      <Seg label="Journey views" value={seg} onChange={setSeg} options={[{ id: 'stages', label: 'Stages' }, { id: 'ripple', label: 'Ripple map' }, { id: 'radar', label: 'Radar' }]} />
      {seg === 'stages' && <Stages />}
      {seg === 'ripple' && <RippleMap />}
      {seg === 'radar' && <Radar />}
    </div>
  );
}

/* ---------------- stages ---------------- */
function Stages() {
  const { state } = useApp();
  const stages = stageProgress(state);
  const [open, setOpen] = useState(null);
  const [reader, setReader] = useState(null);
  const total = MODULES.length, done = Object.keys(state.modulesDone).length;
  const sel = open ? stages.find(s => s.id === open) : null;
  return (
    <>
      <div>
        <Bar pct={done / Math.max(1, total)} />
        <div className="text-xs mt-1 tnum" style={{ color: 'var(--muted)' }}>{done} of {total} lessons · {stages.filter(s => s.ready).length} of {stages.length} stages written</div>
      </div>
      <div className="flex flex-wrap gap-2 text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
        {CASE_TYPES.map(c => <CaseTag key={c.id} type={c.id} small />)}
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={STATUS_STYLE.done} />done</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={STATUS_STYLE.planned} />roadmap</span>
      </div>
      <ol className="list-none p-0 m-0 flex flex-col gap-2">
        {stages.map(s => (
          <li key={s.id}>
            <button type="button" onClick={() => setOpen(s.id)} className="card w-full p-3.5 text-left flex items-center gap-3" style={s.ready ? {} : { opacity: .85 }}>
              <span className="grid place-items-center w-9 h-9 rounded-full font-extrabold tnum flex-none" style={s.total && s.done === s.total && s.baDone ? STATUS_STYLE.done : s.ready ? { background: 'var(--pine-soft)', color: 'var(--pine)' } : STATUS_STYLE.planned}>{s.order}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold leading-snug">{s.title}</span>
                <span className="block text-sm" style={{ color: 'var(--muted)' }} lang="de">{s.de}</span>
              </span>
              <span className="flex gap-1.5 flex-none" aria-label="Case types">
                {CASE_TYPES.map(c => {
                  const st = caseState(s, c.id);
                  return <span key={c.id} title={`${c.label}: ${st}`} className="grid place-items-center w-6 h-6 rounded-full text-[10px] font-extrabold"
                    style={{ ...STATUS_STYLE[st], ...(st === 'open' || st === 'started' ? { borderColor: CASE_COLOR[c.id], border: `1.5px solid ${CASE_COLOR[c.id]}` } : {}), ...(st === 'started' ? { background: CASE_SOFT[c.id], color: CASE_COLOR[c.id] } : {}) }}>
                    {st === 'done' ? '✓' : st === 'no' ? '–' : c.label[0]}
                  </span>;
                })}
              </span>
            </button>
          </li>
        ))}
      </ol>
      {sel && <StageSheet stage={sel} onClose={() => setOpen(null)} onRead={m => setReader(m)} />}
      {reader && <Reader m={reader} onClose={() => setReader(null)} />}
    </>
  );
}

function StageSheet({ stage, onClose, onRead }) {
  const { state } = useApp();
  const [ct, setCt] = useState('external');
  const st = caseState(stage, ct);
  const mod = stage.cases[ct] && stage.cases[ct].module;
  return (
    <Sheet onClose={onClose} label={stage.title}>
      <SheetHead eyebrow={`Stage ${stage.order}`} title={stage.title} sub={stage.de} onClose={onClose} />
      <p className="mt-3">{stage.summary}</p>
      <div className="mt-4"><Seg label="Case type" value={ct} onChange={setCt} options={CASE_TYPES.map(c => ({ id: c.id, label: CASE_SHORT[c.id] }))} /></div>
      <div className="mt-4 rounded-2xl p-4" style={{ background: CASE_SOFT[ct] }}>
        <div className="eyebrow" style={{ color: CASE_COLOR[ct] }}>{CASE_LABEL[ct]} · {stage.applies[ct] === 'yes' ? 'applies' : stage.applies[ct] === 'partly' ? 'partly applies' : 'does not apply'}</div>
        <p className="mt-1">{stage.notes[ct]}</p>
      </div>
      {st !== 'no' && (
        <div className="mt-4">
          {mod ? (
            <div className="card p-4">
              <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Lesson</div>
              <div className="font-extrabold leading-snug mt-0.5">{mod.title}</div>
              <p className="text-[15px] mt-1" style={{ color: 'var(--muted)' }}>{mod.summary}</p>
              <div className="text-xs font-bold mt-3" style={{ color: 'var(--err)' }}>Ripple effects</div>
              <ul className="mt-1 flex flex-col gap-1 text-[15px]">{mod.ripples.map((r, i) => <li key={i}>{r.error} → <b>{STAGE_BY_ID[r.surfacesAt].title}</b></li>)}</ul>
              <div className="mt-3">
                {st === 'open' ? <p className="text-sm" style={{ color: 'var(--muted)' }}><Icon n="lock" size={14} /> Unlocks in your daily Healthcare IT queue.</p>
                  : <Btn kind="ghost" onClick={() => onRead(mod)}><Icon n="book" size={18} />{st === 'done' ? 'Review lesson' : 'Read what you have so far'}</Btn>}
              </div>
            </div>
          ) : <p className="text-[15px]" style={{ color: 'var(--muted)' }}>On the roadmap: lessons for this stage come in a later phase.</p>}
        </div>
      )}
      <div className="grid gap-3 mt-4">
        {[['SAP IS-H', stage.ish, 'var(--sky)'], ['Epic', stage.epic, 'var(--die)'], ['Standards & partners', stage.standards, 'var(--das)']].map(([t, items, c]) => (
          <div key={t}><div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{t}</div>
            <div className="flex flex-wrap gap-1.5 mt-1">{items.map(i => <span key={i} className="text-[13px] rounded-lg px-2 py-1 border" style={{ borderColor: c }}>{i}</span>)}</div></div>
        ))}
      </div>
      {STAGE_BA[stage.id] && <p className="text-sm mt-4" style={{ color: 'var(--muted)' }}>Stage finale: {STAGE_BA[stage.id].title} {state.stagesDone[stage.id] ? '✓' : ''}</p>}
    </Sheet>
  );
}

function Reader({ m, onClose }) {
  const { state } = useApp();
  const a = state.answers[`${m.id}:quiz`] || {};
  const done = !!state.modulesDone[m.id];
  const sec = (title, body) => <section className="mt-6"><h3 className="text-lg font-extrabold mb-2">{title}</h3>{body}</section>;
  return (
    <Sheet onClose={onClose} label={m.title}>
      <SheetHead title="Lesson review" onClose={onClose} />
      <div className="mt-3" />
      <ProcessBody m={m} />
      {sec('SAP IS-H & Epic', <SystemsBody m={m} />)}
      {sec('Interfaces & standards', <ListBody eyebrow="" color="var(--das)" block={m.interfaces} />)}
      {sec('Tariffs & regulation', <ListBody eyebrow="" color="var(--amber)" block={m.tariffs} />)}
      {sec(m.scenario.title, <><p>{m.scenario.situation}</p><p className="font-bold mt-2">{m.scenario.question}</p><ol className="mt-2 flex flex-col gap-1.5 pl-5 list-decimal">{m.scenario.steps.map((x, i) => <li key={i}>{x}</li>)}</ol></>)}
      {sec('Quiz', <div className="flex flex-col gap-4">{m.quiz.map((q, i) => <MCQ key={i} q={q} seed={m.id + i} chosen={a[i] !== undefined ? a[i] : q.a} onPick={() => {}} />)}</div>)}
      {sec('KPIs & BA idea', <KpiBody m={m} />)}
      {sec('Ripple effect', <RippleBody m={m} />)}
      {sec('Why this matters', <WhyBody m={m} done={done} />)}
    </Sheet>
  );
}

/* ---------------- ripple map ---------------- */
const ROW = 46, LANE = 70;
function RippleMap() {
  const { state } = useApp();
  const [sel, setSel] = useState('referral');
  const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ripples = useMemo(() => MODULES.flatMap(m => m.ripples.map((r, i) => ({ ...r, module: m, key: m.id + i }))), []);
  const idx = id => STAGES.findIndex(s => s.id === id);
  const H = STAGES.length * ROW;
  const y = i => i * ROW + ROW / 2;
  const pairCount = {};
  const arcs = ripples.map(r => {
    const a = idx(r.module.stage), b = idx(r.surfacesAt);
    const k = `${a}-${b}`; pairCount[k] = (pairCount[k] || 0) + 1;
    const span = Math.abs(b - a);
    const w = Math.min(LANE - 8, 14 + span * 6) + (pairCount[k] - 1) * 5;
    const d = `M ${LANE} ${y(a)} C ${LANE - w} ${y(a)}, ${LANE - w} ${y(b)}, ${LANE} ${y(b)}`;
    return { ...r, d, a, b };
  });
  const active = arcs.filter(r => r.module.stage === sel);
  return (
    <>
      <p style={{ color: 'var(--muted)' }}>An error made at one stage travels down the journey and surfaces later – often as a rejection. Tap a stage to follow its errors.</p>
      <div className="flex flex-wrap gap-2">{CASE_TYPES.map(c => <CaseTag key={c.id} type={c.id} small />)}</div>
      <div className="card p-3">
        <div className="relative" style={{ height: H }}>
          <svg width="100%" height={H} className="absolute inset-0" aria-hidden="true">
            <line x1={LANE} y1={y(0)} x2={LANE} y2={y(STAGES.length - 1)} stroke="var(--line)" strokeWidth="2" />
            {arcs.map(r => {
              const on = r.module.stage === sel;
              return (
                <g key={r.key} opacity={on ? 1 : 0.18}>
                  <path id={`arc-${r.key}`} d={r.d} fill="none" stroke={CASE_COLOR[r.module.caseType]} strokeWidth={on ? 2.5 : 1.5} strokeDasharray={on ? '0' : '4 4'} />
                  {on && !reduce && (
                    <circle r="5" fill="var(--err)">
                      <animateMotion dur="2.4s" repeatCount="indefinite"><mpath xlinkHref={`#arc-${r.key}`} /></animateMotion>
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>
          {STAGES.map((s, i) => {
            const out = arcs.filter(r => r.a === i).length, inc = arcs.filter(r => r.b === i).length;
            const on = s.id === sel;
            return (
              <button key={s.id} type="button" onClick={() => setSel(s.id)} className="absolute left-0 right-0 flex items-center text-left" style={{ top: i * ROW, height: ROW, paddingLeft: LANE - 7 }} aria-pressed={on}>
                <span className="w-3.5 h-3.5 rounded-full flex-none" style={{ background: on ? 'var(--amber)' : inc ? 'var(--err)' : 'var(--surface)', border: '2px solid ' + (on ? 'var(--amber)' : inc ? 'var(--err)' : 'var(--line)') }} />
                <span className="ml-3 min-w-0 flex-1 truncate font-bold text-[15px]" style={{ color: on ? 'var(--ink)' : 'var(--muted)' }}>{s.title}</span>
                <span className="text-[11px] font-bold tnum flex-none pr-1" style={{ color: 'var(--muted)' }}>{out ? `${out} out` : ''}{out && inc ? ' · ' : ''}{inc ? <span style={{ color: 'var(--err)' }}>{inc} in</span> : ''}</span>
              </button>
            );
          })}
        </div>
      </div>
      <section aria-label="Ripples from the selected stage">
        <h2 className="text-lg font-extrabold">From {STAGE_BY_ID[sel].title}</h2>
        {active.length ? (
          <ul className="mt-2 flex flex-col gap-2">
            {active.map(r => {
              const learned = moduleStatus(state, r.module.id) === 'done';
              return (
                <li key={r.key} className="card p-3.5">
                  <div className="flex items-center justify-between gap-2"><CaseTag type={r.module.caseType} small />{learned && <span className="text-[11px] font-bold" style={{ color: 'var(--ok)' }}>learned ✓</span>}</div>
                  <div className="font-bold mt-1.5">{r.error}</div>
                  <div className="text-[15px] mt-1"><span style={{ color: 'var(--err)' }}>→ {STAGE_BY_ID[r.surfacesAt].title}:</span> {r.symptom}</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Patient: {r.patient}</div>
                </li>
              );
            })}
          </ul>
        ) : <p className="mt-1" style={{ color: 'var(--muted)' }}>{STAGES.find(s => s.id === sel) && MODULES.some(m => m.stage === sel) ? 'No ripples recorded yet.' : 'Ripple effects for this stage arrive with its lessons. Errors from earlier stages that surface here are shown in red.'}</p>}
      </section>
    </>
  );
}

/* ---------------- regulatory radar ---------------- */
const AREA_COLOR = { 'Inpatient tariffs': 'var(--inp)', 'Outpatient tariffs': 'var(--out)', AVOS: 'var(--amber)', 'Supplementary insurance (VVG)': 'var(--die)', Systems: 'var(--sky)', Interoperability: 'var(--das)', Financing: 'var(--ext)' };
function Radar() {
  const [ct, setCt] = useState('all');
  const [open, setOpen] = useState(null);
  const years = [2026, 2027, 2028, 2029, 2030, 2031, 2032];
  const yearOf = r => Number(r.date.slice(0, 4));
  const x = yr => 26 + ((yr - 2026) / 6) * 250;
  return (
    <>
      <p style={{ color: 'var(--muted)' }}>What changes 2026–2032 and what it means for each case type and stage. Every item is marked “verify before publishing” – rules change. Checked on {shortDate(RADAR_CHECKED_ON)}.</p>
      <div className="card p-3">
        <svg viewBox="0 0 300 64" width="100%" height="64" role="img" aria-label="Timeline 2026 to 2032">
          <line x1="26" y1="34" x2="276" y2="34" stroke="var(--line)" strokeWidth="2" />
          {years.map(yr => <g key={yr}><line x1={x(yr)} y1="29" x2={x(yr)} y2="39" stroke="var(--muted)" strokeWidth="1" /><text x={x(yr)} y="56" textAnchor="middle" fontSize="10" fill="var(--muted)">{yr}</text></g>)}
          {RADAR.map((r, i) => {
            const sameYear = RADAR.filter(q => yearOf(q) === yearOf(r));
            const k = sameYear.indexOf(r);
            return <circle key={r.id} cx={x(yearOf(r)) + (k - (sameYear.length - 1) / 2) * 6} cy="20" r="3" fill={AREA_COLOR[r.area] || 'var(--pine)'} />;
          })}
        </svg>
      </div>
      <Seg label="Case type filter" value={ct} onChange={setCt} options={[{ id: 'all', label: 'All' }, ...CASE_TYPES.map(c => ({ id: c.id, label: CASE_SHORT[c.id] }))]} />
      {years.filter(yr => RADAR.some(r => yearOf(r) === yr)).map(yr => (
        <section key={yr}>
          <h2 className="text-lg font-extrabold">{yr}</h2>
          <div className="flex flex-col gap-2 mt-2">
            {RADAR.filter(r => yearOf(r) === yr).map(r => (
              <div key={r.id} className="card overflow-hidden">
                <button type="button" onClick={() => setOpen(open === r.id ? null : r.id)} className="w-full text-left p-3.5 flex gap-3 items-start" aria-expanded={open === r.id}>
                  <span className="w-2.5 h-2.5 rounded-full mt-2 flex-none" style={{ background: AREA_COLOR[r.area] || 'var(--pine)' }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold" style={{ color: 'var(--muted)' }}>{r.area} · {r.status === 'ongoing' ? 'ongoing' : shortDate(r.date)}</span>
                    <span className="block font-extrabold leading-snug mt-0.5">{r.title}</span>
                    {ct !== 'all' && <span className="block text-[15px] mt-1"><CaseTag type={ct} small /> <span className="ml-1">{r.impact[ct]}</span></span>}
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold mt-1.5" style={{ color: 'var(--amber)' }}><Icon n="flag" size={12} />Verify before publishing</span>
                  </span>
                  <Icon n={open === r.id ? 'close' : 'next'} size={18} style={{ color: 'var(--muted)', flex: 'none' }} />
                </button>
                {open === r.id && <div className="px-3.5 pb-4 pop"><RadarItemBody item={r} /></div>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
