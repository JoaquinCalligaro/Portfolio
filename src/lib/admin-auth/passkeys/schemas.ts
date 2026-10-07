import { z } from 'astro/zod';

const webauthnResponse = z
  .object({ id: z.string().min(1).max(1024) })
  .passthrough();

export const loginVerifySchema = z.object({
  attemptId: z.string().uuid(),
  response: webauthnResponse,
});

export const registerVerifySchema = z.object({
  attemptId: z.string().uuid(),
  response: webauthnResponse,
  label: z.string().trim().max(60).default(''),
});

export const idSchema = z.string().uuid();
