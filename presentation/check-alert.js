const path = require('path');
const { chromium } = require(path.resolve('Food-Donation-main/frontend/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const res = await fetch('http://localhost:5000/api/v1/demo/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'donor' }),
  });
  const json = await res.json();
  const { user, token } = json.data;

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.evaluate(({ user, token }) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify({ ...user, isDemo: true }));
  }, { user, token });

  await page.goto('http://localhost:3000/donordash', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const alerts = await page.$$eval('[role="alert"]', els => els.map(e => e.innerText));
  console.log('Alerts on page:', JSON.stringify(alerts));

  const text = await page.innerText('body');
  console.log('Has fetch failed?:', text.includes('fetch failed'));
  console.log('Has Unable to load?:', text.includes('Unable to load'));

  await browser.close();
})();

