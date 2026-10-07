import type { NotificationDelivery } from "@prisma/client";
import type { NotificationView } from "./reminder-view";
import { authorize, parseJson, type Authenticate } from "./api-context";
import { notificationCursorSchema, testNotificationSchema } from "./validation";

export function serializeNotification(notification: NotificationDelivery): NotificationView {
  return {
    id: notification.id, title: notification.title, episode: notification.episode,
    kind: notification.kind, state: notification.state,
    scheduledFor: notification.scheduledFor.toISOString(), sentAt: notification.sentAt?.toISOString() ?? null,
    error: notification.error,
  };
}

export type NotificationDependencies = {
  authenticate: Authenticate;
  cursorExists: (userId: string, cursor: string) => Promise<boolean>;
  list: (userId: string, cursor: string | null) => Promise<NotificationDelivery[]>;
  rateLimit: (userId: string) => Promise<{ allowed: boolean; retryAfter: number }>;
  test: (userId: string) => Promise<{ notification: NotificationDelivery; testNotification: "sent" | "failed" | "uncertain" } | null>;
};

export function notificationHandlers(deps: NotificationDependencies) {
  return {
    async GET(request: Request) {
      const userId = await authorize(deps.authenticate);
      if (userId instanceof Response) return userId;
      const cursor = new URL(request.url).searchParams.get("cursor");
      if (cursor !== null && !notificationCursorSchema.safeParse(cursor).success) {
        return Response.json({ error: "Invalid notification cursor" }, { status: 400 });
      }
      if (cursor && !await deps.cursorExists(userId, cursor)) {
        return Response.json({ error: "Notification cursor not found" }, { status: 404 });
      }
      const rows = await deps.list(userId, cursor);
      const page = rows.slice(0, 50);
      return Response.json({ notifications: page.map(serializeNotification), nextCursor: rows.length > 50 ? page[49].id : null });
    },
    async POST(request: Request) {
      const userId = await authorize(deps.authenticate, request);
      if (userId instanceof Response) return userId;
      const result = await parseJson(request);
      if (result.response) return result.response;
      if (!testNotificationSchema.safeParse(result.body).success) {
        return Response.json({ error: "Invalid test notification request" }, { status: 400 });
      }
      const limit = await deps.rateLimit(userId);
      if (!limit.allowed) return Response.json({ error: "Please wait before sending another test notification." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
      let delivered: Awaited<ReturnType<NotificationDependencies["test"]>>;
      try {
        delivered = await deps.test(userId);
      } catch {
        // A receipt-write failure can follow an accepted publish. Do not invite
        // an immediate retry or misreport a confirmed transport failure.
        return Response.json({ error: "The test could not be recorded. Check notification history before trying again." }, { status: 503 });
      }
      if (!delivered) return Response.json({ error: "Configure a notification topic before sending a test." }, { status: 422 });
      return Response.json({ notification: serializeNotification(delivered.notification), testNotification: delivered.testNotification });
    },
  };
}
