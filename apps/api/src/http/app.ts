import type { PrismaClient } from "@prisma/client"
import cors from "cors"
import express from "express"
import type { AppConfig } from "../config/env.js"
import { adminRouter } from "../routes/admin.js"
import { eventsRouter } from "../routes/events.js"
import { healthRouter } from "../routes/health.js"
import { errorMiddleware } from "./error-middleware.js"

export function createApp(config: AppConfig, prisma: PrismaClient): express.Express {
  const app = express()

  app.use(cors({ origin: config.CORS_ORIGIN }))
  app.use(express.json({ limit: "256kb" }))
  app.use(healthRouter())
  app.use(adminRouter(config, prisma))
  app.use(eventsRouter(prisma))
  app.use(errorMiddleware)

  return app
}
