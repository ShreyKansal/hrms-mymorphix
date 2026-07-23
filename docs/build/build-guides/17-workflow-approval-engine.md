# Build Guide — Module 17: Workflow and Approval Engine

**Full spec:** [modules/17-workflow-approval-engine.md](../../hrms-prd/modules/17-workflow-approval-engine.md)
**Sprint:** Foundation, Sprint 4.
**Why this exists as its own module instead of "each module builds its own approvals":** if every module invents its own approval logic, we end up with the exact "rigid, hard-wired" problem we found in competitor research (Keka, RazorpayX). One well-built engine, used everywhere, means changing an approval rule is a configuration change, not a code change, everywhere it's used.

---

## What this module is, in one paragraph

A generic "who needs to approve this, in what order" engine that any other module can plug into. It doesn't know or care what a "leave request" or a "reimbursement" is — it just knows "an event happened, here's the rule for who approves it, go find out who that is right now (not who it was when the rule was written) and ask them."

## The core idea: approvers are resolved live, not hard-coded

This is the single most important thing to get right. Don't write "this workflow routes to John." Write "this workflow routes to the requester's current manager" — and look that up fresh, every time, from Module 1/2's live org data. That way, when the org chart changes, approval routing is automatically correct without anyone touching the workflow configuration.

## Screens to build

1. **Workflow Definitions list** — for HR Admins, a list of configured approval rules ("Leave requests over 5 days," "Reimbursements over ₹10,000").
2. **Workflow Editor** — trigger (which event), conditions (e.g., "duration > 5 days"), chain type (sequential / parallel / any-one-approves / all-must-approve), and who approves at each step (a rule, not a name: "current manager," "HR Business Partner," "a specific role," etc.).
3. **Simulation panel** — before turning a new/edited rule on, test it against sample data and see exactly who it would route to, without creating a real approval request. Build this — it catches "oops, this resolves to nobody" mistakes before they hit a real employee.
4. **(For end users, built once, reused everywhere via Module 16 later)** an approval action UI — approve / reject / return-with-comment. Foundation phase: build a bare-bones version for testing; the polished, unified inbox comes with Module 16 in the HR Operations phase.

## Key user flow: an approval chain executing

1. Some other module (say, in a later sprint, Module 5's leave request) fires an event: "leave request submitted, by employee X, for 6 days."
2. This engine checks its configured rules, finds one that matches ("leave > 5 days → route to manager, then HRBP").
3. Looks up employee X's *current* manager (a live query to Module 1/2 — never a value baked into the workflow config).
4. Creates an approval task for that manager. When they approve, moves to step 2 (HRBP), same live-lookup logic.
5. If an approver is on leave/inactive/no longer exists, don't leave the request stuck forever — route it up their own management chain automatically, and log that this happened.
6. When the full chain completes, fire a completion event back to the originating module (Module 5, in this example) — **this engine never directly changes the leave request's data itself**, it just reports "approved" or "rejected" back to the module that owns that data. Keeping this separation clean is what stops this engine from becoming a tangled mess as more modules plug into it.

## API endpoints

```
GET/POST/PATCH  /api/v1/workflow-definitions
POST            /api/v1/workflow-definitions/:id/simulate
POST            /api/v1/workflow-events            — any module calls this to kick off a workflow instance
GET             /api/v1/workflow-instances/:id      — status/history of one running approval chain
POST            /api/v1/workflow-instances/:id/decide — approve/reject/return (called by whoever is currently the approver)
```

## What "done" looks like

- Build one real end-to-end test: configure a rule, fire an event, confirm it routes to the *actual current* manager (not a hard-coded one), approve it, confirm the completion event fires back correctly.
- Change the employee's manager mid-test, fire a new event, confirm it now routes to the *new* manager without touching the rule configuration.
- Deactivate an approver mid-chain, confirm the pending approval automatically re-routes rather than getting stuck.
- Edit a workflow rule while a request is already in progress under the old rule — confirm the in-progress one finishes under the old rule, and only new requests use the new one.
