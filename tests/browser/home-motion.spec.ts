import { expect, test, type Page, type TestInfo } from "@playwright/test";

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document, "Homepage should fit the viewport").toBeLessThanOrEqual(dimensions.viewport);
}

async function capture(page: Page, info: TestInfo, suffix = "") {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, image => image.decode().catch(() => undefined)));
  });
  const name = `/tmp/ani-home-${info.project.name}${suffix}`;
  await page.screenshot({ path: `${name}.png`, fullPage: false });
  await page.screenshot({ path: `${name}-full.png`, fullPage: true });
}

async function visitPreviewStates(page: Page) {
  const panel = page.getByRole("tabpanel");
  const scheduled = page.getByRole("tab", { name: "Scheduled", exact: true });
  await scheduled.click();
  await expect(scheduled).toHaveAttribute("aria-selected", "true");
  await expect(panel).toContainText("Episode 12");
  await expect(panel).toContainText("Your Sunday show");

  const waiting = page.getByRole("tab", { name: "Waiting", exact: true });
  await waiting.click();
  await expect(waiting).toHaveAttribute("aria-selected", "true");
  await expect(panel).toContainText("No date. No guesswork.");

  const completed = page.getByRole("tab", { name: "Completed", exact: true });
  await completed.click();
  await expect(completed).toHaveAttribute("aria-selected", "true");
  await expect(panel).toContainText("Story complete. Alerts stopped.");
  await expect(panel).not.toContainText("Episode 13");
}

test("animated homepage explains actual schedule states and keeps entry links reachable", async ({ page }, info) => {
  const errors = collectRuntimeErrors(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("data-motion", "running");
  await expect(page.getByRole("button", { name: "Pause animations", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Sign in", exact: true })).toHaveAttribute("href", "/login");
  for (const link of await page.locator('a[href="/signup"]').all()) {
    await expect(link).toHaveAttribute("href", "/signup");
  }
  expect(await page.locator('a[href="/signup"]').count()).toBeGreaterThan(0);
  await expectNoHorizontalOverflow(page);
  await capture(page, info);

  await visitPreviewStates(page);
  await page.locator("#how-it-works").scrollIntoViewIfNeeded();
  await expect(page.locator("#how-it-works")).toBeVisible();
  await expect(page.locator("#how-it-works")).toContainText("ntfy");
  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(page.locator("footer")).toBeVisible();
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  const backToOpening = page.getByRole("link", { name: "Back to the opening", exact: true });
  const footerLink = await backToOpening.boundingBox();
  const motionControl = await page.getByRole("button", { name: "Pause animations", exact: true }).boundingBox();
  expect(footerLink).not.toBeNull();
  expect(motionControl).not.toBeNull();
  expect(footerLink!.y).toBeGreaterThanOrEqual(0);
  expect(footerLink!.y + footerLink!.height).toBeLessThanOrEqual(await page.evaluate(() => innerHeight));
  expect(
    footerLink!.x + footerLink!.width <= motionControl!.x || motionControl!.x + motionControl!.width <= footerLink!.x ||
    footerLink!.y + footerLink!.height <= motionControl!.y || motionControl!.y + motionControl!.height <= footerLink!.y,
    "Persistent motion control should leave the footer link fully reachable",
  ).toBe(true);
  await backToOpening.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThanOrEqual(2);
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("motion can be paused and the preference survives reload", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "Pause animations", exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("data-motion", "paused");
  await expect(page.getByRole("button", { name: "Resume animations", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(animation =>
    animation.effect?.getTiming().iterations === Infinity && animation.playState === "running",
  ).length)).toBe(0);

  await page.reload();
  await expect(page.locator("main")).toHaveAttribute("data-motion", "paused");
  await page.getByRole("button", { name: "Resume animations", exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("data-motion", "running");
  await visitPreviewStates(page);
  expect(errors).toEqual([]);
});

test("decorative motion responds to scrolling visibility and system preference", async ({ page }, info) => {
  const errors = collectRuntimeErrors(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const hero = page.locator(".cinema-hero");
  const posterField = page.locator(".cinema-poster-field");
  const runningHeroLoops = () => hero.evaluate(element => element.getAnimations({ subtree: true }).filter(animation =>
    animation.effect?.getTiming().iterations === Infinity && animation.playState === "running",
  ).length);
  await expect.poll(runningHeroLoops).toBeGreaterThan(0);

  const initialTransform = await posterField.evaluate(element => getComputedStyle(element).transform);
  if (info.project.name === "desktop") {
    const bounds = await hero.boundingBox();
    expect(bounds).not.toBeNull();
    await page.mouse.move(bounds!.x + bounds!.width * 0.9, bounds!.y + bounds!.height * 0.4);
    await expect.poll(() => posterField.evaluate(element => getComputedStyle(element).transform)).not.toBe(initialTransform);
    await page.mouse.move(0, 0);
    await expect.poll(() => posterField.evaluate(element => getComputedStyle(element).transform)).toBe(initialTransform);
  }
  const beforeScroll = await posterField.evaluate(element => getComputedStyle(element).transform);
  await page.evaluate(() => scrollTo({ top: 180, behavior: "instant" }));
  await expect.poll(() => posterField.evaluate(element => getComputedStyle(element).transform)).not.toBe(beforeScroll);
  await page.locator(".cinema-scene").scrollIntoViewIfNeeded();
  const floatingPoster = page.locator(".cinema-poster-main .cinema-poster-float");
  const beforeFloat = await floatingPoster.evaluate(element => getComputedStyle(element).transform);
  await expect.poll(() => floatingPoster.evaluate(element => getComputedStyle(element).transform)).not.toBe(beforeFloat);

  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect.poll(() => hero.evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThan(0);
  await expect.poll(runningHeroLoops).toBe(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("button", { name: "Animations reduced by system preference", exact: true })).toBeDisabled();
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(animation =>
    animation.effect?.getTiming().iterations === Infinity && animation.playState === "running",
  ).length)).toBe(0);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.getByRole("button", { name: "Pause animations", exact: true })).toBeEnabled();
  await expect.poll(runningHeroLoops).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("preview tabs work with arrow keys and retain an accessible active panel", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/");
  const scheduled = page.getByRole("tab", { name: "Scheduled", exact: true });
  const waiting = page.getByRole("tab", { name: "Waiting", exact: true });
  const completed = page.getByRole("tab", { name: "Completed", exact: true });
  await scheduled.focus();
  await scheduled.press("ArrowRight");
  await expect(waiting).toBeFocused();
  await expect(waiting).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "Waiting", exact: true })).toContainText("No date. No guesswork.");
  await waiting.press("End");
  await expect(completed).toBeFocused();
  await expect(page.getByRole("tabpanel", { name: "Completed", exact: true })).toContainText("Story complete. Alerts stopped.");
  await completed.press("ArrowRight");
  await expect(scheduled).toBeFocused();
  await scheduled.press("ArrowLeft");
  await expect(completed).toBeFocused();
  await completed.press("Home");
  await expect(scheduled).toBeFocused();
  await expect(scheduled).toHaveAttribute("tabindex", "0");
  await expect(waiting).toHaveAttribute("tabindex", "-1");
  await expect(completed).toHaveAttribute("tabindex", "-1");
  await expect(page.getByRole("tabpanel", { name: "Scheduled", exact: true })).toContainText("Episode 12");
  expect(errors).toEqual([]);
});

test("pause and resume still work when browser storage is unavailable", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "setItem", {
      value() { throw new DOMException("Storage is disabled", "SecurityError"); },
      configurable: true,
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Pause animations", exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("data-motion", "paused");
  await page.getByRole("button", { name: "Resume animations", exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("data-motion", "running");
  expect(errors).toEqual([]);
});

test("system reduced motion preserves content and interactive preview", async ({ page }, info) => {
  const errors = collectRuntimeErrors(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("data-motion", "reduced");
  await expect(page.getByRole("button", { name: "Animations reduced by system preference", exact: true })).toBeDisabled();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await visitPreviewStates(page);
  await page.locator("#how-it-works").scrollIntoViewIfNeeded();
  await expect(page.locator("#how-it-works")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(animation =>
    animation.effect?.getTiming().iterations === Infinity && animation.playState === "running",
  ).length)).toBe(0);
  await expectNoHorizontalOverflow(page);
  await page.evaluate(() => scrollTo(0, 0));
  await capture(page, info, "-reduced");
  expect(errors).toEqual([]);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("server-rendered story and account links remain usable without inactive controls", async ({ page }) => {
    const errors = collectRuntimeErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Build my lineup", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Build my lineup", exact: true })).toHaveAttribute("href", "/signup");
    await expect(page.getByRole("tabpanel")).toContainText("Episode 12");
    await expect(page.locator(".preview-tabs")).not.toBeVisible();
    await expect(page.locator(".preview-note")).not.toBeVisible();
    await expect(page.locator(".motion-toggle")).not.toBeVisible();
    await page.locator("#how-it-works").scrollIntoViewIfNeeded();
    await expect(page.locator("#how-it-works")).toContainText("ntfy");
    await expect(page.locator("#how-it-works")).toBeVisible();
    expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === "running").length)).toBe(0);
    await expectNoHorizontalOverflow(page);
    await page.getByRole("link", { name: "Create your account", exact: true }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
