import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  GitBranch,
  Hash,
  Server,
} from "lucide-react"
import type { IssueDetail, IssueListItem } from "../api/types"

type IssuesProps = {
  readonly issueDetail: IssueDetail | null
  readonly issues: readonly IssueListItem[]
  readonly onResolve: (id: string) => Promise<void>
  readonly onSelect: (id: string) => Promise<void>
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function optionalText(value: string | null): string {
  if (value === null || value.trim().length === 0) {
    return "없음"
  }
  return value
}

export function Issues(props: IssuesProps) {
  const detail = props.issueDetail
  const latestEvent = detail?.events[0] ?? null

  return (
    <section className="issue-layout">
      <section className="data-panel">
        <div className="section-heading">
          <h3>이슈 목록</h3>
        </div>
        <div className="table-wrap">
          <table className="issue-table">
            <thead>
              <tr>
                <th>상태</th>
                <th>서비스</th>
                <th>메시지</th>
                <th>횟수</th>
                <th>최근</th>
                <th>보기</th>
              </tr>
            </thead>
            <tbody>
              {props.issues.map((issue) => (
                <tr key={issue.id}>
                  <td>
                    <span className={issue.status === "OPEN" ? "badge open" : "badge resolved"}>
                      {issue.status}
                    </span>
                  </td>
                  <td>{issue.service.name}</td>
                  <td>{issue.message}</td>
                  <td>{issue.occurrences}</td>
                  <td>{formatDate(issue.lastSeenAt)}</td>
                  <td>
                    <button
                      className="table-button"
                      onClick={() => void props.onSelect(issue.id)}
                      title="상세 보기"
                      type="button"
                    >
                      <Eye aria-hidden="true" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="data-panel issue-detail">
        {detail === null ? (
          <p className="empty-state">이슈를 선택하세요.</p>
        ) : (
          <>
            <header className="issue-hero">
              <div>
                <span className={detail.status === "OPEN" ? "badge open" : "badge resolved"}>
                  {detail.status}
                </span>
                <h3>{detail.message}</h3>
                <p>
                  {detail.service.name} · {detail.service.environment} ·{" "}
                  {detail.occurrences.toLocaleString("ko-KR")}회 발생
                </p>
              </div>
              <button
                className="icon-button subtle"
                onClick={() => void props.onResolve(detail.id)}
                type="button"
              >
                <CheckCircle2 aria-hidden="true" size={18} />
                해결
              </button>
            </header>

            <section className="issue-card-grid" aria-label="이슈 상세 요약">
              <article className="issue-info-card highlight">
                <AlertTriangle aria-hidden="true" size={20} />
                <span>최근 요청</span>
                <strong>
                  {latestEvent === null
                    ? detail.path
                    : `${latestEvent.method} ${latestEvent.path} · ${latestEvent.statusCode}`}
                </strong>
              </article>
              <article className="issue-info-card">
                <Activity aria-hidden="true" size={20} />
                <span>누적 이벤트</span>
                <strong>{detail.occurrences.toLocaleString("ko-KR")}건</strong>
              </article>
              <article className="issue-info-card">
                <Clock aria-hidden="true" size={20} />
                <span>처음 / 최근 발생</span>
                <strong>{formatDate(detail.firstSeenAt)}</strong>
                <small>{formatDate(detail.lastSeenAt)}</small>
              </article>
            </section>

            <section className="issue-context-grid">
              <article className="issue-context-card">
                <header>
                  <Server aria-hidden="true" size={18} />
                  <h4>서비스와 런타임</h4>
                </header>
                <dl>
                  <div>
                    <dt>서비스</dt>
                    <dd>{detail.service.name}</dd>
                  </div>
                  <div>
                    <dt>환경</dt>
                    <dd>{detail.service.environment}</dd>
                  </div>
                  <div>
                    <dt>호스트</dt>
                    <dd>{optionalText(latestEvent?.hostname ?? null)}</dd>
                  </div>
                  <div>
                    <dt>릴리즈</dt>
                    <dd>{optionalText(latestEvent?.release ?? null)}</dd>
                  </div>
                </dl>
              </article>

              <article className="issue-context-card">
                <header>
                  <Hash aria-hidden="true" size={18} />
                  <h4>요청과 그룹핑</h4>
                </header>
                <dl>
                  <div>
                    <dt>경로</dt>
                    <dd>{detail.path}</dd>
                  </div>
                  <div>
                    <dt>Request ID</dt>
                    <dd>{optionalText(latestEvent?.requestId ?? null)}</dd>
                  </div>
                  <div>
                    <dt>그룹핑 기준</dt>
                    <dd>{detail.stackFirstLine}</dd>
                  </div>
                </dl>
              </article>
            </section>

            <section className="issue-context-card stack-card">
              <header>
                <GitBranch aria-hidden="true" size={18} />
                <h4>대표 스택 트레이스</h4>
              </header>
              <pre>{latestEvent?.stack ?? detail.stackFirstLine}</pre>
            </section>

            <section className="issue-context-card">
              <header>
                <Clock aria-hidden="true" size={18} />
                <h4>최근 이벤트</h4>
              </header>
              <div className="event-list">
                {detail.events.map((event) => (
                  <article className="event-row" key={event.id}>
                    <div>
                      <strong>
                        {event.method} {event.path} · {event.statusCode}
                      </strong>
                      <span>{formatDate(event.createdAt)}</span>
                    </div>
                    <p>{event.message}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </aside>
    </section>
  )
}
