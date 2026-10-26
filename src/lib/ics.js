// Creates a calendar file with two daily reminders (morning + evening). No server needed:
// the phone's calendar app does the push notification.
const pad = n => String(n).padStart(2, '0');

function stamp(d) {
  return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00Z';
}
function local(dateObj, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return dateObj.getFullYear() + pad(dateObj.getMonth() + 1) + pad(dateObj.getDate()) + 'T' + pad(h) + pad(m) + '00';
}
function esc(s) { return s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n'); }

const TZ = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/Zurich',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE'
];

function event(uid, start, minutes, title, desc, url) {
  const [h, m] = start.slice(9, 13).match(/../g).map(Number);
  const endMin = h * 60 + m + minutes;
  const end = start.slice(0, 9) + pad(Math.floor(endMin / 60) % 24) + pad(endMin % 60) + '00';
  return [
    'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stamp(new Date())}`,
    `DTSTART;TZID=Europe/Zurich:${start}`, `DTEND;TZID=Europe/Zurich:${end}`,
    'RRULE:FREQ=DAILY', `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(desc + (url ? '\n' + url : ''))}`,
    url ? `URL:${url}` : null,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT'
  ].filter(Boolean);
}

export function buildReminderIcs({ morning, evening, url, split = { german: 45, health: 15 } }) {
  const start = new Date();
  const total = split.german + split.health;
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Swiss Health Quest//Reminders//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...TZ,
    ...event('shq-morning@healthquest', local(start, morning), 15, `${total}-min mission: Deutsch + Healthcare IT`, `Today: ${split.health} min Healthcare IT (it sets the topic), then ${split.german} min Deutsch. Plus one small 'Use it today' challenge at work.`, url),
    ...event('shq-evening@healthquest', local(start, evening), 10, 'Mission still open? A few cards keep you moving', 'Already done today? Great, enjoy your evening. If not: every card counts, and both time targets keep your streak.', url),
    'END:VCALENDAR'
  ];
  return lines.join('\r\n');
}
