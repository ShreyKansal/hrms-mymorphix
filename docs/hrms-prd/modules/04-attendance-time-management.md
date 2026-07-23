# Module 4 — Attendance and Time Management

**Status:** Draft v1 (pending stakeholder review) · **Release:** HR Operations
**Depends on:** Module 1 (Core HR — Shift Group/Attendance Policy Group assignment, [05-organisation-data-model.md](../05-organisation-data-model.md) §3), Module 17 (Workflow Engine)

---

## 1. Module overview

Captures and manages when people work: check-in/out across web/mobile/biometric/kiosk, shift scheduling, regularisation of exceptions, overtime, comp-off, work-from-home/on-duty/field attendance, monthly finalisation, and the handoff of clean attendance data to Payroll. Market research (§8, cross-cutting theme) found attendance-to-payroll reconciliation to be one of the most consistently weak points across every competitor researched — this module's design treats that handoff as a first-class concern, not an afterthought.

## 2. Problem statement

Attendance data is inherently messy (missed punches, device failures, legitimate exceptions like field work) and payroll needs it clean and finalised by a hard deadline every cycle. Competitor research found recurring complaints about biometric-sync unreliability (Keka), attendance-vs-payroll reconciliation overhead (a near-universal theme), and attendance modules gated behind expensive add-ons that fragment the "all-in-one" promise (greytHR's ₹140/user/month GPS tracking add-on).

## 3. Business objective

Give employees frictionless, multiple-mode attendance capture; give managers fast, low-friction exception handling; give Payroll a clean, locked, auditable attendance dataset by cutoff every cycle, with zero manual reconciliation required for the common case.

## 4. User personas

Primary: **Employee** (daily check-in/out, highest-frequency mobile action per [04-personas-and-roles.md](../04-personas-and-roles.md)), **People Manager** (regularisation approval, team calendar). Secondary: **HR Executive/Administrator** (policy configuration, exception handling at scale), **Payroll Executive** (consumes finalised attendance for payroll input).

## 5. User needs

Employee needs a fast, reliable way to mark attendance that works even with imperfect connectivity or device access, and an easy path to fix a genuine mistake (forgot to punch out) without a bureaucratic ordeal. Manager needs to see team coverage at a glance and clear exceptions quickly, not wade through raw punch logs. Payroll needs certainty that "finalised" attendance data won't change underneath them mid-run.

## 6. Primary use cases

Check in/out (web, mobile, biometric, kiosk, geo-fenced, selfie); view own attendance/timesheet; request regularisation; request work-from-home/on-duty/field attendance; manager approves/rejects exception requests; HR configures shift/attendance policies; monthly attendance finalisation and lock; payroll sync handoff; project/billable timesheet tracking (for services-oriented tenants).

## 7. Detailed workflows

### 7.1 Daily check-in/out (standard case)

- **Trigger:** Employee opens web/mobile app or uses a biometric/kiosk device at arrival/departure.
- **Preconditions:** Employee is Active (Module 1 §14); within permitted geo-fence/IP range if policy requires.
- **Steps:** 1) Employee initiates check-in (tap/punch/selfie-capture per configured mode) 2) System validates location/IP/time against policy 3) Punch recorded with timestamp, method, and (if applicable) geo-coordinates/selfie image 4) At day-end, system computes hours worked, late-arrival/early-departure flags per Attendance Policy Group grace-period rules, and any auto-detected exception (missing punch, insufficient hours).
- **Decision points:** Outside geo-fence → block with a clear message and (if policy allows) offer an on-duty/field-attendance request as the alternative path, not a dead end.
- **System actions:** Auto-flag exceptions for regularisation; do not auto-reject — flagging, not blocking, is the default posture (a missed punch is common and shouldn't require escalation by default).
- **Notifications:** None for a normal successful punch (avoid notification fatigue — Phase 11/Module 18 principle); exception flag surfaces in the employee's own regularisation queue.
- **Audit events:** Every punch recorded immutably (method, timestamp, location metadata) — this raw log is the evidentiary base for any later regularisation/dispute.

### 7.2 Attendance regularisation

- **Trigger:** Employee has a flagged exception (missing punch, late arrival beyond grace period) or proactively requests a correction.
- **Preconditions:** Within the configured regularisation window (e.g., must be requested within N days of the exception, and before monthly lock — see §7.3).
- **Actor:** Employee (initiates), Manager (approves).
- **Steps:** 1) Employee selects the exception date, provides the correct time(s) and a reason 2) Request routed to manager (default) or a configured approver 3) Manager reviews against team calendar/context and approves/rejects 4) On approval, attendance record updated; original raw punch data is preserved (not overwritten) with the regularised value layered on top, per the same "supersede, don't erase" principle as [05](../05-organisation-data-model.md) §7.
- **Decision points:** Regularisation count/frequency limits per policy (e.g., "max 3 regularisations per month") — exceeding triggers HR escalation rather than auto-reject, since legitimate patterns (e.g., a genuinely broken office biometric device) shouldn't be penalised.
- **Failure handling:** Rejected regularisation returns to employee with the manager's reason; employee may re-submit with more context or accept the unregularised (exception-flagged) record.
- **Audit events:** `AttendanceRegularised` with original vs. regularised values, approver, reason.

### 7.3 Monthly attendance finalisation and payroll handoff

- **Trigger:** Configured cutoff date approaching (aligned to Payroll's input-collection window, Module 6).
- **Steps:** 1) System surfaces all unresolved exceptions for the period to HR/Manager with a countdown to lock 2) After cutoff, any remaining unresolved exceptions are handled per a configured default policy (e.g., auto-treated as Loss-of-Pay-eligible, or auto-approved — **tenant-configurable, no single hard-coded default**, since company policy varies) 3) Attendance data for the period is locked — no further regularisation without going through a specific "post-lock correction" path requiring HR Administrator + Payroll Executive dual acknowledgement (mirroring Module 1 §7.3's retroactive-correction pattern) 4) Finalised, locked dataset is handed off to Payroll (Module 6) as payroll input.
- **Failure handling:** If a post-lock correction is genuinely needed after Payroll has already consumed the data, it must flow through Module 6's off-cycle/retroactive-adjustment mechanism (Cross-Module Workflow #11), never a silent attendance-data edit after lock.
- **Audit events:** `AttendanceLocked` (period, actor, timestamp) as a hard boundary event that every downstream payroll calculation can cite.

## 8. User stories

**US-1**
As an **Employee**, I want to check in via mobile with geo-verification, so that I don't need physical access to an office biometric device to have my attendance recorded correctly.
**Acceptance criteria:** Given the employee is within the configured geo-fence radius at check-in time, when they tap check-in on mobile, then the punch is recorded without requiring manager approval; given they are outside the radius, when they attempt check-in, then the system blocks it and offers the on-duty/field-attendance request path instead.

**US-2**
As a **People Manager**, I want to see my team's attendance for the day/week in one calendar view, so that I can spot coverage gaps without opening each person's record individually.
**Acceptance criteria:** Given multiple team members have pending regularisation requests, when the manager opens the team attendance calendar, then flagged days are visually distinct and link directly to the approval action — not a separate navigation step.

**US-3**
As a **Payroll Executive**, I want attendance data to be immutable once locked for a payroll period, so that I can trust the numbers I'm processing won't silently change mid-run.
**Acceptance criteria:** Given a payroll period's attendance is locked, when any user attempts a standard-path edit to a record in that period, then the system blocks it and requires the post-lock correction path with explicit dual sign-off.

## 9. Functional requirements

Multi-mode check-in/out (web, mobile, biometric device integration, kiosk, geo-fenced, IP-restricted, selfie); shift scheduling (fixed, flexible, rotational, overnight, split shifts, weekly offs — configured via Shift Group per [05](../05-organisation-data-model.md) §3); holiday calendars (location-aware, per [05](../05-organisation-data-model.md) §3); grace periods, late-arrival/early-departure flagging; missing-punch detection; regularisation workflow (§7.2); overtime calculation and comp-off accrual; work-from-home and on-duty/field-attendance request types; attendance lock/finalisation (§7.3); timesheets with project/billable-vs-non-billable time tracking (for services-oriented tenants — configurable module, not forced on every tenant); attendance anomaly detection (e.g., impossible-travel-time between two geo-tagged punches — flagged for review, not auto-rejected, given false-positive risk).

## 10. Business rules

Regularisation requests are blocked once the period is locked (§7.3) — no exceptions without the dual-sign-off correction path. Overtime eligibility is Employment-Type- and Grade-dependent (configurable per [05](../05-organisation-data-model.md) §3's Employment Type entity), not a blanket policy. A device-integration failure (biometric device offline) must not silently produce no data — it should surface as a system-health alert (Module 22) distinct from an individual attendance exception.

## 11. Validation rules

Check-out time must be after check-in time (obvious, but must handle overnight shifts correctly — a check-out the following calendar day is valid, not an error, when the shift pattern is overnight). Geo-coordinates must fall within a plausible range (basic sanity check against GPS-spoofing, acknowledging this is a UX/data-quality control, not a security control per the brief's own framing principle).

## 12. Permission requirements

Employees see only their own raw punch/attendance data; Managers see direct/dotted-line reports within scope; HR/Attendance Administrators see broader scope per Module 21. Regularisation approval authority follows the reporting hierarchy by default, overridable per Module 17.

## 13. Approval workflows

Regularisation (single-level by default, configurable multi-level for high regularisation-frequency cases); post-lock correction (HR Administrator + Payroll Executive dual approval, §7.3).

## 14. Statuses and state transitions

**Attendance record (per day):** Unmarked → Present/Absent/On-Duty/WFH/Holiday/Weekly-Off (auto or manually set) → (if exception) Flagged → Regularisation-Pending → Regularised/Unresolved → Locked. **Regularisation request:** Draft → Submitted → Approved/Rejected/Returned → (if Approved) applied to the attendance record.

## 15. Record detail-page requirements

Individual attendance record's detail view (accessed from calendar, not a flat table row): raw punch log (all methods/timestamps for the day), computed hours, exception flag and reason if any, regularisation history if applicable, links to the specific policy rule that produced any flag (transparency — "why was I flagged late" should be self-evident, not require an HR query).

## 16. Search, filter and sorting requirements

Team/org attendance views filterable by date range, department, location, exception-status, shift; sortable by name/exception-count — must perform at scale (thousands of employees × daily records is a genuinely large dataset, a direct Phase 12 NFR concern).

## 17. Bulk-action requirements

Bulk regularisation approval (for a manager clearing multiple straightforward requests at once — explicitly needed given the PRD's instruction to support bulk actions without cluttering row-level UI, per [00-existing-system-audit.md](../00-existing-system-audit.md) §6's finding that Atlaskit's tables have no built-in bulk-select); bulk shift/policy reassignment for a location move.

## 18. Import and export requirements

Bulk punch-data import (for migrating historical data or for offline/field-device sync scenarios where devices batch-upload); export for payroll/statutory/audit purposes, masking-aware per Module 21.

## 19. Notification requirements

**In-app/email:** regularisation submitted/approved/rejected, upcoming lock-date reminder (to employees with unresolved exceptions and to managers with pending approvals), device-integration failure (to IT/HR Administrator, not employees). **Mobile push:** check-in/out reminder (configurable, off by default to avoid nagging — a deliberate anti-notification-fatigue choice per Module 18), regularisation approval-pending alert to managers.

## 20. Mobile requirements

This is one of the two highest-priority mobile surfaces in the entire product (per [04-personas-and-roles.md](../04-personas-and-roles.md) cross-persona notes): check-in/out with geo/selfie capture, regularisation request submission, team calendar view (manager), regularisation approval (manager) — all must work reliably on imperfect mobile network connectivity, meaning **an offline-capture-with-later-sync mode is a strong candidate requirement**, not a nice-to-have, given India's variable mobile connectivity outside major metros (see Module 24 for full mobile-specific spec).

## 21. Reporting requirements

Attendance summary by department/location, late-arrival trend, overtime report, regularisation-frequency report (surfaces policy or device problems, not just individual behaviour), attendance-anomaly report.

## 22. Audit-log requirements

Every punch (immutable raw log per §7.1), every regularisation decision, every lock/unlock event, every post-lock correction (dual-approved) — per Phase 11, this is one of the modules most likely to be scrutinised in a labour-law audit.

## 23. Integration requirements

Biometric/attendance device integration (Module 23 — vendor-specific, e.g., the kind of device partnerships confirmed for competitors like Keka/RazorpayX); Module 6 (Payroll, primary downstream consumer of locked attendance data); Module 5 (Leave, weekly-off/holiday-calendar coordination — an employee on approved leave shouldn't simultaneously show as an attendance exception).

## 24. Error, empty, and edge cases

**Error states:** biometric device offline (system-health alert, not silent data gap — see §10); GPS/geo-fence check failing due to a device permission issue rather than actual location (should surface a clear, actionable error, not a generic "attendance failed"). **Empty states:** a new employee's first day before any punches exist should show a clean "no attendance recorded yet" state, not an error. **Edge cases:** overnight/split shifts crossing midnight (handled explicitly per §11); employee working across two time zones temporarily (business travel) — attendance policy should be tenant-configurable on whether local-time or home-base-time governs, flagged as an open question below; simultaneous WFH and On-Duty requests for the same day (should be mutually exclusive by validation, not silently allow both).

## 25. Acceptance criteria

Given the monthly attendance lock date passes, when Payroll (Module 6) requests attendance input for that period, then it receives a dataset with zero unresolved-and-unflagged ambiguity — every day for every employee has a definitive status (Present/Absent/Leave/Holiday/Regularised/etc.), never a null/undefined state silently passed to payroll calculation.

## 26. Dependencies

Module 1 (Shift/Attendance Policy Group assignment), Module 5 (Leave, holiday-calendar coordination), Module 6 (Payroll, primary consumer), Module 17 (Workflow Engine), Module 23 (device integrations).

## 27. Risks

Geo-fencing/biometric device reliability is a named, recurring competitor complaint (Keka) — this is as much a hardware/integration-partner risk as a software risk, and should be scoped with realistic device-partner SLAs rather than assumed away. Attendance-policy complexity (many shift types × many exception types × many approval configurations) risks the same "hard-wired, adapt to us" complaint found against Keka/RazorpayX if the configuration UI isn't genuinely flexible — a direct design-quality risk, not just a feature-completeness one.

## 28. Open questions

- Should attendance policy governing hours be local-time or home-base-time for travelling employees? Recommend tenant-configurable, no default — flagged for Module 22 design and potentially a legal/labour-law consideration per state Shops & Establishments Act variations.
- What is the default (tenant-configurable) treatment of unresolved exceptions at lock time — auto-approve, auto-LOP, or hold the whole period's lock until resolved? Recommend tenant-configurable with auto-LOP as the suggested default (errs toward not overpaying, correctable via off-cycle adjustment if wrong) — **flagged for payroll/legal-compliance professional review**, not decided here.

## 29. Release scope

**MVP:** all check-in/out modes, shift/holiday-calendar configuration, regularisation workflow, overtime/comp-off, monthly lock, payroll handoff, team calendar, mobile check-in/out.
**Later phase:** project/billable timesheets (services-vertical-specific), attendance-anomaly AI detection (Module 25), offline-capture-with-sync mobile mode if not feasible for MVP given implementation complexity.
**Out of scope:** this module does not manage physical biometric-device hardware/firmware — it integrates with third-party device vendors (Module 23).
