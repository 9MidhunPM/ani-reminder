import assert from "node:assert/strict";
import test from "node:test";
import type { NotificationDelivery } from "@prisma/client";
import { deliverTestNotification, type TestNotificationDependencies } from "../src/lib/test-notification";

const now = new Date("2026-10-07T12:00:00Z");
const claimed: NotificationDelivery = {
  id: "c12345678901234567890", userId: "owner", anilistId: null, episode: null, kind: "TEST", state: "CLAIMED",
  title: "Test notification", airingAt: null, sourceId: null, scheduledFor: now, claimedAt: now, sentAt: null,
  error: null, receiptId: null, attempts: 1, createdAt: now, updatedAt: now,
};
function setup(overrides: Partial<TestNotificationDependencies> = {}) {
  const events: string[] = [];
  const deps: TestNotificationDependencies = {
    topic: async (owner) => { assert.equal(owner, "owner"); return "private-test-topic"; },
    claim: async (owner) => { assert.equal(owner, "owner"); events.push("claim"); return claimed; },
    publish: async (topic, sequence) => {
      assert.equal(topic, "private-test-topic");
      assert.equal(sequence, `test-${claimed.id}`);
      events.push("publish"); return { id: "receipt" };
    },
    finish: async (id, state, receiptId, sentAt) => {
      assert.equal(id, claimed.id); events.push(state);
      return { ...claimed, state, receiptId, sentAt: state === "SENT" ? sentAt : null };
    },
    ...overrides,
  };
  return { deps, events };
}

test("test delivery claims before network I/O and persists the provider receipt", async () => {
  const { deps, events } = setup();
  const result = await deliverTestNotification("owner", deps, now);
  assert.equal(result?.testNotification, "sent");
  assert.equal(result?.notification.receiptId, "receipt");
  assert.deepEqual(events, ["claim", "publish", "SENT"]);
});

test("network ambiguity records uncertain without retry or fabricated sent timestamp", async () => {
  let publishes = 0;
  const { deps, events } = setup({ publish: async () => { publishes++; throw new Error("Timeout after publish"); } });
  const result = await deliverTestNotification("owner", deps, now);
  assert.equal(result?.testNotification, "uncertain");
  assert.equal(result?.notification.sentAt, null);
  assert.equal(publishes, 1);
  assert.deepEqual(events, ["claim", "UNCERTAIN"]);
});

test("explicit provider rejection records failed while missing setup never publishes", async () => {
  const rejected = setup({ publish: async () => { throw Object.assign(new Error("Rejected"), { uncertain: false }); } });
  assert.equal((await deliverTestNotification("owner", rejected.deps, now))?.testNotification, "failed");
  const absent = setup({ topic: async () => null });
  assert.equal(await deliverTestNotification("owner", absent.deps, now), null);
  assert.deepEqual(absent.events, []);
});

test("a receipt-write failure never retries an already accepted publish", async () => {
  const { deps, events } = setup({ finish: async () => { throw new Error("Database offline"); } });
  await assert.rejects(deliverTestNotification("owner", deps, now), /Database offline/);
  assert.deepEqual(events, ["claim", "publish"]);
});
