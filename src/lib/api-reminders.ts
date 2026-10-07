import type { AnimeReminder } from "@prisma/client";
import type { AnimeSearchResult } from "./anilist";
import type { ReminderView } from "./reminder-view";
import { authorize, parseJson, type Authenticate } from "./api-context";
import { addReminderSchema, reminderIdSchema, updateReminderSchema } from "./validation";

export type ReminderDependencies = {
  authenticate: Authenticate;
  list: (userId: string) => Promise<AnimeReminder[]>;
  find: (userId: string, id: string) => Promise<AnimeReminder | null>;
  findExisting: (userId: string, anilistId: number, malId?: number | null) => Promise<AnimeReminder | null>;
  getAnime: (anilistId: number) => Promise<AnimeSearchResult>;
  create: (userId: string, anime: AnimeSearchResult) => Promise<AnimeReminder>;
  setEnabled: (userId: string, id: string, enabled: boolean) => Promise<AnimeReminder | null>;
  remove: (userId: string, id: string) => Promise<boolean>;
  reconcile: (reminder: AnimeReminder, anime: AnimeSearchResult) => Promise<AnimeReminder>;
  serialize: (reminder: AnimeReminder) => ReminderView;
};

const providerFailure = () => Response.json({ error: "AniList could not verify this schedule. Please try again shortly." }, { status: 502 });

export function reminderHandlers(deps: ReminderDependencies) {
  return {
    async GET() {
      const userId = await authorize(deps.authenticate);
      if (userId instanceof Response) return userId;
      return Response.json({ reminders: (await deps.list(userId)).map(deps.serialize) });
    },
    async POST(request: Request) {
      const userId = await authorize(deps.authenticate, request);
      if (userId instanceof Response) return userId;
      const result = await parseJson(request);
      if (result.response) return result.response;
      const parsed = addReminderSchema.safeParse(result.body);
      if (!parsed.success) return Response.json({ error: "Invalid anime" }, { status: 400 });
      // Return an existing subscription without changing its paused state.
      let existing = await deps.findExisting(userId, parsed.data.anilistId);
      if (existing) return Response.json({ reminder: deps.serialize(existing), tracked: true, created: false });
      let anime: AnimeSearchResult;
      try { anime = await deps.getAnime(parsed.data.anilistId); } catch { return providerFailure(); }
      if (anime.anilistId !== parsed.data.anilistId) return providerFailure();
      existing = await deps.findExisting(userId, anime.anilistId, anime.malId);
      if (existing) return Response.json({ reminder: deps.serialize(existing), tracked: true, created: false });
      if (anime.status === "FINISHED" || anime.status === "CANCELLED") {
        return Response.json({ error: "This season has ended and cannot receive new episode reminders." }, { status: 422 });
      }
      let reminder: AnimeReminder;
      try {
        reminder = await deps.create(userId, anime);
      } catch (error) {
        // Concurrent add requests converge on the same owner-scoped record.
        if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
          const duplicate = await deps.findExisting(userId, anime.anilistId, anime.malId);
          if (duplicate) return Response.json({ reminder: deps.serialize(duplicate), tracked: true, created: false });
        }
        throw error;
      }
      try { reminder = await deps.reconcile(reminder, anime); } catch { return providerFailure(); }
      return Response.json({ reminder: deps.serialize(reminder), tracked: false, created: true }, { status: 201 });
    },
    async PATCH(request: Request, id: string) {
      const userId = await authorize(deps.authenticate, request);
      if (userId instanceof Response) return userId;
      if (!reminderIdSchema.safeParse(id).success) return Response.json({ error: "Invalid reminder" }, { status: 400 });
      const result = await parseJson(request);
      if (result.response) return result.response;
      const parsed = updateReminderSchema.safeParse(result.body);
      if (!parsed.success) return Response.json({ error: "Invalid reminder state" }, { status: 400 });
      const existing = await deps.find(userId, id);
      if (!existing) return Response.json({ error: "Reminder not found" }, { status: 404 });
      let anime: AnimeSearchResult | null = null;
      if (parsed.data.enabled) {
        if (!existing.anilistId) return Response.json({ error: "Re-add this title from Discover to verify its schedule." }, { status: 422 });
        try { anime = await deps.getAnime(existing.anilistId); } catch { return providerFailure(); }
        if (anime.anilistId !== existing.anilistId) return providerFailure();
      }
      let reminder = await deps.setEnabled(userId, id, parsed.data.enabled);
      if (!reminder) return Response.json({ error: "Reminder not found" }, { status: 404 });
      if (anime) {
        try { reminder = await deps.reconcile(reminder, anime); } catch { return providerFailure(); }
      }
      return Response.json({ reminder: deps.serialize(reminder) });
    },
    async DELETE(request: Request, id: string) {
      const userId = await authorize(deps.authenticate, request);
      if (userId instanceof Response) return userId;
      if (!reminderIdSchema.safeParse(id).success) return Response.json({ error: "Invalid reminder" }, { status: 400 });
      if (!await deps.remove(userId, id)) return Response.json({ error: "Reminder not found" }, { status: 404 });
      return Response.json({ ok: true });
    },
  };
}
