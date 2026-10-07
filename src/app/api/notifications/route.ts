import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notificationHandlers } from "@/lib/api-notifications";
import { consumeRateLimit } from "@/lib/request-security";
import { sendTestNotification } from "@/lib/test-notification";

const handlers = notificationHandlers({
  authenticate: async () => (await auth())?.user?.id ?? null,
  cursorExists: async (userId, id) => Boolean(await prisma.notificationDelivery.findFirst({ where: { id, userId }, select: { id: true } })),
  list: (userId, cursor) => prisma.notificationDelivery.findMany({
    where: { userId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 51,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  }),
  rateLimit: (userId) => consumeRateLimit("notification-test", userId, 1, 60_000),
  test: sendTestNotification,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
