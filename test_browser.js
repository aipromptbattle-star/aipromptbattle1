
const { chromium } = require("playwright");

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  console.log("Navigating to http://localhost:3000 ...");
  await page.goto("http://localhost:3000");
  await page.waitForTimeout(5000);
  await browser.close();
  console.log("Done.");
})();

