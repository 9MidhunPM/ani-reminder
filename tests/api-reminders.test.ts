import assert from "node:assert/strict";
import test from "node:test";
import type { AnimeReminder } from "@prisma/client";
import type { AnimeSearchResult } from "../src/lib/anilist";
import { reminderHandlers, type ReminderDependencies } from "../src/lib/api-reminders";

process.env.AUTH_URL = "http://localhost:3000";

const id = "c12345678901234567890";
const now = new Date("2026-10-07T12:00:00Z");
const reminder: AnimeReminder = {
  id, userId: "owner", anilistId: 12, malId: null, title: "A real series", titleEnglish: null, imageUrl: "",
  nextEpisode: null, nextAiringAt: null, nextAiringId: null, mediaStatus: "RELEASING", scheduleState: "WAITING",
  scheduleCheckedAt: now, nextCheckAt: now, syncError: null, broadcastDay: null, broadcastTime: null,
  broadcastTimezone: null, totalEpisodes: null, enabled: false, morningNotifiedFor: null,
  airtimeNotifiedFor: null, createdAt: now, updatedAt: now,
};
const anime: AnimeSearchResult = {
  anilistId: 12, malId: null, title: "A real series", titleEnglish: null, imageUrl: "", type: "TV",
  episodes: null, status: "RELEASING", airing: true, nextAiringAt: null, broadcastDay: null,
  broadcastTime: null, broadcastTimezone: "Asia/Kolkata", nextEpisode: null, nextAiringId: null,
};
function request(body: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/reminders", { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify(body) });
}
function setup(overrides: Partial<ReminderDependencies> = {}) {
  const writes: unknown[] = [];
  const handlers = reminderHandlers({
    authenticate: async () => "owner",
    list: async (owner) => { assert.equal(owner, "owner"); return [reminder]; },
    find: async (owner, target) => { assert.equal(owner, "owner"); return target === id ? reminder : null; },
    findExisting: async () => null,
    getAnime: async () => anime,
    create: async (owner, value) => { writes.push({ create: owner, value }); return { ...reminder, enabled: true }; },
    setEnabled: async (owner, target, enabled) => { writes.push({ owner, target, enabled }); return { ...reminder, enabled }; },
    remove: async (owner, target) => { writes.push({ remove: owner, target }); return true; },
    reconcile: async (record, snapshot) => { writes.push({ reconcile: record.id, snapshot }); return { ...record, scheduleState: "WAITING" }; },
    serialize: (record) => ({ id: record.id, anilistId: record.anilistId, title: record.title, titleEnglish: record.titleEnglish,
      imageUrl: record.imageUrl, nextEpisode: record.nextEpisode, nextAiringAt: null, totalEpisodes: record.totalEpisodes,
      enabled: record.enabled, scheduleState: record.scheduleState, mediaStatus: record.mediaStatus,
      scheduleCheckedAt: now.toISOString(), syncError: null, createdAt: now.toISOString() }),
    ...overrides,
  });
  return { handlers, writes };
}

test("GET owner-scopes and returns only the public reminder projection", async () => {
  const response = await setup().handlers.GET();
  const body = await response.json();
  assert.equal(body.reminders.length, 1);
  assert.equal("userId" in body.reminders[0], false);
});

test("adding a valid unscheduled title keeps null episode and waiting state", async () => {
  const { handlers, writes } = setup();
  const response = await handlers.POST(request({ anilistId: 12 }));
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.reminder.nextEpisode, null);
  assert.equal(body.reminder.nextAiringAt, null);
  assert.equal(body.reminder.scheduleState, "WAITING");
  assert.equal(body.created, true);
  assert.equal(writes.length, 2);
});

test("a duplicate add preserves paused state and does not contact provider", async () => {
  const { handlers, writes } = setup({ findExisting: async () => reminder, getAnime: async () => { throw new Error("Must not fetch"); } });
  const response = await handlers.POST(request({ anilistId: 12 }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.tracked, true);
  assert.equal(body.reminder.enabled, false);
  assert.deepEqual(writes, []);
});

test("concurrent duplicate adds converge without resuming or reconciling the winner", async () => {
  let lookups = 0;
  const { handlers, writes } = setup({
    findExisting: async () => ++lookups < 3 ? null : reminder,
    create: async () => { throw Object.assign(new Error("Unique constraint"), { code: "P2002" }); },
  });
  const response = await handlers.POST(request({ anilistId: 12 }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.tracked, true);
  assert.equal(body.reminder.enabled, false);
  assert.deepEqual(writes, []);
});

test("ended titles and provider failures never create reminders", async () => {
  for (const status of ["FINISHED", "CANCELLED"]) {
    const { handlers, writes } = setup({ getAnime: async () => ({ ...anime, status }) });
    assert.equal((await handlers.POST(request({ anilistId: 12 }))).status, 422);
    assert.deepEqual(writes, []);
  }
  const { handlers, writes } = setup({ getAnime: async () => { throw new Error("upstream timeout"); } });
  assert.equal((await handlers.POST(request({ anilistId: 12 }))).status, 502);
  assert.deepEqual(writes, []);
});

test("resume rechecks the provider and failures leave paused records untouched", async () => {
  const { handlers, writes } = setup({ getAnime: async () => { throw new Error("offline"); } });
  assert.equal((await handlers.PATCH(request({ enabled: true }), id)).status, 502);
  assert.deepEqual(writes, []);
  const resumed = setup();
  assert.equal((await resumed.handlers.PATCH(request({ enabled: true }), id)).status, 200);
  assert.equal(resumed.writes.length, 2);
});

test("all reminder mutation paths reject cross-owner and unauthenticated access", async () => {
  const missing = setup({ find: async () => null, remove: async () => false });
  assert.equal((await missing.handlers.PATCH(request({ enabled: false }), id)).status, 404);
  assert.equal((await missing.handlers.DELETE(request({}), id)).status, 404);
  assert.deepEqual(missing.writes, []);
  const anonymous = setup({ authenticate: async () => null });
  assert.equal((await anonymous.handlers.GET()).status, 401);
  assert.equal((await anonymous.handlers.POST(request({ anilistId: 12 }))).status, 401);
  assert.equal((await anonymous.handlers.PATCH(request({ enabled: true }), id)).status, 401);
  assert.equal((await anonymous.handlers.DELETE(request({}), id)).status, 401);
  assert.deepEqual(anonymous.writes, []);
});

test("reminder writes reject cross-origin and malformed payloads", async () => {
  const { handlers, writes } = setup();
  assert.equal((await handlers.POST(request({ anilistId: 12 }, "https://evil.example"))).status, 403);
  assert.equal((await handlers.PATCH(request({ enabled: true }, "https://evil.example"), id)).status, 403);
  assert.equal((await handlers.DELETE(request({}, "https://evil.example"), id)).status, 403);
  assert.equal((await handlers.POST(request({ anilistId: 12, nextEpisode: 999 }))).status, 400);
  assert.equal((await handlers.PATCH(request({ enabled: "yes" }), id)).status, 400);
  assert.deepEqual(writes, []);
});
