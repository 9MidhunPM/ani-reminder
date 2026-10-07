export class NotificationError extends Error {
  constructor(message: string, readonly uncertain: boolean) { super(message); }
}

export async function sendNtfy(topic: string, title: string, message: string, tags: string, sequenceId?: string): Promise<{ id: string }> {
  let response: Response;
  try { response = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
    method: "POST",
    headers: {
      "Title": title,
      "Tags": tags,
      "Priority": "high",
      "Content-Type": "text/plain; charset=utf-8",
      ...(sequenceId ? { "X-Sequence-ID": sequenceId } : {}),
    },
    body: message,
    signal: AbortSignal.timeout(10_000),
  }); } catch { throw new NotificationError("Notification delivery could not be confirmed", true); }
  if (!response.ok) throw new NotificationError("Notification provider rejected the request", response.status >= 500);
  try {
    const receipt = await response.json() as { id?: unknown; event?: unknown };
    if (typeof receipt.id !== "string" || !receipt.id || receipt.event !== "message") throw new Error("Invalid receipt");
    return { id: receipt.id };
  } catch { throw new NotificationError("Notification receipt could not be confirmed", true); }
}
