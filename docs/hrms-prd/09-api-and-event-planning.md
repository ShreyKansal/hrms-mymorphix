# 09 — API and Event Planning

**Status:** Draft v1 (pending stakeholder review — architecture team should own final technical decisions; this document sets requirements and conventions, not a final implementation)
**Last updated:** 2026-07-23
**Depends on:** [08-conceptual-data-model.md](08-conceptual-data-model.md), [05-organisation-data-model.md](05-organisation-data-model.md)
**Scope note:** conventions and domain events, not a final API implementation, per the brief's explicit instruction.

---

## 1. REST, GraphQL, or hybrid recommendation

**Recommendation: REST as the primary external/partner-facing API (Module 23 integrations, third-party developers), with an internal API layer free to use whatever is most efficient for the product's own frontend (GraphQL or a tailored REST/BFF pattern) — this is not resolved definitively here, but the recommendation leans REST-first because:** (a) it's the more universally-understood convention for the integration partners named across Module 23 (banks, statutory-filing systems, biometric-device vendors) who are unlikely to expect/support GraphQL; (b) [00-existing-system-audit.md](00-existing-system-audit.md) found no existing API convention to align with (green-field), so the deciding factor should be partner-ecosystem compatibility over internal developer preference alone. **This is flagged as an architecture-team decision to formally ratify, not something this PRD phase finalises.**

## 2. API versioning

URL-path versioning (`/api/v1/...`) recommended over header-based versioning for its debuggability/discoverability advantage, especially relevant given Module 23's integration partners will vary widely in technical sophistication. Deprecation policy: a minimum notice period (recommend 12 months, **flagged for a formal SLA decision** rather than asserted as final) before a version is retired, with deprecation headers/warnings surfaced well before the retirement date — directly relevant to Module 23's partner-reliability requirements.

## 3. Resource naming and conventions

Resource-oriented, plural nouns (`/employees`, `/leave-requests`, `/payroll-runs`), nested where the relationship is genuinely hierarchical and bounded (`/employees/{id}/employment-assignments`) but flattened with filter parameters where the relationship is many-to-many or the child resource has independent lifecycle value (e.g., `/leave-requests?employeeId=` rather than forcing `/employees/{id}/leave-requests` as the only access path, since leave requests are also queried org-wide by HR).

## 4. Pagination, filtering, sorting, search

Cursor-based pagination recommended over offset-based for list endpoints over high-volume entities (Attendance Record, Payroll Input, Audit Event — per [08-conceptual-data-model.md](08-conceptual-data-model.md) §5's indexing note) given offset-pagination's known performance degradation at scale; offset-based is acceptable for smaller, stable entity lists (Departments, Roles). Filtering via query parameters with a consistent operator convention (`field[gte]=`, `field[in]=`) rather than ad hoc per-endpoint filter syntax. Search via a dedicated `/search` endpoint or `q=` parameter, distinct from structured filtering, consistent with [07-information-architecture.md](07-information-architecture.md) §7's global-search/command-search distinction.

## 5. Bulk operations

Every module identified as needing bulk actions (per each module PRD's §17) needs a corresponding bulk API pattern: a single request accepting an array of operations, returning a per-item result array (not an all-or-nothing single response) — since partial success is a real, common outcome for bulk operations (per Cross-Module Workflow #22's explicit per-row validation-error handling) and the API contract must expose that granularity, not collapse it into a single pass/fail.

## 6. Idempotency

**Mandatory for every state-mutating endpoint that could plausibly be retried** — especially payroll-disbursal-adjacent and banking-integration endpoints (Module 23 §7.1's explicit warning about naive-retry-causing-duplicate-payment risk). Recommend an `Idempotency-Key` header pattern (client-supplied, server-deduplicated) for these specifically; less critical (but still good practice) elsewhere.

## 7. Optimistic concurrency

Recommended for any resource multiple actors might edit near-simultaneously (e.g., two HR Executives editing the same Employee record) — an `ETag`/`If-Match` pattern that rejects a stale write with a clear conflict response, rather than silently allowing a last-write-wins overwrite that could lose one user's changes without them knowing.

## 8. Validation and error format

A consistent, structured error response (error code, human-readable message, field-level detail where applicable) across every endpoint — directly supporting every module's own §11 validation-rules requirements needing to surface *specifically actionable* errors (per the repeated pattern across module PRDs of "block with a clear, specific error, never a generic failure").

## 9. Authentication and authorisation

Authentication: token-based (OAuth2/OIDC-compatible, aligning with Module 22's SSO/SAML/OIDC requirements) for both the product's own frontend and third-party API consumers. **Authorisation: every API call enforces Module 21's permission model at the API layer itself**, not just the frontend — this is the API-layer restatement of the brief's central "backend enforces, frontend merely reflects" security principle, and is the single most important requirement in this entire document.

## 10. Rate limiting

Per-tenant and per-API-key rate limits (protecting against both malicious abuse and accidental runaway integration behaviour, e.g., a misconfigured polling integration hammering an endpoint) — with clear, standard rate-limit-remaining headers so well-behaved integration partners (Module 23) can self-throttle.

## 11. File uploads

Direct-to-storage upload patterns (pre-signed URLs) recommended over routing large files (documents, receipt images, resumes) through the application API layer directly — relevant to Module 7's receipt uploads, Module 13's documents, Module 8's resumes, all of which are described as needing to work reliably on mobile under variable connectivity (Module 24 §2), making upload efficiency a genuine UX concern, not just a backend implementation detail.

## 12. Export generation

For potentially large/slow exports (Module 19's report exports, Module 6's payroll register), an asynchronous job pattern (submit request → poll/webhook for completion → download link) rather than a synchronous request that risks timing out — directly addressing Module 19 §19's "long-running report generation" notification requirement.

## 13. Long-running operations

Same async-job pattern as §12, generalised: bulk imports (Module 1/22 §18), payroll processing (Module 6 §7.1's preview/process steps), reorg batch commits (Module 2 §7.1) — all should expose a status-polling or webhook-notification mechanism, never leave a client blocked on a single long-held HTTP request.

## 14. Webhooks

Outbound webhooks (product → external system) for the domain events in §16, with **webhook-payload signing** (HMAC or equivalent) so receiving systems can verify authenticity — a specific, named requirement per the brief's own webhook-security expectations. Retry-with-backoff for failed webhook deliveries, with a dead-letter/failure-visibility mechanism (surfaced in Module 23's integration-health dashboard, Module 23 §15) rather than silent, indefinite retry-or-drop.

## 15. Audit metadata and correlation IDs

Every API request should carry (or the system should generate) a correlation ID, propagated through any resulting domain events and audit-log entries — directly enabling Phase 11's audit-schema requirement to trace a single logical operation (e.g., one payroll-run approval) across every module/service it touched, even if implemented as multiple internal calls.

## 16. API deprecation

Per §2 — deprecation is a formal, communicated process (advance notice, deprecation-warning headers, a defined sunset date), never a silent breaking change, given how many Module 23 integration partners depend on API stability for genuinely operationally-critical flows (banking disbursal, access revocation).

---

## Domain events

Per the brief's explicit list, each with Trigger / Payload / Producer / Consumers / Retry behaviour / Idempotency requirement / Audit requirement / PII considerations. Full business-logic detail for each event's *trigger workflow* lives in the relevant module PRD and [06-cross-module-workflows.md](06-cross-module-workflows.md) — this section focuses on the event-contract shape.

| Event | Trigger | Producer | Key consumers | Idempotency | PII considerations |
|---|---|---|---|---|---|
| `EmployeeCreated` | Module 1 §7.1 / Cross-Module Workflow #1 | Module 1 | Module 22 (IT provisioning), Module 6, Module 18 | Consumer-side dedup on employee ID | High — full employee PII in payload; consumers should receive only what they're scoped for (Module 21-aware event filtering, not a blanket broadcast of full PII to every subscriber) |
| `EmployeeUpdated` | Any Module 1 field edit | Module 1 | Varies by field changed | Consumer-side dedup | Field-dependent — a compensation-field update carries higher sensitivity than a contact-info update; recommend field-change-category tagging on the event itself so consumers can filter without receiving full sensitive payloads unnecessarily |
| `EmployeeTransferred` | Module 1 §7.2 | Module 1 | Module 17 (re-routing), Module 4 (policy reassignment), Module 6 | Consumer-side dedup on (employee_id, effective_from) | Moderate — org-assignment data, not typically highest-sensitivity |
| `EmployeePromoted` | Module 1 §7.2 (reason_code = Promotion) | Module 1 | Module 6, Module 13 | Same as above | Moderate |
| `EmployeeSeparated` | Module 15 §7.1/§7.2 terminal transition | Module 15 | Module 23 (access revocation, **time-critical**, Module 15 §7.3), Module 6, Module 14 | Must be idempotent — a duplicate delivery must not double-trigger access revocation in a way that causes issues, though re-triggering revocation itself is generally safe (unlike a payment) | Moderate, though the access-revocation consumer path is security-critical and should have the tightest delivery-reliability SLA of any event in this table |
| `LeaveApproved` | Module 5 §7.1 | Module 5 | Module 6 (payroll input), Module 4 (coordination) | Consumer-side dedup | Low-moderate |
| `AttendanceRegularised` | Module 4 §7.2 | Module 4 | Module 6 | Consumer-side dedup | Low |
| `PayrollInputChanged` | Modules 4/5/7 → Module 6 (Cross-Module Workflows #10–#12) | Source module | Module 6 | Must be idempotent, feeds a financial calculation | Moderate — attendance/leave-derived, not itself compensation data |
| `PayrollRunStarted` | Module 6 §7.1 | Module 6 | Module 18 (notify Payroll Executive/Administrator) | N/A (informational) | Low |
| `PayrollRunCompleted` | Module 6 §7.1 | Module 6 | Module 18, Module 13 (payslip generation trigger if not already synchronous) | N/A | Low at the event level (doesn't carry individual compensation detail itself) |
| `PayslipPublished` | Module 6 §7.1 | Module 6 | Module 18 (notify employee), Module 16 | N/A | High if payload includes amounts — recommend the event carry only a reference/notification, not the payslip content itself, with the actual payslip fetched via a separately-authorised API call |
| `ReimbursementApproved` | Module 7 §7.1 | Module 7 | Module 6 (payroll routing) or Module 23 (direct payout) | Must be idempotent for the payout path specifically (§6's duplicate-payment risk) | Moderate |
| `CandidateHired` | Module 8 §7.3 / Cross-Module Workflow #1 | Module 8 | Module 1 (conversion), Module 3 (onboarding trigger) | Must be idempotent — a duplicate delivery must not create two Employee records for one hire | Moderate-high (candidate PII) |
| `OfferAccepted` | Module 8 §7.2 | Module 8 | Module 8 itself (internal state transition), eventually `CandidateHired` | Consumer-side dedup | Moderate (compensation data in offer) |
| `ReviewCompleted` | Module 9 §7.1 | Module 9 | Module 1 (promotion-recommendation linkage), Module 13 | Consumer-side dedup | High — performance content is sensitive |
| `AssetAssigned` / `AssetReturned` | Module 14 §7.1/§7.2 | Module 14 | Module 1 (Employee Detail Assets tab), Module 6 (recovery-cost, on loss) | Consumer-side dedup | Low |
| `RoleChanged` | Module 21 §7.1 | Module 21 | Module 18 (notify affected user), audit/compliance systems | Consumer-side dedup | Moderate — permission data, not personal data, but security-sensitive |
| `IntegrationFailed` | Module 23 §7.1 | Module 23 | Module 18 (severity-differentiated alert per Module 23 §7.1) | N/A (each failure is a distinct event, not deduplicated away) | Varies by the failing integration's own data sensitivity |

**Additional events not in the brief's explicit list but implied by module PRDs and worth naming here for completeness:** `OnboardingInitiated`/`OnboardingNoShow` (Module 3), `AttendanceLocked` (Module 4 §7.3, a hard boundary event Module 6 depends on), `RetroactiveSalaryRevisionProcessed` (Module 6 §7.3), `PayrollRunRolledBack` (Module 6 §7.2, with bank-transfer-status recorded per that section's requirement), `FullAndFinalSettlementProcessed` (Module 6 §7.4/Module 15), `WorkflowInstanceCompleted`/`WorkflowInstanceFailed` (Module 17 §7.1), `PolicyAcknowledged` (Module 20 §7.1), `AccessRevocationTriggered`/`AccessRevocationConfirmed` (Module 15 §7.3 — the pairing that matters, per that section's explicit note that a fired event isn't proof of downstream completion), `DataDeletionExecuted`/`DataDeletionBlockedByLegalHold` (Cross-Module Workflow #25).

## General event-design principles

- **Every event fires from a module that owns the underlying data change** — no module fires an event on another module's behalf, avoiding the ambiguous-ownership drift risk this whole PRD is designed against (per [03-product-vision.md](03-product-vision.md)'s core differentiation claim).
- **Events carry a correlation ID** (§15) linking them to the originating request/workflow instance.
- **PII in event payloads is minimised** — where feasible, events carry a reference (entity ID) rather than the full sensitive payload, with consumers fetching detail via a permission-checked API call rather than receiving broadcast PII regardless of their own authorisation to see it (a specific, important application of Module 21's permission model to the eventing layer, not just the request/response API layer).
- **Retry behaviour is event-type-specific**, not a single generic policy — payment/disbursal-adjacent events need idempotent, carefully-bounded retry; purely informational events (a notification trigger) can retry more liberally without correctness risk.

## Open questions

- OQ-28: REST vs. GraphQL vs. hybrid (§1) — formally flagged for the architecture team to ratify, this PRD only provides a reasoned recommendation, not a final decision.
- OQ-29: Exact event-transport technology (message queue/broker choice, e.g., Kafka vs. a managed cloud pub/sub service) is an infrastructure decision outside this PRD's scope — flagged as a dependency for whoever owns the technical architecture phase following this PRD.
