import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, getClientAddress, hasSameOrigin, readJson, RequestError } from "@/lib/request-security";
import { encryptSecret } from "@/lib/secrets";
import { signupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await readJson(request);
  } catch (error) {
    if (error instanceof RequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid details" },
      { status: 400 },
    );
  }

  const [addressLimit, pairLimit] = await Promise.all([
    consumeRateLimit("signup-ip", getClientAddress(request), 5, 60 * 60_000, 6 * 60 * 60_000),
    consumeRateLimit("signup-pair", `${getClientAddress(request)}:${parsed.data.email}`, 3, 60 * 60_000, 6 * 60 * 60_000),
  ]);
  if (!addressLimit.allowed || !pairLimit.allowed) {
    const retryAfter = Math.max(addressLimit.retryAfter, pairLimit.retryAfter);
    return NextResponse.json(
      { error: "Too many account creation attempts. Try again later." },
      { status: 429, headers: { "Retry-After": retryAfter.toString() } },
    );
  }

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) {
    await bcrypt.compare(parsed.data.password, exists.passwordHash);
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    await prisma.user.create({
      data: {
        email: parsed.data.email,
        passwordHash,
        ntfyTopic: encryptSecret(parsed.data.ntfyTopic),
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
