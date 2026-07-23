# 10 — Security, Privacy, and Audit Requirements

**Status:** Draft v1 (pending stakeholder review — **needs qualified security and legal/privacy professional review before implementation**, more than most documents in this set)
**Last updated:** 2026-07-23
**Depends on:** [05-organisation-data-model.md](05-organisation-data-model.md) §10, Module 21, Module 22, Module 23, every module's own security-adjacent requirements

---

## 1. Multi-tenant data isolation

**Absolute, structural, no exceptions** ([05-organisation-data-model.md](05-organisation-data-model.md) §10, Module 22 §10) — enforced at the data-access layer (e.g., row-level tenant-ID scoping applied consistently, not solely in application logic where a single missed check could cause a cross-tenant leak). This is the single highest-priority security requirement in the entire product given the multi-tenant SaaS model, and should be verified via dedicated penetration testing specifically targeting tenant-boundary violations, not just general security testing.

## 2. Encryption in transit and at rest

TLS for all traffic (no exceptions, including internal service-to-service where applicable); encryption at rest for the database and file storage, with particular attention to the highest-sensitivity fields identified across every module (compensation, bank accounts, statutory IDs, performance ratings, HR case notes) potentially warranting field-level encryption in addition to storage-level encryption, given their concentrated sensitivity (Module 1 §12, Module 6 §12).

## 3. Password security, SSO, and MFA

Password policy configuration (Module 22 §9) for tenants not using SSO; SSO (SAML/OIDC) as the recommended primary authentication path for enterprise customers (Module 23 §9); MFA support, with a documented break-glass recovery path for SSO misconfiguration (Module 22 §24/§25's specifically-flagged risk) so a lockout doesn't become an unrecoverable incident.

## 4. Session security and device management

Configurable session timeout (Module 22 §9); device-level biometric app-lock as a mobile convenience layer (Module 24 §9), distinct from and never a substitute for backend permission enforcement (Module 21 §25's central principle, restated here in the security document where it matters most).

## 5. Role-based and scope-based access control

Full specification in Module 21 — this document's role is to state the security *properties* that module's design must deliver: least-privilege by default, segregation-of-duties enforcement (Module 21 §10) for the specific high-risk combinations identified across the module PRDs (Payroll Executive+Administrator, IT/System Administrator holding general HR-content access, HR Administrator configuring+auditing the same scope), and automatic expiry for time-boxed grants (Module 21 §7.1).

## 6. Field-level security and PII protection

Module 1 §12's compensation/bank/statutory-ID masking pattern, generalised as the product-wide template (§4 of [08-conceptual-data-model.md](08-conceptual-data-model.md)) — every module with genuinely sensitive fields (Module 9's performance ratings, Module 11's HR-case/grievance content, Module 8's candidate PII) implements the same masking-plus-explicit-unmask-permission pattern, itself logged (§9 below).

## 7. Data masking and export/bulk-download monitoring

Masking applies consistently whether data is viewed directly, via a report/dashboard (Module 19 §10's explicit no-permission-bypass-via-reporting rule), or exported. **Every export and every bulk-download action is logged** (§9), with anomalous bulk-access patterns (e.g., an account suddenly exporting far more records than its typical pattern) flagged for review (§13's suspicious-activity-detection requirement) — directly responding to the brief's explicit "bulk-download monitoring" requirement and to the real risk that a compromised or malicious insider account's most damaging action is often a single large export, not many individual record views.

## 8. IP restrictions, rate limiting, and bot protection

IP allowlisting (Module 22 §9) for tenants wanting to restrict access to known office/VPN ranges; API rate limiting (per-tenant, per-API-key, [09-api-and-event-planning.md](09-api-and-event-planning.md) §10); bot/credential-stuffing protection on public-facing authentication endpoints (career-site application forms, Module 8, are a specific public-facing surface worth particular attention here, since they're the one part of this product genuinely exposed to unauthenticated public traffic).

## 9. Secure file uploads and malware scanning

Every module accepting file uploads (Module 7's receipts, Module 13's documents, Module 8's resumes, Module 1's document uploads during onboarding) requires malware/virus scanning before a file is stored or made available to other users — a concrete, specific requirement given how many upload surfaces this product has, several of which (career-site resume upload) accept files from unauthenticated or externally-authenticated parties.

## 10. Secrets management

API keys, integration credentials (Module 23), and webhook signing secrets (§14) are never stored in plaintext — a dedicated secrets-management approach (vault/KMS-backed) is required, with credential rotation supported without requiring integration downtime (Module 23 §9's connection-reconfiguration workflow should support in-place credential rotation, not require full reconfiguration).

## 11. API security

Per [09-api-and-event-planning.md](09-api-and-event-planning.md) §9 — every API call enforces Module 21's permission model at the backend, restated here as this document's own central requirement given its security-document context: **the frontend hiding a button is a UX courtesy; the backend rejecting the underlying call is the actual security control**, per the brief's own explicit framing, applied consistently across every module without exception.

## 12. Webhook signing

Every outbound webhook (Module 23, [09-api-and-event-planning.md](09-api-and-event-planning.md) §14) is signed (HMAC or equivalent) so receiving systems can verify the payload genuinely originated from this product and wasn't tampered with in transit or spoofed by a malicious third party.

## 13. Audit logging, immutability, and privileged-access monitoring

**Audit log schema** (per the brief's explicit requirement, restated here as the canonical specification every module's own §22 implements): actor, timestamp, tenant, source, IP address (where appropriate), device/session, action, entity, record identifier, previous value, new value, reason, approval reference, correlation ID ([09-api-and-event-planning.md](09-api-and-event-planning.md) §15). **Immutability:** audit records are never editable or deletable through normal product operation — the sole exception is the legally-gated, itself-audited deletion workflow (Cross-Module Workflow #25), and even there the *fact* of an audit-relevant deletion having occurred is retained (Cross-Module Workflow #25's "final outcome" note). **Privileged-access monitoring:** roles with intentionally broad access by design (Payroll Executive/Administrator's compensation-data access, Compliance/Audit User's broad-read access — [04-personas-and-roles.md](04-personas-and-roles.md) Personas 7/12's explicit note that their own access should be the most heavily logged) get dedicated monitoring, not just standard logging — "who audits the auditor" is a named, specific requirement from Persona 12's own description, not an afterthought.

## 14. Suspicious-activity detection

Anomalous access patterns (unusual bulk exports per §7, access outside normal working hours/locations for a given user, a burst of failed authentication attempts, an unusual pattern of record views inconsistent with a user's normal role activity) should be flagged for review — this is explicitly a *detection and alerting* capability, not an automated blocking one by default (avoiding the risk of false-positive lockouts disrupting legitimate work), consistent with Module 25's broader "AI/anomaly-detection surfaces suggestions, humans decide" design philosophy applied here to security monitoring specifically.

## 15. Data backup and disaster recovery

Regular, tested backups (not just configured but *verified restorable* — an untested backup is not a real backup, a specific and common real-world failure mode worth naming explicitly) with a defined RPO/RTO target (specific numeric targets are a [11-non-functional-requirements.md](11-non-functional-requirements.md) concern, cross-referenced here). DR testing itself should be a recurring, scheduled, logged activity (Module 22 §21's system-health reporting), not a one-time setup exercise.

## 16. Data residency

Flagged, not resolved, given the India-first MVP scope ([03-product-vision.md](03-product-vision.md)) — but the Legal Entity entity ([08-conceptual-data-model.md](08-conceptual-data-model.md) §27's open question) should reserve a data-residency-region field now, since retrofitting residency-awareness after multi-country expansion begins would be considerably more disruptive than reserving the field early.

## 17. Data retention and anonymisation

Module 20 §9's retention-policy-authoring framework, enforced product-wide, with the legal-hold hard-precedence rule (Module 20 §10) as the one override that always wins regardless of what any individual module's default retention policy would otherwise do.

## 18. Employee-data deletion requests and legal holds

Full workflow detail in Cross-Module Workflow #25 — the two genuinely hard, legally-nuanced questions (statutory-retention-vs-deletion-request conflict, exact technical deletion-vs-anonymisation boundary) are explicitly flagged there as needing qualified legal review, not resolved by this PRD.

## 19. Incident response

A defined incident-response process (detection → containment → notification → remediation → post-incident review) is required, with particular attention to breach-notification obligations under applicable Indian data-protection law (a legal requirement this PRD flags rather than specifies in detail, given the brief's own instruction not to invent legal/compliance answers) — **flagged for qualified legal review** to determine exact notification timelines/thresholds/authorities.

## 20. Impersonation controls

Module 21 §9's requirement, restated here: impersonation for support purposes always requires a logged reason and is visible to the impersonated user (at minimum after the fact) — never a silent, invisible capability, a specific and deliberate design choice against a common but trust-eroding pattern in SaaS support tooling.

---

## Open questions

- Exact breach-notification legal requirements under applicable Indian data-protection law (§19) — **needs qualified legal review**, not invented here.
- Field-level-encryption scope (§2) — which specific fields warrant it beyond storage-level encryption is a security-architecture decision balancing performance/complexity against the marginal risk reduction, flagged for the architecture team's own risk assessment.
- Exact RPO/RTO targets (§15) — cross-referenced to [11-non-functional-requirements.md](11-non-functional-requirements.md), where numeric targets are proposed as initial assumptions pending stakeholder validation.
