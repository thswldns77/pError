import { afterEach, describe, expect, it, vi } from "vitest"
import { loadConfig } from "../src/config/env.js"

describe("loadConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("accepts a short demo admin password for AWS Academy deployments", () => {
    vi.stubEnv("ADMIN_PASSWORD", "son")
    vi.stubEnv("AUTH_SECRET", "long-enough-auth-secret")
    vi.stubEnv("CORS_ORIGIN", "*")
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://perror:password@example.local:5432/perror?schema=public",
    )
    vi.stubEnv("API_PORT", "4000")

    expect(loadConfig().ADMIN_PASSWORD).toBe("son")
  })
})
