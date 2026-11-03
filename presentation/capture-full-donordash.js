const path = require('path');
const { chromium } = require(path.resolve('Food-Donation-main/frontend/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();

  console.log('Establishing Demo Donor session...');
  const res = await fetch('http://localhost:5000/api/v1/demo/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'donor' }),
  });
  const json = await res.json();
  const { user, token } = json.data;

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.evaluate(
    ({ user, token }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ ...user, isDemo: true }));
    },
    { user, token }
  );

  await page.goto('http://localhost:3000/donordash', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Take full page screenshot
  await page.screenshot({
    path: 'presentation/stitch-full-replacement/04_donor_operational_dashboard_full.png',
    fullPage: true,
  });

  console.log('Full page screenshot captured!');
  await browser.close();
})();

