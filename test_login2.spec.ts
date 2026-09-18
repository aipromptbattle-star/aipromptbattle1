
import { test, expect } from "@playwright/test";

test("Participant Login and Dashboard", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  
  await page.fill("#teamId", "001");
  await page.click("button[type=submit]");
  
  await page.waitForURL("**/team**");
  console.log("SUCCESSFULLY REACHED TEAM DASHBOARD!");
  
  // Wait for the workspace to load
  await page.waitForSelector("text=ROUND 0", { timeout: 10000 }).catch(() => {});
  
  const bodyText = await page.textContent("body");
  if (bodyText) {
    console.log("Found text containing: ", bodyText.includes("Round Paused") ? "Round Paused" : "Other text");
    console.log("Team ID is visible?", bodyText.includes("001"));
  }
});

