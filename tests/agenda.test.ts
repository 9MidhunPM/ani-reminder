import assert from "node:assert/strict";
import test from "node:test";
import { buildAgenda, dateKey, filterLineup, scheduledReminders } from "../src/lib/agenda";
import type { ReminderView } from "../src/lib/reminder-view";

const now = new Date("2026-10-07T18:45:00Z");
const base: ReminderView = { id: "fixture", anilistId: 21, title: "One Piece", titleEnglish: null, imageUrl: "/file.svg", nextEpisode: 100, nextAiringAt: "2026-10-08T12:00:00Z", totalEpisodes: null, enabled: true, scheduleState: "SCHEDULED", mediaStatus: "RELEASING", scheduleCheckedAt: now.toISOString(), syncError: null, createdAt: now.toISOString() };

test("agenda uses the IST day boundary and never invents repeat episodes", () => {
  assert.equal(dateKey(now), "2026-10-08");
  const agenda = buildAgenda([base], now);
  assert.equal(agenda.length, 7);
  assert.equal(agenda[0].key, "2026-10-08");
  assert.equal(agenda.flatMap(day => day.reminders).length, 1);
  assert.equal(agenda[0].reminders[0].nextEpisode, 100);
});

test("completed paused waiting and expired entries cannot appear as next up", () => {
  const entries = [base, { ...base, id: "paused", enabled: false }, { ...base, id: "completed", scheduleState: "COMPLETED" as const }, { ...base, id: "waiting", scheduleState: "WAITING" as const, nextAiringAt: null }, { ...base, id: "expired", nextAiringAt: "2026-10-01T00:00:00Z" }];
  assert.deepEqual(scheduledReminders(entries, now).map(entry => entry.id), ["fixture"]);
});

test("lineup filters keep completion separate and search both title variants", () => {
  const complete = { ...base, id: "completed", scheduleState: "COMPLETED" as const };
  const waiting = { ...base, id: "waiting", title: "Sousou no Frieren", titleEnglish: "Frieren: Beyond Journey's End", scheduleState: "WAITING" as const };
  assert.deepEqual(filterLineup([base, complete, waiting], "frieren", "waiting", "title").map(entry => entry.id), ["waiting"]);
  assert.deepEqual(filterLineup([base, complete], "", "all", "airing", true).map(entry => entry.id), ["completed"]);
});
