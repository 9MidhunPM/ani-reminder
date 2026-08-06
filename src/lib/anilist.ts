const ANILIST_URL = "https://graphql.anilist.co";

export type AnimeSearchResult = {
  anilistId: number;
  malId: number | null;
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
  broadcastTimezone: string;
  nextEpisode: number | null;
};

type AniListMedia = {
  id: number;
  idMal: number | null;
  title: { romaji: string; english: string | null };
  coverImage: { extraLarge: string | null; large: string | null };
  format: string | null;
  episodes: number | null;
  status: string | null;
  nextAiringEpisode: { airingAt: number; episode: number } | null;
};

const MEDIA_FIELDS = `
  id
  idMal
  title { romaji english }
  coverImage { extraLarge large }
  format
  episodes
  status
  nextAiringEpisode { airingAt episode }
`;

async function queryAniList<T>(query: string, variables: Record<string, unknown>) {
  const response = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(10_000),
    next: { revalidate: 60 },
  });
  const payload = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (!response.ok || !payload.data || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? `AniList returned ${response.status}`);
  }
  return payload.data;
}

function normalize(media: AniListMedia): AnimeSearchResult {
  const airingAt = media.nextAiringEpisode?.airingAt;
  const nextAiringAt = airingAt ? new Date(airingAt * 1000) : null;
  return {
    anilistId: media.id,
    malId: media.idMal,
    title: media.title.romaji,
    titleEnglish: media.title.english,
    imageUrl: media.coverImage.extraLarge ?? media.coverImage.large ?? "",
    type: media.format,
    episodes: media.episodes,
    status: media.status,
    airing: media.status === "RELEASING",
    nextAiringAt: nextAiringAt?.toISOString() ?? null,
    broadcastDay: nextAiringAt?.toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Kolkata" }) ?? null,
    broadcastTime: nextAiringAt?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }) ?? null,
    broadcastTimezone: "Asia/Kolkata",
    nextEpisode: media.nextAiringEpisode?.episode ?? null,
  };
}

export async function searchAnime(search: string) {
  const data = await queryAniList<{ Page: { media: AniListMedia[] } }>(
    `query SearchAnime($search: String!) {
      Page(page: 1, perPage: 12) {
        media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) { ${MEDIA_FIELDS} }
      }
    }`,
    { search },
  );
  return data.Page.media.filter((media) => media.coverImage.extraLarge || media.coverImage.large).map(normalize);
}

export async function getAnime(anilistId: number) {
  const data = await queryAniList<{ Media: AniListMedia | null }>(
    `query Anime($id: Int!) { Media(id: $id, type: ANIME) { ${MEDIA_FIELDS} } }`,
    { id: anilistId },
  );
  if (!data.Media) throw new Error("Anime not found on AniList");
  return normalize(data.Media);
}
