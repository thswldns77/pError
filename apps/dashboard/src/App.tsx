import { useCallback, useEffect, useState } from "react"
import {
  createService,
  fetchIssue,
  fetchIssues,
  fetchSummary,
  login,
  resolveIssue,
} from "./api/client"
import type { CreatedService, DashboardSummary, IssueDetail, IssueListItem } from "./api/types"
import { Issues } from "./components/Issues"
import { LoginPanel } from "./components/LoginPanel"
import { Overview } from "./components/Overview"
import { SdkGuide } from "./components/SdkGuide"
import { Services } from "./components/Services"
import { Shell, type TabKey } from "./components/Shell"

function messageFrom(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return "요청을 처리하지 못했습니다."
}

export function App() {
  const [token, setToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>("overview")
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [issues, setIssues] = useState<readonly IssueListItem[]>([])
  const [issueDetail, setIssueDetail] = useState<IssueDetail | null>(null)
  const [createdService, setCreatedService] = useState<CreatedService | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refresh = useCallback(async (): Promise<void> => {
    if (token === null) {
      return
    }
    const [nextSummary, nextIssues] = await Promise.all([fetchSummary(token), fetchIssues(token)])
    setSummary(nextSummary)
    setIssues(nextIssues)
  }, [token])

  useEffect(() => {
    void refresh().catch((error: unknown) => setErrorMessage(messageFrom(error)))
  }, [refresh])

  async function handleLogin(password: string): Promise<void> {
    try {
      const nextToken = await login(password)
      setToken(nextToken)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(messageFrom(error))
    }
  }

  async function handleCreateService(name: string, environment: string): Promise<void> {
    if (token === null) {
      return
    }
    const service = await createService(token, name, environment)
    setCreatedService(service)
    await refresh()
  }

  async function handleSelectIssue(id: string): Promise<void> {
    if (token === null) {
      return
    }
    setIssueDetail(await fetchIssue(token, id))
  }

  async function handleResolveIssue(id: string): Promise<void> {
    if (token === null) {
      return
    }
    await resolveIssue(token, id)
    setIssueDetail(await fetchIssue(token, id))
    await refresh()
  }

  if (token === null) {
    return <LoginPanel errorMessage={errorMessage} onSubmit={handleLogin} />
  }

  return (
    <Shell activeTab={activeTab} onRefresh={() => void refresh()} onTabChange={setActiveTab}>
      {errorMessage === null ? null : <p className="global-error">{errorMessage}</p>}
      {activeTab === "overview" ? <Overview summary={summary} /> : null}
      {activeTab === "services" ? (
        <Services
          createdService={createdService}
          onCreate={handleCreateService}
          summary={summary}
        />
      ) : null}
      {activeTab === "issues" ? (
        <Issues
          issueDetail={issueDetail}
          issues={issues}
          onResolve={handleResolveIssue}
          onSelect={handleSelectIssue}
        />
      ) : null}
      {activeTab === "sdk" ? <SdkGuide /> : null}
    </Shell>
  )
}
