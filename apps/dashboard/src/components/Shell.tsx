import { Activity, BookOpen, Boxes, Bug, RefreshCcw } from "lucide-react"
import type { ReactNode } from "react"

export type TabKey = "overview" | "services" | "issues" | "sdk"

type ShellProps = {
  readonly activeTab: TabKey
  readonly children: ReactNode
  readonly onRefresh: () => void
  readonly onTabChange: (tab: TabKey) => void
}

const tabs = [
  { icon: Activity, key: "overview", label: "요약" },
  { icon: Boxes, key: "services", label: "서비스" },
  { icon: Bug, key: "issues", label: "이슈" },
  { icon: BookOpen, key: "sdk", label: "SDK" },
] as const

export function Shell(props: ShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">pError</p>
          <h1>Server Watch</h1>
        </div>
        <nav className="nav-tabs" aria-label="대시보드 메뉴">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                aria-pressed={props.activeTab === tab.key}
                className={props.activeTab === tab.key ? "nav-tab active" : "nav-tab"}
                key={tab.key}
                onClick={() => props.onTabChange(tab.key)}
                type="button"
              >
                <Icon aria-hidden="true" size={18} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>
      <div className="content-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">AWS Academy HA Project</p>
            <h2>개인 서버 에러 모니터링</h2>
          </div>
          <button className="icon-button" onClick={props.onRefresh} title="새로고침" type="button">
            <RefreshCcw aria-hidden="true" size={18} />
            <span>새로고침</span>
          </button>
        </header>
        {props.children}
      </div>
    </div>
  )
}
