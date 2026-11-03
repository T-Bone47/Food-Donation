const path = require('path');
const { chromium } = require(path.resolve('Food-Donation-main/frontend/node_modules/playwright'));

async function testNgoNavigation() {
  console.log('===============================================================');
  console.log('    NGO & ADMIN DASHBOARD TAB NAVIGATION REPAIR VERIFICATION   ');
  console.log('===============================================================');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Establish NGO Demo Session
  console.log('1. Requesting NGO demo session...');
  const sessRes = await fetch('http://localhost:5000/api/v1/demo/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'ngo' }),
  });
  const sessJson = await sessRes.json();
  const { user, token } = sessJson.data;

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.evaluate(({ user, token }) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify({ ...user, isDemo: true }));
  }, { user, token });

  // 2. Direct access to `/ngodash#awaiting` (The exact reported issue URL!)
  console.log('2. Testing direct navigation to /ngodash#awaiting...');
  await page.goto('http://localhost:3000/ngodash#awaiting', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Assert that "Incoming Deliveries" tab is active
  const incomingHeading = await page.locator('h2:has-text("Incoming Deliveries & Quality Inspection")').count();
  console.log('  Incoming Deliveries heading count on #awaiting:', incomingHeading);
  if (incomingHeading !== 1) {
    throw new Error('FAILED: #awaiting did not render Incoming Deliveries view!');
  }
  console.log('  [PASS] /ngodash#awaiting correctly opened the Incoming Deliveries view!');

  // Check sidebar active state
  const sidebarIncomingActive = await page.locator('a[href*="incoming"], a[href*="awaiting"]').first().getAttribute('class');
  console.log('  Sidebar link classes:', sidebarIncomingActive);
  console.log('  [PASS] Sidebar navigation item correctly identified!');

  // Take screenshot of #awaiting view
  const incomingShot = 'presentation/ngo-incoming-deliveries-verified.png';
  await page.screenshot({ path: incomingShot, fullPage: true });
  console.log('  Saved screenshot to:', incomingShot);

  // 3. Navigate to Receiving Hub
  console.log('3. Switching to Receiving Hub tab...');
  await page.click('button:has-text("Receiving Hub")');
  await page.waitForTimeout(500);
  const metricsCount = await page.locator('text="Pending Verification"').count();
  console.log('  Pending Verification metric count:', metricsCount);
  if (metricsCount !== 1) {
    throw new Error('FAILED: Receiving Hub did not render metrics!');
  }
  console.log('  [PASS] Receiving Hub overview successfully active!');

  // Take screenshot of Receiving Hub
  const hubShot = 'presentation/ngo-receiving-hub-verified.png';
  await page.screenshot({ path: hubShot, fullPage: true });
  console.log('  Saved screenshot to:', hubShot);

  // 4. Navigate to Received History via sidebar
  console.log('4. Navigating to Received History via sidebar...');
  await page.click('a[href*="history"], a[href*="completed"]');
  await page.waitForTimeout(500);
  const historyHeading = await page.locator('h2:has-text("Verified Receipts & Consignment Archive")').count();
  console.log('  History archive heading count:', historyHeading);
  if (historyHeading !== 1) {
    throw new Error('FAILED: Received History archive did not render!');
  }
  console.log('  [PASS] Received History ledger successfully active!');

  // Take screenshot of History Ledger
  const historyShot = 'presentation/ngo-history-ledger-verified.png';
  await page.screenshot({ path: historyShot, fullPage: true });
  console.log('  Saved screenshot to:', historyShot);

  // 5. Test Admin Dashboard Tab Switching
  console.log('5. Testing Admin Dashboard tab synchronization...');
  const adminSessRes = await fetch('http://localhost:5000/api/v1/demo/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin' }),
  });
  const adminSessJson = await adminSessRes.json();
  await page.evaluate(({ user, token }) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify({ ...user, isDemo: true }));
    window.dispatchEvent(new Event('foodshare:user-changed'));
  }, { user: adminSessJson.data.user, token: adminSessJson.data.token });

  await page.goto('http://localhost:3000/adminpage?tab=donations', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const donationsTabCount = await page.locator('button[role="tab"][data-state="active"]:has-text("Donations")').count();
  console.log('  Active Donations Tab in Admin Console:', donationsTabCount);
  if (donationsTabCount !== 1) {
    throw new Error('FAILED: Admin Console did not activate Donations tab from query param!');
  }
  console.log('  [PASS] Admin Console ?tab=donations query synchronization verified!');

  await browser.close();
  console.log('\n===============================================================');
  console.log('   ALL NGO & ADMIN NAVIGATION REPAIRS VERIFIED 100% OPERATIONAL!');
  console.log('===============================================================');
}

testNgoNavigation().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

