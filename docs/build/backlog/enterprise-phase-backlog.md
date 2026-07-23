# Enterprise Phase — Ticket Backlog

**Status:** PM-proposed. Same format as prior phases.
**Source:** build guides 14, 19, 23, 25, plus the Enterprise-phase addenda in build guides 02 and 22.
**Note:** unlike prior phases, these modules don't need to ship together or in strict order — pull whichever the business needs first once Talent phase is live.

---

## Epic 27: Asset Management (Module 14)

| Story | Description | Points |
|---|---|---|
| Prisma schema: assets, asset_assignments | | 3 |
| Inventory + Asset Detail screens | | 5 |
| Assign/Return flow with e-signature (Module 13) | | 5 |
| Employee Detail Assets tab wiring | | 2 |
| Exit-checklist integration (Module 15) | | 3 |
| **Epic total** | | **18** |

## Epic 28: Reports and Analytics — full build-out (Module 19)

| Story | Description | Points |
|---|---|---|
| Custom Report Builder UI (cross-module domain/field/filter picker) | | 13 |
| Permission-enforced query layer (reuses Module 21) | **The one story that must not be treated as "just wire it up"** | 8 |
| Saved views + sharing | | 5 |
| Scheduled report delivery (Module 18) | | 5 |
| **Epic total** | | **31** |

*(Standard per-persona dashboards should already exist incrementally from earlier phases — this epic is specifically the self-service builder.)*

## Epic 29: Integrations Framework (Module 23)

| Story | Description | Points |
|---|---|---|
| Shared `IntegrationConnector` base pattern | Build once, retrofit existing ad hoc integrations (banking, e-sign, SSO) onto it | 8 |
| Integration Health Dashboard | | 5 |
| Manual resync action (generic, works for any integration) | | 3 |
| Severity-differentiated alerting (Module 18 critical-path) | | 5 |
| Credential encryption/rotation | | 5 |
| Remaining long-tail integrations (job boards, LMS, background-check, ERP) | Size individually as each is prioritised | — |
| **Epic total (excl. long-tail)** | | **26** |

## Epic 30: AI-Assisted Capabilities (Module 25)

| Story | Description | Points |
|---|---|---|
| `ai_suggestions` schema + logging | | 3 |
| Payroll anomaly detection (inside Module 6's variance report) | First capability — lowest incremental risk | 8 |
| Attendance anomaly detection (inside Module 4's regularisation review) | | 5 |
| AI Usage Dashboard | | 3 |
| Data-governance sign-off (provider selection, no-training-on-tenant-data guarantee) | **Not an engineering ticket — a legal/product sign-off gate before any further capability starts** | — |
| Every later capability (recruitment-matching, review-writing assistance, attrition-risk) | Size individually, each needs its own fairness review before build | — |
| **Epic total (2 starting capabilities only)** | | **19** |

## Epic 31: Position Management (Module 2 addendum)

| Story | Description | Points |
|---|---|---|
| Prisma schema: positions (vacant-capable, budget-linked) | | 5 |
| Position CRUD + vacancy tracking | | 5 |
| Module 8 requisition linkage to a Position | | 3 |
| Headcount planning / budget-vs-actual view | | 5 |
| **Epic total** | | **18** |

## Epic 32: Sandbox and Feature Flags (Module 22 addendum)

| Story | Description | Points |
|---|---|---|
| Sandbox environment (synthetic-data default) | | 8 |
| Config-change promotion flow (sandbox → production) | | 5 |
| Feature flag table + per-tenant toggles | | 5 |
| **Epic total** | | **18** |

---

## Phase total

**~130 points for the well-scoped stories** (Epics 27, 28, 29-excl-long-tail, 30-starting-capabilities, 31, 32) — the long-tail integrations and later AI capabilities are deliberately left unestimated because they should be sized against actual customer demand at the time, not speculatively now, consistent with [03-product-vision.md](../../hrms-prd/03-product-vision.md)'s explicit non-goal of building breadth nobody's asked for yet.
