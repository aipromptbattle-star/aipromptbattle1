
import { test, expect } from "@playwright/test";

test("Participant Login Flow", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  
  await page.fill("#teamId", "001");
  await page.click("button[type=submit]");
  
  await page.waitForTimeout(3000);
  
  const bodyText = await page.textContent("body");
  console.log("BODY AFTER SUBMIT:");
  console.log(bodyText);
});

