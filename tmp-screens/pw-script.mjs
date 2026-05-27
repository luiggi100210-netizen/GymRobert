
const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  // fill login
  const inputs = await page.locator('input').all();
  await inputs[0].fill('admin');
  await inputs[1].fill('admin123');
  await page.locator('button').first().click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'dashboard.png' });
  await browser.close();
})();
