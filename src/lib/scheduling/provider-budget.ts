import { prisma } from "../prisma";

export class ProviderDeferred extends Error {
  constructor(readonly retryAt: Date) { super("Schedule provider is temporarily unavailable. Please try again shortly."); }
}

/** Shared across API requests, replicas and cron; never issue speculative requests. */
export async function reserveProviderRequest() {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const now = new Date();
    const control = await prisma.schedulerControl.findUniqueOrThrow({ where: { id: "main" } });
    if (control.providerBackoffUntil && control.providerBackoffUntil > now) throw new ProviderDeferred(control.providerBackoffUntil);
    const wait = (control.nextProviderRequestAt?.getTime() ?? 0) - now.getTime();
    if (wait > 0 && wait <= 2_200 && attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, wait + 5));
      continue;
    }
    if (wait > 0) throw new ProviderDeferred(control.nextProviderRequestAt!);
    const reserved = await prisma.schedulerControl.updateMany({
      where: { id: "main", AND: [
        { OR: [{ nextProviderRequestAt: null }, { nextProviderRequestAt: { lte: now } }] },
        { OR: [{ providerBackoffUntil: null }, { providerBackoffUntil: { lte: now } }] },
      ] },
      data: { nextProviderRequestAt: new Date(now.getTime() + 2_100) },
    });
    if (reserved.count === 1) return;
  }
  throw new ProviderDeferred(new Date(Date.now() + 3_000));
}

export async function backoffProvider(response?: Response) {
  const retry = Number(response?.headers.get("retry-after"));
  const reset = Number(response?.headers.get("x-ratelimit-reset")) * 1_000;
  const delay = Number.isFinite(retry) && retry > 0 ? retry * 1_000 : 60_000;
  const until = new Date(Math.max(Date.now() + delay, Number.isFinite(reset) ? reset : 0));
  await prisma.schedulerControl.update({ where: { id: "main" }, data: { providerBackoffUntil: until } });
  return until;
}
