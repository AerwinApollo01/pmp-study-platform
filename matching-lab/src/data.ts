/**
 * data.ts — Sample PMP content for the module.
 *
 * Matching sets are unambiguous by design (each chip belongs to exactly one zone) so the lab
 * grades cleanly. The situational drill carries the `inverted-not` and `escalation-trap` tags
 * the Behavioral Analytics Engine watches for.
 */

import { MatchSet } from './types';

export const MATCH_SETS: readonly MatchSet[] = [
  {
    id: 'risk-responses',
    title: 'Risk Response Strategies',
    prompt: 'Drag each response strategy into the risk type it applies to.',
    targets: [
      { id: 'threat', label: 'Threats (negative risk)', description: 'Reduce downside' },
      { id: 'opportunity', label: 'Opportunities (positive risk)', description: 'Increase upside' },
    ],
    items: [
      { id: 'avoid', label: 'Avoid', targetId: 'threat', rationale: 'Eliminate the threat entirely.' },
      { id: 'mitigate', label: 'Mitigate', targetId: 'threat', rationale: 'Lower probability/impact of a threat.' },
      { id: 'transfer', label: 'Transfer', targetId: 'threat', rationale: 'Shift threat impact to a third party (e.g. insurance).' },
      { id: 'exploit', label: 'Exploit', targetId: 'opportunity', rationale: 'Ensure the opportunity is realized.' },
      { id: 'enhance', label: 'Enhance', targetId: 'opportunity', rationale: 'Increase probability/impact of an opportunity.' },
      { id: 'share', label: 'Share', targetId: 'opportunity', rationale: 'Allocate the opportunity to a partner best able to capture it.' },
    ],
  },
  {
    id: 'pred-vs-adaptive',
    title: 'Predictive vs. Adaptive Artifacts',
    prompt: 'Sort each artifact or practice under its development approach.',
    targets: [
      { id: 'predictive', label: 'Predictive', description: 'Plan-driven' },
      { id: 'adaptive', label: 'Adaptive', description: 'Change-driven' },
    ],
    items: [
      { id: 'wbs', label: 'WBS & scope baseline', targetId: 'predictive' },
      { id: 'ccb', label: 'Change control board', targetId: 'predictive' },
      { id: 'gantt', label: 'Gantt chart', targetId: 'predictive' },
      { id: 'backlog', label: 'Product backlog', targetId: 'adaptive' },
      { id: 'sprint', label: 'Timeboxed iteration', targetId: 'adaptive' },
      { id: 'burndown', label: 'Burndown chart', targetId: 'adaptive' },
    ],
  },
];

/* ------------------------------- Situational drill ------------------------------- */

export interface DrillOption {
  readonly text: string;
  readonly correct: boolean;
  readonly tags: readonly string[]; // e.g. ['escalation-trap']
}

export interface DrillQuestion {
  readonly id: string;
  readonly stem: string;
  readonly tags: readonly string[]; // e.g. ['inverted-not']
  readonly options: readonly DrillOption[];
}

export const DRILL: readonly DrillQuestion[] = [
  {
    id: 'd1',
    stem: 'A key stakeholder is resistant and undermining the project in meetings. What should the PM do FIRST?',
    tags: [],
    options: [
      { text: 'Meet with them to understand concerns and address the root cause', correct: true, tags: [] },
      { text: 'Escalate to the sponsor to have them removed', correct: false, tags: ['escalation-trap'] },
      { text: 'Exclude them from future communications', correct: false, tags: [] },
      { text: 'Ignore them and focus on supportive stakeholders', correct: false, tags: [] },
    ],
  },
  {
    id: 'd2',
    stem: 'Which of the following is NOT an appropriate first action when a risk event occurs during execution?',
    tags: ['inverted-not'],
    options: [
      { text: 'Implement the planned risk response', correct: false, tags: [] },
      { text: 'Record it in the issue log and act on it', correct: false, tags: [] },
      { text: 'Immediately escalate every occurrence to the steering committee', correct: true, tags: ['escalation-trap'] },
      { text: 'Continue monitoring response effectiveness', correct: false, tags: [] },
    ],
  },
  {
    id: 'd3',
    stem: 'A team member lacks a skill needed for upcoming work. What is the BEST proactive response?',
    tags: [],
    options: [
      { text: 'Arrange coaching, mentoring, or training to develop the skill', correct: true, tags: [] },
      { text: 'Escalate to the resource manager to swap the person out', correct: false, tags: ['escalation-trap'] },
      { text: 'Do the work yourself to avoid delay', correct: false, tags: [] },
      { text: 'Lower the quality requirements', correct: false, tags: [] },
    ],
  },
  {
    id: 'd4',
    stem: 'Which option is NOT a valid threat response strategy in the PMBOK 8th Edition?',
    tags: ['inverted-not'],
    options: [
      { text: 'Avoid', correct: false, tags: [] },
      { text: 'Transfer', correct: false, tags: [] },
      { text: 'Exploit', correct: true, tags: [] },
      { text: 'Mitigate', correct: false, tags: [] },
    ],
  },
];
