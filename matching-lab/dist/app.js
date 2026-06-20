"use strict";
/* dist/app.js — compiled bundle of src/*.ts (type annotations erased, modules inlined).
 * Regenerate with `npx tsc` (see tsconfig.json). Hand-faithful to the TypeScript source so the
 * module runs by double-clicking index.html with no build step. */
(function () {
  /* ============================ analytics ============================ */
  var ESCALATION_THRESHOLD = 0.20;
  function zero() { return { notTotal: 0, notMisses: 0, situationalTotal: 0, escalationSelections: 0 }; }

  function InMemoryStore() { this.data = null; }
  InMemoryStore.prototype.load = function () { return this.data ? Object.assign({}, this.data) : null; };
  InMemoryStore.prototype.save = function (d) { this.data = Object.assign({}, d); };
  InMemoryStore.prototype.clear = function () { this.data = null; };

  // Opt-in only; not used by default (honors the no-localStorage rule).
  function LocalStorageStore(key) { this.key = key || 'pmp.matchinglab.metrics'; }
  LocalStorageStore.prototype.load = function () {
    try { var raw = window.localStorage.getItem(this.key); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  };
  LocalStorageStore.prototype.save = function (d) {
    try { window.localStorage.setItem(this.key, JSON.stringify(d)); } catch (e) {}
  };
  LocalStorageStore.prototype.clear = function () {
    try { window.localStorage.removeItem(this.key); } catch (e) {}
  };

  function BehavioralAnalyticsEngine(store) {
    this.store = store || new InMemoryStore();
    this.data = this.store.load() || zero();
  }
  BehavioralAnalyticsEngine.prototype.record = function (ev) {
    this.data.situationalTotal += 1;
    if (ev.questionTags.indexOf('inverted-not') !== -1) {
      this.data.notTotal += 1;
      if (!ev.correct) this.data.notMisses += 1;
    }
    if (ev.selectedOptionTags.indexOf('escalation-trap') !== -1) {
      this.data.escalationSelections += 1;
    }
    this.store.save(this.data);
  };
  BehavioralAnalyticsEngine.prototype.snapshot = function () {
    var d = this.data;
    var errorRate = d.notTotal > 0 ? d.notMisses / d.notTotal : 0;
    var index = d.situationalTotal > 0 ? d.escalationSelections / d.situationalTotal : 0;
    return {
      notLogic: { total: d.notTotal, misses: d.notMisses, errorRate: errorRate },
      escalation: {
        totalSituational: d.situationalTotal,
        escalationSelections: d.escalationSelections,
        index: index,
        flagged: index > ESCALATION_THRESHOLD
      },
      updatedAt: Date.now()
    };
  };
  BehavioralAnalyticsEngine.prototype.reset = function () { this.data = zero(); this.store.clear(); };

  /* ============================ matching lab ============================ */
  function MatchingLab(bankEl, targetsEl, onResult) {
    this.bankEl = bankEl;
    this.targetsEl = targetsEl;
    this.onResult = onResult || function () {};
    this.set = null;
    this.placement = {};
  }
  MatchingLab.prototype.load = function (set) {
    this.set = set;
    this.placement = {};
    set.items.forEach(function (i) { this.placement[i.id] = null; }, this);
    this.renderBank(set.items);
    this.renderTargets(set);
  };
  MatchingLab.prototype.reset = function () { if (this.set) this.load(this.set); };
  MatchingLab.prototype.score = function () {
    if (!this.set) return 0;
    var correct = 0, self = this;
    this.set.items.forEach(function (item) { if (self.placement[item.id] === item.targetId) correct += 1; });
    return this.set.items.length ? correct / this.set.items.length : 0;
  };
  MatchingLab.prototype.renderBank = function (items) {
    this.bankEl.innerHTML = '';
    items.forEach(function (item) { this.bankEl.appendChild(this.createChip(item)); }, this);
    this.makeDroppable(this.bankEl, '__bank__');
  };
  MatchingLab.prototype.renderTargets = function (set) {
    this.targetsEl.innerHTML = '';
    set.targets.forEach(function (target) {
      var zone = document.createElement('div');
      zone.className = 'drop-zone';
      zone.dataset.zone = target.id;
      zone.setAttribute('role', 'group');
      zone.setAttribute('aria-label', 'Drop zone: ' + target.label);
      zone.innerHTML =
        '<header class="drop-zone__head">' +
        '<span class="drop-zone__title">' + target.label + '</span>' +
        (target.description ? '<span class="drop-zone__desc">' + target.description + '</span>' : '') +
        '</header><div class="drop-zone__slots" data-slots></div>';
      this.makeDroppable(zone.querySelector('[data-slots]'), target.id);
      this.targetsEl.appendChild(zone);
    }, this);
  };
  MatchingLab.prototype.createChip = function (item) {
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.draggable = true;
    chip.dataset.itemId = item.id;
    chip.dataset.target = item.targetId; // correctness evaluated against this attribute
    chip.textContent = item.label;
    chip.setAttribute('aria-grabbed', 'false');
    var self = this;
    chip.addEventListener('dragstart', function (e) { self.onDragStart(e, chip); });
    chip.addEventListener('dragend', function () { chip.classList.remove('chip--dragging'); });
    return chip;
  };
  MatchingLab.prototype.onDragStart = function (e, chip) {
    var id = chip.dataset.itemId || '';
    if (e.dataTransfer) { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; }
    chip.classList.add('chip--dragging');
    chip.setAttribute('aria-grabbed', 'true');
    chip.classList.remove('chip--correct', 'chip--incorrect');
  };
  MatchingLab.prototype.makeDroppable = function (container, zoneId) {
    var self = this;
    container.addEventListener('dragover', function (e) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      container.classList.add('drop-hover');
    });
    container.addEventListener('dragleave', function () { container.classList.remove('drop-hover'); });
    container.addEventListener('drop', function (e) { self.onDrop(e, container, zoneId); });
  };
  MatchingLab.prototype.onDrop = function (e, container, zoneId) {
    e.preventDefault();
    container.classList.remove('drop-hover');
    var itemId = e.dataTransfer ? e.dataTransfer.getData('text/plain') : '';
    if (!itemId || !this.set) return;
    var chip = document.querySelector('[data-item-id="' + itemId + '"]');
    var item = null;
    this.set.items.forEach(function (i) { if (i.id === itemId) item = i; });
    if (!chip || !item) return;

    container.appendChild(chip);
    chip.setAttribute('aria-grabbed', 'false');

    if (zoneId === '__bank__') {
      this.placement[itemId] = null;
      chip.classList.remove('chip--correct', 'chip--incorrect');
      return;
    }
    this.placement[itemId] = zoneId;
    var outcome = zoneId === item.targetId ? 'correct' : 'incorrect';
    chip.classList.toggle('chip--correct', outcome === 'correct');
    chip.classList.toggle('chip--incorrect', outcome === 'incorrect');
    this.onResult({ itemId: itemId, droppedTargetId: zoneId, expectedTargetId: item.targetId, outcome: outcome });
  };

  /* ============================ data ============================ */
  var MATCH_SETS = [
    {
      id: 'risk-responses', title: 'Risk Response Strategies',
      prompt: 'Drag each response strategy into the risk type it applies to.',
      targets: [
        { id: 'threat', label: 'Threats (negative risk)', description: 'Reduce downside' },
        { id: 'opportunity', label: 'Opportunities (positive risk)', description: 'Increase upside' }
      ],
      items: [
        { id: 'avoid', label: 'Avoid', targetId: 'threat' },
        { id: 'mitigate', label: 'Mitigate', targetId: 'threat' },
        { id: 'transfer', label: 'Transfer', targetId: 'threat' },
        { id: 'exploit', label: 'Exploit', targetId: 'opportunity' },
        { id: 'enhance', label: 'Enhance', targetId: 'opportunity' },
        { id: 'share', label: 'Share', targetId: 'opportunity' }
      ]
    },
    {
      id: 'pred-vs-adaptive', title: 'Predictive vs. Adaptive Artifacts',
      prompt: 'Sort each artifact or practice under its development approach.',
      targets: [
        { id: 'predictive', label: 'Predictive', description: 'Plan-driven' },
        { id: 'adaptive', label: 'Adaptive', description: 'Change-driven' }
      ],
      items: [
        { id: 'wbs', label: 'WBS & scope baseline', targetId: 'predictive' },
        { id: 'ccb', label: 'Change control board', targetId: 'predictive' },
        { id: 'gantt', label: 'Gantt chart', targetId: 'predictive' },
        { id: 'backlog', label: 'Product backlog', targetId: 'adaptive' },
        { id: 'sprint', label: 'Timeboxed iteration', targetId: 'adaptive' },
        { id: 'burndown', label: 'Burndown chart', targetId: 'adaptive' }
      ]
    }
  ];
  var DRILL = [
    { id: 'd1', stem: 'A key stakeholder is resistant and undermining the project in meetings. What should the PM do FIRST?', tags: [],
      options: [
        { text: 'Meet with them to understand concerns and address the root cause', correct: true, tags: [] },
        { text: 'Escalate to the sponsor to have them removed', correct: false, tags: ['escalation-trap'] },
        { text: 'Exclude them from future communications', correct: false, tags: [] },
        { text: 'Ignore them and focus on supportive stakeholders', correct: false, tags: [] }
      ] },
    { id: 'd2', stem: 'Which of the following is NOT an appropriate first action when a risk event occurs during execution?', tags: ['inverted-not'],
      options: [
        { text: 'Implement the planned risk response', correct: false, tags: [] },
        { text: 'Record it in the issue log and act on it', correct: false, tags: [] },
        { text: 'Immediately escalate every occurrence to the steering committee', correct: true, tags: ['escalation-trap'] },
        { text: 'Continue monitoring response effectiveness', correct: false, tags: [] }
      ] },
    { id: 'd3', stem: 'A team member lacks a skill needed for upcoming work. What is the BEST proactive response?', tags: [],
      options: [
        { text: 'Arrange coaching, mentoring, or training to develop the skill', correct: true, tags: [] },
        { text: 'Escalate to the resource manager to swap the person out', correct: false, tags: ['escalation-trap'] },
        { text: 'Do the work yourself to avoid delay', correct: false, tags: [] },
        { text: 'Lower the quality requirements', correct: false, tags: [] }
      ] },
    { id: 'd4', stem: 'Which option is NOT a valid threat response strategy in the PMBOK 8th Edition?', tags: ['inverted-not'],
      options: [
        { text: 'Avoid', correct: false, tags: [] },
        { text: 'Transfer', correct: false, tags: [] },
        { text: 'Exploit', correct: true, tags: [] },
        { text: 'Mitigate', correct: false, tags: [] }
      ] }
  ];

  /* ============================ app (composition root) ============================ */
  function $(sel) { var el = document.querySelector(sel); if (!el) throw new Error('Missing element: ' + sel); return el; }

  function App() {
    this.engine = new BehavioralAnalyticsEngine(new InMemoryStore()); // [STORAGE] swap for LocalStorageStore to persist
    var self = this;
    this.lab = new MatchingLab($('#bank'), $('#targets'), function () { self.renderLabScore(); });
    this.setIndex = 0;
    this.bindControls();
    this.loadSet(0);
    this.renderDrill();
    this.renderMetrics();
  }
  App.prototype.bindControls = function () {
    var self = this;
    $('#set-switch').addEventListener('click', function () {
      self.setIndex = (self.setIndex + 1) % MATCH_SETS.length;
      self.loadSet(self.setIndex);
    });
    $('#lab-reset').addEventListener('click', function () { self.lab.reset(); self.renderLabScore(); });
    $('#metrics-reset').addEventListener('click', function () {
      self.engine.reset(); self.renderDrill(); self.renderMetrics();
    });
  };
  App.prototype.loadSet = function (i) {
    var set = MATCH_SETS[i];
    this.lab.load(set);
    $('#set-title').textContent = set.title;
    $('#set-prompt').textContent = set.prompt;
    this.renderLabScore();
  };
  App.prototype.renderLabScore = function () {
    $('#lab-score').textContent = Math.round(this.lab.score() * 100) + '% placed correctly';
  };
  App.prototype.renderDrill = function () {
    var host = $('#drill'); host.innerHTML = '';
    DRILL.forEach(function (q) { host.appendChild(this.renderQuestion(q)); }, this);
  };
  App.prototype.renderQuestion = function (q) {
    var self = this;
    var card = document.createElement('div');
    card.className = 'q-card';
    var isNot = q.tags.indexOf('inverted-not') !== -1;
    card.innerHTML =
      '<p class="q-stem">' + q.stem + ' ' + (isNot ? '<span class="q-tag">NOT-logic</span>' : '') + '</p>' +
      '<div class="q-options" role="group"></div>' +
      '<p class="q-feedback" hidden></p>';
    var opts = card.querySelector('.q-options');
    q.options.forEach(function (opt, idx) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'q-option'; btn.textContent = opt.text;
      btn.addEventListener('click', function () {
        if (card.dataset.answered) return;
        card.dataset.answered = 'true';
        self.engine.record({ questionId: q.id, questionTags: q.tags, correct: opt.correct, selectedOptionTags: opt.tags });
        self.paintAnswer(opts, idx, q);
        self.showFeedback(card, opt.correct, opt.tags.indexOf('escalation-trap') !== -1);
        self.renderMetrics();
      });
      opts.appendChild(btn);
    });
    return card;
  };
  App.prototype.paintAnswer = function (opts, chosen, q) {
    Array.prototype.forEach.call(opts.children, function (el, i) {
      el.disabled = true;
      if (q.options[i].correct) el.classList.add('q-option--correct');
      else if (i === chosen) el.classList.add('q-option--wrong');
    });
  };
  App.prototype.showFeedback = function (card, correct, escalationTrap) {
    var fb = card.querySelector('.q-feedback'); fb.hidden = false;
    if (correct) { fb.textContent = '✓ Correct.'; fb.className = 'q-feedback q-feedback--ok'; }
    else if (escalationTrap) {
      fb.textContent = '✗ That choice defers authority to a third party — an escalation trap. Try to act within your role first.';
      fb.className = 'q-feedback q-feedback--warn';
    } else { fb.textContent = '✗ Incorrect.'; fb.className = 'q-feedback q-feedback--bad'; }
  };
  App.prototype.renderMetrics = function () {
    var m = this.engine.snapshot();
    this.renderNotLogic(m); this.renderEscalation(m);
  };
  App.prototype.renderNotLogic = function (m) {
    var n = m.notLogic;
    $('#not-rate').textContent = n.total ? Math.round(n.errorRate * 100) + '%' : '—';
    $('#not-detail').textContent = n.total
      ? n.misses + ' missed of ' + n.total + ' NOT-logic question' + (n.total === 1 ? '' : 's')
      : 'No NOT-logic questions answered yet';
    var card = $('#card-not');
    card.classList.toggle('metric--warn', n.total > 0 && n.errorRate >= 0.34);
    card.classList.toggle('metric--ok', n.total > 0 && n.errorRate < 0.34);
  };
  App.prototype.renderEscalation = function (m) {
    var e = m.escalation;
    $('#esc-index').textContent = e.totalSituational ? Math.round(e.index * 100) + '%' : '—';
    $('#esc-detail').textContent = e.totalSituational
      ? e.escalationSelections + ' escalation-trap pick' + (e.escalationSelections === 1 ? '' : 's') + ' of ' + e.totalSituational + ' answers'
      : 'No situational answers yet';
    var card = $('#card-esc');
    card.classList.toggle('metric--warn', e.flagged);
    card.classList.toggle('metric--ok', e.totalSituational > 0 && !e.flagged);
    $('#esc-flag').hidden = !e.flagged;
  };

  document.addEventListener('DOMContentLoaded', function () { new App(); });
})();
