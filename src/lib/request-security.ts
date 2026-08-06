import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class RequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function readJson(request: Request, maxBytes = 8_192) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new RequestError("Content-Type must be application/json", 415);
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestError("Request body is too large", 413);
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new RequestError("Request body is too large", 413);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new RequestError("Malformed JSON", 400);
  }
}

export function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const configuredUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  try {
    return new URL(origin).origin === new URL(configuredUrl ?? request.url).origin;
  } catch {
    return false;
  }
}

export function getClientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-real-ip")
    ?? forwarded
    ?? "unknown";
}

function rateLimitKey(scope: string, identifier: string) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");
  return createHmac("sha256", secret).update(`${scope}:${identifier}`).digest("hex");
}

export async function consumeRateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowMs: number,
  blockMs = windowMs,
) {
  const key = rateLimitKey(scope, identifier);
  for (let retry = 0; retry < 3; retry += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const now = new Date();
        const existing = await tx.rateLimit.findUnique({ where: { key } });
        if (existing?.blockedUntil && existing.blockedUntil > now) {
          return { allowed: false, retryAfter: Math.ceil((existing.blockedUntil.getTime() - now.getTime()) / 1_000) };
        }
        if (!existing || now.getTime() - existing.windowStartedAt.getTime() >= windowMs) {
          await tx.rateLimit.upsert({
            where: { key },
            create: { key, attempts: 1, windowStartedAt: now },
            update: { attempts: 1, windowStartedAt: now, blockedUntil: null },
          });
          return { allowed: true, retryAfter: 0 };
        }
        const attempts = existing.attempts + 1;
        const blockedUntil = attempts > limit ? new Date(now.getTime() + blockMs) : null;
        await tx.rateLimit.update({ where: { key }, data: { attempts, blockedUntil } });
        return {
          allowed: attempts <= limit,
          retryAfter: blockedUntil ? Math.ceil(blockMs / 1_000) : 0,
        };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) continue;
      throw error;
    }
  }
  return { allowed: false, retryAfter: Math.ceil(blockMs / 1_000) };
}

export async function checkRateLimit(scope: string, identifier: string) {
  const existing = await prisma.rateLimit.findUnique({ where: { key: rateLimitKey(scope, identifier) } });
  const now = Date.now();
  if (!existing?.blockedUntil || existing.blockedUntil.getTime() <= now) {
    return { allowed: true, retryAfter: 0 };
  }
  return {
    allowed: false,
    retryAfter: Math.ceil((existing.blockedUntil.getTime() - now) / 1_000),
  };
}

export async function resetRateLimit(scope: string, identifier: string) {
  await prisma.rateLimit.deleteMany({ where: { key: rateLimitKey(scope, identifier) } });
}
