import { prisma } from "../src/lib/prisma";
import { runScheduler } from "../src/lib/scheduling/runner";

async function main() {
  const command = process.argv[2] ?? "status";
  if (command === "reconcile") {
    console.log(JSON.stringify(await runScheduler({ delivery: false })));
    return;
  }
  if (command === "enable" || command === "disable") {
    if (command === "enable") {
      const unverified = await prisma.animeReminder.count({ where: { enabled: true, anilistId: { not: null }, scheduleState: "UNVERIFIED" } });
      if (unverified) throw new Error(`${unverified} active schedules still require verification; run reconcile first`);
    }
    const control = await prisma.schedulerControl.update({ where: { id: "main" }, data: { deliveryEnabled: command === "enable" } });
    console.log(JSON.stringify({ deliveryEnabled: control.deliveryEnabled, cutoverAt: control.cutoverAt }));
    return;
  }
  if (command !== "status") throw new Error("Usage: npm run scheduler -- status|reconcile|enable|disable");
  const [control, schedules, deliveries] = await Promise.all([
    prisma.schedulerControl.findUniqueOrThrow({ where: { id: "main" } }),
    prisma.animeReminder.groupBy({ by: ["scheduleState"], _count: true }),
    prisma.notificationDelivery.groupBy({ by: ["state"], _count: true }),
  ]);
  console.log(JSON.stringify({ deliveryEnabled: control.deliveryEnabled, cutoverAt: control.cutoverAt,
    leaseActive: !!control.leaseUntil && control.leaseUntil > new Date(), providerBackoffUntil: control.providerBackoffUntil,
    schedules, deliveries }));
}

main().catch((error: unknown) => {
  // Configuration/database exceptions can contain connection strings: never echo them.
  console.error(error instanceof Error && error.message.startsWith("Usage:") ? error.message : "Scheduler command failed. Verify database availability and active schedule verification before enabling.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
