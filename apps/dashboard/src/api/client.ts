import ky, { HTTPError } from "ky"
import type { CreatedService, DashboardSummary, IssueDetail, IssueListItem } from "./types"

const { VITE_API_BASE_URL } = import.meta.env
const API_BASE_URL = VITE_API_BASE_URL ?? "http://localhost:4000"

const api = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: 5000,
})

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof HTTPError && error.response.status === 401
}

export async function login(password: string): Promise<string> {
  const response = await api
    .post("api/auth/login", { json: { password } })
    .json<{ token: string }>()
  return response.token
}

export async function fetchSummary(token: string): Promise<DashboardSummary> {
  return api.get("api/dashboard/summary", { headers: authHeaders(token) }).json<DashboardSummary>()
}

export async function fetchIssues(token: string): Promise<readonly IssueListItem[]> {
  const response = await api
    .get("api/issues", { headers: authHeaders(token) })
    .json<{ issues: readonly IssueListItem[] }>()
  return response.issues
}

export async function fetchIssue(token: string, id: string): Promise<IssueDetail> {
  const response = await api
    .get(`api/issues/${id}`, { headers: authHeaders(token) })
    .json<{ issue: IssueDetail }>()
  return response.issue
}

export async function createService(
  token: string,
  name: string,
  environment: string,
): Promise<CreatedService> {
  return api
    .post("api/services", {
      headers: authHeaders(token),
      json: { environment, name },
    })
    .json<CreatedService>()
}

export async function resolveIssue(token: string, id: string): Promise<void> {
  await api.patch(`api/issues/${id}/resolve`, { headers: authHeaders(token) })
}
