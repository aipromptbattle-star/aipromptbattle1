
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const logs = [];
  page.on("console", msg => {
    logs.push(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });
  page.on("pageerror", err => {
    logs.push(`[PAGEERROR] ${err.message}`);
  });
  page.on("requestfailed", request => {
    logs.push(`[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`);
  });
  page.on("response", async response => {
    if (response.status() >= 400) {
      logs.push(`[HTTP ${response.status()}] ${response.url()}`);
    }
  });

  try {
    console.log("Navigating to login...");
    await page.goto("http://localhost:3000/login");
    await page.waitForTimeout(2000);

    console.log("Injecting window.firebaseAuth capture...");
    await page.evaluate(() => {
      window.testLogs = [];
      const originalConsoleError = console.error;
      console.error = (...args) => {
        window.testLogs.push(args.join(" "));
        originalConsoleError.apply(console, args);
      };
    });

    console.log("Entering credentials...");
    await page.fill("#teamId", "TEST01");
    await page.fill("#accessCode", "TEST2026");

    console.log("Clicking [ ENTER EVENT ]...");
    await page.click("button[type=\"submit\"]");
    
    await page.waitForTimeout(5000);

    const clientLogs = await page.evaluate(() => window.testLogs);
    logs.push(...clientLogs.map(l => `[CLIENT CAPTURE] ${l}`));

  } catch (e) {
    console.log("Script error:", e);
  } finally {
    console.log("--- BROWSER LOGS ---");
    console.log(logs.join("\n"));
    await browser.close();
  }
})();

