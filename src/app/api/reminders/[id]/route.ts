import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { enabled?: boolean };
  if (typeof body.enabled !== "boolean") return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  const reminder = await prisma.animeReminder.updateMany({ where: { id, userId: session.user.id }, data: { enabled: body.enabled } });
  return NextResponse.json({ ok: reminder.count === 1 });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.animeReminder.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
