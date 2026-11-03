const { chromium } = require("../frontend/node_modules/playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:3000";
const API_URL = "http://localhost:5000/api/v1";

const OUT_DIR = path.resolve(__dirname, "stitch-full-replacement");
const ROOT_OUT_DIR = path.resolve(__dirname, "../../presentation/stitch-full-replacement");

async function capture(page, fileName) {
  const primaryPath = path.join(OUT_DIR, fileName);
  const secondaryPath = path.join(ROOT_OUT_DIR, fileName);

  fs.mkdirSync(path.dirname(primaryPath), { recursive: true });
  fs.mkdirSync(path.dirname(secondaryPath), { recursive: true });

  await page.screenshot({ path: primaryPath, fullPage: false });
  try {
    fs.copyFileSync(primaryPath, secondaryPath);
  } catch {}
  console.log(`[CAPTURED] -> ${fileName}`);
}

async function resetDemoData() {
  try {
    await fetch(`${API_URL}/demo/reset`, { method: "POST" });
    console.log("[DEMO] State reset successfully.");
  } catch (e) {
    console.warn("[DEMO] Reset call warning:", e.message);
  }
}

async function setAuthSession(page, role) {
  const res = await fetch(`${API_URL}/demo/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  const json = await res.json();
  const { user, token } = json.data;

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.evaluate(
    ({ user, token }) => {
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify({ ...user, isDemo: true }));
    },
    { user, token }
  );
  await page.waitForTimeout(500);
}

async function clearAuthSession(page) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  });
  await page.waitForTimeout(400);
}

async function run() {
  console.log("===============================================================");
  console.log("  CAPTURING REAL APPLICATION EVIDENCE: STITCH FULL REPLACEMENT ");
  console.log("===============================================================");

  await resetDemoData();

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  // Desktop Context (1920x1080)
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await desktopContext.newPage();

  // 1. Public Landing Page
  console.log("\n[1/12] Capturing Public Landing Page...");
  await clearAuthSession(page);
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "01_public_landing_page.png");

  // 2. Admin Operations Command Center
  console.log("\n[2/12] Capturing Admin Operations Command Center...");
  await setAuthSession(page, "admin");
  await page.goto(`${BASE_URL}/adminpage`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "02_admin_command_center.png");

  // 3. User & Organization Administration
  console.log("\n[3/12] Capturing User & Organization Administration...");
  const usersTab = page.locator("button:has-text('Users')");
  if (await usersTab.isVisible()) {
    await usersTab.click();
    await page.waitForTimeout(800);
  }
  await capture(page, "03_user_organization_admin.png");

  // 4. Donor Operational Dashboard
  console.log("\n[4/12] Capturing Donor Operational Dashboard...");
  await setAuthSession(page, "donor");
  await page.goto(`${BASE_URL}/donordash`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "04_donor_operational_dashboard.png");

  // 5. Donor Donation Creation Wizard (Schema Aligned)
  console.log("\n[5/12] Capturing Donor Surplus Creation Wizard...");
  await page.goto(`${BASE_URL}/donate`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "05_donor_donation_wizard.png");

  // 6. Volunteer Fleet Discovery Dashboard
  console.log("\n[6/12] Capturing Volunteer Fleet Discovery Dashboard...");
  await setAuthSession(page, "volunteer");
  await page.goto(`${BASE_URL}/volunteerdash`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "06_volunteer_fleet_discovery.png");

  // 7. Volunteer Assigned Missions & Handover Actions
  console.log("\n[7/12] Capturing Volunteer Assigned Missions...");
  await page.goto(`${BASE_URL}/volunteer/tasks`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "07_volunteer_assigned_mission.png");

  // 8. NGO Operations & Receipt Inspection Dashboard
  console.log("\n[8/12] Capturing NGO Operations Receipt Inspection Dashboard...");
  await setAuthSession(page, "ngo");
  await page.goto(`${BASE_URL}/ngodash`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "08_ngo_operations_dock_inspection.png");

  // 9. AI Chatbot Slide-over Drawer
  console.log("\n[9/12] Capturing AI Chatbot Drawer...");
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("foodshare:open-chatbot"));
  });
  await page.waitForTimeout(800);
  await capture(page, "09_ai_chatbot_slideover.png");

  await desktopContext.close();

  // Mobile Context (390x844 - iPhone 14 / Modern Standard)
  console.log("\n--- MOBILE VIEWPORT (390x844) ---");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();

  // 10. Mobile Public Landing
  console.log("[10/12] Capturing Mobile Landing Page...");
  await clearAuthSession(mobilePage);
  await mobilePage.goto(BASE_URL, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);
  await capture(mobilePage, "10_mobile_landing_390x844.png");

  // 11. Mobile Volunteer Discovery
  console.log("[11/12] Capturing Mobile Volunteer Discovery...");
  await setAuthSession(mobilePage, "volunteer");
  await mobilePage.goto(`${BASE_URL}/volunteerdash`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);
  await capture(mobilePage, "11_mobile_volunteer_390x844.png");

  // 12. Mobile Donor Wizard
  console.log("[12/12] Capturing Mobile Donor Creation Wizard...");
  await setAuthSession(mobilePage, "donor");
  await mobilePage.goto(`${BASE_URL}/donate`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);
  await capture(mobilePage, "12_mobile_donor_wizard_390x844.png");

  await mobileContext.close();
  await browser.close();

  console.log("\n===============================================================");
  console.log("  ALL 12 REAL SCREENSHOTS SUCCESSFULLY CAPTURED & SAVED!        ");
  console.log("  Directory: presentation/stitch-full-replacement/             ");
  console.log("===============================================================");
}

run().catch((e) => {
  console.error("FATAL ERROR in screenshot capture:", e);
  process.exit(1);
});

