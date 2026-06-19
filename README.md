# PMP Exam Prep — PMBOK® Guide 8th Edition

A self-contained, single-file study app: flashcards, a quiz engine, an EVM calculator,
spaced repetition, and a progress dashboard. No build step, no external CDNs, no data
ever leaves your machine.

## Files
| File | Purpose |
|------|---------|
| `index.html` | The whole app (HTML + CSS + vanilla JS). |
| `content.json` | All flashcards, questions, and formulas. **Edit this to change content — no code changes needed.** |
| `README.md` | This file. |

## How to run

### Recommended — run a tiny local server (loads the full bank)
Browsers block `fetch()` of local files over `file://`, so to load `content.json` serve the folder:

```bash
cd pmp_study_app
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

(Any static server works — e.g. `npx serve`.)

### Quick — double-click `index.html`
It will open and run, but because `fetch()` is blocked on `file://` it falls back to a tiny
built-in question set so the app still works. **Use the local-server method above to study the
full 135-question / 100-flashcard bank.**

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
5. **Spaced repetition** — right/wrong is tracked per item for the session; missed items can be
   resurfaced first in both quiz and flashcards.
6. **Dashboard** — session score, % correct by topic, items reviewed, and a ranked weak-areas list.

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

### Adding a flashcard
Append to `flashcards` with a `type` of `term`, `process`, or `formula`. New `topic` values
appear automatically in the filter dropdowns.

## Sources & accuracy
- Primary source: **`PMBOK_8th_Edition_Breakdown.md`** (your verified study guide) plus the
  official **PMBOK® Guide 8th Edition** PDF for verification.
- Every flashcard and question carries a `source` field.
- EVM formula identities use the standard PMI Earned Value convention; the SV/CV/SPI/CPI/TCPI
  definitions trace to the study guide and glossary.
- `ecoExtended: true` marks content that goes beyond the book (not directly book-citable).

## Validating content
A quick integrity check (Node.js):

```bash
node -e 'const d=require("./content.json");
 let e=0,ids=new Set();
 d.questions.forEach(q=>{if(ids.has(q.id))e++;ids.add(q.id);
   if(q.options.length!==4)e++; if(q.answerIndex<0||q.answerIndex>3)e++;
   if(!q.source||!q.explanation)e++;});
 console.log("Q:",d.questions.length,"FC:",d.flashcards.length,e?("ERRORS "+e):"OK");'
```

PMBOK® is a registered mark of the Project Management Institute, Inc.
