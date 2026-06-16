import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"

export function createApiKey(): string {
  return `perror_${randomBytes(24).toString("base64url")}`
}

export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex")
}

export function signPayload(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url")
}

export function timingSafeTextEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }
  return timingSafeEqual(leftBuffer, rightBuffer)
}
