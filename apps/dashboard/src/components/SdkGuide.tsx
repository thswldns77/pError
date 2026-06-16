import { Copy, TerminalSquare } from "lucide-react"

const installSnippet = "pnpm add @perror/sdk-express"

const usageSnippet = `import { createPErrorMiddleware } from "@perror/sdk-express"

const monitor = createPErrorMiddleware({
  endpoint: "http://localhost:4000",
  apiKey: "perror_xxxxxxxxx",
  environment: "production",
  release: "my-api@1.0.0",
})

app.use(monitor.requestHandler())
app.use(monitor.errorHandler())`

export function SdkGuide() {
  return (
    <section className="panel-stack">
      <section className="data-panel">
        <div className="section-heading">
          <h3>Express SDK</h3>
          <TerminalSquare aria-hidden="true" size={20} />
        </div>
        <div className="snippet-row">
          <Copy aria-hidden="true" size={18} />
          <code>{installSnippet}</code>
        </div>
        <pre className="code-block">{usageSnippet}</pre>
      </section>
    </section>
  )
}
