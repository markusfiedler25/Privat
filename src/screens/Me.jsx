import React, { useRef, useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon, Btn, Bar, Flame } from '../components/ui.jsx';
import { streakInfo, levelInfo, LEVELS, BADGES, learnedCount, isFullDay } from '../lib/game.js';
import { addDays, diffDays, parse } from '../lib/dates.js';
import { buildReminderIcs } from '../lib/ics.js';
import { exportState, parseImport, downloadText, defaultState } from '../lib/store.js';
import { CARDS } from '../content/index.js';

const B2_TARGET = '2027-02-28';

export default function Me() {
  const { state, actions, today, toast } = useApp();
  const st = streakInfo(state, today);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef(null);
  const daysToB2 = diffDays(today, B2_TARGET);
  const g = levelInfo('german', state.xp.german);
  const b2Pct = Math.min(1, state.xp.german / LEVELS.german[LEVELS.german.length - 1].min);
  const last28 = Array.from({ length: 28 }, (_, i) => addDays(today, i - 27));
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;

  const onImport = async e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try { const next = parseImport(await f.text()); actions.replace(next); setImportMsg('Progress imported.'); }
    catch (err) { setImportMsg(err.message || 'Could not read this file.'); }
    e.target.value = '';
  };

  return (
    <div className="gutter pagepad flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] font-extrabold leading-tight">Your progress</h1>
          <label htmlFor="name" className="text-sm block mt-1" style={{ color: 'var(--muted)' }}>Your first name (for greetings)</label>
          <input id="name" value={state.settings.name} onChange={e => actions.settings({ name: e.target.value })} placeholder="e.g. Andrea"
            className="mt-1 w-full max-w-[260px] rounded-xl border px-3 py-2" style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' }} />
        </div>
      </header>

      {/* Streak */}
      <section className="card p-4">
        <div className="flex items-center gap-3">
          <Flame lit={st.streak > 0} size={46} />
          <div className="flex-1">
            <div className="font-extrabold text-2xl tnum leading-none">{st.streak} {st.streak === 1 ? 'day' : 'days'}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Current streak · best {st.best}</div>
          </div>
          <div className="text-right text-sm font-bold" style={{ color: st.freezeAvailable ? 'var(--sky)' : 'var(--muted)' }}>
            <Icon n="snow" size={18} /><div>{st.freezeAvailable ? '1 freeze left' : 'Freeze used'}</div><div className="text-[11px] font-normal">this week</div>
          </div>
        </div>
        <div className="grid gap-1 mt-4" style={{ gridTemplateColumns: 'repeat(7, minmax(0,1fr))' }} aria-label="Last 28 days">
          {last28.map(d => {
            const full = isFullDay(state.days[d]), frozen = state.frozen.includes(d), half = state.days[d] && (state.days[d].health || state.days[d].german);
            return <span key={d} title={d} className="aspect-square rounded-md grid place-items-center text-[10px] tnum"
              style={{ background: full ? 'var(--amber)' : frozen ? 'var(--sky-soft)' : half ? 'var(--amber-soft)' : 'var(--surface-2)', color: full ? 'var(--on-accent)' : 'var(--muted)', border: d === today ? '2px solid var(--ink)' : '1px solid var(--line)' }}>
              {frozen ? '❄' : parse(d).getDate()}</span>;
          })}
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>A streak day = both halves done. One missed day per week is covered automatically by a freeze.</p>
      </section>

      {/* Levels */}
      <section className="card p-4">
        <h2 className="text-lg font-extrabold">Levels</h2>
        {['health', 'german'].map(tr => {
          const li = levelInfo(tr, state.xp[tr]);
          return (
            <div key={tr} className="mt-3">
              <div className="flex justify-between text-sm"><b>{tr === 'health' ? 'Healthcare IT' : 'Deutsch'} · {li.cur.name}</b><span className="tnum" style={{ color: 'var(--muted)' }}>{state.xp[tr].toLocaleString('de-CH')} XP</span></div>
              <div className="flex gap-1 mt-1.5">{LEVELS[tr].map((l, i) => <span key={l.name} title={l.name} className="h-2 flex-1 rounded-full" style={{ background: i < li.i ? (tr === 'health' ? 'var(--pine)' : 'var(--sky)') : i === li.i ? 'var(--amber)' : 'var(--surface-2)' }} />)}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{li.next ? `Next: ${li.next.name} at ${li.next.min.toLocaleString('de-CH')} XP` : 'Top level reached'}</div>
            </div>
          );
        })}
        <div className="mt-4 rounded-xl px-3 py-3" style={{ background: 'var(--sky-soft)' }}>
          <div className="flex justify-between text-sm"><b>Goal: B2 by end of February 2027</b><span className="tnum">{daysToB2 > 0 ? `${daysToB2} days left` : 'Target date reached'}</span></div>
          <div className="mt-2"><Bar pct={b2Pct} color="var(--sky)" track="var(--surface)" /></div>
          <div className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>{learnedCount(state)} of {CARDS.length} words learned · app track “{g.cur.name}”. The app tracks practice, not an official CEFR level – plan a Goethe/telc B2 test to confirm.</div>
        </div>
      </section>

      {/* Badges */}
      <section className="card p-4">
        <h2 className="text-lg font-extrabold">Badges <span className="text-sm font-bold tnum" style={{ color: 'var(--muted)' }}>{Object.keys(state.badges).length}/{BADGES.length}</span></h2>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {BADGES.map(b => {
            const got = state.badges[b.id];
            return (
              <div key={b.id} className="rounded-xl p-3 border" style={{ borderColor: got ? 'var(--amber)' : 'var(--line)', background: got ? 'var(--amber-soft)' : 'var(--surface)' }}>
                <div className="flex items-center gap-1.5 font-bold text-[15px]" style={{ color: got ? 'var(--ink)' : 'var(--muted)' }}><Icon n={got ? 'star' : 'lock'} size={16} style={{ color: got ? 'var(--amber)' : 'var(--muted)' }} />{b.title}</div>
                <div className="text-[13px] mt-0.5" style={{ color: 'var(--muted)' }}>{b.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Reminders */}
      <section className="card p-4">
        <h2 className="text-lg font-extrabold flex items-center gap-2"><Icon n="bell" size={20} />Daily reminders</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Your calendar app sends the push: a morning start reminder and an evening nudge.</p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <label className="text-sm font-bold" htmlFor="t-morning">Mission start
            <input id="t-morning" type="time" value={state.settings.morning} onChange={e => actions.settings({ morning: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal" style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' }} />
          </label>
          <label className="text-sm font-bold" htmlFor="t-evening">Evening nudge
            <input id="t-evening" type="time" value={state.settings.evening} onChange={e => actions.settings({ evening: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal" style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' }} />
          </label>
        </div>
        <div className="mt-3">
          <Btn onClick={() => { downloadText('health-quest-reminders.ics', buildReminderIcs({ ...state.settings, url: location.href.split('#')[0] }), 'text/calendar'); toast('Calendar file created', 'done'); }}><Icon n="download" size={18} />Add reminders to calendar</Btn>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>iPhone: open the file → “Add all”. Android: open with Google Calendar. Changed the times? Delete the old events, then add the new file.</p>
      </section>

      {/* Install */}
      {!standalone && (
        <section className="card p-4">
          <h2 className="text-lg font-extrabold">Install on your phone</h2>
          {isIOS
            ? <p className="mt-1">In Safari tap <b>Share</b> → <b>Add to Home Screen</b>. The app then opens full-screen and works offline.</p>
            : <p className="mt-1">In Chrome tap the <b>⋮ menu</b> → <b>Install app</b> (or “Add to Home screen”). The app then works offline.</p>}
        </section>
      )}

      {/* Data */}
      <section className="card p-4">
        <h2 className="text-lg font-extrabold">Your data</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Everything stays on this device. Export a backup regularly, e.g. before changing phones.</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Btn kind="ghost" onClick={() => exportState(state)}><Icon n="download" size={18} />Export progress</Btn>
          <Btn kind="ghost" onClick={() => fileRef.current && fileRef.current.click()}><Icon n="upload" size={18} />Import progress</Btn>
          <input ref={fileRef} id="import-file" type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
        </div>
        {importMsg && <p className="text-sm mt-2 font-bold">{importMsg}</p>}
        <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
          {confirmReset ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">Delete all progress on this device?</span>
              <Btn kind="ghost" onClick={() => { actions.replace(defaultState()); setConfirmReset(false); }} style={{ color: 'var(--err)' }}>Yes, reset</Btn>
              <Btn kind="ghost" onClick={() => setConfirmReset(false)}>Cancel</Btn>
            </div>
          ) : <button type="button" className="text-sm underline" style={{ color: 'var(--muted)' }} onClick={() => setConfirmReset(true)}>Reset progress</button>}
        </div>
      </section>

      <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>Swiss Health Quest · MVP · Content on regulation is marked “Verify” – check BAG, OAAT and SwissDRG AG for the current state.</p>
    </div>
  );
}
