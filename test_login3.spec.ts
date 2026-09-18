
import { test, expect } from "@playwright/test";

test("Participant Login and Error", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  
  await page.fill("#teamId", "001");
  await page.click("button[type=submit]");
  
  await page.waitForTimeout(3000);
  
  const errorText = await page.textContent(".bg-destructive");
  if (errorText) {
    console.log("Found error:", errorText);
  } else {
    const text = await page.textContent("body");
    console.log("No error found, body:", text?.substring(0, 300));
  }
});

