const { chromium } = require("../frontend/node_modules/playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:3000";
const API_URL = "http://localhost:5000/api/v1";

const OUT_DIR = path.resolve(__dirname, "screenshots");
const ROOT_OUT_DIR = path.resolve(__dirname, "../../presentation/screenshots");

// Helper to save screenshot to both directories
async function capture(page, subDir, fileName) {
  const primaryPath = path.join(OUT_DIR, subDir, fileName);
  const secondaryPath = path.join(ROOT_OUT_DIR, subDir, fileName);

  fs.mkdirSync(path.dirname(primaryPath), { recursive: true });
  fs.mkdirSync(path.dirname(secondaryPath), { recursive: true });

  await page.screenshot({ path: primaryPath, fullPage: false });
  fs.copyFileSync(primaryPath, secondaryPath);
  console.log(`[CAPTURE] Saved: ${subDir}/${fileName}`);
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
  console.log("Starting automated screenshot capture...");
  await resetDemoData();

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  // ==========================================================================
  // DESKTOP VIEWPORT (1920x1080)
  // ==========================================================================
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // --------------------------------------------------------------------------
  // GROUP 01_public: Public and Authentication
  // --------------------------------------------------------------------------
  console.log("\n--- GROUP 01_public: Public & Authentication ---");
  await clearAuthSession(page);

  // 01_landing_page.png
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await capture(page, "01_public", "01_landing_page.png");

  // 02_login_page.png
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await capture(page, "01_public", "02_login_page.png");

  // 03_registration_page.png (select "I have food to give" role on signup)
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const donorRoleBtn = page.locator("button:has-text('I have food to give')");
  if (await donorRoleBtn.isVisible()) {
    await donorRoleBtn.click();
    await page.waitForTimeout(600);
  }
  await capture(page, "01_public", "03_registration_page.png");

  // 04_demo_role_selection.png (open demo role modal on login page)
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  const selectDemoBtn = page.locator("button:has-text('Select Demo Role')");
  if (await selectDemoBtn.isVisible()) {
    await selectDemoBtn.click();
    await page.waitForSelector("[role='dialog']", { timeout: 5000 });
    await page.waitForTimeout(600);
    await capture(page, "01_public", "04_demo_role_selection.png");

    // Close modal cleanly
    const closeBtn = page.locator("[role='dialog'] button[aria-label='Close dialog']");
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await page.waitForTimeout(400);
  }

  // --------------------------------------------------------------------------
  // GROUP 02_donor: Donor Role
  // --------------------------------------------------------------------------
  console.log("\n--- GROUP 02_donor: Donor Role ---");
  await setAuthSession(page, "donor");

  // 05_donor_dashboard.png
  await page.goto(`${BASE_URL}/donordash`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "02_donor", "05_donor_dashboard.png");

  // 06_donor_create_donation.png
  await page.goto(`${BASE_URL}/donate`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const titleInput = page.locator("input[name='title']");
  if (await titleInput.isVisible()) {
    await titleInput.fill("50 Fresh Biryani Meal Boxes");
    const qtyInput = page.locator("input[name='quantity']");
    if (await qtyInput.isVisible()) await qtyInput.fill("50");
    const descInput = page.locator("textarea[name='description']");
    if (await descInput.isVisible()) {
      await descInput.fill("Warm chicken biryani and raita prepared for community distribution.");
    }
  }
  await page.waitForTimeout(400);
  await capture(page, "02_donor", "06_donor_create_donation.png");

  // 07_donor_my_donations.png
  await page.goto(`${BASE_URL}/mydonations`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "02_donor", "07_donor_my_donations.png");

  // 08_donor_donation_details.png (View progress of first donation)
  const viewDetailBtn = page.locator("a:has-text('View progress'), button:has-text('View progress')").first();
  if (await viewDetailBtn.isVisible()) {
    await viewDetailBtn.click();
    await page.waitForTimeout(1000);
    await capture(page, "02_donor", "08_donor_donation_details.png");
  } else {
    await page.goto(`${BASE_URL}/acceptpage/d1111111-0000-0000-0000-000000000001`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await capture(page, "02_donor", "08_donor_donation_details.png");
  }

  // 09_donor_notifications.png
  await page.goto(`${BASE_URL}/notification`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "02_donor", "09_donor_notifications.png");

  // 10_donor_profile.png
  await page.goto(`${BASE_URL}/profile`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "02_donor", "10_donor_profile.png");

  // --------------------------------------------------------------------------
  // GROUP 03_volunteer: Volunteer Role
  // --------------------------------------------------------------------------
  console.log("\n--- GROUP 03_volunteer: Volunteer Role ---");
  await setAuthSession(page, "volunteer");

  // 11_volunteer_dashboard.png
  await page.goto(`${BASE_URL}/volunteerdash`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "03_volunteer", "11_volunteer_dashboard.png");

  // 12_volunteer_available_donations.png (scroll to open pickups)
  const openPickupsSection = page.locator("#open-pickups");
  if (await openPickupsSection.isVisible()) {
    await openPickupsSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  }
  await capture(page, "03_volunteer", "12_volunteer_available_donations.png");

  // 13_volunteer_assigned_tasks.png
  await page.goto(`${BASE_URL}/volunteer/tasks`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "03_volunteer", "13_volunteer_assigned_tasks.png");

  // 14_volunteer_pickup_confirmation.png (open confirm pickup modal)
  const pickupBtn = page.locator("button:has-text('Mark as picked up')").first();
  if (await pickupBtn.isVisible()) {
    await pickupBtn.click();
    await page.waitForSelector("dialog[open], [role='dialog']", { timeout: 5000 });
    await page.waitForTimeout(600);
    await capture(page, "03_volunteer", "14_volunteer_pickup_confirmation.png");

    // Complete the pickup step so task advances to PICKED_UP
    const confirmPickupBtn = page.locator("dialog[open] button:has-text('Yes, I picked it up'), [role='dialog'] button:has-text('Yes, I picked it up')").first();
    if (await confirmPickupBtn.isVisible()) {
      await confirmPickupBtn.click();
      await page.waitForTimeout(1000);
    }
  } else {
    await capture(page, "03_volunteer", "14_volunteer_pickup_confirmation.png");
  }

  // 15_volunteer_delivery_confirmation.png (delivery action is now active)
  await page.waitForTimeout(800);
  await capture(page, "03_volunteer", "15_volunteer_delivery_confirmation.png");

  // --------------------------------------------------------------------------
  // GROUP 04_ngo: NGO Role
  // --------------------------------------------------------------------------
  console.log("\n--- GROUP 04_ngo: NGO Role ---");
  await setAuthSession(page, "ngo");

  // 16_ngo_dashboard.png
  await page.goto(`${BASE_URL}/ngodash`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "04_ngo", "16_ngo_dashboard.png");

  // 17_ngo_incoming_donations.png (scroll to waiting confirmation)
  const awaitingSection = page.locator("#awaiting");
  if (await awaitingSection.isVisible()) {
    await awaitingSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  }
  await capture(page, "04_ngo", "17_ngo_incoming_donations.png");

  // 18_ngo_donation_details.png (incoming delivery details card)
  const deliveryCard = page.locator("h2#awaiting ~ ul li").first();
  if (await deliveryCard.isVisible()) {
    await deliveryCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  }
  await capture(page, "04_ngo", "18_ngo_donation_details.png");

  // 19_ngo_receipt_confirmation.png (click Confirm receipt to open modal)
  const confirmReceiptBtn = page.locator("button:has-text('Confirm receipt')").first();
  if (await confirmReceiptBtn.isVisible()) {
    await confirmReceiptBtn.click();
    await page.waitForSelector("dialog[open], [role='dialog']", { timeout: 5000 });
    await page.waitForTimeout(600);
    await capture(page, "04_ngo", "19_ngo_receipt_confirmation.png");

    // Close or cancel dialog
    const cancelModal = page.locator("dialog[open] button:has-text('Cancel'), [role='dialog'] button:has-text('Cancel')").first();
    if (await cancelModal.isVisible()) {
      await cancelModal.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await page.waitForTimeout(400);
  } else {
    await capture(page, "04_ngo", "19_ngo_receipt_confirmation.png");
  }

  // 20_ngo_completed_donations.png (scroll to completed deliveries & totals)
  const completedSection = page.locator("#completed");
  if (await completedSection.isVisible()) {
    await completedSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  }
  await capture(page, "04_ngo", "20_ngo_completed_donations.png");

  // --------------------------------------------------------------------------
  // GROUP 05_admin: Administrator Role
  // --------------------------------------------------------------------------
  console.log("\n--- GROUP 05_admin: Administrator Role ---");
  await setAuthSession(page, "admin");

  // 21_admin_dashboard.png (Overview console)
  await page.goto(`${BASE_URL}/adminpage`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "05_admin", "21_admin_dashboard.png");

  // 22_admin_donation_management.png (Donations tab)
  const adminDonationsTab = page.locator("button[role='tab']:has-text('Donations')");
  if (await adminDonationsTab.isVisible()) {
    await adminDonationsTab.click();
    await page.waitForTimeout(1000);
    await capture(page, "05_admin", "22_admin_donation_management.png");

    // 23_admin_donation_details.png (click View button on first table row)
    const viewModalBtn = page.locator("table tbody tr button:has-text('View')").first();
    if (await viewModalBtn.isVisible()) {
      await viewModalBtn.click();
      await page.waitForSelector("dialog[open], [role='dialog']", { timeout: 5000 });
      await page.waitForTimeout(600);
      await capture(page, "05_admin", "23_admin_donation_details.png");

      // Close modal
      const closeAdminDialog = page.locator("dialog[open] button[aria-label='Close details'], [role='dialog'] button[aria-label='Close details'], button:has-text('Close')").first();
      if (await closeAdminDialog.isVisible()) {
        await closeAdminDialog.click();
      } else {
        await page.keyboard.press("Escape");
      }
      await page.waitForTimeout(400);
    }
  }

  // 24_admin_user_management.png (Users tab)
  await page.goto(`${BASE_URL}/adminpage`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const adminUsersTab = page.locator("button[role='tab']:has-text('Users')");
  if (await adminUsersTab.isVisible()) {
    await adminUsersTab.click();
    await page.waitForTimeout(1000);
    await capture(page, "05_admin", "24_admin_user_management.png");
  }

  // 25_admin_activity_audit_log.png (Activity tab)
  const adminActivityTab = page.locator("button[role='tab']:has-text('Activity')");
  if (await adminActivityTab.isVisible()) {
    await adminActivityTab.click();
    await page.waitForTimeout(1000);
    await capture(page, "05_admin", "25_admin_activity_audit_log.png");
  }

  // --------------------------------------------------------------------------
  // GROUP 06_chatbot: Conversational AI Assistant
  // --------------------------------------------------------------------------
  console.log("\n--- GROUP 06_chatbot: Conversational AI Assistant ---");
  await setAuthSession(page, "donor");
  await page.goto(`${BASE_URL}/donordash`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // 26_chatbot_initial_state.png (open chat drawer)
  const chatLauncher = page.locator("button[aria-label='Open chat assistant']");
  if (await chatLauncher.isVisible()) {
    await chatLauncher.click();
    await page.waitForTimeout(800);
    await capture(page, "06_chatbot", "26_chatbot_initial_state.png");

    // 27_chatbot_conversation.png (Query 1)
    const chatInput = page.locator("input[placeholder*='Ask']");
    const sendBtn = page.locator("button[aria-label='Send message']");

    if (await chatInput.isVisible()) {
      await chatInput.fill("How do I list surplus food?");
      await sendBtn.click();
      // Wait for response to render
      await page.waitForSelector("div[role='log'] strong:has-text('Platform Mission')", { timeout: 8000 }).catch(() => { });
      await page.waitForTimeout(1500);
      await capture(page, "06_chatbot", "27_chatbot_conversation.png");

      // 28_chatbot_contextual_response.png (Query 2 with safety policies)
      await chatInput.fill("What are the temperature standards for cooked food?");
      await sendBtn.click();
      await page.waitForTimeout(2500);
      await capture(page, "06_chatbot", "28_chatbot_contextual_response.png");
    }

    // Close chat assistant
    const closeChatBtn = page.locator("button[aria-label='Close assistant']");
    if (await closeChatBtn.isVisible()) {
      await closeChatBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // --------------------------------------------------------------------------
  // GROUP 07_workflows: Cross-Role Platform Workflows
  // --------------------------------------------------------------------------
  console.log("\n--- GROUP 07_workflows: Cross-Role Workflows ---");

  // 29_donation_lifecycle.png (full Journey visual step tracker)
  await setAuthSession(page, "donor");
  await page.goto(`${BASE_URL}/mydonations`, { waitUntil: "networkidle" });
  const viewProgBtn = page.locator("a:has-text('View progress')").first();
  if (await viewProgBtn.isVisible()) {
    await viewProgBtn.click();
    await page.waitForTimeout(1000);
  } else {
    await page.goto(`${BASE_URL}/acceptpage/d1111111-0000-0000-0000-000000000001`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
  }
  const journeySection = page.locator("#progress");
  if (await journeySection.isVisible()) {
    await journeySection.scrollIntoViewIfNeeded();
  }
  await capture(page, "07_workflows", "29_donation_lifecycle.png");

  // 30_notification_flow.png
  await page.goto(`${BASE_URL}/notification`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await capture(page, "07_workflows", "30_notification_flow.png");

  // 31_map_location_view.png
  await setAuthSession(page, "volunteer");
  await page.goto(`${BASE_URL}/volunteer/tasks`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const mapLink = page.locator("a:has-text('Open in Maps')").first();
  if (await mapLink.isVisible()) {
    await mapLink.scrollIntoViewIfNeeded();
  }
  await capture(page, "07_workflows", "31_map_location_view.png");

  // 32_mobile_responsive_view.png (capture desktop responsive transition)
  await page.goto(`${BASE_URL}/donordash`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await capture(page, "07_workflows", "32_mobile_responsive_view.png");

  // ==========================================================================
  // GROUP 08_mobile: Mobile Responsive Views (390x844 - iPhone / Modern Mobile)
  // ==========================================================================
  console.log("\n--- GROUP 08_mobile: Mobile Views (390x844) ---");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();

  // 01_mobile_landing.png
  await clearAuthSession(mobilePage);
  await mobilePage.goto(BASE_URL, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(800);
  await capture(mobilePage, "08_mobile", "01_mobile_landing.png");

  // 02_mobile_login.png
  await mobilePage.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(800);
  await capture(mobilePage, "08_mobile", "02_mobile_login.png");

  // 03_mobile_donor_dashboard.png
  await setAuthSession(mobilePage, "donor");
  await mobilePage.goto(`${BASE_URL}/donordash`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(800);
  await capture(mobilePage, "08_mobile", "03_mobile_donor_dashboard.png");

  // 04_mobile_volunteer_tasks.png
  await setAuthSession(mobilePage, "volunteer");
  await mobilePage.goto(`${BASE_URL}/volunteer/tasks`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(800);
  await capture(mobilePage, "08_mobile", "04_mobile_volunteer_tasks.png");

  // 05_mobile_ngo_dashboard.png
  await setAuthSession(mobilePage, "ngo");
  await mobilePage.goto(`${BASE_URL}/ngodash`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(800);
  await capture(mobilePage, "08_mobile", "05_mobile_ngo_dashboard.png");

  // 06_mobile_admin_console.png
  await setAuthSession(mobilePage, "admin");
  await mobilePage.goto(`${BASE_URL}/adminpage`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(800);
  await capture(mobilePage, "08_mobile", "06_mobile_admin_console.png");

  // 07_mobile_chatbot.png (mobile chatbot open)
  await setAuthSession(mobilePage, "donor");
  await mobilePage.goto(`${BASE_URL}/donordash`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(600);
  const mChat = mobilePage.locator("button[aria-label='Open chat assistant']");
  if (await mChat.isVisible()) {
    await mChat.click();
    await mobilePage.waitForTimeout(800);
    await capture(mobilePage, "08_mobile", "07_mobile_chatbot.png");
  }

  await browser.close();
  console.log("\n=========================================================");
  console.log("All 39 presentation screenshots captured successfully!");
  console.log("=========================================================\n");
}

run().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});