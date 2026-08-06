import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNtfy } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const reminders = await prisma.animeReminder.findMany({
    where: { enabled: true, nextAiringAt: { lte: windowEnd } },
    include: { user: true },
  });
  let sent = 0;
  let failed = 0;

  for (const reminder of reminders) {
    const airingInIst = new Date(reminder.nextAiringAt.getTime() + 5.5 * 60 * 60 * 1000);
    const morning = new Date(Date.UTC(
      airingInIst.getUTCFullYear(),
      airingInIst.getUTCMonth(),
      airingInIst.getUTCDate(),
      0,
      30,
    ));
    if (now >= morning && reminder.morningNotifiedFor?.getTime() !== reminder.nextAiringAt.getTime()) {
      try {
        await sendNtfy(reminder.user.ntfyTopic, "AniReminder", `🌅 ${reminder.title} airs today — Episode ${reminder.nextEpisode} drops at ${reminder.broadcastTime ?? "its scheduled time"}`, "sunrise");
        await prisma.animeReminder.update({ where: { id: reminder.id }, data: { morningNotifiedFor: reminder.nextAiringAt } });
        sent += 1;
      } catch {
        failed += 1;
      }
    }
    if (now >= reminder.nextAiringAt && reminder.airtimeNotifiedFor?.getTime() !== reminder.nextAiringAt.getTime()) {
      try {
        await sendNtfy(reminder.user.ntfyTopic, "AniReminder", `⚡ Episode ${reminder.nextEpisode} of ${reminder.title} is out NOW`, "zap");
        const nextAiringAt = new Date(reminder.nextAiringAt);
        nextAiringAt.setUTCDate(nextAiringAt.getUTCDate() + 7);
        await prisma.animeReminder.update({
          where: { id: reminder.id },
          data: {
            airtimeNotifiedFor: reminder.nextAiringAt,
            nextEpisode: { increment: 1 },
            nextAiringAt,
          },
        });
        sent += 1;
      } catch {
        failed += 1;
      }
    }
  }
  return NextResponse.json({ checked: reminders.length, sent, failed });
}
