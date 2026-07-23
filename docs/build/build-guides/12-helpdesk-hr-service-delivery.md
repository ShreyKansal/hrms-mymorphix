# Build Guide — Module 12: Helpdesk and HR Service Delivery

**Full spec:** [modules/12-helpdesk-hr-service-delivery.md](../../hrms-prd/modules/12-helpdesk-hr-service-delivery.md)
**Phase:** HR Operations.

---

## What this module is, in one paragraph

A support-ticket system for HR questions, with one specific twist that matters more than the ticketing mechanics: **before letting someone submit a ticket, show them a knowledge-base article that might already answer it.** The whole point of this module is reducing HR's ticket load, not just organising it.

## Screens to build

1. **Raise a Request** — pick a category, and *before* the actual ticket form appears, show suggested knowledge-base articles matching that category. Only if the employee says "still need help" do they proceed to the full ticket form. This deflection step is the most important screen in this module — don't treat it as optional.
2. **My Tickets** — status, history, ability to reply/reopen.
3. **HR Queue** (for HR staff) — tickets assigned to them, filterable by category/priority/SLA-status, with a clear visual flag for anything close to breaching its SLA.
4. **Ticket Detail** — conversation thread (visible to the employee) plus a separate "internal notes" section (HR-only, never shown to the employee — build this as a genuinely separate field/permission, not just a UI toggle).
5. **Knowledge Base management** (HR admin) — write/edit articles, organised by category.

## Key user flow: deflection

1. Employee picks "Payslip Access" as a category.
2. System shows the top-matching KB article ("How to download your payslip").
3. If that answers it, employee marks it resolved — **track this as a distinct event** ("deflected"), separate from a real ticket, so HR can later see which categories are working well (high deflection) and which need better documentation (low deflection, high ticket volume).
4. If it doesn't help, they continue to a real ticket, which gets assigned per configured rules and starts an SLA timer.

## Data model

`tickets`, `ticket_categories`, `kb_articles`, `kb_deflection_events` (the "resolved without a ticket" log — don't skip this table, it's the metric that proves this module is working).

## States

`Open` → `Assigned` → `In Progress` → `Pending Employee Response` (SLA timer pauses here — don't penalise HR for a slow employee reply) → `Resolved` → `Closed`/`Reopened`.

## API endpoints

```
GET    /api/v1/kb/search?q=&category=
POST   /api/v1/kb/deflections           — log a "resolved without ticket" event
POST   /api/v1/tickets
GET    /api/v1/tickets?assignee=&status=&slaStatus=
PATCH  /api/v1/tickets/:id
POST   /api/v1/tickets/:id/notes        — internal, HR-only
POST   /api/v1/tickets/:id/responses    — employee-visible
```

## Components

`@atlaskit/dynamic-table` for queues, `@atlaskit/form` for ticket creation, `@atlaskit/comment` for the conversation thread, `@atlaskit/lozenge` for status/SLA badges.

## What "done" looks like

- The deflection step genuinely appears before ticket submission is possible, for any category with matching articles.
- An internal note never appears anywhere in the employee-facing view — test this by checking the actual API response the employee's client receives, not just the UI.
- SLA timer correctly pauses while a ticket is `Pending Employee Response` and resumes when they reply.
