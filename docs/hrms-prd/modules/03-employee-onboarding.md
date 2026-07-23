# Module 3 — Employee Onboarding

**Status:** Draft v1 (pending stakeholder review) · **Release:** HR Operations
**Depends on:** Module 1 (Core HR), Module 8 (Recruitment, upstream handoff), Module 17 (Workflow Engine), Module 13 (Documents)

---

## 1. Module overview

Everything between an accepted offer and a fully productive, confirmed employee: preboarding (document collection, verification, pre-day-one engagement), day-one/induction logistics, department/IT/finance/manager checklists, asset and access provisioning, probation setup, and progress tracking. This is one of the highest-visibility modules for a new hire's first impression of the company, and competitor research found onboarding-checklist depth (Keka's "unlimited custom tasks with triggers," greytHR's checklist/task automation) to be a genuine, valued differentiator across the mid-market segment.

## 2. Problem statement

Onboarding is inherently cross-functional (HR, IT, Facilities, Finance, the hiring manager, a buddy) and time-boxed — competitor research repeatedly surfaces this as a place where manual coordination breaks down (documents chased manually, IT provisioning delayed past day one, no visibility into what's actually blocking a new hire from being productive).

## 3. Business objective

Get a new hire from offer-accepted to fully productive and confirmed with minimal manual chasing, full visibility into checklist status for every stakeholder, and a clean, auditable handoff into Module 1's Employee Master.

## 4. User personas

Primary: **HR Executive** (process owner), **Employee** (the new hire, via Preboarding Portal), **People Manager** (checklist owner, buddy assignment, induction). Secondary: **IT Administrator** (account/access provisioning checklist), **Recruiter** (handoff source, Module 8), **HR Administrator** (policy/checklist template configuration).

## 5. User needs

New hire needs a single place to submit documents/forms before day one and know what's expected of them. HR needs visibility into every new hire's checklist status across all stakeholders without chasing each one individually. Manager needs a clear, minimal checklist of their own responsibilities (not HR's or IT's). IT needs advance notice to provision accounts before day one, not on it.

## 6. Primary use cases

Convert an accepted candidate to a pending employee record (handoff from Module 8); new hire completes preboarding portal (documents, forms, bank/tax details, digital signatures, policy acknowledgement); HR/Manager/IT/Finance each complete their respective checklists; assign buddy and induction schedule; track onboarding progress dashboard; handle joining-date change, deferred joining, or no-show.

## 7. Detailed workflows

### 7.1 Candidate-to-employee conversion and preboarding kickoff

*(Full cross-module detail in [06-cross-module-workflows.md](../06-cross-module-workflows.md) Workflow #1 — this section covers this module's portion.)*

- **Trigger:** Offer accepted in Module 8.
- **Preconditions:** Offer status = Accepted; joining date set.
- **Actor:** System (automatic handoff) + Recruiter/HR Executive (review).
- **Steps:** 1) System creates a "Pending" Employee record in Module 1 (Draft state, per Module 1 §14) pre-populated from the candidate profile 2) System generates the checklist instances (HR/IT/Finance/Manager/Employee) from the configured template for this role/department/location 3) Preboarding Portal access is provisioned for the new hire (a limited, pre-employment access mode — not full ESS) 4) Buddy assignment prompt sent to the manager.
- **Decision points:** Template selection — which onboarding checklist template applies (role/department/location/employment-type-driven, configurable in Module 22).
- **System actions:** Create Draft Employee record; instantiate checklist tasks with due dates relative to joining date; send Preboarding Portal invite.
- **Notifications:** New hire (portal invite), HR (checklist created), Manager (buddy-assignment prompt).
- **Failure handling:** If joining date is unknown/TBD at offer-accept time, checklist due-dates default to relative-to-a-placeholder and must be recalculated once a firm date is set — flagged as a real edge case, not assumed away.
- **Final outcome:** Draft Employee record + active checklists + portal access.
- **Audit events:** `OnboardingInitiated`, linked to the source Module 8 offer/candidate record.

### 7.2 Preboarding document collection and verification

- **Trigger:** New hire logs into Preboarding Portal.
- **Steps:** 1) New hire uploads required documents (ID proof, address proof, education certificates, previous-employment documents) and completes joining forms (personal details, bank, tax declarations, digital signature on offer/policy acknowledgement) 2) HR Executive reviews and verifies each document (approve/reject-with-reason) 3) Optional background-verification request triggered to a configured BGV provider (Module 23 integration) with status tracked here 4) On all-verified, checklist item marked complete.
- **Decision points:** Document rejected → new hire re-notified with specific reason, re-upload requested (not a silent dead-end).
- **Failure handling:** Missing documents past a configurable reminder threshold escalate to HR (not just repeat silently to the new hire — per §19 notification/escalation requirements).
- **Audit events:** Every document verification decision (approve/reject, reviewer, reason).

### 7.3 No-show / deferred joining handling

- **Trigger:** Joining date passes without the new hire completing day-one check-in, or the new hire requests a joining-date change before day one.
- **Steps (deferred joining):** 1) New hire or HR requests date change 2) System recalculates all checklist due-dates relative to the new date 3) Notifications re-sent to affected stakeholders with the update. **Steps (no-show):** 1) HR marks the record as No-Show past a configurable grace period 2) System prompts: rescind offer-linked Draft record (with reason) or extend grace period 3) On rescind, Draft Employee record is archived (not silently deleted — retains linkage to the Module 8 candidate record for future re-application) 4) All provisioned access (preboarding portal, any early IT provisioning) is revoked.
- **Audit events:** `OnboardingDeferred` / `OnboardingNoShow`, both explicitly distinct from a normal `EmployeeCreated` flow so reporting (Module 8's recruitment funnel) can correctly attribute the outcome.

## 8. User stories

**US-1**
As a **new hire**, I want to complete all my joining paperwork online before day one, so that my first day is spent getting oriented, not filling forms.
**Acceptance criteria:** Given all preboarding checklist items are complete, when the new hire's joining date arrives, then their Draft record automatically transitions toward Active status (pending a final HR confirmation step, not fully automatic — see §14) without re-entering any data already captured.

**US-2**
As an **HR Executive**, I want a single dashboard showing every active new hire's checklist completion across HR/IT/Finance/Manager, so that I can identify who's at risk of a delayed or incomplete day one without individually checking each stakeholder.
**Acceptance criteria:** Given a new hire has an IT checklist item overdue 2 days before joining, when the HR Executive views the onboarding dashboard, then that new hire is visibly flagged as at-risk, not buried in an undifferentiated list.

**US-3**
As a **People Manager**, I want my onboarding checklist to contain only my responsibilities (buddy assignment, induction schedule, day-one welcome), not HR's or IT's tasks, so that I'm not overwhelmed by items I can't act on.
**Acceptance criteria:** Given a checklist template has HR, IT, Finance, and Manager task categories, when a Manager views their checklist, then only Manager-category tasks are shown to them by default (other categories visible read-only for overall progress awareness, per §15's detail-page design, not hidden entirely).

## 9. Functional requirements

Preboarding portal (pre-employment limited access); configurable checklist templates by role/department/location/employment-type; department/IT/finance/manager checklist categories; buddy allocation; induction schedule; policy acknowledgement (links to Module 20); digital signatures (Module 13/Module 23 integration); asset allocation trigger (Module 14); email/account-request trigger (IT checklist item, Module 23); probation setup (initial values feeding Module 1); training allocation trigger (Module 10); onboarding-progress dashboard; joining-date-change and no-show handling (§7.3); new-hire feedback survey at end of onboarding period.

## 10. Business rules

An Employee record stays in Draft status (Module 1 §14) until a defined minimum checklist-completion threshold is met (configurable — e.g., "identity verified + joining forms signed," not necessarily 100% of every checklist item, since some items like asset return-acknowledgement can complete after day one). No payroll processing occurs for a Draft-status record.

## 11. Validation rules

Bank/tax details entered during preboarding go through the same validation as Module 1 §11 (this module is a UI entry point, not a separate data model). Digital signature capture must be tied to the specific document version presented (no signature/document mismatch risk).

## 12. Permission requirements

Preboarding Portal access is a distinct, narrow permission scope — the new hire can see and edit only their own onboarding data, nothing else in the system (this is a pre-employment access grant, not a full Employee persona grant yet). Checklist visibility is category-scoped per §8 US-3.

## 13. Approval workflows

Document verification (§7.2) is itself a lightweight approval step; no-show/rescind decisions should require HR Administrator sign-off given the finality (Module 17).

## 14. Statuses and state transitions

| State | Entry condition | Next states |
|---|---|---|
| Invited | Candidate converted, portal access sent | In Progress, Expired (invite unused past threshold) |
| In Progress | New hire actively completing checklist | Ready for Activation, Deferred, No-Show |
| Deferred | Joining date changed | In Progress (recalculated) |
| Ready for Activation | Minimum checklist threshold met | Active (Module 1) |
| No-Show | Grace period passed without check-in | Archived |

## 15. Record detail-page requirements

Onboarding Detail page per new hire: header (name, role, joining date, overall progress %), checklist sections by category (HR/IT/Finance/Manager/Employee) each independently completable, document repository, buddy/induction info, linked Draft Employee record.

## 16. Search, filter and sorting requirements

Onboarding dashboard filterable by department, joining-date range, status (at-risk/on-track/complete), location.

## 17. Bulk-action requirements

Bulk checklist-template reassignment (rare); bulk reminder-send to all stakeholders with overdue items.

## 18. Import and export requirements

Not a primary need for this module beyond what Module 1's import already covers for the resulting Employee record; onboarding-completion reports exportable (Module 19).

## 19. Notification requirements

**In-app/email:** portal invite, document rejected (with reason), checklist item overdue (escalating: first to assignee, then to HR after a configurable grace period — not indefinite silent overdue), joining-date change, day-one reminder to manager/buddy. **Mobile push:** manager's day-one/buddy-assignment reminders.

## 20. Mobile requirements

New hire: preboarding portal should be fully usable on mobile web given many first-time joiners in India complete such forms on a phone (a real accessibility/adoption consideration, not just a nice-to-have) — camera-based document upload is a first-class requirement here. Manager: checklist view/complete on mobile.

## 21. Reporting requirements

Time-to-productivity (offer-accept to Ready-for-Activation), onboarding-task completion rate by category, no-show/deferred-joining rate (feeds Module 8's recruitment-funnel analytics too).

## 22. Audit-log requirements

Every checklist completion, document verification decision, no-show/rescind decision, joining-date change — per Phase 11.

## 23. Integration requirements

Upstream: Module 8 (candidate/offer handoff). Downstream: Module 1 (Employee record activation), Module 13 (document templates/e-signature), Module 14 (asset allocation trigger), Module 23 (IT account provisioning, background-verification provider), Module 10 (mandatory-training enrolment trigger), Module 20 (policy acknowledgement).

## 24. Error, empty, and edge cases

**Error states:** document upload failure/unsupported format (clear inline error, not a silent drop); BGV provider integration failure (Module 23) should not block the rest of onboarding — flag and allow manual override with HR sign-off. **Empty states:** a new tenant with no checklist templates configured yet should prompt template setup before the first onboarding can be initiated, not silently create an empty, useless checklist. **Edge cases:** candidate declines after Draft record creation (must cleanly archive, not orphan a Draft record indefinitely); joining date moved to before the offer-accept processing completed (ordering edge case); rehire scenario (Cross-Module Workflow #17) where a "new hire" is actually a returning employee — should offer to relink historical data rather than treat as fully new.

## 25. Acceptance criteria

Given a checklist template assigns an IT task with a due date of "2 days before joining," when the joining date changes, then the task's due date automatically recalculates rather than remaining anchored to the original date.

## 26. Dependencies

Module 1, Module 8, Module 13, Module 14, Module 17, Module 20, Module 22 (template configuration), Module 23 (BGV/e-sign/IT-provisioning integrations).

## 27. Risks

Checklist-template misconfiguration (e.g., wrong template applied for a role) creates a poor first impression that's hard to recover from — worth a "preview as new hire" capability for HR Administrators configuring templates, flagged as a UX safeguard.

## 28. Open questions

Should the "minimum checklist-completion threshold" for Draft→Active activation be a single tenant-wide default or configurable per template? Recommend per-template, since a contractor's minimum bar is legitimately different from a full-time employee's — flagged for Module 22 design.

## 29. Release scope

**MVP:** preboarding portal, configurable checklists (HR/IT/Finance/Manager categories), document collection/verification, buddy/induction assignment, progress dashboard, no-show/deferred handling.
**Later phase:** new-hire feedback survey automation with trend analytics (Module 19 tie-in), AI-assisted checklist-template suggestions (Module 25).
**Out of scope:** this module does not perform background verification itself — it orchestrates and tracks status against a third-party BGV provider (Module 23).
