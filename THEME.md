# Design system — Phase 2 (tokens + theming)

- `src/styles/tokens.css` — all colour/elevation/radius tokens, light (`:root`) and dark (`.dark`). Edit values here to rebrand.
- `tailwind.config.js` — maps tokens to semantic classes (`bg-surface`, `text-muted`, `border-line`, `text-primary-fg`, `bg-danger-soft`, `text-danger-fg`). `darkMode: 'class'`.
- `src/theme/` — `ThemeProvider` (light | dark | system, persisted under `bd-theme`), `useTheme`, `ThemeToggle`.
- `index.html` — inline script applies the saved theme before first paint (no flash).
- `npm run check:contrast` — verifies WCAG AA for every text/background token pair in both themes.

Rules for pages: use semantic classes only (never `bg-white`, `bg-slate-*`, hex values, or `dark:` pairs).
Status colours: base = fills/borders/icons, `-soft` = tinted background, `-fg` = text.
Quotation/PDF preview surfaces stay light on purpose (they represent printed paper).
