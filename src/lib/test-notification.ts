import type { NotificationDelivery } from "@prisma/client";
import { prisma } from "./prisma";
import { decryptSecret } from "./secrets";
import { sendNtfy } from "./notifications";

export type TestNotificationDependencies = {
  topic: (userId: string) => Promise<string | null>;
  claim: (userId: string, now: Date) => Promise<NotificationDelivery>;
  publish: (topic: string, sequenceId: string) => Promise<{ id: string }>;
  finish: (id: string, state: "SENT" | "FAILED" | "UNCERTAIN", receiptId: string | null, now: Date) => Promise<NotificationDelivery>;
};

export async function deliverTestNotification(userId: string, deps: TestNotificationDependencies, now = new Date()) {
  const topic = await deps.topic(userId);
  if (!topic) return null;
  // Claim before network I/O. A crash leaves a durable ambiguous attempt.
  const notification = await deps.claim(userId, now);
  let receipt: { id: string };
  try {
    receipt = await deps.publish(topic, `test-${notification.id}`);
  } catch (error) {
    const uncertain = !(typeof error === "object" && error && "uncertain" in error && error.uncertain === false);
    const state = uncertain ? "UNCERTAIN" : "FAILED";
    return { notification: await deps.finish(notification.id, state, null, now), testNotification: uncertain ? "uncertain" as const : "failed" as const };
  }
  return { notification: await deps.finish(notification.id, "SENT", receipt.id, new Date()), testNotification: "sent" as const };
}

export async function sendTestNotification(userId: string) {
  return deliverTestNotification(userId, {
    topic: async (id) => {
      const user = await prisma.user.findUnique({ where: { id }, select: { ntfyTopic: true } });
      return user?.ntfyTopic ? decryptSecret(user.ntfyTopic) : null;
    },
    claim: (id, now) => prisma.notificationDelivery.create({
      data: { userId: id, kind: "TEST", state: "CLAIMED", title: "Test notification", scheduledFor: now, claimedAt: now, attempts: 1 },
    }),
    publish: (topic, sequenceId) => sendNtfy(topic, "AniReminder test notification", "This is a test of your notification setup. No anime episode is being announced.", "test_tube", sequenceId),
    finish: (id, state, receiptId, now) => prisma.notificationDelivery.update({
      where: { id },
      data: { state, receiptId, sentAt: state === "SENT" ? now : null,
        error: state === "FAILED" ? "The notification provider rejected this test." : state === "UNCERTAIN" ? "Delivery could not be confirmed. It may have arrived." : null },
    }),
  });
}
