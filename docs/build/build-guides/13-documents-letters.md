# Build Guide — Module 13: Documents and Letters

**Full spec:** [modules/13-documents-letters.md](../../hrms-prd/modules/13-documents-letters.md)
**Phase:** HR Operations. Other modules (Onboarding, Payroll, Separation) call into this one — build it before those need it, or stub it early and fill in.
**Status:** First slice built — raw document storage + preview only (item 1 below, "Document Repository"). Everything else on this page (template management, template-driven generation, versioning, e-signature) is **not built** and depends on Module 17 (Workflow Engine, for approval routing) and Module 23 (e-signature), neither of which exist yet. Don't assume the rest of this guide reflects working code.

**What actually exists:** `supabase/migrations/20260724040000_documents_storage.sql` (private Storage bucket + tenant-scoped RLS on `storage.objects`, a `documents` metadata table) and [`apps/web/src/modules/core-hr/DocumentsTab.tsx`](../../../apps/web/src/modules/core-hr/DocumentsTab.tsx) (upload with a category, list, "View" via a short-lived signed URL opened in a new tab — real preview for anything the browser renders natively, no embedded viewer). No REST API — direct `supabase-js` calls, RLS-authorized, same pattern as every other single-table CRUD screen in this project (see Module 1's build guide for the fuller explanation of that split).

---

## What this module is, in one paragraph

Two things: (1) a document repository — every file for every employee, in one place; (2) template-driven letter generation — offer letters, promotion letters, experience letters — filled in automatically from real employee data instead of someone retyping a Word template every time.

## The core idea: generated letters are frozen snapshots

Once a letter is generated, it never changes, even if the underlying employee data changes later or the template gets revised. If you edit the "Promotion Letter" template next month, every letter already generated from the old version stays exactly as it was. This matters because these are quasi-legal documents — a generated letter has to be provably what it said on the day it was issued.

## Screens to build

1. **Document Repository** (part of Module 1's Employee Detail page — a tab, not a separate destination) — categorised list of every document for that employee, with signature/acknowledgement status.
2. **Template Management** (HR admin) — create/edit letter templates with placeholder variables (`{{employee.name}}`, `{{employment.designation}}`, etc.), a version history, and an approval step before a new version goes live.
3. **Template Preview** — critically important: let an admin preview a template with sample data *before* approving it live, so a typo or a broken variable isn't discovered only after it's generated for a real employee.
4. **Generate Letter** action — usually triggered *from* another module (e.g., a "Generate Promotion Letter" button that appears right after a promotion is approved in Module 1), not a standalone form someone fills out manually every time.

## Key user flow: triggered generation

1. Another module (say, Module 1, after a promotion is approved) calls this module's "generate" API with the employee ID, letter type, and any event-specific context (new designation, effective date).
2. This module finds the current *approved* template version for that letter type (never a draft/unapproved one — this has to be impossible to get wrong, not just unlikely).
3. Fills in every placeholder from the employee's actual current data.
4. If any required placeholder can't be filled (missing data), **stop and show a specific error** — never generate a letter with a blank space where a name or date should be.
5. If the letter type requires e-signature, send it out for that (integration, later); otherwise it's immediately available in the employee's document tab.

## Data model

`document_templates` (with a version history — old versions never deleted, just marked superseded), `generated_documents` (the actual output — snapshot of the rendered content, plus which template version and which triggering event produced it).

## API endpoints

```
GET/POST/PATCH  /api/v1/document-templates
POST            /api/v1/document-templates/:id/preview   — render with sample data, nothing saved
POST            /api/v1/document-templates/:id/approve
POST            /api/v1/documents/generate                — { employeeId, letterType, context }
GET             /api/v1/employees/:id/documents
POST            /api/v1/documents/:id/upload               — for non-generated uploads
```

## Components

Template editor: a simple rich-text or structured-field editor (this doesn't need to be a fancy WYSIWYG for v1 — a clean form with named placeholder fields is enough). Document list: `@atlaskit/dynamic-table`. File preview: check `@atlaskit/image` or a simple PDF viewer embed.

## What "done" looks like

- Generate a promotion letter right after approving a promotion in Module 1 — confirm the designation and effective date on the letter exactly match what was just approved, with zero manual retyping.
- Edit a template and approve a new version — confirm every letter generated *before* that change still displays exactly as originally generated.
- Try to generate a letter for an employee missing a required field — confirm it blocks with a specific error, not a letter with a blank.
