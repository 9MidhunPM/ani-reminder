const JIKAN_URL = "https://api.jikan.moe/v4";

export type AnimeSearchResult = {
  malId: number;
  title: string;
  titleEnglish: string | null;
  imageUrl: string;
  type: string | null;
  episodes: number | null;
  status: string | null;
  airing: boolean;
  nextAiringAt: string | null;
  broadcastDay: string | null;
  broadcastTime: string | null;
  broadcastTimezone: string | null;
};

type JikanAnime = {
  mal_id: number;
  title: string;
  title_english: string | null;
  images?: { jpg?: { large_image_url?: string; image_url?: string } };
  type: string | null;
  episodes: number | null;
  status: string | null;
  airing: boolean;
  broadcast?: { day: string | null; time: string | null; timezone: string | null };
};

function nextBroadcast(day: string | null, time: string | null, timezone: string | null) {
  if (!day || !time) return null;
  const dayIndex: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const targetDay = dayIndex[day];
  if (targetDay === undefined) return null;
  const [hour, minute] = time.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  const now = new Date();
  const candidate = new Date(now);
  const daysUntil = (targetDay - now.getUTCDay() + 7) % 7;
  candidate.setUTCDate(now.getUTCDate() + daysUntil);
  candidate.setUTCHours(hour, minute, 0, 0);
  if (candidate <= now) candidate.setUTCDate(candidate.getUTCDate() + 7);

  // Jikan's timezone is an IANA zone. Runtime environments may not expose a
  // timezone database, so UTC is a safe fallback for irregular broadcasts.
  if (timezone && timezone !== "UTC") {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(candidate);
      const displayedHour = Number(parts.find((part) => part.type === "hour")?.value);
      const displayedMinute = Number(parts.find((part) => part.type === "minute")?.value);
      const offset = (displayedHour * 60 + displayedMinute) - (candidate.getUTCHours() * 60 + candidate.getUTCMinutes());
      candidate.setUTCMinutes(candidate.getUTCMinutes() - offset);
    } catch {
      // Keep the UTC candidate when an uncommon timezone is unavailable.
    }
  }
  return candidate.toISOString();
}

function normalize(anime: JikanAnime): AnimeSearchResult {
  const broadcast = anime.broadcast;
  return {
    malId: anime.mal_id,
    title: anime.title,
    titleEnglish: anime.title_english,
    imageUrl: anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url ?? "",
    type: anime.type,
    episodes: anime.episodes,
    status: anime.status,
    airing: anime.airing,
    nextAiringAt: nextBroadcast(broadcast?.day ?? null, broadcast?.time ?? null, broadcast?.timezone ?? null),
    broadcastDay: broadcast?.day ?? null,
    broadcastTime: broadcast?.time ?? null,
    broadcastTimezone: broadcast?.timezone ?? null,
  };
}

export async function searchAnime(query: string) {
  const response = await fetch(`${JIKAN_URL}/anime?q=${encodeURIComponent(query)}&limit=8&sfw=true`, {
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error("Jikan search is temporarily unavailable");
  const payload = (await response.json()) as { data: JikanAnime[] };
  return payload.data.map(normalize);
}

export async function getAnime(malId: number) {
  const response = await fetch(`${JIKAN_URL}/anime/${malId}/full`, { next: { revalidate: 300 } });
  if (!response.ok) throw new Error("Anime details are temporarily unavailable");
  const payload = (await response.json()) as { data: JikanAnime };
  return normalize(payload.data);
}
