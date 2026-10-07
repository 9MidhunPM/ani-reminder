import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { encryptSecret } from "../src/lib/secrets";

async function main() {
const url = new URL(process.env.DATABASE_URL ?? "http://invalid");
if (!["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.includes("ani_reminder_qa")) {
  throw new Error("QA seeding requires the isolated local ani_reminder_qa database");
}
const prisma = new PrismaClient();
const email = "qa@anireminder.example";
const user = await prisma.user.upsert({
  where: { email },
  create: { email, passwordHash: await hash("AniReminder-QA-2026", 12), ntfyTopic: encryptSecret("local-qa-notification-topic") },
  update: {},
});
const titles = [
  { title: "One Piece", anilistId: 21, state: "SCHEDULED" as const, episode: 1173, enabled: true },
  { title: "Witch Hat Atelier", anilistId: 151316, state: "SCHEDULED" as const, episode: 8, enabled: true },
  { title: "Frieren: Beyond Journey’s End", anilistId: 154587, state: "COMPLETED" as const, episode: null, enabled: true },
  { title: "Solo Leveling", anilistId: 151807, state: "WAITING" as const, episode: null, enabled: true },
  { title: "Dandadan", anilistId: 171018, state: "SCHEDULED" as const, episode: 6, enabled: false },
];
for (let index = 0; index < titles.length; index++) {
  const entry = titles[index];
  const data = {
    title: entry.title,
    imageUrl: "https://cdn.myanimelist.net/images/anime/1015/138006l.jpg",
    nextEpisode: entry.episode,
    nextAiringAt: entry.episode ? new Date(Date.now() + (index + 1) * 86_400_000) : null,
    enabled: entry.enabled,
    scheduleState: entry.state,
    mediaStatus: entry.state === "COMPLETED" ? "FINISHED" : "RELEASING",
    scheduleCheckedAt: new Date(),
    totalEpisodes: entry.state === "COMPLETED" ? 28 : null,
  };
  await prisma.animeReminder.upsert({
    where: { userId_anilistId: { userId: user.id, anilistId: entry.anilistId } },
    create: { userId: user.id, anilistId: entry.anilistId, ...data },
    update: data,
  });
}
console.log("Local QA account and illustrative schedules ready; scheduler delivery remains disabled.");
await prisma.$disconnect();
}

main().catch(error => { console.error(error); process.exitCode = 1; });
