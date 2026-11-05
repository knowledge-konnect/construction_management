// Usage: node migrate-colors.mjs            (dry run, prints counts + unmapped hexes)
//        node migrate-colors.mjs --write    (rewrites files in ./src)
// Rewrites Tailwind arbitrary colors like bg-[#1D4ED8]/90 -> bg-primary/90.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MAP = {
  '#17243A': 'ink', '#101C2F': 'sidebar',
  '#1D4ED8': 'primary', '#1E40AF': 'primary-strong', '#EAF1FF': 'primary-soft',
  '#E6E8EC': 'line', '#DFE5F0': 'line', '#D7DDE8': 'line', '#D0D5DD': 'line',
  '#667085': 'muted', '#5B6475': 'muted', '#344054': 'ink',
  '#F5F7FA': 'canvas', '#F8FAFC': 'sunken', '#FFFFFF': 'surface',
  '#0F766E': 'success',
  '#F4B72B': 'accent', '#E0A822': 'accent', '#F59E0B': 'accent', '#FFF8E6': 'accent-soft', '#7A5B0E': 'warning',
  '#475467': 'muted', '#3B4A66': 'muted',
  '#0B2857': 'sidebar', '#0B234A': 'sidebar', '#071C3F': 'sidebar',
  '#ECFDF5': 'success-soft',
  '#EEF4FF': 'primary-soft', '#DCE7FF': 'primary-soft', '#D9E7FF': 'primary-soft', '#F8FAFF': 'primary-soft', '#2563EB': 'primary', '#93B4F5': 'primary-soft',
  '#D8DEE8': 'line', '#C7D2E5': 'line', '#F7F9FC': 'sunken',
};
const write = process.argv.includes('--write');
const re = /\b(bg|text|border|ring|from|to|via|fill|stroke|divide|outline|placeholder)-\[(#[0-9a-fA-F]{6})\]/g;
let total = 0; const unmapped = {};

function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx|ts|jsx|js)$/.test(f)) {
      const src = readFileSync(p, 'utf8');
      const out = src.replace(re, (m, prefix, hex) => {
        const token = MAP[hex.toUpperCase()];
        if (!token) { unmapped[hex.toUpperCase()] = (unmapped[hex.toUpperCase()] ?? 0) + 1; return m; }
        total++; return `${prefix}-${token}`;
      });
      if (write && out !== src) writeFileSync(p, out);
    }
  }
}
walk('src');
console.log(`${write ? 'Replaced' : 'Would replace'} ${total} class names.`);
console.log('Unmapped hex values (decide per case):', Object.entries(unmapped).sort((a, b) => b[1] - a[1]).slice(0, 20));
