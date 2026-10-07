import assert from "node:assert/strict";
import test from "node:test";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
const target = new URL(databaseUrl);
if (!["localhost", "127.0.0.1"].includes(target.hostname) || !/qa|test/.test(target.pathname)) throw new Error("Use an isolated local test database");
// A non-UTC session detects accidental timestamptz comparisons against Prisma's
// UTC-naive TIMESTAMP columns. UTC-only test databases hide this production bug.
target.searchParams.set("options", "-c TimeZone=Asia/Kolkata");
process.env.DATABASE_URL = target.toString();
const db = new PrismaClient({ datasources: { db: { url: target.toString() } } });

test("database lease and claims prevent overlapping workers and revoked reminders", async () => {
  const { acquireLease, releaseLease, claimDelivery, deliveryAuthorized, recoverAbandonedClaims } = await import("../../src/lib/scheduling/runner");
  const { prisma } = await import("../../src/lib/prisma");
  const zone = await prisma.$queryRaw<Array<{ timezone: string }>>`SELECT current_setting('TimeZone') AS timezone`;
  assert.equal(zone[0].timezone, "Asia/Kolkata");
  const previous = await db.schedulerControl.findUniqueOrThrow({ where: { id: "main" } });
  const now = new Date();
  const user = await db.user.create({ data: { email: `scheduler-${Date.now()}@example.test`, passwordHash: "test-only", ntfyTopic: "test-only" } });
  try {
    await db.schedulerControl.update({ where: { id: "main" }, data: { deliveryEnabled: true, cutoverAt: new Date(now.getTime() - 86_400_000), leaseOwner: null, leaseUntil: null } });
    const leases = await Promise.all([acquireLease("first-worker", now), acquireLease("second-worker", now)]);
    assert.equal(leases.filter(Boolean).length, 1);
    const owner = leases[0] ? "first-worker" : "second-worker";
    const reminder = await db.animeReminder.create({ data: { userId: user.id, anilistId: 154587, title: "Test finale", imageUrl: "/file.svg" } });
    const delivery = await db.notificationDelivery.create({ data: { userId: user.id, anilistId: 154587, episode: 28, kind: "AIRTIME", sourceId: 375011, title: "Test finale", airingAt: new Date(now.getTime() - 10_000), scheduledFor: new Date(now.getTime() - 10_000) } });
    const claims = await Promise.all([claimDelivery(delivery, owner, now), claimDelivery(delivery, owner, now)]);
    assert.equal(claims.filter(Boolean).length, 1);
    const claimed = await db.notificationDelivery.findUniqueOrThrow({ where: { id: delivery.id } });
    assert.equal(claimed.claimedAt?.getTime(), now.getTime());
    assert.equal(await deliveryAuthorized(delivery, owner, now), true);
    const expired = await db.notificationDelivery.create({ data: { userId: user.id, anilistId: 154587, episode: 27, kind: "AIRTIME", sourceId: 375010, title: "Expired episode", airingAt: new Date(now.getTime() - 31 * 60_000), scheduledFor: new Date(now.getTime() - 31 * 60_000) } });
    assert.equal(await claimDelivery(expired, owner, now), false);
    await db.animeReminder.update({ where: { id: reminder.id }, data: { enabled: false } });
    assert.equal(await deliveryAuthorized(delivery, owner, now), false);
    await db.animeReminder.delete({ where: { id: reminder.id } });
    assert.equal(await deliveryAuthorized(delivery, owner, now), false);
    await db.notificationDelivery.update({ where: { id: delivery.id }, data: { state: "SENT" } });
    await db.animeReminder.create({ data: { userId: user.id, anilistId: 154587, title: "Test finale", imageUrl: "/file.svg" } });
    assert.equal(await claimDelivery(delivery, owner, now), false);
    const abandoned = await db.notificationDelivery.create({ data: { userId: user.id, kind: "TEST", title: "Abandoned test", state: "CLAIMED", scheduledFor: now, claimedAt: new Date(now.getTime() - 180_000) } });
    await recoverAbandonedClaims(now);
    assert.equal((await db.notificationDelivery.findUniqueOrThrow({ where: { id: abandoned.id } })).state, "UNCERTAIN");
    await releaseLease("foreign-worker");
    assert.equal((await db.schedulerControl.findUniqueOrThrow({ where: { id: "main" } })).leaseOwner, owner);
    await releaseLease(owner);
    assert.equal((await db.schedulerControl.findUniqueOrThrow({ where: { id: "main" } })).leaseOwner, null);
  } finally {
    await db.user.deleteMany({ where: { id: user.id } });
    await db.schedulerControl.update({ where: { id: "main" }, data: { deliveryEnabled: previous.deliveryEnabled, cutoverAt: previous.cutoverAt, leaseOwner: previous.leaseOwner, leaseUntil: previous.leaseUntil } });
    await prisma.$disconnect();
    await db.$disconnect();
  }
});
