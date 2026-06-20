/**
 * matching.ts — Drag-and-Drop Matching Lab controller.
 *
 * Uses native HTML5 Drag and Drop (dragstart / dragover / dragleave / drop) only — no
 * libraries. Correctness is evaluated against each chip's `data-target` attribute the instant
 * it is dropped, and the chip transitions to the Success or Error visual state via CSS classes
 * (the actual colors/transitions live in styles.css, keeping behavior and presentation separate).
 */

import { MatchSet, MatchResultEvent, DragItem } from './types';

type ResultListener = (event: MatchResultEvent) => void;

export class MatchingLab {
  private set: MatchSet | null = null;
  /** Tracks where each item currently lives so re-drops and scoring stay consistent. */
  private placement = new Map<string, string | null>();

  constructor(
    private readonly bankEl: HTMLElement,
    private readonly targetsEl: HTMLElement,
    private readonly onResult: ResultListener = () => {},
  ) {}

  /** Render a fresh exercise: chips into the bank, empty drop zones on the right. */
  load(set: MatchSet): void {
    this.set = set;
    this.placement = new Map(set.items.map((i) => [i.id, null]));
    this.renderBank(set.items);
    this.renderTargets(set);
  }

  /** Restore every chip to the bank and clear all evaluation states. */
  reset(): void {
    if (this.set) this.load(this.set);
  }

  /** Fraction (0..1) of items currently placed in their correct zone. */
  score(): number {
    if (!this.set) return 0;
    let correct = 0;
    for (const item of this.set.items) {
      if (this.placement.get(item.id) === item.targetId) correct += 1;
    }
    return this.set.items.length ? correct / this.set.items.length : 0;
  }

  /* ------------------------------- Rendering -------------------------------- */

  private renderBank(items: readonly DragItem[]): void {
    this.bankEl.innerHTML = '';
    items.forEach((item) => this.bankEl.appendChild(this.createChip(item)));
    this.makeDroppable(this.bankEl, '__bank__');
  }

  private renderTargets(set: MatchSet): void {
    this.targetsEl.innerHTML = '';
    set.targets.forEach((target) => {
      const zone = document.createElement('div');
      zone.className = 'drop-zone';
      zone.dataset.zone = target.id;
      zone.setAttribute('role', 'group');
      zone.setAttribute('aria-label', `Drop zone: ${target.label}`);
      zone.innerHTML = `
        <header class="drop-zone__head">
          <span class="drop-zone__title">${target.label}</span>
          ${target.description ? `<span class="drop-zone__desc">${target.description}</span>` : ''}
        </header>
        <div class="drop-zone__slots" data-slots></div>`;
      this.makeDroppable(zone.querySelector('[data-slots]') as HTMLElement, target.id);
      this.targetsEl.appendChild(zone);
    });
  }

  private createChip(item: DragItem): HTMLElement {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.draggable = true;
    chip.dataset.itemId = item.id;
    chip.dataset.target = item.targetId; // correctness is evaluated against this attribute
    chip.textContent = item.label;
    chip.setAttribute('aria-grabbed', 'false');

    chip.addEventListener('dragstart', (e) => this.onDragStart(e, chip));
    chip.addEventListener('dragend', () => chip.classList.remove('chip--dragging'));
    return chip;
  }

  /* ----------------------------- DnD handlers ------------------------------- */

  private onDragStart(e: DragEvent, chip: HTMLElement): void {
    const id = chip.dataset.itemId ?? '';
    e.dataTransfer?.setData('text/plain', id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    chip.classList.add('chip--dragging');
    chip.setAttribute('aria-grabbed', 'true');
    // Clear any prior evaluation state while the chip is in flight.
    chip.classList.remove('chip--correct', 'chip--incorrect');
  }

  /** Wire dragover/dragleave/drop on any container that can accept chips. */
  private makeDroppable(container: HTMLElement, zoneId: string): void {
    container.addEventListener('dragover', (e) => {
      e.preventDefault(); // required to allow a drop
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      container.classList.add('drop-hover');
    });
    container.addEventListener('dragleave', () => container.classList.remove('drop-hover'));
    container.addEventListener('drop', (e) => this.onDrop(e, container, zoneId));
  }

  private onDrop(e: DragEvent, container: HTMLElement, zoneId: string): void {
    e.preventDefault();
    container.classList.remove('drop-hover');
    const itemId = e.dataTransfer?.getData('text/plain');
    if (!itemId || !this.set) return;

    const chip = this.bankElOrTargets(itemId);
    const item = this.set.items.find((i) => i.id === itemId);
    if (!chip || !item) return;

    container.appendChild(chip);
    chip.setAttribute('aria-grabbed', 'false');

    // Dropping back into the bank is a "reset" of that chip, not a graded action.
    if (zoneId === '__bank__') {
      this.placement.set(itemId, null);
      chip.classList.remove('chip--correct', 'chip--incorrect');
      return;
    }

    this.placement.set(itemId, zoneId);
    const outcome = zoneId === item.targetId ? 'correct' : 'incorrect';
    chip.classList.toggle('chip--correct', outcome === 'correct');
    chip.classList.toggle('chip--incorrect', outcome === 'incorrect');

    this.onResult({
      itemId,
      droppedTargetId: zoneId,
      expectedTargetId: item.targetId,
      outcome,
    });
  }

  /** Locate a chip element anywhere in the lab by its item id. */
  private bankElOrTargets(itemId: string): HTMLElement | null {
    return (
      this.bankEl.parentElement?.querySelector<HTMLElement>(`[data-item-id="${itemId}"]`) ??
      document.querySelector<HTMLElement>(`[data-item-id="${itemId}"]`)
    );
  }
}
