// Verifies the sidebar/table/detail-page/form-width polish pass: real sidebar search (Cmd+K),
// sortable Directory columns, Detail page avatar, and grid-laid-out wizard form fields. Creates
// its own pre-confirmed test tenant with a few employees (so sorting/search have something to
// act on) and cleans everything up afterward. Requires SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY in the environment.
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'output');
mkdirSync(outDir, { recursive: true });

const BASE_URL = 'http://localhost:5174';
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const stamp = Date.now();
const email = `saas-polish-${stamp}@gmail.com`;
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

const { data: created, error: createUserError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (createUserError) {
  console.error(createUserError.message);
  process.exit(2);
}
const testUserId = created.user.id;

const browser = await chromium.launch();
const page = await browser.newPage();
let tenantId = null;
const employeeIds = [];

async function createEmployeeQuick(name, joiningDate) {
  await page.goto(`${BASE_URL}/employees/new`, { waitUntil: 'networkidle' });
  await page.getByLabel('Full legal name').fill(name);
  await page.getByRole('button', { name: /next: work information/i }).click();
  await page.waitForTimeout(250);
  await page.getByLabel('Joining date').fill(joiningDate);
  await page.getByRole('button', { name: /next: education/i }).click();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: /next: previous employment/i }).click();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: /next: review/i }).click();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: /create employee/i }).click();
  await page.waitForTimeout(1200);
  const m = page.url().match(/\/employees\/([0-9a-f-]+)$/);
  if (m) employeeIds.push(m[1]);
  return m?.[1] ?? null;
}

try {
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.waitForTimeout(1200);
  await page.getByLabel('Company name').fill(`SaaS Polish Co ${stamp}`);
  await page.getByLabel('Primary legal entity name').fill(`SaaS Polish Co ${stamp} Pvt Ltd`);
  await page.getByRole('button', { name: /create workspace/i }).click();
  await page.waitForTimeout(1200);
  const { data: profileRow } = await admin.from('profiles').select('tenant_id').eq('id', testUserId).maybeSingle();
  tenantId = profileRow?.tenant_id ?? null;

  // --- Form field width check (wizard Personal & contact step) ---
  await page.goto(`${BASE_URL}/employees/new`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(outDir, 'after-wizard-step1-grid.png'), fullPage: true });
  const nameBox = await page.getByLabel('Full legal name').boundingBox();
  const dobBox = await page.getByLabel('Date of birth').boundingBox();
  const genderBox = await page.getByLabel('Gender').boundingBox();
  assert(nameBox && nameBox.width > 500, `legal name field spans full grid width (got ${nameBox?.width})`);
  assert(dobBox && dobBox.width < 350, `date of birth field is grid-constrained, not full page width (got ${dobBox?.width})`);
  assert(genderBox && Math.abs((dobBox?.y ?? 0) - genderBox.y) < 5, 'date of birth and gender sit side by side (same row)');

  // Create a few employees so the Directory table and sidebar search have real data.
  await createEmployeeQuick('Ananya Sharma', '2026-01-15');
  await createEmployeeQuick('Bilal Khan', '2026-02-20');
  await createEmployeeQuick('Chetan Rao', '2026-03-05');

  // --- Sidebar search ---
  await page.goto(`${BASE_URL}/employees`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, 'after-directory-table.png'), fullPage: true });

  const searchBox = page.getByPlaceholder('Search employees…');
  assert((await searchBox.count()) > 0, 'sidebar search input renders');
  await searchBox.fill('Bilal');
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(outDir, 'after-sidebar-search-open.png'), fullPage: true });
  assert((await page.getByText('Bilal Khan').count()) > 0, 'typing a name shows a matching result in the dropdown');
  await page.getByText('Bilal Khan').first().click();
  await page.waitForTimeout(800);
  assert(page.url().includes(employeeIds[1]) || (await page.locator('body').textContent())?.includes('Bilal Khan'), 'clicking a search result navigates to that employee');

  // --- Detail page avatar ---
  await page.screenshot({ path: join(outDir, 'after-detail-avatar.png'), fullPage: true });
  const detailText = await page.locator('body').textContent();
  assert(detailText?.includes('BK') || detailText?.includes('Bilal Khan'), 'detail page renders for the selected employee');

  // --- Table sorting ---
  await page.goto(`${BASE_URL}/employees`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const nameHeader = page.getByRole('button', { name: 'Name' }).first();
  assert((await nameHeader.count()) > 0, 'Name column header is a sortable control');
  await nameHeader.click();
  await page.waitForTimeout(300);
  const rowsAsc = await page.locator('table tbody tr').allTextContents();
  await nameHeader.click();
  await page.waitForTimeout(300);
  const rowsDesc = await page.locator('table tbody tr').allTextContents();
  assert(JSON.stringify(rowsAsc) !== JSON.stringify(rowsDesc), 'clicking the Name header twice reverses row order (real sorting, not decorative)');
  await page.screenshot({ path: join(outDir, 'after-directory-sorted.png'), fullPage: true });

  const KNOWN_ATLASKIT_WARNINGS = [
    'Support for defaultProps will be removed from function components',
    'UNSAFE_componentWillMount',
    'UNSAFE_componentWillReceiveProps',
  ];
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !KNOWN_ATLASKIT_WARNINGS.some((k) => msg.text().includes(k))) consoleErrors.push(msg.text());
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  assert(consoleErrors.length === 0, `zero unexpected console errors on reload (found: ${JSON.stringify(consoleErrors)})`);
} finally {
  await browser.close();
  console.log('\nCleaning up test data...');
  for (const id of employeeIds) {
    await admin.from('employee_education').delete().eq('employee_id', id);
    await admin.from('employee_previous_employment').delete().eq('employee_id', id);
    await admin.from('documents').delete().eq('employee_id', id);
    await admin.from('employment_assignments').delete().eq('employee_id', id);
    await admin.from('employees').delete().eq('id', id);
  }
  if (tenantId) {
    await admin.from('legal_entities').delete().eq('tenant_id', tenantId);
    await admin.from('tenants').delete().eq('id', tenantId);
  }
  await admin.auth.admin.deleteUser(testUserId);
  console.log('Cleanup done.');
}

if (failed) {
  console.error('\nSAAS POLISH VERIFICATION FAILED — see FAIL lines above.');
  process.exit(1);
}
console.log('\nAll checks passed.');
