import { createPErrorMiddleware } from "@perror/sdk-express"
import express from "express"
import pino from "pino"
import { z } from "zod"
import {
  SampleAsyncJobError,
  SampleAuthError,
  SampleDatabaseError,
  SampleRandomError,
} from "./errors.js"

const EnvSchema = z.object({
  PERROR_API_KEY: z.string().min(1),
  PERROR_API_URL: z.string().url().default("http://localhost:4000"),
  SAMPLE_PORT: z.coerce.number().int().min(1).max(65535).default(4100),
})

const env = EnvSchema.parse(process.env)
const logger = pino()
const app = express()
const monitor = createPErrorMiddleware({
  apiKey: env.PERROR_API_KEY,
  endpoint: env.PERROR_API_URL,
  environment: "local",
  onCaptureError(error: unknown) {
    logger.warn({ error }, "pError capture failed")
  },
  release: "sample-server@0.1.0",
})

app.use(express.json())
app.use(monitor.requestHandler())

app.get("/ok", (_request, response) => {
  response.json({ ok: true, service: "sample-server" })
})

app.get("/error/sync", () => {
  throw new SampleRandomError()
})

app.get("/error/db", () => {
  throw new SampleDatabaseError()
})

app.get("/error/auth", () => {
  throw new SampleAuthError()
})

app.get("/error/async", async () => {
  await Promise.reject(new SampleAsyncJobError())
})

app.use(monitor.errorHandler())

app.listen(env.SAMPLE_PORT, () => {
  logger.info({ port: env.SAMPLE_PORT }, "sample server listening")
})
