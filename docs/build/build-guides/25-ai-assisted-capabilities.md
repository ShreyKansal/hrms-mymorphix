# Build Guide — Module 25: AI-Assisted Capabilities

**Full spec:** [modules/25-ai-assisted-capabilities.md](../../hrms-prd/modules/25-ai-assisted-capabilities.md)
**Phase:** Enterprise, and even then — **one capability at a time, each with its own review, not a big-bang launch.**

---

## What this module is, in one paragraph

AI suggestions embedded inside other modules' screens — never a standalone "AI module" someone visits. And the hard rule that matters more than any model choice: **AI never takes a consequential action by itself.** It suggests, drafts, or flags; a human always makes the actual decision, for anything that matters.

## Which capability to build first

Start with **payroll and attendance anomaly detection** — flag unusual patterns for a human to review within screens that *already* require human sign-off (Module 6's variance gate, Module 4's regularisation review). These are the lowest-incremental-risk starting points because the human-in-the-loop control already exists; you're just giving the human a better hint of where to look, not adding a new autonomous surface. Save recruitment-matching, performance-review-writing, and attrition-risk scoring for later — those touch people's careers directly and need a dedicated fairness review each, not just a feature launch.

## How to build any capability in this module (the pattern)

1. It lives inside the host module's existing screen (e.g., a "possible anomaly" badge inside Module 6's variance report), never a separate page.
2. Every output is clearly labeled as AI-generated — no design that could make it look like a definitive system answer.
3. Whatever the AI suggests, it goes through the **existing** approval/review flow of that module — never a new, AI-specific shortcut that bypasses the human check.
4. Log every suggestion and what the human actually did with it (accepted/edited/rejected) — this is both a quality-improvement signal and, for the higher-stakes capabilities later, an audit trail if bias is ever questioned.
5. It only ever sees data the requesting user could already see through normal permissions — run it through the same Module 21 checks as everything else, don't give it a backdoor data path.

## Screens to build (for the two starting capabilities)

1. **Payroll anomaly flag** — inside Module 6's variance report, an additional "possible issue" indicator with a plain-language reason ("this employee's PF contribution jumped 40% with no compensation change on record").
2. **Attendance anomaly flag** — inside Module 4's regularisation review, similarly.
3. **AI Usage Dashboard** (HR/System Admin) — acceptance vs. rejection rate per capability, so you can tell if a capability is actually useful or just noise.

## Before building anything beyond the two starting capabilities

Confirm with product/legal: which AI provider, and get an explicit answer on whether tenant data is ever used to train a shared model (it should not be) — this is a data-governance question, not an engineering one, but engineering shouldn't wire up a provider before it's answered.

## Data model

`ai_suggestions` (capability type, input reference, output, human action taken — accepted/edited/rejected/ignored).

## API endpoints

```
POST  /api/v1/ai/payroll-anomaly-check      — called internally during Module 6's preview step
POST  /api/v1/ai/attendance-anomaly-check   — called internally during Module 4's regularisation review
GET   /api/v1/ai/usage-dashboard
```

## What "done" looks like

- A flagged payroll anomaly appears inside the existing variance-review screen, doesn't add a new approval path, and doesn't block anything on its own — a human still makes the final call through the mechanism that already existed.
- Turn the AI capability off entirely for a tenant — confirm the underlying module (Payroll, Attendance) works exactly as well without it. If it doesn't, that's a sign the capability became load-bearing instead of additive, which breaks this module's core design rule.
