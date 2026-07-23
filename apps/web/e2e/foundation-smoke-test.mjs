// Real-browser smoke test for the Foundation-phase walking skeleton: tenant setup →
// employee directory → create employee → confirm it's actually visible.
//
// This is a genuine regression test, not a throwaway script — it caught two real bugs
// during Sprint 1 (see docs/build/verification-evidence/README.md):
//   1. @atlaskit/modal-dialog closing itself immediately under React 18 StrictMode.
//   2. An optional email field submitted as "" (not omitted) failing @IsEmail() validation.
// Neither was visible from TypeScript compiling cleanly or the dev server starting without
// errors — both only showed up by actually clicking through the app. Run this after any
// change to the Employee creation flow.
//
// Prereqs: API running on :3000, web dev server running on :5173 (see docs/build/README.md
// "Running everything locally"). Requires `npm install -D playwright && npx playwright
// install chromium` once.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'output');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];
const pageErrors = [];
let failed = false;

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => pageErrors.push(err.message));

function assert(condition, message) {
  if (!condition) {
    failed = true;
    console.error('FAIL:', message);
  } else {
    console.log('PASS:', message);
  }
}

// Fresh browser context, no localStorage yet -> should redirect to /setup.
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.screenshot({ path: join(outDir, '1-setup.png'), fullPage: true });
assert(page.url().endsWith('/setup'), 'unauthenticated visit redirects to /setup');

const companyInput = page.getByLabel('Company name');
const legalInput = page.getByLabel('Primary legal entity name');
assert((await companyInput.count()) > 0 && (await legalInput.count()) > 0, 'setup form fields render');

await companyInput.fill(`Smoke Test Co ${Date.now()}`);
await legalInput.fill('Smoke Test Co Pvt Ltd');
await page.getByRole('button', { name: /create workspace/i }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: join(outDir, '2-directory.png'), fullPage: true });
assert(page.url().endsWith('/employees'), 'setup submission navigates to /employees');

const addButton = page.getByRole('button', { name: /add employee/i });
assert((await addButton.count()) > 0, '"Add employee" button renders');
await addButton.click();
await page.waitForTimeout(500);
await page.screenshot({ path: join(outDir, '3-modal.png'), fullPage: true });
assert((await page.locator('[role="dialog"]').count()) > 0, 'modal actually stays open (regression check for the StrictMode bug)');

const employeeName = `Smoke Test Employee ${Date.now()}`;
await page.getByLabel('Full legal name').fill(employeeName);
await page.getByLabel('Joining date').fill('2026-01-01');
// Deliberately leave "Personal email" blank — this is the exact case that used to 400
// (regression check for the empty-string-vs-undefined validation bug).
await page.getByRole('button', { name: 'Create', exact: true }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: join(outDir, '4-created.png'), fullPage: true });

const bodyText = await page.locator('body').textContent();
assert(bodyText?.includes(employeeName), 'newly created employee (with blank optional email) is visible in the directory');

// Known, benign, upstream-only warnings we can't fix from this codebase — allowlisted
// explicitly (not silently ignored) so a *new*, real console error still fails this test.
// Revisit this list if a future @atlaskit/modal-dialog release fixes them
// (docs/hrms-prd/00-existing-system-audit.md OQ-3).
const KNOWN_ATLASKIT_WARNINGS = [
  'Support for defaultProps will be removed from function components',
  'UNSAFE_componentWillMount',
  'UNSAFE_componentWillReceiveProps',
];
const unexpectedErrors = consoleErrors.filter(
  (e) => !KNOWN_ATLASKIT_WARNINGS.some((known) => e.includes(known)),
);
assert(unexpectedErrors.length === 0, `zero *unexpected* browser console errors (found: ${JSON.stringify(unexpectedErrors)})`);
assert(pageErrors.length === 0, `zero uncaught exceptions (found: ${JSON.stringify(pageErrors)})`);

await browser.close();

if (failed) {
  console.error('\nSMOKE TEST FAILED — see FAIL lines above.');
  process.exit(1);
}
console.log('\nAll checks passed.');
