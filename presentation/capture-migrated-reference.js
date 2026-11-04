const path = require('path');
const fs = require('fs');
const playwrightPath = fs.existsSync(path.resolve(__dirname, '../frontend/node_modules/playwright'))
  ? path.resolve(__dirname, '../frontend/node_modules/playwright')
  : path.resolve(__dirname, '../../frontend/node_modules/playwright');
const { chromium } = require(playwrightPath);

async function run() {
  const outputDir = path.join(__dirname, 'screenshots', 'migrated_reference');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const routes = [
    { name: '01_landing_signup', path: '/' },
    { name: '02_login', path: '/login' },
    { name: '03_donordash', path: '/donordash' },
    { name: '04_donate', path: '/donate' },
    { name: '05_mydonations', path: '/mydonations' },
    { name: '06_volunteerdash', path: '/volunteerdash' },
    { name: '07_acceptpage', path: '/acceptpage' },
    { name: '08_adminpage', path: '/adminpage' },
    { name: '09_ngodash', path: '/ngodash' },
    { name: '10_notification', path: '/notification' },
    { name: '11_profile', path: '/profile' }
  ];

  console.log('Capturing screenshots of migrated reference UI...');

  for (const r of routes) {
    try {
      console.log(`Navigating to http://localhost:3000${r.path}...`);
      await page.goto(`http://localhost:3000${r.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);
      const filePath = path.join(outputDir, `${r.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved ${filePath}`);
    } catch (e) {
      console.error(`Error capturing ${r.path}:`, e.message);
    }
  }

  // Also capture with Chatbot opened
  try {
    await page.goto('http://localhost:3000/donordash', { waitUntil: 'networkidle', timeout: 15000 });
    const chatBtn = await page.$('button[aria-label="Open FoodShare AI Assistant"]');
    if (chatBtn) {
      await chatBtn.click();
      await page.waitForTimeout(600);
      const filePath = path.join(outputDir, '12_chatbot_opened.png');
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved ${filePath}`);
    }
  } catch (e) {
    console.error('Error capturing chatbot:', e.message);
  }

  await browser.close();
  console.log('Finished capturing all migrated reference screenshots.');
}

run().catch(console.error);
