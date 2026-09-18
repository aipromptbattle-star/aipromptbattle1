# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test_login3.spec.ts >> Participant Login and Error
- Location: test_login3.spec.ts:4:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.textContent: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.bg-destructive')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: AI
      - heading "PROMPT BATTLE" [level=1] [ref=e7]
      - paragraph [ref=e8]: THINK. PROMPT. CREATE.
    - generic [ref=e10]:
      - generic [ref=e11]: ENTER THE BATTLE
      - alert [ref=e12]:
        - generic [ref=e15]: Access Denied
        - generic [ref=e16]: "INVALID ACCESS ID: Incorrect access code for this team."
      - generic [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]:
            - generic [ref=e20]: TEAM ID
            - button "MANUAL ENTRY" [ref=e21]
          - generic [ref=e22]:
            - generic [ref=e23]: APB-
            - textbox "TEAM ID" [ref=e24]:
              - /placeholder: "001"
              - text: "001"
        - generic [ref=e25]:
          - generic [ref=e26]: ACCESS CODE
          - textbox "ACCESS CODE" [ref=e27]:
            - /placeholder: ••••••
          - paragraph [ref=e28]: 6-character access pass assigned to your team
        - button "[ ENTER EVENT ]" [ref=e29]
    - generic [ref=e31]:
      - generic [ref=e32]: 30 OCTOBER 2026
      - generic [ref=e33]: SJBIT • BENGALURU
      - generic [ref=e34]: EVENT SYSTEM READY
  - button "Open Next.js Dev Tools" [ref=e42] [cursor=pointer]
  - alert [ref=e46]
```

# Test source

```ts
  1  | 
  2  | import { test, expect } from "@playwright/test";
  3  | 
  4  | test("Participant Login and Error", async ({ page }) => {
  5  |   await page.goto("http://localhost:3000/login");
  6  |   
  7  |   await page.fill("#teamId", "001");
  8  |   await page.click("button[type=submit]");
  9  |   
  10 |   await page.waitForTimeout(3000);
  11 |   
> 12 |   const errorText = await page.textContent(".bg-destructive");
     |                                ^ Error: page.textContent: Test timeout of 30000ms exceeded.
  13 |   if (errorText) {
  14 |     console.log("Found error:", errorText);
  15 |   } else {
  16 |     const text = await page.textContent("body");
  17 |     console.log("No error found, body:", text?.substring(0, 300));
  18 |   }
  19 | });
  20 | 
  21 | 
```