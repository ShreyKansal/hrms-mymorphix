// Covers the screens not exercised by the other regression scripts: TransferEmployeeModal
// (now a Dialog), OrgManagement (departments/designations/grades tabs), Team (invite form),
// OrgChart (manager tree). Self-cleaning test tenant.
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'output');
mkdirSync(outDir, { recursive: true });
const BASE_URL = 'http://localhost:5173';
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const stamp = Date.now();
const email = `remaining-${stamp}@gmail.com`;
let failed = false;
function assert(cond, msg) {
  if (!cond) {
    failed = true;
    console.error('FAIL:', msg);
  } else {
    console.log('PASS:', msg);
  }
}

const { data: created } = await admin.auth.admin.createUser({ email, password: 'TestPassword123!', email_confirm: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('PAGE: ' + e.message));

let tenantId = null;
let empId = null;
try {
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('TestPassword123!');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.waitForTimeout(1000);
  await page.getByLabel('Company name').fill(`Remaining Co ${stamp}`);
  await page.getByLabel('Primary legal entity name').fill(`Remaining Co ${stamp} Ltd`);
  await page.getByRole('button', { name: /create workspace/i }).click();
  await page.waitForTimeout(1000);
  const { data: profileRow } = await admin.from('profiles').select('tenant_id').eq('id', created.user.id).maybeSingle();
  tenantId = profileRow?.tenant_id ?? null;

  // --- OrgManagement: add a department, designation, grade ---
  await page.goto(`${BASE_URL}/organisation`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(outDir, 'org-management.png'), fullPage: true });
  await page.getByLabel('New department').fill('Engineering');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.waitForTimeout(500);
  assert((await page.getByText('Engineering').count()) > 0, 'OrgManagement: added department appears in the list');

  await page.getByRole('tab', { name: 'Designations' }).click();
  await page.waitForTimeout(200);
  await page.getByLabel('New designation').fill('Staff Engineer');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.waitForTimeout(500);
  assert((await page.getByText('Staff Engineer').count()) > 0, 'OrgManagement: added designation appears in the list');

  await page.getByRole('tab', { name: 'Grades' }).click();
  await page.waitForTimeout(200);
  await page.getByLabel('Code').fill('L5');
  await page.getByLabel('New grade').fill('Senior');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.waitForTimeout(500);
  assert((await page.getByText('L5').count()) > 0, 'OrgManagement: added grade appears in the list');

  // --- Team: invite form renders, admin-visible ---
  await page.goto(`${BASE_URL}/team`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(outDir, 'team.png'), fullPage: true });
  assert((await page.getByLabel('Email').count()) > 0, 'Team: invite form email field renders');
  assert((await page.getByText(email).count()) > 0, 'Team: current user shows as a member');

  // --- Create an employee for OrgChart + Transfer testing ---
  await page.goto(`${BASE_URL}/employees/new`, { waitUntil: 'networkidle' });
  await page.getByLabel('Full legal name').fill('Transfer Test Employee');
  await page.getByRole('button', { name: /next: work information/i }).click();
  await page.waitForTimeout(300);
  await page.getByLabel('Joining date').fill('2026-01-01');
  await page.getByRole('button', { name: /next: education/i }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /next: previous employment/i }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /next: review/i }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /create employee/i }).click();
  await page.waitForTimeout(1200);
  const m = page.url().match(/\/employees\/([0-9a-f-]+)$/);
  empId = m?.[1] ?? null;
  assert(!!empId, 'Created a test employee for Transfer/OrgChart checks');

  // --- OrgChart ---
  await page.goto(`${BASE_URL}/org-chart`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, 'org-chart.png'), fullPage: true });
  assert((await page.getByText('Transfer Test Employee').count()) > 0, 'OrgChart: new employee appears in the tree');

  // --- TransferEmployeeModal (now a Dialog) ---
  await page.goto(`${BASE_URL}/employees/${empId}`, { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Employment' }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Transfer', exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, 'transfer-dialog.png'), fullPage: true });
  assert((await page.getByRole('dialog').count()) > 0, 'Transfer: opens as a real Radix Dialog');
  await page.getByLabel('Effective from').fill('2026-03-01');
  await page.getByLabel('Employment type').fill('Contract');
  await page.getByRole('button', { name: 'Transfer', exact: true }).last().click();
  await page.waitForTimeout(1000);
  assert((await page.getByRole('dialog').count()) === 0, 'Transfer: dialog closes after a successful submit');
  assert((await page.getByText('Contract').count()) > 0, 'Transfer: new employment type reflected on the page after transfer');

  assert(consoleErrors.length === 0, `zero console errors across all these screens (found: ${JSON.stringify(consoleErrors)})`);
} finally {
  await browser.close();
  if (empId) {
    await admin.from('employment_assignments').delete().eq('employee_id', empId);
    await admin.from('employees').delete().eq('id', empId);
  }
  if (tenantId) {
    await admin.from('departments').delete().eq('tenant_id', tenantId);
    await admin.from('designations').delete().eq('tenant_id', tenantId);
    await admin.from('grades').delete().eq('tenant_id', tenantId);
    await admin.from('legal_entities').delete().eq('tenant_id', tenantId);
    await admin.from('tenants').delete().eq('id', tenantId);
  }
  await admin.auth.admin.deleteUser(created.user.id);
}

if (failed) {
  console.error('\nREMAINING SCREENS VERIFICATION FAILED');
  process.exit(1);
}
console.log('\nAll checks passed.');
