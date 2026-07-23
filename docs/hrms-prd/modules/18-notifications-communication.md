# Module 18 — Notifications and Communication

**Status:** Draft v1 (pending stakeholder review) · **Release:** Foundation
**Depends on:** Module 21 (Roles and Permissions — recipient scoping), Module 23 (email/SMS/Slack/Teams provider integrations)

---

## 1. Module overview

The shared notification infrastructure (in-app, email, push, SMS, Slack/Teams) every other module sends through — templates, preferences, digests, and delivery reliability. Like Module 17, this is shared infrastructure, not a standalone user-facing destination beyond the Notification Centre itself.

## 2. Problem statement

Two failure modes are equally damaging and equally common in HR software: too little (users miss time-sensitive approvals) and too much (notification fatigue causing everything to be ignored, including the important ones). Neither competitor research nor the brief gives a single right answer — this module's job is to make the *tenant's and individual user's* preferences the actual control, not a hard-coded assumption either way.

## 3. Business objective

Deliver every notification reliably through the channel(s) the recipient actually wants, with sensible defaults that avoid both silence-on-important-things and noise-on-everything, and give users real control over their own preferences.

## 4. User personas

Every persona is a notification recipient; **HR Administrator/System Administrator** configure templates and tenant-wide defaults; every individual user configures their own channel/frequency preferences within those defaults.

## 5. User needs

Every user needs time-sensitive items (an approval waiting on them, a payroll deadline) to reliably reach them, and needs the ability to turn down the volume on lower-stakes updates without missing the important ones — a genuine, not cosmetic, distinction this module must support structurally (via notification *priority*, not just category).

## 6. Primary use cases

Receive in-app notifications (Notification Centre); receive email notifications; receive mobile push notifications; receive SMS for critical items (optional, tenant-configurable); receive Slack/Teams notifications (Module 23 integration); configure personal notification preferences; HR Administrator configures notification templates and tenant-wide defaults; scheduled reminders and digests; failed-delivery handling.

## 7. Detailed workflows

### 7.1 Notification dispatch

- **Trigger:** Any module fires a notification event (e.g., Module 5's `LeaveApproved`).
- **Steps:** 1) This module resolves the event against a configured template (with dynamic variables, similar in spirit to Module 13's document templates) 2) Resolves the recipient's channel preferences, filtered by the notification's configured priority (a "critical" notification — e.g., a payroll-processing failure — may override a user's "email only" preference and also push in-app/SMS if configured as always-critical-multichannel by the tenant, while a "informational" notification respects the user's preference strictly) 3) Dispatches via each resolved channel's provider integration (Module 23) 4) Tracks delivery status per channel 5) On failure (e.g., email bounces, push token invalid), retries per a configured policy and, for critical notifications, falls back to an alternate channel rather than silently failing.
- **Decision points:** Digest eligibility — some notification types are configured as digest-only by default (e.g., "you have 3 new document updates" rather than 3 separate interruptions), reducing fatigue for genuinely low-urgency, batchable updates.
- **Failure handling:** Persistent delivery failure across all configured channels for a critical notification should itself generate an alert to a System/IT Administrator — a notification-delivery failure for something time-sensitive (e.g., a payroll-run failure alert that never reached the Payroll Administrator) is a serious operational risk, not just a minor bug.
- **Audit events:** `NotificationDispatched`, `NotificationDeliveryFailed` (with channel and reason).

## 8. User stories

**US-1**
As an **Employee**, I want to choose email-only for routine updates but keep push notifications on for approvals affecting me directly, so that I control my own notification load without missing what matters to me.
**Acceptance criteria:** Given an employee sets "routine" notifications to email-only and "approval-affecting-me" to push+email, when both types fire, then each respects its own configured channel — not a single blanket on/off toggle.

**US-2**
As a **Payroll Administrator**, I want a critical payroll-processing-failure alert to reach me even if I've turned down my general notification volume, so that something genuinely urgent never gets lost in my personal preference settings.
**Acceptance criteria:** Given a notification is tenant-configured as "critical, always multichannel," when it fires, then it bypasses the recipient's channel-narrowing preference (though never bypasses an explicit opt-out of a channel they don't have, e.g., no SMS number on file) and is logged as having done so, for transparency.

## 9. Functional requirements

Notification centre (in-app, with read/unread state); email notifications; push notifications (mobile); SMS support (critical/optional, tenant-configurable, cost-aware given SMS is typically a paid-per-message channel); Slack/Teams integration (Module 23); notification templates with dynamic variables; per-user notification preferences (channel × category, with priority-based override rules per §7.1); scheduled reminders; event-triggered alerts; escalations (feeding from Module 17); digest notifications (batched, configurable frequency); notification expiry (an old, no-longer-actionable in-app notification should be distinguishable/archivable, not clutter indefinitely); failed-delivery handling and fallback (§7.1); communication audit logs.

## 10. Business rules

Notification priority (informational / important / critical) is set by the *triggering module*, not left to a generic default — e.g., Module 6's payroll-failure alert is critical by design, Module 11's recognition notification is informational by design. Critical notifications may override a user's channel-narrowing preference (§8 US-2) but never override an explicit "I don't have this contact method" gap (can't SMS someone with no phone number on file) — the override applies to *preference*, not to *capability*.

## 11. Validation rules

A notification template must resolve all its dynamic variables from the triggering event's context — same "no blank/placeholder value" principle as Module 13's document generation, applied here to a lower-stakes but still-important communication surface.

## 12. Permission requirements

Users can only configure their own notification preferences (Module 21 self-scope); HR Administrator configures tenant-wide templates and critical-notification-override policy, not individual users' preferences on their behalf without a clear administrative reason (e.g., onboarding a new employee with sensible defaults is fine; silently overriding an existing employee's chosen preferences is not).

## 13. Approval workflows

Not applicable — this module doesn't have its own approval-gated actions (template changes might warrant HR Administrator review before going live, but that's a lightweight internal practice, not a formal Module 17 workflow requirement).

## 14. Statuses and state transitions

**Notification instance:** Dispatched → Delivered/Failed → (in-app) Read/Unread → Archived/Expired.

## 15. Record detail-page requirements

Notification Centre: chronological (or priority-grouped) list, read/unread state, deep-links to the source record in the owning module (never a dead-end notification with no actionable destination). Preferences page: category × channel matrix, clearly showing which categories are marked critical/non-overridable by the tenant.

## 16. Search, filter and sorting requirements

Notification Centre filterable by category/read-status/date; searchable for finding a specific past notification (e.g., "when was I notified my leave was approved").

## 17. Bulk-action requirements

Mark-all-read; bulk preference changes (e.g., "mute all recognition notifications" as one action rather than category-by-category).

## 18. Import and export requirements

Not a primary need for this module — templates may be exportable/importable in the same spirit as Module 17's workflow-definition portability (Module 22 sandbox/multi-org context).

## 19. Notification requirements

This module *is* the notification-requirements infrastructure for the whole product — see §9 for the full functional scope; there's no meaningful "notifications about notifications" beyond the delivery-failure alert in §7.1.

## 20. Mobile requirements

Push notification delivery and the Notification Centre itself should be fully native-feeling on mobile, given how central timely notification delivery is to the mobile-first personas' (Employee, Manager) workflows per [04-personas-and-roles.md](../04-personas-and-roles.md) — this module's mobile quality directly gates the usability of nearly every other module's mobile experience.

## 21. Reporting requirements

Notification-delivery-success-rate by channel (an operational-health metric, relevant to Module 23's integration-reliability tracking too), digest-open-rate/engagement (informs whether digest cadence defaults are well-tuned).

## 22. Audit-log requirements

Every dispatch and delivery-status outcome, per channel — per Phase 11; this is also directly relevant to Module 10's compliance-training-reminder evidentiary trail and Module 15's exit-checklist-reminder trail, where "was the person actually notified" can matter for a dispute.

## 23. Integration requirements

Module 23 (email/SMS/push/Slack/Teams provider integrations — this module's core external dependency); every other module as a notification-triggering source.

## 24. Error, empty, and edge cases

**Error states:** all-channel delivery failure for a critical notification (§7.1's escalation-to-IT-Administrator requirement). **Empty states:** a new user with no notifications yet — a clean, unremarkable empty state (nothing to design around here beyond basic clarity). **Edge cases:** a user with no email or phone on file yet (early onboarding, before Module 3's data collection completes) — in-app-only delivery should degrade gracefully, not error; a notification whose source record has since been deleted/archived (the deep-link destination should handle this gracefully, e.g., "this record is no longer available," not a broken link).

## 25. Acceptance criteria

Given a critical notification fails to deliver on every configured channel, when the failure is detected, then a distinct operational alert reaches a System/IT Administrator within a defined SLA — this failure path itself must be reliable, since it's the last line of defense against a genuinely important message getting lost silently.

## 26. Dependencies

Module 21 (recipient/preference permission scoping), Module 23 (delivery-provider integrations).

## 27. Risks

Notification fatigue is a real, gradual risk that can undermine adoption of everything else in the product if not actively managed (not a one-time design decision but an ongoing tuning discipline, informed by §21's engagement/delivery reporting) — worth flagging as an operational, not just design, responsibility.

## 28. Open questions

None significant beyond the general critical-vs-preference override calibration, which should be tuned empirically post-launch rather than fully resolved in this PRD phase.

## 29. Release scope

**MVP:** in-app Notification Centre, email, mobile push, per-user preferences with priority-based override, digest notifications, delivery-failure fallback/escalation.
**Later phase:** SMS (cost-model-dependent, may be MVP for critical-only use cases — flagged as a scoping decision for Module 22's tenant-configuration design), Slack/Teams integration depth.
**Out of scope:** this module is not a general-purpose marketing/campaign-communication tool — it's transactional/operational notification infrastructure, distinct in purpose from Module 11's announcement/engagement content (though both may share Module 23's underlying email-provider integration).
