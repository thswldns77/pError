import { describe, expect, it } from "vitest"
import { createIssueFingerprint, stackFirstLine } from "../src/services/fingerprint.js"

describe("createIssueFingerprint", () => {
  it("keeps identical server errors in one issue when core fields match", () => {
    const left = createIssueFingerprint({
      message: "Database connection failed",
      path: "/api/orders",
      serviceId: "service-a",
      stack: "Error: Database connection failed\n    at handler.ts:10:3",
    })
    const right = createIssueFingerprint({
      message: "Database connection failed",
      path: "/api/orders",
      serviceId: "service-a",
      stack: "Error: Database connection failed\n    at other.ts:99:1",
    })

    expect(left).toBe(right)
  })

  it("separates errors from different paths", () => {
    const left = createIssueFingerprint({
      message: "Auth token expired",
      path: "/api/me",
      serviceId: "service-a",
      stack: "AuthError: Auth token expired",
    })
    const right = createIssueFingerprint({
      message: "Auth token expired",
      path: "/api/admin",
      serviceId: "service-a",
      stack: "AuthError: Auth token expired",
    })

    expect(left).not.toBe(right)
  })
})

describe("stackFirstLine", () => {
  it("uses the message as fallback when no stack exists", () => {
    expect(stackFirstLine(null, "fallback message")).toBe("fallback message")
  })
})
