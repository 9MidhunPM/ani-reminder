import assert from "node:assert/strict";
import test from "node:test";
import type { NotificationDelivery } from "@prisma/client";
import { notificationHandlers, type NotificationDependencies } from "../src/lib/api-notifications";

const now = new Date("2026-10-07T12:00:00Z");
const notification: NotificationDelivery = {
  id: "c12345678901234567890", userId: "owner", anilistId: null, episode: null, kind: "TEST", state: "SENT",
  title: "Test notification", airingAt: null, sourceId: null, scheduledFor: now, claimedAt: now, sentAt: now,
  error: null, receiptId: "private-receipt", attempts: 1, createdAt: now, updatedAt: now,
};
function request(body: unknown = {}, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/notifications", { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify(body) });
}
function setup(overrides: Partial<NotificationDependencies> = {}) {
  const actions: string[] = [];
  const handlers = notificationHandlers({
    authenticate: async () => "owner",
    cursorExists: async (owner) => { assert.equal(owner, "owner"); return true; },
    list: async (owner) => { assert.equal(owner, "owner"); return [notification]; },
    rateLimit: async (owner) => { actions.push(`limit:${owner}`); return { allowed: true, retryAfter: 0 }; },
    test: async (owner) => { actions.push(`test:${owner}`); return { notification, testNotification: "sent" }; },
    ...overrides,
  });
  return { handlers, actions };
}

test("history is owner scoped, bounded to fifty, and excludes provider receipts", async () => {
  const rows = Array.from({ length: 51 }, (_, index) => ({ ...notification, id: `c${String(index).padStart(20, "0")}` }));
  const { handlers } = setup({ list: async (owner) => { assert.equal(owner, "owner"); return rows; } });
  const body = await (await handlers.GET(new Request("http://localhost:3000/api/notifications"))).json();
  assert.equal(body.notifications.length, 50);
  assert.equal(body.nextCursor, rows[49].id);
  assert.equal("userId" in body.notifications[0], false);
  assert.equal("receiptId" in body.notifications[0], false);
});

test("foreign cursors cannot read or page another owner's history", async () => {
  const { handlers } = setup({ cursorExists: async () => false, list: async () => { throw new Error("Must not list"); } });
  assert.equal((await handlers.GET(new Request(`http://localhost:3000/api/notifications?cursor=${notification.id}`))).status, 404);
  assert.equal((await handlers.GET(new Request("http://localhost:3000/api/notifications?cursor=bad"))).status, 400);
});

test("explicit tests are rate limited before publishing", async () => {
  const { handlers, actions } = setup({ rateLimit: async () => ({ allowed: false, retryAfter: 42 }) });
  const response = await handlers.POST(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "42");
  assert.deepEqual(actions, []);
});

test("test API returns uncertain outcome without falsely reporting success", async () => {
  const { handlers } = setup({ test: async () => ({ notification: { ...notification, state: "UNCERTAIN", sentAt: null }, testNotification: "uncertain" }) });
  const body = await (await handlers.POST(request())).json();
  assert.equal(body.testNotification, "uncertain");
  assert.equal(body.notification.sentAt, null);
});

test("test writes reject unauthorized, cross-origin, and arbitrary notification content", async () => {
  const anonymous = setup({ authenticate: async () => null });
  assert.equal((await anonymous.handlers.GET(new Request("http://localhost:3000/api/notifications"))).status, 401);
  assert.equal((await anonymous.handlers.POST(request())).status, 401);
  assert.deepEqual(anonymous.actions, []);
  const { handlers, actions } = setup();
  assert.equal((await handlers.POST(request({}, "https://evil.example"))).status, 403);
  assert.equal((await handlers.POST(request({ title: "Fake release" }))).status, 400);
  assert.deepEqual(actions, []);
});
