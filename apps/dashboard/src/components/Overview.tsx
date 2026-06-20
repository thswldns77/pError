import { Activity, AlertTriangle, RadioTower, Server } from "lucide-react"
import type { DashboardSummary } from "../api/types"

type OverviewProps = {
  readonly summary: DashboardSummary | null
}

export function Overview(props: OverviewProps) {
  const summary = props.summary
  return (
    <section className="panel-stack">
      <div className="metric-grid">
        <article className="metric-panel">
          <AlertTriangle aria-hidden="true" size={22} />
          <span>열린 이슈</span>
          <strong>{summary?.openIssues ?? 0}</strong>
        </article>
        <article className="metric-panel">
          <RadioTower aria-hidden="true" size={22} />
          <span>24시간 이벤트</span>
          <strong>{summary?.recentEvents ?? 0}</strong>
        </article>
        <article className="metric-panel">
          <Activity aria-hidden="true" size={22} />
          <span>누적 이벤트</span>
          <strong>{summary?.totalEvents ?? 0}</strong>
        </article>
        <article className="metric-panel">
          <Server aria-hidden="true" size={22} />
          <span>최근 응답 인스턴스</span>
          <strong className="instance-value">{summary?.instanceId ?? "대기 중"}</strong>
        </article>
      </div>

      <section className="data-panel">
        <div className="section-heading">
          <h3>서비스별 수집 현황</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>서비스</th>
                <th>환경</th>
                <th>이벤트</th>
                <th>이슈</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.services ?? []).map((service) => (
                <tr key={service.id}>
                  <td>{service.name}</td>
                  <td>{service.environment}</td>
                  <td>{service._count.events}</td>
                  <td>{service._count.issues}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
