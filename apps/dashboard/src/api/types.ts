export type IssueStatus = "OPEN" | "RESOLVED"

export type ServiceSummary = {
  readonly _count: {
    readonly events: number
    readonly issues: number
  }
  readonly createdAt: string
  readonly environment: string
  readonly id: string
  readonly name: string
}

export type IssueListItem = {
  readonly firstSeenAt: string
  readonly id: string
  readonly lastSeenAt: string
  readonly message: string
  readonly occurrences: number
  readonly path: string
  readonly service: {
    readonly environment: string
    readonly id: string
    readonly name: string
  }
  readonly stackFirstLine: string
  readonly status: IssueStatus
}

export type ErrorEvent = {
  readonly createdAt: string
  readonly environment: string
  readonly hostname: string | null
  readonly id: string
  readonly message: string
  readonly method: string
  readonly path: string
  readonly release: string | null
  readonly requestId: string | null
  readonly stack: string | null
  readonly statusCode: number
}

export type IssueDetail = IssueListItem & {
  readonly events: readonly ErrorEvent[]
}

export type DashboardSummary = {
  readonly openIssues: number
  readonly recentEvents: number
  readonly services: readonly ServiceSummary[]
  readonly totalEvents: number
}

export type CreatedService = ServiceSummary & {
  readonly apiKey: string
  readonly keyPrefix: string
}
