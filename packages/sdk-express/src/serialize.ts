import type { SerializedError } from "./types.js"

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    if (error.stack === undefined) {
      return { message: error.message }
    }
    return {
      message: error.message,
      stack: error.stack,
    }
  }

  if (typeof error === "string") {
    return { message: error }
  }

  return { message: "Non-Error exception was thrown" }
}
