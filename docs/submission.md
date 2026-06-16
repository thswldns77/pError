# pError 과제 제출 요약

## 프로젝트명

`pError`: AWS 기반 고가용성 개인 서버 에러 모니터링 플랫폼

## 주제

개인 개발자가 운영하는 백엔드 서버에서 발생한 에러를 SDK로 수집하고, 같은 에러를 하나의 이슈로 그룹핑하여 대시보드에서 확인하는 웹 서비스입니다.

## 구현 범위

- Express 기반 에러 수집 API
- Express 서버용 pError SDK
- 샘플 Express 서버
- React 관리자 대시보드
- PostgreSQL 데이터 모델
- k6 부하 테스트 스크립트
- AWS Academy 제출용 Terraform 코드
- 한국어 문서

## 사용한 AWS 서비스

- `ALB`: API 서버 앞단의 로드 밸런서
- `EC2`: pError API 서버 실행
- `Auto Scaling Group`: API 서버 다중 인스턴스 유지와 자동 확장
- `RDS PostgreSQL`: 에러 이벤트와 이슈 저장
- `S3`: 대시보드 정적 파일 배포
- `CloudWatch`: 로그와 지표 모니터링
- `IAM`: AWS Academy가 제공하는 `LabRole` / `LabInstanceProfile`을 EC2 권한으로 사용
- `Security Group`: 계층별 네트워크 접근 제어

## 고가용성 설명

모니터링 시스템은 장애 상황에서도 에러를 계속 수집해야 합니다. 따라서 pError API 서버는 단일 EC2가 아니라 Auto Scaling Group으로 구성하고, ALB가 정상 인스턴스에만 요청을 전달하도록 설계했습니다. 특정 EC2 인스턴스가 종료되어도 ALB 헬스체크와 ASG 복구를 통해 수집 API가 계속 동작할 수 있습니다.

## 실제 배포 여부

이 과제 저장소는 비용 방지를 위해 실제 AWS 리소스를 자동 생성하지 않습니다. Terraform 코드는 제출과 검토를 위해 작성했으며, 기본 검증은 `terraform fmt`와 `terraform validate`까지만 수행합니다.

실제 배포가 필요한 경우에만 다음 명령을 실행합니다.

```bash
terraform apply
```

시연 후에는 반드시 다음 명령으로 삭제합니다.

```bash
terraform destroy
```

## AI 및 오픈소스 사용

AI 도구는 설계 보조, 코드 작성 보조, 문서 작성 보조 용도로 사용했습니다. 프로젝트의 목적, 구조, 제출 범위는 과제 요구사항에 맞춰 직접 정의했습니다.

오픈소스 라이브러리는 Node.js 생태계의 일반적인 웹 개발 도구를 사용했습니다.

- Express
- React
- Vite
- Prisma
- PostgreSQL
- Terraform
- k6

## 향후 확장

- 이메일 로그인
- 이메일 알림
- Lambda + DynamoDB 기반 개인용 무료 운영 모드
- FastAPI/Spring Boot SDK
- 이벤트 보관 기간 자동 만료
