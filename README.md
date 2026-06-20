# PMP Exam Prep — PMBOK® Guide 8th Edition

A self-contained study app: flashcards, a quiz engine, an EVM calculator, an interactive
scheduling lab, spaced repetition, and a progress dashboard. No build step, no external CDNs,
no data ever leaves the browser.

## ▶️ Live app (no install)

**https://aerwinapollo01.github.io/pmp-study-platform/**

Open it on any device — phone, tablet, or desktop. Hosted on GitHub Pages and rebuilt
automatically on every push to `main`.

## What's inside
- **319 quiz questions** — 173 authored from the verified study guide, 110 situational
  questions imported from a PMBOK 8 Q&A video (each tagged in its `source` as
  `via Q&A video … not independently verified`), and 36 Business Environment questions
  mapped to the 2026 ECO tasks (governance, compliance, change control, impediments/issues,
  risk, continuous improvement, sustainability)
- **100 flashcards** (terms, processes, formulas)
- **14 formulas** (EVM, PERT, EMV)

> **Calibrated to the PMP ECO 2026** (effective July 2026): **People 33% / Process 41% /
> Business Environment 26%**, with ~40% predictive and ~60% adaptive-agile/hybrid. The
> Exam Sim samples to these weightings automatically.
>
> Content depth now matches the 2026 ECO much more closely: **Business Environment ~24%**
> of the bank (up from ~15%), covering governance, compliance, change control,
> impediments/issues, risk, continuous improvement, and sustainability — sourced to the
> 2026 ECO tasks. To target the older 2021 ECO instead (42/50/8), edit `meta.ecoWeighting`
> in `content.json`.

## Files
| File | Purpose |
|------|---------|
| `index.html` | The whole app — HTML + CSS + vanilla JS, including the Scheduling Lab logic. |
| `content.json` | All flashcards, questions, and formulas. **Edit this to change content — no code changes needed.** |
| `README.md` | This file. |

## How to run

### Easiest — just open the live URL above
Nothing to install.

### Locally — run a tiny static server (loads the full bank)
Browsers block `fetch()` of local files over `file://`, so to load `content.json` serve the folder:

```bash
cd pmp_study_app
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

(Any static server works — e.g. `npx serve`.) Use the local server when you're editing
`content.json` and want changes instantly, without waiting for the Pages rebuild.

### Quick — double-click `index.html`
It opens and runs, but because `fetch()` is blocked on `file://` it falls back to a tiny
built-in question set. **Use the live URL or a local server for the full bank.**

## Features
1. **Flashcards** — flip cards for terms, processes, and formulas. Filter by topic and type;
   optionally prioritize cards you've marked wrong (spaced repetition).
2. **Quiz** — single correct answer + 3 distractors, randomized option order, immediate
   feedback with an explanation and source citation. Situational "what should the PM do next?"
   items are tagged `situational`.
3. **ECO-domain mode** — drill People (42%) / Process (50%) / Business (8%), and filter
   Predictive vs. Agile/Hybrid.
4. **EVM calculator** — enter PV, EV, AC, BAC → SV, CV, SPI, CPI, all four EAC variants, ETC,
   VAC, and TCPI (to BAC and to EAC), each with its formula and a plain-English interpretation.
   A checkbox switches the "selected EAC" between the CPI and atypical variants.
5. **Scheduling Lab** — interactive practice for the scheduling methods (logic lives in
   `index.html`, not `content.json`):
   - **Critical Path (CPM)** — enter activities/durations/predecessors; runs the forward &
     backward pass to compute ES/EF/LS/LF, total float, the critical path, and project
     duration. Includes 3 practice networks and a step-by-step explanation.
   - **Three-Point / PERT** — Beta and Triangular estimates, σ, variance, and ±1σ/±2σ ranges.
   - **Compression** — finds the cheapest critical-path crash to shorten N periods.
   - **Methods Reference** — PDM relationships, leads/lags, crashing vs. fast-tracking,
     leveling vs. smoothing, rolling wave, and adaptive scheduling (all source-cited).
6. **Exam simulator** — a timed mock exam under real-PMP conditions: exam-weighted sampling
   (People 42% / Process 50% / Business 8%), a countdown timer (1.3 min/question) with
   auto-submit, a question navigator (answered / flagged / current) with flag-for-review, and
   no feedback until you submit. The end report shows an overall score, an Above Target /
   Target / Below Target band, readiness gauges by ECO domain / approach / topic, and a full
   review with a wrong-only filter. (Bands are a study heuristic — PMI does not publish exact
   cut scores.) Choose 30 / 60 / 90 / full-bank, timed or untimed.
7. **Spaced repetition** — right/wrong is tracked per item for the session; missed items can be
   resurfaced first in both quiz and flashcards.
8. **Dashboard** — session score, % correct by topic, items reviewed, and a ranked weak-areas list.

> Session data is held **in memory only** — refreshing the page starts a clean session.
> (No `localStorage`/`sessionStorage`, by design.)

## Content model (`content.json`)

```jsonc
{
  "meta": { ... },
  "taxonomy": { "domains": [...], "focusAreas": [...], "topics": [...], "ecoDomains": [...], "approaches": [...] },
  "formulas": [
    { "id", "name", "formula", "interpretation", "source" }
  ],
  "flashcards": [
    { "id", "type": "term|process|formula", "front", "back",
      "topic", "ecoDomain", "approach", "source", "ecoExtended": false }
  ],
  "questions": [
    { "id", "stem", "options": [4 strings], "answerIndex": 0-3,
      "explanation", "source", "topic", "ecoDomain": "People|Process|Business",
      "approach": "Predictive|Agile/Hybrid|Both", "situational": false, "ecoExtended": false }
  ]
}
```

### Adding a question
Append an object to the `questions` array. Rules the app and the validator expect:
- `options` must have **exactly 4** entries; `answerIndex` (0–3) points at the correct one.
- Always include a `source`. Use `"ecoExtended": true` for anything beyond book-citable
  PMBOK 8 (e.g., agile/People/Business exam content) so it's visibly flagged in the UI.
- Give each item a unique `id`.

After editing, commit and push — the live site rebuilds automatically (allow ~1 minute).

### Adding a flashcard
Append to `flashcards` with a `type` of `term`, `process`, or `formula`. New `topic` values
appear automatically in the filter dropdowns.

> The **Scheduling Lab** is interactive logic, not data, so it lives in `index.html` and is
> not editable via `content.json`.

## Sources & accuracy
- Primary source: **`PMBOK_8th_Edition_Breakdown.md`** (your verified study guide) plus the
  official **PMBOK® Guide 8th Edition** PDF for verification.
- Every flashcard and question carries a `source` field.
- EVM and CPM math are independently verified (worked test cases match standard PMI values).
- `ecoExtended: true` marks content that goes beyond the book — correct PMP/ECO exam knowledge
  that isn't directly quotable from PMBOK 8 (e.g., Tuckman stages, conflict modes, the
  channels formula). The UI badges these so you know they aren't book-citable.

## Validating content
A quick integrity check (Node.js):

```bash
node -e 'const d=require("./content.json");
 let e=0,ids=new Set();
 d.questions.forEach(q=>{if(ids.has(q.id))e++;ids.add(q.id);
   if(q.options.length!==4)e++; if(q.answerIndex<0||q.answerIndex>3)e++;
   if(!q.source||!q.explanation)e++;});
 const dist={};d.questions.forEach(q=>dist[q.ecoDomain]=(dist[q.ecoDomain]||0)+1);
 console.log("Q:",d.questions.length,"FC:",d.flashcards.length,"ECO:",dist,e?("ERRORS "+e):"OK");'
```

PMBOK® is a registered mark of the Project Management Institute, Inc.
