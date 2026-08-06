import { handlers } from "@/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/request-security";

export const { GET } = handlers;

export function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 16_384) {
    return NextResponse.json({ error: "Request body is too large" }, { status: 413 });
  }
  return handlers.POST(request);
}
