/**
 * analytics.ts — Behavioral Analytics Engine.
 *
 * Tracks two high-yield, stress-bound study habits and exposes them as derived metrics:
 *   1. "NOT" Logic Error Rate — misses on inverted-logic situational questions.
 *   2. Escalation Index — frequency of choosing answers that defer authority to third parties.
 *
 * The engine is storage-agnostic: it depends only on the MetricsStore interface, so the same
 * code runs against in-memory state (default) or LocalStorage (opt-in) without modification.
 */

import {
  MetricsStore,
  PersistedMetrics,
  SituationalAnswerEvent,
  MetricsSnapshot,
} from './types';

/** Escalation Index above this fraction (20%) is flagged as a judgment gap. */
export const ESCALATION_THRESHOLD = 0.20;

function zero(): PersistedMetrics {
  return { notTotal: 0, notMisses: 0, situationalTotal: 0, escalationSelections: 0 };
}

/** Default store — keeps state in a closure variable only; nothing touches the browser. */
export class InMemoryStore implements MetricsStore {
  private data: PersistedMetrics | null = null;
  load(): PersistedMetrics | null {
    return this.data ? { ...this.data } : null;
  }
  save(data: PersistedMetrics): void {
    this.data = { ...data };
  }
  clear(): void {
    this.data = null;
  }
}

/**
 * Opt-in cross-session store. NOT used by default — instantiate explicitly if you want
 * metrics to survive a refresh and accept the localStorage dependency.
 */
export class LocalStorageStore implements MetricsStore {
  constructor(private readonly key = 'pmp.matchinglab.metrics') {}
  load(): PersistedMetrics | null {
    try {
      const raw = window.localStorage.getItem(this.key);
      return raw ? (JSON.parse(raw) as PersistedMetrics) : null;
    } catch {
      return null;
    }
  }
  save(data: PersistedMetrics): void {
    try {
      window.localStorage.setItem(this.key, JSON.stringify(data));
    } catch {
      /* storage disabled / full — degrade silently to no persistence */
    }
  }
  clear(): void {
    try {
      window.localStorage.removeItem(this.key);
    } catch {
      /* ignore */
    }
  }
}

export class BehavioralAnalyticsEngine {
  private data: PersistedMetrics;

  constructor(private readonly store: MetricsStore = new InMemoryStore()) {
    this.data = store.load() ?? zero();
  }

  /** Ingest one answered situational question and persist the updated counters. */
  record(event: SituationalAnswerEvent): void {
    this.data.situationalTotal += 1;

    if (event.questionTags.includes('inverted-not')) {
      this.data.notTotal += 1;
      if (!event.correct) this.data.notMisses += 1;
    }

    if (event.selectedOptionTags.includes('escalation-trap')) {
      this.data.escalationSelections += 1;
    }

    this.store.save(this.data);
  }

  /** Compute the two derived metrics. Pure read — safe to call on every render. */
  snapshot(): MetricsSnapshot {
    const { notTotal, notMisses, situationalTotal, escalationSelections } = this.data;
    const errorRate = notTotal > 0 ? notMisses / notTotal : 0;
    const index = situationalTotal > 0 ? escalationSelections / situationalTotal : 0;

    return {
      notLogic: { total: notTotal, misses: notMisses, errorRate },
      escalation: {
        totalSituational: situationalTotal,
        escalationSelections,
        index,
        flagged: index > ESCALATION_THRESHOLD,
      },
      updatedAt: Date.now(),
    };
  }

  /** Wipe all tracked behavior (and clear the backing store). */
  reset(): void {
    this.data = zero();
    this.store.clear();
  }
}
