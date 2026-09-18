
const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  
  try {
    const page = await context.newPage();
    
    // 1. Participant Login
    console.log("Capturing Participant Login...");
    await page.goto("http://localhost:3000/login");
    await page.waitForTimeout(2000); // let animations settle
    await page.screenshot({ path: "C:/Users/Asus/.gemini/antigravity/brain/919e80e2-727d-4a3b-a4cc-2d3458cf269e/participant_login.png" });
    
    // 2. Judge Dashboard
    // To see the dashboard, we need to bypass judge auth or just login as a judge.
    // Wait, we can bypass judge auth in dev mode just like we did for organizer!
    // Or we can just capture the UI preview if it exists? There is a ui-preview route!
    // Let us see if I can login as judge. I can create a judge account via Firebase API or just use the local test judge bypass.
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();

