# pError

`pError`는 개인 개발자가 운영하는 백엔드 서버의 에러를 수집하고, 같은 에러를 하나의 이슈로 묶어 확인할 수 있는 서버 에러 모니터링 서비스입니다. 브라우저 JavaScript 에러 수집은 제외하고, Express 같은 백엔드 서버에서 발생한 예외만 수집합니다.

## 프로젝트 목표

- 개인 프로젝트에 붙일 수 있는 무료형 서버 에러 모니터링 도구를 만든다.
- 과제에서는 AWS Academy 기준으로 `ALB + EC2 Auto Scaling Group + RDS + S3` 고가용성 구조를 설명한다.
- AWS 배포는 Terraform으로 재생성 가능하게 구성한다.
- 최종 검증에서는 AWS Academy 환경에 실제 `ALB + EC2 ASG + RDS + S3` 구성을 생성해 동작을 확인했다.

## 구성

```text
apps/api             pError 수집 API와 관리자 API
apps/dashboard       React 기반 관리자 대시보드
apps/dashboard/public/load-test.html  S3에서 실행하는 이벤트 전송 테스트 사이트
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
- `S3 이벤트 전송 테스트 사이트`: 시연을 위해 4xx/5xx 에러 이벤트를 보내는 테스트 화면
- `EC2 pError API`: 실제 에러 이벤트를 수집하고 RDS에 저장하는 서버
- `packages/sdk-express`: Express 서버의 4xx/5xx 응답과 서버 예외를 자동 전송하는 SDK
- 다른 프레임워크 서버: 같은 `/api/events` 규격으로 직접 HTTP 전송 가능

## SDK 사용 예시

```ts
import { createPErrorMiddleware } from "@perror/sdk-express"

const monitor = createPErrorMiddleware({
  endpoint: "http://<alb-dns-name>",
  apiKey: "perror_xxxxxxxxx",
  environment: "production",
  release: "my-api@1.0.0",
})

app.use(monitor.requestHandler())
app.use(monitor.errorHandler())
```

## 테스트

코드 수준 검증은 다음 명령으로 수행합니다.

```bash
pnpm typecheck
pnpm test
pnpm build
```

AWS 배포 후 k6가 설치된 환경에서는 다음처럼 부하 테스트를 실행할 수 있습니다.

```bash
BASE_URL=http://<alb-dns-name> PERROR_API_KEY=perror_xxxxx k6 run tests/load/events.js
```

브라우저 시연용으로는 S3에 배포된 정적 HTML 이벤트 전송 테스트 사이트를 사용할 수 있습니다. 대시보드 배포 스크립트가 `/runtime-config.json`에 현재 ALB 주소를 기록하므로, 배포 후 S3 웹사이트의 `/load-test.html`로 접속합니다.

## AWS 배포 방법

`infra/terraform`은 다음 구조를 표현합니다.

- `ALB`: pError API 요청 분산
- `EC2 Auto Scaling Group`: API 서버 다중 인스턴스 및 자동 확장
- `RDS PostgreSQL`: 서비스, API Key, 이슈, 이벤트 저장
- `S3`: React 대시보드 정적 파일 배포
- `S3 이벤트 전송 테스트 사이트`: HTML 페이지에서 ALB API로 4xx/5xx 에러 이벤트 전송
- `Security Group`: ALB, API, DB 접근 경계 분리
- `IAM`: AWS Academy 제공 `LabInstanceProfile`로 EC2 권한 연결

주의: Terraform은 실제 AWS 리소스를 생성할 수 있으므로 `apply`는 시연이나 검증이 필요한 경우에만 수동으로 실행합니다. AWS Academy 환경에서는 `us-east-1`과 `LabInstanceProfile`을 기본값으로 사용합니다.

먼저 Terraform 변수 파일을 준비합니다.

```bash
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
```

`infra/terraform/terraform.tfvars`에서 아래 값을 자신의 환경에 맞게 수정합니다.

```hcl
aws_region      = "us-east-1"
github_repo_url = "https://github.com/<github-id>/pError.git"
admin_password  = "<dashboard-admin-password>"
auth_secret     = "<long-random-secret>"
```

인프라를 생성합니다.

```bash
cd infra/terraform

terraform init
terraform fmt -check -recursive
terraform validate
terraform plan -out=tfplan
terraform apply "tfplan"
```

배포된 ALB, S3, RDS 주소는 Terraform output으로 확인합니다.

```bash
terraform output
```

Terraform으로 ALB와 S3 버킷이 생성된 뒤에는 대시보드를 빌드해 S3에 업로드합니다. 이 스크립트는 현재 ALB 주소를 `VITE_API_BASE_URL`과 `/runtime-config.json`에 반영합니다.

```bash
cd ../..
scripts/deploy-dashboard.sh
```

배포 확인:

```bash
cd infra/terraform

ALB_URL="$(terraform output -raw alb_dns_name)"
curl -i "http://$ALB_URL/health"
```

제출 또는 시연이 끝난 뒤에는 비용 방지를 위해 반드시 삭제합니다.

```bash
terraform destroy
```

## 비용 주의

AWS Academy 환경에서도 `EC2`, `ALB`, `RDS`를 켜둔 상태로 방치하면 비용 또는 크레딧 소모가 발생할 수 있습니다. 제출 또는 시연 확인이 끝나면 다음 명령으로 리소스를 삭제합니다.

```bash
cd infra/terraform
terraform destroy
```

## 향후 확장

- 이메일 기반 로그인
- 이메일 알림
- Lambda + DynamoDB 기반 저비용 개인 운영 모드
- FastAPI 또는 Spring Boot SDK
