# Module 13 — Documents and Letters

**Status:** Draft v1 (pending stakeholder review) · **Release:** HR Operations
**Depends on:** Module 1 (Core HR — dynamic variable source), Module 17 (Workflow Engine), Module 23 (e-signature integration)

---

## 1. Module overview

The employee document repository plus template-driven letter generation (offer, appointment, confirmation, promotion, transfer, compensation, warning, experience, relieving, custom) with dynamic variables, versioning, approval, e-signature, and access control. This module is used by nearly every other module (Module 3's offer/policy documents, Module 6's payslips/compensation letters, Module 15's relieving/experience letters) as a shared service, not a standalone destination most users visit directly.

## 2. Problem statement

Letter generation is a recurring, error-prone manual task (mail-merge-style, often done in a separate word processor disconnected from the HRIS) across every competitor's implied workflow — dynamic-variable accuracy (the letter must reflect the *current, correct* employee data at generation time) and version control (which template version was used for which employee, at what date) are the two places this typically goes wrong.

## 3. Business objective

Make letter generation a reliable, templated, auditable, one-click-from-the-relevant-record action (e.g., generate a promotion letter directly from a Module 1 promotion event) rather than a disconnected manual task, with full document lifecycle management (repository, categories, access control, expiry tracking) for everything else.

## 4. User personas

Primary: **HR Executive** (generate letters, manage documents), **Employee** (view/download own documents, acknowledge). Secondary: **HR Administrator** (template management/approval), **Compliance/Audit User** (document-audit access).

## 5. User needs

HR needs to generate a correct letter in one action from the record that triggered it (a promotion, a transfer) without manually re-typing employee-specific details. Employee needs a reliable, permanent place to find their own documents (offer letter, payslips-adjacent letters, experience letter) without asking HR to resend something they should already have access to.

## 6. Primary use cases

Generate a letter from a template (triggered from another module's event, or standalone); manage document templates with dynamic variables; version and approve templates; collect digital signatures/acknowledgements; browse/search the document repository; track document expiry (e.g., work-authorisation documents); bulk letter generation (e.g., annual compensation-revision letters for many employees at once); manage document access control.

## 7. Detailed workflows

### 7.1 Triggered letter generation

- **Trigger:** Another module's event completes (e.g., Module 1's promotion approval, Module 6's compensation revision, Module 15's relieving-date confirmation).
- **Steps:** 1) Triggering module requests a letter of the relevant type, passing the employee reference and event context 2) System selects the applicable, currently-approved template version for that letter type (and, where relevant, that legal entity/location, since letter wording/statutory references can vary) 3) Dynamic variables are populated from the *current* Module 1 employee data plus the event-specific context (e.g., new designation, new salary, effective date) 4) Generated letter is routed for any configured approval (e.g., a warning letter likely needs HR Administrator sign-off; a routine confirmation letter might not) 5) On approval (or immediately if no approval required), letter is finalised, stored in the employee's document repository, and — if the letter type requires it — sent for e-signature/acknowledgement (Module 23) 6) Employee is notified and can view/download.
- **Decision points:** Template version selection must be deterministic and correct even if the template is being actively revised — a letter generated today should never accidentally use a draft/unapproved template version.
- **Failure handling:** Missing dynamic-variable data (e.g., a field the template needs isn't populated on the employee record) should block generation with a specific, actionable error, never silently generate a letter with a blank/placeholder value in a legal document.
- **Audit events:** `DocumentGenerated`, with template version, triggering event reference, and generating actor recorded.

## 8. User stories

**US-1**
As an **HR Executive**, I want a promotion letter to generate automatically with the correct new designation and effective date the moment a promotion is approved in Module 1, so that I don't manually re-type details that already exist in the system.
**Acceptance criteria:** Given a promotion is approved (Module 1 §7.2), when the letter-generation trigger fires, then the generated letter's designation/grade/effective-date fields exactly match the approved Employment Assignment record, with no manual re-entry step.

**US-2**
As an **Employee**, I want all my official documents (offer letter, confirmation letter, any letters issued to me) in one place I can access indefinitely, so that I don't need to ask HR to resend something years later (e.g., for a loan application requiring proof of employment history).
**Acceptance criteria:** Given a letter was generated for an employee at any point in their employment (including after separation, within the configured retention period), when they access their document repository, then it remains available for download.

## 9. Functional requirements

Employee document repository with categories; document templates with dynamic-variable support; letter types (offer, appointment, confirmation, promotion, transfer, compensation, warning, experience, relieving, custom); template versioning with an approval gate before a version becomes "live" for generation; digital signatures/acknowledgement tracking (Module 23); document-expiry tracking (e.g., work-authorisation renewal reminders, feeding Module 1's notification requirements); access control (who can view which document category — a warning letter has narrower visibility than an offer letter, by default); bulk generation (e.g., an annual compensation-revision-letter batch, following the same batch/reason_code pattern established in [05-organisation-data-model.md](../05-organisation-data-model.md) §9); document audit logs.

## 10. Business rules

A template must be in "Approved" status to be used for live generation — draft/under-review template versions cannot be triggered accidentally (§7.1's determinism requirement). Warning/disciplinary letters default to a narrower visibility scope (HR Administrator + the employee themself + their direct manager, not general HR Executive visibility) given their sensitivity — configurable, but the default should err toward restriction, not openness.

## 11. Validation rules

Generation blocks if any required dynamic variable is unpopulated on the source record (§7.1's failure-handling rule, restated as a formal validation rule).

## 12. Permission requirements

Document-category-level access control (§9); template management (create/edit/approve) is HR-Administrator-tier, not HR-Executive, given template errors propagate to every future letter generated from them.

## 13. Approval workflows

Template-version approval (before it can be used live, §10); per-letter-type approval configuration (e.g., warning letters require sign-off, routine confirmation letters may not) via Module 17.

## 14. Statuses and state transitions

**Template:** Draft → Under Review → Approved → (new edit creates a new Draft version, old Approved version remains usable until the new one is approved — never a gap where no approved version exists). **Generated document:** Generated → Pending Approval (if required) → Approved/Rejected → Pending Signature (if required) → Signed/Acknowledged → Finalised.

## 15. Record detail-page requirements

Document repository (per employee, accessed from Module 1's Employee Detail page per that module's §15): categorised list, each document showing generation date, template version used, signature/acknowledgement status, expiry date if applicable. Template management page (HR Administrator): version history, approval status, a preview-with-sample-data capability so administrators can verify a template renders correctly before approving it live.

## 16. Search, filter and sorting requirements

Document repository filterable by category, date range, expiry status; template library searchable by letter type.

## 17. Bulk-action requirements

Bulk letter generation (§9) with mandatory preview-before-send, given the legal/formal nature of these documents makes a bulk-generation mistake more consequential than most other bulk actions in the product.

## 18. Import and export requirements

Bulk document import (for migrating historical documents from a prior system); individual and bulk document export/download.

## 19. Notification requirements

**In-app/email:** new document available, signature/acknowledgement requested, document-expiry approaching (e.g., work-authorisation), template-approval-pending (to HR Administrator).

## 20. Mobile requirements

View/download own documents, complete e-signature/acknowledgement on mobile (a real convenience need — signing a policy acknowledgement shouldn't require desktop access). Template management and bulk generation are desktop-only.

## 21. Reporting requirements

Document-generation volume by type, e-signature/acknowledgement completion rate, expiring-document report (compliance-relevant for work-authorisation tracking).

## 22. Audit-log requirements

Every document generation, approval, signature/acknowledgement, and access (view/download) — per Phase 11, especially important for sensitive-category documents (§10).

## 23. Integration requirements

Every other module as a triggering source (§7.1); Module 23 (e-signature provider); Module 1 (dynamic-variable data source).

## 24. Error, empty, and edge cases

**Error states:** missing dynamic-variable data (§10/§11); e-signature-provider integration failure (should not silently mark a document as signed — needs clear pending/failed status distinct from success). **Empty states:** new employee with no documents generated yet. **Edge cases:** a template revised (new version approved) after some employees already have letters generated from the old version — those existing letters must remain valid/unchanged (never retroactively "updated" by a template change); a separated employee requesting a historical document years later (§8 US-2's retention requirement, needing to work correctly even for an employee whose Module 1 record is in a terminal/archived state).

## 25. Acceptance criteria

Given a document template is revised and re-approved, when a previously-generated letter (from the prior template version) is viewed, then it displays exactly as originally generated, unaffected by the new template version — document generation is a point-in-time snapshot, not a live-rendered view.

## 26. Dependencies

Module 1, Module 17, Module 23. Consumed by Module 3, Module 6, Module 15, Module 20 (policy documents may share this repository/template infrastructure).

## 27. Risks

Incorrect dynamic-variable population in a legal document (offer letter, compensation letter) has real legal/reputational consequences beyond a typical software bug — this module's testing bar should be correspondingly higher, especially around the "current, correct data at generation time" guarantee.

## 28. Open questions

None significant beyond what's flagged inline — this module is comparatively well-specified by the brief's own detail.

## 29. Release scope

**MVP:** document repository, template management with versioning/approval, triggered generation from Module 1/6/15 events, e-signature integration, access control by category, expiry tracking.
**Later phase:** bulk generation UI refinement, AI-assisted template drafting (Module 25).
**Out of scope:** this module is not a general-purpose document-management/collaboration platform (no real-time co-editing) — it's a templated-generation-and-repository service, consistent with [03-product-vision.md](../03-product-vision.md) Product Boundaries.
