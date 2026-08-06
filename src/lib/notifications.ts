export async function sendNtfy(topic: string, title: string, message: string, tags: string) {
  const response = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
    method: "POST",
    headers: {
      "Title": title,
      "Tags": tags,
      "Priority": "high",
      "Content-Type": "text/plain; charset=utf-8",
    },
    body: message,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`ntfy returned ${response.status}`);
}
