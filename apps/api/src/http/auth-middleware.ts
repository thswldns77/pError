import type { NextFunction, Request, Response } from "express"
import { verifyAdminToken } from "../auth/admin-token.js"
import type { AppConfig } from "../config/env.js"
import { AppError } from "../errors/app-error.js"

function bearerToken(request: Request): string | null {
  const value = request.headers.authorization
  if (value === undefined || !value.startsWith("Bearer ")) {
    return null
  }
  return value.slice("Bearer ".length)
}

export function requireAdmin(config: AppConfig) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const token = bearerToken(request)
    if (token === null || !verifyAdminToken(token, config.AUTH_SECRET)) {
      throw new AppError(401, "ADMIN_UNAUTHORIZED", "관리자 인증이 필요합니다.")
    }
    next()
  }
}
