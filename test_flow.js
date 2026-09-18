
const { chromium } = require("playwright");

(async () => {
  console.log("Launching visible browser for QA Audit demo...");
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Participant Login
    console.log("Navigating to Login...");
    await page.goto("http://localhost:3000/login");
    
    console.log("Typing Team ID...");
    await page.fill("input[placeholder=\"e.g. APB-017\"]", "APB-101");
    console.log("Typing Access Code...");
    await page.fill("input[placeholder=\"Enter Access Code\"]", "ALPHA1");
    
    console.log("Clicking Join...");
    await page.click("button:has-text(\"Join Event\")");
    
    console.log("Waiting for Dashboard to load...");
    await page.waitForTimeout(3000);
    
    // Check Quiz Workspace
    console.log("Testing Quiz Navigation...");
    await page.click("button:has-text(\"NEXT\")"); // Go to Q2
    await page.waitForTimeout(1000);
    await page.click("button:has-text(\"NEXT\")"); // Go to Q3
    await page.waitForTimeout(1000);
    
    // Select Option A on Q3
    console.log("Answering Question...");
    const optionButton = await page.$("button:has-text(\"A.\")");
    if (optionButton) await optionButton.click();
    await page.waitForTimeout(1000);
    
    // Open Submission Warning
    console.log("Testing Submit Warning...");
    const submitButton = await page.$("button:has-text(\"SAVE & SUBMIT\")");
    if (submitButton) {
      // Just jump to last question to see submit button
      await page.click("button:has-text(\"20\")");
      await page.waitForTimeout(1000);
      await page.click("button:has-text(\"SAVE & SUBMIT\")");
      await page.waitForTimeout(2000);
      
      // Cancel
      await page.click("button:has-text(\"CANCEL\")");
    }
    
    console.log("Audit Demo Finished Successfully.");
  } catch (e) {
    console.error("Audit encountered an error:", e);
  } finally {
    console.log("Closing browser in 5 seconds...");
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();

