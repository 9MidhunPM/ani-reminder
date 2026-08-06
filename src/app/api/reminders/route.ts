import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAnime } from "@/lib/anilist";
import { sendNtfy } from "@/lib/notifications";
import { hasSameOrigin, readJson, RequestError } from "@/lib/request-security";
import { decryptSecret } from "@/lib/secrets";
import { addReminderSchema } from "@/lib/validation";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const reminders = await prisma.animeReminder.findMany({
    where: { userId: session.user.id },
    orderBy: [{ enabled: "desc" }, { nextAiringAt: "asc" }],
  });
  return NextResponse.json({ reminders });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  let body: unknown;
  try {
    body = await readJson(request);
  } catch (error) {
    if (error instanceof RequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
  const parsed = addReminderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid anime" }, { status: 400 });

  const anime = await getAnime(parsed.data.anilistId);
  const nextAiringAt = anime.nextAiringAt ? new Date(anime.nextAiringAt) : null;
  if (!nextAiringAt || Number.isNaN(nextAiringAt.getTime())) {
    return NextResponse.json({ error: "This anime has no published broadcast schedule" }, { status: 422 });
  }

  const existing = await prisma.animeReminder.findFirst({
    where: {
      userId: session.user.id,
      OR: [
        { anilistId: anime.anilistId },
        ...(anime.malId ? [{ malId: anime.malId }] : []),
      ],
    },
  });
  const data = {
    anilistId: anime.anilistId,
    malId: anime.malId,
    title: anime.title,
    titleEnglish: anime.titleEnglish,
    imageUrl: anime.imageUrl,
    nextEpisode: anime.nextEpisode ?? 1,
    nextAiringAt,
    broadcastDay: anime.broadcastDay,
    broadcastTime: anime.broadcastTime,
    broadcastTimezone: anime.broadcastTimezone,
    totalEpisodes: anime.episodes,
    enabled: true,
  };
  const reminder = existing
    ? await prisma.animeReminder.update({ where: { id: existing.id }, data })
    : await prisma.animeReminder.create({
        data: {
          userId: session.user.id,
          ...data,
        },
      });

  let testNotification: "sent" | "failed" = "sent";
  if (!existing) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { ntfyTopic: true },
    });
    if (user) {
      try {
        await sendNtfy(
          decryptSecret(user.ntfyTopic),
          "AniReminder",
          `🎬 ${reminder.title} added to AniReminder — reminders will arrive like this:\n\n🌅 ${reminder.title} airs today — Episode ${reminder.nextEpisode} drops at ${reminder.broadcastTime ?? "its scheduled time"}\n⚡ Episode ${reminder.nextEpisode} of ${reminder.title} is out NOW`,
          "tada",
        );
      } catch {
        testNotification = "failed";
      }
    }
  }
  return NextResponse.json({ reminder, testNotification }, { status: 201 });
}
