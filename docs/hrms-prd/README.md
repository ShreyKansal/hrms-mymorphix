# HRMS PRD — Document Index

This is the working documentation set for a new, India-first, enterprise-grade HRMS. It is built by benchmarking (not copying) Zoho People, Zoho Payroll, greytHR, RazorpayX Payroll, Keka, Darwinbox, BambooHR, and Rippling, and is designed to consume the existing Atlassian Design System (Atlaskit) as its UI layer — see [00-existing-system-audit.md](00-existing-system-audit.md).

**No implementation has started.** This is a research, planning, and requirements phase only.

---

## Reading order

1. [00-existing-system-audit.md](00-existing-system-audit.md) — what UI toolkit we're building on; what's green-field
2. [01-market-research.md](01-market-research.md) — competitor capability research
3. [02-competitor-comparison-matrix.md](02-competitor-comparison-matrix.md) — feature matrix
4. [03-product-vision.md](03-product-vision.md) — vision, mission, positioning, principles
5. [04-personas-and-roles.md](04-personas-and-roles.md) — 14 personas
6. [05-organisation-data-model.md](05-organisation-data-model.md) — tenant/entity/hierarchy model
7. `modules/01-...27-*.md` — 27 module-level PRDs (Core HR → AI-Assisted Capabilities, plus POSH/IC Case Management and Benefits Administration, added post-gap-check per [16-product-decision-log.md](16-product-decision-log.md) D-014)
8. [06-cross-module-workflows.md](06-cross-module-workflows.md) — 25 end-to-end workflows
9. [07-information-architecture.md](07-information-architecture.md) — navigation, page hierarchy
10. [08-conceptual-data-model.md](08-conceptual-data-model.md) — entities and relationships
11. [09-api-and-event-planning.md](09-api-and-event-planning.md) — API conventions, domain events
12. [10-security-privacy-audit.md](10-security-privacy-audit.md) — security/privacy/audit requirements
13. [11-non-functional-requirements.md](11-non-functional-requirements.md) — performance, scale, a11y targets
14. [12-report-catalogue.md](12-report-catalogue.md) — full report inventory
15. [13-release-roadmap.md](13-release-roadmap.md) — MVP and phased releases
16. [14-success-metrics.md](14-success-metrics.md) — product/ops/compliance/UX/business/tech metrics
17. [15-risk-register.md](15-risk-register.md) — product and technical risks
18. [16-product-decision-log.md](16-product-decision-log.md) — running decision record
19. [research-source-register.md](research-source-register.md) — every external source cited, with reliability rating
20. [HRMS-MASTER-PRD.md](HRMS-MASTER-PRD.md) — the synthesized master document (read this if you only read one)

---

## Document status

| # | Document | Status | Last updated |
|---|---|---|---|
| 00 | Existing system audit | ✅ Complete | 2026-07-23 |
| 01 | Market research | ✅ Complete | 2026-07-23 |
| 02 | Competitor comparison matrix | ✅ Complete | 2026-07-23 |
| 03 | Product vision | ✅ Complete | 2026-07-23 |
| 04 | Personas and roles | ✅ Complete | 2026-07-23 |
| 05 | Organisation data model | ✅ Complete | 2026-07-23 |
| — | Research source register | ✅ Complete | 2026-07-23 |
| Modules 1–25 | Module-wise PRDs (see `modules/`) | ✅ Complete | 2026-07-23 |
| Modules 26–27 | POSH/IC Case Management, Benefits Administration (added post-gap-check) | ✅ Complete | 2026-07-23 |
| 06 | Cross-module workflows | ✅ Complete | 2026-07-23 |
| 07 | Information architecture | ✅ Complete | 2026-07-23 |
| 08 | Conceptual data model | ✅ Complete | 2026-07-23 |
| 09 | API and event planning | ✅ Complete | 2026-07-23 |
| 10 | Security, privacy, audit | ✅ Complete | 2026-07-23 |
| 11 | Non-functional requirements | ✅ Complete | 2026-07-23 |
| 12 | Report catalogue | ✅ Complete | 2026-07-23 |
| 13 | Release roadmap | ✅ Complete | 2026-07-23 |
| 14 | Success metrics | ✅ Complete | 2026-07-23 |
| 15 | Risk register | ✅ Complete | 2026-07-23 |
| 16 | Product decision log | ✅ Complete | 2026-07-23 |
| — | Master PRD | ✅ Complete | 2026-07-23 |

**All 30 documents (00–16, 25 module PRDs, research source register, master PRD) are drafted.** Every one is marked "pending stakeholder review" at the top of the document itself — completeness of the draft is not the same as being validated/approved. See Stakeholder review status below.

*(This table is updated as each document is completed — treat it as the single source of truth for progress, not the chat transcript.)*

---

## Outstanding decisions (blocking, need a human owner)

Full rollup in [HRMS-MASTER-PRD.md](HRMS-MASTER-PRD.md) §18. The highest-impact ones:

- **OQ-1:** Is direct use of public `@atlaskit/*` npm packages the intended integration path, given some referenced design-system resources are marked "Atlassians only"? (legal/licensing question — [00-existing-system-audit.md](00-existing-system-audit.md))
- **OQ-2:** Native app vs. responsive web for mobile — blocks finalising Module 24's offline-capability design.
- **OQ-9:** Inter-entity-transfer continuity-of-service treatment (PF/gratuity carry-over) — **needs qualified legal/payroll input**, blocks Cross-Module Workflow #4 and parts of Module 6/15.
- **OQ-19:** Real product name, replacing the "Project Meridian" placeholder used throughout.
- **OQ-20:** Commercial/pricing model — several success-metrics targets are deferred pending this.
- **OQ-23:** Exact deletion-vs-anonymisation-vs-mandatory-retention technical boundary — **needs qualified legal review**.
- Module 6 (Payroll), Module 15 (Separation), Module 26 (POSH/IC Case Management), and [10-security-privacy-audit.md](10-security-privacy-audit.md) each carry an explicit note that they need qualified payroll/legal/security professional sign-off before implementation — this is the single most important standing action item across the whole document set. Module 26 specifically needs confirmation of the Act's current exact IC-composition and inquiry-timeline requirements before its defaults are finalised.

## Stakeholder review status

**Not yet reviewed by any human stakeholder.** This entire set is a complete first draft — every module, workflow, and cross-cutting document required by the original brief has been written — pending Product, Engineering/Architecture, Legal, Payroll-compliance, and Security review before any implementation planning begins. Do not treat "draft complete" as "approved." The specific gates that must clear before implementation starts:

1. Product leadership review of [HRMS-MASTER-PRD.md](HRMS-MASTER-PRD.md), [03-product-vision.md](03-product-vision.md), and [13-release-roadmap.md](13-release-roadmap.md).
2. Qualified payroll/CA and employment-law review of Module 6 (Payroll) and Module 15 (Separation), plus the blocking legal open questions (OQ-9, OQ-23) above.
3. Security/architecture review of [10-security-privacy-audit.md](10-security-privacy-audit.md) and Module 21 (Roles and Permissions).
4. Resolution of OQ-1 and OQ-2 (design-system licensing and mobile delivery model) before any UI/mobile technical design begins.
