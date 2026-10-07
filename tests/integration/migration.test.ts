import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
const target = new URL(databaseUrl);
if (!["localhost", "127.0.0.1"].includes(target.hostname) || !/qa|test/.test(target.pathname)) throw new Error("Use an isolated local test database");
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

test("legacy schedules are quarantined without losing accounts or pause preferences", async () => {
  const schema = `migration_test_${Date.now()}`;
  try {
    await prisma.$transaction(async tx => {
      await tx.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
      await tx.$executeRawUnsafe("SET LOCAL TIME ZONE 'Asia/Kolkata'");
      async function apply(name: string) {
        const sql = await readFile(`prisma/migrations/${name}/migration.sql`, "utf8");
        for (const statement of sql.split(";").map(part => part.trim()).filter(Boolean)) {
          if (/^(BEGIN|COMMIT)$/i.test(statement)) continue;
          await tx.$executeRawUnsafe(statement);
        }
      }
      await apply("20260806110000_init");
      await apply("20260806123000_add_anilist");
      await apply("20260806133000_add_rate_limits");
      await tx.$executeRaw`INSERT INTO "User" (id,email,"passwordHash","ntfyTopic","updatedAt") VALUES ('legacy-owner','legacy@example.test','preserved-hash','preserved-ciphertext',NOW())`;
      await tx.$executeRaw`INSERT INTO "AnimeReminder" (id,"userId","anilistId",title,"imageUrl","nextEpisode","nextAiringAt","totalEpisodes",enabled,"updatedAt") VALUES ('legacy-reminder','legacy-owner',154587,'Ended season','/file.svg',29,NOW() + INTERVAL '7 days',28,false,NOW())`;
      await apply("20261007000000_verified_schedules");
      const reminders = await tx.$queryRaw<Array<{ scheduleState: string; enabled: boolean; nextEpisode: number }>>`SELECT "scheduleState",enabled,"nextEpisode" FROM "AnimeReminder"`;
      assert.equal(reminders[0].scheduleState, "UNVERIFIED");
      assert.equal(reminders[0].enabled, false);
      assert.equal(reminders[0].nextEpisode, 29);
      const controls = await tx.$queryRaw<Array<{ deliveryEnabled: boolean; cutoverAt: Date; utcCutover: boolean }>>`SELECT "deliveryEnabled","cutoverAt", "cutoverAt" = timezone('UTC', CURRENT_TIMESTAMP)::timestamp(3) AS "utcCutover" FROM "SchedulerControl"`;
      assert.equal(controls[0].deliveryEnabled, false);
      assert.ok(controls[0].cutoverAt instanceof Date);
      assert.equal(controls[0].utcCutover, true);
      const users = await tx.$queryRaw<Array<{ ntfyTopic: string; passwordHash: string }>>`SELECT "ntfyTopic","passwordHash" FROM "User"`;
      assert.equal(users[0].ntfyTopic, "preserved-ciphertext");
      assert.equal(users[0].passwordHash, "preserved-hash");
    }, { timeout: 30_000 });
  } finally {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await prisma.$disconnect();
  }
});
