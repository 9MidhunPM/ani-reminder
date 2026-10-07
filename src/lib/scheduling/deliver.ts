import type { NotificationDelivery } from "@prisma/client";
import type { AnimeSearchResult, AiringRecord } from "../anilist";
import { confirmedEpisode, deliveryWindow } from "./policy";

export type DeliveryContext = { anime: AnimeSearchResult; airing: AiringRecord | null };
export type DeliveryDependencies = {
  now: () => Date;
  confirm: (mediaId: number, episode: number) => Promise<DeliveryContext>;
  reconcile: (delivery: NotificationDelivery, context: DeliveryContext) => Promise<NotificationDelivery | null>;
  claim: (delivery: NotificationDelivery, now: Date) => Promise<boolean>;
  authorized: (delivery: NotificationDelivery, now: Date) => Promise<boolean>;
  publish: (delivery: NotificationDelivery) => Promise<{ id: string }>;
  finish: (id: string, state: "SENT" | "FAILED" | "UNCERTAIN" | "SKIPPED", error: string | null, receiptId?: string) => Promise<void>;
};

/** External I/O is injected so tests exercise the production ordering without sending messages. */
export async function deliverEpisode(candidate: NotificationDelivery, cutoverAt: Date, deps: DeliveryDependencies) {
  if (!candidate.anilistId || !candidate.episode || candidate.kind === "TEST") return "ignored";
  let context: DeliveryContext;
  try { context = await deps.confirm(candidate.anilistId, candidate.episode); }
  catch { return "deferred"; }
  if (!confirmedEpisode(context.anime, context.airing, candidate.episode, deps.now())) {
    await deps.finish(candidate.id, "SKIPPED", "No currently confirmed episode schedule");
    return "skipped";
  }
  const delivery = await deps.reconcile(candidate, context);
  if (!delivery || !delivery.airingAt) return "ignored";
  const window = deliveryWindow(delivery.kind, delivery.airingAt, deps.now(), cutoverAt);
  if (window === "future") return "deferred";
  if (window === "expired") {
    await deps.finish(delivery.id, "SKIPPED", "Delivery window expired or predates cutover");
    return "skipped";
  }
  if (!await deps.claim(delivery, deps.now())) return "ignored";
  if (!await deps.authorized(delivery, deps.now()) || deliveryWindow(delivery.kind, delivery.airingAt, deps.now(), cutoverAt) !== "due") {
    await deps.finish(delivery.id, "SKIPPED", "Reminder or delivery window is no longer active");
    return "skipped";
  }
  let receipt: { id: string };
  try { receipt = await deps.publish(delivery); }
  catch (error) {
    const definite = typeof error === "object" && error !== null && "uncertain" in error && error.uncertain === false;
    const state = definite ? "FAILED" : "UNCERTAIN";
    await deps.finish(delivery.id, state, definite ? "Notification provider rejected the request" : "Delivery could not be confirmed; it may have arrived");
    return state.toLowerCase();
  }
  // If persistence fails after acceptance, leave CLAIMED for recovery to UNCERTAIN.
  await deps.finish(delivery.id, "SENT", null, receipt.id);
  return "sent";
}
