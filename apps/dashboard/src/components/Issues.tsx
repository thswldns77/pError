import { CheckCircle2, Eye } from "lucide-react"
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

export function Issues(props: IssuesProps) {
  const detail = props.issueDetail

  return (
    <section className="issue-layout">
      <section className="data-panel">
        <div className="section-heading">
          <h3>이슈 목록</h3>
        </div>
        <div className="table-wrap">
          <table>
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
            <div className="section-heading">
              <h3>{detail.message}</h3>
              <button
                className="icon-button subtle"
                onClick={() => void props.onResolve(detail.id)}
                type="button"
              >
                <CheckCircle2 aria-hidden="true" size={18} />
                해결
              </button>
            </div>
            <dl className="detail-list">
              <div>
                <dt>서비스</dt>
                <dd>{detail.service.name}</dd>
              </div>
              <div>
                <dt>경로</dt>
                <dd>{detail.path}</dd>
              </div>
              <div>
                <dt>그룹핑 기준</dt>
                <dd>{detail.stackFirstLine}</dd>
              </div>
            </dl>
            <div className="event-list">
              {detail.events.map((event) => (
                <article className="event-row" key={event.id}>
                  <strong>
                    {event.method} {event.path} · {event.statusCode}
                  </strong>
                  <span>{formatDate(event.createdAt)}</span>
                  <pre>{event.stack ?? event.message}</pre>
                </article>
              ))}
            </div>
          </>
        )}
      </aside>
    </section>
  )
}
