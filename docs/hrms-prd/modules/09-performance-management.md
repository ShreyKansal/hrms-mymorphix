# Module 9 — Performance Management

**Status:** Draft v1 (pending stakeholder review) · **Release:** Talent
**Depends on:** Module 1 (Core HR — grade/compensation linkage), Module 17 (Workflow Engine)

---

## 1. Module overview

Goal-setting (OKRs/KPIs), continuous feedback, structured review cycles (self/manager/peer/360), calibration, and the linkage from performance outcomes into promotion and compensation decisions (Module 1/6). Phase 2 research found this to be a strong, mature category across most competitors (Keka, Darwinbox, Zoho, greytHR all have credible depth) — differentiation here is less about feature presence and more about avoiding the specific UX failures found (Darwinbox's missing draft-save in reviews, generically "basic" automation).

## 2. Problem statement

Performance-review processes commonly fail not from missing features but from poor process ergonomics — reviews treated as an annual HR compliance exercise disconnected from day-to-day goal tracking, manager review queues that dump many direct reports' worth of work with no prioritisation, and rating processes vulnerable to recency/leniency bias without any calibration support.

## 3. Business objective

Make goal-setting and feedback a continuous, low-friction habit rather than an annual scramble, give managers a manageable review workflow even with many direct reports, and give the organisation a fair, calibrated basis for promotion/compensation decisions with a clear audit trail into those downstream actions.

## 4. User personas

Primary: **Employee** (self-review, goals, continuous feedback), **People Manager** (reviews, ratings, calibration input). Secondary: **Department Head** (calibration sessions), **HR Executive/Administrator** (cycle configuration), **HR Administrator** (bias-control/calibration oversight).

## 5. User needs

Employee needs goals that stay visible and relevant between formal cycles, not just at review time. Manager needs a review queue that doesn't feel like "20 surveys due Friday," with reasonable batching/prioritisation and no lost work from a crash or accidental navigation. Department Head needs a fair, comparable basis for calibration across managers whose individual rating tendencies may differ.

## 6. Primary use cases

Set individual/team goals (cascading from org/department goals); conduct check-ins/1:1s; give/receive continuous feedback; complete self-review, manager review, peer review, 360-degree feedback; participate in calibration; issue performance-improvement plans; view performance history; generate promotion recommendations feeding Module 1.

## 7. Detailed workflows

### 7.1 Review cycle execution

- **Trigger:** Configured review-cycle window opens (annual, semi-annual, quarterly, or custom per Module 22 configuration).
- **Steps:** 1) System instantiates review tasks for all in-scope employees per the cycle's configured components (self-review, manager review, peer review, 360°) 2) Each participant completes their assigned component — **with continuous auto-save**, addressing the specific Darwinbox-evidenced complaint of lost work from missing draft-save 3) On completion of all inputs for an employee, the review becomes visible to the manager for a synthesis/rating step 4) Ratings feed into a calibration session (§7.2) before being finalised 5) Finalised reviews are shared with employees (with a manager discussion step, ideally scheduled/tracked, not just a silent unlock) 6) Cycle closes; performance-history record created.
- **Decision points:** A manager with many direct reports should see a prioritised, batchable queue (e.g., grouped by due date, or bulk-reminder to peers who haven't submitted 360 input) rather than an undifferentiated flat list — directly addressing [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 2's named pain point.
- **Failure handling:** Incomplete peer/360 input past the cycle deadline — configurable: proceed with available input and flag as incomplete, or escalate/extend, not a silent block of the whole cycle for one missing input.
- **Audit events:** `ReviewCycleOpened`, `ReviewCompleted` (per participant/component), `ReviewCycleClosed`.

### 7.2 Calibration

- **Trigger:** All manager ratings for a cycle/department are in, calibration session begins.
- **Steps:** 1) Department Head/HR Administrator views rating distribution across managers within the calibration group (surfacing any manager whose ratings skew notably lenient/harsh relative to peers — a bias-control signal, not an automated correction) 2) Calibration discussion happens (largely a human process); any rating adjustments made during calibration are recorded with the adjusting actor and rationale, distinct from the original manager rating (both preserved, not overwritten) 3) Finalised, calibrated ratings flow to Module 1/6 for promotion/compensation-decision input where applicable.
- **Audit events:** `CalibrationAdjustmentApplied`, with original and calibrated values both retained.

## 8. User stories

**US-1**
As a **People Manager**, I want my review-writing progress saved automatically as I type, so that I never lose work to a browser crash or accidental navigation — directly addressing a specific, named Darwinbox complaint from Phase 2 research.
**Acceptance criteria:** Given a manager is mid-way through writing a review, when their session is interrupted (browser close, navigation away, crash), then their progress is preserved and restored on their next visit without any explicit "save" action required.

**US-2**
As an **Employee**, I want my goals to stay visible and updatable between formal review cycles, so that performance management feels continuous, not just an annual event.
**Acceptance criteria:** Given a goal is set at cycle start, when the employee updates its progress mid-cycle, then the updated status is visible to their manager immediately, not only surfaced at the next formal review.

**US-3**
As a **Department Head**, I want to see rating-distribution patterns across my managers before calibration, so that I can have an informed discussion about consistency rather than discovering skew after ratings are already final.
**Acceptance criteria:** Given multiple managers' ratings are submitted for a calibration group, when the Department Head opens the calibration view, then a distribution comparison across managers is shown before any rating is treated as final.

## 9. Functional requirements

Performance cycles (configurable cadence); goal setting with cascading (organisation → department → individual); KPIs and OKRs; competency frameworks with configurable weightage; continuous check-ins and 1:1 tracking; self-review, manager review, peer review, 360-degree feedback; configurable rating scales; calibration (§7.2) with distribution visibility; promotion-recommendation generation (feeding Module 1 §7.2); development plans; performance-improvement plans (PIPs, with their own tracked timeline and outcome); performance letters (Module 13); performance-history record; review reminders with escalation; performance reports; bias-control considerations (rating-distribution visibility per manager, per §7.2 — explicitly a *signal-surfacing* tool, not an automated bias-correction algorithm, given the risk of a black-box "fix" being worse than transparency).

## 10. Business rules

A promotion recommendation generated from this module does not itself execute a Module 1 promotion — it's a recommendation that still flows through Module 1 §7.2's standard approval-gated Employment Assignment change process (no bypass of that control just because it originated from a performance cycle). PIP outcomes (successful/unsuccessful) should have defined, configurable downstream implications (extension, role change, separation-initiation) rather than dead-ending with no clear next step.

## 11. Validation rules

Goal weightages within a review must sum to a sensible total (typically 100%, configurable); a review cannot be marked complete with mandatory rating fields blank.

## 12. Permission requirements

Employees see their own goals/reviews and, per policy, peer-feedback they've given (not necessarily received-peer-feedback attribution, which is often anonymised — configurable per Module 22). Managers see direct reports' reviews; Department Heads see calibration-group-wide data for their scope (per [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 9).

## 13. Approval workflows

PIP initiation typically requires HR Administrator co-sign-off given its legal/HR sensitivity (Module 17); promotion recommendations route through Module 1's standard approval chain, not a separate one.

## 14. Statuses and state transitions

**Review cycle:** Scheduled → Open → In Progress → Calibration → Closed. **Individual review:** Not Started → In Progress (auto-saved) → Submitted → Manager Review → Calibrated → Shared/Discussed → Finalised. **PIP:** Initiated → In Progress → Successful/Unsuccessful → Closed.

## 15. Record detail-page requirements

Employee performance-history page: goals over time, review-cycle history (each cycle's full record, not overwritten by the next), PIP history if any, promotion/compensation linkage — this is the natural complement to Module 1's Employee Timeline tab, cross-linked rather than duplicated.

## 16. Search, filter and sorting requirements

Manager's review queue filterable/sortable by due date, completion status, direct-report name (addressing US-1's prioritisation need).

## 17. Bulk-action requirements

Bulk reminder-send to incomplete reviewers/peers; bulk cycle-extension for a department if needed.

## 18. Import and export requirements

Performance-history export for a departing employee's record retention (Module 15 coordination); calibration-data export for offline discussion prep if needed.

## 19. Notification requirements

**In-app/email:** cycle opened, review due/overdue (escalating), peer-feedback requested, review shared with employee, PIP initiated/updated. **Mobile push:** review-due reminders, given how often these get missed amid other work.

## 20. Mobile requirements

Goal check-in updates, quick continuous-feedback give/receive, review-due notifications — full long-form review writing is better suited to desktop but should not be blocked on mobile (progressive, not exclusive).

## 21. Reporting requirements

Goal-completion rate, rating-distribution/calibration reports, review-cycle completion rate, PIP outcome tracking, promotion-recommendation-to-actual-promotion conversion rate (a useful process-health metric).

## 22. Audit-log requirements

Every rating submission and calibration adjustment (with both original and adjusted values, per §7.2), every PIP status change — per Phase 11.

## 23. Integration requirements

Module 1 (promotion recommendation → Employment Assignment change), Module 6 (compensation-decision input), Module 13 (performance letters).

## 24. Error, empty, and edge cases

**Error states:** a review cycle configuration with no in-scope employees (misconfiguration, should warn before opening, not silently open an empty cycle). **Empty states:** a new employee mid-cycle (joined after cycle start) — clear proration/inclusion policy needed, not an ambiguous partial review. **Edge cases:** an employee who changes managers mid-cycle (Module 1 §8) — review ownership handoff needs an explicit, defined rule (does the review transfer to the new manager, or does the old manager complete it?), flagged as an open question below rather than assumed.

## 25. Acceptance criteria

Given a calibration adjustment changes an employee's rating, when the employee views their finalised review, then both the original manager rating and the calibrated final rating are visible with context (not a silently altered number that contradicts what the manager discussed with them).

## 26. Dependencies

Module 1, Module 6, Module 13, Module 17.

## 27. Risks

Poorly designed calibration UX risks becoming exactly the "spreadsheet-driven outside the system" workaround flagged as a competitor gap in Phase 2 research (Darwinbox's Department Head persona pain point) — this needs genuine design investment, not a token feature.

## 28. Open questions

- Manager-change-mid-cycle review-ownership rule (§24) — needs a product decision, not left implicit.
- Should peer-feedback be anonymised by default, tenant-configurable, or always attributed? Recommend tenant-configurable given how much company culture varies here — flagged for Module 22 design.

## 29. Release scope

**MVP:** goal-setting/OKRs, self/manager review, review cycles with auto-save, basic calibration (distribution visibility), PIPs, promotion-recommendation generation, performance history.
**Later phase:** 360-degree feedback at full depth, AI-assisted review-writing suggestions (Module 25, explicitly human-reviewed per that module's design principle), advanced bias-detection analytics.
**Out of scope:** this module does not run compensation-benchmarking/market-data analysis (that would require external salary-survey data licensing, out of scope for this PRD).
