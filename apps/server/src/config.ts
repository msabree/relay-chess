import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET must be at least 16 characters'),
  MONGODB_URL: z.string().optional().transform((v) => (v ? v : undefined)),
  DATABASE_NAME: z.string().default('relaychess'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
  GUEST_LOGIN: z
    .string()
    .default('true')
    .transform((v) => v !== 'false'),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid server config:\n${issues}\nSee apps/server/.env.example`);
  }
  return parsed.data;
}
