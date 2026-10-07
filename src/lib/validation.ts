import { z } from "zod";

const passwordBytes = (value: string) => new TextEncoder().encode(value).byteLength <= 72;

export const ntfyTopicSchema = z.string().trim()
  .min(12, "Use at least 12 characters for a private topic")
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/, "Use letters, numbers, dashes, or underscores");

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email(),
  password: z.string().min(8).refine(passwordBytes, "Password is too long"),
});

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email(),
  password: z
    .string()
    .min(12, "Use at least 12 characters")
    .refine(passwordBytes, "Password is too long"),
  ntfyTopic: ntfyTopicSchema,
});

export const addReminderSchema = z.object({
  anilistId: z.number().int().positive(),
}).strict();

export const reminderIdSchema = z.string().regex(/^c[a-z0-9]{20,63}$/);

export const updateReminderSchema = z.object({ enabled: z.boolean() }).strict();

export const updateAccountSchema = z.object({
  morningEnabled: z.boolean().optional(),
  airtimeEnabled: z.boolean().optional(),
  ntfyTopic: ntfyTopicSchema.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Choose a setting to update");

export const notificationCursorSchema = reminderIdSchema;
export const testNotificationSchema = z.object({}).strict();
