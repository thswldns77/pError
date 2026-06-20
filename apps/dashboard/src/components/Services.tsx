import { KeyRound, Plus } from "lucide-react"
import type { FormEvent } from "react"
import type { CreatedService, DashboardSummary } from "../api/types"

type ServicesProps = {
  readonly createdService: CreatedService | null
  readonly onCreate: (name: string, environment: string) => Promise<void>
  readonly summary: DashboardSummary | null
}

export function Services(props: ServicesProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get("name")
    const environment = formData.get("environment")
    if (typeof name === "string" && typeof environment === "string") {
      await props.onCreate(name, environment)
      event.currentTarget.reset()
    }
  }

  return (
    <section className="split-layout">
      <form className="data-panel service-form" onSubmit={(event) => void handleSubmit(event)}>
        <div className="section-heading">
          <h3>서비스 등록</h3>
        </div>
        <p className="muted-copy">
          실제 서버를 새로 만드는 기능이 아니라, 모니터링할 서버를 등록하고 에러 전송용 Service API
          Key를 발급합니다.
        </p>
        <label htmlFor="service-name">서비스 이름</label>
        <input id="service-name" name="name" placeholder="sample-api" />
        <label htmlFor="service-env">환경</label>
        <input id="service-env" name="environment" placeholder="local" />
        <button type="submit">
          <Plus aria-hidden="true" size={18} />
          등록
        </button>
        {props.createdService === null ? null : (
          <div className="key-box">
            <KeyRound aria-hidden="true" size={18} />
            <code>{props.createdService.apiKey}</code>
          </div>
        )}
      </form>

      <section className="data-panel">
        <div className="section-heading">
          <h3>등록된 서비스</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>이름</th>
                <th>환경</th>
                <th>이벤트</th>
                <th>이슈</th>
              </tr>
            </thead>
            <tbody>
              {(props.summary?.services ?? []).map((service) => (
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
