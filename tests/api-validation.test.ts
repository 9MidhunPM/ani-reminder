import assert from "node:assert/strict";
import test from "node:test";
import { addReminderSchema, updateReminderSchema, updateAccountSchema, notificationCursorSchema, testNotificationSchema } from "../src/lib/validation";

test("reminder writes reject client-supplied identity and schedule fields", () => {
  assert.equal(addReminderSchema.safeParse({ anilistId: 12 }).success, true);
  for (const value of [{ anilistId: 12, userId: "other" }, { anilistId: 12, nextEpisode: 99 }, { anilistId: "12" }, { anilistId: -1 }]) {
    assert.equal(addReminderSchema.safeParse(value).success, false);
  }
  assert.equal(updateReminderSchema.safeParse({ enabled: false }).success, true);
  assert.equal(updateReminderSchema.safeParse({ enabled: "false" }).success, false);
  assert.equal(updateReminderSchema.safeParse({ enabled: true, title: "Changed" }).success, false);
});

test("settings allow independent preferences and validated replacement topics only", () => {
  assert.deepEqual(updateAccountSchema.parse({ morningEnabled: false }), { morningEnabled: false });
  assert.equal(updateAccountSchema.safeParse({ ntfyTopic: "private-topic_123" }).success, true);
  for (const value of [{}, { email: "other@example.com" }, { ntfyTopic: "short" }, { ntfyTopic: "https://ntfy.sh/topic" }, { airtimeEnabled: 1 }]) {
    assert.equal(updateAccountSchema.safeParse(value).success, false);
  }
});

test("notification API rejects forged test contents and invalid cursors", () => {
  assert.equal(testNotificationSchema.safeParse({}).success, true);
  assert.equal(testNotificationSchema.safeParse({ message: "Episode 99 released" }).success, false);
  assert.equal(notificationCursorSchema.safeParse("c12345678901234567890").success, true);
  assert.equal(notificationCursorSchema.safeParse("../other-user").success, false);
});
