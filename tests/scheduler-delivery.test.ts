import { test } from "node:test";
import assert from "node:assert/strict";
import type { NotificationDelivery } from "@prisma/client";
import type { AnimeSearchResult } from "../src/lib/anilist";
import { deliverEpisode, type DeliveryDependencies, type DeliveryContext } from "../src/lib/scheduling/deliver";

const now = new Date("2026-10-07T12:00:00Z");
const cutoff = new Date("2026-10-01T00:00:00Z");
const anime: AnimeSearchResult = {
  anilistId: 1, malId: null, title: "Season", titleEnglish: null, imageUrl: "", type: "TV", episodes: 12,
  status: "FINISHED", airing: false, nextEpisode: null, nextAiringId: null, nextAiringAt: null,
  broadcastDay: null, broadcastTime: null, broadcastTimezone: "Asia/Kolkata",
};
function fixture() {
  const row: NotificationDelivery = {
    id: "notification", userId: "user", anilistId: 1, episode: 12, kind: "AIRTIME", state: "PENDING",
    title: "Season", airingAt: now, sourceId: 123, scheduledFor: now, claimedAt: null, sentAt: null,
    error: null, receiptId: null, attempts: 0, createdAt: now, updatedAt: now,
  };
  const context: DeliveryContext = { anime, airing: { id: 123, mediaId: 1, episode: 12, airingAt: now.getTime() / 1_000 } };
  const effects: string[] = [];
  const deps: DeliveryDependencies = {
    now: () => now,
    confirm: async () => { effects.push("confirm"); return context; },
    reconcile: async () => { effects.push("reconcile"); return { ...row }; },
    claim: async () => { if (row.state !== "PENDING") return false; row.state = "CLAIMED"; effects.push("claim"); return true; },
    authorized: async () => true,
    publish: async () => { effects.push("publish"); return { id: "receipt" }; },
    finish: async (_id, state) => { effects.push(state); row.state = state; },
  };
  return { row, context, effects, deps };
}

test("regression: completed 12-episode season sends no nonexistent episode 13", async () => {
  const { row, context, deps, effects } = fixture();
  row.episode = 13;
  context.airing = null;
  assert.equal(await deliverEpisode(row, cutoff, deps), "skipped");
  assert.deepEqual(effects, ["confirm", "SKIPPED"]);
});

test("confirmed finale sends once, after source verification and claim", async () => {
  const { row, deps, effects } = fixture();
  assert.equal(await deliverEpisode(row, cutoff, deps), "sent");
  assert.deepEqual(effects, ["confirm", "reconcile", "claim", "publish", "SENT"]);
});

test("provider outage never uses a cached delivery timestamp", async () => {
  const { row, deps, effects } = fixture();
  deps.confirm = async () => { throw new Error("offline"); };
  assert.equal(await deliverEpisode(row, cutoff, deps), "deferred");
  assert.deepEqual(effects, []);
  assert.equal(row.state, "PENDING");
});

test("expired deleted source records are pruned without spending provider budget", async () => {
  const { row, deps, effects } = fixture();
  row.airingAt = new Date(now.getTime() - 30 * 60_000);
  deps.confirm = async () => { effects.push("confirm"); throw new Error("source deleted"); };
  assert.equal(await deliverEpisode(row, cutoff, deps), "skipped");
  assert.deepEqual(effects, ["SKIPPED"]);
});

test("pre-cutover intents are pruned before source requests", async () => {
  const { row, deps, effects } = fixture();
  assert.equal(await deliverEpisode(row, new Date(now.getTime() + 1), deps), "skipped");
  assert.deepEqual(effects, ["SKIPPED"]);
});

test("concurrent workers can publish only the atomically claimed event", async () => {
  const { row, deps, effects } = fixture();
  const results = await Promise.all([deliverEpisode({ ...row }, cutoff, deps), deliverEpisode({ ...row }, cutoff, deps)]);
  assert.equal(results.filter((result) => result === "sent").length, 1);
  assert.equal(effects.filter((effect) => effect === "publish").length, 1);
});

test("postponement reconciles the pending time before deciding to publish", async () => {
  const { row, context, deps, effects } = fixture();
  context.anime = { ...anime, status: "RELEASING" };
  context.airing!.airingAt += 7 * 86_400;
  deps.reconcile = async () => ({ ...row, airingAt: new Date(context.airing!.airingAt * 1_000) });
  assert.equal(await deliverEpisode(row, cutoff, deps), "deferred");
  assert.equal(effects.includes("publish"), false);
});

test("pause, removal or setting changes after claim prevent publishing", async () => {
  const { row, deps, effects } = fixture();
  deps.authorized = async () => false;
  assert.equal(await deliverEpisode(row, cutoff, deps), "skipped");
  assert.equal(effects.includes("publish"), false);
});

test("uncertain publish outcomes cannot be automatically retried", async () => {
  const { row, deps, effects } = fixture();
  deps.publish = async () => { effects.push("publish"); throw new Error("timeout"); };
  assert.equal(await deliverEpisode(row, cutoff, deps), "uncertain");
  assert.equal(await deliverEpisode(row, cutoff, deps), "ignored");
  assert.equal(effects.filter((effect) => effect === "publish").length, 1);
});

test("receipt persistence failure preserves a claim instead of retrying an accepted send", async () => {
  const { row, deps, effects } = fixture();
  deps.finish = async () => { throw new Error("database offline"); };
  await assert.rejects(deliverEpisode(row, cutoff, deps));
  assert.equal(row.state, "CLAIMED");
  assert.equal(await deliverEpisode(row, cutoff, deps), "ignored");
  assert.equal(effects.filter((effect) => effect === "publish").length, 1);
});

test("crossing the delivery cutoff during verification suppresses the send", async () => {
  const { row, deps, effects } = fixture();
  let clockReads = 0;
  deps.now = () => clockReads++ === 0 ? now : new Date(now.getTime() + 30 * 60_000);
  assert.equal(await deliverEpisode(row, cutoff, deps), "skipped");
  assert.equal(effects.includes("publish"), false);
});
