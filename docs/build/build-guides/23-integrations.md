# Build Guide — Module 23: Integrations

**Full spec:** [modules/23-integrations.md](../../hrms-prd/modules/23-integrations.md)
**Phase:** individual integrations get built as the module needing them ships (e.g., a banking integration alongside Module 6, an e-signature integration alongside Module 13) — the **generic framework** below and the **admin management UI** are the Enterprise-phase deliverable that makes adding the 10th integration as easy as the 2nd.

---

## What this module is, in one paragraph

The plumbing connecting this product to the outside world: biometric devices, SSO providers, banks, e-signature, job boards, background-check providers, accounting software. Not one integration — a **consistent pattern** every integration follows, so the 10th one isn't harder to build (or debug at 2am) than the 1st.

## The pattern every integration must follow (build this once, apply everywhere)

For every integration: is it real-time (webhook) or polled? What happens on failure — retry, and is retrying safe (idempotent) or risky (e.g., a payment integration must never double-send on a retry)? Is there always a manual "resync" button an admin can hit, so nobody's ever stuck waiting on us to fix something? Is the failure logged with enough detail to actually debug it later?

**Concretely: build one shared `IntegrationConnector` interface/base class** in NestJS that every specific integration (banking, biometric device, SSO, etc.) implements — `testConnection()`, `sync()`, `handleWebhook()`, with retry/idempotency handled at this shared layer, not reimplemented per integration.

## Screens to build

1. **Integration Health Dashboard** (IT Admin) — every configured integration, last successful sync, current status. Make failures impossible to miss — don't bury a failing integration in a list that looks the same as a healthy one.
2. **Integration Setup** — credentials, field mapping, sync frequency, per integration type.
3. **Manual Resync** action — always available, on every integration, no exceptions.

## Severity matters — not every integration failure is equal

A job-board posting that fails to sync is a minor issue. A banking-disbursal failure during payroll, or an access-revocation failure during an employee's last day, is urgent. Build the alerting (via Module 18) so these get genuinely different treatment — the banking/access-revocation failures should page someone immediately, not sit in a daily digest.

## Data model

`integrations` (type, config, credentials — encrypted, never plaintext), `integration_sync_logs` (every attempt, success/failure, timestamp).

## API endpoints

```
GET/POST/PATCH  /api/v1/integrations
POST            /api/v1/integrations/:id/test-connection
POST            /api/v1/integrations/:id/resync
GET             /api/v1/integrations/:id/sync-logs
POST            /api/v1/webhooks/:integrationType         — inbound webhook receiver, signature-verified
```

## What "done" looks like

- Simulate a banking-integration failure during a test payroll run, confirm the Payroll Administrator gets alerted immediately, not via a routine digest.
- Hit "resync" on a failed integration, confirm it actually recovers without needing a deploy or a database fix.
- Confirm a retried payment-type sync doesn't double-send — test this specifically, don't assume the generic retry logic is safe here.
