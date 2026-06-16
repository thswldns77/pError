import { hostname } from "node:os"
import type { NextFunction, Request, Response } from "express"
import { sendException } from "./client.js"
import type { CaptureContext, PErrorMiddleware, PErrorOptions } from "./types.js"

type RequestContext = {
  readonly method: string
  readonly path: string
  readonly requestId?: string
}

const contexts = new WeakMap<Request, RequestContext>()

function requestIdFrom(request: Request): string | undefined {
  const headerValue = request.headers["x-request-id"]
  if (typeof headerValue === "string" && headerValue.trim().length > 0) {
    return headerValue.trim()
  }
  return undefined
}

function contextFrom(request: Request, response: Response): CaptureContext {
  const saved = contexts.get(request)
  const context: CaptureContext = {
    hostname: hostname(),
    method: saved?.method ?? request.method,
    path: saved?.path ?? request.originalUrl,
    statusCode: response.statusCode >= 400 ? response.statusCode : 500,
  }
  if (saved?.requestId !== undefined) {
    return { ...context, requestId: saved.requestId }
  }
  return context
}

export function createPErrorMiddleware(options: PErrorOptions): PErrorMiddleware {
  return {
    async captureException(error: unknown, context: CaptureContext): Promise<void> {
      await sendException(options, error, context)
    },
    errorHandler() {
      return (error: unknown, request: Request, response: Response, next: NextFunction): void => {
        if (response.headersSent) {
          next(error)
          return
        }

        const context = contextFrom(request, response)
        void sendException(options, error, context).catch((captureError: unknown) => {
          options.onCaptureError?.(captureError)
        })

        response.status(context.statusCode).json({
          code: "INTERNAL_SERVER_ERROR",
          message: "서버 오류가 발생했습니다.",
        })
      }
    },
    requestHandler() {
      return (request: Request, _response: Response, next: NextFunction): void => {
        const requestId = requestIdFrom(request)
        const context: RequestContext = {
          method: request.method,
          path: request.originalUrl,
        }
        contexts.set(request, requestId === undefined ? context : { ...context, requestId })
        next()
      }
    },
  }
}
