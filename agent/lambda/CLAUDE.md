# Lambda 모듈 / Lambda Module

## 역할 / Role
AgentCore 게이트웨이 MCP 도구용 19개 Lambda 함수. 각 Lambda는 특정 AWS 서비스 작업을 구현.
(19 Lambda functions for AgentCore Gateway MCP tools. Each Lambda implements specific AWS service operations.)

## 주요 파일 / Key Files
- `create_targets.py` — 7개 게이트웨이에 걸쳐 19개 게이트웨이 타겟 생성 (Creates all 19 Gateway Targets across 7 Gateways, Python/boto3)
- `network_mcp.py` — VPC, TGW, VPN, ENI, Network Firewall (15개 도구 / 15 tools)
- `aws_eks_mcp.py` — EKS clusters, CloudWatch, IAM, troubleshooting (9개 도구 / 9 tools)
- `aws_ecs_mcp.py` — ECS clusters/services/tasks, troubleshooting (3개 도구 / 3 tools)
- `aws_istio_mcp.py` [VPC] — Istio CRDs via Steampipe K8s tables (12개 도구 / 12 tools)
- `aws_iac_mcp.py` — CloudFormation/CDK validation, troubleshooting, docs (7개 도구 / 7 tools)
- `aws_terraform_mcp.py` — Provider docs, Registry module search (5개 도구 / 5 tools)
- `aws_iam_mcp.py` — IAM users/roles/groups/policies, simulation (14개 도구 / 14 tools)
- `aws_cloudwatch_mcp.py` — Metrics, alarms, Log Insights (11개 도구 / 11 tools)
- `aws_cloudtrail_mcp.py` — Event lookup, CloudTrail Lake (5개 도구 / 5 tools)
- `aws_cost_mcp.py` — Cost Explorer, Pricing, Budgets (9개 도구 / 9 tools)
- `aws_dynamodb_mcp.py` — Tables, queries, data modeling, costs (6개 도구 / 6 tools)
- `aws_rds_mcp.py` — RDS/Aurora instances, SQL via Data API (6개 도구 / 6 tools)
- `aws_valkey_mcp.py` — ElastiCache clusters, replication groups (6개 도구 / 6 tools)
- `aws_msk_mcp.py` — MSK Kafka clusters, brokers, configs (6개 도구 / 6 tools)
- `aws_knowledge.py` — AWS Knowledge MCP 프록시 (Proxy to AWS Knowledge MCP, 5개 도구 / 5 tools)
- `aws_core_mcp.py` — 프롬프트 이해, AWS CLI 실행 (Prompt understanding, AWS CLI execution, 3개 도구 / 3 tools)

## 규칙 / Rules
- 게이트웨이 타겟: Python/boto3 사용 필수 — CLI는 inlinePayload 문제 있음
  (Gateway Targets: must use Python/boto3 — CLI has inlinePayload issues)
- 모든 타겟에 `credentialProviderConfigurations: GATEWAY_IAM_ROLE` 필수
  (`credentialProviderConfigurations: GATEWAY_IAM_ROLE` required for all targets)
- VPC Lambda: psycopg2 대신 pg8000 사용 (steampipe-query, istio-mcp)
  (VPC Lambda: pg8000, not psycopg2)
- 모든 Lambda는 읽기 전용 — 도달성 경로 생성 외 쓰기 작업 없음
  (All Lambda read-only — no write operations except reachability path creation)
- 도구 스키마 형식: `inlinePayload: [{name, description, inputSchema: {type, properties, required}}]`
  (Tool schema format)
