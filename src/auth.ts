import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, consumeRateLimit, getClientAddress, resetRateLimit } from "@/lib/request-security";
import { encryptSecret, isEncryptedSecret } from "@/lib/secrets";
import { credentialsSchema } from "@/lib/validation";

const DUMMY_PASSWORD_HASH = "$2b$12$dGRJQOKu3IZDCkIX247a5e8ZlheN2QZOQ0LBGi91zPeVmVME2b0hS";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(rawCredentials, request) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const address = getClientAddress(request);
        const [addressLimit, pairLimit] = await Promise.all([
          checkRateLimit("login-ip", address),
          checkRateLimit("login-pair", `${address}:${parsed.data.email}`),
        ]);
        if (!addressLimit.allowed || !pairLimit.allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        const valid = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
        if (!user || !valid) {
          await Promise.all([
            consumeRateLimit("login-ip", address, 20, 15 * 60_000, 30 * 60_000),
            consumeRateLimit("login-pair", `${address}:${parsed.data.email}`, 5, 15 * 60_000, 30 * 60_000),
          ]);
          return null;
        }

        const cleanup: Array<Promise<unknown>> = [
          resetRateLimit("login-pair", `${address}:${parsed.data.email}`),
        ];
        if (!isEncryptedSecret(user.ntfyTopic)) {
          cleanup.push(prisma.user.update({ where: { id: user.id }, data: { ntfyTopic: encryptSecret(user.ntfyTopic) } }));
        }
        await Promise.all(cleanup);

        return { id: user.id, email: user.email };
      },
    }),
  ],
});
