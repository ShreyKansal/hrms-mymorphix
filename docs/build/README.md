# Build Documentation — Index

This is the execution layer on top of the product PRD (`../hrms-prd/`). The PRD answers "what should this product do and why" — this folder answers "what do I, a designer or developer, actually build, this sprint."

**If you're new here, read in this order:**

1. [00-architecture-and-tech-stack.md](00-architecture-and-tech-stack.md) — the tech stack and why. Read this once, refer back as needed. **Note:** as of the Supabase pivot, this file is stale in places — it still describes the original NestJS/Prisma design in places the build guides have since moved past. Trust the build guides and actual source over this file where they conflict, until it's fully resynced.
2. [01-project-execution-plan.md](01-project-execution-plan.md) — team structure, sprint cadence, and how the 5 release phases from the PRD map to actual sprints.
3. [03-ui-patterns.md](03-ui-patterns.md) — the canonical Supabase-aligned product patterns:
   layout, navigation, forms, modality, tables, states, cards, actions, charts, accessibility,
   and the deliberate theme boundary (Supabase architecture with this HRMS's configured
   colors/fonts). Read this before building a new screen.
4. [04-supabase-ui-implementation-instructions.md](04-supabase-ui-implementation-instructions.md)
   — the implementation and review checklist for every UI change.
5. `build-guides/` — one file per module, in plain language: what it does, what screens to build, what the data looks like, what "done" means. **Read the guide for your assigned module before reading the full PRD module** — the guide will point you back to the PRD for anything you need more depth on.
6. `backlog/` — the same modules broken into estimated tickets, ready to paste into Jira/Linear.

> **UI authority:** some older module guides/backlog tickets still name Atlaskit components.
> Those references describe the pre-migration implementation and are not current package
> instructions. For all new or changed UI, `03-ui-patterns.md`,
> `04-supabase-ui-implementation-instructions.md`, and the actual local primitives in
> `apps/web/src/components/ui/` take precedence. Do not add an `@atlaskit/*` dependency.

## Status — all 27 modules complete

| Doc | Status |
|---|---|
| Architecture & tech stack | ✅ Complete |
| Project execution plan | ✅ Complete |
| Supabase-aligned UI patterns | ✅ Complete |
| Supabase UI implementation instructions | ✅ Complete |
| Foundation-phase build guides (Modules 1, 2, 17, 18, 21, 22) | ✅ Complete |
| Foundation-phase backlog (~255 pts) | ✅ Complete |
| HR Operations-phase build guides (Modules 3, 4, 5, 12, 13, 15, 16, 20, 24, 26) | ✅ Complete |
| HR Operations-phase backlog (~350 pts) | ✅ Complete |
| Payroll-phase build guides (Modules 6, 7) | ✅ Complete |
| Payroll-phase backlog (~206 pts) | ✅ Complete — **carries a hard external review gate, see the backlog doc** |
| Talent-phase build guides (Modules 8, 9, 10, 11, 27) | ✅ Complete |
| Talent-phase backlog (~182 pts) | ✅ Complete |
| Enterprise-phase build guides (Modules 14, 19, 23, 25 + Position Mgmt/Sandbox addenda to 2, 22) | ✅ Complete |
| Enterprise-phase backlog (~130 pts + unestimated long-tail) | ✅ Complete |

**Every one of the 27 modules from the PRD now has a build guide.** Total backlog: roughly **1,120+ estimated story points** across 32 epics, plus deliberately-unestimated long-tail items (extra integrations, later AI capabilities) sized when actually prioritised rather than guessed now.

## Build order (unchanged from the plan — this is still the order to actually build in)

**Foundation → HR Operations → Payroll → Talent → Enterprise**, per [13-release-roadmap.md](../hrms-prd/13-release-roadmap.md) and [01-project-execution-plan.md](01-project-execution-plan.md). Having every module's guide written doesn't mean build order stops mattering — Module 6 (Payroll) still can't be built before Module 4/5 exist to feed it, and Module 8 (Recruitment) still can't be built before Module 1/3 exist to receive its hires. Use the phase backlogs in order; don't let "everything is written" turn into "let's build whatever's interesting first."

## The two things every engineer should know before touching any of this

1. **Module 21 (Roles/Permissions) enforcement is not optional anywhere.** Every single build guide assumes it. If a module's guide doesn't explicitly mention a permission check, that's an oversight in the guide, not a signal it's unnecessary there.
2. **Two modules have a fundamentally different risk profile from the rest and are called out explicitly in their own guides: Module 6 (Payroll) and Module 26 (POSH).** Payroll because errors cost real money and need external professional sign-off before going live. POSH because it has its own separate access-control system that deliberately doesn't follow the Module 21 pattern everyone else uses. Read both guides fully before writing code against either.

## What's left after this

Nothing structural — the full module set is documented at build-guide depth. What remains is normal execution: engineering picking up epics in order, the payroll review happening in parallel with Payroll-phase engineering (start that conversation now, it's the longest lead-time item in the whole plan), and re-estimating story points against real sprint velocity once Sprint 1 actually happens, per [01-project-execution-plan.md](01-project-execution-plan.md)'s own note that every estimate here is a planning sanity-check, not a commitment.
