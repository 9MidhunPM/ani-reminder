import { runScheduler } from "@/lib/scheduling/runner";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try { return Response.json(await runScheduler()); }
  catch { return Response.json({ error: "Scheduler unavailable" }, { status: 503 }); }
}
