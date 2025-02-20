import { expect, test } from "@playwright/test";
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    // Get a unique place for the screenshot.
    const screenshotPath = testInfo.outputPath(`failure.png`);
    // Add it to the report.
    testInfo.attachments.push({ name: 'screenshot', path: screenshotPath, contentType: 'image/png' });
    // Take the screenshot itself.
    await page.screenshot({ path: screenshotPath, timeout: 5000 });
  }
});
test("connects to mikomo bank with oAuth", async ({ page }, testInfo) => {
  test.setTimeout(240000);

  const userId = crypto.randomUUID();

  await page.goto(
    `http://localhost:8080/widget?job_type=aggregate&user_id=${userId}`,
  );

  await page.getByPlaceholder("Search").fill("mikomo bank");

  // page.on('request', request => console.log('>>', request.method(), request.url()));
  // page.on('response', async (response) => {
  //   const body = await response.body();
  //   const bodyStr = body.byteLength > 1000 ? `body size: ${body.byteLength}` : body.toString();
  //   console.log('<<', response.status(), response.url(), bodyStr)
  // });

  await page.getByLabel("Add account with Mikomo Bank").click();
  
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Continue" }).click();

  const authorizeTab = await popupPromise;
  const url = await authorizeTab.url()
  console.log('popup => ' + url);
  const screenshotPath = testInfo.outputPath(`popup_login.png`);
  await authorizeTab.screenshot({ path: screenshotPath, timeout: 5000 });
  await authorizeTab.locator("input[type='text']").fill('mikomo_1');
  await authorizeTab.locator("input[type='password']").fill('mikomo_1');
  await authorizeTab.locator("button[type='submit']").click();

  await expect(
    authorizeTab.locator("div.terms-disclaimer"),
  ).toBeVisible();

  await authorizeTab.locator("button[value='#accounts']" ).click();

  await expect(
    authorizeTab.locator("button[id='accounts-approve']"),
  ).toBeVisible();

    
  await authorizeTab.locator("label.form-check-label").last().click();
  await authorizeTab.locator("button[id='accounts-approve']").click();

  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible({
    timeout: 120000,
  });

  const apiRequest = page.context().request;
  await apiRequest.delete(
    `http://localhost:8080/api/aggregator/akoya_sandbox/user/${userId}`,
  );
});
