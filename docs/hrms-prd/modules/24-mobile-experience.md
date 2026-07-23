# Module 24 — Mobile Experience

**Status:** Draft v1 (pending stakeholder review — depends on OQ-2's native-vs-responsive-web decision) · **Release:** HR Operations (core actions) / progressive expansion thereafter
**Depends on:** [00-existing-system-audit.md](../00-existing-system-audit.md) (Atlaskit is a web/React library, not React Native — see Assumption A2), Module 16 (ESS/MSS — the primary content this module delivers)

---

## 1. Module overview

This module doesn't own new business logic — it defines the **mobile-specific product scope and interaction design** for the high-frequency actions identified across [04-personas-and-roles.md](../04-personas-and-roles.md): check-in/out, leave, approvals, payslips, reimbursement submission, directory, announcements, documents, helpdesk, goals/reviews, learning, surveys, push notifications. Per Product Principle 10 ([03-product-vision.md](../03-product-vision.md)), this is a **deliberately scoped subset**, not an attempt at full feature parity with web — a considered response to market research §7's finding that mobile-web parity gaps are near-universal among competitors, treating that as a signal to scope deliberately well rather than chase unattainable full parity.

## 2. Problem statement

Every competitor researched except BambooHR shows a specific, named mobile-vs-web feature-parity gap, and even Rippling — the highest-rated product researched — explicitly cannot run payroll from its mobile app. This isn't uniformly a failure; for high-blast-radius actions (Module 6/15's payroll/separation processing), *not* optimising for mobile is arguably correct given the deliberate-friction principle established for those modules. The real problem is when the *high-frequency, low-risk* actions (check-in, leave, approvals) also have mobile gaps — that's where the competitor pattern is a genuine weakness worth avoiding.

## 3. Business objective

Make the mobile experience excellent for the specific, high-frequency, appropriately-low-risk actions employees and managers do most often, working reliably under India's variable mobile-network conditions outside major metros, without pretending mobile should or will replace desktop for complex, high-blast-radius administrative work.

## 4. User personas

Primary: **Employee**, **People Manager** — per [04-personas-and-roles.md](../04-personas-and-roles.md)'s explicit "mobile-first personas" designation. Secondary (moderate mobile need): **HR Executive**, **Recruiter**, **Department Head**, **Leadership**. Explicitly low/no mobile need by design: **Payroll Administrator**, **Finance User**, **IT Administrator**, **Compliance/Audit User**, **System Administrator**.

## 5. User needs

Employee needs check-in/out, leave application, and payslip access to work reliably on a phone, including under imperfect connectivity. Manager needs the approval inbox to be genuinely usable on mobile, since approvals often happen in fragments of time away from a desk (per [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 2's mobile-requirements note).

## 6. Primary use cases

Check in/out (with geo/selfie capture); apply for and check status of leave; approve/reject leave, attendance regularisation, and reimbursement requests; view/download payslips; submit reimbursement claims (camera-based receipt capture); browse the employee directory; read announcements; access documents; raise/track helpdesk tickets; update goals and complete lightweight performance-review actions; access learning-course status; respond to surveys; receive and act on push notifications.

## 7. Detailed workflows

### 7.1 Offline-tolerant check-in/out

- **Trigger:** Employee attempts check-in/out with degraded or no network connectivity (a realistic scenario per §2, not an edge case to dismiss).
- **Steps:** 1) App captures the check-in/out attempt locally (timestamp, geo-coordinates, method) even without immediate network connectivity 2) On connectivity restoration, the captured attempt syncs to the server, timestamped with the original local capture time (not the sync time — the actual event time is what matters for attendance accuracy) 3) If sync doesn't succeed within a reasonable window, the employee sees a clear pending-sync indicator, not a false confirmation that could mislead them into thinking it's already recorded.
- **Decision points:** Geo-fence validation (Module 4 §7.1) that depends on a live server check should have a defined offline-tolerant fallback — e.g., accept the local capture but flag it for regularisation review if the geo-fence check couldn't be validated at capture time, rather than blocking the check-in entirely just because connectivity was poor.
- **Failure handling:** A capture that never successfully syncs (app uninstalled, device lost, indefinite offline period) should be recoverable via the standard regularisation workflow (Module 4 §7.2), not lost entirely.
- **Audit events:** The eventual synced record carries both the original local-capture timestamp and the sync timestamp, both retained (transparency about the offline-capture nature of the record).

## 8. User stories

**US-1**
As an **Employee** in an area with unreliable mobile data, I want my check-in to be captured even if I can't sync immediately, so that I'm not penalised for a network issue outside my control.
**Acceptance criteria:** Given an employee checks in with no network connectivity, when connectivity is restored later, then the check-in syncs with its original capture timestamp, not the later sync timestamp, and the employee sees clear confirmation once sync succeeds.

**US-2**
As a **People Manager**, I want to approve a straightforward leave request from a push notification without opening the full app and navigating to the approval inbox, so that clearing routine approvals takes seconds, not minutes.
**Acceptance criteria:** Given a leave request requires only a simple approve/reject decision (no complex context needed), when the manager receives the push notification, then they can act directly from the notification action (where the mobile platform supports it) without a full app-navigation detour.

## 9. Functional requirements

Native or high-quality responsive-web mobile app (per Assumption A2/OQ-2 — this PRD does not resolve the native-vs-responsive-web decision, it specifies requirements independent of that implementation choice) covering: check-in/out with offline tolerance (§7.1), geo/selfie capture (Module 4), leave application/status/approval, attendance regularisation request/approval, reimbursement submission with camera receipt capture (Module 7), payslip view/download (Module 6, view-only), approval inbox (Module 16 §7.1, mobile-first design), employee directory, announcements (Module 11), document access (Module 13), helpdesk ticket raise/track (Module 12), goal check-ins and lightweight review actions (Module 9), learning-assignment status (Module 10), survey response (Module 11), push notifications (Module 18) with actionable notification support where the platform allows it (§8 US-2), biometric device-level authentication for app access (fingerprint/face unlock, a device-security convenience layer, distinct from and complementary to Module 21's backend permission enforcement).

## 10. Business rules

High-blast-radius actions (payroll processing/lock, separation processing, bulk data operations, permission/role configuration) are **deliberately not optimised for mobile** — this is a considered design boundary, not a gap, consistent with the deliberate-friction principle established across Modules 6, 15, and 21. Mobile scope should expand deliberately over time based on validated usage patterns, not by default chasing full parity.

## 11. Validation rules

Same validation rules as the underlying modules (this module doesn't introduce new business validation, only a different interaction surface) — with the addition that camera-based inputs (receipt capture, selfie attendance) need client-side quality checks (blur/lighting detection) before submission, to reduce OCR/verification failure rates downstream (Module 7 §27's OCR-accuracy risk).

## 12. Permission requirements

Identical to the underlying modules' permission model (Module 21) — mobile is a rendering surface, not a separate permission domain, consistent with Module 16 §12's principle applied here too.

## 13. Approval workflows

Surfaces Module 17's approval workflows via Module 16's aggregated inbox, mobile-optimised per §9.

## 14. Statuses and state transitions

N/A at this module's own level — reflects underlying modules' states; the one mobile-specific state worth naming is the offline-sync state introduced in §7.1 (Captured Locally → Pending Sync → Synced).

## 15. Record detail-page requirements

Mobile detail views should be deliberately simplified relative to their desktop counterparts — not a cramped miniaturisation of the full desktop record, but a purpose-built, mobile-appropriate subset (e.g., a mobile leave-request detail shows what's needed to decide, not every field the desktop version shows).

## 16. Search, filter and sorting requirements

Directory search should work well on mobile with minimal typing (voice input, recent-contacts shortcuts) given mobile's input-friction constraints relative to desktop.

## 17. Bulk-action requirements

Deliberately minimal on mobile — per [00-existing-system-audit.md](../00-existing-system-audit.md) §6/§10's finding that Atlaskit's table/bulk-select primitives aren't mobile-optimised, and consistent with this module's own principle of not chasing full parity for lower-frequency, more complex actions.

## 18. Import and export requirements

Not applicable to mobile scope.

## 19. Notification requirements

This module is the primary *delivery surface* for Module 18's push notifications — see that module for the full notification-requirements specification.

## 20. Mobile requirements

This entire module *is* the mobile-requirements specification — see §9.

## 21. Reporting requirements

Mobile-adoption rate (login frequency, feature-usage breadth on mobile specifically) feeds [14-success-metrics.md](../14-success-metrics.md); this is also a key signal for deciding which additional actions eventually warrant mobile investment beyond the initial scoped set (§10).

## 22. Audit-log requirements

Identical to underlying modules — this module's own specific addition is the offline-capture-vs-sync-timestamp distinction (§7.1) for attendance-relevant records.

## 23. Integration requirements

Push-notification-provider integration (Module 18/23); device biometric-authentication APIs (platform-native, not a third-party integration in the Module 23 sense).

## 24. Error, empty, and edge cases

**Error states:** offline-capture sync failure past a reasonable window (§7.1's failure-handling — recoverable via regularisation, not silently lost). **Empty states:** a new employee's first app launch before any data exists — should be a welcoming onboarding-adjacent experience (linking to Module 3's mobile preboarding needs), not a confusing blank app. **Edge cases:** a device permission (location, camera) denied by the user — should degrade gracefully with a clear explanation of what functionality requires it and why, not a cryptic failure; a user with multiple roles (e.g., both Employee and Manager, per Module 16 §24) needing a low-friction way to access both contexts on a small screen.

## 25. Acceptance criteria

Given India's variable mobile-network conditions outside major metros (an explicit, named design constraint per §2), when the app's core high-frequency actions (check-in/out, leave apply, approval) are used under degraded connectivity, then they succeed or gracefully degrade (offline-capture-and-sync per §7.1) rather than simply failing.

## 26. Dependencies

Module 16 (primary content source), Module 18 (notification delivery), and every module whose actions are surfaced on mobile (4, 5, 6 view-only, 7, 9, 10, 11, 12, 13).

## 27. Risks

The native-vs-responsive-web decision (OQ-2, carried from [00-existing-system-audit.md](../00-existing-system-audit.md)) materially affects this module's implementation cost, offline-capability feasibility (§7.1 is significantly easier to build well natively than via responsive web), and timeline — this is a blocking architectural decision this PRD flags but does not resolve.

## 28. Open questions

- OQ-2 (carried, blocking): native app vs. responsive web as the mobile delivery model. Directly affects feasibility/cost of §7.1's offline-tolerance requirement, which is significantly more mature/reliable as a native-app capability than as a web-app one.
- Should actionable push notifications (§8 US-2) be an MVP commitment, or deferred given platform-specific implementation complexity (iOS/Android notification-action APIs differ)? Recommend later-phase if OQ-2 resolves toward native (more feasible then), flagged as MVP-vs-later given the resolution's dependency on that decision.

## 29. Release scope

**MVP:** check-in/out (with offline tolerance if OQ-2 resolves toward native, else best-effort on responsive web), leave apply/status, approval inbox (leave/attendance/reimbursement), payslip view, reimbursement submission with camera capture, directory, announcements, push notifications (non-actionable), helpdesk raise/track.
**Later phase:** actionable push notifications, full offline-tolerance depth, goals/review mobile actions, learning/survey mobile depth.
**Out of scope:** full feature parity with web (a deliberate, stated non-goal per Product Principle 10), and every high-blast-radius administrative action named in §10.
