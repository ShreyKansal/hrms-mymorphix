# Module 12 — Helpdesk and HR Service Delivery

**Status:** Draft v1 (pending stakeholder review) · **Release:** HR Operations
**Depends on:** Module 1 (Core HR), Module 17 (Workflow Engine), Module 20 (Policy — knowledge-base overlap)

---

## 1. Module overview

HR ticketing with categories, SLAs, assignment/escalation rules, a knowledge base, and the operational dashboard/analytics HR needs to run service delivery like a real support function — directly addressing the market research §5/§7 finding that HR-ticket volume is dominated by repetitive, self-service-able questions.

## 2. Problem statement

HR teams researched across competitors consistently absorb ticket volume that a well-designed knowledge base and self-service portal should deflect — payslip location, leave-policy questions, document requests. Without a real ticketing system (categories, SLAs, knowledge base with suggested articles), HR either drowns in repetitive email/chat requests or has no visibility into where their operational time actually goes.

## 3. Business objective

Deflect repetitive requests via a genuinely useful knowledge base with suggested articles at the point of ticket creation, give HR a real SLA-driven ticketing operation for what remains, and produce the operational visibility (ticket volume/category/resolution-time) that lets HR leadership actually manage service delivery as a function.

## 4. User personas

Primary: **Employee** (raise tickets), **HR Executive** (respond/resolve). Secondary: **HR Administrator** (SLA/category configuration, operations dashboard), **People Manager** (occasionally raises team-related HR requests).

## 5. User needs

Employee needs a fast way to get an HR question answered, ideally without raising a ticket at all if a knowledge-base article already answers it. HR Executive needs a manageable, prioritised queue (not an undifferentiated inbox) with clear SLA visibility. HR Administrator needs to see where ticket volume concentrates, to fix root causes (better self-service, clearer policy) rather than just processing symptoms forever.

## 6. Primary use cases

Raise a ticket (category-driven, with suggested knowledge-base articles surfaced before submission); respond to/resolve a ticket; escalate per SLA; browse/search the knowledge base; view HR operations dashboard; reopen a resolved ticket; rate ticket resolution satisfaction.

## 7. Detailed workflows

### 7.1 Ticket creation with self-service deflection

- **Trigger:** Employee has an HR question/request.
- **Steps:** 1) Employee selects a category (or types a free-text query) 2) System surfaces suggested knowledge-base articles matching the category/query **before** allowing ticket submission — the deflection point is the core value of this workflow, not an afterthought 3) If the suggested article resolves the need, employee marks it resolved without ever creating a ticket (tracked as a deflection event for §21 reporting) 4) If not, employee proceeds to submit a full ticket (category, description, attachments) 5) Ticket auto-assigned per configured assignment rules (category-based routing, round-robin, or manual triage) 6) SLA timer starts based on category/priority.
- **Decision points:** Priority (auto-suggested from category, overridable by HR) determines SLA target.
- **Failure handling:** SLA-approaching-breach triggers escalation per configured rules (§13); SLA-breached tickets are flagged distinctly for HR-operations visibility, not silently overdue.
- **Audit events:** `TicketCreated`, `TicketAssigned`, `TicketResolved`, `TicketReopened` — plus a distinct `KnowledgeBaseDeflection` event for the self-service-resolved case (§21's most important metric).

## 8. User stories

**US-1**
As an **Employee**, I want to see a relevant knowledge-base article before I'm forced to submit a ticket, so that I can get my answer immediately instead of waiting for HR to respond to something that's already documented.
**Acceptance criteria:** Given an employee selects a category with existing knowledge-base articles, when they proceed toward ticket creation, then at least the top-matching articles are shown and the employee can mark their query resolved without submitting a ticket.

**US-2**
As an **HR Administrator**, I want to see which ticket categories have the highest volume and the lowest self-service deflection rate, so that I know where to invest in better documentation or process fixes rather than just adding more HR headcount to process tickets.
**Acceptance criteria:** Given a category has high ticket volume and low knowledge-base-deflection rate, when the HR Administrator views the operations dashboard, then that category is surfaced as a specific improvement opportunity, not buried in an undifferentiated volume chart.

## 9. Functional requirements

HR ticketing with configurable categories/service catalogue; request forms per category (structured, not just free text, where the category benefits from it — e.g., a "document request" category asking which document); SLA policies by category/priority; priority levels; assignment rules (round-robin, category-based, manual); escalation rules; internal notes (HR-only, not employee-visible) vs. public responses; attachments; knowledge base with suggested-article deflection (§7.1); ticket status and reopening; employee satisfaction rating post-resolution; HR operations dashboard; ticket analytics; data-access restrictions (a ticket about a sensitive matter — e.g., a grievance-adjacent request — should have tighter visibility than a routine payslip question, configurable per category).

## 10. Business rules

Knowledge-base deflection must be a genuine, trackable step (§7.1) — the deflection UI cannot be a token gesture that everyone clicks past without reading, since the whole point is measuring and improving actual self-service effectiveness (§8 US-2 depends on this being real, not theatrical).

## 11. Validation rules

Category-specific structured forms enforce required fields per category configuration (e.g., a document request needs a document type selected).

## 12. Permission requirements

Employees see only their own tickets; HR Executives see tickets within their assigned category/scope; sensitive-category tickets (§9) get restricted visibility per Module 21 configuration, not the default HR-wide visibility.

## 13. Approval workflows

Not typically approval-gated itself (it's a request/response flow, not a decision-approval flow) — though a ticket's underlying request (e.g., a document that requires HR Administrator sign-off) may trigger a Module 17 workflow as a sub-step.

## 14. Statuses and state transitions

Open → Assigned → In Progress → Pending Employee Response → Resolved → Closed/Reopened. SLA timer pauses during "Pending Employee Response" (a fairness rule — HR shouldn't be penalised for an employee's slow reply) and resumes on employee response.

## 15. Record detail-page requirements

Ticket detail page: conversation thread (public responses), internal notes (separately visible, HR-only), attachments, SLA countdown/status, category/priority, linked knowledge-base article if deflection was attempted first, satisfaction rating post-resolution.

## 16. Search, filter and sorting requirements

HR queue filterable by category, priority, SLA-status (approaching/breached), assignee; knowledge-base search with typeahead.

## 17. Bulk-action requirements

Bulk reassignment (e.g., when an HR Executive is out); bulk close for a batch of resolved/stale tickets.

## 18. Import and export requirements

Ticket-volume/resolution-time export for HR-operations reporting.

## 19. Notification requirements

**In-app/email:** ticket status change, SLA-approaching-breach (to assignee), new response on employee's ticket. **Mobile push:** SLA-breach alerts to HR (time-sensitive), new-response alerts to employees.

## 20. Mobile requirements

Employee: raise/track tickets, view knowledge base. HR Executive: respond to tickets, moderate priority (useful but not the highest-frequency mobile surface in the product).

## 21. Reporting requirements

Ticket volume by category, resolution-time (average and SLA-compliance rate), knowledge-base deflection rate by category (the core operational-efficiency metric per §8 US-2), employee-satisfaction trend, HR-operations workload distribution.

## 22. Audit-log requirements

Every status change, assignment, escalation — per Phase 11. Internal notes are logged but never exposed to the employee, a permission boundary worth explicit test coverage.

## 23. Integration requirements

Module 20 (knowledge-base content overlap with policy repository), Module 18 (notification delivery), potentially Module 11 (grievance-channel routing, per that module's §9).

## 24. Error, empty, and edge cases

**Error states:** ticket submitted with no category match to any knowledge base article and no assignment rule configured (should default to a general-queue fallback, never silently unassigned). **Empty states:** new tenant with an empty knowledge base — deflection has nothing to suggest yet, a real cold-start problem worth flagging for onboarding-content strategy (out of this PRD's scope, but worth noting for the eventual customer-onboarding playbook). **Edge cases:** a ticket raised by an employee who is separated before resolution (should remain accessible to HR for closure, not orphaned when the employee's access is revoked).

## 25. Acceptance criteria

Given an employee views a suggested knowledge-base article and marks their query resolved, when HR views the operations dashboard, then that interaction is counted as a deflection distinct from a resolved ticket, so the two metrics (deflection rate vs. ticket-resolution rate) remain analytically separable.

## 26. Dependencies

Module 1, Module 17, Module 18, Module 20.

## 27. Risks

If the knowledge base isn't genuinely well-maintained, the deflection promise (this module's core differentiator per market research §5/§7) fails silently — this is as much a content-operations risk for the customer as a software risk, worth flagging in customer-onboarding guidance (out of this PRD's scope but worth carrying forward as institutional knowledge).

## 28. Open questions

None significant beyond what's already flagged inline.

## 29. Release scope

**MVP:** ticketing with categories/SLA/assignment, knowledge base with deflection flow, HR operations dashboard, satisfaction rating.
**Later phase:** AI-assisted knowledge-base article suggestions and ticket-response drafting (Module 25), advanced SLA-escalation chains.
**Out of scope:** this module is not a general-purpose IT helpdesk (that's IT Administrator's own tooling, outside this product's scope per [03-product-vision.md](../03-product-vision.md) Product Boundaries) — it's specifically HR-service-delivery-focused.
