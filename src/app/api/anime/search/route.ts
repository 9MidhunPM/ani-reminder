import { NextResponse } from "next/server";
import { searchAnime } from "@/lib/jikan";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length < 2) return NextResponse.json({ results: [] });
  try {
    return NextResponse.json({ results: await searchAnime(query) });
  } catch {
    return NextResponse.json({ error: "Search is unavailable right now" }, { status: 503 });
  }
}
