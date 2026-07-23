# Build Guide — Module 26: POSH / Internal Committee Case Management

**Full spec:** [modules/26-posh-internal-committee-case-management.md](../../hrms-prd/modules/26-posh-internal-committee-case-management.md)
**Phase:** HR Operations. **Read this whole guide before writing any code for this module — the access-control requirement here is different from every other module you'll build, and it's easy to get subtly wrong if you copy the Module 21 pattern by habit.**
**Legal note carried over from the PRD:** the exact statutory timelines and committee-composition rules need confirmation from actual legal counsel before this ships — build the *mechanism* now (configurable deadlines, configurable composition rules), don't hard-code specific numbers as if they're definitely correct.

---

## What this module is, in one paragraph

Indian law requires companies with 10+ employees to have an Internal Committee (IC) that handles workplace sexual-harassment complaints, with a strict confidentiality requirement and a statutory timeline. This module is a case-management tool for that committee. It looks superficially like Module 12 (Helpdesk), but **it is not built the same way** — that's the most important thing to understand before starting.

## The one rule that overrides everything else in this module

**Case content is visible only to that specific case's Internal Committee members. Not HR Administrator. Not System Administrator. Nobody else, ever, through any screen, report, export, or API call — no exceptions, no override, no configuration setting to loosen this.**

This is different from every other permission rule in the product. Everywhere else, Module 21's role/scope system decides access, and a System Administrator can, in principle, be granted broad access. Here, we're deliberately **not** using the general Module 21 scope system for case content — build a separate, narrower check: "is the requesting user a non-recused member of the IC assigned to this specific case?" If no, deny, full stop, regardless of what roles or scope that user otherwise holds.

**Practically:** write this as its own dedicated Guard, separate from the general permission Guard, and put a code comment at the top explaining why — the next developer who touches this file needs to understand this isn't a bug to "fix" by making it consistent with everywhere else.

## Screens to build

1. **File a Complaint** (employee-facing) — a clearly separate entry point from Module 12's Helpdesk (a distinct nav item/page, not a category *within* the helpdesk). Simple form: description, evidence upload, optionally naming a respondent.
2. **IC Case Workspace** (IC members only) — case detail, timeline, statements/evidence, hearing notes, findings, recommendation. Nobody outside the assigned IC sees this page exist for a given case — not "sees it greyed out," genuinely doesn't know it's there.
3. **IC Composition Management** (HR admin — this part *is* normal-permission, since it's about who's on the committee, not case content) — add/remove committee members, track eligibility (term dates, presiding-officer/internal/external role).
4. **Aggregate Compliance Dashboard** (HR admin) — case *counts* and *status*, IC composition validity, annual-report readiness. No case content, no names, no way to drill from an aggregate number down into an individual case.

## Key user flow: filing and handling a complaint

1. Employee files via the dedicated intake screen. The moment it's submitted, this case becomes visible to *only* the current IC members.
2. If the complaint names a current IC member as the respondent, that member is automatically excluded from this specific case (build this check on submission, not as a manual step someone might forget).
3. IC works the case through their workspace — statements, evidence, findings, recommendation — all confidential to them.
4. If the case leads to an employment action (e.g., termination), **that action goes through the normal Module 15 process, but without carrying the case content with it** — Module 15 gets "this employee is being terminated, effective X" as an instruction, not the POSH case file. Keep these genuinely decoupled at the code level: no foreign key from a Module 15 record directly into POSH case content, only a reference that a related process led to this.
5. HR admin's dashboard shows "1 active case" — nothing more specific than that.

## Data model

`ic_composition` (member, role, term dates), `posh_cases` (status, filing date, statutory deadline — deliberately minimal fields at the "outer" level), and the actual sensitive content (statements, evidence, findings) in tables that are **only ever queried through the IC-membership check**, never through the general employee/HR data-access paths. Consider putting these tables in a genuinely separate database schema/namespace as an extra structural safeguard, not just relying on application-level checks — ask the tech lead about this given how much heavier the consequence of a mistake is here than elsewhere.

## API endpoints

```
POST   /api/v1/posh/complaints                    — file (recusal check runs here)
GET    /api/v1/posh/cases                          — returns ONLY cases the requester is an active IC member for
GET    /api/v1/posh/cases/:id                       — 403 unless requester is that case's IC
POST   /api/v1/posh/cases/:id/findings
GET    /api/v1/posh/compliance-dashboard            — aggregate only, available to HR admin
GET/POST/PATCH /api/v1/posh/ic-composition
```

## What "done" looks like

- Log in as HR Administrator (not an IC member) and try every possible path — direct URL, API call, report — to see a case's content. All of them should fail. Test this explicitly and specifically; don't assume it works because "the general permission system handles it," because this module deliberately doesn't rely on the general system.
- File a complaint naming a current IC member — confirm they're automatically excluded from that case.
- Let an IC composition lapse (e.g., manually expire a member's term in test data) — confirm the compliance dashboard flags it *before* any complaint arrives, not only when one does.
- Confirm the aggregate dashboard genuinely cannot be used to infer anything about a specific case (e.g., a "1 case in Engineering department" breakdown could itself leak information in a small department — don't build breakdowns granular enough to risk that).
