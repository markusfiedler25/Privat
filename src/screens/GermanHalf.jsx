import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon, Btn, Word, SpeakBtn, MCQ, shuffled } from '../components/ui.jsx';
import { TopBar, FollowUp } from './HealthHalf.jsx';
import { LESSON_BY_ID, CARD_BY_ID, DRILLS } from '../content/index.js';
import { previousLesson, XP, learnedCount } from '../lib/game.js';

function Flashcards({ lesson }) {
  const { state, actions, today } = useApp();
  const newIds = lesson ? lesson.german.vocab.filter(id => CARD_BY_ID[id]) : [];
  // Build the session queue once: due reviews first (weakest first), then today's new words.
  const [queue, setQueue] = useState(() => {
    const due = Object.entries(state.srs)
      .filter(([id, c]) => c.due <= today && CARD_BY_ID[id] && !newIds.includes(id))
      .sort((a, b) => a[1].box - b[1].box).slice(0, 30).map(([id]) => id);
    const fresh = newIds.filter(id => !state.srs[id] || (state.srs[id].due <= today && state.srs[id].intro === today && !state.srs[id].reps));
    return [...due, ...fresh];
  });
  const [flipped, setFlipped] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  useEffect(() => { if (newIds.length) actions.introduce(newIds); }, []);

  const id = queue[0];
  const card = id ? CARD_BY_ID[id] : null;
  const isNew = id && newIds.includes(id) && !(state.srs[id] && state.srs[id].reps);
  const answer = g => {
    actions.grade(id, g);
    setFlipped(false); setDoneCount(n => n + 1);
    setQueue(q => g === 'again' ? [...q.slice(1), q[0]] : q.slice(1));
  };

  return (
    <section className="card p-4" aria-label="Vocabulary">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <div className="eyebrow" style={{ color: 'var(--sky)' }}>Step 1 · ~12 min</div>
          <h3 className="text-lg font-extrabold">Wortschatz (spaced repetition)</h3>
        </div>
        <span className="text-xs font-bold tnum" style={{ color: 'var(--muted)' }}>{queue.length} left · {learnedCount(state)} learned</span>
      </div>
      {card ? (
        <div className="mt-3">
          <div className="rounded-2xl border p-4 min-h-[170px] flex flex-col" style={{ borderColor: flipped ? 'var(--sky)' : 'var(--line)', background: flipped ? 'var(--sky-soft)' : 'var(--surface-2)' }}>
            <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--muted)' }}>
              <span>{isNew ? 'NEW' : 'REVIEW'}{card.ch ? ' · Swiss usage' : ''}</span>
              <SpeakBtn text={card.de} />
            </div>
            <div className="text-[26px] font-bold leading-tight mt-1"><Word de={card.de} /></div>
            {card.note && <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{card.note}</div>}
            {flipped && (
              <div className="pop mt-3">
                <div className="text-lg font-bold">{card.en}</div>
                <div className="mt-2 flex items-start gap-1"><span className="flex-1">„{card.ex}“</span><SpeakBtn text={card.ex} size={16} /></div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>{card.exEn}</div>
              </div>
            )}
          </div>
          {!flipped ? (
            <div className="mt-3"><Btn kind="sky" className="w-full" onClick={() => setFlipped(true)}>Show meaning</Btn></div>
          ) : (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <Btn kind="ghost" onClick={() => answer('again')}>Again</Btn>
              <Btn kind="sky" onClick={() => answer('good')}>Good</Btn>
              <Btn kind="ok" onClick={() => answer('easy')}>Easy</Btn>
            </div>
          )}
          <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Say the word out loud before you flip. “Again” brings it back later today and tomorrow.</p>
        </div>
      ) : (
        <p className="mt-3 rounded-xl px-3 py-3" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}>
          {doneCount ? `${doneCount} cards done. Wortschatz für heute erledigt!` : 'No cards due right now. Perfekt!'}
        </p>
      )}
    </section>
  );
}

function Grammar({ drill }) {
  const { day, actions } = useApp();
  if (!drill) return null;
  const right = drill.items.filter((q, i) => day.grammar[i] === q.a).length;
  const answered = Object.keys(day.grammar).length;
  return (
    <section className="card p-4" aria-label="Grammar drill">
      <div className="eyebrow" style={{ color: 'var(--sky)' }}>Step 2 · ~8 min · {drill.level}</div>
      <h3 className="text-lg font-extrabold">Grammatik: {drill.title}</h3>
      <p className="mt-2 rounded-xl px-3 py-2.5 text-[15px]" style={{ background: 'var(--surface-2)' }}>{drill.rule}</p>
      <div className="flex flex-col gap-5 mt-4">
        {drill.items.map((q, i) => (
          <MCQ key={i} seed={drill.id + i} q={q} chosen={day.grammar[i]} correctLabel="Richtig" xp={XP.grammarCorrect}
            onPick={oi => actions.grammar(i, oi, oi === q.a)} />
        ))}
      </div>
      {answered === drill.items.length && <p className="pop mt-3 font-bold" style={{ color: 'var(--ok)' }}>{right}/{drill.items.length} richtig</p>}
    </section>
  );
}

function GapFill({ ex, lessonId }) {
  const { day, actions } = useApp();
  const done = day.exercise && day.exercise.done;
  const [picks, setPicks] = useState(() => (done && day.exercise.picks) || {});
  const parts = ex.text.split(/(\{\d+\})/);
  const correct = ex.gaps.filter((g, i) => Number(picks[i]) === g.a).length;
  return (
    <div>
      <div className="mt-3 leading-[2.4] text-[17px]">
        {parts.map((p, k) => {
          const m = /^\{(\d+)\}$/.exec(p);
          if (!m) return <span key={k}>{p}</span>;
          const i = Number(m[1]); const g = ex.gaps[i];
          const order = shuffled(g.o, lessonId + 'g' + i);
          const ok = done && Number(picks[i]) === g.a;
          return (
            <select key={k} id={`gap-${i}`} aria-label={`Gap ${i + 1}`} disabled={done} value={picks[i] ?? ''} onChange={e => setPicks({ ...picks, [i]: e.target.value })}
              className="mx-1 rounded-lg border px-2 py-1 text-[16px] font-bold"
              style={{ borderColor: done ? (ok ? 'var(--ok)' : 'var(--err)') : 'var(--sky)', background: done ? (ok ? 'var(--ok-soft)' : 'var(--err-soft)') : 'var(--surface)', color: 'var(--ink)' }}>
              <option value="" disabled>…</option>
              {order.map(oi => <option key={oi} value={oi}>{g.o[oi]}</option>)}
            </select>
          );
        })}
      </div>
      {!done ? (
        <div className="mt-3"><Btn kind="sky" disabled={Object.keys(picks).length < ex.gaps.length} onClick={() => actions.exercise({ type: 'gapfill', picks, correct })}>Check · +{XP.gapCorrect} XP per gap</Btn></div>
      ) : (
        <div className="pop mt-3">
          <p className="font-bold" style={{ color: 'var(--ok)' }}>{day.exercise.correct}/{ex.gaps.length} richtig</p>
          {ex.gaps.some((g, i) => Number(picks[i]) !== g.a) && <p className="text-sm mt-1">Correct: {ex.gaps.map(g => g.o[g.a]).join(' · ')}</p>}
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{ex.translation}</p>
        </div>
      )}
    </div>
  );
}

function WriteTask({ ex }) {
  const { day, actions } = useApp();
  const done = day.exercise && day.exercise.done;
  const [text, setText] = useState(() => (day.exercise && day.exercise.text) || '');
  const [show, setShow] = useState(done);
  return (
    <div>
      <ul className="mt-2 text-[15px] flex flex-col gap-1" style={{ color: 'var(--muted)' }}>{ex.hints.map(h => <li key={h}>→ {h}</li>)}</ul>
      <label htmlFor="write-de" className="block text-sm font-bold mt-3">Dein Text</label>
      <textarea id="write-de" rows={5} value={text} onChange={e => setText(e.target.value)} disabled={done} lang="de"
        className="mt-1.5 w-full rounded-xl border p-3 text-[16px]" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }} placeholder="Schreib hier …" />
      {!show ? (
        <div className="mt-2"><Btn kind="sky" disabled={text.trim().length < 20} onClick={() => setShow(true)}>Compare with model</Btn></div>
      ) : (
        <div className="pop mt-3">
          <div className="text-sm font-bold">Model answer</div>
          <div className="mt-1 rounded-xl p-3 flex gap-2" style={{ background: 'var(--sky-soft)' }}><span className="flex-1">{ex.model}</span><SpeakBtn text={ex.model} /></div>
          <div className="text-sm font-bold mt-3">Self-check</div>
          <ul className="text-[15px] flex flex-col gap-1 mt-1">{ex.checklist.map(c => <li key={c}>☐ {c}</li>)}</ul>
          {!done && <div className="mt-3"><Btn kind="ok" onClick={() => actions.exercise({ type: 'write', text })}><Icon n="check" size={18} />Done · +{XP.writeDone} XP</Btn></div>}
        </div>
      )}
    </div>
  );
}

export default function GermanHalf() {
  const { day, state, actions, setView, today } = useApp();
  const lesson = day.lessonId ? LESSON_BY_ID[day.lessonId] : null;
  const prev = previousLesson(state, today);
  const back = () => { setView('home'); window.scrollTo(0, 0); };
  const drill = lesson ? DRILLS[lesson.german.grammar] : null;
  const ex = lesson ? lesson.german.exercise : null;
  const follow = useMemo(() => {
    if (!prev) return null;
    const c = CARD_BY_ID[prev.german.vocab[prev.german.vocab.length - 1]];
    return c ? { q: `Übersetze im Kopf: „${c.ex}“`, a: `${c.exEn}  (Wort: ${c.de} = ${c.en})` } : null;
  }, [prev && prev.id]);

  return (
    <div>
      <TopBar title="Deutsch" half="german" onBack={back} />
      <div className="gutter flex flex-col gap-4 pt-2" style={{ paddingBottom: 'calc(110px + env(safe-area-inset-bottom, 0px))' }}>
        {follow && <FollowUp item={follow} done={day.followUp.german} onDone={() => actions.followUp('german')} color="var(--sky)" label="Follow-up von gestern" />}
        <header>
          <div className="eyebrow" style={{ color: 'var(--sky)' }}>Thema heute{lesson ? ` · ${lesson.stageTitle}` : ''}</div>
          <h1 className="text-[26px] font-extrabold leading-tight mt-1">{lesson ? lesson.title : 'Wiederholung'}</h1>
          <p className="mt-1" style={{ color: 'var(--muted)' }}>Same topic as your healthcare lesson, so both halves reinforce each other.</p>
        </header>

        <Flashcards lesson={lesson} />
        <Grammar drill={drill} />

        {ex && (
          <section className="card p-4" aria-label="Exercise">
            <div className="eyebrow" style={{ color: 'var(--sky)' }}>Step 3 · ~10 min · Praxis</div>
            <h3 className="text-lg font-extrabold">{ex.title}</h3>
            <p className="text-[15px] mt-1" style={{ color: 'var(--muted)' }}>{ex.instruction}</p>
            {ex.type === 'gapfill' ? <GapFill ex={ex} lessonId={lesson.id} /> : <WriteTask ex={ex} />}
          </section>
        )}

        <section className="card p-4 text-center">
          {day.german ? (
            <>
              <div className="font-extrabold text-lg" style={{ color: 'var(--ok)' }}>Deutsch erledigt ✓</div>
              <div className="flex justify-center gap-2 mt-3 flex-wrap">
                {!day.health && <Btn onClick={() => { setView('health'); window.scrollTo(0, 0); }}>Continue with Healthcare IT</Btn>}
                <Btn kind="ghost" onClick={() => actions.markHalf('german', false)}>Undo</Btn>
              </div>
            </>
          ) : (
            <Btn kind="sky" onClick={() => actions.markHalf('german', true)}><Icon n="check" size={18} />Mark Deutsch half done · +{XP.half} XP</Btn>
          )}
        </section>
      </div>
    </div>
  );
}
