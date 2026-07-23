# 02 — Are We Ready to Start? (Readiness Checklist)

**Status:** honest gate-check, not a formality. Everything in `docs/` up to this point — architecture, execution plan, all 27 build guides — was produced as a planning exercise. **No human with actual engineering, legal, or payroll authority has reviewed or approved any of it yet.** That's the single most important thing to understand before answering "are we ready."

---

## ✅ Can start today, zero blockers

Nothing below needs anyone's sign-off — start these now, in parallel:

- **Sprint 0 infra scaffolding** — monorepo, empty NestJS + React apps, CI pipeline. Purely mechanical, per [00-architecture-and-tech-stack.md](00-architecture-and-tech-stack.md).
- **Design work** — the designer can start translating build guides into actual Figma screens using Atlaskit's libraries right now; design doesn't wait for engineering's first commit.
- **AWS account + domain + repo creation** — administrative setup, no decision-making required.

## 🔴 Blocking before Sprint 1 (writing real feature code)

These are small in number but real — none should take more than a few days if someone with the right authority just looks at them:

1. **Someone with actual engineering authority needs to read and ratify (or change) [00-architecture-and-tech-stack.md](00-architecture-and-tech-stack.md).** I proposed NestJS, PostgreSQL, React Native, AWS — reasoned, but proposed by me, not approved by your engineering lead. If that's you, say so explicitly and this gate clears immediately.
2. **Confirm who's actually on this team.** [01-project-execution-plan.md](01-project-execution-plan.md) assumes ~7 people. If it's fewer (or just you plus contractors), the sprint math and phase pacing need to be re-cut — the modules and order don't change, but the sprint count will.
3. **OQ-1 — is direct use of public `@atlaskit/*` npm packages actually fine?** Some referenced design-system resources are marked "Atlassians only" in the source material. Low risk to build a private dev environment against this assumption today; **needs a real answer before any customer-facing launch.**

## 🟡 Blocking before specific phases — start the clock now, they're not urgent yet, but they're the longest lead-time items

4. **Book a qualified payroll professional / CA for the Payroll-phase review.** This was flagged twice already because it's genuinely the item most likely to quietly become the bottleneck — Payroll is several sprints away, but external calendars don't move at sprint speed. Start this conversation this week, not when engineering says "Payroll's ready for review."
5. **Get real legal confirmation on Module 26 (POSH)'s specific numbers** — exact IC composition requirements and inquiry-timeline days. The build guide and PRD both currently work from my general understanding of the Act, explicitly flagged as needing confirmation, not asserted as correct. Fine to build the *mechanism* (configurable composition rules, configurable deadline) now; do not launch this module against unconfirmed numbers.
6. **OQ-9 — inter-entity transfer continuity of service (PF/gratuity carry-over).** Affects Module 6 and Module 15's transfer logic. Not urgent today, needs resolving before that logic is finalized.

## 🟢 Not blocking anything technical, but shouldn't be forgotten

7. **Product name** — still the "Project Meridian" placeholder, used throughout every document.
8. **Vendor relationships** — banking-disbursal partner, biometric-device vendor, e-signature provider, background-verification provider. Module 23 needs at least one real partner in each category before its build guide's stories are more than theoretical. These are commercial/partnerships conversations, not engineering ones — start them in parallel, they typically have real lead time too.
9. **Commercial/pricing model** — not needed to start building, but a few success metrics in the PRD are explicitly deferred pending this.

## The honest summary

Everything document-shaped is done — arguably over-planned relative to a normal startup's first sprint. What's missing isn't more planning, it's **a small number of specific humans looking at a small number of specific things.** None of items 1–3 should take more than a week if the right person just reads them. Items 4–6 don't block Sprint 0 or Sprint 1 at all — they block later phases, and the only mistake now would be *not* starting those conversations early.

**Recommendation: start Sprint 0 (infra + design) this week. In parallel, get whoever owns engineering to spend an hour on items 1–3. Book the payroll reviewer this month regardless of when Payroll-phase engineering actually starts.**
