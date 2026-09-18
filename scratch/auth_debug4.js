
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto("http://localhost:3000/login");
    await page.waitForTimeout(1000);
    await page.fill("#teamId", "TEST01");
    await page.fill("#accessCode", "TEST2026");
    await page.click("button[type=\"submit\"]");
    
    await page.waitForTimeout(3000);
    
    // Check if there is an alert
    const errorText = await page.locator("div[role=\"alert\"]").textContent({ timeout: 1000 }).catch(() => "NO_ALERT");
    console.log("UI ERROR MESSAGE:", errorText);

  } catch (e) {
    console.error("Script error:", e);
  } finally {
    await browser.close();
  }
})();

