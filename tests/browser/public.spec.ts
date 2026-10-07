import { expect, test } from "@playwright/test";

test("homepage gives a clear path to account creation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("main")).toBeVisible();
  const signup = page.locator('a[href="/signup"]').first();
  await expect(signup).toBeVisible();
  await signup.click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("auth pages render without overflow and recover from bad credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill("absent@example.test");
  await page.getByLabel("Password", { exact: true }).fill("incorrect-password");
  await page.locator('button[type="submit"]').click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeEnabled();
  const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
});

test("protected API refuses unauthenticated callers", async ({ request }) => {
  for (const path of ["/api/reminders", "/api/account", "/api/notifications"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect([401, 302, 303, 307]).toContain(response.status());
  }
});
