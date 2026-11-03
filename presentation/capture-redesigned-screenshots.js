const { chromium } = require("../frontend/node_modules/playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:3000";
const API_URL = "http://localhost:5000/api/v1";

const OUT_DIR = path.resolve(__dirname, "screenshots/redesigned");
const ROOT_OUT_DIR = path.resolve(__dirname, "../../presentation/screenshots/redesigned");

// Helper to save screenshot to both directories
async function capture(page, subDir, fileName) {
  const primaryPath = path.join(OUT_DIR, subDir, fileName);
  const secondaryPath = path.join(ROOT_OUT_DIR, subDir, fileName);

  fs.mkdirSync(path.dirname(primaryPath), { recursive: true });
  fs.mkdirSync(path.dirname(secondaryPath), { recursive: true });

  await page.screenshot({ path: primaryPath, fullPage: false });
  fs.copyFileSync(primaryPath, secondaryPath);
  console.log(`[CAPTURE] Saved: redesigned/${subDir}/${fileName}`);
}

// Reset demo data in memory
async function resetDemoData() {
  try {
    await fetch(`${API_URL}/demo/reset`, { method: "POST" });
    console.log("[DEMO] State reset successfully.");
  } catch (e) {
    console.warn("[DEMO] Reset call warning:", e.message);
  }
}

// Fetch demo token and inject into browser localStorage
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
  await page.waitForTimeout(400);
}

// Clear auth session from browser localStorage
async function clearAuthSession(page) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  });
  await page.waitForTimeout(300);
}

async function run() {
  console.log("Starting redesigned presentation screenshot capture at 1920x1080 and 390x844...");
  await resetDemoData();

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await desktopContext.newPage();

  // --------------------------------------------------------------------------
  // GROUP 1: public (Landing, Login, Signup)
  // --------------------------------------------------------------------------
  console.log("\n--- GROUP public ---");
  await clearAuthSession(page);

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await capture(page, "public", "01_landing_page.png");

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await capture(page, "public", "02_login_page.png");

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const donorRoleBtn = page.locator("button:has-text('I have food to give')");
  if (await donorRoleBtn.isVisible()) {
    await donorRoleBtn.click();
    await page.waitForTimeout(600);
  }
  await capture(page, "public", "03_registration_page.png");

  // --------------------------------------------------------------------------
  // GROUP 2: demo (Role selection modal & Guided Demo Assistant)
  // --------------------------------------------------------------------------
  console.log("\n--- GROUP demo ---");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  const demoBtn = page.locator("button:has-text('Select Demo Role')");
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await page.waitForSelector("[role='dialog']", { timeout: 5000 });
    await page.waitForTimeout(600);
    await capture(page, "demo", "04_demo_role_selection.png");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
  }

  // --------------------------------------------------------------------------
  // GROUP 3: donor (Dashboard, Donate, My Donations, Details, Notifications, Profile)
  // --------------------------------------------------------------------------
  console.log("\n--- GROUP donor ---");
  await setAuthSession(page, "donor");

  await page.goto(`${BASE_URL}/donordash`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "donor", "05_donor_dashboard.png");

  // Guided demo drawer capture
  const guidedDemoBtn = page.locator("button:has-text('Guided Demo')").first();
  if (await guidedDemoBtn.isVisible()) {
    await guidedDemoBtn.click();
    await page.waitForSelector("[data-ui='drawer']", { timeout: 5000 });
    await page.waitForTimeout(600);
    await capture(page, "demo", "05_guided_demo_assistant.png");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
  }

  await page.goto(`${BASE_URL}/donate`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const titleInput = page.locator("input[name='title']");
  if (await titleInput.isVisible()) {
    await titleInput.fill("Vegetable Biryani (Surplus Catering)");
    await page.locator("select[name='food_category']").selectOption("Cooked Meal");
    await page.locator("input[name='quantity']").fill("50");
    await page.locator("select[name='unit']").selectOption("servings");
    await page.locator("textarea[name='pickup_address']").fill("Central Kitchen, 42 Commercial Street, Bangalore");
  }
  await page.waitForTimeout(400);
  await capture(page, "donor", "06_donor_create_donation.png");

  await page.goto(`${BASE_URL}/mydonations`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "donor", "07_donor_my_donations.png");

  const progressLink = page.locator("a:has-text('View progress')").first();
  if (await progressLink.isVisible()) {
    await progressLink.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
  } else {
    await page.goto(`${BASE_URL}/acceptpage/demo-don-001`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
  }
  await capture(page, "donor", "08_donor_donation_details.png");

  await page.goto(`${BASE_URL}/notification`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await capture(page, "donor", "09_donor_notifications.png");

  await page.goto(`${BASE_URL}/profile`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await capture(page, "donor", "10_donor_profile.png");

  // --------------------------------------------------------------------------
  // GROUP 4: volunteer (Dashboard, Available, Tasks, Confirmations)
  // --------------------------------------------------------------------------
  console.log("\n--- GROUP volunteer ---");
  await setAuthSession(page, "volunteer");

  await page.goto(`${BASE_URL}/volunteerdash`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "volunteer", "11_volunteer_dashboard.png");

  const openPickupsSection = page.locator("#open-pickups");
  if (await openPickupsSection.isVisible()) {
    await openPickupsSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  }
  await capture(page, "volunteer", "12_volunteer_available_donations.png");

  await page.goto(`${BASE_URL}/volunteer/tasks`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "volunteer", "13_volunteer_assigned_tasks.png");

  const pickupBtn = page.locator("button:has-text('Mark as picked up')").first();
  if (await pickupBtn.isVisible()) {
    await pickupBtn.click();
    await page.waitForSelector("dialog[open], [role='dialog']", { timeout: 5000 });
    await page.waitForTimeout(600);
    await capture(page, "volunteer", "14_volunteer_pickup_confirmation.png");

    const confirmPickupBtn = page.locator("dialog[open] button:has-text('Yes, I picked it up'), [role='dialog'] button:has-text('Yes, I picked it up')").first();
    if (await confirmPickupBtn.isVisible()) {
      await confirmPickupBtn.click();
      await page.waitForTimeout(1000);
    }
  } else {
    await capture(page, "volunteer", "14_volunteer_pickup_confirmation.png");
  }

  await page.waitForTimeout(800);
  await capture(page, "volunteer", "15_volunteer_delivery_confirmation.png");

  // --------------------------------------------------------------------------
  // GROUP 5: ngo (Dashboard, Incoming, Details, Confirmation, Completed)
  // --------------------------------------------------------------------------
  console.log("\n--- GROUP ngo ---");
  await setAuthSession(page, "ngo");

  await page.goto(`${BASE_URL}/ngodash`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "ngo", "16_ngo_dashboard.png");

  const awaitingSection = page.locator("#awaiting");
  if (await awaitingSection.isVisible()) {
    await awaitingSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  }
  await capture(page, "ngo", "17_ngo_incoming_donations.png");

  const deliveryCard = page.locator("h2#awaiting ~ ul li").first();
  if (await deliveryCard.isVisible()) {
    await deliveryCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  }
  await capture(page, "ngo", "18_ngo_donation_details.png");

  const confirmReceiptBtn = page.locator("button:has-text('Confirm receipt')").first();
  if (await confirmReceiptBtn.isVisible()) {
    await confirmReceiptBtn.click();
    await page.waitForSelector("dialog[open], [role='dialog']", { timeout: 5000 });
    await page.waitForTimeout(600);
    await capture(page, "ngo", "19_ngo_receipt_confirmation.png");

    const cancelModal = page.locator("dialog[open] button:has-text('Cancel'), [role='dialog'] button:has-text('Cancel')").first();
    if (await cancelModal.isVisible()) {
      await cancelModal.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await page.waitForTimeout(400);
  } else {
    await capture(page, "ngo", "19_ngo_receipt_confirmation.png");
  }

  const completedSection = page.locator("#completed");
  if (await completedSection.isVisible()) {
    await completedSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  }
  await capture(page, "ngo", "20_ngo_completed_donations.png");

  // --------------------------------------------------------------------------
  // GROUP 6: admin (Console Overview, Donations, Inspection, Users, Activity)
  // --------------------------------------------------------------------------
  console.log("\n--- GROUP admin ---");
  await setAuthSession(page, "admin");

  await page.goto(`${BASE_URL}/adminpage`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "admin", "21_admin_dashboard.png");

  const adminDonationsTab = page.locator("button[role='tab']:has-text('Donations')");
  if (await adminDonationsTab.isVisible()) {
    await adminDonationsTab.click();
    await page.waitForTimeout(1000);
    await capture(page, "admin", "22_admin_donation_management.png");

    const viewModalBtn = page.locator("table tbody tr button:has-text('View')").first();
    if (await viewModalBtn.isVisible()) {
      await viewModalBtn.click();
      await page.waitForSelector("dialog[open], [role='dialog']", { timeout: 5000 });
      await page.waitForTimeout(600);
      await capture(page, "admin", "23_admin_donation_details.png");

      const closeAdminDialog = page.locator("dialog[open] button[aria-label='Close details'], [role='dialog'] button[aria-label='Close details'], button:has-text('Close')").first();
      if (await closeAdminDialog.isVisible()) {
        await closeAdminDialog.click();
      } else {
        await page.keyboard.press("Escape");
      }
      await page.waitForTimeout(400);
    }
  }

  await page.goto(`${BASE_URL}/adminpage`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const adminUsersTab = page.locator("button[role='tab']:has-text('Users')");
  if (await adminUsersTab.isVisible()) {
    await adminUsersTab.click();
    await page.waitForTimeout(1000);
    await capture(page, "admin", "24_admin_user_management.png");
  }

  const adminActivityTab = page.locator("button[role='tab']:has-text('Activity')");
  if (await adminActivityTab.isVisible()) {
    await adminActivityTab.click();
    await page.waitForTimeout(1000);
    await capture(page, "admin", "25_admin_activity_audit_log.png");
  }

  // --------------------------------------------------------------------------
  // GROUP 7: chatbot (Launch, Multi-turn Conversation, Regulatory Answer)
  // --------------------------------------------------------------------------
  console.log("\n--- GROUP chatbot ---");
  await setAuthSession(page, "donor");
  await page.goto(`${BASE_URL}/donordash`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const chatLauncher = page.locator("button[aria-label='Open chat assistant']");
  if (await chatLauncher.isVisible()) {
    await chatLauncher.click();
    await page.waitForSelector("[data-ui='chat-panel']", { timeout: 5000 });
    await page.waitForTimeout(600);
    await capture(page, "chatbot", "26_chatbot_initial_state.png");

    const firstChip = page.locator("button:has-text('How do I list surplus food?')").first();
    if (await firstChip.isVisible()) {
      await firstChip.click();
      await page.waitForTimeout(2000);
      await capture(page, "chatbot", "27_chatbot_conversation.png");
    }

    const chatInput = page.locator("input[placeholder*='Ask']");
    if (await chatInput.isVisible()) {
      await chatInput.fill("What are safe food holding temperatures?");
      await page.locator("button[type='submit'][aria-label='Send message']").click();
      await page.waitForTimeout(2500);
      await capture(page, "chatbot", "28_chatbot_contextual_response.png");
    }
  }

  // --------------------------------------------------------------------------
  // GROUP 8: workflows (Cross-role lifecycle, notifications, map)
  // --------------------------------------------------------------------------
  console.log("\n--- GROUP workflows ---");
  await page.goto(`${BASE_URL}/acceptpage/demo-don-001`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "workflows", "29_donation_lifecycle.png");

  await page.goto(`${BASE_URL}/notification`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await capture(page, "workflows", "30_notification_flow.png");

  await setAuthSession(page, "volunteer");
  await page.goto(`${BASE_URL}/volunteer/tasks`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "workflows", "31_map_location_view.png");

  await setAuthSession(page, "donor");
  await page.goto(`${BASE_URL}/donordash`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await capture(page, "workflows", "32_mobile_responsive_view.png");

  await desktopContext.close();

  // --------------------------------------------------------------------------
  // GROUP 9: mobile (390 x 844 iPhone Viewport)
  // --------------------------------------------------------------------------
  console.log("\n--- GROUP mobile (390x844) ---");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();

  await clearAuthSession(mobilePage);
  await mobilePage.goto(BASE_URL, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(800);
  await capture(mobilePage, "mobile", "01_mobile_landing.png");

  await mobilePage.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(600);
  await capture(mobilePage, "mobile", "02_mobile_login.png");

  await setAuthSession(mobilePage, "donor");
  await mobilePage.goto(`${BASE_URL}/donordash`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);
  await capture(mobilePage, "mobile", "03_mobile_donor_dashboard.png");

  await setAuthSession(mobilePage, "volunteer");
  await mobilePage.goto(`${BASE_URL}/volunteer/tasks`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);
  await capture(mobilePage, "mobile", "04_mobile_volunteer_tasks.png");

  await setAuthSession(mobilePage, "ngo");
  await mobilePage.goto(`${BASE_URL}/ngodash`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);
  await capture(mobilePage, "mobile", "05_mobile_ngo_dashboard.png");

  await setAuthSession(mobilePage, "admin");
  await mobilePage.goto(`${BASE_URL}/adminpage`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);
  await capture(mobilePage, "mobile", "06_mobile_admin_console.png");

  await setAuthSession(mobilePage, "donor");
  await mobilePage.goto(`${BASE_URL}/donordash`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(800);
  const mobileChatLauncher = mobilePage.locator("button[aria-label='Open chat assistant']");
  if (await mobileChatLauncher.isVisible()) {
    await mobileChatLauncher.click();
    await mobilePage.waitForSelector("[data-ui='chat-panel']", { timeout: 5000 });
    await mobilePage.waitForTimeout(600);
    await capture(mobilePage, "mobile", "07_mobile_chatbot.png");
  }

  await mobileContext.close();
  await browser.close();

  console.log("\n=========================================================");
  console.log("All redesigned presentation screenshots captured successfully!");
  console.log("Output folder: presentation/screenshots/redesigned/");
  console.log("=========================================================\n");
}

run().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
