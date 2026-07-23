# 01 — Project Execution Plan

**Status:** superseded in part — see §0. Translates [13-release-roadmap.md](../hrms-prd/13-release-roadmap.md)'s five release phases into an actual build sequence.
**Depends on:** [00-architecture-and-tech-stack.md](00-architecture-and-tech-stack.md)

---

## 0. Reality update (2026-07-23): this is a one-person-plus-AI build, not a 7-person team

§1 below was written assuming a hired team. The actual situation: there is no team — the founder plus Claude (writing all code, running the environment, testing, and fixing bugs directly) is the entire build capacity. §1's *role breakdown* is kept below because it's still useful as a checklist of **functions that need covering**, not headcount to hire — in this setup, Claude covers Tech Lead, Backend, Frontend, and QA directly (verified, not just claimed — see [verification-evidence/README.md](verification-evidence/README.md) for a concrete example of the QA function catching two real bugs neither TypeScript nor a clean dev-server start would have caught). Two things genuinely don't fold into that:

- **Product Designer** — Claude can and does implement real screens directly in code using Atlaskit's actual components (arguably more reliable than a static Figma mockup, since it's runnable and gets browser-tested), but this isn't the same as dedicated visual/interaction design judgment on a genuinely new pattern. Flag anything that feels like it needs real design thinking rather than "assemble existing components sensibly," rather than assuming code-first is always sufficient.
- **Payroll/legal professional review** — per every prior mention of this in this document set, this remains a hard requirement no amount of AI-plus-founder effort substitutes for. Unchanged by this reality update.

**"Sprint" in what follows means "a unit of work Claude does in one or more sessions," not a calendar-boxed team ritual** — there's no standup, no velocity in the traditional sense, no PTO to plan around. The sequencing and dependency logic (why Module 21 before Module 4, why Payroll needs Attendance/Leave first) is unchanged and still exactly what should be followed — only the *execution mechanics* around it are different from what §1 originally assumed.

## 1. Team structure (originally proposed — now a function checklist, not a hiring plan; see §0)

| Role | Count | Focus |
|---|---|---|
| Tech Lead / Architect | 1 | Owns [00-architecture-and-tech-stack.md](00-architecture-and-tech-stack.md), the Prisma schema, cross-module technical decisions |
| Backend Engineers | 2–3 | NestJS modules, business logic, Module 21 permission enforcement |
| Frontend Engineers | 2 | React/Atlaskit screens |
| Product Designer | 1 | Translates Module Build Guides into actual Figma screens using Atlaskit's Figma libraries ([00-existing-system-audit.md](../hrms-prd/00-existing-system-audit.md) references `go.atlassian.com` Figma libraries per component) |
| QA / Test Engineer | 1 (can start part-time, full-time from Payroll phase onward) | Owns the Playwright e2e suite, especially Cross-Module Workflow coverage |
| Product Manager (you) | 1 | Prioritisation, backlog grooming, stakeholder sign-offs (payroll/legal review gates) |

**Interns/junior developers** slot into Frontend or Backend under a senior engineer, working directly from a single Module Build Guide at a time — that's exactly what those documents are designed for (see [build-guides/README](build-guides/)).

## 2. Sprint cadence

**2-week sprints**, recommended over 1-week (too little gets done to demo meaningfully, especially once Payroll-phase modules require careful review) or 4-week (too slow for a team this size to course-correct). Every sprint ends with a demo against real acceptance criteria pulled directly from the relevant module PRD's Given/When/Then statements — not a subjective "looks done" check.

## 3. Phase-to-sprint mapping

Directly following [13-release-roadmap.md](../hrms-prd/13-release-roadmap.md)'s five phases. Sprint counts below are **estimates for planning purposes, not commitments** — recalibrate after Sprint 0 and after the first full module ships, once the team has real velocity data.

| Phase | Modules | Estimated sprints | Hard gate before moving on |
|---|---|---|---|
| **Sprint 0** | Repo/infra setup, not a PRD module | 1 | CI/CD pipeline green, empty NestJS+React apps deployed to staging |
| **Foundation** | 1 (Core HR), 2 (Org Mgmt), 17 (Workflow Engine), 18 (Notifications), 21 (Roles/Permissions), 22 (System Admin) | 6–8 | A tenant can be provisioned, org structure configured, users assigned correctly-scoped roles ([13-release-roadmap.md](../hrms-prd/13-release-roadmap.md) Foundation exit criteria) |
| **HR Operations** | 3 (Onboarding), 4 (Attendance), 5 (Leave), 12 (Helpdesk), 13 (Documents), 15 (Separation), 16 (ESS/MSS), 20 (Policy/Compliance), 24 (Mobile core), 26 (POSH) | 10–12 | Cross-Module Workflows #10/#11 (Leave/Attendance → Payroll) produce unambiguous, complete data |
| **Payroll** | 6 (Payroll), 7 (Reimbursements) | 8–10, **plus a mandatory qualified-payroll-professional review cycle not counted in sprint velocity** | Qualified payroll-professional sign-off on statutory calculation correctness — this is a real external dependency, plan calendar time for it, not just engineering time |
| **Talent** | 8 (Recruitment), 9 (Performance), 10 (Learning), 11 (Engagement), 27 (Benefits) | 8–10 | Cross-Module Workflows #1 and #13 function end-to-end with zero manual re-entry |
| **Enterprise** | 2's Position Mgmt, 14 (Assets), 19 (advanced reporting), 22's sandbox, 23's long-tail integrations, 25 (AI, staggered per capability) | Ongoing, not a single block | Each Module 25 AI capability individually passes its own fairness-review gate before its own GA |

## 4. Foundation phase — detailed sprint plan (the part to start on Monday)

### Sprint 0: Infrastructure

- Monorepo scaffolded per [00-architecture-and-tech-stack.md](00-architecture-and-tech-stack.md) §10.
- Prisma schema: **Tenant, Organisation, Legal Entity** tables only (the absolute root — nothing else can exist without these), with Row-Level Security policies proven working with a two-tenant test.
- Auth: basic email/password login working end-to-end (SSO can come later in the Foundation phase, not Sprint 0).
- CI pipeline green.
- **Demo:** log in, see an empty dashboard, nothing else. This is intentionally unglamorous — it's the foundation everything else sits on.

### Sprints 1–2: Module 1 (Core HR) core + Module 21 (Roles/Permissions) core, built together

These two **must** be built together, not sequentially — every Module 1 screen needs Module 21's permission checks to exist to be built correctly, per [modules/01-core-hr-employee-information.md](../hrms-prd/modules/01-core-hr-employee-information.md) §12 and [modules/21-roles-permissions.md](../hrms-prd/modules/21-roles-permissions.md).

- Employee entity + Employment Assignment table (the effective-dating pattern — get this right here, every other module depends on it).
- Basic role/permission model: system roles, module/action-level permissions (field-level masking can follow in a later sprint).
- Employee create/edit screens, employee directory list page.
- **Demo:** create an employee, see them in the directory, confirm a user without the right permission genuinely cannot edit compensation fields (test this at the API level, not just by hiding a button).

### Sprint 3: Module 2 (Organisation Management)

- Department/Location/Grade/Designation CRUD.
- Org chart (current-state view only for Foundation phase — historical time-travel view is later-phase per that module's own §29).
- **Demo:** build out a small sample org structure, assign employees to it, see the org chart render.

### Sprint 4: Module 17 (Workflow and Approval Engine)

- The generic workflow-definition and workflow-instance engine, per [modules/17-workflow-approval-engine.md](../hrms-prd/modules/17-workflow-approval-engine.md) §7.1 — build this against one real trigger (recommend: a simple Module 1 field-change approval) to prove it works, rather than building it fully abstract with no consumer yet.
- Sequential and parallel chain types; dynamic manager-hierarchy resolution.
- **Demo:** a configured approval chain correctly routes to the right approver based on live org data, and re-routes correctly when that org data changes.

### Sprint 5: Module 18 (Notifications) + Module 22 (System Administration) core

- In-app notification centre, email delivery.
- Tenant setup wizard (guided, progressive — per [modules/22-system-administration.md](../hrms-prd/modules/22-system-administration.md) §7.1).
- SSO (SAML/OIDC) for at least one provider.
- **Demo:** a new tenant self-provisions through the wizard; an approval action from Sprint 4 correctly fires a notification.

### Sprints 6–8 (buffer): field-level permission masking depth, audit-log completeness pass, bug-fixing against the Foundation exit criteria

- This is where "make it actually match the PRD's acceptance criteria," not just "the happy path works," happens — budget real time for this, it's not slack.
- **Exit gate:** every acceptance criterion in Modules 1, 2, 17, 18, 21, 22's PRDs passes, verified by the QA engineer against the actual Given/When/Then statements, not by developer self-assessment.

## 5. How to use this with the Module Build Guides

Each sprint above maps to one or more files in `build-guides/` — a developer picks up the guide for the module they're assigned, and it contains everything needed to build it: screens, flows, data, states, components, API endpoints. The [backlog/](backlog/) folder breaks each guide further into individual tickets sized for a single developer to pick up.

## 6. Immediate next steps (this week)

1. Engineering lead reviews and either confirms or amends [00-architecture-and-tech-stack.md](00-architecture-and-tech-stack.md).
2. Sprint 0 starts — infra scaffolding.
3. Designer starts translating the Foundation-phase Module Build Guides into Figma screens in parallel with Sprint 0, so design isn't the bottleneck once Sprint 1 engineering starts.
4. PM books the qualified-payroll-professional review needed before the Payroll phase — this has a real external lead time, start that conversation now even though the Payroll phase is 6+ sprints away.
