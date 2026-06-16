import type { PrismaClient } from "@prisma/client"
import { IssueStatus } from "@prisma/client"
import { Router } from "express"
import { z } from "zod"
import { AppError } from "../errors/app-error.js"
import { asyncHandler } from "../http/async-handler.js"
import { createIssueFingerprint, stackFirstLine } from "../services/fingerprint.js"
import { hashSecret } from "../utils/crypto.js"

const EventBodySchema = z.object({
  environment: z.string().min(1).default("production"),
  hostname: z.string().min(1).optional(),
  message: z.string().min(1),
  method: z.string().min(1),
  path: z.string().min(1),
  release: z.string().min(1).optional(),
  requestId: z.string().min(1).optional(),
  stack: z.string().min(1).optional(),
  statusCode: z.number().int().min(400).max(599),
})

function readApiKey(headerValue: string | readonly string[] | undefined): string {
  if (typeof headerValue === "string" && headerValue.trim().length > 0) {
    return headerValue.trim()
  }
  throw new AppError(401, "MISSING_SERVICE_KEY", "서비스 API Key가 필요합니다.")
}

export function eventsRouter(prisma: PrismaClient): Router {
  const router = Router()

  router.post(
    "/api/events",
    asyncHandler(async (request, response) => {
      const rawKey = readApiKey(request.headers["x-perror-key"])
      const apiKey = await prisma.apiKey.findUnique({
        include: { service: true },
        where: { keyHash: hashSecret(rawKey) },
      })

      if (apiKey === null || !apiKey.active) {
        throw new AppError(401, "INVALID_SERVICE_KEY", "유효하지 않은 서비스 API Key입니다.")
      }

      const body = EventBodySchema.parse(request.body)
      const stack = body.stack ?? null
      const firstLine = stackFirstLine(stack, body.message)
      const fingerprint = createIssueFingerprint({
        message: body.message,
        path: body.path,
        serviceId: apiKey.serviceId,
        stack,
      })
      const now = new Date()

      const issue = await prisma.issue.upsert({
        create: {
          fingerprint,
          firstSeenAt: now,
          lastSeenAt: now,
          message: body.message,
          occurrences: 1,
          path: body.path,
          serviceId: apiKey.serviceId,
          stackFirstLine: firstLine,
          status: IssueStatus.OPEN,
        },
        update: {
          lastSeenAt: now,
          occurrences: { increment: 1 },
          resolvedAt: null,
          status: IssueStatus.OPEN,
        },
        where: {
          serviceId_fingerprint: {
            fingerprint,
            serviceId: apiKey.serviceId,
          },
        },
      })

      const event = await prisma.errorEvent.create({
        data: {
          environment: body.environment,
          hostname: body.hostname ?? null,
          issueId: issue.id,
          message: body.message,
          method: body.method,
          path: body.path,
          release: body.release ?? null,
          requestId: body.requestId ?? null,
          serviceId: apiKey.serviceId,
          stack,
          statusCode: body.statusCode,
        },
      })

      response.status(202).json({
        eventId: event.id,
        issueId: issue.id,
        status: issue.status,
      })
    }),
  )

  return router
}
