# Build Guide — Module 9: Performance Management

**Full spec:** [modules/09-performance-management.md](../../hrms-prd/modules/09-performance-management.md)
**Phase:** Talent.

---

## What this module is, in one paragraph

Goals that stay alive between formal reviews, plus periodic review cycles (self-review, manager review, sometimes peer/360) that produce a rating and, sometimes, a promotion recommendation. The one specific bug to design against from day one: **never lose a manager's half-written review to a browser crash.**

## Screens to build

1. **Goals** — set individual goals (optionally cascaded from a team/company goal), update progress anytime, not just during a formal cycle.
2. **Review Cycle setup** (HR admin) — cadence, which components (self/manager/peer/360), rating scale.
3. **My Review** (employee self-review) and **Team Reviews** (manager) — **autosave every field as the user types**, don't rely on an explicit save button as the only persistence point. This is the single most important engineering detail in this module.
4. **Manager's Review Queue** — if a manager has 15 direct reports, don't dump 15 undifferentiated review forms on them. Sort by due date, show completion progress, let them work through it in batches.
5. **Calibration view** (HR admin/Dept Head) — compare rating distributions across managers before ratings are finalized, so a manager who rates everyone a 5 or everyone a 2 is visible before it becomes the final record.
6. **Performance History** — part of Module 1's Employee Detail page, not a separate destination.

## Key user flow: a review cycle

1. HR opens a cycle → system creates review tasks for everyone in scope.
2. Employee does self-review (autosaving), manager does their review (autosaving) — manager sees the employee's self-review once submitted, then adds their own rating/comments.
3. Ratings go to calibration — HR/Dept Head sees the distribution, any adjustment made here is recorded **alongside**, not instead of, the manager's original rating (both stay visible).
4. Finalized review shared with the employee; a promotion recommendation, if any, goes through Module 1's normal promotion-approval flow — it doesn't bypass that just because it came from a review.

## Data model

`goals`, `review_cycles`, `performance_reviews` (self/manager/peer components, ratings, calibration adjustments stored separately from original ratings).

## API endpoints

```
GET/POST/PATCH  /api/v1/goals
POST            /api/v1/review-cycles
GET             /api/v1/review-cycles/:id/my-tasks
PATCH           /api/v1/performance-reviews/:id            — autosave-friendly partial updates
POST            /api/v1/performance-reviews/:id/submit
POST            /api/v1/performance-reviews/:id/calibrate    — records adjustment alongside original
```

## What "done" looks like

- Fill out half a review, close the browser tab, reopen — confirm the draft is exactly where you left it.
- Calibrate a rating, confirm the employee's finalized view shows both the original manager rating and the calibrated one, not just the final number with no context.
- A manager with many direct reports sees a prioritized, not overwhelming, queue.
