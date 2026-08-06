import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAnime } from "@/lib/jikan";
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
  const parsed = addReminderSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid anime" }, { status: 400 });

  const anime = await getAnime(parsed.data.malId);
  const nextAiringAt = anime.nextAiringAt ? new Date(anime.nextAiringAt) : null;
  if (!nextAiringAt || Number.isNaN(nextAiringAt.getTime())) {
    return NextResponse.json({ error: "This anime has no published broadcast schedule" }, { status: 422 });
  }

  const reminder = await prisma.animeReminder.upsert({
    where: { userId_malId: { userId: session.user.id, malId: anime.malId } },
    create: {
      userId: session.user.id,
      malId: anime.malId,
      title: anime.title,
      titleEnglish: anime.titleEnglish,
      imageUrl: anime.imageUrl,
      nextEpisode: 1,
      nextAiringAt,
      broadcastDay: anime.broadcastDay,
      broadcastTime: anime.broadcastTime,
      broadcastTimezone: anime.broadcastTimezone,
      totalEpisodes: anime.episodes,
    },
    update: { enabled: true, nextAiringAt, imageUrl: anime.imageUrl },
  });
  return NextResponse.json({ reminder }, { status: 201 });
}
