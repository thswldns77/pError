# 테스트 리포트

## 테스트 목표

- 에러 수집 API가 서비스 API Key를 기준으로 이벤트를 저장하는지 확인한다.
- 같은 에러가 하나의 이슈로 그룹핑되는지 확인한다.
- 샘플 Express 서버에 SDK를 붙였을 때 실제 서버 예외가 pError로 전송되는지 확인한다.
- k6 스크립트로 대량 이벤트 전송 시나리오를 준비한다.
- Terraform 코드가 AWS Academy 과제용 HA 구조를 표현하는지 확인한다.

## 로컬 환경 메모

현재 저장소는 실제 AWS 리소스를 만들지 않는 것을 원칙으로 합니다. `terraform apply`는 실행하지 않습니다.

검증 중 Homebrew로 `k6`, `colima`, `docker`, `docker-compose`를 설치하고 Colima Docker 런타임을 시작했습니다. 이후 Docker Compose 기반 PostgreSQL, 샘플 서버 에러 수집, 대시보드 표시, k6 부하 테스트까지 실제로 수행했습니다.

## 실행 명령

```bash
pnpm install
pnpm db:generate
DATABASE_URL="postgresql://perror:perror_password@localhost:5432/perror?schema=public" pnpm db:migrate
pnpm typecheck
pnpm test
pnpm build
terraform -chdir=infra/terraform fmt
terraform -chdir=infra/terraform validate
```

## 기능 테스트 시나리오

### 1. 에러 이벤트 수집

```bash
curl -i -X POST http://localhost:4000/api/events \
  -H "Content-Type: application/json" \
  -H "x-perror-key: perror_xxxxx" \
  -d '{
    "message":"Database connection failed",
    "stack":"Error: Database connection failed\n    at handler.ts:10:3",
    "method":"GET",
    "path":"/error/db",
    "statusCode":500,
    "environment":"local"
  }'
```

예상 결과: `202 Accepted`와 `eventId`, `issueId`가 반환됩니다.

### 2. 이슈 그룹핑

같은 요청을 여러 번 보내면 새 이슈가 계속 늘어나지 않고 기존 이슈의 `occurrences`가 증가해야 합니다.

### 3. 샘플 서버 SDK

```bash
curl -i http://localhost:4100/error/db
curl -i http://localhost:4100/error/auth
curl -i http://localhost:4100/error/async
```

예상 결과: 샘플 서버는 500 응답을 반환하고, 대시보드에는 서비스별 이슈가 표시됩니다.

### 4. 부하 테스트

```bash
BASE_URL=http://localhost:4000 PERROR_API_KEY=perror_xxxxx k6 run tests/load/events.js
```

예상 결과: 응답 실패율이 5% 미만이고 p95 응답 시간이 750ms 미만이면 통과로 봅니다.

### 5. AWS 장애 대응 시나리오

실제 AWS 배포를 수행하는 경우 다음을 확인합니다.

1. ALB Target Group에서 2개 이상의 Target이 healthy 상태인지 확인합니다.
2. EC2 인스턴스 하나를 종료합니다.
3. ALB가 비정상 Target을 제외하고 나머지 인스턴스로 요청을 보내는지 확인합니다.
4. Auto Scaling Group이 새 인스턴스를 생성하는지 확인합니다.
5. 대시보드 조회와 이벤트 수집이 계속 가능한지 확인합니다.

## 현재 검증 결과

| 항목 | 결과 | 비고 |
| --- | --- | --- |
| pnpm install | 통과 | 워크스페이스 의존성 설치 완료 |
| Prisma generate | 통과 | Prisma Client 생성 완료 |
| TypeScript typecheck | 통과 | `pnpm typecheck` |
| Lint/format check | 통과 | `pnpm lint` |
| Unit test | 통과 | API 3개, SDK 2개 테스트 통과 |
| Build | 통과 | API, Dashboard, SDK, Sample server 빌드 완료 |
| Terraform fmt | 통과 | `terraform -chdir=infra/terraform fmt -check -recursive` |
| Terraform validate | 통과 | `terraform -chdir=infra/terraform validate` |
| Docker Compose | 통과 | `docker compose up -d`, PostgreSQL healthy |
| Prisma migrate | 통과 | `20260616103754_init` migration 적용 |
| API health HTTP | 통과 | `curl -i http://127.0.0.1:4000/health` |
| Admin login HTTP | 통과 | `curl -i -X POST http://127.0.0.1:4000/api/auth/login` |
| Sample server HTTP | 통과 | `curl -i http://127.0.0.1:4100/ok` |
| Sample error ingestion | 통과 | `/error/db` 3회, `/error/auth`, `/error/async` 호출 후 DB 저장 |
| Issue grouping | 통과 | `Database connection failed` 이슈 occurrences 3 |
| Distinct issue creation | 통과 | 인증/비동기 오류가 별도 이슈로 생성됨 |
| Issue resolve API | 통과 | `Access token expired` 이슈 `RESOLVED` 처리 |
| Dashboard render | 통과 | Chrome CDP로 로그인 후 이슈 목록/상세 캡처 |
| k6 | 통과 | 1,800 요청, 실패율 0%, p95 29.44ms |
| k6 grouping | 통과 | `Load test synthetic server error` occurrences 1,800 |

## 실행된 검증 요약

```bash
pnpm install
pnpm db:generate
DATABASE_URL="postgresql://perror:perror_password@localhost:5432/perror?schema=public" pnpm db:migrate
pnpm check
pnpm build
terraform -chdir=infra/terraform init -backend=false
terraform -chdir=infra/terraform fmt -check -recursive
terraform -chdir=infra/terraform validate
curl -i http://127.0.0.1:4000/health
curl -i -X POST http://127.0.0.1:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"change-me-local-admin"}'
curl -i http://127.0.0.1:4100/ok
BASE_URL=http://127.0.0.1:4000 PERROR_API_KEY=perror_xxxxx k6 run tests/load/events.js
```

## 시각 QA 메모

- 데스크톱 로그인 화면은 Chrome headless에서 정상 렌더링되었습니다.
- Chrome DevTools Protocol로 관리자 로그인, 이슈 탭 클릭, 이슈 상세 클릭을 수행했습니다.
- 이슈 목록 화면에서 `Database connection failed`, `Access token expired`, `Background job promise rejected` 텍스트를 확인했습니다.
- 이슈 상세 화면에서 `그룹핑 기준`, `SampleAsyncJobError`, `GET /error/async · 500` 텍스트를 확인했습니다.
- 한국어 라벨과 버튼 텍스트의 겹침은 확인되지 않았습니다.
- 모바일용 CSS는 480px 이하에서 로그인 패널 폭을 `calc(100vw - 80px)`로 제한합니다.
- Chrome CLI 모바일 캡처는 CSS viewport가 예상과 다르게 잡히는 현상이 있어 데스크톱/반응형 CSS 중심으로 확인했습니다.

## 주요 E2E 결과

### 샘플 서버 에러 수집

```json
[
  {
    "message": "Background job promise rejected",
    "occurrences": 1,
    "path": "/error/async",
    "status": "OPEN",
    "service": "sample-server"
  },
  {
    "message": "Access token expired",
    "occurrences": 1,
    "path": "/error/auth",
    "status": "OPEN",
    "service": "sample-server"
  },
  {
    "message": "Database connection failed",
    "occurrences": 3,
    "path": "/error/db",
    "status": "OPEN",
    "service": "sample-server"
  }
]
```

### k6 부하 테스트

```text
checks_succeeded: 100.00% 1800 out of 1800
http_req_failed: 0.00% 0 out of 1800
http_req_duration p(95): 29.44ms
```

부하 테스트 후 `Load test synthetic server error` 이슈는 `occurrences: 1800`으로 그룹핑되었습니다.
