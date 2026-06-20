import { Router } from "express"
import type { AppConfig } from "../config/env.js"

export function healthRouter(config: AppConfig): Router {
  const router = Router()

  router.get("/health", (_request, response) => {
    response.json({
      ok: true,
      service: "pError API",
      checkedAt: new Date().toISOString(),
      instanceId: config.INSTANCE_ID,
    })
  })

  return router
}
