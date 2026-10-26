import React, { useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon, Btn, Verify, MCQ } from '../components/ui.jsx';
import { MiniTimer } from '../components/Timer.jsx';
import { LESSON_BY_ID } from '../content/index.js';
import { previousLesson, XP } from '../lib/game.js';

const KIND = {
  process: { label: 'Process & people', color: 'var(--pine)', icon: 'route' },
  sap: { label: 'SAP IS-H', color: 'var(--sky)', icon: 'map' },
  epic: { label: 'Epic', color: 'var(--die)', icon: 'next' },
  interfaces: { label: 'Interfaces & standards', color: 'var(--das)', icon: 'link' },
  tariffs: { label: 'Tariffs & regulation', color: 'var(--amber)', icon: 'flag' },
  ba: { label: 'Business analyst view', color: 'var(--ink)', icon: 'career' }
};

export function TopBar({ title, half, onBack }) {
  return (
    <div className="topbar gutter">
      <div className="flex items-center gap-2 py-2.5">
        <button type="button" onClick={onBack} className="p-2 -ml-2 rounded-full" aria-label="Back to today"><Icon n="back" size={22} /></button>
        <div className="font-bold flex-1 truncate">{title}</div>
        <MiniTimer half={half} />
      </div>
    </div>
  );
}

export function FollowUp({ item, done, onDone, color, label }) {
  const [open, setOpen] = useState(done);
  if (!item) return null;
  return (
    <section className="rounded-2xl p-4 border-2 border-dashed" style={{ borderColor: color }} aria-label="Follow-up from yesterday">
      <div className="eyebrow" style={{ color }}>{label}</div>
      <p className="font-bold mt-1.5">{item.q}</p>
      {!open ? (
        <div className="mt-3"><Btn kind="ghost" onClick={() => setOpen(true)}><Icon n="eye" size={18} />Think first, then show answer</Btn></div>
      ) : (
        <div className="pop">
          <p className="mt-2" style={{ color: 'var(--muted)' }}>{item.a}</p>
          <div className="mt-3">{done ? <span className="text-sm font-bold" style={{ color: 'var(--ok)' }}>Recalled ✓</span> : <Btn kind="ok" onClick={onDone}><Icon n="check" size={18} />I remembered it · +{XP.followUp} XP</Btn>}</div>
        </div>
      )}
    </section>
  );
}

function Section({ s }) {
  const k = KIND[s.kind] || KIND.process;
  return (
    <section className="card p-4">
      <div className="flex items-center gap-2 eyebrow" style={{ color: k.color }}><Icon n={k.icon} size={15} />{k.label}</div>
      <h3 className="text-lg font-extrabold mt-1">{s.title}</h3>
      {s.paragraphs && s.paragraphs.map((p, i) => <p key={i} className="mt-2">{p}</p>)}
      {s.actors && (
        <ul className="mt-3 flex flex-col gap-2">
          {s.actors.map(a => (
            <li key={a.who} className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-2)' }}>
              <div className="font-bold">{a.who}</div><div className="text-[15px]" style={{ color: 'var(--muted)' }}>{a.role}</div>
            </li>
          ))}
        </ul>
      )}
      {s.items && (
        <dl className="mt-3 flex flex-col gap-2.5">
          {s.items.map(it => (
            <div key={it.label} className="border-l-4 pl-3" style={{ borderColor: k.color }}>
              <dt className="font-bold">{it.label}</dt><dd className="m-0 text-[15px]" style={{ color: 'var(--muted)' }}>{it.detail}</dd>
            </div>
          ))}
        </dl>
      )}
      {s.bullets && (
        <ul className="mt-3 flex flex-col gap-2">
          {s.bullets.map((b, i) => <li key={i} className="flex gap-2.5"><span className="mt-2.5 w-1.5 h-1.5 rounded-full flex-none" style={{ background: k.color }} /><span>{b}</span></li>)}
        </ul>
      )}
      {s.kpis && (
        <div className="mt-3">
          <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>KPIs</div>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {s.kpis.map(kp => (
              <div key={kp.name} className="rounded-xl px-3 py-2 text-[15px]" style={{ background: 'var(--surface-2)' }}>
                <b>{kp.name}</b><div className="font-mono text-[13px] mt-0.5" style={{ color: 'var(--muted)' }}>{kp.formula}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <Verify v={s.verify} />
    </section>
  );
}

function BAExercise({ lesson }) {
  const { state, actions, day } = useApp();
  const ex = lesson.baExercise;
  const [text, setText] = useState(state.notes[lesson.id] || ex.template);
  const [show, setShow] = useState(false);
  return (
    <section className="card p-4" style={{ borderColor: 'var(--pine)' }}>
      <div className="eyebrow" style={{ color: 'var(--pine)' }}>BA exercise · stage finale</div>
      <h3 className="text-lg font-extrabold mt-1">{ex.task}</h3>
      <ul className="mt-2 flex flex-col gap-1 text-[15px]" style={{ color: 'var(--muted)' }}>{ex.guidance.map(g => <li key={g}>• {g}</li>)}</ul>
      <label htmlFor="ba-text" className="block text-sm font-bold mt-3">Your user stories</label>
      <textarea id="ba-text" value={text} onChange={e => setText(e.target.value)} rows={10}
        className="mt-1.5 w-full rounded-xl border p-3 text-[15px] font-mono" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }} />
      <div className="flex flex-wrap gap-2 mt-2">
        <Btn onClick={() => actions.saveBA(lesson.id, text, text.trim().length > ex.template.length + 40)}>{day.baDone ? 'Saved ✓' : `Save · +${XP.baExercise} XP`}</Btn>
        <Btn kind="ghost" onClick={() => setShow(!show)}><Icon n="eye" size={18} />{show ? 'Hide model answer' : 'Compare with model answer'}</Btn>
      </div>
      {show && (
        <div className="pop mt-3 flex flex-col gap-2">
          {ex.model.map((m, i) => <pre key={i} className="whitespace-pre-wrap rounded-xl p-3 text-[14px] m-0" style={{ background: 'var(--surface-2)', fontFamily: 'inherit' }}>{m}</pre>)}
          <div className="text-sm font-bold mt-1">Self-check</div>
          <ul className="text-[15px] flex flex-col gap-1">{ex.checklist.map(c => <li key={c}>☐ {c}</li>)}</ul>
        </div>
      )}
    </section>
  );
}

export default function HealthHalf() {
  const { day, state, actions, setView, today } = useApp();
  const lesson = day.lessonId ? LESSON_BY_ID[day.lessonId] : null;
  const prev = previousLesson(state, today);
  const [showSteps, setShowSteps] = useState(day.scenario);
  const back = () => { setView('home'); window.scrollTo(0, 0); };

  if (!lesson) {
    return (
      <div>
        <TopBar title="Healthcare IT" half="health" onBack={back} />
        <div className="gutter py-6"><div className="card p-5"><h2 className="text-xl font-extrabold">All available lessons done</h2><p className="mt-2">The next stages are on the roadmap. Use today's 30 minutes for a review in the Journey tab, the System map, or the Swiss market cards, then mark the half done.</p><div className="mt-4"><Btn onClick={() => actions.markHalf('health', !day.health)}>{day.health ? 'Done ✓' : 'Mark half done'}</Btn></div></div></div>
      </div>
    );
  }
  const answered = Object.keys(day.quiz).length;

  return (
    <div>
      <TopBar title={lesson.stageTitle} half="health" onBack={back} />
      <div className="gutter flex flex-col gap-4 pt-2" style={{ paddingBottom: 'calc(110px + env(safe-area-inset-bottom, 0px))' }}>
        {prev && <FollowUp item={prev.followUp} done={day.followUp.health} onDone={() => actions.followUp('health')} color="var(--pine)" label={`Follow-up from yesterday · ${prev.title}`} />}

        <header>
          <div className="eyebrow" style={{ color: 'var(--pine)' }}>{lesson.stageTitle} · lesson {lesson.indexInStage + 1} of {lesson.stageCount}</div>
          <h1 className="text-[26px] font-extrabold leading-tight mt-1">{lesson.title}</h1>
          <p className="mt-2" style={{ color: 'var(--muted)' }}>{lesson.intro}</p>
        </header>

        {lesson.sections.map((s, i) => <Section key={i} s={s} />)}

        {lesson.market && (
          <section className="rounded-2xl p-4" style={{ background: 'var(--sky-soft)' }}>
            <div className="eyebrow" style={{ color: 'var(--sky)' }}>Swiss market</div>
            <h3 className="font-extrabold text-lg mt-1">{lesson.market.title}</h3>
            <p className="mt-1.5">{lesson.market.body}</p>
          </section>
        )}

        {lesson.scenario && (
          <section className="card p-4">
            <div className="eyebrow" style={{ color: 'var(--amber)' }}>Practical scenario</div>
            <h3 className="text-lg font-extrabold mt-1">{lesson.scenario.title}</h3>
            <p className="mt-2">{lesson.scenario.situation}</p>
            <p className="mt-3 font-bold">{lesson.scenario.question}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Answer in your head or on paper first.</p>
            {!showSteps ? (
              <div className="mt-3"><Btn kind="ghost" onClick={() => { setShowSteps(true); actions.scenario(); }}><Icon n="eye" size={18} />Show solution path · +{XP.scenario} XP</Btn></div>
            ) : (
              <ol className="pop mt-3 flex flex-col gap-2 list-none p-0">
                {lesson.scenario.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-2)' }}>
                    <span className="font-bold tnum flex-none" style={{ color: 'var(--amber)' }}>{i + 1}</span><span>{s}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {lesson.baExercise && <BAExercise lesson={lesson} />}

        <section className="card p-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-extrabold">Quick quiz</h3>
            <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{answered}/{lesson.quiz.length} · +{XP.quizCorrect} XP each</span>
          </div>
          <div className="flex flex-col gap-5 mt-3">
            {lesson.quiz.map((q, i) => <MCQ key={i} q={q} seed={lesson.id + i} chosen={day.quiz[i]} onPick={oi => actions.quiz(i, oi)} xp={XP.quizCorrect} />)}
          </div>
        </section>

        <section className="card p-4 text-center">
          {day.health ? (
            <>
              <div className="font-extrabold text-lg" style={{ color: 'var(--ok)' }}>Healthcare half done ✓</div>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Tomorrow starts with a follow-up on this lesson.</p>
              <div className="flex justify-center gap-2 mt-3 flex-wrap">
                {!day.german && <Btn kind="sky" onClick={() => { setView('german'); window.scrollTo(0, 0); }}>Continue with Deutsch</Btn>}
                <Btn kind="ghost" onClick={() => actions.markHalf('health', false)}>Undo</Btn>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Read the lesson, solve the scenario and take the quiz. Then:</p>
              <div className="mt-3"><Btn onClick={() => { actions.markHalf('health', true); window.scrollTo(0, document.body.scrollHeight); }}><Icon n="check" size={18} />Mark Healthcare half done · +{XP.half} XP</Btn></div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
