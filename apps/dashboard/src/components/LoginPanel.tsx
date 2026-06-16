import { LockKeyhole } from "lucide-react"
import type { FormEvent } from "react"

type LoginPanelProps = {
  readonly errorMessage: string | null
  readonly onSubmit: (password: string) => Promise<void>
}

export function LoginPanel(props: LoginPanelProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const password = formData.get("password")
    if (typeof password === "string") {
      await props.onSubmit(password)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand-lock">
          <LockKeyhole aria-hidden="true" size={28} />
        </div>
        <p className="eyebrow">Backend Error Monitor</p>
        <h1>pError</h1>
        <form className="login-form" onSubmit={(event) => void handleSubmit(event)}>
          <label htmlFor="password">관리자 비밀번호</label>
          <input id="password" name="password" placeholder="ADMIN_PASSWORD" type="password" />
          <button type="submit">로그인</button>
        </form>
        {props.errorMessage === null ? null : <p className="form-error">{props.errorMessage}</p>}
      </section>
    </main>
  )
}
