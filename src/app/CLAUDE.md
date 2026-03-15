# 앱 모듈

## 역할
Next.js 14 App Router 페이지 및 API 라우트. 각 하위 디렉토리는 라우트 세그먼트.

> Next.js 14 App Router pages and API routes. Each subdirectory is a route segment.

## 페이지 (31개)

### Overview (3)
- `page.tsx` — 대시보드 홈 (20 StatsCards, Cost 가용성 감지, 인벤토리 스냅샷)
- `ai/page.tsx` — AI 어시스턴트 (SSE 스트리밍, 멀티 라우트, 도구 사용 표시)
- `agentcore/page.tsx` — AgentCore 대시보드 (Runtime/Gateway/Tools 상태)

### Compute (6)
- `ec2/page.tsx` — EC2 인스턴스 + 상세 패널
- `lambda/page.tsx` — Lambda 함수, 런타임
- `ecs/page.tsx` — ECS 클러스터/서비스/태스크
- `ecr/page.tsx` — ECR 리포지토리/이미지
- `k8s/page.tsx` — EKS Overview (클러스터, 노드, Pod 요약)
- `k8s/explorer/page.tsx` — K9s 스타일 터미널 UI

### EKS 하위 (4)
- `k8s/pods/page.tsx` — Pod 목록/상태
- `k8s/nodes/page.tsx` — 노드 목록/용량
- `k8s/deployments/page.tsx` — Deployment 목록
- `k8s/services/page.tsx` — Service 목록

### Network & CDN (4)
- `vpc/page.tsx` — VPC/Subnet/SG/Route Tables/TGW/ELB/NAT/IGW + 리소스 맵
- `cloudfront-cdn/page.tsx` — CloudFront 배포
- `waf/page.tsx` — WAF Web ACL/규칙
- `topology/page.tsx` — 인프라 맵 + K8s 맵 (React Flow)

### Storage & DB (7)
- `ebs/page.tsx` — EBS 볼륨/스냅샷 (암호화, EC2 어태치먼트 매핑)
- `s3/page.tsx` — S3 버킷 (TreeMap/검색/IAM)
- `rds/page.tsx` — RDS 인스턴스 (SG 체이닝/메트릭/CloudWatch 메트릭 테이블)
- `dynamodb/page.tsx` — DynamoDB 테이블
- `elasticache/page.tsx` — ElastiCache 클러스터 (Valkey/Redis/Memcached, 노드 메트릭 테이블)
- `opensearch/page.tsx` — OpenSearch 도메인 (암호화, VPC, 도메인 메트릭 테이블)
- `msk/page.tsx` — MSK 클러스터 (브로커 노드 + CPU/Memory/Network 메트릭)

### Monitoring (5)
- `monitoring/page.tsx` — CPU/메모리/네트워크/Disk I/O (날짜 범위)
- `cloudwatch/page.tsx` — CloudWatch 알람
- `cloudtrail/page.tsx` — CloudTrail 트레일/이벤트
- `cost/page.tsx` — Cost Explorer (MSP 자동 감지, 스냅샷 폴백)
- `inventory/page.tsx` — Resource Inventory (리소스 수량 추이, 비용 영향 추정)

### Security (3)
- `iam/page.tsx` — IAM 사용자/역할/트러스트 정책
- `security/page.tsx` — Public S3, Open SG, Unencrypted EBS, CVE
- `compliance/page.tsx` — CIS v1.5~v4.0 벤치마크 (431 controls)

## API 라우트 (10개)

| API | 설명 |
|-----|------|
| `api/ai/route.ts` | AI 라우팅 (10 routes, 멀티 라우트, SSE, 도구 추론) |
| `api/steampipe/route.ts` | Steampipe 쿼리 + Cost 가용성 + 인벤토리 (POST/GET/PUT) |
| `api/auth/route.ts` | 로그아웃 — HttpOnly 쿠키 서버 사이드 삭제 |
| `api/msk/route.ts` | MSK 브로커 노드 (kafka list-nodes) + CloudWatch 메트릭 |
| `api/rds/route.ts` | RDS 인스턴스 CloudWatch 메트릭 (CPU/Memory/IOPS/Network/Storage) |
| `api/elasticache/route.ts` | ElastiCache 노드 CloudWatch 메트릭 (CPU/EngineCPU/Memory/Network) |
| `api/opensearch/route.ts` | OpenSearch 도메인 CloudWatch 메트릭 (CPU/JVM/ClusterStatus/Search) |
| `api/agentcore/route.ts` | AgentCore Runtime/Gateway 상태 (config 기반, AWS CLI) |
| `api/code/route.ts` | 코드 인터프리터 |
| `api/benchmark/route.ts` | CIS 컴플라이언스 벤치마크 |

> 10 API routes: AI routing, Steampipe, Auth, MSK/RDS/ElastiCache/OpenSearch CW metrics, AgentCore, Code, Benchmark

## 규칙
- 모든 페이지 파일은 `'use client'`로 시작
- 모든 fetch URL에 `/awsops/api/*` 접두사 필수
- 컴포넌트 임포트는 `import X from '...'` (default export)
- StatsCard `color`는 이름('cyan') 사용 — hex 아님
- CloudWatch 메트릭 API: `execFileSync`로 AWS CLI 호출 (shell injection 방지)

> All pages start with 'use client'. Fetch URLs: '/awsops/api/*' prefix.
> Default exports only. StatsCard color: names not hex.
> CW metric APIs use execFileSync (no shell injection).
