import { createServer, type Server } from "node:http"
import type { AddressInfo } from "node:net"
import express from "express"
import { describe, expect, it } from "vitest"
import { createPErrorMiddleware } from "../src/express.js"

type Collector = {
  readonly close: () => Promise<void>
  readonly endpoint: string
  readonly events: string[]
  readonly waitForEvents: (count: number) => Promise<void>
}

type RunningApp = {
  readonly close: () => Promise<void>
  readonly origin: string
}

class SampleFailure extends Error {
  readonly name = "SampleFailure"

  constructor() {
    super("Sample failure")
  }
}

function addressFrom(server: Server): AddressInfo {
  const address = server.address()
  if (address === null || typeof address === "string") {
    throw new Error("Server did not expose a TCP address")
  }
  return address
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error === undefined) {
        resolve()
        return
      }
      reject(error)
    })
  })
}

function waitForServer(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve()
    })
  })
}

async function createCollector(): Promise<Collector> {
  const events: string[] = []
  const waiters: Array<() => void> = []
  const server = createServer((request, response) => {
    let body = ""
    request.setEncoding("utf8")
    request.on("data", (chunk: string) => {
      body += chunk
    })
    request.on("end", () => {
      events.push(body)
      const waiter = waiters.shift()
      waiter?.()
      response.writeHead(202, { "content-type": "application/json" })
      response.end("{}")
    })
  })

  await waitForServer(server)

  function waitForEvents(count: number): Promise<void> {
    if (events.length >= count) {
      return Promise.resolve()
    }
    return new Promise<void>((resolve) => {
      waiters.push(() => resolve())
    }).then(() => waitForEvents(count))
  }

  return {
    close: () => closeServer(server),
    endpoint: `http://127.0.0.1:${addressFrom(server).port}`,
    events,
    waitForEvents,
  }
}

async function createApp(endpoint: string): Promise<RunningApp> {
  const app = express()
  const monitor = createPErrorMiddleware({
    apiKey: "perror_test",
    endpoint,
    environment: "test",
    release: "sdk-test@0.1.0",
  })

  app.use(monitor.requestHandler())
  app.get("/limited", (_request, response) => {
    response.status(429).json({ code: "RATE_LIMITED" })
  })
  app.get("/boom", () => {
    throw new SampleFailure()
  })
  app.use(monitor.errorHandler())

  const server = createServer(app)
  await waitForServer(server)

  return {
    close: () => closeServer(server),
    origin: `http://127.0.0.1:${addressFrom(server).port}`,
  }
}

describe("createPErrorMiddleware", () => {
  it("captures completed 429 responses as HTTP error events", async () => {
    const collector = await createCollector()
    const app = await createApp(collector.endpoint)

    try {
      const response = await fetch(`${app.origin}/limited`)

      expect(response.status).toBe(429)
      await collector.waitForEvents(1)
      expect(collector.events).toHaveLength(1)
      expect(collector.events[0]).toContain('"message":"HTTP 429 Too Many Requests"')
      expect(collector.events[0]).toContain('"method":"GET"')
      expect(collector.events[0]).toContain('"path":"/limited"')
      expect(collector.events[0]).toContain('"statusCode":429')
    } finally {
      await app.close()
      await collector.close()
    }
  })

  it("captures thrown errors once even though the response finishes with 500", async () => {
    const collector = await createCollector()
    const app = await createApp(collector.endpoint)

    try {
      const response = await fetch(`${app.origin}/boom`)

      expect(response.status).toBe(500)
      await collector.waitForEvents(1)
      expect(collector.events).toHaveLength(1)
      expect(collector.events[0]).toContain('"message":"Sample failure"')
      expect(collector.events[0]).toContain('"statusCode":500')
    } finally {
      await app.close()
      await collector.close()
    }
  })
})
