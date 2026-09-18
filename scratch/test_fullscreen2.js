
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto("http://localhost:3000/organizer-login");
    await page.waitForTimeout(1000);
    // If we see login inputs, fill them
    const passInput = await page.$("input[type=\"password\"]");
    if (passInput) {
      // It says "Your Google account is not authorized as an organizer"
      // Wait, let us just use the UI button: <APBButton onClick={handleTestLogin}>Login as Test Organizer</APBButton>
      const testBtn = await page.$("button:has-text(\"Login as Test Organizer\")");
      if (testBtn) {
        await testBtn.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Now we are at /organizer
    await page.goto("http://localhost:3000/organizer");
    await page.waitForTimeout(2000);
    console.log("On Overview page, URL:", page.url());

    // Check sizes
    let box = await page.evaluate(() => {
      const el = document.querySelector("main");
      return { width: el.clientWidth, scrollWidth: el.scrollWidth, vw: window.innerWidth };
    });
    console.log("Overview Main Width:", box);

    // Go to Participant Board
    await page.click("text=Participant Board");
    await page.waitForTimeout(2000);
    console.log("On Participant Board, URL:", page.url());

    box = await page.evaluate(() => {
      const el = document.querySelector("main");
      return { width: el.clientWidth, scrollWidth: el.scrollWidth, vw: window.innerWidth };
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

