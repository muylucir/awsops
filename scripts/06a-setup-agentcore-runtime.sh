#!/bin/bash
set -e
################################################################################
#                                                                              #
#   Step 6a: AgentCore Runtime Setup                                           #
#                                                                              #
#   Creates:                                                                   #
#     1. IAM Role (AgentCore - Bedrock + ECR)                                  #
#     2. ECR Repository                                                        #
#     3. ARM64 Docker image (docker buildx)                                    #
#     4. AgentCore Runtime (Strands agent)                                     #
#     5. Runtime Endpoint                                                      #
#                                                                              #
#   Known issues handled:                                                      #
#     - Docker image must be arm64 (docker buildx --platform linux/arm64)     #
#     - SDK v3: use response.transformToString() (not read())                 #
#                                                                              #
################################################################################

# -- Colors & common variables ------------------------------------------------
GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
WORK_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REGION="${AWS_DEFAULT_REGION:-ap-northeast-2}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "unknown")

echo ""
echo -e "${CYAN}=================================================================${NC}"
echo -e "${CYAN}   Step 6a: AgentCore Runtime Setup${NC}"
echo -e "${CYAN}=================================================================${NC}"
echo ""
echo "  Region:  $REGION"
echo "  Account: $ACCOUNT_ID"
echo ""

# -- [1/5] Create IAM Role ---------------------------------------------------
echo -e "${CYAN}[1/5] Creating AgentCore IAM role...${NC}"

aws iam create-role --role-name AWSopsAgentCoreRole \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {"Effect": "Allow", "Principal": {"Service": "bedrock.amazonaws.com"}, "Action": "sts:AssumeRole"},
            {"Effect": "Allow", "Principal": {"Service": "bedrock-agentcore.amazonaws.com"}, "Action": "sts:AssumeRole"}
        ]
    }' 2>/dev/null || true

aws iam attach-role-policy --role-name AWSopsAgentCoreRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess 2>/dev/null || true

aws iam put-role-policy --role-name AWSopsAgentCoreRole --policy-name ECRAndLambda \
    --policy-document "{
        \"Version\": \"2012-10-17\",
        \"Statement\": [{
            \"Effect\": \"Allow\",
            \"Action\": [\"ecr:*\", \"lambda:InvokeFunction\", \"lambda:GetFunction\"],
            \"Resource\": \"*\"
        }]
    }" 2>/dev/null

echo "  AWSopsAgentCoreRole: created"
echo "  Waiting for IAM propagation (10s)..."
sleep 10

# -- [2/5] Create ECR Repository ----------------------------------------------
echo ""
echo -e "${CYAN}[2/5] Creating ECR repository...${NC}"
aws ecr create-repository --repository-name awsops-agent --region "$REGION" 2>/dev/null || true
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/awsops-agent"
echo "  ECR: $ECR_URI"

# -- [3/5] Build and Push Docker Image (ARM64) --------------------------------
#   KNOWN ISSUE: AgentCore Runtime requires arm64 Docker image.
echo ""
echo -e "${CYAN}[3/5] Building Docker image (arm64)...${NC}"
echo -e "  ${YELLOW}NOTE: arm64 required for AgentCore Runtime${NC}"

aws ecr get-login-password --region "$REGION" | \
    docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com" 2>/dev/null

docker buildx create --use 2>/dev/null || true
docker buildx build --platform linux/arm64 \
    -t "${ECR_URI}:latest" --push \
    "$WORK_DIR/agent/" 2>&1 | tail -5
echo "  Image: ${ECR_URI}:latest (arm64)"

# -- [4/5] Create AgentCore Runtime -------------------------------------------
echo ""
echo -e "${CYAN}[4/5] Creating AgentCore Runtime (Strands agent)...${NC}"
sleep 5

RT_RESULT=$(aws bedrock-agentcore-control create-agent-runtime \
    --agent-runtime-name awsops_agent \
    --role-arn "arn:aws:iam::${ACCOUNT_ID}:role/AWSopsAgentCoreRole" \
    --agent-runtime-artifact "{\"containerConfiguration\":{\"containerUri\":\"${ECR_URI}:latest\"}}" \
    --network-configuration '{"networkMode":"PUBLIC"}' \
    --region "$REGION" --output json 2>&1)

RT_ID=$(echo "$RT_RESULT" | python3 -c "import json,sys;print(json.load(sys.stdin).get('agentRuntimeId',''))" 2>/dev/null || echo "")
RT_ARN=$(echo "$RT_RESULT" | python3 -c "import json,sys;print(json.load(sys.stdin).get('agentRuntimeArn',''))" 2>/dev/null || echo "")
echo "  Runtime ID:  $RT_ID"
echo "  Runtime ARN: $RT_ARN"

# -- [5/5] Create Runtime Endpoint --------------------------------------------
echo ""
echo -e "${CYAN}[5/5] Creating Runtime Endpoint...${NC}"

if [ -n "$RT_ID" ] && [ "$RT_ID" != "" ]; then
    EP_RESULT=$(aws bedrock-agentcore-control create-agent-runtime-endpoint \
        --agent-runtime-id "$RT_ID" --name awsops_endpoint \
        --region "$REGION" --output json 2>&1)
    EP_ID=$(echo "$EP_RESULT" | python3 -c "import json,sys;print(json.load(sys.stdin).get('agentRuntimeEndpointId', json.load(open('/dev/stdin')).get('endpointId','N/A')))" 2>/dev/null || echo "N/A")
    echo "  Endpoint ID: $EP_ID"
else
    echo -e "  ${YELLOW}SKIP: No Runtime ID available.${NC}"
    EP_ID="N/A"
fi

# -- Summary -------------------------------------------------------------------
echo ""
echo -e "${GREEN}=================================================================${NC}"
echo -e "${GREEN}   Step 6a Complete: AgentCore Runtime configured${NC}"
echo -e "${GREEN}=================================================================${NC}"
echo ""
echo "  Runtime ID:   $RT_ID"
echo "  Runtime ARN:  $RT_ARN"
echo "  Endpoint ID:  $EP_ID"
echo "  ECR Image:    ${ECR_URI}:latest (arm64)"
echo ""
echo "  Next: bash scripts/06b-setup-agentcore-gateway.sh"
echo ""
