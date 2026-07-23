# 01 — Market Research

**Status:** Draft v1 (pending stakeholder review)
**Last updated:** 2026-07-23
**Method:** Researched via 4 parallel research passes against official product/help/pricing pages first, third-party review aggregators (G2, Capterra, TrustRadius, Trustpilot, BBB) only for complaint-pattern and rating evidence. Every claim below is sourced; anything not independently verifiable is explicitly marked **UNVERIFIED** or **NOT FOUND** rather than assumed. Full citation list: [research-source-register.md](research-source-register.md).

**Reliability key used throughout:** 🟢 Confirmed on an official, directly-fetched page · 🟡 Confirmed via search-index snippet of an official page (not directly fetched — some sites blocked automated fetch) · 🟠 Third-party (review aggregator / analyst / press) source, cross-referenced where possible · 🔴 Single-source, unverified marketing claim, flagged as such.

---

## How to read this document

Eight products, grouped as researched: **Zoho People + Zoho Payroll** (India, ecosystem play), **greytHR + RazorpayX Payroll** (India-native, payroll-compliance-first), **Keka + Darwinbox** (India-origin, mid-market→enterprise, ATS+PMS depth), **BambooHR + Rippling** (US-origin, UX benchmark, weak/absent India-native payroll). This grouping itself is a finding: **the market splits along a India-compliance-depth vs. UX-and-platform-breadth axis**, and no single researched competitor is confirmed to be strong on both simultaneously — see §9 Synthesis.

---

## 1. Zoho People + Zoho Payroll 🟢

**Target segment:** SMB → mid-market, horizontal (no strong vertical focus); free tier for ≤5 users; enterprise via "quote us" rather than self-serve.

**Architecture note (important, confirmed):** Zoho People and Zoho Payroll are **separate products with one-way sync only** (People → Payroll; changes in Payroll do not flow back). When Payroll is integrated, Zoho People's own attendance/leave module and Payroll's attendance/leave module **cannot both be active** — the customer must pick one source of truth. Recruitment is likewise a separate product (Zoho Recruit), not native to People.

**Payroll/compliance (Zoho Payroll, India):** PF (incl. EPS), ESI, State-variant Professional Tax, LWF (explicitly confirmed supported), TDS, gratuity (Payment of Gratuity Act formula), Form 16 (with a noted transition to a renamed "Form 130" from FY2026–27 per Zoho's own blog). **No administrator mobile app — mobile access is employee-only**, confirmed on Zoho's own FAQ page.

**Pricing (official, India):** Zoho Payroll — Free (≤10 employees) / Standard ₹1,250/mo (25 incl., +₹50/head) / Professional ₹3,750/mo (50 incl., +₹75/head) / Premium ₹5,000/mo (50 incl., +₹100/head); statutory compliance available even on the Free tier; custom approval workflows and webhooks gated to Professional+. Zoho People pricing tiers (Free/Essential/Professional/Premium/Enterprise) confirmed by structure; exact rupee figures did not render from the official JS pricing widget — 🟠 third-party aggregator figures only for People's numbers.

**Strengths:** broad feature depth per price, deep native Zoho-ecosystem integration, Capterra 4.4/5 (348 reviews) for People.

**Weaknesses (review-sourced, recurring):** slow/templated customer support (both products, and confirmed on Zoho's own community forum thread); steep setup/configuration learning curve, often requiring Deluge scripting for advanced automation; mobile app functionality lags web; Payroll specifically shows lower confidence (Capterra 3.7/5, only 10 reviews — small sample) with complaints about rigid policy configuration and pay-schedule inflexibility.

**Differentiation opportunities identified:** bidirectional (not one-way) HR↔Payroll sync; unified attendance/leave source-of-truth instead of an either/or split; native admin mobile app; faster support SLAs; transparent state-by-state PT/LWF compliance documentation (a trust gap even in Zoho's own docs).

---

## 2. greytHR + RazorpayX Payroll 🟢

**Target segment:** greytHR spans micro→large enterprise across 21+ industries, 30,000+ businesses, 25+ countries (India-core, expanding to Middle East/SEA — Indonesia/Singapore compliance added Nov 2025). RazorpayX Payroll is narrower: startups/SMEs (self-serve, "1-Hour Onboarding") plus a separate Enterprise track, 10,000+ companies — more payroll-and-compliance-focused than a full HRMS.

**Payroll/compliance — greytHR:** PF, ESI, state-slab Professional Tax, TDS, LWF (state-slab-aware, e.g., Haryana), digitally-signed Form 16 — but **most of this is gated above the free Starter tier** (Starter has only "limited" ESI/PT and no TDS/Form 16). Gratuity mechanics are referenced by third parties but **not confirmed in an official help article** — flagged as a documentation gap, not necessarily a product gap. Claims of automated end-to-end government-portal filing (vs. just challan/return-file generation) are **UNVERIFIED** — likely partial.

**Payroll/compliance — RazorpayX:** the most materially candid official documentation of the eight researched — its own statutory-compliance page explicitly states **initial PF/ESI/PT company registration is out of scope** (requires external CA), and **LWF is configurable but payment/filing is explicitly NOT automated** (a direct admission, not inferred). **Gratuity is not documented at all** — likely unsupported. PF/ESI/PT/TDS payment + filing automation is confirmed for what's in scope. A widely-repeated third-party "only fully automated payroll compliance tool on the market" claim should be treated as marketing hyperbole once cross-checked against the vendor's own more limited official scope statement.

**Pricing:** greytHR — Essential ₹2,495/mo (50 incl.) + ₹45/head; Growth ₹4,495/mo (50 incl.) + ₹85/head; Premium custom. Heavy **add-on gating**: PMS, Expense Management, Recruit, biometric/geofence/face-recognition attendance, and REST API/SSO are all separately priced (e.g., GPS Live Tracking ₹140/employee/month) — the "all-in-one suite" positioning fragments once priced out. RazorpayX pricing is **not reliably publicly disclosed** — tiers are named by headcount band (Prime/Elite/Enterprise) with conflicting third-party rupee figures.

**Strengths:** greytHR — G2 4.4–4.5/5, 1,200+ reviews, ranked 9th-best Indian software product overall by G2 (only HRMS in that top 10); deep, mature statutory-compliance reputation. RazorpayX — native RazorpayX business-banking rails mean direct, fast salary disbursal without a separate bank-integration step; WhatsApp-based reimbursement filing is a distinctive UX touch.

**Weaknesses (review-sourced, recurring):** greytHR — support agents reported as not understanding payroll rules specifically; performance/slowness under load requiring frequent manual refresh; UI called "old-fashioned"/"confusing"; recurring payroll-calculation-formula errors requiring escalation. RazorpayX — explicit reviewer quote: "workflows are inefficient and complicated, with most yet to be fully built," described as early-stage for HR-workflow depth; slow/hard-to-reach support; no recruitment or performance-management module at all (confirmed gap, corroborated by an independent third-party gap analysis, not just absence of evidence).

**Differentiation opportunities identified:** full-scope statutory automation including LWF filing and gratuity (both are explicit, officially-documented RazorpayX gaps); built-in initial statutory-registration assistance (removing the CA dependency); base-tier (not add-on-gated) attendance/biometric/geofencing; native recruitment + performance modules to avoid RazorpayX's confirmed absence and greytHR's paid-add-on fragmentation; modernized UI.

---

## 3. Keka + Darwinbox 🟡

**Target segment:** Keka — SMB/mid-market core (20–500 employees per third-party estimate), ~50% India / ~36% US installed base, secondary US-SMB storefront (keka.com/us). Darwinbox — explicitly enterprise: "850+ global enterprises, 2.2M+ employees" per its own landing page (a second Darwinbox-associated source says "1,000+ enterprises across 130+ countries" — the two figures are inconsistent even within Darwinbox's own materials, reported as-is rather than reconciled). Named enterprise customers: Myntra, Swiggy, Delhivery, Paytm, Adani group companies.

**Research caveat:** Keka's own site (keka.com) returned TLS/certificate errors on direct fetch throughout this research pass; Keka findings rely on search-indexed excerpts of official pages plus third-party aggregators, with **pricing specifically not independently confirmed against an official source**. Darwinbox pages were fetched directly in most cases (🟢), with a smaller UNVERIFIED set noted inline below.

**Payroll/compliance — Keka:** PF, ESI, state-specific PT, TDS (old/new regime switching with real-time impact preview, Form 24Q), LWF, gratuity, Form 16/12BA/12BB — vendor-asserted "audit-ready" compliance with time-stamped change logs. One compliance subpage refers to Form 16 as now "Form 130" — an unconfirmed naming anomaly worth a direct check. No evidence of non-India statutory-payroll depth.

**Payroll/compliance — Darwinbox:** same India statutory set as Keka, **plus confirmed multi-country statutory payroll**: full GCC six-country coverage (UAE, Saudi Arabia, Oman, Qatar, Bahrain, Kuwait) and a live SEA rollout (Indonesia BPJS, Philippines, Thailand, Singapore CPF), corroborated by independent trade press (Human Resources Online, Inquirer.net), not just vendor marketing. **This is the single clearest, most independently-corroborated differentiator found across all eight competitors researched**, and directly relevant given this PRD's "future global expansion" mandate.

**Recruitment/ATS:** both have materially deeper ATS than the People-focused competitors. Keka Hire has a documented Event→Condition→Action workflow-automation model at both job- and org-level. Darwinbox's ATS adds explicit multi-country/multi-language hiring-localization. A Darwinbox "Gartner Magic Quadrant for Talent Acquisition — Leader" claim surfaced only via a secondary aggregator, **not independently verified against a Gartner source** — treat with caution.

**Performance management:** both are strong here — Keka: OKRs, 360°, continuous feedback ("Keka Perform"), PIP workflow, calibration-adjacent AI claims (mechanics undetailed). Darwinbox: Goal Setting, Continuous Feedback, 360°, OKRs, Competency Management, Calibration — a comparably full suite, integrated with its analytics layer ("Atlas").

**Pricing:** Keka — 🟠 third-party-only figures (Foundation ~₹9,999/mo, Strength ~₹12,999/mo, Growth ~₹15,999/mo, priced per 100 employees + per-head overage; not officially confirmed this pass). Darwinbox — **not publicly disclosed at all**, pure enterprise-sales/quote model; third-party estimates suggest ~$3–5/employee/month at scale, ACV commonly cited around $120K (up to ~$200K) — all 🟠 unverified estimates.

**Strengths:** Keka — G2 ~4.5/5 (800+ reviews, 🟠 secondary-sourced), praised for clean UI and integrated payroll+attendance+leave dashboard. Darwinbox — G2 4.4/5 (184 reviews, 🟠), praised for single-platform breadth (recruitment→payroll) and face-recognition attendance; strong perceived India-statutory-compliance depth.

**Weaknesses (review-sourced, recurring, both products independently):** **customer support is the single most consistently named weakness across both** — Keka: "poor," slow, staff "not understanding issues"; Darwinbox: "very poor," with TrustRadius specifically noting support degrades "during high onboarding periods" (i.e., scales worst exactly when the vendor itself is busiest). Both: workflow/process **rigidity** — Keka reviewers say "much of the functionality is hard-wired," you adapt to Keka rather than the reverse; Darwinbox reviewers describe automation as still requiring "manual follow-ups" despite AI-forward marketing. Both: bugs/performance issues, especially at peak (Keka: payroll-run slowness, biometric sync unreliability; Darwinbox: slow module loading/navigation lag). Darwinbox-specific: payslip UX called a "major setback" by some users; no draft-save in performance reviews; report-builder ("Atlas") described as "powerful but not intuitive."

**Differentiation opportunities identified:** support responsiveness that doesn't degrade at the vendor's own peak (a named, specific weakness for both); a general-purpose (not just recruitment-scoped) low-code workflow engine matching Keka Hire's Event/Condition/Action depth; native document/file management (a named Keka gap); more intuitive self-serve reporting (a named Darwinbox gap); if targeting global expansion, **multi-country statutory payroll depth should be treated as a hard requirement to be enterprise-competitive** — it's Darwinbox's clearest moat.

---

## 4. BambooHR + Rippling 🟢🟡

**Target segment:** BambooHR — SMB→lower-mid-market (20–500 employees typically; third-party consensus is companies commonly outgrow it around 150–200 employees), US-centric, 30,000+ companies. Rippling — SMB→mid-market with growing enterprise reach (third-party: 56% of customers <50 employees, but ACV $20K–$100K implies a mid-market/enterprise-weighted sales motion), US-headquartered with a confirmed native India entity for payroll.

**Critical, confirmed finding: neither has native India/multi-country payroll as a core product.** BambooHR's global-payroll story is entirely a third-party EOR partnership (Remote.com, 90+ countries for EOR / 200+ for contractor payments) — **whether India is included is unconfirmed** in BambooHR's own materials. Rippling is the stronger of the two here: it states it **owns its own legal entities in India and runs payroll on native software** (not a pass-through), covering EPF/ESI, plus EOR in 80+ countries and contractor payments in 185+ countries — but this was confirmed only via search-indexed snippets (rippling.com blocks direct automated fetch), so treat as 🟡 rather than 🟢, and independently verify before quoting in customer-facing material.

**Architecture — Rippling's "Employee Graph" (the most architecturally distinctive idea found across all eight competitors):** a single employee-data graph that HR, IT (device/app provisioning-deprovisioning, identity/SSO), and Finance (corporate cards, expense, bill pay) modules all read/write against, so a single HR event (e.g., a hire or a termination) cascades automatically into IT access and Finance systems. This is the clearest "benchmark, don't copy" architectural pattern in the research set — worth studying for Module 17 (Workflow Engine) and Module 23 (Integrations) design, independent of whether this HRMS ever adds IT/Finance modules itself.

**Compliance — BambooHR:** I-9/E-Verify (via Mitratech), ACA 1094/1095 filing (via Lumelight), multi-state employment-law monitoring (via VirgilHR) — all US-specific, confirmed on BambooHR's own compliance page. No EEO-1, OSHA, or international compliance confirmed. **Compliance — Rippling:** ACA automation, remote I-9 verification confirmed; E-Verify and EEO-1 as discrete features could **not** be confirmed (NOT FOUND) despite being referenced in adjacent guidance content.

**Pricing:** BambooHR — the only one of the eight competitors with **fully transparent, officially published per-tier pricing**: Core $10/employee/mo, Pro $17/employee/mo, Elite $25/employee/mo (flat $250/mo ≤25 employees), with Payroll/Benefits/Time&Attendance/Global-Employment all separately priced add-ons. Rippling — **pricing opacity is itself the top-cited complaint** (see below); base HRIS is widely reported (not officially confirmed, page blocks direct fetch) at ~$8/employee/month + $35/month base fee, with module and global pricing entirely quote-based.

**Strengths:** both are the clear **UX benchmark** of the eight — BambooHR G2 4.4/5 (5,641 reviews), Rippling G2 **4.8/5 (14,195 reviews)**, the highest rating and by far the largest review volume of any product researched. Rippling's cross-domain (HR+IT+Finance) automation and 650+ integration catalog, with permission scope extending into third-party app access, is its standout differentiator. BambooHR's onboarding/implementation simplicity and no-code report/workflow builder are consistently praised.

**Weaknesses (review-sourced, recurring):** BambooHR — support inconsistency (135 negative mentions vs. 466+708 positive on G2 — genuinely mixed, not uniformly bad); reporting described as basic at scale, a named reason companies outgrow it; ATS lacks resume parsing; a specific, concrete complaint that BambooHR's notification emails come from an external domain and have been mistaken for phishing (one reported real incident). Rippling — **pricing opacity / hidden fees is the single most consistent complaint across Capterra, Trustpilot, and BBB**, including reports of undisclosed 5–15%-of-ACV implementation fees and continued billing during termination (per a BBB complaint); support is admin-only in some configurations (employees can't self-serve support) and US-business-hours-oriented, a friction point for distributed/global teams; despite UI praise, a genuinely steep learning curve from feature breadth is separately, consistently reported — "clean UI" and "steep learning curve" are not contradictory findings, they're two different axes (visual polish vs. cognitive load of a very large surface area).

**Differentiation opportunities identified:** native India/multi-country payroll depth as a first-class module (both are weak-to-absent here — the clearest opening in the entire research set for an India-first HRMS); enterprise-grade reporting/BI to avoid BambooHR's "outgrow it at 150-200 employees" ceiling; fully transparent published pricing (match BambooHR's bar, avoid Rippling's biggest complaint); India/global-hours support; a universally-accessible (not admin-gated) employee self-service knowledge base.

---

## 5. Cross-cutting theme: the support-quality gap

Every one of the eight products researched, independent of geography, price point, or target segment, has **customer-support responsiveness/quality as a named, recurring complaint** in review data — Zoho, greytHR, RazorpayX, Keka, Darwinbox, and even the two UX-benchmark leaders BambooHR and Rippling. This is the single most consistent, most independently-corroborated finding across the entire research set (corroborated across G2, Capterra, TrustRadius, Trustpilot, and BBB, for products with otherwise very different profiles). **This is the strongest, best-evidenced differentiation opportunity in this whole document** and should be reflected as an explicit product principle in Phase 3 (Product Vision), not just a features list item.

## 6. Cross-cutting theme: statutory-compliance depth is uneven even among India-native products

Even among the four India-origin products, statutory-compliance completeness varies more than marketing suggests once checked against primary documentation: RazorpayX explicitly excludes LWF filing and appears to have no gratuity support; greytHR's exact tier boundary for compliance features (what's in Starter vs. Essential) is internally inconsistent across the vendor's own pages; Keka's compliance depth is vendor-asserted without independent audit; only Darwinbox shows independently-corroborated (trade-press-confirmed) multi-country statutory depth. **No competitor researched has fully transparent, complete, independently-verifiable India statutory-compliance documentation** (state-by-state PT/LWF, gratuity mechanics, labour-code readiness) — this is both a genuine implementation risk to plan for carefully (Module 6, and needs qualified payroll/legal review per the brief's own instruction) and a credible trust/documentation differentiator if done well.

## 7. Cross-cutting theme: mobile/web feature parity is a near-universal gap

Zoho, greytHR, Keka, Darwinbox, and Rippling all have **specifically documented mobile-vs-web feature-parity gaps** in review data (BambooHR's mobile app is comparatively less criticized). RazorpayX's mobile app is explicitly payroll/banking-oriented, not payroll-processing-capable (admins cannot run payroll from Rippling's mobile app either). This directly supports Module 24's prioritization of a small, deliberately-scoped set of high-frequency mobile actions (check-in/out, leave, approvals, payslips) rather than attempting full feature parity with web.

## 8. Cross-cutting theme: one-way or absent HR↔Payroll integration is a recurring architectural weakness

Zoho People→Payroll sync is explicitly one-way. RazorpayX and greytHR, being payroll-first products, show the inverse risk (payroll strength, HR-suite thinness — confirmed absence of recruitment/performance in RazorpayX). No competitor researched was confirmed to have genuinely bidirectional, real-time HR↔Payroll↔Attendance data flow as a unified data model — this is close to Rippling's Employee Graph concept but Rippling doesn't extend that graph to India-specific statutory payroll with confirmed depth. **This is a structural opportunity**: an India-first HRMS built on one unified, effective-dated data model (see [05-organisation-data-model.md](05-organisation-data-model.md)) spanning HR, attendance, leave, and payroll natively — not as loosely-coupled, one-way-synced products — is not clearly matched by any of the eight competitors researched.

## 9. Synthesis: where the gap is

| Axis | Strong | Weak/Absent |
|---|---|---|
| India statutory-compliance depth | greytHR, Keka, Darwinbox, Zoho Payroll (all with caveats — see §6) | BambooHR (EOR-only, India unconfirmed), Rippling (native but only 🟡-confirmed) |
| Multi-country/global-expansion readiness | Darwinbox (confirmed), Rippling (claimed, 🟡) | Zoho, greytHR (early), RazorpayX, Keka, BambooHR (EOR pass-through only) |
| UX/design quality (review-evidenced) | BambooHR, Rippling | greytHR ("old-fashioned"), Darwinbox ("basic," "not dynamic") |
| Unified HR+Payroll+Attendance data model (not one-way sync) | None confirmed | Zoho (explicit one-way), most others unconfirmed either way |
| Native recruitment + performance (not paid add-on/absent) | Keka, Darwinbox, Zoho (via separate product), greytHR (via add-on) | RazorpayX (both confirmed absent) |
| Transparent published pricing | BambooHR, RazorpayX Payroll (partial), Zoho Payroll (partial) | Rippling (opacity is the top complaint), Darwinbox, Keka (unconfirmed) |
| Support-quality reputation | *(none — see §5, this is a gap for every competitor researched)* | All eight |

**The clearest unclaimed position for a new India-first HRMS**, based on this research: **deep, transparent, independently-verifiable India statutory-compliance** + **a genuinely unified (not one-way-synced) HR/attendance/leave/payroll data model** + **modern UX on par with BambooHR/Rippling** + **support quality treated as a product commitment, not an afterthought**, with **multi-country readiness architected in from day one** (per this PRD's own mandate) even though India is the initial market. No competitor researched occupies all of these simultaneously.

## Open questions

- OQ-13: Several pricing figures in this document (Keka, Rippling, RazorpayX, Zoho People) are third-party-sourced because official pages either blocked automated fetch or use JS-rendered widgets that didn't expose numeric values. Recommend a manual, human spot-check of live pricing pages (or direct sales contact) before any of these figures are used in customer-facing competitive-positioning material.
- OQ-14: Several star ratings (G2/Capterra) throughout this document were obtained via search-engine snippets rather than direct page fetches, because G2 in particular returned HTTP 403 to automated fetching in this research pass. Recommend direct verification before final publication.
- OQ-15: Gratuity-calculation support is unconfirmed or absent for at least two competitors (greytHR — undocumented mechanics; RazorpayX — not mentioned at all). Worth a direct competitive-intelligence check (e.g., a sales-demo request) rather than relying on public documentation alone, since gratuity is a statutory obligation this HRMS must get right regardless of what competitors do.
