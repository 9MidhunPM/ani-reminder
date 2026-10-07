import { runScheduler } from "@/lib/scheduling/runner";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runScheduler();
    console.info("Scheduler summary", JSON.stringify(summary));
    return Response.json(summary);
  } catch {
    console.error("Scheduler unavailable");
    return Response.json({ error: "Scheduler unavailable" }, { status: 503 });
  }
}
