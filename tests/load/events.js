import { check, sleep } from "k6"
import http from "k6/http"

export const options = {
  thresholds: {
    http_req_duration: ["p(95)<750"],
    http_req_failed: ["rate<0.05"],
  },
  vus: 30,
  duration: "1m",
}

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000"
const API_KEY = __ENV.PERROR_API_KEY || "replace-with-service-api-key"

export default function () {
  const payload = JSON.stringify({
    environment: "load-test",
    hostname: "k6-runner",
    message: "Load test synthetic server error",
    method: "GET",
    path: "/load-test/error",
    release: "load-test@1.0.0",
    requestId: `k6-${__VU}-${__ITER}`,
    stack: "Error: Load test synthetic server error\n    at load-test.js:1:1",
    statusCode: 500,
  })

  const response = http.post(`${BASE_URL}/api/events`, payload, {
    headers: {
      "Content-Type": "application/json",
      "x-perror-key": API_KEY,
    },
  })

  check(response, {
    accepted: (result) => result.status === 202,
  })
  sleep(1)
}
