# Module 11 — Employee Engagement

**Status:** Draft v1 (pending stakeholder review) · **Release:** Talent
**Depends on:** Module 1 (Core HR), Module 17 (Workflow Engine), Module 18 (Notifications)

---

## 1. Module overview

Announcements, surveys/pulse surveys/eNPS, recognition and rewards, birthdays/anniversaries, internal communities, and grievance/suggestion channels — the layer that makes the HRMS a place employees engage with proactively, not just visit when they need something.

## 2. Problem statement

None of the eight competitors researched showed strong, differentiated engagement depth beyond Darwinbox's internal social feed ("Vibe"); this is a lower-competitive-intensity module where the main risk is building engagement features nobody uses because they're bolted on rather than integrated into daily workflows (e.g., recognition tied to nothing, surveys with low response rates from being disconnected from context).

## 3. Business objective

Give leadership and HR genuine, actionable signal on organisational sentiment (via well-designed, high-response-rate pulse surveys) and give employees lightweight, frequent ways to recognise each other and stay informed — without becoming a distracting, badge-heavy, notification-noisy layer, directly consistent with the brief's own UX principle to avoid unnecessary badges/pop-ups.

## 4. User personas

Primary: **Employee** (everyone — consumption and participation). Secondary: **HR Executive/Administrator** (survey/announcement configuration, analytics), **People Manager** (team recognition, survey follow-up action), **Leadership/CXO** (engagement-trend visibility).

## 5. User needs

Employee needs recognition and announcements to feel relevant and low-friction, not another notification to dismiss. HR needs genuinely actionable survey data (with reasonable anonymity guarantees for honest responses) and a clear way to close the loop (acting on feedback, and being seen to act on it — a common reason engagement surveys lose credibility over time).

## 6. Primary use cases

Post/read announcements; run pulse surveys/eNPS; give/receive recognition; view birthdays/anniversaries; participate in employee communities; submit suggestions/grievances (anonymous option); view engagement analytics.

## 7. Detailed workflows

### 7.1 Pulse survey lifecycle

- **Trigger:** HR Administrator schedules a pulse survey (recurring or one-off).
- **Steps:** 1) Survey configured (questions, target population — org-wide or segmented, anonymity level) 2) Sent to targeted employees 3) Responses collected with configured anonymity guarantees genuinely enforced at the data layer (not just a UI label — if anonymity is promised, individual responses must not be traceable back to a respondent even by an HR Administrator with broad access, a real trust-and-technical requirement, not just a policy statement) 4) Results aggregated and shared with relevant scope (org-wide summary to Leadership, team-level to managers where response-count thresholds protect anonymity — e.g., don't show a team-level breakdown for a team of 3, since responses become individually identifiable) 5) Follow-up actions/close-the-loop communication tracked (optional but recommended workflow, addressing the "surveys feel pointless" credibility risk named in §3).
- **Audit events:** `SurveyLaunched`, `SurveyClosed` — individual response data is explicitly **not** part of the standard audit trail given the anonymity requirement, a deliberate exception to this PRD's general "everything is auditable" principle, flagged explicitly so it isn't silently violated by a generic audit-logging implementation.

## 8. User stories

**US-1**
As an **HR Administrator**, I want small-team survey results suppressed or aggregated up a level, so that anonymity is genuinely preserved rather than trivially defeatable by a small denominator.
**Acceptance criteria:** Given a team has fewer than a configured minimum respondent count, when team-level results are requested, then results are either withheld or rolled up to a larger group, never shown at a granularity that could identify an individual respondent.

**US-2**
As an **Employee**, I want to give a colleague quick, specific recognition without it requiring a multi-step process, so that recognition actually happens in the moment rather than being deferred and forgotten.
**Acceptance criteria:** Given an employee wants to recognise a colleague, when they initiate recognition, then it takes no more than a couple of steps (select person, select value/reason, optional note) — not a lengthy form.

## 9. Functional requirements

Announcements (targeted by org unit/location, with acknowledgement-tracking option, linking to Module 20's policy-acknowledgement pattern where relevant); surveys and pulse surveys with configurable anonymity and minimum-respondent-count suppression (§7.1); eNPS tracking over time; polls; recognition and rewards (peer-to-peer and manager-to-employee, optionally linked to a points/rewards-catalogue system — Enterprise phase); birthday/work-anniversary awareness (opt-in visibility, respecting privacy preferences); employee communities/social feed (optional module, tenant-configurable — not every customer wants this); suggestion box and grievance-submission channels with anonymous option and defined escalation routing; engagement analytics.

## 10. Business rules

Anonymous grievance submissions must have a defined, auditable-without-deanonymising escalation path (e.g., routed to a specific compliance/ethics role, not the employee's own manager by default, given the obvious conflict-of-interest risk if a grievance concerns that manager).

## 11. Validation rules

Survey minimum-respondent-count threshold is tenant-configurable but should have a sensible non-zero default (e.g., 5) rather than defaulting to "always show," which would undermine the entire anonymity promise by default.

## 12. Permission requirements

Individual survey responses are not visible to any role by design when anonymity is promised (§7.1) — this is a hard technical constraint, not a permission-configuration option, since an "anonymous but an admin can still see it" design would be a serious trust violation. Recognition/announcements follow standard visibility scoping (org-wide, department, etc.).

## 13. Approval workflows

Announcement publishing may require HR Administrator approval for org-wide reach (configurable); grievance escalation routing per Module 17.

## 14. Statuses and state transitions

**Survey:** Draft → Scheduled → Open → Closed → Results Published. **Grievance:** Submitted → Under Review → Resolved/Escalated → Closed.

## 15. Record detail-page requirements

Survey results page: aggregate results with trend-over-time comparison (for recurring pulse surveys), response-rate metric, drill-down respecting §7.1's suppression rule. Recognition feed: chronological, filterable by team/value/person.

## 16. Search, filter and sorting requirements

Announcement/recognition feed filterable by date/department; survey history browsable by cycle.

## 17. Bulk-action requirements

Bulk-target survey/announcement to a filtered employee segment (org unit, location, employment type).

## 18. Import and export requirements

Survey-results export for offline leadership presentation (aggregate only, respecting anonymity rules — never a raw individual-response export when anonymity was promised).

## 19. Notification requirements

**In-app/email:** new survey/announcement, recognition received (a genuinely positive, low-noise notification), survey results published. **Mobile push:** recognition received (high positive-engagement value), survey reminders (used sparingly, respecting Module 18's anti-notification-fatigue principle).

## 20. Mobile requirements

Recognition give/receive, announcement reading, survey response — all lightweight, well-suited to mobile as primary rather than secondary surface for this module specifically, given the "in the moment" value of recognition (§8 US-2).

## 21. Reporting requirements

eNPS trend, survey response-rate and results trend, recognition-frequency/distribution report (useful for spotting under-recognised teams, not just celebrating high performers), grievance-resolution-time report.

## 22. Audit-log requirements

Announcement/survey/recognition creation and publishing actions — **explicitly excluding individual anonymous-survey-response data**, per §7.1's deliberate exception.

## 23. Integration requirements

Module 18 (Notifications — primary delivery channel), Module 20 (policy-acknowledgement overlap for announcement-with-acknowledgement pattern), Module 12 (Helpdesk — grievance escalation may route there in some tenant configurations).

## 24. Error, empty, and edge cases

**Error states:** survey configured with an anonymity promise but a respondent-count threshold that would trivially deanonymise (e.g., targeting a team of 2) — should warn/block at configuration time, not just at results-viewing time. **Empty states:** no announcements/recognition yet for a new tenant. **Edge cases:** an employee who leaves mid-survey (response handling — should the partial/complete response still count? Tenant-configurable, flagged as an open question).

## 25. Acceptance criteria

Given a survey is configured with anonymity enabled, when any user (including an HR Administrator) attempts to view individual response-to-respondent mapping, then the system has no interface or query path that exposes it — this must be true structurally, not just by omission from the UI.

## 26. Dependencies

Module 1, Module 17, Module 18, Module 20.

## 27. Risks

Anonymity-enforcement is a genuine technical/trust risk if under-engineered — a survey tool that claims anonymity but can be defeated (small-team deanonymisation, admin database access) causes real harm if employees rely on the promise and it's false. This deserves explicit security/privacy design review (Phase 11), not just a checkbox feature.

## 28. Open questions

- Partial-survey-response handling for employees who leave mid-cycle (§24) — flagged, not decided.
- Should the internal social-feed/community feature (Darwinbox's "Vibe" pattern) be an MVP commitment or explicitly later-phase given its comparatively lower evidenced differentiation value? Recommend later-phase — flagged in §29.

## 29. Release scope

**MVP:** announcements, pulse surveys/eNPS with anonymity enforcement, recognition (simple peer-to-peer), birthday/anniversary awareness, suggestion/grievance channel with anonymous option.
**Later phase:** rewards-catalogue/points system, internal social feed/community, advanced engagement analytics (attrition-risk correlation, tying into Module 25's AI capabilities).
**Out of scope:** this module does not become a general-purpose internal social network (e.g., Slack/Teams-style messaging) — recognition and announcements are structured, purpose-built features, not a chat platform, consistent with [03-product-vision.md](../03-product-vision.md) Product Boundaries.
