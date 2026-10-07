import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { accountHandlers } from "@/lib/api-account";
import { accountSettingsSelect } from "@/lib/account-settings";
import { encryptSecret } from "@/lib/secrets";
import type { NotificationKind } from "@prisma/client";

const handlers = accountHandlers({
  authenticate: async () => (await auth())?.user?.id ?? null,
  find: (userId) => prisma.user.findUnique({ where: { id: userId }, select: accountSettingsSelect }),
  update: (userId, data) => prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({ where: { id: userId }, data });
    if (!updated.count) return null;
    const disabledKinds: NotificationKind[] = [];
    if (data.morningEnabled === false) disabledKinds.push("MORNING");
    if (data.airtimeEnabled === false) disabledKinds.push("AIRTIME");
    if (disabledKinds.length) {
      await tx.notificationDelivery.updateMany({
        where: { userId, kind: { in: disabledKinds }, state: { in: ["PENDING", "FAILED"] } },
        data: { state: "SKIPPED", error: "Disabled in notification settings" },
      });
    }
    // Refresh valid future intents after preferences are changed.
    await tx.animeReminder.updateMany({ where: { userId, enabled: true }, data: { nextCheckAt: new Date() } });
    return tx.user.findUnique({ where: { id: userId }, select: accountSettingsSelect });
  }),
  remove: async (userId) => { await prisma.user.deleteMany({ where: { id: userId } }); },
  encrypt: encryptSecret,
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
