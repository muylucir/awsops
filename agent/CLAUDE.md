# 에이전트 모듈 / Agent Module

## 역할 / Role
AgentCore 런타임용 Strands 에이전트. MCP 프로토콜을 통해 7개 역할 기반 게이트웨이에 연결.
(Strands Agent for AgentCore Runtime. Connects to 7 role-based Gateways via MCP protocol.)

## 주요 파일 / Key Files
- `agent.py` — 메인 진입점: `payload.gateway` 파라미터를 통한 동적 게이트웨이 선택 (Main entrypoint: dynamic Gateway selection via `payload.gateway` parameter)
- `streamable_http_sigv4.py` — AWS SigV4 서명을 사용한 MCP StreamableHTTP (MCP StreamableHTTP with AWS SigV4 signing)
- `Dockerfile` — Python 3.11-slim, arm64, port 8080
- `requirements.txt` — strands-agents, boto3, bedrock-agentcore, psycopg2-binary
- `lambda/` — 19개 Lambda 소스 파일 + 타겟 생성 스크립트 (19 Lambda source files + `create_targets.py`)

## 규칙 / Rules
- Docker 이미지는 arm64 필수 (`docker buildx --platform linux/arm64`)
  (Docker image must be arm64)
- 게이트웨이 URL은 payload 기반으로 `GATEWAYS` 딕셔너리에서 동적 선택
  (Gateway URL selected dynamically from `GATEWAYS` dict based on payload)
- 시스템 프롬프트는 역할별로 다름: infra/iac/data/security/monitoring/cost/ops
  (System prompt is role-specific)
- 폴백: MCP 연결 실패 시 도구 없이 실행 — Bedrock 직접 호출
  (Fallback: if MCP connection fails, run without tools — Bedrock direct)
