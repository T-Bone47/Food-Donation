const { chromium } = require(require('path').resolve('Food-Donation-main/frontend/node_modules/playwright'));
const fs = require('fs');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const sessRes = await fetch('http://localhost:5000/api/v1/demo/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'donor' }),
  });
  const sessJson = await sessRes.json();
  const { user, token } = sessJson.data;

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.evaluate(
    ({ user, token }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ ...user, isDemo: true }));
    },
    { user, token }
  );

  await page.goto('http://localhost:3000/donordash', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click View Custody Progress
  const btn = await page.$('button:has-text("View Custody Progress")');
  if (btn) {
    await btn.click();
    await page.waitForSelector('h2:has-text("Chain of Custody Tracking")');
    await page.waitForTimeout(500);

    const outPath = 'presentation/custody-modal-verified.png';
    await page.screenshot({ path: outPath, fullPage: false });
    console.log('Saved custody modal screenshot to:', outPath);

    const artifactDir = 'C:\\Users\\dream\\.gemini\\antigravity\\brain\\206d38dd-afcd-418a-a7c4-339a866ea01c';
    fs.copyFileSync(outPath, path.join(artifactDir, 'custody-modal-verified.png'));
    console.log('Copied to artifact directory.');
  }

  await browser.close();
}

run().catch(console.error);

