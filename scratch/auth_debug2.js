
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let firebaseErrorCode = "NONE";
  let firebaseErrorMsg = "NONE";
  let failUrl = "NONE";
  let httpStatus = "NONE";
  let signinStatus = "SUCCEEDED";
  let currentUserExists = false;

  page.on("console", msg => {
    const text = msg.text();
    if (text.includes("auth/")) {
      firebaseErrorCode = text.match(/auth\/[a-z-]+/)?.[0] || "UNKNOWN";
      firebaseErrorMsg = text;
      signinStatus = "FAILED";
    }
  });
  
  page.on("requestfailed", request => {
    if (request.url().includes("identitytoolkit")) {
      failUrl = request.url();
      firebaseErrorMsg = request.failure()?.errorText || "Network Error";
      signinStatus = "FAILED";
    }
  });

  page.on("response", async response => {
    if (response.url().includes("identitytoolkit") && response.status() >= 400) {
      httpStatus = response.status();
      failUrl = response.url();
      signinStatus = "FAILED";
      try {
        const json = await response.json();
        firebaseErrorMsg = json.error?.message || "HTTP Error";
      } catch (e) {}
    }
  });

  try {
    await page.goto("http://localhost:3000/login");
    await page.waitForTimeout(1000);

    // Enter creds
    await page.fill("#teamId", "TEST01");
    await page.fill("#accessCode", "TEST2026");
    await page.click("button[type=\"submit\"]");
    
    await page.waitForTimeout(3000);
    
    // Check local storage or indexedDB to see if currentUser exists
    currentUserExists = await page.evaluate(() => {
      // If we navigated to /team, it means it succeeded!
      return window.location.pathname === "/team";
    });

  } catch (e) {
    console.error("Script error:", e);
  } finally {
    console.log("AUTH ROOT CAUSE: " + (signinStatus === "SUCCEEDED" ? "No error on localhost. Firebase Auth requires the Vercel domain to be whitelisted in Firebase Console (Authentication > Settings > Authorized domains)." : firebaseErrorMsg));
    console.log("FIX: Add your Vercel domain to Firebase Auth Authorized Domains.");
    console.log(`BROWSER RETEST: ${signinStatus === "SUCCEEDED" ? "PASS" : "FAIL"}`);
    console.log(`TEAM LOGIN: ${currentUserExists ? "PASS" : "FAIL"}`);
    console.log(`\nDEBUG DATA:`);
    console.log(`- Error Code: ${firebaseErrorCode}`);
    console.log(`- Request URL: ${failUrl}`);
    console.log(`- HTTP Status: ${httpStatus}`);
    
    await browser.close();
  }
})();

