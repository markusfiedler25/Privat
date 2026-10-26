import React, { useMemo, useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon, Btn, Verify, MCQ, Bullets, CaseTag, CASE_COLOR, shuffled } from './ui.jsx';
import { MODULE_BY_ID, MODULES, STAGES, STAGE_BY_ID, STAGE_BA, RADAR_BY_ID, CAREERS } from '../content/index.js';
import { XP, careerImpact, skillPoints, roleProgress } from '../lib/game.js';

const skillLabel = id => (CAREERS.skills.find(s => s.id === id) || { label: id }).label;

export function Finish({ ready = true, onClick, label = 'Finish card', hint }) {
  return (
    <div className="mt-5 pt-4 border-t flex flex-col items-stretch gap-2" style={{ borderColor: 'var(--line)' }}>
      {hint && !ready && <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>{hint}</p>}
      <Btn onClick={onClick} disabled={!ready}><Icon n="check" size={18} />{label}</Btn>
    </div>
  );
}

function ModuleHead({ m }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{m.stageTitle}</span>
      <CaseTag type={m.caseType} small />
    </div>
  );
}

/* ---------- small building blocks, also used by the lesson reader ---------- */
export function ProcessBody({ m }) {
  return (
    <>
      <ModuleHead m={m} />
      <h2 className="text-[22px] font-extrabold leading-tight mt-2">{m.title}</h2>
      <p className="mt-2" style={{ color: 'var(--muted)' }}>{m.summary}</p>
      {m.process.paragraphs.map((p, i) => <p key={i} className="mt-3">{p}</p>)}
      <div className="text-xs font-bold mt-4" style={{ color: 'var(--muted)' }}>Who is involved</div>
      <ul className="mt-2 flex flex-col gap-2">
        {m.process.actors.map(a => (
          <li key={a.who} className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-2)' }}>
            <div className="font-bold">{a.who}</div><div className="text-[15px]" style={{ color: 'var(--muted)' }}>{a.role}</div>
          </li>
        ))}
      </ul>
    </>
  );
}

export function SystemsBody({ m }) {
  return (
    <>
      <div className="eyebrow" style={{ color: 'var(--sky)' }}>SAP IS-H</div>
      <div className="mt-2"><Bullets items={m.systems.ish} color="var(--sky)" /></div>
      <div className="flex flex-wrap gap-2 mt-3">
        {m.systems.tables.map(t => (
          <span key={t.code} className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-sm" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
            <b className="font-mono" style={{ color: 'var(--sky)' }}>{t.code}</b>{t.what}
          </span>
        ))}
      </div>
      <div className="eyebrow mt-5" style={{ color: 'var(--die)' }}>Epic – the same step</div>
      <div className="mt-2"><Bullets items={m.systems.epic} color="var(--die)" /></div>
    </>
  );
}

export function ListBody({ eyebrow, color, block }) {
  return (
    <>
      {eyebrow && <div className="eyebrow mb-2" style={{ color }}>{eyebrow}</div>}
      <Bullets items={block.bullets} color={color} />
      <Verify v={block.verify} />
    </>
  );
}

export function KpiBody({ m }) {
  return (
    <>
      <div className="eyebrow" style={{ color: 'var(--ink)' }}>KPIs</div>
      <div className="mt-2 flex flex-col gap-2">
        {m.kpis.map(k => (
          <div key={k.name} className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-2)' }}>
            <b>{k.name}</b><div className="font-mono text-[13px] mt-0.5" style={{ color: 'var(--muted)' }}>{k.formula}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl p-4" style={{ background: 'var(--pine-soft)' }}>
        <div className="eyebrow" style={{ color: 'var(--pine)' }}>BA improvement idea</div>
        <p className="mt-1">{m.baIdea}</p>
      </div>
    </>
  );
}

export function RippleStrip({ from, to }) {
  const fi = STAGES.findIndex(s => s.id === from), ti = STAGES.findIndex(s => s.id === to);
  const n = STAGES.length, x = i => 12 + (i * 276) / (n - 1);
  return (
    <svg viewBox="0 0 300 44" width="100%" height="44" role="img" aria-label={`Error made at ${STAGES[fi]?.title}, shows up at ${STAGES[ti]?.title}`}>
      <line x1={x(0)} y1="30" x2={x(n - 1)} y2="30" stroke="var(--line)" strokeWidth="2" />
      <path d={`M ${x(fi)} 30 Q ${(x(fi) + x(ti)) / 2} 0 ${x(ti)} 30`} fill="none" stroke="var(--err)" strokeWidth="2.5" strokeDasharray="4 4" />
      {STAGES.map((s, i) => (
        <circle key={s.id} cx={x(i)} cy="30" r={i === fi || i === ti ? 6 : 3.5}
          fill={i === fi ? 'var(--amber)' : i === ti ? 'var(--err)' : 'var(--line)'} />
      ))}
    </svg>
  );
}

export function RippleBody({ m }) {
  return (
    <>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>What goes wrong here shows up later – often as a rejection.</p>
      <div className="flex flex-col gap-4 mt-3">
        {m.ripples.map((r, i) => (
          <div key={i} className="rounded-2xl border p-3.5" style={{ borderColor: 'var(--line)' }}>
            <div className="text-xs font-bold" style={{ color: 'var(--amber)' }}>If this goes wrong at {m.stageTitle}</div>
            <div className="font-bold mt-0.5">{r.error}</div>
            <div className="mt-2"><RippleStrip from={m.stage} to={r.surfacesAt} /></div>
            <div className="text-xs font-bold" style={{ color: 'var(--err)' }}>…it shows up at {STAGE_BY_ID[r.surfacesAt].title}</div>
            <div className="mt-0.5">{r.symptom}</div>
            <div className="grid gap-2 mt-3">
              <div className="rounded-xl px-3 py-2 text-[15px]" style={{ background: 'var(--surface-2)' }}><b>Cost:</b> {r.cost}</div>
              <div className="rounded-xl px-3 py-2 text-[15px]" style={{ background: 'var(--err-soft)' }}><b>Patient:</b> {r.patient}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function WhyBody({ m, done }) {
  const { state } = useApp();
  const impact = careerImpact(m);
  const pts = skillPoints(state);
  const after = { ...pts };
  if (!done) for (const [k, v] of Object.entries(m.skills || {})) after[k] = (after[k] || 0) + v;
  return (
    <>
      <div className="rounded-2xl p-4" style={{ background: 'var(--err-soft)' }}>
        <div className="flex items-center gap-2 eyebrow" style={{ color: 'var(--err)' }}><Icon n="heart" size={15} />Patient impact</div>
        <p className="mt-1.5">{m.why.patient}</p>
      </div>
      <div className="rounded-2xl p-4 mt-3" style={{ background: 'var(--pine-soft)' }}>
        <div className="flex items-center gap-2 eyebrow" style={{ color: 'var(--pine)' }}><Icon n="trend" size={15} />Career impact</div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {Object.entries(m.skills || {}).map(([k, v]) => <span key={k} className="text-[13px] font-bold rounded-full px-2.5 py-1" style={{ background: 'var(--surface)' }}>+{v} {skillLabel(k)}</span>)}
        </div>
        <ul className="mt-3 flex flex-col gap-1.5">
          {impact.map(x => {
            const before = Math.round(roleProgress(x.role, pts) * 100), aft = Math.round(roleProgress(x.role, after) * 100);
            return <li key={x.role.id} className="text-[15px] flex justify-between gap-3"><span className="min-w-0">{x.role.title}</span><b className="tnum flex-none">{done ? `${before}%` : `${before}% → ${aft}%`}</b></li>;
          })}
        </ul>
      </div>
    </>
  );
}

/* ---------- card bodies with their own finish condition ---------- */
function QuizCard({ card, questions, seedBase, xpEach, onFinish }) {
  const { state, actions } = useApp();
  const a = state.answers[card.id] || {};
  const answered = Object.keys(a).length;
  return (
    <>
      <div className="flex flex-col gap-5">
        {questions.map((q, i) => (
          <MCQ key={i} q={q} seed={seedBase + i} chosen={a[i]} xp={xpEach}
            onPick={oi => { if (a[i] !== undefined) return; actions.answer(card.id, { [i]: oi }); if (oi === q.a) actions.xp('health', xpEach); }} />
        ))}
      </div>
      <Finish ready={answered >= questions.length} onClick={onFinish} hint="Answer all questions to finish." />
    </>
  );
}

function ScenarioCard({ m, card, onFinish }) {
  const { state, actions } = useApp();
  const shown = !!(state.answers[card.id] || {}).shown;
  const s = m.scenario;
  return (
    <>
      <div className="eyebrow" style={{ color: 'var(--amber)' }}>Typical errors</div>
      <div className="mt-2"><Bullets items={s.errors} color="var(--amber)" /></div>
      <div className="rounded-2xl p-4 mt-4" style={{ background: 'var(--surface-2)' }}>
        <div className="eyebrow" style={{ color: 'var(--amber)' }}>Scenario</div>
        <h3 className="text-lg font-extrabold mt-1">{s.title}</h3>
        <p className="mt-2">{s.situation}</p>
        <p className="mt-3 font-bold">{s.question}</p>
        {!shown ? (
          <div className="mt-3"><Btn kind="ghost" onClick={() => actions.answer(card.id, { shown: true })}><Icon n="eye" size={18} />Think first, then show the solution</Btn></div>
        ) : (
          <ol className="pop mt-3 flex flex-col gap-2 list-none p-0">
            {s.steps.map((x, i) => <li key={i} className="flex gap-3 rounded-xl px-3 py-2.5" style={{ background: 'var(--surface)' }}><span className="font-bold tnum flex-none" style={{ color: 'var(--amber)' }}>{i + 1}</span><span>{x}</span></li>)}
          </ol>
        )}
      </div>
      <Finish ready={shown} onClick={onFinish} hint="Reveal the solution path first." />
    </>
  );
}

function FollowUpCard({ m, card, onFinish }) {
  const { actions } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="rounded-2xl p-4 border-2 border-dashed" style={{ borderColor: 'var(--pine)' }}>
        <div className="eyebrow" style={{ color: 'var(--pine)' }}>From: {m.title}</div>
        <p className="font-bold mt-1.5">{m.followUp.q}</p>
        {open && <p className="pop mt-2" style={{ color: 'var(--muted)' }}>{m.followUp.a}</p>}
      </div>
      {!open ? (
        <div className="mt-4"><Btn kind="ghost" className="w-full" onClick={() => setOpen(true)}><Icon n="eye" size={18} />Answer in your head, then reveal</Btn></div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Btn kind="ghost" onClick={onFinish}>Not quite</Btn>
          <Btn kind="ok" onClick={() => { actions.xp('health', XP.followUp); onFinish(); }}><Icon n="check" size={18} />I knew it · +{XP.followUp}</Btn>
        </div>
      )}
    </>
  );
}

export function RadarItemBody({ item }) {
  const STATUS = { 'in-force': 'In force', planned: 'Planned', expected: 'Expected', ongoing: 'Ongoing' };
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className="rounded-full px-2.5 py-1" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>{STATUS[item.status]}</span>
        <span style={{ color: 'var(--muted)' }}>{item.area} · {item.status === 'ongoing' ? 'since 2020 / ongoing' : new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
      <h3 className="text-lg font-extrabold leading-snug mt-2">{item.title}</h3>
      <p className="mt-2">{item.summary}</p>
      <div className="text-xs font-bold mt-4" style={{ color: 'var(--muted)' }}>What it means per case type</div>
      <div className="flex flex-col gap-2 mt-2">
        {Object.entries(item.impact).map(([ct, txt]) => (
          <div key={ct} className="rounded-xl px-3 py-2.5 border-l-4" style={{ background: 'var(--surface-2)', borderColor: CASE_COLOR[ct] }}>
            <CaseTag type={ct} small /><div className="text-[15px] mt-1">{txt}</div>
          </div>
        ))}
      </div>
      <div className="text-xs font-bold mt-4" style={{ color: 'var(--muted)' }}>Where it hits the journey</div>
      <div className="flex flex-col gap-1.5 mt-2">
        {Object.entries(item.stages).map(([st, txt]) => (
          <div key={st} className="text-[15px]"><b>{STAGE_BY_ID[st]?.title}:</b> {txt}</div>
        ))}
      </div>
      <Verify note={item.verify} sources={item.sources} />
    </>
  );
}

function RadarCard({ card, onFinish }) {
  const { state, actions } = useApp();
  const item = RADAR_BY_ID[card.itemId];
  const a = (state.answers[card.id] || {}).c;
  return (
    <>
      <RadarItemBody item={item} />
      <div className="mt-5"><MCQ q={item.check} seed={card.id} chosen={a} xp={XP.radarCorrect}
        onPick={oi => { if (a !== undefined) return; actions.answer(card.id, { c: oi }); if (oi === item.check.a) actions.xp('health', XP.radarCorrect); }} /></div>
      <Finish ready={a !== undefined} onClick={onFinish} hint="Answer the check question to finish." />
    </>
  );
}

function ReviewCard({ card, onFinish }) {
  const { state } = useApp();
  const qs = useMemo(() => {
    const done = MODULES.filter(m => state.modulesDone[m.id]);
    const pool = (done.length ? done : MODULES).flatMap(m => m.quiz.map(q => ({ ...q })));
    return shuffled(pool, card.id).slice(0, 3).map(i => pool[i]);
  }, [card.id]);
  return (
    <>
      <p className="mb-4" style={{ color: 'var(--muted)' }}>All available lessons are done – new stages come in the next phase. Until then: mixed review from your lessons.</p>
      <QuizCard card={card} questions={qs} seedBase={card.id} xpEach={5} onFinish={onFinish} />
    </>
  );
}

function BACard({ card, onFinish }) {
  const { state, actions } = useApp();
  const ba = STAGE_BA[card.stageId];
  const key = `ba:${card.stageId}`;
  const [text, setText] = useState(state.notes[key] || ba.template);
  const [show, setShow] = useState(false);
  const [paper, setPaper] = useState(false);
  const written = text.trim().length >= ba.template.length + 60;
  return (
    <>
      <div className="eyebrow" style={{ color: 'var(--pine)' }}>Stage finale · {STAGE_BY_ID[card.stageId].title}</div>
      <h3 className="text-lg font-extrabold mt-1">{ba.task}</h3>
      <div className="text-xs font-bold mt-4" style={{ color: 'var(--muted)' }}>Toolkit</div>
      <dl className="mt-2 flex flex-col gap-2">
        {ba.toolkit.map(t => <div key={t.label} className="border-l-4 pl-3" style={{ borderColor: 'var(--pine)' }}><dt className="font-bold">{t.label}</dt><dd className="m-0 text-[15px]" style={{ color: 'var(--muted)' }}>{t.detail}</dd></div>)}
      </dl>
      <ul className="mt-4 flex flex-col gap-1 text-[15px]" style={{ color: 'var(--muted)' }}>{ba.guidance.map(g => <li key={g}>• {g}</li>)}</ul>
      <label htmlFor="ba-text" className="block text-sm font-bold mt-4">Your answer</label>
      <textarea id="ba-text" value={text} onChange={e => setText(e.target.value)} onBlur={() => actions.note(key, text)} rows={9}
        className="mt-1.5 w-full rounded-xl border p-3 text-[15px] font-mono" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }} />
      <label className="flex items-center gap-2 text-sm mt-2"><input id="ba-paper" type="checkbox" checked={paper} onChange={e => setPaper(e.target.checked)} />I wrote it on paper</label>
      <div className="mt-3"><Btn kind="ghost" onClick={() => setShow(!show)}><Icon n="eye" size={18} />{show ? 'Hide model answer' : 'Compare with model answer'}</Btn></div>
      {show && (
        <div className="pop mt-3 flex flex-col gap-2">
          {ba.model.map((x, i) => <pre key={i} className="whitespace-pre-wrap rounded-xl p-3 text-[14px] m-0" style={{ background: 'var(--surface-2)', fontFamily: 'inherit' }}>{x}</pre>)}
          <div className="text-sm font-bold mt-1">Self-check</div>
          <ul className="text-[15px] flex flex-col gap-1">{ba.checklist.map(c => <li key={c}>☐ {c}</li>)}</ul>
        </div>
      )}
      <Finish ready={written || paper} label={`Finish stage · +${XP.baExercise} XP`} onClick={() => { actions.note(key, text); onFinish(); }} hint="Write your answer (or tick 'on paper') to finish." />
    </>
  );
}

export default function HealthCard({ card, onFinish }) {
  const m = card.moduleId ? MODULE_BY_ID[card.moduleId] : null;
  switch (card.kind) {
    case 'process': return <><ProcessBody m={m} /><Finish onClick={onFinish} /></>;
    case 'systems': return <><SystemsBody m={m} /><Finish onClick={onFinish} /></>;
    case 'interfaces': return <><ListBody color="var(--das)" block={m.interfaces} /><Finish onClick={onFinish} /></>;
    case 'tariffs': return <><ListBody color="var(--amber)" block={m.tariffs} /><Finish onClick={onFinish} /></>;
    case 'scenario': return <ScenarioCard m={m} card={card} onFinish={onFinish} />;
    case 'quiz': return <QuizCard card={card} questions={m.quiz} seedBase={card.id} xpEach={XP.quizCorrect} onFinish={onFinish} />;
    case 'kpi': return <><KpiBody m={m} /><Finish onClick={onFinish} /></>;
    case 'ripple': return <><RippleBody m={m} /><Finish onClick={onFinish} /></>;
    case 'why': return <><WhyBody m={m} /><Finish label="Finish lesson" onClick={onFinish} /></>;
    case 'ba': return <BACard card={card} onFinish={onFinish} />;
    case 'followup': return <FollowUpCard m={m} card={card} onFinish={onFinish} />;
    case 'radar': return <RadarCard card={card} onFinish={onFinish} />;
    case 'review': return <ReviewCard card={card} onFinish={onFinish} />;
    default: return <Finish onClick={onFinish} />;
  }
}
