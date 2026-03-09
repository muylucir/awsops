"""VPC Flow Log Monitor Lambda / VPC 흐름 로그 모니터링 Lambda"""
# VPC 흐름 로그 조회 및 분석 / Query and analyze VPC flow logs
import boto3, json

def lambda_handler(event, context):
    # 파라미터 추출 / Extract parameters
    ec2 = boto3.client('ec2')
    params = event if isinstance(event, dict) else json.loads(event)
    vpc_id = params['vpc_id']

    # 흐름 로그 조회 / Query flow logs
    resp = ec2.describe_flow_logs(Filters=[{'Name': 'resource-id', 'Values': [vpc_id]}])
    flow_logs = [{'FlowLogId': fl.get('FlowLogId'), 'ResourceId': fl.get('ResourceId'),
        'TrafficType': fl.get('TrafficType'), 'LogStatus': fl.get('LogStatus'),
        'LogDestination': fl.get('LogDestination')} for fl in resp.get('FlowLogs', [])]

    return {'statusCode': 200, 'body': json.dumps({
        'vpcId': vpc_id, 'flowLogs': flow_logs, 'count': len(flow_logs)})}
