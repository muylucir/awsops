#!/bin/bash
set -e
################################################################################
#                                                                              #
#   Step 6b: AgentCore Gateway Setup                                           #
#                                                                              #
#   Creates:                                                                   #
#     1. AgentCore Gateway (MCP protocol, NONE auth)                           #
#                                                                              #
#   The Gateway serves as the MCP router that connects the Strands agent       #
#   to Lambda-based tools via Gateway Targets (created in Step 6c).            #
#                                                                              #
################################################################################

# -- Colors & common variables ------------------------------------------------
GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
WORK_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REGION="${AWS_DEFAULT_REGION:-ap-northeast-2}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "unknown")

echo ""
echo -e "${CYAN}=================================================================${NC}"
echo -e "${CYAN}   Step 6b: AgentCore Gateway Setup${NC}"
echo -e "${CYAN}=================================================================${NC}"
echo ""
echo "  Region:  $REGION"
echo "  Account: $ACCOUNT_ID"
echo ""

# -- [1/2] Verify IAM Role exists ---------------------------------------------
echo -e "${CYAN}[1/2] Verifying AgentCore IAM role...${NC}"

ROLE_ARN=$(aws iam get-role --role-name AWSopsAgentCoreRole \
    --query "Role.Arn" --output text 2>/dev/null || echo "")

if [ -z "$ROLE_ARN" ] || [ "$ROLE_ARN" = "None" ]; then
    echo -e "${RED}ERROR: AWSopsAgentCoreRole not found. Run 06a first.${NC}"
    exit 1
fi
echo "  Role: $ROLE_ARN"

# -- [2/2] Create AgentCore Gateway -------------------------------------------
echo ""
echo -e "${CYAN}[2/2] Creating AgentCore Gateway (MCP, NONE auth)...${NC}"

GW_RESULT=$(aws bedrock-agentcore-control create-gateway \
    --name awsops-gateway \
    --role-arn "$ROLE_ARN" \
    --protocol-type MCP --authorizer-type NONE \
    --region "$REGION" --output json 2>&1)

GW_ID=$(echo "$GW_RESULT" | python3 -c "import json,sys;print(json.load(sys.stdin).get('gatewayId',''))" 2>/dev/null || echo "")

if [ -z "$GW_ID" ] || [ "$GW_ID" = "" ]; then
    echo -e "${RED}ERROR: Failed to create Gateway.${NC}"
    echo "  $GW_RESULT"
    exit 1
fi
echo "  Gateway ID: $GW_ID"

# -- Summary -------------------------------------------------------------------
echo ""
echo -e "${GREEN}=================================================================${NC}"
echo -e "${GREEN}   Step 6b Complete: AgentCore Gateway configured${NC}"
echo -e "${GREEN}=================================================================${NC}"
echo ""
echo "  Gateway ID:     $GW_ID"
echo "  Protocol:       MCP"
echo "  Authorizer:     NONE"
echo ""
echo "  Next: bash scripts/06c-setup-agentcore-tools.sh"
echo ""
