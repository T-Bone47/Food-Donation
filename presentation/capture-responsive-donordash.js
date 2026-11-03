const path = require('path');
const { chromium } = require(path.resolve('Food-Donation-main/frontend/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // 1. Establish session
  const res = await fetch('http://localhost:5000/api/v1/demo/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'donor' }),
  });
  const json = await res.json();
  const { user, token } = json.data;

  // Viewports to capture
  const viewports = [
    { name: 'desktop_1920', width: 1920, height: 1080 },
    { name: 'laptop_1440', width: 1440, height: 900 },
    { name: 'mobile_390', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.evaluate(({ user, token }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ ...user, isDemo: true }));
    }, { user, token });

    await page.goto('http://localhost:3000/donordash', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const outPath = `presentation/stitch-full-replacement/donordash_${vp.name}.png`;
    await page.screenshot({ path: outPath, fullPage: vp.name === 'mobile_390' });
    console.log(`Captured ${outPath}`);
    await context.close();
  }

  await browser.close();
  console.log('All responsive screenshots captured successfully!');
})();

