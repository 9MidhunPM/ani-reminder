import assert from "node:assert/strict";
import test from "node:test";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required for database integration tests");
const target = new URL(databaseUrl);
if (!["127.0.0.1", "localhost"].includes(target.hostname) || !/qa|test/.test(target.pathname)) {
  throw new Error("Integration tests only run against an isolated local test database");
}
const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

test("migrations preserve waiting schedules and durable delivery identity", async () => {
  const user = await db.user.create({ data: { email: `storage-${Date.now()}@example.test`, passwordHash: "test-only", ntfyTopic: "encrypted-test-only" } });
  try {
    const control = await db.schedulerControl.findUniqueOrThrow({ where: { id: "main" } });
    assert.equal(control.deliveryEnabled, false);
    assert.ok(control.cutoverAt instanceof Date);
    const reminder = await db.animeReminder.create({ data: { userId: user.id, anilistId: 154587, title: "Test season", imageUrl: "/file.svg", enabled: false } });
    assert.equal(reminder.nextEpisode, null);
    assert.equal(reminder.nextAiringAt, null);
    assert.equal(reminder.scheduleState, "UNVERIFIED");
    const identity = { userId: user.id, anilistId: 154587, episode: 28, kind: "AIRTIME" as const };
    const data = { ...identity, title: "Test season", sourceId: 375011, airingAt: new Date(), scheduledFor: new Date(), state: "SENT" as const };
    const delivery = await db.notificationDelivery.create({ data });
    await assert.rejects(db.notificationDelivery.create({ data }), (error: unknown) => (error as { code: string }).code === "P2002");
    await db.animeReminder.delete({ where: { id: reminder.id } });
    assert.ok(await db.notificationDelivery.findUnique({ where: { id: delivery.id } }));
    await db.animeReminder.create({ data: { userId: user.id, anilistId: 154587, title: "Test season", imageUrl: "/file.svg" } });
    await assert.rejects(db.notificationDelivery.create({ data }), (error: unknown) => (error as { code: string }).code === "P2002");
    await assert.rejects(db.notificationDelivery.create({ data: { userId: user.id, kind: "AIRTIME", title: "Invalid episode", scheduledFor: new Date() } }));
    await db.user.delete({ where: { id: user.id } });
    assert.equal(await db.notificationDelivery.count({ where: { userId: user.id } }), 0);
    assert.equal(await db.animeReminder.count({ where: { userId: user.id } }), 0);
  } finally {
    await db.user.deleteMany({ where: { id: user.id } });
    await db.$disconnect();
  }
});
