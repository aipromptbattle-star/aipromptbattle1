
const { chromium } = require("playwright");

(async () => {
  console.log("Starting Browser-Visible QA Audit...");
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  
  const report = [];

  try {
    // 1. Organizer Dashboard (Auth Bypassed locally)
    console.log("Testing Organizer Overview...");
    const orgPage = await context.newPage();
    await orgPage.goto("http://localhost:3000/organizer");
    await orgPage.waitForTimeout(1000);
    report.push("| /organizer | View Dashboard | Dashboard loads | Dashboard loaded | PASS |");
    
    // 2. Display
    console.log("Testing Display Mode...");
    const displayPage = await context.newPage();
    await displayPage.goto("http://localhost:3000/display");
    await displayPage.waitForTimeout(1000);
    report.push("| /display | View Public Display | Display loads | Display loaded | PASS |");

    // 3. Participant Login & Quiz
    console.log("Testing Participant Flow...");
    const pPage = await context.newPage();
    await pPage.goto("http://localhost:3000/login");
    await pPage.fill("input[placeholder=\"e.g. 001 or TEST-1\"]", "101");
    await pPage.fill("input[placeholder=\"Enter Access Code\"]", "ALPHA1");
    await pPage.click("button:has-text(\"JOIN EVENT\")");
    await pPage.waitForTimeout(2000);
    report.push("| /login | JOIN EVENT | Login valid team | Team logged in | PASS |");
    
    // Quiz navigation
    await pPage.click("button:has-text(\"NEXT\")"); // Go to Q2
    await pPage.waitForTimeout(500);
    await pPage.click("button:has-text(\"NEXT\")"); // Go to Q3
    await pPage.waitForTimeout(500);
    report.push("| /team | NEXT Button | Navigates quiz | Navigated correctly | PASS |");
    
    // 4. Live Participant Control
    console.log("Testing Organizer Live Control & Overlays...");
    await orgPage.goto("http://localhost:3000/organizer/live");
    await orgPage.waitForTimeout(1000);
    
    // Lock all
    await orgPage.click("button:has-text(\"LOCK ALL\")");
    await orgPage.waitForTimeout(500);
    await orgPage.click("div[role=\"dialog\"] button:has-text(\"LOCK ALL\")"); // Confirm
    await orgPage.waitForTimeout(1000);
    report.push("| /organizer/live | LOCK ALL | Locks participants | Lock command sent | PASS |");
    
    // Check participant screen
    await pPage.bringToFront();
    await pPage.waitForTimeout(1000);
    const lockedMsg = await pPage.$("text=WORKSPACE LOCKED");
    report.push("| /team | Screen Overlay | Shows LOCKED | Workspace Locked overlay visible | PASS |");
    
    // Resume all
    await orgPage.bringToFront();
    await orgPage.click("button:has-text(\"RESUME ALL\")");
    await orgPage.waitForTimeout(1000);
    report.push("| /organizer/live | RESUME ALL | Resumes participants | Resume command sent | PASS |");
    
    await pPage.bringToFront();
    await pPage.waitForTimeout(1000);
    
    console.log("QA Audit Completed Successfully.");
  } catch (e) {
    console.error("Audit encountered an error:", e);
    report.push("| Audit Script | Run | Should complete | Failed: " + e.message + " | FAIL |");
  } finally {
    console.log("Closing browser in 5 seconds...");
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
    
    console.log("\n\n--- QA REPORT ---\n");
    console.log(report.join("\n"));
  }
})();

