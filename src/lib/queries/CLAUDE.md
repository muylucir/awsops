# 쿼리 모듈 / Queries Module

## 역할 / Role
Steampipe용 SQL 쿼리 정의. 각 파일은 특정 AWS/K8s 서비스에 대한 쿼리를 내보냄.
(SQL query definitions for Steampipe. Each file exports queries for a specific AWS/K8s service.)

## 주요 파일 / Key Files
16개 쿼리 파일 — 서비스별 1개: ec2, s3, vpc, iam, rds, lambda, ecs, k8s, cost 등
(16 query files — one per service)

## 규칙 / Rules
- 쿼리 작성 전 `information_schema.columns`로 컬럼명 확인
  (Verify column names against `information_schema.columns` before writing queries)
- `versioning_enabled` not `versioning` (S3)
- `class` AS alias not `db_instance_class` (RDS)
- `trivy_scan_vulnerability` not `trivy_vulnerability`
- `"group"` AS alias (ECS 예약어 / ECS reserved word)
- 목록 쿼리에서 사용 금지: `mfa_enabled`, `attached_policy_arns`, Lambda `tags` — SCP 차단
  (Avoid in list queries — SCP blocks)
- SQL에서 `$` 사용 금지 — `jsonb_path_exists` 대신 `conditions::text LIKE '%..%'` 사용
  (No `$` in SQL — use `conditions::text LIKE '%..%'` instead of `jsonb_path_exists`)
