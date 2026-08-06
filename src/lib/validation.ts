import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
});

export const signupSchema = credentialsSchema.extend({
  ntfyTopic: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/, "Use letters, numbers, dashes, or underscores"),
});

export const addReminderSchema = z.object({
  anilistId: z.number().int().positive(),
});
