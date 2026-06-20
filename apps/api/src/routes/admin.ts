import type { PrismaClient } from "@prisma/client"
import { IssueStatus } from "@prisma/client"
import { Router } from "express"
import { z } from "zod"
import { createAdminToken } from "../auth/admin-token.js"
import type { AppConfig } from "../config/env.js"
import { AppError } from "../errors/app-error.js"
import { asyncHandler } from "../http/async-handler.js"
import { requireAdmin } from "../http/auth-middleware.js"
import { createApiKey, hashSecret } from "../utils/crypto.js"

const LoginSchema = z.object({
  password: z.string().min(1),
})

const CreateServiceSchema = z.object({
  environment: z.string().min(1).default("production"),
  name: z.string().min(2).max(80),
})

function issueIdFromParams(params: { readonly id?: string | readonly string[] }): string {
  const id = params.id
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new AppError(400, "ISSUE_ID_REQUIRED", "이슈 ID가 필요합니다.")
  }
  return id
}

export function adminRouter(config: AppConfig, prisma: PrismaClient): Router {
  const router = Router()
  const adminOnly = requireAdmin(config)

  router.post(
    "/api/auth/login",
    asyncHandler(async (request, response) => {
      const body = LoginSchema.parse(request.body)
      if (body.password !== config.ADMIN_PASSWORD) {
        throw new AppError(401, "LOGIN_FAILED", "관리자 비밀번호가 올바르지 않습니다.")
      }
      response.json({ token: createAdminToken(config.AUTH_SECRET) })
    }),
  )

  router.post(
    "/api/services",
    adminOnly,
    asyncHandler(async (request, response) => {
      const body = CreateServiceSchema.parse(request.body)
      const rawKey = createApiKey()
      const service = await prisma.service.create({
        data: {
          apiKeys: {
            create: {
              keyHash: hashSecret(rawKey),
              name: "default",
              prefix: rawKey.slice(0, 14),
            },
          },
          environment: body.environment,
          name: body.name,
        },
        include: { apiKeys: true },
      })
      const firstKey = service.apiKeys[0]
      if (firstKey === undefined) {
        throw new AppError(500, "API_KEY_CREATE_FAILED", "API Key 생성에 실패했습니다.")
      }
      response.status(201).json({
        apiKey: rawKey,
        createdAt: service.createdAt,
        environment: service.environment,
        id: service.id,
        keyPrefix: firstKey.prefix,
        name: service.name,
      })
    }),
  )

  router.get(
    "/api/services",
    adminOnly,
    asyncHandler(async (_request, response) => {
      const services = await prisma.service.findMany({
        include: {
          _count: { select: { events: true, issues: true } },
          apiKeys: {
            select: { active: true, createdAt: true, id: true, name: true, prefix: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
      response.json({ services })
    }),
  )

  router.get(
    "/api/dashboard/summary",
    adminOnly,
    asyncHandler(async (_request, response) => {
      const dayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24)
      const [totalEvents, openIssues, recentEvents, services] = await Promise.all([
        prisma.errorEvent.count(),
        prisma.issue.count({ where: { status: IssueStatus.OPEN } }),
        prisma.errorEvent.count({ where: { createdAt: { gte: dayAgo } } }),
        prisma.service.findMany({
          include: { _count: { select: { events: true, issues: true } } },
          orderBy: { createdAt: "desc" },
        }),
      ])
      response.json({
        instanceId: config.INSTANCE_ID,
        openIssues,
        recentEvents,
        services,
        totalEvents,
      })
    }),
  )

  router.get(
    "/api/issues",
    adminOnly,
    asyncHandler(async (_request, response) => {
      const issues = await prisma.issue.findMany({
        include: { service: { select: { environment: true, id: true, name: true } } },
        orderBy: { lastSeenAt: "desc" },
        take: 100,
      })
      response.json({ issues })
    }),
  )

  router.get(
    "/api/issues/:id",
    adminOnly,
    asyncHandler(async (request, response) => {
      const issueId = issueIdFromParams(request.params)
      const issue = await prisma.issue.findUnique({
        include: {
          events: { orderBy: { createdAt: "desc" }, take: 25 },
          service: { select: { environment: true, id: true, name: true } },
        },
        where: { id: issueId },
      })
      if (issue === null) {
        throw new AppError(404, "ISSUE_NOT_FOUND", "이슈를 찾을 수 없습니다.")
      }
      response.json({ issue })
    }),
  )

  router.patch(
    "/api/issues/:id/resolve",
    adminOnly,
    asyncHandler(async (request, response) => {
      const issueId = issueIdFromParams(request.params)
      const issue = await prisma.issue.update({
        data: { resolvedAt: new Date(), status: IssueStatus.RESOLVED },
        where: { id: issueId },
      })
      response.json({ issue })
    }),
  )

  return router
}
