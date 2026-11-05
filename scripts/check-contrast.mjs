// Usage: node scripts/check-contrast.mjs   (exit code 1 if any required pair fails)
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const block = (selector) => {
  const m = css.match(new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([\\s\\S]*?)\\n\\}`));
  const out = {};
  for (const x of (m?.[1] ?? '').matchAll(/--c-([\w-]+):\s*(\d+) (\d+) (\d+)/g)) out[x[1]] = [+x[2], +x[3], +x[4]];
  return out;
};
const light = block(':root');
const dark = { ...light, ...block('.dark') };

const lum = ([r, g, b]) => {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const white = [255, 255, 255];

// [foreground, background, min ratio, label]
const pairs = (t) => [
  ['ink', 'canvas', 4.5, 'body text on page'],
  ['ink', 'surface', 4.5, 'body text on card'],
  ['ink', 'raised', 4.5, 'body text on modal/input'],
  ['muted', 'canvas', 4.5, 'secondary text on page'],
  ['muted', 'surface', 4.5, 'secondary text on card'],
  ['muted', 'sunken', 4.5, 'secondary text on table head'],
  ['muted', 'raised', 4.5, 'secondary text / placeholder on input'],
  ['primary-fg', 'surface', 4.5, 'brand text on card'],
  ['primary-fg', 'primary-soft', 4.5, 'brand text on tint'],
  [white, 'primary', 4.5, 'text on primary button'],
  [white, 'primary-strong', 4.5, 'text on primary button hover'],
  ['success-fg', 'success-soft', 4.5, 'success pill'],
  ['warning-fg', 'warning-soft', 4.5, 'warning pill'],
  ['danger-fg', 'danger-soft', 4.5, 'danger pill'],
  ['info-fg', 'info-soft', 4.5, 'info pill'],
  ['success-fg', 'surface', 4.5, 'success text on card'],
  ['warning-fg', 'surface', 4.5, 'warning text on card'],
  ['danger-fg', 'surface', 4.5, 'danger text on card'],
  ['info-fg', 'surface', 4.5, 'info text on card'],
  ['ring', 'surface', 3, 'focus ring on card'],
  ['ring', 'raised', 3, 'focus ring on modal/input'],
  ['ring', 'canvas', 3, 'focus ring on page'],
  ['line-strong', 'surface', 1.3, 'border visibility (informational)'],
];

let failed = 0;
for (const [name, t] of [['light', light], ['dark', dark]]) {
  console.log(`\n${name.toUpperCase()}`);
  for (const [fg, bg, min, label] of pairs(t)) {
    const f = Array.isArray(fg) ? fg : t[fg];
    const r = ratio(f, t[bg]);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${r.toFixed(2).padStart(5)}  (need ${min})  ${label}`);
  }
}
if (failed) { console.log(`\n${failed} pair(s) below target`); process.exit(1); }
console.log('\nAll pairs pass.');
