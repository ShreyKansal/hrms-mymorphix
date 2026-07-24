// One-off verification for the rebuilt Create Employee flow (Modal -> full page + 5-step
// wizard). This project requires email confirmation for self-serve signup and has a low
// built-in email rate limit, so a normal signup+confirm-link flow isn't reachable from this
// environment — instead this creates one pre-confirmed test user via the Admin API (service
// role, read from an env var, never written to disk), runs the real flow through the actual
// UI via Playwright, then deletes everything it created so the project is left exactly as it
// was found. Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'output');
mkdirSync(outDir, { recursive: true });

const BASE_URL = 'http://localhost:5173';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment first.');
  process.exit(2);
}
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const stamp = Date.now();
const email = `wizard-smoke-${stamp}@gmail.com`;
const password = 'TestPassword123!';

let failed = false;
function assert(condition, message) {
  if (!condition) {
    failed = true;
    console.error('FAIL:', message);
  } else {
    console.log('PASS:', message);
  }
}

console.log('Creating pre-confirmed test user via Admin API...');
const { data: created, error: createUserError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (createUserError) {
  console.error('Could not create test user:', createUserError.message);
  process.exit(2);
}
const testUserId = created.user.id;
console.log('Test user created:', testUserId);

const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];
const pageErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => pageErrors.push(err.message));

let createdTenantId = null;
let createdEmployeeId = null;

try {
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(outDir, '1-post-login.png'), fullPage: true });
  assert(page.url().endsWith('/setup'), 'pre-confirmed test user logs in and reaches /setup');

  await page.getByLabel('Company name').fill(`Wizard Smoke Co ${stamp}`);
  await page.getByLabel('Primary legal entity name').fill(`Wizard Smoke Co ${stamp} Pvt Ltd`);
  await page.getByRole('button', { name: /create workspace/i }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(outDir, '2-directory-empty.png'), fullPage: true });
  assert(page.url().endsWith('/employees'), 'tenant setup navigates to /employees');

  const { data: profileRow } = await admin.from('profiles').select('tenant_id').eq('id', testUserId).maybeSingle();
  createdTenantId = profileRow?.tenant_id ?? null;
  assert(!!createdTenantId, 'tenant was actually created and linked to the test profile');

  await page.getByRole('link', { name: /add employee/i }).click();
  await page.waitForTimeout(500);
  assert(page.url().endsWith('/employees/new'), '"Add employee" is a real page navigation, not a modal open');
  await page.screenshot({ path: join(outDir, '3-wizard-step1.png'), fullPage: true });
  assert((await page.locator('[role="dialog"]').count()) === 0, 'no modal dialog renders — this is a full page');

  const employeeName = `Wizard Smoke Employee ${stamp}`;
  await page.getByLabel('Full legal name').fill(employeeName);
  await page.getByLabel('Date of birth').fill('1995-06-15');
  await page.getByLabel('Gender').fill('Non-binary');
  await page.getByLabel('PAN').fill('ABCDE1234F');
  await page.getByLabel('Personal email').fill(`personal-${stamp}@gmail.com`);
  await page.getByLabel('Personal phone').fill('9876543210');
  await page.getByRole('button', { name: /next: work information/i }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(outDir, '4-wizard-step2.png'), fullPage: true });
  assert((await page.locator('text=Work information').count()) > 0, 'advanced to step 2 (Work information)');

  await page.getByLabel('Joining date').fill('2026-08-01');
  await page.getByLabel('Employment type').fill('Permanent');
  await page.getByRole('button', { name: /next: education/i }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(outDir, '5-wizard-step3.png'), fullPage: true });
  assert((await page.locator('text=Optional — add any degrees').count()) > 0, 'advanced to step 3 (Education)');

  await page.getByLabel('Degree').fill('B.Tech');
  await page.getByLabel('Field of study').fill('Computer Science');
  await page.getByLabel('Institution').fill('Test University');
  await page.getByLabel('Start year').fill('2013');
  await page.getByLabel('End year').fill('2017');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.waitForTimeout(300);
  assert((await page.locator('text=Test University').count()) > 0, 'education row appears in the step 3 list after Add');
  await page.getByRole('button', { name: /next: previous employment/i }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(outDir, '6-wizard-step4.png'), fullPage: true });
  assert((await page.locator('text=Optional — add prior employers').count()) > 0, 'advanced to step 4 (Previous employment)');

  await page.getByLabel('Company').fill('Old Co');
  await page.getByLabel('Designation').fill('Junior Dev');
  await page.getByLabel('Start date').fill('2017-07-01');
  await page.getByLabel('End date').fill('2026-05-30');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.waitForTimeout(300);
  assert((await page.locator('text=Old Co').count()) > 0, 'previous-employment row appears in the step 4 list after Add');

  // Back-navigation sanity check before moving on: confirm the row survives a Back then Next.
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await page.waitForTimeout(300);
  assert((await page.locator('text=Test University').count()) > 0, 'navigating back to step 3 preserves the added education row');
  await page.getByRole('button', { name: /next: previous employment/i }).click();
  await page.waitForTimeout(300);
  assert((await page.locator('text=Old Co').count()) > 0, 'navigating forward again preserves the added previous-employment row');

  await page.getByRole('button', { name: /next: review/i }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(outDir, '7-wizard-review.png'), fullPage: true });

  const reviewText = await page.locator('body').textContent();
  assert(reviewText?.includes(employeeName), 'review step shows the entered legal name');
  assert(reviewText?.includes('Test University'), 'review step shows the added education row');
  assert(reviewText?.includes('Old Co'), 'review step shows the added previous-employment row');

  await page.getByRole('button', { name: /create employee/i }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: join(outDir, '8-after-create.png'), fullPage: true });

  const finalUrlMatch = page.url().match(/\/employees\/([0-9a-f-]+)$/);
  assert(!!finalUrlMatch, `redirected to the new employee's detail page after creation (got ${page.url()})`);
  createdEmployeeId = finalUrlMatch?.[1] ?? null;

  const detailText = await page.locator('body').textContent();
  assert(detailText?.includes(employeeName), 'detail page shows the newly created employee name');
  assert(detailText?.includes('active'), 'employee status shows as "active", not stuck on draft');
  assert((await page.getByText('Test University').count()) > 0, 'education row persisted to the DB and shows on the Profile tab');
  assert((await page.getByText('Old Co').count()) > 0, 'previous-employment row persisted to the DB and shows on the Profile tab');

  const KNOWN_ATLASKIT_WARNINGS = [
    'Support for defaultProps will be removed from function components',
    'UNSAFE_componentWillMount',
    'UNSAFE_componentWillReceiveProps',
  ];
  const unexpectedErrors = consoleErrors.filter((e) => !KNOWN_ATLASKIT_WARNINGS.some((known) => e.includes(known)));
  assert(unexpectedErrors.length === 0, `zero *unexpected* browser console errors (found: ${JSON.stringify(unexpectedErrors)})`);
  assert(pageErrors.length === 0, `zero uncaught exceptions (found: ${JSON.stringify(pageErrors)})`);
} finally {
  await browser.close();

  console.log('\nCleaning up test data...');
  if (createdEmployeeId) {
    await admin.from('employee_education').delete().eq('employee_id', createdEmployeeId);
    await admin.from('employee_previous_employment').delete().eq('employee_id', createdEmployeeId);
    await admin.from('documents').delete().eq('employee_id', createdEmployeeId);
    await admin.from('employment_assignments').delete().eq('employee_id', createdEmployeeId);
    await admin.from('employees').delete().eq('id', createdEmployeeId);
  }
  if (createdTenantId) {
    await admin.from('legal_entities').delete().eq('tenant_id', createdTenantId);
    await admin.from('departments').delete().eq('tenant_id', createdTenantId);
    await admin.from('designations').delete().eq('tenant_id', createdTenantId);
    await admin.from('grades').delete().eq('tenant_id', createdTenantId);
    await admin.from('locations').delete().eq('tenant_id', createdTenantId);
    await admin.from('invitations').delete().eq('tenant_id', createdTenantId);
    await admin.from('tenants').delete().eq('id', createdTenantId);
  }
  const { error: deleteUserError } = await admin.auth.admin.deleteUser(testUserId);
  if (deleteUserError) console.error('Could not delete test user:', deleteUserError.message);
  console.log('Cleanup done.');
}

if (failed) {
  console.error('\nWIZARD VERIFICATION FAILED — see FAIL lines above.');
  process.exit(1);
}
console.log('\nAll checks passed.');
