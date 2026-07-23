# Module 25 — AI-Assisted Capabilities

**Status:** Draft v1 (pending stakeholder review) · **Release:** Enterprise (most capabilities) / selective earlier where low-risk
**Depends on:** every module an AI capability assists; Module 21 (Roles and Permissions — AI access must respect the same boundaries as human access); Module 10-Security ([10-security-privacy-audit.md](../10-security-privacy-audit.md))

---

## 1. Module overview

AI as an **assistive layer with mandatory human review for consequential decisions**, per the brief's own explicit framing — not an autonomous decision-maker. Phase 2 research found this to be an active, fast-moving competitive area (Darwinbox's "Super Agent"/MCP-server orchestration, Rippling's AI workflow generation, Zoho's "Zia" assistant) but also found evidence of a gap between AI-forward marketing and delivered value (Darwinbox reviewers: "still requiring manual follow-ups despite automation marketing") — this module is deliberately scoped to avoid that specific credibility gap by being conservative about what's promised versus what's shipped.

## 2. Problem statement

AI capabilities in HR software carry specific, serious risks beyond typical feature risk: biased or discriminatory outcomes (especially in recruitment/performance), incorrect information given confidently to employees (an HR policy assistant hallucinating a wrong answer has real consequences), and privacy/data-exposure risk if models are trained on or given access to sensitive tenant data without careful isolation. Competitor marketing in this space often outpaces demonstrated reliability.

## 3. Business objective

Deploy AI capabilities that measurably help (reduce recruiter/HR/manager time on genuinely repetitive tasks, surface anomalies humans might miss) while keeping humans in the loop for every consequential decision, with explicit, auditable logging of AI-generated content/decisions, and hard tenant-data isolation for any AI processing.

## 4. User personas

Varies per capability (§9) — spans nearly every persona in [04-personas-and-roles.md](../04-personas-and-roles.md) as an assistive layer within their existing workflows, not a new destination.

## 5. User needs

Every persona using an AI-assisted feature needs to trust the output enough to find it useful, but never be put in a position of blindly trusting an AI output for something consequential (a compensation decision, a candidate rejection, a policy answer with legal implications) without a clear human-review step.

## 6. Primary use cases (per the brief's explicit list)

HR policy assistant; employee helpdesk assistant; resume summarisation; job-description assistance; candidate-matching assistance; interview-question suggestions; onboarding guidance; payroll anomaly detection; attendance anomaly detection; attrition-risk indicators; engagement-summary generation; survey-comment summarisation; performance-review-writing assistance; learning recommendations; report summarisation; natural-language report generation.

## 7. Detailed workflows

### 7.1 Generic AI-capability pattern (applies to every capability in §9)

- **Trigger:** User invokes or is offered an AI-assisted action within an existing module workflow (never a new, separate "AI module" destination — this is a deliberate integration choice, keeping AI assistance embedded in context rather than a novelty feature area).
- **Steps:** 1) AI generates a suggestion/draft/summary/flag based on the relevant, permission-scoped data (never data the invoking user wouldn't otherwise be entitled to see — AI access strictly respects Module 21's existing permission boundaries, no exceptions) 2) Output is clearly labelled as AI-generated, never presented as if it were a human-authored or definitively-correct system output 3) For any consequential capability (a performance-review draft, a candidate-rejection suggestion, a compensation-anomaly flag affecting a real payroll decision), **the output requires explicit human review and action before it has any real-world effect** — the AI never directly executes a business action (approves a review, rejects a candidate, changes a payroll input) on its own 4) The interaction (prompt/input, output, whether the human accepted/edited/rejected it) is logged.
- **Decision points:** Human-review requirement is capability-specific (§9's per-capability table) — some capabilities (report summarisation) are lower-stakes and may need lighter review than others (performance-review-writing assistance, where an under-reviewed AI draft could embed bias into a real evaluation).
- **Failure handling:** Incorrect AI output should be easy to report/flag (feeding a quality-improvement loop) and should never silently persist as if correct — e.g., an anomaly-detection false positive should be dismissible with a clear, logged reason, not just ignored.
- **Audit events:** `AISuggestionGenerated`, `AISuggestionAccepted`/`AISuggestionRejected`/`AISuggestionEdited` — this pairing (what the AI suggested vs. what the human actually did) is the core evidentiary record for both quality-improvement and bias/incorrect-output-handling purposes.

## 8. User stories

**US-1**
As a **Recruiter**, I want an AI-generated candidate summary from a resume, so that I can screen faster, while retaining full ability to review the original resume myself before making any decision.
**Acceptance criteria:** Given an AI-generated resume summary is shown, when the recruiter views it, then the original resume remains one click away and the summary is clearly labelled as AI-generated, not presented as an authoritative substitute for reading the actual resume.

**US-2**
As a **Payroll Executive**, I want AI-flagged payroll anomalies to be suggestions I review, not automatic corrections, so that a false positive doesn't silently alter a real payroll calculation.
**Acceptance criteria:** Given the anomaly-detection capability flags a payroll-input variance, when the Payroll Executive reviews it, then the flag is informational only — the underlying Module 6 §7.1 variance-review workflow (already required regardless of AI involvement) is what actually gates the payroll lock, not the AI flag itself.

**US-3**
As an **HR Administrator**, I want to see how often employees accept vs. reject/edit AI-generated policy-assistant answers, so that I can identify where the assistant is unreliable and needs better underlying content (linking to Module 12's knowledge-base quality, since a policy assistant is only as good as the policy content it draws from).
**Acceptance criteria:** Given the HR policy assistant has been used for a period, when the HR Administrator reviews its usage report, then acceptance/correction rates are visible by topic/category, surfacing specific weak areas rather than a single opaque satisfaction number.

## 9. Functional requirements, per capability

| Capability | User benefit | Data required | Human-review requirement | MVP or later |
|---|---|---|---|---|
| HR policy assistant | Fast, consistent answers to policy questions | Module 20 policy content (tenant-scoped only) | Answers should cite the source policy; low-stakes but still logged for accuracy monitoring (§8 US-3) | Later phase |
| Employee helpdesk assistant | Deflects repetitive tickets (Module 12) | Module 12 knowledge base | Same as above; explicit handoff to a human ticket if unresolved | Later phase |
| Resume summarisation | Faster candidate screening | Candidate resume (Module 8) | Original resume always available; no auto-decision | Later phase |
| Job-description assistance | Faster, more consistent JD drafting | Role/grade data (Module 2/8) | Human edits/approves before publishing (Module 8 §7.1) | Later phase |
| Candidate-matching assistance | Surfaces relevant candidates faster | Candidate/requisition data (Module 8) | Suggestion only — recruiter makes the actual pipeline decision; explicit bias-risk flag (§10) | Later phase |
| Interview-question suggestions | Helps interviewers prepare structured questions | Role/competency data (Module 8/9) | Low-stakes, lighter review | Later phase |
| Onboarding guidance | Answers new-hire questions during preboarding | Module 3 checklist/policy content | Same pattern as policy assistant | Later phase |
| Payroll anomaly detection | Surfaces likely payroll errors before lock | Payroll input/history (Module 6, tightly scoped) | Suggestion only, feeds existing Module 6 §7.1 variance-review gate, never bypasses it (§8 US-2) | **MVP candidate** — high value, and the underlying human-gated workflow already exists, making this a comparatively low-incremental-risk addition |
| Attendance anomaly detection | Surfaces likely attendance-data issues | Attendance data (Module 4) | Suggestion only, feeds existing Module 4 regularisation review | **MVP candidate**, same reasoning |
| Attrition-risk indicators | Early signal for retention conversations | Aggregated, permission-scoped HR data | Explicit bias/fairness review required before any org-wide rollout (§10) — this is one of the higher-risk capabilities given potential for self-fulfilling or discriminatory outcomes if mishandled | Later phase, with explicit fairness review as a launch gate |
| Engagement-summary generation | Faster synthesis of survey/engagement data for leadership | Module 11 aggregated (never individual, per that module's anonymity requirements) data | Must inherit Module 11 §7.1's anonymity-enforcement rigor — an AI summary must not be capable of re-identifying individual responses | Later phase |
| Survey-comment summarisation | Faster synthesis of open-text survey responses | Module 11 survey free-text (anonymity-scoped) | Same anonymity requirement as above | Later phase |
| Performance-review-writing assistance | Helps managers draft more complete, specific reviews | Module 9 goal/feedback data for that employee | **High human-review requirement** — an AI-drafted review must be clearly a draft the manager substantially reviews/personalises, given real risk of generic, bias-laundering, or inaccurate content in a document with real career consequences | Later phase, conservative rollout |
| Learning recommendations | Personalised course suggestions | Module 10 skill-gap/role data | Low-stakes, suggestion only | Later phase |
| Report summarisation | Faster executive consumption of report data | Module 19 report data (permission-scoped) | Low-stakes; should cite underlying figures, not replace them | Later phase |
| Natural-language report generation | Ask a question, get a report/answer | Module 19 data (permission-scoped, critically important this respects drill-down permission limits per Module 19 §7.1) | Must never bypass Module 21 scoping to answer a question the user's role wouldn't otherwise be able to see the underlying data for | Later phase |

## 10. Business rules

**No AI capability may take a consequential action autonomously** — every one of the capabilities above either produces a suggestion a human acts on, or is purely informational/summarising. **No AI capability may access data beyond the invoking user's existing permission scope** (Module 21) — an AI feature is not a permission-bypass mechanism, the same principle established for Module 19's report builder applied here. **Anomaly-detection and risk-scoring capabilities (payroll, attendance, attrition) require an explicit, documented fairness/bias review before general availability**, not just a technical accuracy check — given the specific, real risk of these capabilities encoding or amplifying bias if trained/tuned carelessly.

## 11. Validation rules

Every AI-generated output must be labelled as such in the UI, with no design pattern that could reasonably cause a user to mistake it for definitively-correct or human-authored content (§7.1's core UX requirement, restated as a hard validation/design rule).

## 12. Permission requirements

Identical scoping to the underlying data/action being assisted (§10) — this module introduces no new permission surface, only inherits and must never violate existing ones.

## 13. Approval workflows

Not a new approval-workflow type — AI suggestions feed into and are gated by the *existing* approval workflows of the module they assist (§7.1/§8 US-2), never a separate, AI-specific approval bypass.

## 14. Statuses and state transitions

**AI suggestion instance:** Generated → Presented → Accepted/Edited/Rejected/Ignored — this is the record §7.1's audit events capture.

## 15. Record detail-page requirements

AI capabilities are embedded within their host module's existing UI (§7.1) — this module has no independent detail pages of its own, only an administrative "AI capability usage/quality" dashboard (§8 US-3) for HR/System Administrators.

## 16. Search, filter and sorting requirements

AI-usage/quality dashboard filterable by capability, acceptance/rejection rate, date range.

## 17. Bulk-action requirements

Not applicable — AI suggestions are inherently individual/contextual, not a bulk-action surface.

## 18. Import and export requirements

Not applicable.

## 19. Notification requirements

None beyond what the host module already provides — an AI suggestion appearing in-context doesn't warrant a separate notification channel.

## 20. Mobile requirements

Lower-stakes, lighter-weight AI suggestions (e.g., learning recommendations, report summaries) can reasonably appear on mobile within their host module's mobile surface (Module 24); higher-stakes ones (performance-review-writing assistance) are appropriately desktop-oriented given the review-depth requirement.

## 21. Reporting requirements

AI capability usage/acceptance-rate dashboard (§8 US-3) — this is this module's own primary reporting surface, distinct from and feeding into the broader quality/trust question of whether AI investment is paying off.

## 22. Audit-log requirements

Every AI suggestion generated and every human action taken on it (§7.1) — retained per Phase 11, with particular importance for any capability that could later be scrutinised for bias (recruitment-matching, attrition-risk, performance-review-assistance).

## 23. Integration requirements

Depends on an underlying AI/LLM provider (a Module 23-adjacent integration decision — which provider, whether tenant data is used for model training by that provider — an explicit, critical data-governance question that must be resolved with a "no, tenant data is never used to train a shared/foundation model" guarantee, not left ambiguous, given the sensitivity of HR/payroll data).

## 24. Error, empty, and edge cases

**Error states:** AI-provider outage or degraded output quality — the host module's normal (non-AI) workflow must continue to function fully without the AI assistance present, since these are additive capabilities, never a hard dependency for core functionality. **Empty states:** insufficient data for a given tenant to produce a meaningful AI output (e.g., attrition-risk indicators need historical data a brand-new tenant doesn't have yet) — should clearly communicate "not enough data yet" rather than producing a low-confidence, misleading output. **Edge cases:** a user who explicitly opts out of AI-assisted features (§10's opt-out requirement, per the brief) — the underlying module must work identically well without any AI assistance, reinforcing the "additive, never required" design principle.

## 25. Acceptance criteria

Given any AI capability listed in §9, when audited for what data it accessed to generate a given suggestion, then that data access is fully explainable and traceable to the invoking user's own existing permission scope — no AI capability should be capable of surfacing data through an opaque model-access path that bypasses Module 21's explicit scoping rules.

## 26. Dependencies

Every module an AI capability assists (§9); Module 21; [10-security-privacy-audit.md](../10-security-privacy-audit.md).

## 27. Risks

Bias in recruitment-matching, attrition-risk, and performance-review-assistance capabilities is the single highest-severity risk category in this module — each of these requires dedicated fairness review before rollout (§10), not a generic "AI is helpful" launch decision. Reputational risk from an AI-forward marketing claim outpacing actual delivered reliability (the specific Darwinbox-evidenced gap named in §1/§2) is a real risk this module's conservative, human-gated design is explicitly built to avoid — but only if that discipline is maintained through actual implementation, not just this PRD's stated intent.

## 28. Open questions

- Explicit AI/LLM provider selection and the tenant-data-training-use guarantee (§23) — a blocking data-governance decision needing legal/security stakeholder sign-off before any capability in this module goes live, not a decision this PRD phase resolves.
- Which capabilities, if any, are genuinely appropriate for MVP given the "additive, low-incremental-risk" reasoning applied to payroll/attendance anomaly detection (§9's two MVP-candidate rows) — flagged for Product/Security stakeholder review of that specific recommendation before it's finalised in [13-release-roadmap.md](../13-release-roadmap.md).

## 29. Release scope

**MVP:** none by default, with payroll- and attendance-anomaly detection as the two candidates worth stakeholder consideration given their comparatively low incremental risk (feeding existing human-gated workflows rather than introducing new autonomous surfaces).
**Later phase (Enterprise):** every other capability in §9's table, each with its own fairness/quality review gate before general availability.
**Out of scope:** fully autonomous AI-driven decision-making of any kind (no capability in this module ever directly executes a consequential HR/payroll action without human review) — this is the module's most important, non-negotiable boundary, stated explicitly per the brief's own framing.
