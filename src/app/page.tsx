import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const reminders = await prisma.animeReminder.findMany({
    where: { userId: session.user.id },
    orderBy: [{ enabled: "desc" }, { nextAiringAt: "asc" }],
  });
  return <Dashboard initialReminders={reminders} email={session.user.email ?? ""} />;
}
