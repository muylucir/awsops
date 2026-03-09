#!/bin/bash
set -e
################################################################################
#                                                                              #
#   Step 6: AgentCore 전체 설치 (래퍼) / Full Setup (wrapper)                   #
#                                                                              #
#   5개 하위 단계를 순서대로 실행 / Runs 5 sub-steps in sequence:               #
#     6a: Runtime     - IAM, ECR, Docker, Runtime, Endpoint                    #
#     6b: Gateway     - 7개 AgentCore Gateway (MCP)                            #
#     6c: Tools       - 19 Lambda + 19 Gateway Targets                        #
#     6d: Interpreter - Code Interpreter                                       #
#     6e: Config      - route.ts, agent.py에 리소스 ID 자동 설정               #
#                                                                              #
#   개별 실행 / Run individually:                                               #
#     bash scripts/06a-setup-agentcore-runtime.sh                              #
#     bash scripts/06b-setup-agentcore-gateway.sh                              #
#     bash scripts/06c-setup-agentcore-tools.sh                                #
#     bash scripts/06d-setup-agentcore-interpreter.sh                          #
#     bash scripts/06e-setup-agentcore-config.sh                               #
#                                                                              #
################################################################################

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

bash "$SCRIPT_DIR/06a-setup-agentcore-runtime.sh"
bash "$SCRIPT_DIR/06b-setup-agentcore-gateway.sh"
bash "$SCRIPT_DIR/06c-setup-agentcore-tools.sh"
bash "$SCRIPT_DIR/06d-setup-agentcore-interpreter.sh"
bash "$SCRIPT_DIR/06e-setup-agentcore-config.sh"
