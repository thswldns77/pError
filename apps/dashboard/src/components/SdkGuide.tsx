import { Activity, Copy, Globe2, Server, TerminalSquare } from "lucide-react"

const installSnippet = "pnpm add @perror/sdk-express"

const { VITE_API_BASE_URL } = import.meta.env
const API_BASE_URL = VITE_API_BASE_URL ?? "http://localhost:4000"

function expressUsageSnippet(endpoint: string): string {
  return `import { createPErrorMiddleware } from "@perror/sdk-express"

const monitor = createPErrorMiddleware({
  endpoint: "${endpoint}",
  apiKey: "perror_xxxxxxxxx",
  environment: "production",
  release: "my-api@1.0.0",
})

app.use(monitor.requestHandler())
app.use(monitor.errorHandler())`
}

function httpEventSnippet(endpoint: string): string {
  return `curl -X POST ${endpoint}/api/events \\
  -H "Content-Type: application/json" \\
  -H "x-perror-key: perror_xxxxxxxxx" \\
  -d '{
    "message": "Database connection failed",
    "method": "GET",
    "path": "/api/orders",
    "statusCode": 500,
    "environment": "production"
  }'`
}

export function SdkGuide() {
  return (
    <section className="panel-stack">
      <section className="data-panel">
        <div className="section-heading">
          <h3>용도별 수집 방식</h3>
          <TerminalSquare aria-hidden="true" size={20} />
        </div>
        <p className="muted-copy">
          pError API는 HTTP 이벤트 수집 서버입니다. Express SDK는 자동 수집용 도구이고, Load Panel은
          시연과 부하 테스트용 도구입니다.
        </p>
        <div className="snippet-row">
          <Globe2 aria-hidden="true" size={18} />
          <code>{API_BASE_URL}</code>
        </div>
      </section>

      <section className="integration-grid">
        <article className="data-panel integration-card">
          <header>
            <Server aria-hidden="true" size={20} />
            <div>
              <h3>운영 서버 자동 수집</h3>
              <p>Express 서버에 미들웨어를 붙여 500 에러를 자동 전송합니다.</p>
            </div>
          </header>
          <div className="snippet-row">
            <Copy aria-hidden="true" size={18} />
            <code>{installSnippet}</code>
          </div>
          <pre className="code-block">{expressUsageSnippet(API_BASE_URL)}</pre>
        </article>

        <article className="data-panel integration-card">
          <header>
            <Copy aria-hidden="true" size={18} />
            <div>
              <h3>프레임워크 무관 수집</h3>
              <p>Spring Boot, FastAPI, Go 서버도 같은 JSON 형식으로 직접 전송할 수 있습니다.</p>
            </div>
          </header>
          <pre className="code-block">{httpEventSnippet(API_BASE_URL)}</pre>
        </article>

        <article className="data-panel integration-card">
          <header>
            <Activity aria-hidden="true" size={20} />
            <div>
              <h3>S3 Load Panel 테스트</h3>
              <p>브라우저에서 테스트 서비스를 만들고 ALB API로 에러 이벤트 부하를 보냅니다.</p>
            </div>
          </header>
          <pre className="code-block">/load-test.html</pre>
        </article>
      </section>
    </section>
  )
}
