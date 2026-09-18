
const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  
  try {
    const page = await context.newPage();
    
    // 3. Organizer Add Judge
    console.log("Capturing Organizer Add Judge Modal...");
    await page.goto("http://localhost:3000/organizer/judging");
    await page.waitForTimeout(2000); 
    await page.click("button:has-text(\"Add Judge Account\")");
    await page.waitForTimeout(1000); 
    await page.screenshot({ path: "C:/Users/Asus/.gemini/antigravity/brain/919e80e2-727d-4a3b-a4cc-2d3458cf269e/add_judge_modal.png" });
    
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();

