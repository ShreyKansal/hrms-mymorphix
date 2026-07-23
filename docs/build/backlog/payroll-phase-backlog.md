# Payroll Phase — Ticket Backlog

**Status:** PM-proposed. Same format as prior phases.
**Source:** [../build-guides/06-payroll-management.md](../build-guides/06-payroll-management.md), [../build-guides/07-reimbursements-expenses.md](../build-guides/07-reimbursements-expenses.md).
**Read before estimating against this:** [01-project-execution-plan.md](../01-project-execution-plan.md) §3 — this phase has a **hard external gate** (qualified payroll-professional sign-off) that doesn't show up as story points but will affect your calendar. Start that conversation now, not when engineering is "done."

---

## Epic 17: Payroll Configuration (Module 6, part 1)

| Story | Description | Points |
|---|---|---|
| Prisma schema: payroll_groups, pay_components, salary_structures | Every pay component requires explicit tax/statutory treatment before use | 5 |
| Prisma schema: statutory_rates | Versioned, effective-dated — **not hard-coded values** | 5 |
| Salary Structure Setup screens | Per-employee and template-based | 8 |
| Statutory rate seed data + admin editing screen | PF/ESI/PT (state-variant)/TDS/LWF/Gratuity starting values | 8 |
| **Epic total** | | **26** |

## Epic 18: Payroll Run Engine (Module 6, part 2 — the core)

| Story | Description | Points |
|---|---|---|
| Prisma schema: payroll_runs, payroll_inputs, payslips | Status state machine per the build guide | 5 |
| Input collection: pull Attendance (locked) + Leave (LOP/encashment) | Must be zero-ambiguity by the time it reaches here | 8 |
| Input collection: one-time payments/deductions UI | | 3 |
| Statutory calculation engine: PF (incl. EPS) | | 8 |
| Statutory calculation engine: ESI | | 5 |
| Statutory calculation engine: Professional Tax (state-variant) | | 8 |
| Statutory calculation engine: TDS (old/new regime) | | 13 |
| Statutory calculation engine: Gratuity, LWF | | 5 |
| Preview action (no side effects, re-runnable) | | 5 |
| Variance report + mandatory-acknowledgement gate | **The single most important control in this epic** | 8 |
| Lock action + step-up re-authentication | | 5 |
| Payslip generation | | 5 |
| Bank-transfer file generation | Format per whichever banking partner Module 23 integrates first | 5 |
| Rollback (pre-disbursal) vs. financial-recovery flow (post-disbursal) | Two visibly distinct flows, honest UI language | 8 |
| Arrears mechanism for retroactive changes | Never edits a locked run directly | 8 |
| **Epic total** | | **99** |

## Epic 19: Employee-Facing Payroll (Module 6, part 3)

| Story | Description | Points |
|---|---|---|
| Payslip view | Shows underlying attendance/leave data that produced any LOP figure | 5 |
| Tax Declaration submission + real-time TDS preview | | 8 |
| Statutory reports (PF/ESI/PT/TDS summaries, filing-ready format) | | 8 |
| Compliance-deadline tracker | | 3 |
| **Epic total** | | **24** |

## Epic 20: Full & Final Settlement (Module 6, part 4)

| Story | Description | Points |
|---|---|---|
| Settlement calculation: pro-rated pay, leave encashment, gratuity, loan recovery | | 8 |
| Settlement review + Payroll Administrator approval | | 5 |
| Integration with Module 15's separation trigger | | 3 |
| **Epic total** | | **16** |

## Epic 21: Reimbursements (Module 7)

| Story | Description | Points |
|---|---|---|
| Prisma schema: expense_categories, policies, claims, cash_advances | | 5 |
| Claim submission + OCR integration | Employee always confirms extracted values | 8 |
| Duplicate-receipt detection | | 5 |
| Policy-limit checks (block or flag-with-justification, tenant-configurable) | | 5 |
| Approval flow + Finance co-approval above threshold | | 5 |
| Payroll-routing: auto-appears as a payroll_input in Module 6 | | 5 |
| Direct-payout path (Module 23 banking) | | 3 |
| Cash advance request + offset-against-future-claims logic | | 5 |
| **Epic total** | | **41** |

---

## Phase total

**~206 story points**, but **do not read this as "5 sprints and done."** This phase's real bottleneck is calendar time for external review, not engineering throughput:

1. Engineering builds against realistic test data and the acceptance criteria in the build guides.
2. **Before any real customer payroll runs through this**, a qualified payroll professional needs to independently verify the statutory calculations (Epic 18's TDS/PF/ESI/PT/Gratuity stories especially) against manual calculations for a representative set of test cases.
3. Any discrepancy found goes back to engineering as a normal bug, but **budget calendar time for at least one full review-and-fix cycle** — this is not optional QA, it's the hard exit gate for this phase per [13-release-roadmap.md](../../hrms-prd/13-release-roadmap.md).

**Recommendation: start the conversation with a payroll consultant/CA now**, in parallel with Epic 17/18 engineering work, so the review doesn't sit as a blocker after engineering is otherwise done.
