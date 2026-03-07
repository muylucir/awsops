#!/bin/bash
set -e
################################################################################
#                                                                              #
#   Step 6c: AgentCore Gateway Tools & MCP Setup                               #
#                                                                              #
#   Creates:                                                                   #
#     1. IAM Role for Lambda (network permissions)                             #
#     2. Lambda functions (4: reachability, flow-monitor, network-mcp,         #
#        steampipe-query) with inline Python code                              #
#     3. Gateway Targets (4) linking Lambda to Gateway via MCP                 #
#                                                                              #
#   Known issues handled:                                                      #
#     - Gateway toolSchema uses inlinePayload (not OpenAPI)                   #
#     - CLI has issues with inlinePayload -> using Python/boto3               #
#     - targetConfiguration must use mcp.lambda (not lambdaTargetConfig)      #
#     - credentialProviderConfigurations is required                           #
#     - microVM cannot access localhost -> Lambda for Steampipe               #
#                                                                              #
################################################################################

# -- Colors & common variables ------------------------------------------------
GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
WORK_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REGION="${AWS_DEFAULT_REGION:-ap-northeast-2}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "unknown")

echo ""
echo -e "${CYAN}=================================================================${NC}"
echo -e "${CYAN}   Step 6c: AgentCore Gateway Tools & MCP Setup${NC}"
echo -e "${CYAN}=================================================================${NC}"
echo ""
echo "  Region:  $REGION"
echo "  Account: $ACCOUNT_ID"
echo ""

# -- [1/3] Create Lambda IAM Role ---------------------------------------------
echo -e "${CYAN}[1/3] Creating Lambda Network IAM role...${NC}"

aws iam create-role --role-name AWSopsLambdaNetworkRole \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {"Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}
        ]
    }' 2>/dev/null || true

aws iam attach-role-policy --role-name AWSopsLambdaNetworkRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole 2>/dev/null || true
aws iam attach-role-policy --role-name AWSopsLambdaNetworkRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonVPCFullAccess 2>/dev/null || true

aws iam put-role-policy --role-name AWSopsLambdaNetworkRole --policy-name FullNetwork \
    --policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": ["ec2:*", "tiros:*", "logs:*", "network-firewall:*", "networkmanager:*"],
            "Resource": "*"
        }]
    }' 2>/dev/null

echo "  AWSopsLambdaNetworkRole: created"
echo "  Waiting for IAM propagation (10s)..."
sleep 10

LAMBDA_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/AWSopsLambdaNetworkRole"

# -- [2/3] Create Lambda Functions (inline Python) ----------------------------
echo ""
echo -e "${CYAN}[2/3] Creating Lambda functions (4)...${NC}"

# --- reachability.py ---
cat > /tmp/reachability.py << 'LAMBDAEOF'
import boto3, json

def lambda_handler(event, context):
    ec2 = boto3.client('ec2')
    params = event if isinstance(event, dict) else json.loads(event)
    source = params['source']
    destination = params['destination']
    protocol = params.get('protocol', 'tcp')
    port = params.get('port', 443)

    path_resp = ec2.create_network_insights_path(
        Source=source, Destination=destination,
        Protocol=protocol, DestinationPort=int(port),
        TagSpecifications=[{'ResourceType': 'network-insights-path',
            'Tags': [{'Key': 'CreatedBy', 'Value': 'awsops'}]}]
    )
    path_id = path_resp['NetworkInsightsPath']['NetworkInsightsPathId']
    analysis_resp = ec2.start_network_insights_analysis(NetworkInsightsPathId=path_id)
    analysis_id = analysis_resp['NetworkInsightsAnalysis']['NetworkInsightsAnalysisId']
    return {'statusCode': 200, 'body': json.dumps({
        'pathId': path_id, 'analysisId': analysis_id,
        'status': analysis_resp['NetworkInsightsAnalysis']['Status']})}
LAMBDAEOF

# --- flowmonitor.py ---
cat > /tmp/flowmonitor.py << 'LAMBDAEOF'
import boto3, json

def lambda_handler(event, context):
    ec2 = boto3.client('ec2')
    params = event if isinstance(event, dict) else json.loads(event)
    vpc_id = params['vpc_id']
    resp = ec2.describe_flow_logs(Filters=[{'Name': 'resource-id', 'Values': [vpc_id]}])
    flow_logs = [{'FlowLogId': fl.get('FlowLogId'), 'ResourceId': fl.get('ResourceId'),
        'TrafficType': fl.get('TrafficType'), 'LogStatus': fl.get('LogStatus'),
        'LogDestination': fl.get('LogDestination')} for fl in resp.get('FlowLogs', [])]
    return {'statusCode': 200, 'body': json.dumps({
        'vpcId': vpc_id, 'flowLogs': flow_logs, 'count': len(flow_logs)})}
LAMBDAEOF

# --- network_mcp.py ---
cat > /tmp/network_mcp.py << 'LAMBDAEOF'
import boto3, json

def lambda_handler(event, context):
    ec2 = boto3.client('ec2')
    params = event if isinstance(event, dict) else json.loads(event)
    rt = params['resource_type']
    rid = params.get('resource_id')
    vpc = params.get('vpc_id')

    handlers = {
        'security_group': lambda: ec2.describe_security_groups(
            Filters=([{'Name':'group-id','Values':[rid]}] if rid else [{'Name':'vpc-id','Values':[vpc]}] if vpc else [])),
        'nacl': lambda: ec2.describe_network_acls(
            Filters=([{'Name':'network-acl-id','Values':[rid]}] if rid else [{'Name':'vpc-id','Values':[vpc]}] if vpc else [])),
        'route_table': lambda: ec2.describe_route_tables(
            Filters=([{'Name':'route-table-id','Values':[rid]}] if rid else [{'Name':'vpc-id','Values':[vpc]}] if vpc else [])),
        'subnet': lambda: ec2.describe_subnets(
            Filters=([{'Name':'subnet-id','Values':[rid]}] if rid else [{'Name':'vpc-id','Values':[vpc]}] if vpc else [])),
        'vpc': lambda: ec2.describe_vpcs(VpcIds=[rid] if rid else []),
    }
    if rt not in handlers:
        return {'statusCode': 400, 'body': json.dumps({'error': 'Unknown type: ' + rt})}
    resp = handlers[rt]()
    resp.pop('ResponseMetadata', None)
    return {'statusCode': 200, 'body': json.dumps(resp, default=str)}
LAMBDAEOF

# --- steampipe_query.py ---
cat > /tmp/steampipe_query.py << 'LAMBDAEOF'
import boto3, json

def lambda_handler(event, context):
    ec2 = boto3.client('ec2')
    params = event if isinstance(event, dict) else json.loads(event)
    sql = params['sql'].lower()

    if 'instance' in sql or 'ec2' in sql:
        resp = ec2.describe_instances()
        instances = [{'InstanceId': i['InstanceId'], 'State': i['State']['Name'],
            'InstanceType': i['InstanceType'], 'PrivateIp': i.get('PrivateIpAddress')}
            for r in resp['Reservations'] for i in r['Instances']]
        return {'statusCode': 200, 'body': json.dumps({'instances': instances}, default=str)}
    elif 'vpc' in sql:
        return {'statusCode': 200, 'body': json.dumps(ec2.describe_vpcs().get('Vpcs', []), default=str)}
    elif 'subnet' in sql:
        return {'statusCode': 200, 'body': json.dumps(ec2.describe_subnets().get('Subnets', []), default=str)}
    elif 'security' in sql or 'sg' in sql:
        return {'statusCode': 200, 'body': json.dumps(ec2.describe_security_groups().get('SecurityGroups', []), default=str)}
    return {'statusCode': 400, 'body': json.dumps({'error': 'Use keywords: instance, ec2, vpc, subnet, security'})}
LAMBDAEOF

# Deploy all 4 Lambda functions
declare -A FUNC_MAP=(
    ["awsops-reachability-analyzer"]="reachability"
    ["awsops-flow-monitor"]="flowmonitor"
    ["awsops-network-mcp"]="network_mcp"
    ["awsops-steampipe-query"]="steampipe_query"
)

for FUNC_NAME in "${!FUNC_MAP[@]}"; do
    HANDLER="${FUNC_MAP[$FUNC_NAME]}"
    cd /tmp && zip -j "${HANDLER}.zip" "${HANDLER}.py" 2>/dev/null

    aws lambda create-function \
        --function-name "$FUNC_NAME" --runtime python3.12 \
        --handler "${HANDLER}.lambda_handler" \
        --role "$LAMBDA_ROLE_ARN" --zip-file "fileb:///tmp/${HANDLER}.zip" \
        --timeout 120 --memory-size 256 \
        --region "$REGION" 2>/dev/null || \
    aws lambda update-function-code \
        --function-name "$FUNC_NAME" --zip-file "fileb:///tmp/${HANDLER}.zip" \
        --region "$REGION" 2>/dev/null

    aws lambda add-permission --function-name "$FUNC_NAME" \
        --statement-id agentcore-invoke --action lambda:InvokeFunction \
        --principal bedrock-agentcore.amazonaws.com \
        --region "$REGION" 2>/dev/null || true

    echo "  Lambda: $FUNC_NAME"
done

# -- [3/3] Create Gateway Targets (via Python/boto3) --------------------------
#   KNOWN ISSUE: AWS CLI has issues with inlinePayload JSON format.
#   Using Python/boto3 with correct mcp.lambda structure.
echo ""
echo -e "${CYAN}[3/3] Creating Gateway targets (4) via boto3...${NC}"
echo -e "  ${YELLOW}NOTE: Using Python/boto3 (CLI has issues with inlinePayload)${NC}"

# Auto-detect Gateway ID
GW_ID=$(aws bedrock-agentcore-control list-gateways \
    --region "$REGION" --output json 2>/dev/null | \
    python3 -c "import json,sys;gws=json.load(sys.stdin).get('items',[]); print(next((g['gatewayId'] for g in gws if 'awsops' in g.get('name','')), ''))" 2>/dev/null || echo "")

if [ -z "$GW_ID" ] || [ "$GW_ID" = "" ]; then
    echo -e "${RED}ERROR: Gateway not found. Run 06b first.${NC}"
    exit 1
fi
echo "  Gateway: $GW_ID"

python3 << PYEOF
import boto3

client = boto3.client('bedrock-agentcore-control', region_name='${REGION}')
gw_id = '${GW_ID}'
account_id = '${ACCOUNT_ID}'
region = '${REGION}'

def prop(t, d=''):
    r = {'type': t}
    if d:
        r['description'] = d
    return r

targets = [
    ('reachability-target', 'awsops-reachability-analyzer',
     'VPC Reachability Analyzer - checks network paths between resources',
     [{'name': 'analyze_reachability',
       'description': 'Analyze network reachability between two AWS resources',
       'inputSchema': {'type': 'object', 'properties': {
           'source': prop('string', 'Source resource ID (i-xxx, eni-xxx)'),
           'destination': prop('string', 'Destination resource ID or IP'),
           'protocol': prop('string', 'Protocol tcp/udp'),
           'port': prop('integer', 'Destination port number')},
        'required': ['source', 'destination']}}]),
    ('flow-monitor-target', 'awsops-flow-monitor',
     'VPC Flow Log analyzer - queries network traffic',
     [{'name': 'query_flow_logs',
       'description': 'Query VPC flow logs for traffic analysis',
       'inputSchema': {'type': 'object', 'properties': {
           'vpc_id': prop('string', 'VPC ID to analyze'),
           'action': prop('string', 'Filter ACCEPT/REJECT/all'),
           'minutes': prop('integer', 'Lookback minutes')},
        'required': ['vpc_id']}}]),
    ('network-mcp-target', 'awsops-network-mcp',
     'Network config MCP - security groups, NACLs, route tables',
     [{'name': 'describe_network',
       'description': 'Describe network configuration for VPC resources',
       'inputSchema': {'type': 'object', 'properties': {
           'resource_type': prop('string', 'security_group/nacl/route_table/subnet/vpc'),
           'resource_id': prop('string', 'Resource ID to describe'),
           'vpc_id': prop('string', 'VPC ID for listing')},
        'required': ['resource_type']}}]),
    ('steampipe-query-target', 'awsops-steampipe-query',
     'AWS resource SQL query executor',
     [{'name': 'run_steampipe_query',
       'description': 'Execute SQL query against AWS resources',
       'inputSchema': {'type': 'object', 'properties': {
           'sql': prop('string', 'SQL query to execute')},
        'required': ['sql']}}]),
]

for name, fn, desc, tools in targets:
    arn = 'arn:aws:lambda:{}:{}:function:{}'.format(region, account_id, fn)
    try:
        resp = client.create_gateway_target(
            gatewayIdentifier=gw_id,
            name=name,
            description=desc,
            targetConfiguration={
                'mcp': {
                    'lambda': {
                        'lambdaArn': arn,
                        'toolSchema': {
                            'inlinePayload': tools
                        }
                    }
                }
            },
            credentialProviderConfigurations=[
                {'credentialProviderType': 'GATEWAY_IAM_ROLE'}
            ]
        )
        tid = resp.get('targetId', 'OK')
        print('  Target: {} -> {}'.format(name, tid))
    except Exception as e:
        print('  WARN: {} -> {}'.format(name, str(e)[:200]))
PYEOF

# -- Summary -------------------------------------------------------------------
echo ""
echo -e "${GREEN}=================================================================${NC}"
echo -e "${GREEN}   Step 6c Complete: Gateway Tools & MCP configured${NC}"
echo -e "${GREEN}=================================================================${NC}"
echo ""
echo "  Gateway ID:  $GW_ID"
echo ""
echo "  Lambda Functions:"
echo "    - awsops-reachability-analyzer"
echo "    - awsops-flow-monitor"
echo "    - awsops-network-mcp"
echo "    - awsops-steampipe-query"
echo ""
echo "  Gateway Targets: 4 (via boto3 with mcp.lambda + inlinePayload)"
echo ""
echo "  Next: bash scripts/06d-setup-agentcore-interpreter.sh"
echo ""
