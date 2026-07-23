# Module 17 — Workflow and Approval Engine

**Status:** Draft v1 (pending stakeholder review) · **Release:** Foundation
**Depends on:** [05-organisation-data-model.md](../05-organisation-data-model.md) (reporting hierarchy for default routing), Module 21 (Roles and Permissions)

---

## 1. Module overview

The shared, configurable engine every other module routes its approvals through — sequential/parallel/any-one/all-must-approve chains, dynamic approver resolution (manager hierarchy, grade/amount/department/location-based), delegation, escalation, and auto-approval. This is infrastructure, not a user-facing "module" most people visit directly, and it is the module most directly responsible for whether this product avoids the "rigid, hard-wired, you adapt to us" complaint pattern found against Keka and RazorpayX in Phase 2 research.

## 2. Problem statement

Every competitor researched with a workflow engine shows some version of the same weakness: RazorpayX's reviewers call workflows "inefficient and complicated, with most yet to be fully built"; Keka's are described as "hard-wired"; Darwinbox's automation is called "basic" despite AI-forward marketing. A generic, genuinely configurable engine — used consistently by every module rather than each module inventing its own approval logic — is both a technical-debt-avoidance measure and a direct competitive response.

## 3. Business objective

Give every module a single, consistent, tenant-configurable way to define "who approves this, in what order, under what conditions" without requiring a code change per workflow, while keeping the *common* case (single-level manager approval) simple to configure and simple for approvers to act on.

## 4. User personas

Primary: **HR Administrator** (workflow configuration). Every persona interacts with this module indirectly as an approver or requester through whichever owning module they're using — there is no dedicated "workflow engine user" persona beyond the administrator who configures it.

## 5. User needs

HR Administrator needs to configure or change an approval chain (e.g., "leave above 5 days now needs HRBP co-approval") without an engineering request. Every approver needs a clear, unambiguous understanding of what they're approving and why it reached them — a common failure mode in poorly-designed workflow engines is approver confusion about scope/context.

## 6. Primary use cases

Define a workflow (trigger event, conditions, approval chain, actions); configure sequential/parallel/any-one/all-must-approve chains; configure dynamic approvers (manager hierarchy, grade/amount/department/location-based, HRBP); configure delegation and substitute approvers; configure escalation/SLA timers; configure auto-approval thresholds; simulate/test a workflow before activating it; version workflows; review workflow audit logs; recover from workflow-execution failures.

## 7. Detailed workflows

### 7.1 Workflow execution (generic pattern every module uses)

- **Trigger:** An owning module (e.g., Module 5's leave application) fires a workflow-trigger event with its context payload (requester, request type, relevant amounts/dates/grades).
- **Steps:** 1) Engine matches the event against configured workflow definitions (by trigger type + conditions, e.g., "leave request AND duration > 5 days") 2) Engine resolves the approver chain dynamically at execution time (not baked in at configuration time) — e.g., "current Functional Manager" is resolved from [05-organisation-data-model.md](../05-organisation-data-model.md) §5's live reporting-hierarchy data, so an org change automatically routes correctly without a workflow-definition edit 3) Engine creates approval-task instances per the configured chain type (sequential — one at a time; parallel — all simultaneously; any-one — first response wins; all-must-approve — every approver required) 4) Approval tasks surface to approvers via Module 16's unified inbox 5) On each decision (approve/reject/return), engine advances the chain or terminates per the outcome 6) On final outcome, engine fires a completion event back to the owning module, which applies the actual business effect (e.g., Module 5 updates the leave record) — **the workflow engine itself never mutates owning-module data directly**, a deliberate separation of concerns that keeps this module generic and keeps each owning module authoritative over its own data.
- **Decision points:** Delegated approver active for this approver at this time → route to delegate instead (or in addition, per configuration) — resolved dynamically per [05-organisation-data-model.md](../05-organisation-data-model.md) §5's Acting Manager concept.
- **Failure handling:** SLA timer breach → configured escalation (notify next-level approver, or auto-approve/auto-escalate per policy — tenant-configurable, no single hard-coded default given how much this varies by risk-tolerance and request type). An approver who's separated (Module 15) or otherwise made inactive mid-chain must have a defined re-routing rule (e.g., escalate to their manager) rather than leaving an approval permanently stuck — a real, evidenced risk given [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 2's note about unclear "why is this pending" visibility.
- **Audit events:** `WorkflowInstanceStarted`, `WorkflowStepCompleted` (per approver decision), `WorkflowInstanceCompleted`/`WorkflowInstanceFailed`.

### 7.2 Workflow simulation before activation

- **Trigger:** HR Administrator edits or creates a workflow definition.
- **Steps:** 1) Administrator provides sample/test context data 2) Engine resolves the full approval chain as it *would* execute, without creating real approval tasks or affecting real data 3) Administrator reviews the simulated chain for correctness before activating the new/changed workflow version 4) On activation, the new version applies to newly-triggered instances only — **in-flight approvals already using the prior version continue on that version to completion**, never silently switched mid-flight (a direct, specific answer to the ambiguity risk in changing a workflow while requests are pending).
- **Audit events:** `WorkflowVersionActivated`, with old and new version both retained for audit/history purposes.

## 8. User stories

**US-1**
As an **HR Administrator**, I want to change an approval threshold (e.g., raise the reimbursement amount requiring Finance co-approval) without engineering involvement, so that policy changes are a configuration action, not a development request.
**Acceptance criteria:** Given a workflow's threshold condition is edited and the new version is activated, when a new reimbursement claim is submitted above the old-but-below-the-new threshold, then it follows the new (simpler) routing — no code deployment required.

**US-2**
As a **People Manager**, I want to delegate my approval authority while I'm on leave, so that my team's requests don't stall waiting for me.
**Acceptance criteria:** Given a manager sets up a delegation for a defined date range, when a new approval is routed to them during that window, then it's routed to (or also visible to, per configuration) their designated delegate instead, and this is clearly indicated to the requester so they understand who's acting on their request.

**US-3**
As an **HR Administrator**, I want to test a new approval-chain configuration against realistic sample data before turning it on, so that I don't discover a routing mistake only after real employee requests start hitting it.
**Acceptance criteria:** Given a workflow is in simulation mode, when tested against sample data, then the resolved approval chain is shown clearly (who, in what order, under what condition) without creating any real approval-task records.

## 9. Functional requirements

Configurable workflow definitions (trigger, conditions, chain type, actions) usable generically by every module; sequential, parallel, any-one-approves, all-must-approve chain types; dynamic approver resolution (manager hierarchy, HRBP, department/location/grade/amount-based, per [05-organisation-data-model.md](../05-organisation-data-model.md)); delegated approval and substitute approvers (§7.1); escalation with SLA timers; reminders; rejection and return-for-correction as first-class outcomes (not just approve/reject); withdrawal (requester-initiated); auto-approval-below-threshold; workflow versioning with in-flight-instance isolation (§7.2); workflow simulation; workflow audit logs; workflow-execution-failure recovery (e.g., a stuck instance due to an inactive approver, §7.1).

## 10. Business rules

A workflow definition change never retroactively alters an in-flight approval instance (§7.2) — this is a hard rule, not a configuration option, given the confusion/unfairness risk of changing the rules mid-request. Every approval decision requires the decision to be attributable to an actual, identifiable actor (even when acting as a delegate — the record shows both the delegate who acted and the original approver they were acting for), consistent with Phase 11's audit requirements.

## 11. Validation rules

A workflow definition cannot be activated with an approval chain that could resolve to zero approvers under some valid condition (e.g., an employee with no manager assigned and no configured fallback) — this should be caught at simulation/validation time (§7.2), not discovered when a real request gets stuck.

## 12. Permission requirements

Workflow configuration is HR-Administrator/System-Administrator tier — the blast radius of a misconfigured workflow (per [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 4's "low-frequency, high-risk workflows" note) justifies this restriction.

## 13. Approval workflows

This module *is* the approval-workflow infrastructure — it doesn't have its own separate approval process beyond its own configuration-change audit trail.

## 14. Statuses and state transitions

**Workflow instance:** Started → In Progress (per-step sub-states: Pending/Approved/Rejected/Returned at each chain position) → Completed/Rejected/Withdrawn/Failed. **Workflow definition:** Draft → Simulated → Active → Superseded (by a new version, old version remains queryable for historical-instance audit purposes, never deleted).

## 15. Record detail-page requirements

Workflow-definition management page (HR Administrator): visual chain builder (trigger → conditions → chain → actions), version history, simulation panel. Individual workflow-instance detail (surfaced within the owning module's record, e.g., a leave request's approval-chain history) — this module doesn't need its own end-user-facing instance list; instances are always viewed in the context of the record they belong to.

## 16. Search, filter and sorting requirements

Workflow-definition library searchable/filterable by trigger type/module; workflow-instance audit search (for troubleshooting a specific stuck or disputed approval) by requester/approver/date/status.

## 17. Bulk-action requirements

Not directly applicable to this module itself — bulk approval actions are a Module 16/owning-module concern, this module just processes the resulting decisions.

## 18. Import and export requirements

Workflow-definition export/import (useful for replicating a configuration across similar tenants in a multi-org context, or for a customer moving between sandbox and production, per Module 22).

## 19. Notification requirements

Not owned here directly — this module triggers Module 18 notifications on approval-task creation, reminders, and escalations, but doesn't manage notification delivery/preferences itself.

## 20. Mobile requirements

Configuration is desktop-only (HR Administrator, low mobile need); approval *actions* triggered by this engine are surfaced through Module 16's mobile-first Approval Inbox, not a separate mobile surface of this module's own.

## 21. Reporting requirements

Approval-turnaround-time report (per workflow type — directly feeds [14-success-metrics.md](../14-success-metrics.md)'s leave/regularisation-approval-turnaround metrics), approval-bottleneck report (which specific approvers/chains have the longest average turnaround — a genuinely actionable operational report, not just a vanity metric), escalation-frequency report (surfaces whether SLA targets are realistic or a workflow is systematically misconfigured).

## 22. Audit-log requirements

Every workflow-definition change (with version diff), every instance's full decision trail (who, when, delegate-or-original, comments), every escalation and auto-approval event — per Phase 11. This is the module whose audit trail most other modules' own audit requirements ultimately depend on for approval-related events.

## 23. Integration requirements

Consumed by essentially every other module as the shared approval infrastructure (Modules 1, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 20 all reference this module for their approval needs) — this module has no significant *external* integration requirements of its own.

## 24. Error, empty, and edge cases

**Error states:** a workflow instance stuck due to an inactive/separated approver with no re-routing rule configured (§7.1's failure-handling requirement — must not happen silently). **Empty states:** a new tenant with no workflows configured — every module needing approval should ship with a sensible, simple default (e.g., single-level manager approval) rather than requiring HR Administrator configuration before any approval-dependent feature works at all. **Edge cases:** a circular delegation chain (A delegates to B, B delegates to A) — must be structurally prevented, not just discouraged; a workflow condition referencing a field that's since been removed/renamed (Module 22's custom-field lifecycle interacting with this module — needs a graceful degradation/warning path, not a silent break).

## 25. Acceptance criteria

Given a workflow's approver is separated (Module 15) while an approval instance is pending with them, when the separation is processed, then any pending approval instances assigned to them are automatically re-routed per the configured fallback rule — never left indefinitely stuck.

## 26. Dependencies

[05-organisation-data-model.md](../05-organisation-data-model.md) (reporting hierarchy), Module 21 (permission scoping for who can configure workflows), Module 16 (inbox surfacing), Module 18 (notification delivery).

## 27. Risks

This is foundational, shared infrastructure — a design flaw here (e.g., insufficient chain-type flexibility, poor dynamic-approver resolution) propagates as a limitation across every other module that depends on it, making early, careful design investment disproportionately valuable relative to this module's own apparent scope.

## 28. Open questions

None beyond what's flagged inline — this module's open questions are mostly the specific threshold/routing-policy decisions each *owning* module defers to it (e.g., Module 6's compensation-approval thresholds), which are that module's decisions to make using this engine, not this engine's own ambiguity.

## 29. Release scope

**MVP:** sequential/parallel/any-one/all-must-approve chains, dynamic manager-hierarchy resolution, delegation, escalation/SLA timers, auto-approval thresholds, simulation, versioning with in-flight isolation.
**Later phase:** visual workflow-builder UI refinement, cross-tenant workflow-template sharing (multi-org context), AI-assisted workflow-configuration suggestions (Module 25).
**Out of scope:** this module does not become a general-purpose business-process-automation (BPA) tool for non-HR processes — it's scoped to this product's own approval needs, not a standalone workflow product, per [03-product-vision.md](../03-product-vision.md) Product Boundaries.
