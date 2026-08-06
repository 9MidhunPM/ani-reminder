import { NextResponse } from "next/server";
import { searchAnime } from "@/lib/anilist";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length < 2) return NextResponse.json({ results: [] });
  try {
    return NextResponse.json({ results: await searchAnime(query) });
  } catch (error) {
    console.error("AniList search failed", error);
    return NextResponse.json({ error: "AniList search is unavailable right now" }, { status: 503 });
  }
}
