import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  surname: z.string().max(100).optional(),
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

export const loginSchema = z
  .object({
    email: z.string().email().optional(),
    username: z.string().min(3).max(50).optional(),
    password: z.string().min(6).max(100),
  })
  .refine(
    (data) => Boolean(data.email || data.username),
    "Either email or username must be provided",
  );

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});




