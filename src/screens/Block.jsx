import React, { useEffect } from 'react';
import { useApp } from '../App.jsx';
import { Icon, Btn, Bar, mmss, CaseTag } from '../components/ui.jsx';
import HealthCard from '../components/HealthCards.jsx';
import GermanCard from '../components/GermanCards.jsx';
import { healthPending, germanQueue } from '../lib/curriculum.js';
import { targetSec } from '../lib/game.js';
import { MODULE_CARDS } from '../lib/curriculum.js';
import { MODULE_BY_ID } from '../content/index.js';

const MODULE_KINDS = new Set(MODULE_CARDS.map(c => c.kind));
const counts = (c, est) => c.sec >= est * 60 * 0.3; // ignore cards that were only skimmed

const META = {
  health: { title: 'Healthcare IT', color: 'var(--pine)', soft: 'var(--pine-soft)', other: 'german', otherLabel: 'Deutsch' },
  german: { title: 'Deutsch', color: 'var(--sky)', soft: 'var(--sky-soft)', other: 'health', otherLabel: 'Healthcare IT' }
};
const KIND_LABEL = {
  process: 'Lesson', systems: 'Systems', interfaces: 'Interfaces', tariffs: 'Tariffs', scenario: 'Scenario', quiz: 'Quiz', kpi: 'KPIs & BA', ripple: 'Ripple effect', why: 'Why this matters',
  ba: 'BA exercise', followup: 'Follow-up', radar: 'Regulatory radar', review: 'Review',
  'g-followup': 'Follow-up', 'g-review': 'Wiederholung', 'g-new': 'Neue Wörter', 'g-grammar': 'Grammatik', 'g-exercise': 'Praxis', 'g-reading': 'Lesen', 'g-builder': 'Satzbau', 'g-dictation': 'Diktat', 'g-speed': 'Speed-Runde', 'g-usetoday': 'Use it today'
};

export default function Block({ block }) {
  const { state, today, day, actions, setView, clock } = useApp();
  const m = META[block];
  const b = day[block];
  useEffect(() => { if (block === 'german') actions.ensureGermanPlan(); }, [block]);

  const pending = block === 'health' ? healthPending(state, today) : (b.plan ? germanQueue(state, today) : []);
  const target = targetSec(state, block);
  const sec = clock.live(block);
  const metLive = b.met || sec >= target;
  const current = pending[0];
  const canWork = current && (!b.met || b.grace === current.id);
  const next = pending[1];

  useEffect(() => {
    if (canWork) clock.setActive(block, current.id); else clock.clear();
  }, [canWork, current && current.id, block]);
  useEffect(() => () => clock.clear(), []);

  const back = () => { clock.clear(); setView('home'); window.scrollTo(0, 0); };
  const finish = extra => { actions.completeCard(current, extra); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50); };
  const doneIds = b.cards;
  const savedSec = doneIds.reduce((n, id) => { const c = state.cardsDone[id]; return n + (c && counts(c, c.est) ? Math.max(0, c.est * 60 - c.sec) : 0); }, 0);
  const cardSec = current ? clock.liveCard(block, current.id) : 0;
  const paused = clock.paused;

  return (
    <div>
      <div className="topbar gutter">
        <div className="flex items-center gap-2 pt-2.5">
          <button type="button" onClick={back} className="p-2 -ml-2 rounded-full" aria-label="Back to today"><Icon n="back" size={22} /></button>
          <div className="font-extrabold flex-1 truncate">{m.title}</div>
          {canWork && (
            <button type="button" onClick={() => clock.setPaused(!paused)} className="inline-flex items-center gap-1.5 rounded-full border pl-2 pr-3 py-1.5 font-mono text-sm tnum"
              style={{ borderColor: paused ? 'var(--line)' : m.color, color: paused ? 'var(--muted)' : m.color, background: 'var(--surface)' }} aria-label={paused ? 'Resume timer' : 'Pause timer'}>
              <Icon n={paused ? 'play' : 'pause'} size={15} />{mmss(sec)}
            </button>
          )}
        </div>
        <div className="pb-2.5 pt-1.5">
          <Bar pct={sec / target} color={metLive ? 'var(--ok)' : m.color} h={6} />
          <div className="flex justify-between text-[11px] mt-1 font-bold tnum" style={{ color: 'var(--muted)' }}>
            <span>{Math.floor(sec / 60)} / {target / 60} min{paused && canWork ? ' · paused' : ''}</span>
            <span>{doneIds.length} {doneIds.length === 1 ? 'card' : 'cards'}{savedSec >= 60 ? ` · ${Math.floor(savedSec / 60)} min ahead of estimates` : ''}</span>
          </div>
        </div>
      </div>

      <div className="gutter flex flex-col gap-3 pt-2" style={{ paddingBottom: 'calc(110px + env(safe-area-inset-bottom, 0px))' }}>
        {doneIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Done today">
            {doneIds.map(id => (
              <span key={id} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}>
                <Icon n="check" size={12} />{(state.cardsDone[id] && state.cardsDone[id].title) || 'Card'}
              </span>
            ))}
          </div>
        )}

        {block === 'german' && !b.plan ? (
          <section className="card p-5 text-center" aria-label="Loading"><p style={{ color: 'var(--muted)' }}>Preparing today's plan …</p></section>
        ) : canWork ? (
          <section className="card p-4" aria-label="Current card">
            <div className="flex items-center justify-between gap-2">
              <span className="eyebrow min-w-0 truncate" style={{ color: m.color }}>{MODULE_KINDS.has(current.kind) ? current.title : (KIND_LABEL[current.kind] || 'Card')}</span>
              <span className="text-xs tnum font-bold flex-none" style={{ color: cardSec > current.est * 60 ? 'var(--amber)' : 'var(--muted)' }}>{mmss(cardSec)} / est. {current.est} min</span>
            </div>
            {MODULE_KINDS.has(current.kind)
              ? (current.kind === 'process' ? <div className="mb-2" /> : (
                <div className="flex items-center gap-2 mt-1.5 mb-4 min-w-0">
                  <CaseTag type={current.caseType} small />
                  <span className="text-xs font-bold truncate" style={{ color: 'var(--muted)' }}>{MODULE_BY_ID[current.moduleId].title.split(':')[0]}</span>
                </div>
              ))
              : current.kind === 'radar' ? <div className="mb-2" /> : <h2 className="text-lg font-extrabold mt-1 mb-3">{current.title}</h2>}
            {current.extra && <p className="text-xs font-bold rounded-xl px-3 py-2 mb-3" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}>Bonus card: you finished today's plan faster than estimated, so more practice unlocks until your {target / 60} minutes are reached.</p>}
            {block === 'health' ? <HealthCard key={current.id} card={current} onFinish={finish} /> : <GermanCard key={current.id} card={current} onFinish={finish} />}
            {b.met && b.grace === current.id && <p className="text-sm mt-3 text-center" style={{ color: 'var(--ok)' }}>Time target reached – finish this card, then you're done for today.</p>}
          </section>
        ) : (
          <section className="card p-5 text-center pop" aria-label="Block complete">
            <div className="mx-auto grid place-items-center w-14 h-14 rounded-full" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}><Icon n="check" size={28} /></div>
            <h2 className="text-xl font-extrabold mt-3">{m.title}: target reached</h2>
            <p className="mt-1" style={{ color: 'var(--muted)' }}>{Math.floor(sec / 60)} minutes, {doneIds.length} {doneIds.length === 1 ? 'card' : 'cards'}. {current ? <>Tomorrow continues with <b>{current.title}</b>.</> : ''}</p>
            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              {!day[m.other].met && <Btn kind={block === 'health' ? 'sky' : 'primary'} onClick={() => setView(m.other)}>Continue with {m.otherLabel}</Btn>}
              <Btn kind="ghost" onClick={back}>Back to today</Btn>
            </div>
          </section>
        )}

        {canWork && next && (
          <section className="rounded-2xl border p-3.5 flex items-center gap-3 lockcard" style={{ borderColor: 'var(--line)' }} aria-label="Next card">
            <span className="grid place-items-center w-9 h-9 rounded-xl flex-none" style={{ background: 'var(--surface)', color: 'var(--muted)' }}><Icon n="lock" size={18} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Next · {next.est} min</div>
              <div className="font-bold truncate">{next.title}</div>
            </div>
            <span className="text-[11px] text-right flex-none whitespace-pre-line" style={{ color: 'var(--muted)' }}>{metLive ? 'Tomorrow' : 'Unlocks when\nyou finish'}</span>
          </section>
        )}
      </div>
    </div>
  );
}
