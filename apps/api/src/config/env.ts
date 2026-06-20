import { z } from "zod"

const EnvSchema = z.object({
  ADMIN_PASSWORD: z.string().min(1),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  AUTH_SECRET: z.string().min(16),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  INSTANCE_ID: z.string().min(1).default("local-dev"),
})

export type AppConfig = z.infer<typeof EnvSchema>

export function loadConfig(): AppConfig {
  return EnvSchema.parse(process.env)
}
