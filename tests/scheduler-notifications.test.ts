import { test } from "node:test";
import assert from "node:assert/strict";
import { sendNtfy, NotificationError } from "../src/lib/notifications";

test("publishing records an ntfy acceptance receipt and stable display sequence", async () => {
  const original = globalThis.fetch;
  let called = false;
  globalThis.fetch = async (input, init) => {
    called = true;
    assert.equal(String(input), "https://ntfy.sh/fixture-topic");
    assert.equal(new Headers(init?.headers).get("X-Sequence-ID"), "episode-delivery-1");
    assert.equal(init?.body, "A confirmed published episode");
    return Response.json({ event: "message", id: "accepted-receipt" });
  };
  try {
    assert.deepEqual(await sendNtfy("fixture-topic", "AniReminder", "A confirmed published episode", "tv", "episode-delivery-1"), { id: "accepted-receipt" });
    assert.equal(called, true);
  } finally { globalThis.fetch = original; }
});

test("missing receipts and server errors are ambiguous and never treated as success", async () => {
  const original = globalThis.fetch;
  try {
    for (const response of [Response.json({}), Response.json({ event: "keepalive", id: "wrong-event" }), new Response("failed", { status: 500 })]) {
      globalThis.fetch = async () => response;
      await assert.rejects(sendNtfy("fixture-topic", "AniReminder", "fixture", "tv"), (error: unknown) => error instanceof NotificationError && error.uncertain);
    }
  } finally { globalThis.fetch = original; }
});

test("network timeouts are ambiguous while explicit client rejection is definite", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => { throw new Error("timeout"); };
    await assert.rejects(sendNtfy("fixture-topic", "AniReminder", "fixture", "tv"), (error: unknown) => error instanceof NotificationError && error.uncertain);
    globalThis.fetch = async () => new Response("rejected", { status: 400 });
    await assert.rejects(sendNtfy("fixture-topic", "AniReminder", "fixture", "tv"), (error: unknown) => error instanceof NotificationError && !error.uncertain);
  } finally { globalThis.fetch = original; }
});
