
import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log("Navigating to login...");
    await page.goto("http://localhost:3000/");
    await page.waitForTimeout(1000);

    const testBtn = await page.$("button:has-text(\"Login as Test Team\")");
    if (testBtn) {
      await testBtn.click();
      console.log("Clicked test login");
      await page.waitForTimeout(3000);
    } else {
      console.log("No test login button found, maybe already logged in?");
    }

    console.log("URL after login:", page.url());

    // We should be on /team
    // Let us answer a question
    const q1OptA = await page.$("button:has-text(\"Option A\")");
    if (q1OptA) {
      console.log("Found quiz option! Clicking...");
      await q1OptA.click();
      await page.waitForTimeout(1000);
    } else {
      console.log("Quiz option A not found. Is it a quiz round?");
    }

    console.log("Waiting for auto-submit...");
    // We would need to set the deadline to be short to test this locally.
    // I will just wait 10 seconds and see if it submits.
    await page.waitForTimeout(10000);

    const timeUp = await page.$("text=TIME UP — YOUR QUIZ HAS BEEN AUTOMATICALLY SUBMITTED");
    if (timeUp) {
      console.log("Quiz auto-submitted successfully!");
    } else {
      console.log("Quiz did not auto-submit within 10s.");
    }
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();

