#!/usr/bin/env python3
"""AI Route Test Script — Tests all 9 routes with 20 questions.
AI 라우트 테스트 스크립트 — 9개 라우트, 20개 질문 테스트.

Usage / 사용법:
  python3 scripts/test-ai-routes.py
  python3 scripts/test-ai-routes.py --url http://localhost:3000/awsops/api/ai
  python3 scripts/test-ai-routes.py --timeout 120
"""
import json, time, urllib.request, sys, os
from datetime import datetime

URL = sys.argv[sys.argv.index("--url") + 1] if "--url" in sys.argv else "http://localhost:3000/awsops/api/ai"
TIMEOUT = int(sys.argv[sys.argv.index("--timeout") + 1]) if "--timeout" in sys.argv else 90

# 20 test questions covering all 9 routes / 9개 라우트를 커버하는 20개 테스트 질문
TESTS = [
    # (expected_route, label, question)
    # Security Gateway
    ("security",    "보안 요약",         "보안 이슈가 있는지 확인해줘"),
    ("security",    "IAM 사용자",        "IAM 사용자 목록과 Access Key 상태를 보여줘"),
    ("security",    "역할 분석",         "AWSopsAgentCoreRole의 권한을 분석해줘"),
    # Infra Gateway
    ("infra",       "VPC 현황",          "VPC 현황과 서브넷 구성을 알려줘"),
    ("infra",       "EKS 클러스터",      "EKS 클러스터 상태와 노드 현황을 확인해줘"),
    ("infra",       "보안그룹",          "보안그룹 규칙을 확인해줘"),
    # Cost Gateway
    ("cost",        "비용 분석",         "이번 달 비용을 서비스별로 분석해줘"),
    ("cost",        "비용 비교",         "전월 대비 비용 변화와 증가 원인을 알려줘"),
    ("cost",        "비용 예측",         "다음 달 비용을 예측해줘"),
    # Monitoring Gateway
    ("monitoring",  "알람 확인",         "현재 활성화된 CloudWatch 알람이 있어?"),
    ("monitoring",  "CPU 추세",          "EC2 인스턴스 CPU 사용량 추세를 보여줘"),
    ("monitoring",  "CloudTrail",       "최근 CloudTrail 이벤트를 조회해줘"),
    # Data Gateway
    ("data",        "DynamoDB",         "DynamoDB 테이블 목록을 보여줘"),
    ("data",        "RDS",              "RDS 인스턴스 현황과 상태를 확인해줘"),
    ("data",        "ElastiCache",      "ElastiCache 클러스터 구성을 알려줘"),
    # AWS-Data (Steampipe SQL)
    ("aws-data",    "EC2 목록",          "EC2 인스턴스 목록을 보여줘"),
    ("aws-data",    "S3 버킷",           "S3 버킷 현황을 정리해줘"),
    # IaC Gateway
    ("iac",         "CDK 모범사례",      "CDK 모범사례를 알려줘"),
    # Code Interpreter
    ("code",        "파이썬 코드",       "피보나치 수열 처음 20개를 파이썬으로 계산해줘"),
    # General / Ops Gateway
    ("general",     "리전 가용성",       "서울 리전에서 Bedrock이 사용 가능한지 확인해줘"),
]


def call_ai(question):
    """Call AI API and return result dict. / AI API 호출 후 결과 딕셔너리 반환."""
    payload = json.dumps({"messages": [{"role": "user", "content": question}]}).encode()
    req = urllib.request.Request(URL, data=payload, headers={"Content-Type": "application/json"})
    start = time.time()
    try:
        resp = urllib.request.urlopen(req, timeout=TIMEOUT)
        elapsed = time.time() - start
        data = json.loads(resp.read())
        return {
            "time": elapsed,
            "route": data.get("route", "?"),
            "via": data.get("via", "?"),
            "content_length": len(data.get("content", "")),
            "content_preview": data.get("content", "")[:150].replace("\n", " "),
            "error": None,
        }
    except Exception as e:
        return {
            "time": time.time() - start,
            "route": "?",
            "via": "?",
            "content_length": 0,
            "content_preview": "",
            "error": str(e)[:100],
        }


def main():
    print(f"\n{'='*90}")
    print(f"  AWSops AI Route Test — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  URL: {URL}  |  Timeout: {TIMEOUT}s  |  Questions: {len(TESTS)}")
    print(f"{'='*90}\n")

    results = []
    pass_count = 0
    fail_count = 0
    route_match = 0
    total_time = 0

    for i, (expected_route, label, question) in enumerate(TESTS, 1):
        print(f"[{i:2d}/{len(TESTS)}] {label:<14} {question[:40]:<40} ", end="", flush=True)
        result = call_ai(question)
        result["label"] = label
        result["question"] = question
        result["expected_route"] = expected_route

        elapsed = result["time"]
        total_time += elapsed

        if result["error"]:
            status = "FAIL"
            fail_count += 1
            print(f"  {elapsed:>5.1f}s  ❌ {result['error'][:50]}")
        else:
            pass_count += 1
            matched = "✓" if result["route"] == expected_route else "✗"
            if result["route"] == expected_route:
                route_match += 1
            status = "OK"
            print(f"  {elapsed:>5.1f}s  ✅ route={result['route']:<12} {matched} {result['via'][:40]}")

        result["status"] = status
        results.append(result)

    # Summary / 요약
    avg_time = total_time / len(TESTS) if TESTS else 0
    times = [r["time"] for r in results if not r["error"]]
    min_time = min(times) if times else 0
    max_time = max(times) if times else 0

    print(f"\n{'='*90}")
    print(f"  SUMMARY / 요약")
    print(f"{'='*90}")
    print(f"  Total:        {pass_count} passed / {fail_count} failed / {len(TESTS)} total")
    print(f"  Route match:  {route_match}/{len(TESTS)} ({route_match/len(TESTS)*100:.0f}%)")
    print(f"  Avg time:     {avg_time:.1f}s")
    print(f"  Min / Max:    {min_time:.1f}s / {max_time:.1f}s")
    print(f"  Total time:   {total_time:.1f}s")
    print()

    # Per-route summary / 라우트별 요약
    route_stats = {}
    for r in results:
        route = r["route"] if not r["error"] else "error"
        if route not in route_stats:
            route_stats[route] = {"count": 0, "total_time": 0, "errors": 0}
        route_stats[route]["count"] += 1
        route_stats[route]["total_time"] += r["time"]
        if r["error"]:
            route_stats[route]["errors"] += 1

    print(f"  {'Route':<14} {'Count':>5} {'Avg Time':>10} {'Errors':>7}")
    print(f"  {'-'*40}")
    for route, stats in sorted(route_stats.items()):
        avg = stats["total_time"] / stats["count"]
        err = f"{stats['errors']}" if stats["errors"] else "-"
        print(f"  {route:<14} {stats['count']:>5} {avg:>9.1f}s {err:>7}")

    # Save detailed results to JSON / 상세 결과 JSON 저장
    output_dir = "/tmp"
    output_file = os.path.join(output_dir, f"ai-test-results-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json")
    report = {
        "timestamp": datetime.now().isoformat(),
        "url": URL,
        "timeout": TIMEOUT,
        "summary": {
            "passed": pass_count,
            "failed": fail_count,
            "total": len(TESTS),
            "route_match": route_match,
            "avg_time_sec": round(avg_time, 2),
            "min_time_sec": round(min_time, 2),
            "max_time_sec": round(max_time, 2),
            "total_time_sec": round(total_time, 2),
        },
        "results": results,
    }
    with open(output_file, "w") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\n  Results saved: {output_file}")
    print()


if __name__ == "__main__":
    main()
