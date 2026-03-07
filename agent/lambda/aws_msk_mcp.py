"""AWS MSK MCP Lambda - Kafka cluster management, configuration, monitoring"""
import json
import boto3


def lambda_handler(event, context):
    params = event if isinstance(event, dict) else json.loads(event)
    t = params.get("tool_name", "")
    args = params.get("arguments", params)
    region = args.get("region", "ap-northeast-2")

    if not t:
        if "cluster_arn" in params and "configuration" in str(params).lower(): t = "get_configuration_info"
        elif "cluster_arn" in params: t = "get_cluster_info"
        else: t = "list_clusters"
        args = params

    try:
        kafka = boto3.client('kafka', region_name=region)

        if t == "list_clusters":
            resp = kafka.list_clusters_v2()
            clusters = []
            for c in resp.get("ClusterInfoList", [])[:20]:
                info = c.get("Provisioned", c.get("Serverless", {}))
                clusters.append({"name": c.get("ClusterName"), "arn": c.get("ClusterArn"),
                    "state": c.get("State"), "type": c.get("ClusterType"),
                    "version": info.get("CurrentBrokerSoftwareInfo", {}).get("KafkaVersion", ""),
                    "brokerCount": info.get("NumberOfBrokerNodes", 0)})
            return ok({"clusters": clusters, "count": len(clusters)})

        elif t == "get_cluster_info":
            arn = args["cluster_arn"]
            c = kafka.describe_cluster_v2(ClusterArn=arn)["ClusterInfo"]
            info = c.get("Provisioned", {})
            broker_info = info.get("BrokerNodeGroupInfo", {})
            return ok({"name": c.get("ClusterName"), "arn": arn, "state": c.get("State"),
                "type": c.get("ClusterType"), "version": info.get("CurrentBrokerSoftwareInfo", {}).get("KafkaVersion"),
                "brokerCount": info.get("NumberOfBrokerNodes"),
                "brokerType": broker_info.get("InstanceType"),
                "storagePerBroker": broker_info.get("StorageInfo", {}).get("EbsStorageInfo", {}).get("VolumeSize"),
                "subnets": broker_info.get("ClientSubnets", []),
                "securityGroups": broker_info.get("SecurityGroups", []),
                "zookeeperEndpoints": c.get("ZookeeperConnectString", ""),
                "bootstrapBrokers": get_bootstrap(kafka, arn)})

        elif t == "get_configuration_info":
            arn = args.get("configuration_arn", "")
            if arn:
                resp = kafka.describe_configuration(Arn=arn)
                return ok({"name": resp.get("Name"), "arn": arn, "state": resp.get("State"),
                    "latestRevision": resp.get("LatestRevision", {}).get("Revision"),
                    "description": resp.get("Description", "")})
            configs = kafka.list_configurations().get("Configurations", [])
            return ok({"configurations": [{"name": c.get("Name"), "arn": c.get("Arn"),
                "state": c.get("State")} for c in configs[:20]]})

        elif t == "get_bootstrap_brokers":
            return ok({"bootstrapBrokers": get_bootstrap(kafka, args["cluster_arn"])})

        elif t == "list_nodes":
            arn = args["cluster_arn"]
            nodes = kafka.list_nodes(ClusterArn=arn).get("NodeInfoList", [])
            return ok({"nodes": [{"nodeType": n.get("NodeType"), "nodeARN": n.get("NodeARN"),
                "instanceType": n.get("InstanceType"),
                "brokerId": n.get("BrokerNodeInfo", {}).get("BrokerId"),
                "endpoints": n.get("BrokerNodeInfo", {}).get("Endpoints", [])}
                for n in nodes[:30]]})

        elif t == "msk_best_practices":
            return ok({"bestPractices": [
                "Use m7g.xlarge+ for production brokers",
                "3+ brokers across 3 AZs for HA",
                "Enable encryption in-transit (TLS) and at-rest",
                "Use IAM authentication over SASL/SCRAM when possible",
                "Monitor: UnderReplicatedPartitions, ActiveControllerCount, OfflinePartitionsCount",
                "Set retention.ms based on consumer lag patterns",
                "Use tiered storage for cost optimization on large topics",
                "Enable MSK Connect for managed Kafka connectors"]})

        return err("Unknown tool: " + t)
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}


def get_bootstrap(kafka, arn):
    try:
        resp = kafka.get_bootstrap_brokers(ClusterArn=arn)
        return resp.get("BootstrapBrokerStringTls", resp.get("BootstrapBrokerString", ""))
    except: return ""

def ok(body): return {"statusCode": 200, "body": json.dumps(body, default=str)}
def err(msg): return {"statusCode": 400, "body": json.dumps({"error": msg})}
