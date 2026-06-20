# pError

`pError`는 개인 개발자가 운영하는 백엔드 서버의 에러를 수집하고, 같은 에러를 하나의 이슈로 묶어 확인할 수 있는 서버 에러 모니터링 서비스입니다. 브라우저 JavaScript 에러 수집은 제외하고, Express 같은 백엔드 서버에서 발생한 예외만 수집합니다.

## 프로젝트 목표

- 개인 프로젝트에 붙일 수 있는 무료형 서버 에러 모니터링 도구를 만든다.
- 과제에서는 AWS Academy 기준으로 `ALB + EC2 Auto Scaling Group + RDS + S3` 고가용성 구조를 설명한다.
- 기본 실행은 로컬 개발 환경에서 가능하게 하고, AWS 배포는 Terraform으로 수동 실행한다.
- 최종 검증에서는 AWS Academy 환경에 실제 `ALB + EC2 ASG + RDS + S3` 구성을 생성해 동작을 확인했다.

## 구성

```text
apps/api             pError 수집 API와 관리자 API
apps/dashboard       React 기반 관리자 대시보드
apps/dashboard/public/load-test.html  S3에서 실행하는 부하 테스트 패널
apps/sample-server   pError SDK가 붙은 샘플 Express 서버
packages/sdk-express Express 서버용 pError SDK
infra/terraform      AWS Academy 제출용 IaC 코드
tests/load           k6 부하 테스트 스크립트
docs                 과제 제출 문서
```

## 서버 에러 수집 구조

`pError`는 정적 웹사이트 프론트 에러 수집기가 아니라, 백엔드 서버가 보낸 에러 이벤트를 수집하는 서버 에러 모니터링 시스템입니다.

```text
모니터링 대상 서버
  -> Express SDK 또는 HTTP POST /api/events
  -> ALB
  -> EC2 Auto Scaling Group의 pError API 서버
  -> RDS PostgreSQL 저장
  -> S3 대시보드에서 조회
```

- `S3 Dashboard`: 수집된 이벤트와 이슈를 확인하는 관리자 화면
- `S3 Load Panel`: 시연과 부하 테스트를 위해 가짜 서버 에러를 보내는 테스트 화면
- `EC2 pError API`: 실제 에러 이벤트를 수집하고 RDS에 저장하는 서버
- `packages/sdk-express`: Express 서버의 4xx/5xx 응답과 서버 예외를 자동 전송하는 SDK
- 다른 프레임워크 서버: 같은 `/api/events` 규격으로 직접 HTTP 전송 가능

## 로컬 실행

필요 도구:

- Node.js 20 이상
- pnpm
- Docker 또는 PostgreSQL

```bash
cd /Users/sonjiwoon/4학년\ 1학기/aws/pError
cp .env.example .env
pnpm install
docker compose up -d
set -a
source .env
set +a
pnpm db:generate
pnpm db:migrate
```

터미널을 나누어 실행합니다.

```bash
pnpm dev:api
pnpm dev:dashboard
```

대시보드 접속:

```text
http://localhost:5173
```

관리자 비밀번호는 `.env`의 `ADMIN_PASSWORD` 값을 사용합니다.

## 서비스 등록과 샘플 서버 테스트

대시보드에서 서비스를 등록하면 API Key가 한 번 표시됩니다. 이 값을 `.env`의 `PERROR_API_KEY`에 넣고 샘플 서버를 실행합니다.

```bash
set -a
source .env
set +a
pnpm dev:sample
```

샘플 서버에서 일부러 에러를 발생시킵니다.

```bash
curl -i http://localhost:4100/error/db
curl -i http://localhost:4100/error/auth
curl -i http://localhost:4100/error/async
```

대시보드의 이슈 목록에서 수집 결과를 확인합니다.

## SDK 사용 예시

```ts
import { createPErrorMiddleware } from "@perror/sdk-express"

const monitor = createPErrorMiddleware({
  endpoint: "http://localhost:4000",
  apiKey: "perror_xxxxxxxxx",
  environment: "production",
  release: "my-api@1.0.0",
})

app.use(monitor.requestHandler())
app.use(monitor.errorHandler())
```

## 테스트

```bash
set -a
source .env
set +a
pnpm typecheck
pnpm test
pnpm build
```

k6가 설치된 환경에서는 다음처럼 부하 테스트를 실행할 수 있습니다.

```bash
BASE_URL=http://localhost:4000 PERROR_API_KEY=perror_xxxxx k6 run tests/load/events.js
```

브라우저 시연용으로는 정적 HTML 부하 테스트 패널을 사용할 수 있습니다. 대시보드 배포 스크립트가 `/runtime-config.json`에 현재 ALB 주소를 기록하므로, 배포 후 `/load-test.html`로 바로 접속합니다.

```text
http://localhost:5173/load-test.html
```

로컬 검증이 끝나면 컨테이너를 내립니다.

```bash
docker compose down
```

## AWS 배포 구조

`infra/terraform`은 다음 구조를 표현합니다.

- `ALB`: pError API 요청 분산
- `EC2 Auto Scaling Group`: API 서버 다중 인스턴스 및 자동 확장
- `RDS PostgreSQL`: 서비스, API Key, 이슈, 이벤트 저장
- `S3`: React 대시보드 정적 파일 배포
- `S3 Load Panel`: HTML 페이지에서 ALB API로 가벼운 부하/에러 이벤트 전송
- `Security Group`: ALB, API, DB 접근 경계 분리
- `IAM`: AWS Academy 제공 `LabInstanceProfile`로 EC2 권한 연결

주의: Terraform은 실제 AWS 리소스를 생성할 수 있으므로 `apply`는 시연이나 검증이 필요한 경우에만 수동으로 실행합니다.

```bash
cd infra/terraform
terraform fmt
terraform init
terraform validate
```

실제 배포가 필요한 경우에만 `terraform apply`를 실행합니다. 제출 또는 시연이 끝난 뒤에는 비용 방지를 위해 반드시 삭제합니다.

```bash
terraform destroy
```

## 비용 주의

AWS Academy 환경에서도 `EC2`, `ALB`, `RDS`를 켜둔 상태로 방치하면 비용 또는 크레딧 소모가 발생할 수 있습니다. 제출 또는 시연 확인이 끝나면 다음 명령으로 리소스를 삭제합니다.

```bash
terraform -chdir=infra/terraform destroy
```

## 향후 확장

- 이메일 기반 로그인
- 이메일 알림
- Lambda + DynamoDB 기반 저비용 개인 운영 모드
- FastAPI 또는 Spring Boot SDK
