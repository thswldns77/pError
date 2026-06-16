import { describe, expect, it } from "vitest"
import { serializeError } from "../src/serialize.js"

describe("serializeError", () => {
  it("preserves message and stack when a real Error is captured", () => {
    const error = new Error("Database connection failed")
    const serialized = serializeError(error)

    expect(serialized.message).toBe("Database connection failed")
    expect(serialized.stack).toContain("Database connection failed")
  })

  it("creates a safe message when a non-Error value is thrown", () => {
    expect(serializeError({ broken: true })).toEqual({
      message: "Non-Error exception was thrown",
    })
  })
})
