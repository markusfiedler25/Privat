import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon, Btn, Word, SpeakBtn, MCQ, shuffled, canSpeak, speak } from './ui.jsx';
import { Finish } from './HealthCards.jsx';
import { MODULE_BY_ID, CARD_BY_ID, CARDS, DRILLS, UT_TYPES } from '../content/index.js';
import { XP } from '../lib/game.js';
import { dueIds, learnedCount } from '../lib/srs.js';
import { practiceSentences, pickSet } from '../lib/curriculum.js';

const field = { borderColor: 'var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' };

/* ---------- flashcards (new words and reviews) ---------- */
function Flashcards({ ids, review, onEmpty }) {
  const { actions, state } = useApp();
  const [queue, setQueue] = useState(ids);
  const [flipped, setFlipped] = useState(false);
  const [count, setCount] = useState(0);
  useEffect(() => { if (!queue.length) onEmpty(count); }, [queue.length]);
  const id = queue[0];
  const card = id ? CARD_BY_ID[id] : null;
  if (!card) return <p className="rounded-xl px-3 py-3" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}>{count ? `${count} cards done. Sehr gut!` : 'Nothing due right now. Perfekt!'}</p>;
  const answer = g => {
    actions.grade(id, g, review);
    setFlipped(false); setCount(n => n + 1);
    setQueue(q => (g === 'again' && q.length > 1 ? [...q.slice(1), q[0]] : q.slice(1)));
  };
  const isNew = !(state.srs[id] && state.srs[id].reps);
  return (
    <div>
      <div className="flex justify-between text-xs font-bold" style={{ color: 'var(--muted)' }}><span>{isNew ? 'NEW' : 'REVIEW'}{card.ch ? ' · Swiss usage' : ''}</span><span className="tnum">{queue.length} left</span></div>
      <div className="rounded-2xl border p-4 mt-2 min-h-[170px] flex flex-col" style={{ borderColor: flipped ? 'var(--sky)' : 'var(--line)', background: flipped ? 'var(--sky-soft)' : 'var(--surface-2)' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="text-[26px] font-bold leading-tight" lang="de"><Word de={card.de} /></div>
          <SpeakBtn text={card.de} />
        </div>
        {card.note && <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{card.note}</div>}
        {flipped && (
          <div className="pop mt-3">
            <div className="text-lg font-bold">{card.en}</div>
            <div className="mt-2 flex items-start gap-1" lang="de"><span className="flex-1">„{card.ex}“</span><SpeakBtn text={card.ex} size={16} /></div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>{card.exEn}</div>
          </div>
        )}
      </div>
      {!flipped ? (
        <div className="mt-3"><Btn kind="sky" className="w-full" onClick={() => setFlipped(true)}>Say it aloud, then show the meaning</Btn></div>
      ) : (
        <div className="grid grid-cols-3 gap-2 mt-3">
          <Btn kind="ghost" onClick={() => answer('again')}>Again</Btn>
          <Btn kind="sky" onClick={() => answer('good')}>Good</Btn>
          <Btn kind="ok" onClick={() => answer('easy')}>Easy</Btn>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ onFinish, today }) {
  const { state } = useApp();
  const [ids] = useState(() => dueIds(state, today).slice(0, 40));
  const [empty, setEmpty] = useState(!ids.length);
  return (
    <>
      <p className="mb-3 text-[15px]" style={{ color: 'var(--muted)' }}>{ids.length} words are due. {learnedCount(state)} learned so far. Each review +{XP.review} XP.</p>
      <Flashcards ids={ids} review onEmpty={() => setEmpty(true)} />
      <Finish ready={empty} onClick={onFinish} hint="Go through all due cards to finish." />
    </>
  );
}

function NewWordsCard({ card, onFinish }) {
  const { state, actions } = useApp();
  const [ids] = useState(() => card.ids.filter(id => !(state.srs[id] && state.srs[id].reps)));
  const [empty, setEmpty] = useState(!ids.length);
  useEffect(() => { actions.introduce(card.ids); }, []);
  const m = MODULE_BY_ID[card.moduleId];
  return (
    <>
      <p className="mb-3 text-[15px]" style={{ color: 'var(--muted)' }}>Words from today's topic{m ? ` “${m.title.split(':')[0]}”` : ''}. Colours show the article: <b className="art-der">der</b>, <b className="art-die">die</b>, <b className="art-das">das</b>.</p>
      <Flashcards ids={ids} onEmpty={() => setEmpty(true)} />
      <Finish ready={empty} onClick={onFinish} hint="Go through all new words to finish." />
    </>
  );
}

function GrammarCard({ card, onFinish }) {
  const { state, actions } = useApp();
  const d = DRILLS[card.drillId];
  const a = state.answers[card.id] || {};
  const right = d.items.filter((q, i) => a[i] === q.a).length;
  const all = Object.keys(a).length >= d.items.length;
  return (
    <>
      <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--muted)' }}><span className="rounded-full px-2 py-0.5" style={{ background: 'var(--sky-soft)', color: 'var(--sky)' }}>Level {d.sub}</span></div>
      <p className="mt-2 rounded-xl px-3 py-2.5 text-[15px]" style={{ background: 'var(--surface-2)' }}>{d.rule}</p>
      <div className="flex flex-col gap-5 mt-4">
        {d.items.map((q, i) => (
          <MCQ key={i} q={q} seed={card.id + i} chosen={a[i]} correctLabel="Richtig" xp={XP.grammarCorrect} lang="de"
            onPick={oi => { if (a[i] !== undefined) return; actions.answer(card.id, { [i]: oi }); if (oi === q.a) actions.xp('german', XP.grammarCorrect); }} />
        ))}
      </div>
      {all && <p className="pop mt-3 font-bold" style={{ color: 'var(--ok)' }}>{right}/{d.items.length} richtig</p>}
      <Finish ready={all} onClick={() => onFinish({ score: right / d.items.length })} hint="Answer all items to finish." />
    </>
  );
}

function GapFill({ card, ex, onFinish }) {
  const { state, actions } = useApp();
  const saved = state.answers[card.id] || {};
  const done = !!saved.checked;
  const [picks, setPicks] = useState(saved.picks || {});
  const parts = ex.text.split(/(\{\d+\})/);
  const correct = ex.gaps.filter((g, i) => Number(picks[i]) === g.a).length;
  return (
    <>
      <div className="leading-[2.5] text-[17px]" lang="de">
        {parts.map((p, k) => {
          const mm = /^\{(\d+)\}$/.exec(p);
          if (!mm) return <span key={k}>{p}</span>;
          const i = Number(mm[1]); const g = ex.gaps[i];
          const order = shuffled(g.o, card.id + 'g' + i);
          const ok = done && Number(picks[i]) === g.a;
          return (
            <select key={k} id={`gap-${card.id}-${i}`} aria-label={`Gap ${i + 1}`} disabled={done} value={picks[i] ?? ''} onChange={e => setPicks({ ...picks, [i]: e.target.value })}
              className="mx-1 rounded-lg border px-2 py-1 text-[16px] font-bold"
              style={{ borderColor: done ? (ok ? 'var(--ok)' : 'var(--err)') : 'var(--sky)', background: done ? (ok ? 'var(--ok-soft)' : 'var(--err-soft)') : 'var(--surface)', color: 'var(--ink)' }}>
              <option value="" disabled>…</option>
              {order.map(oi => <option key={oi} value={oi}>{g.o[oi]}</option>)}
            </select>
          );
        })}
      </div>
      {!done ? (
        <div className="mt-3"><Btn kind="sky" disabled={Object.keys(picks).length < ex.gaps.length} onClick={() => { actions.answer(card.id, { picks, checked: true, correct }); actions.xp('german', correct * XP.gapCorrect); }}>Check · +{XP.gapCorrect} XP per gap</Btn></div>
      ) : (
        <div className="pop mt-3">
          <p className="font-bold" style={{ color: 'var(--ok)' }}>{saved.correct}/{ex.gaps.length} richtig</p>
          {ex.gaps.some((g, i) => Number(picks[i]) !== g.a) && <p className="text-sm mt-1">Correct: {ex.gaps.map(g => g.o[g.a]).join(' · ')}</p>}
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{ex.translation}</p>
        </div>
      )}
      <Finish ready={done} onClick={onFinish} hint="Fill all gaps and check." />
    </>
  );
}

function WriteTask({ card, ex, onFinish }) {
  const { state, actions } = useApp();
  const saved = state.answers[card.id] || {};
  const [text, setText] = useState(saved.text || '');
  const [show, setShow] = useState(!!saved.shown);
  return (
    <>
      <ul className="text-[15px] flex flex-col gap-1" style={{ color: 'var(--muted)' }}>{ex.hints.map(h => <li key={h} lang="de">→ {h}</li>)}</ul>
      <label htmlFor={`w-${card.id}`} className="block text-sm font-bold mt-3">Dein Text</label>
      <textarea id={`w-${card.id}`} rows={5} lang="de" value={text} onChange={e => setText(e.target.value)} onBlur={() => actions.answer(card.id, { text })}
        className="mt-1.5 w-full rounded-xl border p-3 text-[16px]" style={field} placeholder="Schreib hier …" />
      {!show ? (
        <div className="mt-2"><Btn kind="sky" disabled={text.trim().length < 20} onClick={() => { setShow(true); actions.answer(card.id, { text, shown: true }); }}>Compare with the model</Btn></div>
      ) : (
        <div className="pop mt-3">
          <div className="text-sm font-bold">Model answer</div>
          <div className="mt-1 rounded-xl p-3 flex gap-2" style={{ background: 'var(--sky-soft)' }} lang="de"><span className="flex-1 whitespace-pre-line">{ex.model}</span><SpeakBtn text={ex.model} /></div>
          <div className="text-sm font-bold mt-3">Self-check</div>
          <ul className="text-[15px] flex flex-col gap-1 mt-1">{ex.checklist.map(c => <li key={c}>☐ {c}</li>)}</ul>
        </div>
      )}
      <Finish ready={show} label={`Finish card · +${XP.writeDone} XP`} onClick={() => { actions.xp('german', XP.writeDone); onFinish(); }} hint="Write at least one sentence, then compare." />
    </>
  );
}

function ReadingCard({ card, onFinish }) {
  const { state, actions } = useApp();
  const r = MODULE_BY_ID[card.moduleId].german.reading;
  const a = state.answers[card.id] || {};
  const [en, setEn] = useState(false);
  const all = r.questions.every((_, i) => a[i] !== undefined);
  return (
    <>
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface-2)' }}>
        <div className="flex items-start justify-between gap-2"><h3 className="text-lg font-extrabold" lang="de">{r.title}</h3>{canSpeak && <SpeakBtn text={r.text} rate={0.85} />}</div>
        <p className="mt-2 text-[17px] leading-relaxed" lang="de">{r.text}</p>
        <button type="button" onClick={() => setEn(!en)} className="text-sm underline mt-2" style={{ color: 'var(--muted)' }}>{en ? 'Hide translation' : 'Show translation'}</button>
        {en && <p className="pop text-[15px] mt-2" style={{ color: 'var(--muted)' }}>{r.en}</p>}
      </div>
      <div className="flex flex-col gap-5 mt-4">
        {r.questions.map((q, i) => <MCQ key={i} q={q} seed={card.id + i} chosen={a[i]} correctLabel="Richtig" xp={XP.readingCorrect} lang="de"
          onPick={oi => { if (a[i] !== undefined) return; actions.answer(card.id, { [i]: oi }); if (oi === q.a) actions.xp('german', XP.readingCorrect); }} />)}
      </div>
      <Finish ready={all} onClick={onFinish} hint="Answer both questions to finish." />
    </>
  );
}

function Builder({ card, onFinish }) {
  const { state, actions } = useApp();
  const sentences = useMemo(() => pickSet(practiceSentences(state, card.moduleId), card.set || 0, 5), [card.id]);
  const a = state.answers[card.id] || {};
  const idx = sentences.findIndex((_, i) => a[i] === undefined);
  const [picked, setPicked] = useState([]);
  useEffect(() => setPicked([]), [idx]);
  if (!sentences.length) return <Finish onClick={onFinish} />;
  const allDone = idx === -1;
  const s = sentences[allDone ? sentences.length - 1 : idx];
  const tokens = s.de.split(' ');
  const order = shuffled(tokens, card.id + idx);
  const built = picked.map(i => tokens[i]).join(' ');
  const check = () => { const ok = built === s.de; actions.answer(card.id, { [idx]: ok }); if (ok) actions.xp('german', XP.builderCorrect); };
  return (
    <>
      <div className="flex justify-between text-xs font-bold" style={{ color: 'var(--muted)' }}><span>Build the German sentence</span><span className="tnum">{Math.min(sentences.length, Object.keys(a).length + (allDone ? 0 : 1))}/{sentences.length}</span></div>
      {!allDone ? (
        <div>
          <p className="mt-2 font-bold">{s.en}</p>
          <div className="min-h-[56px] rounded-xl border-2 border-dashed p-2 mt-3 flex flex-wrap gap-1.5" style={{ borderColor: 'var(--sky)' }} lang="de" aria-label="Your sentence">
            {picked.map((ti, k) => <button key={k} type="button" onClick={() => setPicked(picked.filter((_, j) => j !== k))} className="rounded-lg px-2.5 py-1.5 font-bold" style={{ background: 'var(--sky-soft)' }}>{tokens[ti]}</button>)}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3" lang="de" aria-label="Word tiles">
            {order.filter(i => !picked.includes(i)).map(i => <button key={i} type="button" onClick={() => setPicked([...picked, i])} className="rounded-lg border px-2.5 py-1.5 font-bold" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>{tokens[i]}</button>)}
          </div>
          <div className="mt-3"><Btn kind="sky" disabled={picked.length < tokens.length} onClick={check}>Check · +{XP.builderCorrect}</Btn></div>
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5 mt-4">
        {sentences.map((x, i) => a[i] !== undefined && (
          <div key={i} className="text-[15px] flex gap-2 items-start" lang="de"><Icon n={a[i] ? 'check' : 'close'} size={16} style={{ color: a[i] ? 'var(--ok)' : 'var(--err)', marginTop: 4, flex: 'none' }} /><span className="flex-1">{x.de}</span><SpeakBtn text={x.de} size={15} /></div>
        ))}
      </div>
      <Finish ready={allDone} onClick={onFinish} hint="Build all sentences to finish." />
    </>
  );
}

const norm = s => s.toLowerCase().replace(/ß/g, 'ss').replace(/[.,!?;:„“"'()–-]/g, ' ').replace(/\s+/g, ' ').trim();

function Dictation({ card, onFinish }) {
  const { state, actions } = useApp();
  const sentences = useMemo(() => pickSet(practiceSentences(state, card.moduleId), (card.set || 0) + 3, 4), [card.id]);
  const a = state.answers[card.id] || {};
  const idx = sentences.findIndex((_, i) => a[i] === undefined);
  const [typed, setTyped] = useState('');
  useEffect(() => setTyped(''), [idx]);
  if (!canSpeak) return <Builder card={card} onFinish={onFinish} />;
  const allDone = idx === -1;
  const s = sentences[idx] || sentences[0];
  const check = () => {
    const want = norm(s.de).split(' '), got = norm(typed).split(' ');
    const hit = want.filter((w, i) => got[i] === w).length;
    const score = hit / want.length;
    actions.answer(card.id, { [idx]: { typed, score } });
    if (score >= 0.9) actions.xp('german', XP.dictationCorrect);
  };
  return (
    <>
      <div className="flex justify-between text-xs font-bold" style={{ color: 'var(--muted)' }}><span>Listen and type what you hear</span><span className="tnum">{Object.keys(a).length}/{sentences.length}</span></div>
      {!allDone && (
        <div className="mt-3">
          <div className="flex gap-2">
            <Btn kind="sky" onClick={() => speak(s.de, 0.85)}><Icon n="speak" size={18} />Play</Btn>
            <Btn kind="ghost" onClick={() => speak(s.de, 0.65)}>Slower</Btn>
          </div>
          <label htmlFor={`d-${card.id}`} className="sr-only">Type the sentence</label>
          <input id={`d-${card.id}`} lang="de" autoComplete="off" autoCapitalize="sentences" value={typed} onChange={e => setTyped(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && typed.trim()) check(); }}
            className="mt-3 w-full rounded-xl border px-3 py-2.5 text-[16px]" style={field} placeholder="Tippe den Satz …" />
          <div className="mt-2"><Btn kind="sky" disabled={!typed.trim()} onClick={check}>Check · +{XP.dictationCorrect}</Btn></div>
        </div>
      )}
      <div className="flex flex-col gap-2 mt-4">
        {sentences.map((x, i) => a[i] !== undefined && (
          <div key={i} className="rounded-xl px-3 py-2 text-[15px]" style={{ background: a[i].score >= 0.9 ? 'var(--ok-soft)' : 'var(--surface-2)' }} lang="de">
            <div><b>{x.de}</b></div>
            {a[i].score < 0.9 && <div style={{ color: 'var(--muted)' }}>You: {a[i].typed}</div>}
          </div>
        ))}
      </div>
      <Finish ready={allDone} onClick={onFinish} hint="Type all sentences to finish." />
    </>
  );
}

function SpeedRound({ card, onFinish }) {
  const { state, actions } = useApp();
  const qs = useMemo(() => {
    let pool = Object.keys(state.srs).filter(id => CARD_BY_ID[id]);
    if (pool.length < 6) pool = CARDS.slice(0, 20).map(c => c.id);
    const pick = shuffled(pool, card.id).slice(0, 10).map(i => CARD_BY_ID[pool[i]]);
    return pick.map((c, k) => {
      const others = shuffled(CARDS, card.id + k).map(i => CARDS[i]).filter(x => x.id !== c.id && x.en !== c.en).slice(0, 3);
      return { q: c.de, o: [c.en, ...others.map(x => x.en)], a: 0 };
    });
  }, [card.id]);
  const a = state.answers[card.id] || {};
  const idx = qs.findIndex((_, i) => a[i] === undefined);
  const right = qs.filter((q, i) => a[i] === q.a).length;
  return (
    <>
      <div className="flex justify-between text-xs font-bold" style={{ color: 'var(--muted)' }}><span>What does it mean?</span><span className="tnum">{right} right · {Object.keys(a).length}/{qs.length}</span></div>
      {idx >= 0 ? (
        <div className="mt-3"><MCQ key={idx} q={qs[idx]} seed={card.id + 's' + idx} chosen={a[idx]} lang="de"
          onPick={oi => { actions.answer(card.id, { [idx]: oi }); if (oi === 0) actions.xp('german', XP.speedCorrect); }} /></div>
      ) : <p className="pop mt-3 font-bold" style={{ color: 'var(--ok)' }}>{right}/{qs.length} richtig – stark!</p>}
      <Finish ready={idx === -1} onClick={onFinish} hint="Answer all 10 to finish." />
    </>
  );
}

function GFollowUp({ card, onFinish }) {
  const { actions } = useApp();
  const m = MODULE_BY_ID[card.moduleId];
  const c = m ? CARD_BY_ID[m.german.vocab[m.german.vocab.length - 1]] : null;
  const [open, setOpen] = useState(false);
  if (!c) return <Finish onClick={onFinish} />;
  return (
    <>
      <p style={{ color: 'var(--muted)' }}>Translate in your head, then check:</p>
      <div className="rounded-2xl p-4 mt-2 border-2 border-dashed flex gap-2" style={{ borderColor: 'var(--sky)' }} lang="de"><span className="flex-1 text-lg font-bold">„{c.ex}“</span><SpeakBtn text={c.ex} /></div>
      {open && <div className="pop mt-3"><div>{c.exEn}</div><div className="text-sm mt-1" style={{ color: 'var(--muted)' }}><Word de={c.de} /> = {c.en}</div></div>}
      {!open ? <div className="mt-4"><Btn kind="ghost" className="w-full" onClick={() => setOpen(true)}><Icon n="eye" size={18} />Show translation</Btn></div> : (
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Btn kind="ghost" onClick={() => { actions.grade(c.id, 'again'); onFinish(); }}>Not yet</Btn>
          <Btn kind="ok" onClick={() => { actions.xp('german', XP.followUp); onFinish(); }}><Icon n="check" size={18} />Gewusst · +{XP.followUp}</Btn>
        </div>
      )}
    </>
  );
}

function UseTodayPrep({ onFinish }) {
  const { state, today } = useApp();
  const ch = state.useToday[today];
  if (!ch) return <Finish onClick={onFinish} />;
  const words = ch.words || [];
  return (
    <>
      <div className="rounded-2xl p-4" style={{ background: 'var(--amber-soft)' }}>
        <div className="eyebrow" style={{ color: 'var(--amber)' }}>Today's challenge · {UT_TYPES[ch.type] || ch.type} · under 5 min</div>
        <p className="font-bold mt-1.5">{ch.text}</p>
      </div>
      {ch.phrase && (
        <div className="mt-4">
          <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Phrase to have ready</div>
          <div className="mt-1 rounded-xl p-3 flex gap-2" style={{ background: 'var(--surface-2)' }} lang="de"><span className="flex-1 font-bold">{ch.phrase}</span><SpeakBtn text={ch.phrase} /></div>
        </div>
      )}
      {words.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Today's words – say each one aloud twice</div>
          <div className="flex flex-wrap gap-2 mt-2" lang="de">{words.map(w => <span key={w} className="inline-flex items-center gap-1 rounded-full border pl-3 pr-1 py-1" style={{ borderColor: 'var(--line)' }}><Word de={w} /><SpeakBtn text={w} size={15} /></span>)}</div>
        </div>
      )}
      <p className="text-sm mt-4" style={{ color: 'var(--muted)' }}>Tomorrow you'll get a quick check-in: done, partly or not today.</p>
      <Finish label="I'm ready" onClick={onFinish} />
    </>
  );
}

export default function GermanCard({ card, onFinish }) {
  const { today } = useApp();
  switch (card.kind) {
    case 'g-followup': return <GFollowUp card={card} onFinish={onFinish} />;
    case 'g-review': return <ReviewCard onFinish={onFinish} today={today} />;
    case 'g-new': return <NewWordsCard card={card} onFinish={onFinish} />;
    case 'g-grammar': return <GrammarCard card={card} onFinish={onFinish} />;
    case 'g-exercise': {
      const [mid, i] = card.exKey.split(':');
      const ex = MODULE_BY_ID[mid].german.exercises[Number(i)];
      return (
        <>
          <p className="text-[15px] mb-3" style={{ color: 'var(--muted)' }}>{ex.instruction}</p>
          {ex.type === 'gapfill' ? <GapFill card={card} ex={ex} onFinish={onFinish} /> : <WriteTask card={card} ex={ex} onFinish={onFinish} />}
        </>
      );
    }
    case 'g-reading': return <ReadingCard card={card} onFinish={onFinish} />;
    case 'g-builder': return <Builder card={card} onFinish={onFinish} />;
    case 'g-dictation': return <Dictation card={card} onFinish={onFinish} />;
    case 'g-speed': return <SpeedRound card={card} onFinish={onFinish} />;
    case 'g-usetoday': return <UseTodayPrep onFinish={onFinish} />;
    default: return <Finish onClick={onFinish} />;
  }
}
