/**
 * types.ts — Structural interfaces for the Matching Lab and Behavioral Analytics Engine.
 *
 * Every cross-module contract lives here so the matching UI, the analytics engine, and the
 * persistence layer stay decoupled and independently testable.
 */

/* ----------------------------- Drag & Drop model ----------------------------- */

/** A single draggable chip in the bank. `targetId` is the drop zone it *correctly* belongs to. */
export interface DragItem {
  readonly id: string;
  readonly label: string;
  /** Id of the DropTarget this item is correctly matched to. */
  readonly targetId: string;
  /** One-line rationale revealed after evaluation. */
  readonly rationale?: string;
}

/** A drop zone on the right-hand side that accepts one or more DragItems. */
export interface DropTarget {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

/** A complete, swappable matching exercise. */
export interface MatchSet {
  readonly id: string;
  readonly title: string;
  readonly prompt: string;
  readonly targets: readonly DropTarget[];
  readonly items: readonly DragItem[];
}

export type MatchOutcome = 'correct' | 'incorrect';

/** Emitted every time an item is dropped into a zone. */
export interface MatchResultEvent {
  readonly itemId: string;
  readonly droppedTargetId: string;
  readonly expectedTargetId: string;
  readonly outcome: MatchOutcome;
}

/* --------------------------- Behavioral analytics ---------------------------- */

/** Tags carried by a situational question (e.g. inverted-logic items). */
export type QuestionTag = 'inverted-not' | (string & {});

/** Tags carried by an individual answer option (e.g. authority-deferral traps). */
export type OptionTag = 'escalation-trap' | (string & {});

/** One answered situational question, fed into the analytics engine. */
export interface SituationalAnswerEvent {
  readonly questionId: string;
  readonly questionTags: readonly QuestionTag[];
  readonly correct: boolean;
  readonly selectedOptionTags: readonly OptionTag[];
}

/** "NOT" / inverted-logic error tracking. */
export interface NotLogicMetric {
  readonly total: number;
  readonly misses: number;
  /** misses ÷ total, in the range 0..1. */
  readonly errorRate: number;
}

/** Authority-deferral ("escalation") tendency tracking. */
export interface EscalationMetric {
  readonly totalSituational: number;
  readonly escalationSelections: number;
  /** escalationSelections ÷ totalSituational, in the range 0..1. */
  readonly index: number;
  /** True once `index` exceeds ESCALATION_THRESHOLD — signals over-deferral of authority. */
  readonly flagged: boolean;
}

export interface MetricsSnapshot {
  readonly notLogic: NotLogicMetric;
  readonly escalation: EscalationMetric;
  readonly updatedAt: number;
}

/* ------------------------------- Persistence --------------------------------- */

/** The minimal numeric state the engine persists between sessions. */
export interface PersistedMetrics {
  notTotal: number;
  notMisses: number;
  situationalTotal: number;
  escalationSelections: number;
}

/**
 * Pluggable storage contract. The default implementation is in-memory (no browser storage),
 * honoring the platform's "no localStorage/sessionStorage" rule; a LocalStorage implementation
 * is provided for opt-in cross-session persistence.
 */
export interface MetricsStore {
  load(): PersistedMetrics | null;
  save(data: PersistedMetrics): void;
  clear(): void;
}
