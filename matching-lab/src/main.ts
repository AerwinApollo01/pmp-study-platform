/**
 * main.ts — Composition root.
 *
 * Wires the Matching Lab and the Behavioral Analytics Engine to the DOM, renders the situational
 * drill that feeds the engine, and keeps the two metric cards in sync. All dense rendering logic
 * is isolated in small, named methods so the control flow stays scannable.
 *
 * Storage choice: InMemoryStore by default (no browser storage, per the platform rule). To make
 * metrics survive a refresh, swap the line marked [STORAGE] for `new LocalStorageStore()`.
 */

import { MatchingLab } from './matching.js';
import { BehavioralAnalyticsEngine, InMemoryStore /*, LocalStorageStore */ } from './analytics.js';
import { MATCH_SETS, DRILL, DrillQuestion } from './data.js';
import { MetricsSnapshot } from './types.js';

const $ = <T extends HTMLElement>(sel: string): T => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Missing element: ${sel}`);
  return el;
};

class App {
  private readonly engine = new BehavioralAnalyticsEngine(new InMemoryStore()); // [STORAGE]
  private readonly lab: MatchingLab;
  private setIndex = 0;

  constructor() {
    this.lab = new MatchingLab($('#bank'), $('#targets'), () => this.renderLabScore());
    this.bindControls();
    this.loadSet(0);
    this.renderDrill();
    this.renderMetrics();
  }

  /* ------------------------------- Controls -------------------------------- */

  private bindControls(): void {
    $('#set-switch').addEventListener('click', () => {
      this.setIndex = (this.setIndex + 1) % MATCH_SETS.length;
      this.loadSet(this.setIndex);
    });
    $('#lab-reset').addEventListener('click', () => {
      this.lab.reset();
      this.renderLabScore();
    });
    $('#metrics-reset').addEventListener('click', () => {
      this.engine.reset();
      this.renderDrill();
      this.renderMetrics();
    });
  }

  private loadSet(i: number): void {
    const set = MATCH_SETS[i];
    this.lab.load(set);
    $('#set-title').textContent = set.title;
    $('#set-prompt').textContent = set.prompt;
    this.renderLabScore();
  }

  private renderLabScore(): void {
    const pct = Math.round(this.lab.score() * 100);
    $('#lab-score').textContent = `${pct}% placed correctly`;
  }

  /* ----------------------------- Situational drill ------------------------- */

  private renderDrill(): void {
    const host = $('#drill');
    host.innerHTML = '';
    DRILL.forEach((q) => host.appendChild(this.renderQuestion(q)));
  }

  private renderQuestion(q: DrillQuestion): HTMLElement {
    const card = document.createElement('div');
    card.className = 'q-card';
    const isNot = q.tags.includes('inverted-not');
    card.innerHTML = `
      <p class="q-stem">${q.stem} ${isNot ? '<span class="q-tag">NOT-logic</span>' : ''}</p>
      <div class="q-options" role="group"></div>
      <p class="q-feedback" hidden></p>`;
    const opts = card.querySelector('.q-options') as HTMLElement;

    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'q-option';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        if (card.dataset.answered) return; // single answer per question
        card.dataset.answered = 'true';

        // Record the behavioral event the instant the user commits to an answer.
        this.engine.record({
          questionId: q.id,
          questionTags: q.tags,
          correct: opt.correct,
          selectedOptionTags: opt.tags,
        });

        this.paintAnswer(opts, idx, q);
        this.showFeedback(card, opt.correct, opt.tags.includes('escalation-trap'));
        this.renderMetrics();
      });
      opts.appendChild(btn);
    });
    return card;
  }

  private paintAnswer(opts: HTMLElement, chosen: number, q: DrillQuestion): void {
    [...opts.children].forEach((node, i) => {
      const el = node as HTMLButtonElement;
      el.disabled = true;
      if (q.options[i].correct) el.classList.add('q-option--correct');
      else if (i === chosen) el.classList.add('q-option--wrong');
    });
  }

  private showFeedback(card: HTMLElement, correct: boolean, escalationTrap: boolean): void {
    const fb = card.querySelector('.q-feedback') as HTMLElement;
    fb.hidden = false;
    if (correct) {
      fb.textContent = '✓ Correct.';
      fb.className = 'q-feedback q-feedback--ok';
    } else if (escalationTrap) {
      fb.textContent = '✗ That choice defers authority to a third party — an escalation trap. Try to act within your role first.';
      fb.className = 'q-feedback q-feedback--warn';
    } else {
      fb.textContent = '✗ Incorrect.';
      fb.className = 'q-feedback q-feedback--bad';
    }
  }

  /* ------------------------------- Metric cards ---------------------------- */

  private renderMetrics(): void {
    const m: MetricsSnapshot = this.engine.snapshot();
    this.renderNotLogic(m);
    this.renderEscalation(m);
  }

  private renderNotLogic(m: MetricsSnapshot): void {
    const { total, misses, errorRate } = m.notLogic;
    $('#not-rate').textContent = total ? `${Math.round(errorRate * 100)}%` : '—';
    $('#not-detail').textContent = total
      ? `${misses} missed of ${total} NOT-logic question${total === 1 ? '' : 's'}`
      : 'No NOT-logic questions answered yet';
    // High inverted-logic error → warn; otherwise neutral/success.
    const card = $('#card-not');
    card.classList.toggle('metric--warn', total > 0 && errorRate >= 0.34);
    card.classList.toggle('metric--ok', total > 0 && errorRate < 0.34);
  }

  private renderEscalation(m: MetricsSnapshot): void {
    const { index, totalSituational, escalationSelections, flagged } = m.escalation;
    $('#esc-index').textContent = totalSituational ? `${Math.round(index * 100)}%` : '—';
    $('#esc-detail').textContent = totalSituational
      ? `${escalationSelections} escalation-trap pick${escalationSelections === 1 ? '' : 's'} of ${totalSituational} answers`
      : 'No situational answers yet';
    const card = $('#card-esc');
    card.classList.toggle('metric--warn', flagged); // > 20% → Alert/Warning token
    card.classList.toggle('metric--ok', totalSituational > 0 && !flagged);
    $('#esc-flag').hidden = !flagged;
  }
}

document.addEventListener('DOMContentLoaded', () => new App());
