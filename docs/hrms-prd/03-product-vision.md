# 03 — Product Vision

**Status:** Draft v1 (pending stakeholder review)
**Last updated:** 2026-07-23
**Depends on:** [01-market-research.md](01-market-research.md) §9 Synthesis, [02-competitor-comparison-matrix.md](02-competitor-comparison-matrix.md), [00-existing-system-audit.md](00-existing-system-audit.md)

---

## Product name

**Placeholder: "Project Meridian."** Not a proposed final brand — used as a stable internal reference name throughout this document set so module PRDs don't need "[Product Name]" filled in everywhere. Naming is explicitly out of scope for this PRD phase and should go through normal trademark/domain-availability clearance before being finalised.

## Product vision

An HRMS that Indian businesses trust as the single, accurate record of their workforce — from the moment someone applies to the moment they leave and beyond — where routine HR work happens without friction, every payroll-affecting change is traceable, and the system scales from a 50-person startup to a multi-entity enterprise without changing products.

## Product mission

Give HR, payroll, and finance teams in India a system that gets statutory compliance right by default, gives employees and managers self-service that actually reduces HR ticket volume instead of just relocating it, and gives leadership numbers they can trust without a spreadsheet reconciliation step — while being architected from day one to extend beyond India as the business grows.

## Product positioning

**"The HRMS that treats India-first statutory compliance as core infrastructure, not a bolted-on module — with a genuinely unified HR–attendance–leave–payroll data model, modern UX, and support that doesn't degrade when you need it most."**

This positioning is a direct response to [01-market-research.md](01-market-research.md) §9's synthesis: no competitor researched combines deep, transparent India compliance; a truly unified (not one-way-synced) core data model; UX on par with the category's US leaders; and a support-quality commitment, simultaneously. Every other competitor researched trades off at least one of these against another (see the competitor matrix).

## Target market

**Primary (initial release):** Indian small-and-mid-market businesses (roughly 50–2,000 employees) that currently either (a) stitch together multiple point tools (e.g., a payroll-only tool + a spreadsheet-based HR process), or (b) have outgrown an SMB-oriented tool's compliance/reporting depth but aren't ready for an enterprise-sales-cycle product like Darwinbox. This is deliberately the underserved middle: too complex for RazorpayX-Payroll-style payroll-only tools, not yet enterprise enough to be Darwinbox's ideal customer.

**Secondary (architecture must not block, later commercial focus):** larger enterprises (2,000+ employees, multiple legal entities) and, longer-term, businesses expanding beyond India who want one HRMS across geographies rather than a patchwork of country-specific tools — this is why [05-organisation-data-model.md](05-organisation-data-model.md) treats Legal Entity, data residency, and effective-dating as first-class from day one even though the initial go-to-market is India-only.

**Explicitly not the initial target:** very small businesses (<20 employees) who are adequately served by a Free-tier point tool (Zoho Payroll Free, RazorpayX Founder plan) — competing there is a race-to-the-bottom pricing game this product shouldn't enter first.

## Ideal customer profile (ICP)

- 50–2,000 employees, headquartered in India, with at least one of: multiple offices/states (making PT/LWF multi-state complexity real), a mix of employment types (permanent + contract/gig), or plans to open a second legal entity within 12–24 months.
- Currently experiencing at least one of the specific, evidenced pain points from Phase 2 research: manual reconciliation between attendance and payroll; HR-ticket volume dominated by repetitive self-service-able questions; a support relationship with their current vendor that has degraded noticeably (a documented pattern across every competitor researched).
- Has a distinct HR function and a distinct (even if small) Payroll/Finance function — i.e., is past the "founder does payroll in Excel" stage, which is where our persona model (Module 04) starts to matter (Payroll Executive/Administrator as a real, if sometimes overlapping, role).

## Primary customer problems this product solves

1. **Compliance risk from fragmented or unclear statutory-compliance coverage.** Evidenced gap: every India-origin competitor researched has at least one confirmed compliance blind spot or documentation gap (RazorpayX's explicit LWF-filing and gratuity gaps; greytHR's inconsistent tier-boundary documentation; Keka's unaudited vendor-asserted claims).
2. **Data reconciliation overhead from disjointed HR/attendance/payroll systems.** Evidenced gap: Zoho's confirmed one-way People→Payroll sync; the near-universal pattern of payroll-first tools having thin HR and HR-first tools having bolted-on payroll.
3. **HR team time consumed by routine, repeatable requests** that self-service should absorb but doesn't, because ESS/MSS is either incomplete or has a mobile-parity gap (confirmed for 5 of 8 competitors researched).
4. **Approval and process rigidity** that forces the customer's process to bend to the software rather than the reverse (a named, specific complaint for Keka, RazorpayX, and implicitly Darwinbox's "basic automation" gap).
5. **Loss of trust from inconsistent vendor support**, especially during time-critical windows like payroll close (a corroborated pattern across all eight competitors researched, most acutely documented for Darwinbox — support "degrades during high onboarding periods," i.e., exactly when the vendor is busiest).

## Product value proposition

For an Indian mid-market business that needs HR and payroll to be one accurate system instead of several reconciled ones, Project Meridian is an HRMS built on a single effective-dated employee data model spanning the full employee lifecycle, with India statutory compliance built in as core infrastructure and documented transparently — unlike point-payroll tools that bolt on thin HR, HR-suite tools that bolt on thin payroll via one-way sync, or enterprise platforms that require a long sales cycle and custom-build compliance depth.

## Competitive differentiation

Directly traceable to [01-market-research.md](01-market-research.md) §9:

| Differentiator | Why it's defensible (evidence from Phase 2 research) |
|---|---|
| Unified, effective-dated HR+attendance+leave+payroll data model (not one-way sync between separate products) | No competitor researched confirmed to have this; Zoho's one-way sync is the clearest counter-example of what to avoid |
| Transparent, complete India statutory-compliance documentation (state-by-state PT/LWF, gratuity mechanics, labour-code readiness) | Every India-origin competitor has at least one confirmed gap or documentation inconsistency here |
| Modern UX, benchmarked against BambooHR/Rippling (the two highest-rated products researched, G2 4.4 and 4.8 respectively) | Explicitly named weakness for greytHR ("old-fashioned") and Darwinbox ("basic," "not dynamic") |
| Support quality as an explicit product commitment (SLA-backed, doesn't degrade at peak payroll-close windows) | The single most consistent complaint across **all eight** competitors researched — see market research §5 |
| Configurable, not rigid, workflows (approval chains adapt to the customer, not vice versa) | Named complaint for Keka ("hard-wired"), RazorpayX ("inefficient and complicated"), Darwinbox ("still requiring manual follow-ups") |
| Architected for multi-country expansion from day one, even though GTM is India-first | Only Darwinbox has confirmed, trade-press-corroborated multi-country statutory depth among India-origin competitors — a credible moat to plan against early rather than retrofit later |

**What this product will explicitly not try to out-compete on at launch:** Rippling's HR+IT+Finance "Employee Graph" breadth (a multi-year architectural investment, studied as a pattern in Module 17/23 but not a v1 commitment) or Darwinbox's confirmed GCC/SEA multi-country payroll depth (a later-phase goal per the roadmap, not an MVP claim).

## Product principles

Adopting the brief's suggested principles as-is, since Phase 1/2 research directly supports each of them:

1. Employee information should have a single source of truth. *(Directly motivated by the Zoho one-way-sync counter-example.)*
2. Routine HR processes should require minimal manual follow-up. *(Directly motivated by the Keka/Darwinbox "rigid"/"manual follow-ups still required" complaints.)*
3. Complex workflows should remain understandable. *(Motivated by RazorpayX's "inefficient and complicated" workflow complaint.)*
4. Every important action should be traceable. *(Structural requirement — see [05-organisation-data-model.md](05-organisation-data-model.md) §7's Employment Assignment audit pattern.)*
5. Permissions should follow least-privilege principles. *(See [04-personas-and-roles.md](04-personas-and-roles.md) cross-persona notes on segregation of duties.)*
6. Managers should see only the information relevant to their teams. *(See Persona 2, People Manager, scope rules.)*
7. Employees should be able to complete routine actions without contacting HR. *(Directly motivated by the "HR ticket volume dominated by repetitive questions" pain point, Persona 3.)*
8. Payroll-affecting changes should be validated and auditable. *(Directly motivated by every competitor's confirmed or suspected payroll-calculation-error complaints, e.g. greytHR's "recurring payroll calculation/formula errors.")*
9. The interface should remain usable even when the organisation has thousands of employees. *(Motivated by Darwinbox's "very large enterprises need more customization than out-of-box" gap and BambooHR's "outgrow it at 150-200 employees" ceiling — this product should not have an analogous ceiling.)*
10. Mobile workflows should focus on high-frequency employee and manager actions, not full feature parity. *(Directly motivated by market research §7 — mobile/web parity gaps are near-universal; deliberately scoping mobile rather than chasing full parity is a considered choice, not a shortcut — see Module 24.)*

## Success criteria (product-level, high-level — see [14-success-metrics.md](14-success-metrics.md) for the full metric set)

- A customer can run a full, correct monthly payroll (India statutory) without manual reconciliation against attendance/leave data.
- HR-ticket volume for routine, self-service-able requests (payslip access, leave-balance queries, policy lookups) measurably drops after adoption, evidencing that ESS genuinely absorbs demand rather than just existing.
- Support-response SLAs hold during payroll-close windows specifically, not just in steady-state — the one differentiator every competitor researched failed to defend.
- The product remains fully usable (list-page performance, approval-inbox clarity, reporting responsiveness) at 2,000+ employee scale without a "you've outgrown us" ceiling.

## Product boundaries

**In scope for this product, ever:** the full employee-lifecycle modules listed in the brief (Modules 1–25), India-first with architected multi-country extensibility, web + mobile, multi-tenant SaaS.

**Out of scope for this product, by design, indefinitely (not just "later phase"):**
- Full general-ledger/accounting-system replacement — this product integrates with accounting/ERP systems (Module 23), it does not become one.
- Full IT-asset/device-management platform (Rippling's IT-module depth) — Module 14 (Asset Management) tracks HR-relevant asset assignment/recovery, it is not an MDM/device-security product.
- Full corporate banking/spend-management platform — Module 6/7 integrate with banking rails for disbursal/reimbursement, this product does not become a business-banking product (unlike RazorpayX's structural advantage of being banking-native — a deliberate non-goal, not an oversight, since chasing it would dilute focus on the core differentiation).

## Explicit non-goals for the first release (MVP)

- Multi-country statutory payroll processing (India-only for MVP; architecture supports it, GA does not — see [13-release-roadmap.md](13-release-roadmap.md)).
- Full AI-agent-driven cross-system orchestration (Darwinbox's "Super Agent," Rippling's AI workflow generation) — Module 25's AI capabilities are scoped conservatively for MVP (assistive, human-reviewed), not agentic automation across systems.
- Native IT/device-management or corporate-card/spend-management modules (see Product Boundaries above).
- Full Position Management / headcount-planning depth (deferred to Enterprise release per the suggested roadmap — MVP operates on Designation/Grade without a separate vacant-Position concept, per [05-organisation-data-model.md](05-organisation-data-model.md) §3).
- Complete feature parity between mobile and web (a deliberate, evidenced-based scoping decision, not a gap — see Product Principle 10).

## Open questions

- OQ-18: Is "India-first, multi-country-architected" the confirmed strategic mandate, or could the business's actual near-term expansion target (if any) be a specific second country (e.g., UAE/GCC, given how many India-origin HR-tech companies expand there first, per Darwinbox's pattern)? This would change how much GCC-specific compliance-metadata modelling is worth prioritising early versus a more generic "country" abstraction. Needs a stakeholder decision, not a research answer.
- OQ-19: Does the business have an existing brand/name direction, or is "Project Meridian" purely a placeholder to be replaced later? Flagged so the placeholder doesn't accidentally calcify into the real name through repeated use across 25+ module documents.
- OQ-20: What is the actual monetisation model (per-employee-per-month, tiered like every competitor researched, or something else)? This PRD does not currently make pricing-model assumptions, but Module 22 (System Administration)'s "subscription management" and Module 21's permission tiers will eventually need one — flagged for Product/Finance stakeholder input before Phase 14 (Release Roadmap) pricing-adjacent decisions, if any, are finalised.
