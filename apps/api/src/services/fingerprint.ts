import { hashSecret } from "../utils/crypto.js"

export type FingerprintInput = {
  readonly serviceId: string
  readonly message: string
  readonly stack: string | null
  readonly path: string
}

export function stackFirstLine(stack: string | null, fallback: string): string {
  if (stack === null || stack.trim().length === 0) {
    return fallback
  }
  const firstLine = stack
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0)
  return firstLine ?? fallback
}

export function createIssueFingerprint(input: FingerprintInput): string {
  const firstLine = stackFirstLine(input.stack, input.message)
  return hashSecret([input.serviceId, input.message, firstLine, input.path].join("|"))
}
