import { authorize, parseJson, type Authenticate } from "./api-context";
import { serializeAccountSettings, type AccountRecord } from "./account-settings";
import { updateAccountSchema } from "./validation";

export type AccountUpdate = { morningEnabled?: boolean; airtimeEnabled?: boolean; ntfyTopic?: string };
export type AccountDependencies = {
  authenticate: Authenticate;
  find: (userId: string) => Promise<AccountRecord | null>;
  update: (userId: string, data: AccountUpdate) => Promise<AccountRecord | null>;
  remove: (userId: string) => Promise<void>;
  encrypt: (topic: string) => string;
};

export function accountHandlers(deps: AccountDependencies) {
  return {
    async GET() {
      const userId = await authorize(deps.authenticate);
      if (userId instanceof Response) return userId;
      const account = await deps.find(userId);
      if (!account) return Response.json({ error: "Account not found" }, { status: 404 });
      return Response.json({ settings: serializeAccountSettings(account) });
    },
    async PATCH(request: Request) {
      const userId = await authorize(deps.authenticate, request);
      if (userId instanceof Response) return userId;
      const result = await parseJson(request);
      if (result.response) return result.response;
      const parsed = updateAccountSchema.safeParse(result.body);
      if (!parsed.success) return Response.json({ error: "Invalid notification settings" }, { status: 400 });
      const data: AccountUpdate = { ...parsed.data };
      if (data.ntfyTopic !== undefined) data.ntfyTopic = deps.encrypt(data.ntfyTopic);
      const account = await deps.update(userId, data);
      if (!account) return Response.json({ error: "Account not found" }, { status: 404 });
      return Response.json({ settings: serializeAccountSettings(account) });
    },
    async DELETE(request: Request) {
      const userId = await authorize(deps.authenticate, request);
      if (userId instanceof Response) return userId;
      await deps.remove(userId);
      return Response.json({ ok: true });
    },
  };
}
