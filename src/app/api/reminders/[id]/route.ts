import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasSameOrigin, readJson, RequestError } from "@/lib/request-security";
import { reminderIdSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  if (!reminderIdSchema.safeParse(id).success) return NextResponse.json({ error: "Invalid reminder" }, { status: 400 });
  let body: unknown;
  try {
    body = await readJson(request);
  } catch (error) {
    if (error instanceof RequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
  if (!body || typeof body !== "object" || !("enabled" in body) || typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }
  const reminder = await prisma.animeReminder.updateMany({ where: { id, userId: session.user.id }, data: { enabled: body.enabled } });
  if (reminder.count !== 1) return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  if (!reminderIdSchema.safeParse(id).success) return NextResponse.json({ error: "Invalid reminder" }, { status: 400 });
  const reminder = await prisma.animeReminder.deleteMany({ where: { id, userId: session.user.id } });
  if (reminder.count !== 1) return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
