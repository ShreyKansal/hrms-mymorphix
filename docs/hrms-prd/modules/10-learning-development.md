# Module 10 — Learning and Development

**Status:** Draft v1 (pending stakeholder review) · **Release:** Talent
**Depends on:** Module 1 (Core HR), Module 3 (Onboarding — mandatory-training trigger), Module 9 (Performance — skill-gap linkage), Module 17 (Workflow Engine)

---

## 1. Module overview

Course catalogue, learning paths, mandatory/compliance training, enrolment (self and manager-nominated), certifications with expiry tracking, and skill-gap analysis. Phase 2 research found this to be a comparatively shallow area even for strong competitors (Darwinbox's own reviewers flagged its native L&D as insufficient for global companies needing more advanced learning platforms) — this module should focus on being a solid, well-integrated core (especially mandatory/compliance training, which is genuinely HRMS-native) rather than trying to out-build dedicated LMS vendors.

## 2. Problem statement

Mandatory/compliance training completion is an audit-relevant HR responsibility that's poorly served by disconnected external LMS tools (no link to the employee record, no automatic enrolment triggers from onboarding/role-change events); dedicated LMS depth (content authoring, complex learning paths) is a different, deeper product category this HRMS shouldn't try to fully replace.

## 3. Business objective

Own mandatory/compliance training completion tracking natively (tightly integrated with Onboarding and the employee record), and provide solid, unsurprising course-catalogue/enrolment/certification-tracking capability for everything else — while integrating with dedicated external LMS platforms (Module 23) for organisations that need deeper content-authoring capability than this module aims to provide.

## 4. User personas

Primary: **Employee** (enrol, complete training). Secondary: **People Manager** (nominate, track team completion), **HR Administrator** (mandatory-training configuration, compliance reporting), **Compliance/Audit User** (completion-evidence retrieval).

## 5. User needs

Employee needs a clear, unified view of what training is mandatory vs. optional and by when. Manager needs visibility into team training-completion status without chasing individually. Compliance/Audit User needs to pull evidence of mandatory-training completion for a specific employee/period on demand, reliably.

## 6. Primary use cases

Browse course catalogue; enrol in a course (self or manager-nominated); complete mandatory/compliance training (often triggered by onboarding or a role/location change); track certification expiry and renewal; view skill-gap analysis against role requirements; manage training budgets (Enterprise-phase); external LMS content integration.

## 7. Detailed workflows

### 7.1 Mandatory training assignment and completion tracking

- **Trigger:** An onboarding checklist item (Module 3), a role/location change (Module 1, e.g., a new statutory requirement applies at the new location), or a scheduled recurring-compliance-training cycle (e.g., annual POSH/anti-harassment training).
- **Steps:** 1) System auto-enrols the employee in the relevant mandatory course(s) based on the trigger and configured applicability rules (role/location/grade-driven) 2) Employee completes the course (internally hosted or via an external LMS integration, Module 23, with completion-status synced back) 3) Completion is recorded against the employee's training record with a certificate/evidence artifact retained 4) If not completed by the deadline, escalating reminders fire to the employee and, past a further threshold, to their manager/HR.
- **Audit events:** `TrainingAssigned`, `TrainingCompleted`, retained per Phase 11's retention requirements given the compliance-evidence purpose.

## 8. User stories

**US-1**
As a **Compliance/Audit User**, I want to pull a report of every employee's mandatory-training completion status for a given period, so that I can demonstrate compliance readiness without manually cross-checking individual records.
**Acceptance criteria:** Given an audit period is specified, when the Compliance/Audit User generates the report, then it shows completion status (including exact completion date and evidence link) for every employee for whom that training was applicable during the period — not just currently-active employees, since departed employees' historical compliance status may still be relevant.

**US-2**
As a **People Manager**, I want to see my team's training-completion status in one view, so that I can follow up on the specific people who are behind without individually checking each person.
**Acceptance criteria:** Given a manager's team has mixed completion status, when they view the team training dashboard, then overdue items are visually prioritised over on-track/completed ones.

## 9. Functional requirements

Course catalogue; learning paths; mandatory/compliance training with rule-based auto-assignment (§7.1); role-based learning recommendations; self-enrolment and manager nomination with approval where required (e.g., budget-relevant external courses); instructor-led and online-course support; external-course logging (for training completed outside the platform, still tracked for record purposes); certifications with expiry tracking and renewal reminders; assessments; attendance tracking for instructor-led sessions; completion tracking; learning-credit/training-budget management (Enterprise phase); training feedback; skill-gap analysis (linking role requirements to individual skill records, informed by Module 9); learning reports; external LMS integration (Module 23).

## 10. Business rules

Mandatory-training applicability rules are the compliance-relevant core of this module and must be configurable without a code deployment (same "versioned configuration, not hard-coded logic" principle established in Module 6 §10 for statutory rules) — e.g., "all employees in Karnataka complete X training annually" should be a policy configuration, not a hard-coded rule.

## 11. Validation rules

A course marked "mandatory" cannot be deleted/deactivated while employees have incomplete assignments against it without an explicit reassignment/cancellation decision.

## 12. Permission requirements

Employees see their own training record; Managers see direct reports' completion status (not necessarily assessment-score detail, which may be more sensitive — configurable); HR Administrator/Compliance/Audit User see full org-wide records for compliance-reporting purposes.

## 13. Approval workflows

Manager approval for budget-relevant external-course enrolment (Module 17); no approval needed for mandatory-training completion itself (it's an obligation, not a discretionary request).

## 14. Statuses and state transitions

**Enrolment:** Assigned → In Progress → Completed/Overdue/Exempted (an explicit exemption state, with mandatory reason, for legitimate cases — e.g., an employee on extended leave during the training window — rather than letting them sit permanently "Overdue" incorrectly). **Certification:** Active → Expiring Soon (reminder threshold) → Expired → Renewed.

## 15. Record detail-page requirements

Employee training-record page: all assignments (mandatory and elective) with status, certificates/evidence, certification-expiry timeline — cross-linked from Module 1's Employee Detail page, not a disconnected separate destination.

## 16. Search, filter and sorting requirements

Catalogue search/filter by category, mandatory-status, role-applicability; team training dashboard filterable by completion status (US-2).

## 17. Bulk-action requirements

Bulk mandatory-training assignment (e.g., rolling out a new compliance requirement org-wide); bulk reminder-send for overdue items.

## 18. Import and export requirements

External-course completion bulk import (for training completed outside the platform, e.g., in a legacy LMS being migrated from); compliance-evidence export (US-1).

## 19. Notification requirements

**In-app/email:** new mandatory assignment, deadline-approaching (escalating to manager if overdue), certification-expiry-approaching. **Mobile push:** deadline reminders — moderate priority.

## 20. Mobile requirements

View assignments/deadlines, mark external-course completion, view certificates — full course-content consumption on mobile is dependent on the specific content type/external LMS capability, not a hard requirement of this module itself.

## 21. Reporting requirements

Mandatory-training completion rate (org-wide and by department/location), certification-expiry report, training-budget utilisation (Enterprise), skill-gap summary.

## 22. Audit-log requirements

Every assignment, completion, exemption (with reason), and certification-expiry event — retained per Phase 11's compliance-evidence retention requirement (likely longer retention than typical operational data, given audit-defense purpose).

## 23. Integration requirements

Module 3 (onboarding-triggered assignment), Module 1 (role/location-change-triggered assignment), Module 9 (skill-gap input), Module 23 (external LMS content/completion sync).

## 24. Error, empty, and edge cases

**Error states:** external LMS sync failure (should not silently mark a real completion as incomplete — needs a manual-override/reconciliation path with clear failure visibility to HR Administrator, not just employees stuck in limbo). **Empty states:** new tenant with no courses configured yet. **Edge cases:** an employee on extended leave during a mandatory-training window (§14's Exempted state addresses this); a certification that expires mid-review-cycle (Module 9 coordination, if certification status feeds any goal/competency tracking).

## 25. Acceptance criteria

Given a mandatory-training applicability rule changes (e.g., a new location added to scope), when the rule is updated, then all newly-in-scope employees are automatically enrolled without requiring a manual bulk-assignment action.

## 26. Dependencies

Module 1, Module 3, Module 9, Module 17, Module 23.

## 27. Risks

Attempting to build deep content-authoring/LMS capability natively (rather than integrating with dedicated LMS platforms) risks significant scope creep for comparatively low differentiation value, per the Darwinbox-evidenced "shallow L&D" competitor gap — better to be excellent at mandatory-training tracking and good at integration than mediocre at everything.

## 28. Open questions

None beyond those already carried from other modules — this is a comparatively lower-ambiguity module.

## 29. Release scope

**MVP:** course catalogue, mandatory-training auto-assignment and tracking (§7.1), certifications with expiry tracking, manager team-dashboard, external-course logging.
**Later phase:** training budgets (Enterprise), skill-gap analysis depth, AI-assisted learning recommendations (Module 25).
**Out of scope:** native content authoring/hosting at dedicated-LMS depth (video hosting, SCORM authoring tools) — this module integrates with external LMS platforms for that (Module 23) rather than building it natively, a deliberate scope boundary per [03-product-vision.md](../03-product-vision.md).
