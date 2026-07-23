# Module 8 — Recruitment and Applicant Tracking

**Status:** Draft v1 (pending stakeholder review) · **Release:** Talent
**Depends on:** Module 2 (Organisation — requisition/position linkage), Module 1 (Core HR — candidate-to-employee handoff), Module 17 (Workflow Engine)

---

## 1. Module overview

Manpower requisition through offer acceptance: job posting, candidate sourcing/screening, interview coordination, scorecards, offers, background checks, and the handoff into Module 3 (Onboarding). Phase 2 research found this to be a genuine area of competitive depth for Keka and Darwinbox (both with mature, workflow-automated ATS) and a **confirmed absence** for RazorpayX — recruitment depth is a real, evidenced differentiator to get right, not a checkbox feature.

## 2. Problem statement

Recruiter time is consumed by coordination overhead (interview scheduling back-and-forth, chasing feedback) more than by decision-making itself; and the ATS-to-HRIS handoff at hire time is a common point of data re-entry and drift when the two aren't part of one unified system (a direct instance of the market research §8 "one-way sync" pattern this product is architected to avoid).

## 3. Business objective

Reduce time-to-hire and recruiter coordination overhead through configurable workflow automation (matching the depth of Keka Hire's Event/Condition/Action model, found to be a genuine competitive strength in Phase 2 research), while making the hire-to-employee handoff a native, zero-re-entry transition rather than an integration.

## 4. User personas

Primary: **Recruiter** (owns the pipeline). Secondary: **People Manager/Department Head** (hiring manager — requisition approval, interview participation, offer decision), **HR Executive** (offer-letter generation, coordination), **Employee** (interview panel member, via a lightweight feedback interface).

## 5. User needs

Recruiter needs to reduce time spent on scheduling coordination and chasing interview feedback. Hiring Manager needs a simple way to review candidates and give structured feedback without learning a complex tool. Candidate (external, not a system persona but a real UX stakeholder) needs a professional, low-friction application and communication experience — competitor research flagged candidate self-scheduling (Darwinbox) as a genuine efficiency and experience win.

## 6. Primary use cases

Raise and approve a job requisition; publish a job (career site, job boards); receive and screen applications; schedule interviews; collect structured interview feedback; manage candidate pipeline stages; generate and manage offers; initiate background checks; convert an accepted offer into a Module 1 employee record; maintain a talent pool for future roles; track recruitment funnel analytics.

## 7. Detailed workflows

### 7.1 Requisition to job posting

- **Trigger:** Hiring need identified (new headcount or backfill).
- **Steps:** 1) Hiring Manager/Department Head raises a requisition (role, grade, headcount, budget, justification; linked to a Module 2 Position if Position Management is enabled) 2) Routed for approval (Department Head/Finance/HR per Module 17 configuration, especially budget-relevant for new headcount vs. backfill) 3) On approval, Recruiter creates the job posting (from a template, customisable) and publishes to career site and configured job boards (Module 23) 4) Applications begin flowing into the candidate pipeline.
- **Audit events:** `RequisitionApproved`, `JobPublished`.

### 7.2 Candidate pipeline through offer

- **Trigger:** Application received (career site, job board, referral, or agency).
- **Steps:** 1) Resume parsed (where feasible) into a structured candidate profile; duplicate-candidate detection run against existing candidate/talent-pool records 2) Recruiter screens and moves candidate through configurable pipeline stages (Applied → Screening → Interview → Offer → Hired/Rejected, customisable per role) 3) Interviews scheduled — candidate self-scheduling against panel availability where enabled (directly modelled on Darwinbox's evidenced efficiency win) 4) Structured scorecards collected per interviewer, with a reminder/escalation if feedback is overdue (a named recruiter pain point per [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 5) 5) On a positive decision, offer is drafted (from a template, with compensation-band validation) and routed for approval (HR/Finance/Department Head per amount/grade threshold) 6) Offer sent to candidate; acceptance/rejection/negotiation tracked 7) On acceptance, background-verification request triggered (Module 23 provider) and candidate is queued for conversion (§7.3).
- **Decision points:** Offer outside the approved compensation band → mandatory escalation, cannot be sent without override approval (mirrors the payroll-variance-gate pattern established in Module 6 §7.1 — consistent guardrail philosophy across the product).
- **Failure handling:** Candidate rejection at any stage — configurable, consistent rejection communication (avoiding the ad hoc, inconsistent-experience risk); withdrawn candidates tracked distinctly from rejected ones for funnel-analytics accuracy.
- **Audit events:** `CandidateStageChanged`, `OfferApproved`, `OfferAccepted`/`OfferRejected`.

### 7.3 Candidate-to-employee conversion

*(Full cross-module detail in [06-cross-module-workflows.md](../06-cross-module-workflows.md) Workflow #1 — this section is the Module 8 side of the handoff already described from Module 3's perspective in [03-employee-onboarding.md](03-employee-onboarding.md) §7.1.)*

- **Trigger:** Offer accepted.
- **Steps:** 1) System validates the candidate profile has the minimum data needed to seed a Module 1 Draft Employee record (no manual re-entry of anything already captured during the application/offer process) 2) Draft Employee record created, linked bidirectionally to the source candidate record (so recruitment funnel reporting remains accurate even after the person becomes an employee) 3) Module 3 onboarding kicks off automatically.
- **Audit events:** `CandidateHired`, cross-referenced to both the Module 8 candidate record and the new Module 1 employee record.

## 8. User stories

**US-1**
As a **Recruiter**, I want candidates to self-schedule interviews against my panel's available slots, so that I'm not spending hours on back-and-forth scheduling emails.
**Acceptance criteria:** Given a panel's availability is configured, when a candidate is invited to schedule, then they can pick from genuinely available slots without the recruiter manually checking calendars — a double-booking must be structurally prevented, not just discouraged.

**US-2**
As a **Hiring Manager**, I want a simple, structured scorecard for each interview, so that I can give useful feedback quickly instead of writing an unstructured email.
**Acceptance criteria:** Given an interview is completed, when the interviewer hasn't submitted feedback within a configured window, then they receive an escalating reminder, and the recruiter can see feedback-completion status for the whole panel at a glance.

**US-3**
As an **HR Executive**, I want an accepted offer to become an employee record automatically, so that I never have to manually re-enter a candidate's data into the HRIS.
**Acceptance criteria:** Given an offer is marked Accepted, when the conversion runs, then a Draft Employee record (Module 1) exists with all previously-captured candidate data pre-populated, and Module 3's onboarding checklist is automatically instantiated — with zero manual data re-entry.

## 9. Functional requirements

Manpower/job requisition with approval workflow; job templates; job publishing (career site, job-board integrations, Module 23); candidate application capture with resume parsing; candidate profiles with source tracking (job board, referral, agency); employee-referral program support; recruitment-agency management; screening; interview scheduling with candidate self-scheduling option; interview panels and structured scorecards; configurable candidate pipeline stages; assessments (integration point, Module 23); candidate communication (templated, consistent); offer approval/generation/revision with compensation-band validation; background-check initiation and status tracking (Module 23 provider); talent-pool/candidate-database with duplicate detection; recruitment analytics (time-to-hire, cost-per-hire, source effectiveness); candidate-to-employee conversion (§7.3).

## 10. Business rules

Offers outside approved compensation bands require escalated approval before sending (§7.2). Rejected/withdrawn candidate PII is retained only per a configured retention period, then anonymised/purged (Phase 11 data-privacy requirement — candidates are non-employees whose data-privacy rights still apply, and indefinite retention "just in case" is not a default this product should ship with).

## 11. Validation rules

Requisition cannot be published without an approved budget/headcount reference (if Position Management/budget tracking is enabled — otherwise a lighter-weight sign-off, per Module 2's MVP-vs-Enterprise scoping). Offer compensation must reference a valid Grade/Band per [05-organisation-data-model.md](../05-organisation-data-model.md) §6, not a free-text number disconnected from the org's compensation framework.

## 12. Permission requirements

Recruiters have broad pipeline access for active requisitions only, not indefinite access to historical/closed pipelines beyond a reporting/analytics view (least-privilege, per [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 5's sensitive-information restrictions). Interview panel members get scoped access limited to candidates they're interviewing, not the full pipeline.

## 13. Approval workflows

Requisition approval (budget/headcount-dependent routing); offer approval (compensation-band-dependent routing, §7.2); both via Module 17.

## 14. Statuses and state transitions

**Requisition:** Draft → Pending Approval → Approved/Rejected → Published → On Hold → Closed. **Candidate application:** Applied → Screening → Interview → Offer → Hired/Rejected/Withdrawn (each with sub-stages as pipeline stages are configurable). **Offer:** Draft → Pending Approval → Sent → Accepted/Rejected/Negotiating/Expired → (if Accepted) Converted.

## 15. Record detail-page requirements

Candidate detail page: profile, application source, pipeline-stage history, all interview scorecards in one place (not scattered), offer details/history (including revisions), background-check status, communication log. Requisition detail page: approval history, linked postings, pipeline summary (funnel view for this specific requisition, not just org-wide).

## 16. Search, filter and sorting requirements

Candidate search/filter by stage, source, requisition, skill/keyword (from parsed resume data); talent-pool search for future-role sourcing.

## 17. Bulk-action requirements

Bulk candidate-stage advancement/rejection for a batch (e.g., after a hiring-event/walk-in drive); bulk communication (templated, to a filtered candidate segment).

## 18. Import and export requirements

Resume/candidate bulk import (e.g., from a hiring event or an agency's candidate list); recruitment-funnel export for analytics.

## 19. Notification requirements

**In-app/email:** requisition approval status, new application received, interview scheduled/reminder, feedback-overdue escalation, offer status, candidate communication. **Mobile push:** feedback-overdue reminders to interviewers, approval-pending to hiring managers.

## 20. Mobile requirements

Interview feedback submission on mobile (a genuine efficiency win — interviewers often complete feedback shortly after the interview, sometimes away from their desk); candidate pipeline status check; approval notifications for offers.

## 21. Reporting requirements

Time-to-hire, cost-per-hire, source effectiveness, requisition ageing, funnel conversion by stage, interviewer feedback-completion rate (an internal-efficiency metric, not just candidate-facing).

## 22. Audit-log requirements

Every stage change, every offer approval/revision, every background-check initiation (PII-sensitive, per [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 5) — per Phase 11.

## 23. Integration requirements

Module 1 (conversion handoff, §7.3), Module 23 (job boards, background-verification providers, resume-parsing/assessment tools, career-site hosting), Module 13 (offer-letter templates/e-signature).

## 24. Error, empty, and edge cases

**Error states:** duplicate candidate detected on application (surface clearly, link to existing profile rather than silently creating a duplicate or silently merging without review). **Empty states:** a new requisition with zero applications yet should prompt sourcing actions, not sit as a bare empty pipeline. **Edge cases:** a candidate who withdraws after offer acceptance but before joining (must be distinguishable from a Module 3 no-show, since it's a pre-Module-1-handoff event — the conversion in §7.3 should not have happened yet at this point, so this is purely a Module 8 state, not a Module 3 one); a rehire scenario where the "new candidate" is actually a former employee (Cross-Module Workflow #17) — should surface the historical employment record for recruiter awareness, not treat as fully unknown.

## 25. Acceptance criteria

Given a candidate's offer is accepted, when the conversion workflow runs, then a Module 1 Draft Employee record and Module 3 onboarding checklist are both created within the same transaction — never a partial handoff where one exists without the other.

## 26. Dependencies

Module 1, Module 2 (Position/requisition linkage, Enterprise phase), Module 3, Module 13, Module 17, Module 23.

## 27. Risks

Resume-parsing and background-check-provider integrations are genuine third-party dependencies whose reliability directly affects this module's usability — flagged as vendor-selection risk for Module 23, not purely a software-design concern.

## 28. Open questions

- Should requisition-to-Position linkage (Module 2's Enterprise-phase Position Management) be a hard MVP dependency, or can MVP recruitment operate against a lighter-weight "headcount request" concept without full Position Management? Recommend the latter for MVP, consistent with Module 2's own MVP/Later-phase split — flagged for cross-module design consistency check.

## 29. Release scope

**MVP:** requisition + approval, job posting, application capture with resume parsing, pipeline management, interview scheduling + scorecards, offer generation/approval, background-check status tracking, candidate-to-employee conversion, basic funnel analytics.
**Later phase:** candidate self-scheduling (high value, but flagged later given calendar-integration complexity — reconsider for MVP if calendar integration proves straightforward), AI-assisted resume screening/candidate matching (Module 25), full talent-pool/sourcing-campaign tooling.
**Out of scope:** this module is not a full-scale sourcing/CRM tool for passive-candidate outreach campaigns (that's a specialised recruiting-marketing category this product doesn't attempt to replace).
