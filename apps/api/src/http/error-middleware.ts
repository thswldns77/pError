import type { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"
import { AppError, toErrorMessage } from "../errors/app-error.js"

export function errorMiddleware(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ code: error.code, message: error.message })
    return
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      code: "VALIDATION_FAILED",
      message: "요청 형식이 올바르지 않습니다.",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    })
    return
  }

  response.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: toErrorMessage(error),
  })
}
