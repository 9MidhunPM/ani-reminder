import { randomUUID } from "node:crypto";
import type { NotificationDelivery } from "@prisma/client";
import { getEpisodeContext, getAnime } from "../anilist";
import { sendNtfy, NotificationError } from "../notifications";
import { prisma } from "../prisma";
import { decryptSecret } from "../secrets";
import { deliverEpisode, type DeliveryContext } from "./deliver";
import { reconcileIntents, reconcileReminder } from "./reconcile";

export const LEASE_MS = 60_000;

export async function acquireLease(owner: string, now: Date) {
  const result = await prisma.schedulerControl.updateMany({
    where: { id: "main", OR: [{ leaseUntil: null }, { leaseUntil: { lte: now } }] },
    data: { leaseOwner: owner, leaseUntil: new Date(now.getTime() + LEASE_MS) },
  });
  return result.count === 1;
}

export async function releaseLease(owner: string) {
  await prisma.schedulerControl.updateMany({ where: { id: "main", leaseOwner: owner }, data: { leaseOwner: null, leaseUntil: null } });
}

export async function claimDelivery(delivery: NotificationDelivery, owner: string, now: Date) {
  const count = await prisma.$executeRaw`
    UPDATE "NotificationDelivery" AS d SET "state" = 'CLAIMED', "claimedAt" = ${now},
      "attempts" = d."attempts" + 1, "updatedAt" = ${now}
    FROM "AnimeReminder" r, "User" u, "SchedulerControl" c
    WHERE d."id" = ${delivery.id} AND d."state" IN ('PENDING','FAILED') AND d."attempts" < 3
      AND d."sourceId" = ${delivery.sourceId} AND d."airingAt" = ${delivery.airingAt}
      AND d."scheduledFor" <= ${now} AND d."scheduledFor" >= c."cutoverAt"
      AND r."userId" = d."userId" AND r."anilistId" = d."anilistId" AND r."enabled" = true
      AND u."id" = d."userId" AND ((d."kind" = 'MORNING' AND u."morningEnabled") OR (d."kind" = 'AIRTIME' AND u."airtimeEnabled"))
      AND c."id" = 'main' AND c."deliveryEnabled" = true AND c."leaseOwner" = ${owner} AND c."leaseUntil" > ${now}`;
  return count === 1;
}

export async function deliveryAuthorized(delivery: NotificationDelivery, owner: string, now: Date) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT d."id" FROM "NotificationDelivery" d
    JOIN "User" u ON u."id" = d."userId"
    JOIN "AnimeReminder" r ON r."userId" = d."userId" AND r."anilistId" = d."anilistId"
    JOIN "SchedulerControl" c ON c."id" = 'main'
    WHERE d."id" = ${delivery.id} AND d."state" = 'CLAIMED' AND r."enabled" = true
      AND ((d."kind" = 'MORNING' AND u."morningEnabled") OR (d."kind" = 'AIRTIME' AND u."airtimeEnabled"))
      AND c."deliveryEnabled" = true AND c."leaseOwner" = ${owner} AND c."leaseUntil" > ${now}`;
  return rows.length === 1;
}

async function reconcileDelivery(delivery: NotificationDelivery, context: DeliveryContext) {
  const reminder = await prisma.animeReminder.findFirst({ where: { userId: delivery.userId, anilistId: delivery.anilistId } });
  if (!reminder || !context.airing) return null;
  await reconcileReminder(reminder, { snapshot: context.anime });
  await prisma.$transaction(async (tx) => {
    const current = await tx.animeReminder.findUnique({ where: { id: reminder.id } });
    const control = await tx.schedulerControl.findUniqueOrThrow({ where: { id: "main" } });
    if (current) await reconcileIntents(tx, current, context.airing!, new Date(), control.cutoverAt);
  });
  return prisma.notificationDelivery.findUnique({ where: { id: delivery.id } });
}

async function publishDelivery(delivery: NotificationDelivery, owner: string) {
  if (!await deliveryAuthorized(delivery, owner, new Date())) throw new NotificationError("Reminder no longer active", false);
  const user = await prisma.user.findUnique({ where: { id: delivery.userId } });
  if (!user) throw new NotificationError("Account no longer active", false);
  let topic: string;
  try { topic = decryptSecret(user.ntfyTopic); } catch { throw new NotificationError("Notification topic unavailable", false); }
  const time = delivery.airingAt!.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
  const message = delivery.kind === "MORNING"
    ? `${delivery.title} airs today. Episode ${delivery.episode} is scheduled for ${time} IST, according to AniList.`
    : `Episode ${delivery.episode} of ${delivery.title} has reached its published airing time on AniList.`;
  return sendNtfy(topic, "AniReminder", message, delivery.kind === "MORNING" ? "sunrise" : "tv", `episode-${delivery.id}`);
}

export async function recoverAbandonedClaims(now = new Date()) {
  return prisma.notificationDelivery.updateMany({
    where: { state: "CLAIMED", claimedAt: { lt: new Date(now.getTime() - 2 * LEASE_MS) } },
    data: { state: "UNCERTAIN", error: "The worker stopped before confirming delivery; it may have arrived" },
  });
}

export async function runScheduler(options: { delivery?: boolean; budgetMs?: number } = {}) {
  const owner = randomUUID();
  const deadline = Date.now() + Math.min(options.budgetMs ?? 45_000, 45_000);
  const counts = { leased: false, checked: 0, sent: 0, skipped: 0, deferred: 0, failed: 0, uncertain: 0 };
  if (!await acquireLease(owner, new Date())) return counts;
  counts.leased = true;
  const haveBudget = () => Date.now() + 12_000 < deadline;
  const renew = async () => (await prisma.schedulerControl.updateMany({
    where: { id: "main", leaseOwner: owner, leaseUntil: { gt: new Date() } },
    data: { leaseUntil: new Date(Date.now() + LEASE_MS) },
  })).count === 1;
  try {
    const control = await prisma.schedulerControl.findUniqueOrThrow({ where: { id: "main" } });
    await recoverAbandonedClaims();
    if (control.deliveryEnabled && options.delivery !== false) {
      const pending = await prisma.notificationDelivery.findMany({
        where: { kind: { not: "TEST" }, state: { in: ["PENDING", "FAILED"] }, attempts: { lt: 3 }, scheduledFor: { lte: new Date() } },
        orderBy: [{ scheduledFor: "desc" }, { id: "asc" }], take: 100,
      });
      for (const delivery of pending) {
        if (!haveBudget() || !await renew()) break;
        try {
          const result = await deliverEpisode(delivery, control.cutoverAt, {
            now: () => new Date(), confirm: getEpisodeContext, reconcile: reconcileDelivery,
            claim: (candidate, now) => claimDelivery(candidate, owner, now),
            authorized: (candidate, now) => deliveryAuthorized(candidate, owner, now),
            publish: (candidate) => publishDelivery(candidate, owner),
            finish: async (id, state, error, receiptId) => {
              await prisma.notificationDelivery.updateMany({
                where: { id, state: { in: ["PENDING", "FAILED", "SKIPPED", "CLAIMED"] } },
                data: { state, error, ...(receiptId ? { receiptId } : {}), ...(state === "SENT" ? { sentAt: new Date() } : {}) },
              });
            },
          });
          if (result === "sent" || result === "skipped" || result === "deferred" || result === "failed" || result === "uncertain") counts[result] += 1;
        } catch { counts.failed += 1; }
      }
    }
    const reminders = await prisma.animeReminder.findMany({
      where: { enabled: true, OR: [{ nextCheckAt: null }, { nextCheckAt: { lte: new Date() } }] },
      orderBy: [{ nextCheckAt: { sort: "asc", nulls: "first" } }, { id: "asc" }], take: 100,
    });
    const snapshots = new Map<number, Awaited<ReturnType<typeof getAnime>>>();
    for (const reminder of reminders) {
      if (!haveBudget() || !await renew()) break;
      try {
        const snapshot = reminder.anilistId ? snapshots.get(reminder.anilistId) ?? await getAnime(reminder.anilistId) : undefined;
        if (snapshot) snapshots.set(snapshot.anilistId, snapshot);
        await reconcileReminder(reminder, { snapshot });
        counts.checked += 1;
      } catch {
        counts.deferred += 1;
        await prisma.animeReminder.updateMany({ where: { id: reminder.id }, data: {
          syncError: "The published schedule could not be verified. Notifications are deferred.", nextCheckAt: new Date(Date.now() + 60_000),
        } });
      }
    }
    await prisma.rateLimit.deleteMany({ where: { updatedAt: { lt: new Date(Date.now() - 7 * 86_400_000) } } });
    return counts;
  } finally { await releaseLease(owner); }
}
