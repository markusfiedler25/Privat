export function fmt(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
export const todayStr = () => fmt(new Date());
export function parse(str) { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d); }
export function addDays(str, n) { const d = parse(str); d.setDate(d.getDate() + n); return fmt(d); }
export function diffDays(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
export function isoWeek(str) {
  const d = parse(str); d.setHours(12);
  const day = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - day + 3);
  const firstThu = new Date(d.getFullYear(), 0, 4);
  const week = 1 + Math.round(((d - firstThu) / 86400000 - 3 + ((firstThu.getDay() + 6) % 7)) / 7);
  return d.getFullYear() + '-W' + String(week).padStart(2, '0');
}
export const isSunday = str => parse(str).getDay() === 0;
export function niceDate(str, opts = { weekday: 'long', day: 'numeric', month: 'long' }) {
  return parse(str).toLocaleDateString('en-GB', opts);
}
export function addMonths(str, n) {
  const d = parse(str); const day = d.getDate();
  d.setDate(1); d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return fmt(d);
}
export const weekday = str => parse(str).getDay(); // 0 = Sunday
export function shortDate(str) { return parse(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
export function monthYear(str) { return parse(str).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); }
