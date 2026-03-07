#!/bin/bash
set -e
################################################################################
#                                                                              #
#   Step 6: AgentCore Full Setup (wrapper)                                     #
#                                                                              #
#   Runs all 4 AgentCore sub-steps in sequence:                                #
#     6a: Runtime     - IAM, ECR, Docker, Runtime, Endpoint                    #
#     6b: Gateway     - AgentCore Gateway (MCP)                                #
#     6c: Tools       - Lambda functions + Gateway Targets                     #
#     6d: Interpreter - Code Interpreter                                       #
#                                                                              #
#   Or run each sub-step individually:                                         #
#     bash scripts/06a-setup-agentcore-runtime.sh                              #
#     bash scripts/06b-setup-agentcore-gateway.sh                              #
#     bash scripts/06c-setup-agentcore-tools.sh                                #
#     bash scripts/06d-setup-agentcore-interpreter.sh                          #
#                                                                              #
################################################################################

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

bash "$SCRIPT_DIR/06a-setup-agentcore-runtime.sh"
bash "$SCRIPT_DIR/06b-setup-agentcore-gateway.sh"
bash "$SCRIPT_DIR/06c-setup-agentcore-tools.sh"
bash "$SCRIPT_DIR/06d-setup-agentcore-interpreter.sh"
