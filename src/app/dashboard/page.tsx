import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeReminder } from "@/lib/serialize-reminder";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your lineup", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const reminders = await prisma.animeReminder.findMany({
    where: { userId: session.user.id },
    orderBy: [{ enabled: "desc" }, { nextAiringAt: "asc" }],
  });
  return <Dashboard initialReminders={reminders.map(serializeReminder)} email={session.user.email ?? ""} initialNow={new Date().toISOString()} />;
}
