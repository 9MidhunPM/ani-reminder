import { test } from "node:test";
import assert from "node:assert/strict";
import type { AnimeSearchResult } from "../src/lib/anilist";
import { confirmedEpisode, deliveryWindow, morningTime, scheduleState, upcomingSchedule } from "../src/lib/scheduling/policy";

export const anime: AnimeSearchResult = {
  anilistId: 1, malId: null, title: "Season", titleEnglish: null, imageUrl: "", type: "TV",
  episodes: 12, status: "RELEASING", airing: true, nextEpisode: 12, nextAiringId: 123,
  nextAiringAt: "2026-10-07T12:00:00Z", broadcastDay: "Wednesday", broadcastTime: "17:30", broadcastTimezone: "Asia/Kolkata",
};
const airing = { id: 123, mediaId: 1, episode: 12, airingAt: Date.parse("2026-10-07T12:00:00Z") / 1_000 };

test("finished seasons never invent an upcoming episode", () => {
  const finished = { ...anime, status: "FINISHED", nextEpisode: null, nextAiringAt: null, nextAiringId: null };
  assert.equal(upcomingSchedule(finished, new Date("2026-10-07T12:00:00Z")), null);
  assert.equal(scheduleState(finished, new Date()), "COMPLETED");
  assert.equal(confirmedEpisode(finished, { ...airing, episode: 13 }, 13, new Date("2026-10-07T12:01:00Z")), false);
});

test("a real finale remains valid after the provider marks the season finished", () => {
  const finished = { ...anime, status: "FINISHED", nextEpisode: null, nextAiringAt: null };
  assert.equal(confirmedEpisode(finished, airing, 12, new Date("2026-10-07T12:00:00Z")), true);
  assert.equal(confirmedEpisode(finished, airing, 12, new Date("2026-10-07T12:29:59.999Z")), true);
  assert.equal(confirmedEpisode(finished, airing, 12, new Date("2026-10-07T12:30:00Z")), false);
  assert.equal(confirmedEpisode(finished, airing, 12, new Date("2026-10-07T11:59:59Z")), false);
});

test("missing, mismatched, malformed, hiatus and cancelled records are unconfirmed", () => {
  const now = new Date("2026-10-07T12:00:00Z");
  assert.equal(confirmedEpisode(anime, null, 12, now), false);
  assert.equal(confirmedEpisode(anime, { ...airing, mediaId: 2 }, 12, now), false);
  assert.equal(confirmedEpisode(anime, { ...airing, episode: 11 }, 12, now), false);
  assert.equal(confirmedEpisode(anime, { ...airing, airingAt: NaN }, 12, now), false);
  for (const status of ["HIATUS", "CANCELLED", null]) assert.equal(confirmedEpisode({ ...anime, status }, airing, 12, now), false);
  assert.equal(confirmedEpisode({ ...anime, episodes: null }, airing, 12, now), true);
});

test("morning notifications are bounded to 06:00–07:00 IST and precede airtime", () => {
  const at = new Date("2026-10-07T12:00:00Z");
  const cutoff = new Date("2026-10-01T00:00:00Z");
  assert.equal(morningTime(at).toISOString(), "2026-10-07T00:30:00.000Z");
  assert.equal(deliveryWindow("MORNING", at, new Date("2026-10-07T00:29:59Z"), cutoff), "future");
  assert.equal(deliveryWindow("MORNING", at, new Date("2026-10-07T00:30:00Z"), cutoff), "due");
  assert.equal(deliveryWindow("MORNING", at, new Date("2026-10-07T01:29:59Z"), cutoff), "due");
  assert.equal(deliveryWindow("MORNING", at, new Date("2026-10-07T01:30:00Z"), cutoff), "expired");
  assert.equal(deliveryWindow("MORNING", new Date("2026-10-07T00:15:00Z"), new Date("2026-10-07T00:30:00Z"), cutoff), "expired");
});

test("cutover compares actual due time and airtime expires at 30 minutes", () => {
  const at = new Date("2026-10-07T12:00:00Z");
  assert.equal(deliveryWindow("AIRTIME", at, at, at), "due");
  assert.equal(deliveryWindow("AIRTIME", at, new Date("2026-10-07T12:29:59.999Z"), at), "due");
  assert.equal(deliveryWindow("AIRTIME", at, new Date("2026-10-07T12:30:00Z"), at), "expired");
  assert.equal(deliveryWindow("AIRTIME", at, at, new Date("2026-10-07T12:00:00.001Z")), "expired");
  assert.equal(deliveryWindow("MORNING", at, new Date("2026-10-07T00:45:00Z"), new Date("2026-10-07T00:40:00Z")), "expired");
});

test("irregular schedules use exact provider time without weekly arithmetic", () => {
  const irregular = { ...anime, nextAiringAt: "2026-10-29T07:22:00Z", nextEpisode: 7 };
  assert.equal(upcomingSchedule(irregular, new Date("2026-10-07T12:00:00Z"))?.airingAt, Date.parse(irregular.nextAiringAt) / 1_000);
  assert.equal(upcomingSchedule({ ...irregular, nextEpisode: 13 }, new Date("2026-10-07T12:00:00Z")), null);
});
