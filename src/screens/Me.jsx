import React, { useRef, useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon, Btn, Bar, Flame, Verify } from '../components/ui.jsx';
import { streakInfo, BADGES, isFullDay } from '../lib/game.js';
import { learnedCount } from '../lib/srs.js';
import { projection, GOETHE_SOURCE, LEVEL_END_HOURS } from '../lib/german.js';
import { addDays, parse, shortDate, monthYear } from '../lib/dates.js';
import { buildReminderIcs } from '../lib/ics.js';
import { exportState, parseImport, downloadText, defaultState } from '../lib/store.js';
import { CARDS } from '../content/index.js';
import { REACHED, TARGETS, SplitPicker } from './Setup.jsx';

const field = { borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' };

function GermanProgress() {
  const { state, today, actions } = useApp();
  const pr = projection(state, today);
  const st = pr.status;
  const [min, setMin] = useState('');
  const [what, setWhat] = useState('Course or tutor');
  const gap = Math.max(0, pr.neededPerDay - Math.round(pr.perDay));
  return (
    <section className="card p-4" aria-label="German progress">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-extrabold">Deutsch: {st.sub}</h2>
        <span className="text-xs tnum" style={{ color: 'var(--muted)' }}>≈ {Math.round(st.total)} study hours</span>
      </div>
      <div className="mt-2"><Bar pct={st.pct} color="var(--sky)" /></div>
      <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{Math.round(st.hoursToNext)} h to the next step · {learnedCount(state)} of {CARDS.length} words learned</div>

      <div className="mt-4 rounded-2xl p-4" style={{ background: pr.onTrack ? 'var(--ok-soft)' : 'var(--amber-soft)' }}>
        <div className="eyebrow" style={{ color: pr.onTrack ? 'var(--ok)' : 'var(--amber)' }}>{pr.target} projection</div>
        <div className="text-[17px] mt-1">At {Math.round(pr.perDay)} min/day: <b>{pr.date ? monthYear(pr.date) : '—'}</b></div>
        <div className="text-sm mt-0.5">Your target: {shortDate(state.profile.targetDate)} · {Math.round(pr.remainingH)} h to go</div>
        <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{pr.usePlanned ? 'Based on your planned minutes until you have 3 active days.' : `Based on your real pace over the last ${pr.pace.windowDays} days.`}</div>
      </div>

      {pr.milestones.length > 0 && (
        <ol className="list-none p-0 mt-3 flex flex-col gap-1.5">
          {pr.milestones.map(m => <li key={m.level} className="flex justify-between text-[15px]"><span><b>{m.level}</b> reached</span><span className="tnum" style={{ color: 'var(--muted)' }}>{m.date ? monthYear(m.date) : '—'}</span></li>)}
        </ol>
      )}

      {!pr.onTrack && (
        <div className="mt-4">
          <div className="font-bold">What would close the gap</div>
          <ul className="mt-2 flex flex-col gap-2 text-[15px]">
            <li className="rounded-xl px-3 py-2" style={{ background: 'var(--surface-2)' }}>About <b>{pr.neededPerDay} min/day</b> of German until {shortDate(state.profile.targetDate)} – that is {gap} min more than now.</li>
            <li className="rounded-xl px-3 py-2" style={{ background: 'var(--surface-2)' }}>A course with 2 × 90 min a week adds about <b>26 min/day</b>. Log it below.</li>
            <li className="rounded-xl px-3 py-2" style={{ background: 'var(--surface-2)' }}>Count real German: meetings, calls and emails in German at work. Log the minutes – immersion is your biggest lever.</li>
            <li className="rounded-xl px-3 py-2" style={{ background: 'var(--surface-2)' }}>Or keep the pace and set the target to <b>{pr.date ? monthYear(pr.date) : 'later'}</b> – still a strong goal, with {pr.milestones.length > 1 ? `${pr.milestones[pr.milestones.length - 2].level} on the way` : 'clear steps on the way'}.</li>
          </ul>
        </div>
      )}

      <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
        <div className="font-bold">Log German outside the app</div>
        <div className="grid grid-cols-[1fr_auto] gap-2 mt-2">
          <select id="log-what" value={what} onChange={e => setWhat(e.target.value)} className="rounded-xl border px-3 py-2.5 min-w-0" style={field}>
            {['Course or tutor', 'German at work (meetings, calls)', 'Tandem / conversation', 'Reading, podcast, TV'].map(o => <option key={o}>{o}</option>)}
          </select>
          <input id="log-min" type="number" inputMode="numeric" min="5" max="480" placeholder="min" value={min} onChange={e => setMin(e.target.value)} className="w-20 rounded-xl border px-3 py-2.5" style={field} />
        </div>
        <div className="mt-2"><Btn kind="sky" disabled={!(Number(min) >= 5)} onClick={() => { actions.logGerman(Math.min(480, Number(min)), what); setMin(''); }}>Add minutes</Btn></div>
        {state.germanLog.length > 0 && <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Logged so far: {Math.round(state.germanLog.reduce((n, l) => n + l.min, 0) / 60 * 10) / 10} h outside the app.</p>}
      </div>
      <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>Hours per level follow Goethe-Institut guidance for guided learning (midpoints; C1 ≈ {LEVEL_END_HOURS.C1} h in total). A rough estimate – plan an official exam (Goethe, telc) to confirm your level.</p>
      <Verify note="Study-hour ranges are guidance, not rules; your pace, prior knowledge and immersion change them a lot." sources={[GOETHE_SOURCE]} />
    </section>
  );
}

export default function Me() {
  const { state, actions, today, toast } = useApp();
  const p = state.profile;
  const st = streakInfo(state, today);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef(null);
  const last28 = Array.from({ length: 28 }, (_, i) => addDays(today, i - 27));
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  const reflections = Object.entries(state.reflections).sort((a, b) => b[0].localeCompare(a[0]));

  const onImport = async e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try { const next = parseImport(await f.text()); actions.replace(next); setImportMsg('Progress imported.'); }
    catch (err) { setImportMsg(err.message || 'Could not read this file.'); }
    e.target.value = '';
  };

  return (
    <div className="gutter pagepad flex flex-col gap-4">
      <header>
        <h1 className="text-[26px] font-extrabold leading-tight">Progress & settings</h1>
      </header>

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
            const day = state.days[d]; const full = isFullDay(day), frozen = state.frozen.includes(d), some = day && (day.health.sec + day.german.sec > 60 || day.health.met || day.german.met);
            return <span key={d} title={d} className="aspect-square rounded-md grid place-items-center text-[10px] tnum"
              style={{ background: full ? 'var(--amber)' : frozen ? 'var(--sky-soft)' : some ? 'var(--amber-soft)' : 'var(--surface-2)', color: full ? 'var(--on-accent)' : 'var(--muted)', border: d === today ? '2px solid var(--ink)' : '1px solid var(--line)' }}>
              {frozen ? '❄' : parse(d).getDate()}</span>;
          })}
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>A streak day = both time targets reached. One missed day per week is covered by a freeze automatically.</p>
      </section>

      <GermanProgress />

      <section className="card p-4">
        <h2 className="text-lg font-extrabold">Badges <span className="text-sm font-bold tnum" style={{ color: 'var(--muted)' }}>{BADGES.filter(b => state.badges[b.id]).length}/{BADGES.length}</span></h2>
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

      {reflections.length > 0 && (
        <section className="card p-4">
          <h2 className="text-lg font-extrabold">Weekly reflections</h2>
          <div className="flex flex-col gap-3 mt-2">
            {reflections.map(([wk, r]) => (
              <div key={wk} className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
                <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{wk}</div>
                <div className="mt-1"><b>Applied:</b> {r.applied}</div>
                {r.changed && <div className="mt-0.5"><b>Changed:</b> {r.changed}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card p-4" aria-label="Plan">
        <h2 className="text-lg font-extrabold">Your plan</h2>
        <label htmlFor="me-name" className="block text-sm font-bold mt-3">First name</label>
        <input id="me-name" value={p.name} onChange={e => actions.profile({ name: e.target.value })} className="mt-1 w-full max-w-[280px] rounded-xl border px-3 py-2" style={field} />
        <div className="text-sm font-bold mt-4">Daily split (Deutsch / Healthcare IT)</div>
        <div className="mt-1.5"><SplitPicker value={p.split} onChange={split => actions.profile({ split })} /></div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <label className="text-sm font-bold" htmlFor="me-reached">German reached at start
            <select id="me-reached" value={p.germanReached} onChange={e => actions.profile({ germanReached: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal" style={field}>
              {REACHED.map(r => <option key={r.id} value={r.id}>{r.label} – {r.hint}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold" htmlFor="me-target">Target
            <select id="me-target" value={p.germanTarget} onChange={e => actions.profile({ germanTarget: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal" style={field}>
              {TARGETS.map(t => <option key={t}>{t}</option>)}
            </select>
          </label>
        </div>
        <label htmlFor="me-date" className="block text-sm font-bold mt-3">Target date</label>
        <input id="me-date" type="date" value={p.targetDate} min={today} onChange={e => e.target.value && actions.profile({ targetDate: e.target.value })} className="mt-1 rounded-xl border px-3 py-2" style={field} />
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-extrabold flex items-center gap-2"><Icon n="bell" size={20} />Daily reminders</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Your calendar app sends the push: a morning start and an evening nudge.</p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <label className="text-sm font-bold" htmlFor="t-morning">Mission start
            <input id="t-morning" type="time" value={p.morning} onChange={e => actions.profile({ morning: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal" style={field} />
          </label>
          <label className="text-sm font-bold" htmlFor="t-evening">Evening nudge
            <input id="t-evening" type="time" value={p.evening} onChange={e => actions.profile({ evening: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal" style={field} />
          </label>
        </div>
        <div className="mt-3">
          <Btn onClick={() => { downloadText('health-quest-reminders.ics', buildReminderIcs({ ...p, url: location.href.split('#')[0] }), 'text/calendar'); toast('Calendar file created', 'done'); }}><Icon n="download" size={18} />Add reminders to calendar</Btn>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>iPhone: open the file → “Add all”. Android: open with Google Calendar. Changed the times? Delete the old events, then add the new file.</p>
      </section>

      {!standalone && (
        <section className="card p-4">
          <h2 className="text-lg font-extrabold">Install on your phone</h2>
          {isIOS
            ? <p className="mt-1">In Safari tap <b>Share</b> → <b>Add to Home Screen</b>. The app then opens full-screen and works offline.</p>
            : <p className="mt-1">In Chrome tap the <b>⋮ menu</b> → <b>Install app</b> (or “Add to Home screen”). The app then works offline.</p>}
        </section>
      )}

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
              <Btn kind="ghost" onClick={() => { actions.replace(defaultState()); setConfirmReset(false); }}>Yes, reset</Btn>
              <Btn kind="ghost" onClick={() => setConfirmReset(false)}>Cancel</Btn>
            </div>
          ) : <button type="button" className="text-sm underline" style={{ color: 'var(--muted)' }} onClick={() => setConfirmReset(true)}>Reset progress</button>}
        </div>
      </section>

      <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>Swiss Health Quest · Phase 1 · Regulatory content is marked “Verify before publishing” – check BAG, SwissDRG AG, OAAT, FINMA, SVV and H+ for the current state.</p>
    </div>
  );
}
