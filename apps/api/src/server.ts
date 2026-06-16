import pino from "pino"
import { loadConfig } from "./config/env.js"
import { createPrismaClient } from "./db.js"
import { createApp } from "./http/app.js"

const logger = pino()

async function main(): Promise<void> {
  const config = loadConfig()
  const prisma = createPrismaClient()
  const app = createApp(config, prisma)

  const server = app.listen(config.API_PORT, () => {
    logger.info({ port: config.API_PORT }, "pError API listening")
  })

  const shutdown = async (): Promise<void> => {
    server.close()
    await prisma.$disconnect()
  }

  process.on("SIGINT", () => {
    void shutdown().then(() => process.exit(0))
  })
  process.on("SIGTERM", () => {
    void shutdown().then(() => process.exit(0))
  })
}

try {
  await main()
} catch (error) {
  logger.error({ error }, "pError API failed to start")
  process.exit(1)
}
