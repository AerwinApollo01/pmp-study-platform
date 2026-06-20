# Matching Lab & Behavioral Analytics — Deep Focus module

> 🧪 **Experimental.** This module is a sandbox, decoupled from the main study app
> (`../index.html`). Its content, behavior, and API may change, and it is not wired into the
> main app's navigation. The core platform remains the stable, primary product.

A self-contained module for the PMP Study Platform: a **drag-and-drop matching lab** plus a
**behavioral analytics engine** that surfaces two high-yield, stress-bound study metrics. Built
with semantic HTML5, vanilla web APIs, and modular TypeScript — no UI frameworks, no mapping
libraries.

## Run it

**Just open `index.html`** (double-click). It loads the precompiled `dist/app.js`, so it runs
with zero tooling.

> Browsers block `fetch`/ES-module loading from `file://`, so the shipped runnable artifact is a
> single classic-script bundle (`dist/app.js`). If you serve the folder over HTTP you can use the
> TypeScript module build instead (below).

## Build from TypeScript source

```bash
cd matching-lab
npx tsc            # emits ES modules to dist/ from src/*.ts (see tsconfig.json)
```

The source (`src/`) compiles to ES modules. To run that build, serve the folder and point the
script tag at the module entry:

```html
<script type="module" src="dist/main.js"></script>   <!-- served over http(s) -->
```

The committed `dist/app.js` is a hand-faithful classic-script bundle of the same logic, kept so
the module works by double-click without a build. Treat `src/` as the source of truth.

## Architecture

| File | Responsibility |
|------|----------------|
| `src/types.ts` | All cross-module interfaces (`DragItem`, `DropTarget`, `MatchSet`, `SituationalAnswerEvent`, metric shapes, `MetricsStore`). |
| `src/analytics.ts` | `BehavioralAnalyticsEngine` + `InMemoryStore` (default) and `LocalStorageStore` (opt-in). |
| `src/matching.ts` | `MatchingLab` — native HTML5 drag-and-drop, correctness evaluated against each chip's `data-target`. |
| `src/data.ts` | Sample PMP matching sets and the situational drill (carries the `inverted-not` / `escalation-trap` tags). |
| `src/main.ts` | Composition root — wires the lab, the engine, and the metric cards. |
| `styles.css` | Deep Focus palette (strict 60-30-10), flexbox + grid layout. |
| `dist/app.js` | Compiled, runnable bundle. |

## The two metrics

1. **"NOT" Logic Error Rate** — `misses ÷ total` on questions tagged `inverted-not`
   (inverted-logic "which is NOT…" items, where candidates routinely misread the stem).
2. **Escalation Index** — `escalation-trap selections ÷ total situational answers`. Options that
   defer authority to a third party are tagged `escalation-trap`. **Above 20%** the card flips to
   the Amber/Warning token, signaling a structural gap in situational PM judgment (over-deferring
   instead of acting within role).

## Storage & the platform rule

The engine depends only on the `MetricsStore` interface and defaults to **`InMemoryStore`**, so
nothing is written to the browser — honoring the platform's "no localStorage/sessionStorage"
rule. To persist metrics across refreshes, change the line marked `[STORAGE]` in `main.ts`
(and `dist/app.js`) to `new LocalStorageStore()`. That's the only edit required.

## Design tokens (Deep Focus)

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#121824` | 60% — primary background |
| `--surface` | `#1E293B` | 30% — surface cards |
| `--accent` | `#3B82F6` | 10% — primary action |
| `--text` / `--text-muted` | `#F8FAFC` / `#94A3B8` | readability / secondary |
| `--success` / `--warn` / `--error` | `#10B981` / `#F59E0B` / `#EF4444` | state colors |
