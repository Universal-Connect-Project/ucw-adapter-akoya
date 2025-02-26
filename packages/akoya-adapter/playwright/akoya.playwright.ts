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
test("connects to mikomo bank with oAuth and get data from data endpoints", async ({ page, request }, testInfo) => {
  test.setTimeout(240000);

  const userId = crypto.randomUUID();

  await page.goto(
    `http://localhost:8080/widget?job_type=aggregate&user_id=${userId}`,
  );

  await page.getByPlaceholder("Search").fill("mikomo bank");

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

  const connectedPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(reject, 12000);
    page.on("console", async (msg : any) => {
      const obj = await msg.args()[0].jsonValue()
      if(obj?.type === 'vcs/connect/memberConnected'){
        const { user_guid, member_guid } = obj.metadata;
        const app = (await page.evaluate(() => window["app"])) || {};
        const { connect: connectConfig, ...clientConfig } = app["clientConfig"];
        const aggregator = "akoya_sandbox";
            
        const instrumentationData = {
          message: "widget-config",
          instrumentation: {
            ...clientConfig,
            ...connectConfig,
            current_aggregator: aggregator,
            aggregator
          },
        };
  
        let accountId;
        await request.get(`http://localhost:8080/api/data/aggregator/${aggregator}/user/${encodeURIComponent(user_guid)}/connection/${member_guid}/accounts`, {
          headers: {
            meta: JSON.stringify(instrumentationData.instrumentation),
          },
        }).then(async (response) => {
          const text = await response.text()
          const accounts = JSON.parse(text)
          expect(accounts?.accounts?.length).toBeGreaterThanOrEqual(1)
          const account = accounts.accounts[0];
          accountId = account[Object.keys(account)[0]].accountId
        });
        await request.get(`http://localhost:8080/api/data/aggregator/${aggregator}/user/${encodeURIComponent(user_guid)}/connection/${member_guid}/identity`, {
          headers: {
            meta: JSON.stringify(instrumentationData.instrumentation),
          },
        }).then(async (response) => {
          const text = await response.text()
          const customers = JSON.parse(text)
          expect(customers?.customers?.length).toBeGreaterThanOrEqual(1)
        });
        expect(accountId).not.toBeNull()
        const end = new Date()
        const start = new Date(new Date().setFullYear(end.getFullYear() - 1));
        await request.get(`http://localhost:8080/api/data/aggregator/${aggregator}/user/${encodeURIComponent(user_guid)}/account/${accountId}/transactions?connection_id=${member_guid}&start_time=${start}&end_time=${end}`, {
          headers: {
            meta: JSON.stringify(instrumentationData.instrumentation),
          },
        }).then(async (response) => {
          const text = await response.text()
          const trans = JSON.parse(text)
          expect(trans?.transactions?.length).toBeGreaterThanOrEqual(0)
        });
        clearTimeout(timer)
        resolve('');
      }
    })
  })

  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible({
    timeout: 120000,
  });

  await connectedPromise;

  const apiRequest = page.context().request;
  await apiRequest.delete(
    `http://localhost:8080/api/aggregator/akoya_sandbox/user/${userId}`,
  );
});
