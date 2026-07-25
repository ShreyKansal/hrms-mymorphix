// Verifies the command-palette rebuild (centered modal, keyboard nav) and the table rebuild
// (checkboxes + CSV export, inline-editable status, avatar, filter). Creates its own
// pre-confirmed test tenant with a few employees, cleans up after. Requires SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY in the environment.
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
const email = `palette-table-${stamp}@gmail.com`;
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
  await page.getByRole('button', { name: /continue/i }).click();
  await page.waitForTimeout(250);
  await page.getByLabel('Joining date').fill(joiningDate);
  await page.getByRole('button', { name: /continue/i }).click();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: /continue/i }).click();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: /continue/i }).click();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: /create employee/i }).click();
  await page.waitForTimeout(1200);
  const m = page.url().match(/\/employees\/([0-9a-f-]+)$/);
  if (m) employeeIds.push(m[1]);
}

try {
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForTimeout(1200);
  await page.getByLabel('Company name').fill(`Palette Table Co ${stamp}`);
  await page.getByLabel('Primary legal entity name').fill(`Palette Table Co ${stamp} Pvt Ltd`);
  await page.getByRole('button', { name: /create workspace/i }).click();
  await page.waitForTimeout(1200);
  const { data: profileRow } = await admin.from('profiles').select('tenant_id').eq('id', testUserId).maybeSingle();
  tenantId = profileRow?.tenant_id ?? null;

  await createEmployeeQuick('Ananya Sharma', '2026-01-15');
  await createEmployeeQuick('Bilal Khan', '2026-02-20');
  await createEmployeeQuick('Chetan Rao', '2026-03-05');

  await page.goto(`${BASE_URL}/employees`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // --- Command palette: click trigger ---
  await page.getByRole('button', { name: /search/i }).click();
  await page.waitForTimeout(300);
  const dialog = page.getByRole('dialog', { name: 'Search' });
  assert((await dialog.count()) > 0, 'command palette opens as a dialog on trigger click');
  const dialogBox = await dialog.boundingBox();
  const viewport = page.viewportSize();
  const centeredX = dialogBox && viewport && Math.abs((dialogBox.x + dialogBox.width / 2) - viewport.width / 2) < 20;
  assert(centeredX, `palette is horizontally centered in the viewport (dialog center x=${dialogBox ? dialogBox.x + dialogBox.width / 2 : 'n/a'}, viewport width=${viewport?.width})`);
  // Tailwind v4 computes bg-black/60 as oklab(0 0 0 / 0.6), not rgba(...) — check for a
  // non-transparent background rather than assuming a specific color-space format.
  const hasBackdrop = await page.evaluate(() => {
    const TRANSPARENT = new Set(['', 'transparent', 'rgba(0, 0, 0, 0)']);
    const el = [...document.querySelectorAll('div')].find(
      (d) => getComputedStyle(d).position === 'fixed' && !TRANSPARENT.has(getComputedStyle(d).backgroundColor),
    );
    return !!el;
  });
  assert(hasBackdrop, 'a fixed-position backdrop element exists behind the palette');
  await page.screenshot({ path: join(outDir, 'palette-open-default.png'), fullPage: true });

  // idle state shows employees without typing
  assert((await page.getByText('Recent employees').count()) > 0, 'idle state (no query) shows a "Recent employees" browse list, not blank');

  // --- Keyboard nav ---
  // "sharma" matches only the employee (no Navigation-section label contains it), so the flat
  // arrow-navigable list (Navigation items + employee results share one cursor) has just one
  // entry — a query like "a" would match several Navigation items first (Org Chart, Add
  // employee, Organisation, Team), landing the cursor on a nav action instead.
  await page.keyboard.type('sharma');
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.screenshot({ path: join(outDir, 'palette-keyboard-nav.png'), fullPage: true });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  assert(/\/employees\/[0-9a-f-]+$/.test(page.url()), `Enter on a keyboard-navigated result opened its detail page (got ${page.url()})`);

  // Escape closes
  await page.goto(`${BASE_URL}/employees`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  // Cmd+K toggles the palette (a second press closes it, matching most command-palette
  // implementations) — pressing both Meta+k and Control+k back to back would open then
  // immediately close it again, which is a bug in a *test* doing that, not in the app.
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
  await page.waitForTimeout(300);
  const openedViaHotkey = (await page.getByRole('dialog', { name: 'Search' }).count()) > 0;
  assert(openedViaHotkey, 'Cmd/Ctrl+K opens the palette from the Directory page');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  assert((await page.getByRole('dialog', { name: 'Search' }).count()) === 0, 'Escape closes the palette');

  // --- Table: avatar + filter + checkbox + CSV export + inline status edit ---
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, 'table-rebuilt.png'), fullPage: true });

  const rowCheckboxes = page.locator('table tbody input[type="checkbox"]');
  assert((await rowCheckboxes.count()) === 3, `table has one checkbox per row (found ${await rowCheckboxes.count()})`);

  await page.getByPlaceholder('Filter by name, ID, role…').fill('Bilal');
  await page.waitForTimeout(300);
  const visibleRows = await page.locator('table tbody tr').count();
  assert(visibleRows === 1, `table-level filter narrows rows to matches only (got ${visibleRows} row(s) for "Bilal")`);
  await page.getByPlaceholder('Filter by name, ID, role…').fill('');
  await page.waitForTimeout(300);

  await rowCheckboxes.first().check();
  await page.waitForTimeout(200);
  assert((await page.getByText('1 selected').count()) > 0, 'selecting a row shows a "1 selected" bulk-action bar');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()]);
  assert(download.suggestedFilename().endsWith('.csv'), `Export CSV triggers a real file download (got ${download.suggestedFilename()})`);

  // Inline status edit
  const statusButtons = page.locator('table tbody button');
  await statusButtons.first().click();
  await page.waitForTimeout(200);
  const statusSelect = page.locator('table tbody select').first();
  assert((await statusSelect.count()) > 0, 'clicking a status dot swaps it into an editable select');
  await statusSelect.selectOption('on_leave');
  await page.waitForTimeout(800);
  assert((await page.getByText('on leave').count()) > 0, 'changing status inline updates the row to show the new status');

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
  assert(consoleErrors.length === 0, `zero unexpected console errors (found: ${JSON.stringify(consoleErrors)})`);
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
  console.error('\nCOMMAND PALETTE / TABLE VERIFICATION FAILED — see FAIL lines above.');
  process.exit(1);
}
console.log('\nAll checks passed.');
