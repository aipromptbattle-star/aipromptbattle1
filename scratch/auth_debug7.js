
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on("console", msg => {
    console.log(`[BROWSER CONSOLE] ${msg.text()}`);
  });

  try {
    await page.goto("http://localhost:3000/login");
    await page.waitForTimeout(1000);
    await page.fill("#teamId", "TEST01");
    await page.fill("#accessCode", "TEST2026");
    await page.click("button[type=\"submit\"]");
    
    await page.waitForTimeout(5000);

  } catch (e) {
    console.error("Script error:", e);
  } finally {
    await browser.close();
  }
})();

