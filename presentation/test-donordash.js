const { chromium } = require('./Food-Donation-main/frontend/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log('1. Navigating to login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

  console.log('2. Clicking Demo Donor button...');
  const donorBtn = page.locator('button:has-text("Demo Food Donor"), button:has-text("Donor Demo"), button:has-text("Donor")').first();
  await donorBtn.click();
  await page.waitForTimeout(2000);

  console.log('3. Navigating to /donordash...');
  await page.goto('http://localhost:3000/donordash', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check for error banner
  const errorBanner = await page.$('text="Unable to load donor statistics"');
  console.log('Error banner present:', !!errorBanner);

  // Check for active donations
  const activeBatches = await page.$('text="Active Staged Donations"');
  console.log('Active Staged Donations present:', !!activeBatches);

  // Check for food handling checklist
  const checklist = await page.$('text="Food Handling Checklist"');
  console.log('Food Handling Checklist present:', !!checklist);

  // Take screenshot of donordash
  await page.screenshot({ path: 'presentation/stitch-full-replacement/04_donor_operational_dashboard.png' });
  console.log('Screenshot saved to presentation/stitch-full-replacement/04_donor_operational_dashboard.png');

  console.log('Console errors:', consoleErrors);
  await browser.close();
})();

