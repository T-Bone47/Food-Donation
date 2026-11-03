const path = require('path');
const { chromium } = require(path.resolve('Food-Donation-main/frontend/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Capturing localhost:5002 HTML Service Portal...');
  await page.goto('http://localhost:5002', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'presentation/stitch-full-replacement/13_chatbot_service_portal.png' });

  console.log('2. Establishing Demo Donor session...');
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

  console.log('3. Navigating to /donordash...');
  await page.goto('http://localhost:3000/donordash', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const errorBanner = await page.$('text="Unable to load donor statistics"');
  console.log('Any error banner present:', !!errorBanner);

  console.log('4. Capturing localhost:3000/donordash screenshot...');
  await page.screenshot({ path: 'presentation/stitch-full-replacement/04_donor_operational_dashboard.png' });

  console.log('Screenshots captured successfully!');
  await browser.close();
})();
