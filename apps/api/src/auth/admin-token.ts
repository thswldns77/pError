import { z } from "zod"
import { signPayload, timingSafeTextEqual } from "../utils/crypto.js"

const TokenPayloadSchema = z.object({
  exp: z.number().int().positive(),
})

const TOKEN_TTL_MS = 1000 * 60 * 60 * 8

export function createAdminToken(secret: string, now: Date = new Date()): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: now.getTime() + TOKEN_TTL_MS }),
    "utf8",
  ).toString("base64url")
  const signature = signPayload(secret, payload)
  return `${payload}.${signature}`
}

export function verifyAdminToken(token: string, secret: string, now: Date = new Date()): boolean {
  const [payload, signature, extra] = token.split(".")
  if (payload === undefined || signature === undefined || extra !== undefined) {
    return false
  }
  const expectedSignature = signPayload(secret, payload)
  if (!timingSafeTextEqual(signature, expectedSignature)) {
    return false
  }
  const decoded = Buffer.from(payload, "base64url").toString("utf8")
  let decodedPayload: unknown
  try {
    decodedPayload = JSON.parse(decoded)
  } catch (error) {
    if (error instanceof SyntaxError) {
      return false
    }
    throw error
  }
  const parsed = TokenPayloadSchema.safeParse(decodedPayload)
  if (!parsed.success) {
    return false
  }
  return parsed.data.exp > now.getTime()
}
