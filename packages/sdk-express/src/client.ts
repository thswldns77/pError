import ky from "ky"
import { serializeError } from "./serialize.js"
import type { CaptureContext, PErrorOptions } from "./types.js"

export async function sendException(
  options: PErrorOptions,
  error: unknown,
  context: CaptureContext,
): Promise<void> {
  const serialized = serializeError(error)
  await ky.post("api/events", {
    headers: {
      "content-type": "application/json",
      "x-perror-key": options.apiKey,
    },
    json: {
      environment: options.environment ?? "production",
      hostname: context.hostname,
      message: serialized.message,
      method: context.method,
      path: context.path,
      release: options.release,
      requestId: context.requestId,
      stack: serialized.stack,
      statusCode: context.statusCode,
    },
    prefixUrl: options.endpoint,
    timeout: options.timeoutMs ?? 2000,
  })
}
