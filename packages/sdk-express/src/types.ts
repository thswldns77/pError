import type { ErrorRequestHandler, RequestHandler } from "express"

export type PErrorOptions = {
  readonly apiKey: string
  readonly endpoint: string
  readonly environment?: string
  readonly release?: string
  readonly timeoutMs?: number
  readonly onCaptureError?: (error: unknown) => void
}

export type CaptureContext = {
  readonly hostname?: string
  readonly method: string
  readonly path: string
  readonly requestId?: string
  readonly statusCode: number
}

export type SerializedError = {
  readonly message: string
  readonly stack?: string
}

export type PErrorMiddleware = {
  readonly captureException: (error: unknown, context: CaptureContext) => Promise<void>
  readonly errorHandler: () => ErrorRequestHandler
  readonly requestHandler: () => RequestHandler
}
