import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import type { AnimeSearchResult } from "../../src/lib/anilist";

const target = new URL(process.env.DATABASE_URL ?? "http://invalid");
if (!["127.0.0.1", "localhost"].includes(target.hostname) || !target.pathname.includes("ani_reminder_qa")) throw new Error("Browser fixtures require the isolated QA database");
const db = new PrismaClient();
test.afterAll(async () => db.$disconnect());

async function capture(page: Page, info: TestInfo, surface: string, fullPage = true) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => undefined)));
  });
  const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  expect(dimensions.scroll, `${surface} should not overflow horizontally`).toBeLessThanOrEqual(dimensions.width);
  await page.screenshot({ path: `/tmp/ani-${info.project.name}-${surface}.png`, fullPage });
}

test("public and account entry pages stay readable across screen sizes", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("THE WAIT.");
  await expect(page.getByText("Illustrative example", { exact: true })).toBeVisible();
  await capture(page, info, "home");
  await page.goto("/login");
  await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
  await capture(page, info, "login");
  await page.goto("/signup");
  await expect(page.getByLabel("Your ntfy topic", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Generate one", exact: true }).click();
  await expect(page.getByLabel("Your ntfy topic", { exact: true })).toHaveValue(/^ani_[a-f0-9]{32}$/);
  await capture(page, info, "signup");
  expect(errors).toEqual([]);
});

test("weekly agenda completed library settings and search work together", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const user = await db.user.findUniqueOrThrow({ where: { email: "qa@anireminder.example" } });
  await db.animeReminder.updateMany({ where: { userId: user.id, anilistId: 21 }, data: { enabled: true } });
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("AniReminder-QA-2026");
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Your week, on cue." })).toBeVisible();
  await expect(page.locator("main")).toContainText("One Piece");
  await capture(page, info, "week");
  if (info.project.name === "mobile") {
    await page.locator(".app-footer").scrollIntoViewIfNeeded();
    const footer = await page.locator(".app-footer").boundingBox();
    const navigation = await page.getByRole("navigation", { name: "Mobile navigation" }).boundingBox();
    expect(footer).not.toBeNull();
    expect(navigation).not.toBeNull();
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(navigation!.y);
    await capture(page, info, "week-bottom", false);
  }
  await page.goto("/dashboard?view=completed");
  await expect(page.locator("main")).toContainText("Frieren");
  await expect(page.locator("main")).not.toContainText("AIRING NOW");
  await page.goto("/dashboard?view=lineup");
  await page.getByRole("button", { name: "Awaiting schedule", exact: true }).click();
  await expect(page.locator(".lineup-list")).toContainText("Solo Leveling");
  await expect(page.locator(".lineup-list")).not.toContainText("One Piece");
  await page.getByRole("button", { name: "All shows", exact: true }).click();
  await page.getByRole("button", { name: "Add anime", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search anime titles" })).toBeFocused();
  const followed = await db.animeReminder.findFirstOrThrow({ where: { userId: user.id, anilistId: 21 } });
  const results: AnimeSearchResult[] = [{
    anilistId: 21, malId: null, title: followed.title, titleEnglish: null, imageUrl: followed.imageUrl,
    type: "TV", episodes: null, status: "RELEASING", airing: true, nextAiringAt: followed.nextAiringAt?.toISOString() ?? null,
    broadcastDay: null, broadcastTime: null, broadcastTimezone: "Asia/Kolkata", nextEpisode: followed.nextEpisode, nextAiringId: null,
  }, {
    anilistId: 213702, malId: null, title: "Witch Hat Atelier Season 2", titleEnglish: null,
    imageUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx213702-vCWQFcAfDF8c.jpg",
    type: "TV", episodes: null, status: "NOT_YET_RELEASED", airing: false, nextAiringAt: null,
    broadcastDay: null, broadcastTime: null, broadcastTimezone: "Asia/Kolkata", nextEpisode: null, nextAiringId: null,
  }];
  await page.route("**/api/anime/search?*", route => route.fulfill({ json: { results } }));
  await page.getByRole("searchbox", { name: "Search anime titles" }).fill("anime");
  await expect(dialog.locator(".search-result")).toHaveCount(2);
  await expect(dialog.getByRole("button", { name: "In your lineup" })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Follow show" })).toBeEnabled();
  await capture(page, info, "search");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Add anime", exact: true })).toBeFocused();
  await page.goto("/dashboard?view=settings");
  await expect(page.getByRole("heading", { name: "Your alerts", exact: true })).toBeVisible();
  const checkbox = page.getByRole("checkbox").first();
  await checkbox.uncheck();
  await page.getByRole("button", { name: "Save preferences", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("saved");
  await page.reload();
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  await page.getByRole("button", { name: "Save preferences", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("saved");
  await capture(page, info, "settings");
  const historyResponse = page.waitForResponse(response => new URL(response.url()).pathname === "/api/notifications" && response.request().method() === "GET");
  await page.goto("/dashboard?view=activity");
  const response = await historyResponse;
  expect(response.ok()).toBeTruthy();
  await expect(page.getByText("Loading your notification history…", { exact: true })).not.toBeVisible();
  await expect(page.locator(".activity-list, .empty-state")).toBeVisible();
  await capture(page, info, "activity");
  expect(errors).toEqual([]);
});
