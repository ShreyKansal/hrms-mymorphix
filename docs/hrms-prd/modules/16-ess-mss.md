# Module 16 — Employee and Manager Self-Service

**Status:** Draft v1 (pending stakeholder review) · **Release:** HR Operations
**Depends on:** every other module (this is an aggregation/navigation layer, not a new data domain)

---

## 1. Module overview

This module doesn't own new data — it's the **experience layer** that aggregates every other module's self-service-relevant surface into two coherent destinations: an Employee home/portal and a Manager home/approval-and-team-management surface. This distinction matters architecturally: ESS/MSS should be built as *views* composed from other modules' data and actions, not a parallel data model that risks drifting from the modules it's meant to represent (a direct application of the market research §8 finding that duplicated/loosely-synced data models are a recurring competitor weakness).

## 2. Problem statement

Market research (§7) found HR-ticket volume dominated by requests that self-service should have absorbed — meaning ESS *existing* isn't sufficient if it's fragmented, hard to find, or lower-functionality than what HR can do on the employee's behalf. Every competitor researched has *some* ESS/MSS, but the specific complaint pattern (mobile-web parity gaps, "why do I still need to email HR for this") suggests the differentiator is completeness and discoverability, not novelty.

## 3. Business objective

Make the self-service surface genuinely sufficient — so that the default employee/manager path for every routine action never requires HR intervention — measured directly by the ESS/MSS-adoption and HR-ticket-volume metrics in [14-success-metrics.md](../14-success-metrics.md).

## 4. User personas

Primary: **Employee**, **People Manager** — this module exists entirely for these two personas; every other persona interacts with the underlying modules directly rather than through this aggregation layer.

## 5. User needs

Employee needs one home surface that answers "what do I need to do/know today" (pending actions, recent payslip, upcoming holiday, policy update) without navigating module-by-module. Manager needs one approval inbox spanning every module that generates approvals (leave, attendance, reimbursement, onboarding tasks, performance reviews) rather than checking each module separately — this directly targets [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 2's named "no single inbox across leave/expense/timesheet" pain point.

## 6. Primary use cases

**Employee home:** profile, documents, attendance, leave, payslips, tax declarations, reimbursements, letters, helpdesk, policies, goals, reviews, learning, surveys, assets, team directory, resignation — each a surfaced entry point into the owning module, not a reimplementation. **Manager home:** team overview, team attendance/leave, unified approval inbox, employee-change requests, probation confirmation, team goals, performance reviews, salary recommendations, recruitment participation, team analytics, delegation, acting-manager setup.

## 7. Detailed workflows

### 7.1 Unified approval inbox

- **Trigger:** Any module generates an approval request routed to a manager (leave, attendance regularisation, reimbursement, onboarding-checklist sign-off, performance review, transfer/promotion recommendation, requisition/offer approval).
- **Steps:** 1) Each module emits a standard "approval item" representation (per Module 17's workflow-engine contract) 2) This module's Approval Inbox aggregates all pending items across modules into one prioritised list (configurable sort: due-date, type, urgency) 3) Manager acts (approve/reject/return) directly from the inbox for simple cases, or is deep-linked to the owning module's detail page for complex ones (e.g., a compensation-revision approval likely needs the full Module 1/6 context, not a one-line inbox action) 4) Action is recorded back to the owning module — this module never owns the approval state itself, only aggregates the view.
- **Design rule:** per the brief's own UX principle, this inbox should not become a giant undifferentiated table — group by type/urgency, and push anything requiring real judgment (not a rubber-stamp) to the owning module's detail page rather than trying to cram full context into a list row.
- **Audit events:** None new — every action here is audited by the owning module (this module doesn't duplicate audit logging, avoiding a drift risk).

## 8. User stories

**US-1**
As a **People Manager**, I want one approval inbox for leave, attendance, reimbursement, and other requests from my team, so that I don't have to check four different modules every day.
**Acceptance criteria:** Given a manager has pending approvals across leave, attendance regularisation, and reimbursements simultaneously, when they open the Approval Inbox, then all three appear in one prioritised list, each actionable without navigating away for the simple cases.

**US-2**
As an **Employee**, I want my home page to show me what needs my attention today (pending tax declaration deadline, a policy requiring acknowledgement, an approved leave starting tomorrow) without me hunting through modules.
**Acceptance criteria:** Given an employee has a policy-acknowledgement deadline within the next 3 days, when they open their home page, then it's surfaced as a prioritised action item, not buried in a module they'd have to think to visit.

## 9. Functional requirements

Employee home/portal aggregating: profile/document access, attendance/leave self-service, payslip/tax-declaration access, reimbursement submission, letter access, helpdesk, policy acknowledgement, goals/reviews, learning, surveys, asset view, team directory, resignation initiation. Manager home aggregating: team overview/attendance/leave, unified approval inbox (§7.1), employee-change-request initiation, probation-confirmation action, team goals/reviews, compensation-recommendation initiation (feeding Module 1/6 approval chains), recruitment-participation surface (interview feedback, hiring-manager actions), team analytics, delegation setup (linking to [05-organisation-data-model.md](../05-organisation-data-model.md) §5's Acting Manager concept), notification preferences.

## 10. Business rules

This module must not become a second source of truth for anything — every data point and action shown here is read from and written to the owning module in real time, never cached/duplicated in a way that can drift (a direct, deliberate architectural guardrail against the Zoho-style one-way-sync failure mode identified in market research).

## 11. Validation rules

N/A at this module's level — validation belongs to the owning modules; this module surfaces their validation results/errors consistently, not redundantly.

## 12. Permission requirements

Purely a rendering/aggregation layer over each owning module's existing permission model (Module 21) — this module introduces no new permission logic of its own, which is itself a design principle worth stating explicitly (avoiding a second, potentially-inconsistent permission-check implementation).

## 13. Approval workflows

Not owned here — aggregated from every other module per §7.1.

## 14. Statuses and state transitions

N/A — this module has no owned entities with their own state machines; it reflects the states of the entities it aggregates.

## 15. Record detail-page requirements

Employee Home and Manager Home are themselves the primary "detail pages" of this module — see [07-information-architecture.md](../07-information-architecture.md) for their structural placement in the overall navigation.

## 16. Search, filter and sorting requirements

Approval Inbox: filter by type/urgency/due-date (§7.1); Employee Home: minimal search needed given it's a curated dashboard, not a browsing surface.

## 17. Bulk-action requirements

Bulk-approve within the unified inbox where the underlying module supports it (e.g., bulk leave approval, per Module 5 §17) — this module surfaces that capability, doesn't reimplement it.

## 18. Import and export requirements

N/A — not applicable to an aggregation layer.

## 19. Notification requirements

This module is a primary *consumer* of Module 18's notification system for populating the home/inbox surfaces, not a separate notification source.

## 20. Mobile requirements

**This module's mobile experience is arguably the single most important mobile surface in the whole product**, since Employee and Manager are the two highest-frequency mobile personas ([04-personas-and-roles.md](../04-personas-and-roles.md)) and this module is their primary entry point — see Module 24 for the full mobile-specific spec, but this module's home/inbox screens should be designed mobile-first, not adapted from a desktop-first design.

## 21. Reporting requirements

ESS/MSS adoption metrics (login frequency, feature-usage breadth) feed directly into [14-success-metrics.md](../14-success-metrics.md) — this module is itself a primary instrument for measuring whether the product's core value proposition (self-service that actually reduces HR load) is working.

## 22. Audit-log requirements

None owned here (§13) — audit responsibility stays with the owning module for every action surfaced through this layer.

## 23. Integration requirements

Aggregates every other module (1 through 20+) by design — this is this module's entire reason for existing.

## 24. Error, empty, and edge cases

**Error states:** an owning module's data is temporarily unavailable — this module should degrade gracefully (show what it can, flag what's missing) rather than fail the entire home/inbox page over one module's issue. **Empty states:** a new employee's home page before any activity exists — should show a helpful, encouraging first-use state (e.g., "complete your profile," "explore the employee directory"), not a sparse, unwelcoming blank page. **Edge cases:** a manager who is also an individual contributor elsewhere (e.g., reports to someone while also managing a team) needs both Employee Home and Manager Home accessible, with a clear, low-friction way to switch context (per [07-information-architecture.md](../07-information-architecture.md)'s navigation design).

## 25. Acceptance criteria

Given a manager approves a leave request from the unified Approval Inbox, when they check the corresponding Module 5 leave record directly afterward, then it reflects the exact same approved state — no drift, no lag, no inconsistency between the aggregated view and the source of truth.

## 26. Dependencies

Every module — this is the capstone integration module for the entire product from an end-user experience perspective.

## 27. Risks

The temptation to let this module accumulate its own bespoke logic/shortcuts (for UX convenience) risks exactly the data-drift/duplication failure mode this PRD is explicitly designed to avoid (per [03-product-vision.md](../03-product-vision.md)'s core differentiation claim) — this should be treated as an ongoing architectural discipline, not a one-time design decision.

## 28. Open questions

None beyond what's inherited from the underlying modules — this module's open questions are, by design, really those modules' open questions.

## 29. Release scope

**MVP:** Employee Home (attendance, leave, payslips, reimbursements, documents, helpdesk, policies, directory, resignation), Manager Home (unified approval inbox for leave/attendance/reimbursement, team overview, probation confirmation, delegation).
**Later phase:** full team-analytics dashboard within Manager Home, salary-recommendation initiation UI, recruitment-participation surface depth.
**Out of scope:** N/A — this module's scope is entirely defined by which underlying modules are available at a given release stage (per [13-release-roadmap.md](../13-release-roadmap.md)); it has no independent scope of its own beyond aggregation.
