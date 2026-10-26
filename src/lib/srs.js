// Spaced repetition with Leitner boxes.
import { addDays } from './dates.js';
import { CARD_BY_ID } from '../content/index.js';

const INTERVALS = [0, 1, 2, 4, 8, 16, 32, 64];

export function introduce(d, ids, date) {
  ids.forEach(id => { if (!d.srs[id]) d.srs[id] = { box: 0, due: date, reps: 0, intro: date }; });
}

export function grade(d, id, g, date) {
  const c = d.srs[id] || { box: 0, due: date, reps: 0, intro: date };
  if (g === 'again') { c.box = 0; c.due = addDays(date, 1); }
  else { c.box = Math.min(INTERVALS.length - 1, c.box + (g === 'easy' ? 2 : 1)); c.due = addDays(date, INTERVALS[c.box]); }
  c.reps += 1; c.last = date;
  d.srs[id] = c;
}

// Cards due for review today (cards introduced today are not reviewed again today).
export function dueIds(state, date) {
  return Object.entries(state.srs)
    .filter(([id, c]) => c.due <= date && c.intro !== date && CARD_BY_ID[id])
    .sort((a, b) => a[1].box - b[1].box || a[1].due.localeCompare(b[1].due))
    .map(([id]) => id);
}

export const learnedCount = state => Object.values(state.srs).filter(c => c.box >= 2).length;
