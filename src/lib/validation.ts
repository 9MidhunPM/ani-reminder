import { z } from "zod";

const passwordBytes = (value: string) => new TextEncoder().encode(value).byteLength <= 72;

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
  ntfyTopic: z
    .string()
    .trim()
    .min(12, "Use at least 12 characters for a private topic")
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/, "Use letters, numbers, dashes, or underscores"),
});

export const addReminderSchema = z.object({
  anilistId: z.number().int().positive(),
});

export const reminderIdSchema = z.string().regex(/^c[a-z0-9]{20,63}$/);
