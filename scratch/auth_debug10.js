
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on("console", msg => console.log(`[CONSOLE] ${msg.text()}`));
  
  try {
    await page.goto("http://localhost:3000/login");
    await page.waitForTimeout(1000);
    await page.fill("#teamId", "APB001");
    await page.fill("#accessCode", "TEST2026");
    await page.click("button[type=\"submit\"]");
    
    await page.waitForTimeout(4000);
    
    const url = page.url();
    console.log("FINAL URL:", url);

    const alert = await page.$("div[role=\"alert\"]");
    if (alert) {
      console.log("ALERT TEXT:", await alert.innerText());
    }

  } catch (e) {
    console.error("Script error:", e);
  } finally {
    await browser.close();
  }
})();

