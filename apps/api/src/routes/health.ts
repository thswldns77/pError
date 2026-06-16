import { Router } from "express"

export function healthRouter(): Router {
  const router = Router()

  router.get("/health", (_request, response) => {
    response.json({
      ok: true,
      service: "pError API",
      checkedAt: new Date().toISOString(),
    })
  })

  return router
}
