
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // We can assume user is logged in if we run against our local state.
    // If we need to login, we can navigate to organizer-login first.
    await page.goto("http://localhost:3000/organizer-login");
    await page.waitForTimeout(1000);
    // If we see login inputs, fill them
    const passInput = await page.$("input[type=\"password\"]");
    if (passInput) {
      await page.fill("input[type=\"password\"]", "vigyantra2026");
      await page.click("button[type=\"submit\"]");
      await page.waitForTimeout(2000);
    }
    
    // Now we are at /organizer
    await page.goto("http://localhost:3000/organizer");
    await page.waitForTimeout(2000);
    console.log("On Overview page, URL:", page.url());

    // Check sizes
    let box = await page.evaluate(() => {
      const el = document.querySelector("main");
      return { width: el.clientWidth, scrollWidth: el.scrollWidth };
    });
    console.log("Overview Main Width:", box);

    // Go to Participant Board
    await page.click("text=Participant Board");
    await page.waitForTimeout(2000);
    console.log("On Participant Board, URL:", page.url());

    box = await page.evaluate(() => {
      const el = document.querySelector("main");
      return { width: el.clientWidth, scrollWidth: el.scrollWidth };
    });
    console.log("Participant Board Main Width:", box);

    // Go to Live Control
    await page.click("text=Live Control");
    await page.waitForTimeout(2000);
    console.log("On Live Control, URL:", page.url());

  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();

