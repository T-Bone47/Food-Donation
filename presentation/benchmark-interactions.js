const path = require('path');
const { chromium } = require(path.resolve('Food-Donation-main/frontend/node_modules/playwright'));

async function measure() {
  console.log('--- FOODSHARE BASELINE INTERACTION LATENCY BENCHMARK ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Establish session
  const authStart = performance.now();
  const res = await fetch('http://localhost:5000/api/v1/demo/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'donor' }),
  });
  const json = await res.json();
  const { user, token } = json.data;
  const authDuration = performance.now() - authStart;

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.evaluate(({ user, token }) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify({ ...user, isDemo: true }));
  }, { user, token });

  // 1. Initial Dashboard Load
  const dashStart = performance.now();
  await page.goto('http://localhost:3000/donordash', { waitUntil: 'networkidle' });
  const dashLoadTime = performance.now() - dashStart;

  // 2. Navigation: Donor Dashboard -> My Donations
  const myDonationsStart = performance.now();
  await page.click('a[href="/mydonations"]');
  await page.waitForSelector('h1:has-text("My donations")');
  const navMyDonationsTime = performance.now() - myDonationsStart;

  // 3. Navigation: My Donations -> Return to Dashboard
  const backDashStart = performance.now();
  await page.click('a[href="/donordash"]');
  await page.waitForSelector('h1:has-text("Demo Food Donor")');
  const navBackDashTime = performance.now() - backDashStart;

  // 4. Custody Tracking: In-Dashboard Modal Open (Zero-latency SWR)
  const custodyBtn = await page.$('button:has-text("View Custody Progress"), button:has-text("Inspect Custody Tracking")');
  let custodyModalTime = 0;
  if (custodyBtn) {
    const custodyStart = performance.now();
    await custodyBtn.click();
    await page.waitForSelector('h2:has-text("Chain of Custody Tracking")');
    custodyModalTime = performance.now() - custodyStart;
    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
  }

  // 4b. Optional direct navigation to custody page
  const custodyDirectStart = performance.now();
  await page.goto('http://localhost:3000/acceptpage/d1111111-1111-1111-1111-111111111111', { waitUntil: 'networkidle' });
  const custodyDirectTime = performance.now() - custodyDirectStart;
  // Return to dashboard
  await page.goto('http://localhost:3000/donordash', { waitUntil: 'networkidle' });

  // 5. Navigation: Notifications
  const notifStart = performance.now();
  await page.click('a[href="/notification"]');
  await page.waitForSelector('h1:has-text("Notifications")');
  const notifNavTime = performance.now() - notifStart;

  // 6. Navigation: Profile
  const profileStart = performance.now();
  await page.click('a[href="/profile"]');
  await page.waitForSelector('h1:has-text("Your profile")');
  const profileNavTime = performance.now() - profileStart;

  // 7. Navigation: Create Donation
  const donateStart = performance.now();
  await page.click('a[href="/donate"]');
  await page.waitForSelector('h1:has-text("Create a Food Donation")');
  const donateNavTime = performance.now() - donateStart;

  // 8. Role Switch: Donor -> Volunteer
  const roleSwitchStart = performance.now();
  const switchRes = await fetch('http://localhost:5000/api/v1/demo/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'volunteer' }),
  });
  const volJson = await switchRes.json();
  await page.evaluate(({ user, token }) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify({ ...user, isDemo: true }));
    window.dispatchEvent(new Event('foodshare:user-changed'));
  }, { user: volJson.data.user, token: volJson.data.token });
  await page.goto('http://localhost:3000/volunteerdash', { waitUntil: 'networkidle' });
  const roleSwitchTime = performance.now() - roleSwitchStart;

  const results = {
    authSessionApi: Math.round(authDuration),
    dashboardInitialLoad: Math.round(dashLoadTime),
    navDashboardToMyDonations: Math.round(navMyDonationsTime),
    navMyDonationsToDashboard: Math.round(navBackDashTime),
    custodyModalOpen: Math.round(custodyModalTime),
    custodyDirectPage: Math.round(custodyDirectTime),
    navToNotifications: Math.round(notifNavTime),
    navToProfile: Math.round(profileNavTime),
    navToCreateDonation: Math.round(donateNavTime),
    roleSwitchToVolunteer: Math.round(roleSwitchTime),
  };

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  return results;
}

measure().catch(console.error);
