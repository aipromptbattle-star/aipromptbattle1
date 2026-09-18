
const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  
  try {
    const page = await context.newPage();
    
    // 2. Judge Dashboard
    console.log("Capturing Judge Dashboard...");
    await page.goto("http://localhost:3000/judge");
    await page.waitForTimeout(2000); // let animations settle
    await page.screenshot({ path: "C:/Users/Asus/.gemini/antigravity/brain/919e80e2-727d-4a3b-a4cc-2d3458cf269e/judge_dashboard.png" });
    
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();

