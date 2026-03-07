"""AWS Valkey/ElastiCache MCP Lambda - cluster management, cache operations"""
import json
import boto3


def lambda_handler(event, context):
    params = event if isinstance(event, dict) else json.loads(event)
    t = params.get("tool_name", "")
    args = params.get("arguments", params)
    region = args.get("region", "ap-northeast-2")

    if not t:
        if "replication_group_id" in params: t = "describe_replication_group"
        elif "cluster_id" in params: t = "describe_cache_cluster"
        elif "serverless" in str(params).lower(): t = "list_serverless_caches"
        else: t = "list_cache_clusters"
        args = params

    try:
        ec = boto3.client('elasticache', region_name=region)

        if t == "list_cache_clusters":
            clusters = ec.describe_cache_clusters(ShowCacheNodeInfo=True).get("CacheClusters", [])
            return ok({"clusters": [{"id": c["CacheClusterId"], "engine": c.get("Engine"),
                "version": c.get("EngineVersion"), "nodeType": c.get("CacheNodeType"),
                "status": c["CacheClusterStatus"], "numNodes": c.get("NumCacheNodes"),
                "az": c.get("PreferredAvailabilityZone"),
                "endpoint": c.get("CacheNodes", [{}])[0].get("Endpoint", {}).get("Address", "") if c.get("CacheNodes") else ""}
                for c in clusters[:20]]})

        elif t == "describe_cache_cluster":
            c = ec.describe_cache_clusters(CacheClusterId=args["cluster_id"], ShowCacheNodeInfo=True)["CacheClusters"][0]
            return ok({"id": c["CacheClusterId"], "engine": c.get("Engine"), "version": c.get("EngineVersion"),
                "nodeType": c.get("CacheNodeType"), "status": c["CacheClusterStatus"],
                "numNodes": c.get("NumCacheNodes"), "az": c.get("PreferredAvailabilityZone"),
                "parameterGroup": c.get("CacheParameterGroup", {}).get("CacheParameterGroupName"),
                "subnetGroup": c.get("CacheSubnetGroupName"),
                "securityGroups": [sg["SecurityGroupId"] for sg in c.get("SecurityGroups", [])],
                "nodes": [{"id": n["CacheNodeId"], "status": n["CacheNodeStatus"],
                    "endpoint": n.get("Endpoint", {}).get("Address", "")}
                    for n in c.get("CacheNodes", [])]})

        elif t == "list_replication_groups":
            groups = ec.describe_replication_groups().get("ReplicationGroups", [])
            return ok({"replicationGroups": [{"id": g["ReplicationGroupId"],
                "description": g.get("Description", ""), "status": g["Status"],
                "nodeType": g.get("CacheNodeType"), "clusterEnabled": g.get("ClusterEnabled"),
                "memberClusters": g.get("MemberClusters", []),
                "endpoint": g.get("ConfigurationEndpoint", {}).get("Address", "") if g.get("ConfigurationEndpoint") else g.get("NodeGroups", [{}])[0].get("PrimaryEndpoint", {}).get("Address", "") if g.get("NodeGroups") else ""}
                for g in groups[:20]]})

        elif t == "describe_replication_group":
            g = ec.describe_replication_groups(ReplicationGroupId=args["replication_group_id"])["ReplicationGroups"][0]
            return ok({"id": g["ReplicationGroupId"], "status": g["Status"],
                "description": g.get("Description"), "nodeType": g.get("CacheNodeType"),
                "clusterEnabled": g.get("ClusterEnabled"), "multiAZ": g.get("MultiAZ"),
                "automaticFailover": g.get("AutomaticFailover"),
                "memberClusters": g.get("MemberClusters", []),
                "nodeGroups": [{"id": ng.get("NodeGroupId"), "status": ng.get("Status"),
                    "primary": ng.get("PrimaryEndpoint", {}).get("Address", ""),
                    "reader": ng.get("ReaderEndpoint", {}).get("Address", "")}
                    for ng in g.get("NodeGroups", [])]})

        elif t == "list_serverless_caches":
            try:
                caches = ec.describe_serverless_caches().get("ServerlessCaches", [])
                return ok({"serverlessCaches": [{"name": c.get("ServerlessCacheName"),
                    "engine": c.get("Engine"), "status": c.get("Status"),
                    "endpoint": c.get("Endpoint", {}).get("Address", "")}
                    for c in caches[:20]]})
            except Exception:
                return ok({"serverlessCaches": [], "note": "Serverless cache API may not be available in this region"})

        elif t == "elasticache_best_practices":
            return ok({"bestPractices": [
                "Use Valkey/Redis cluster mode for horizontal scaling",
                "Enable Multi-AZ with automatic failover",
                "Use r7g instances for memory-optimized workloads",
                "Set appropriate eviction policies (allkeys-lru for cache)",
                "Monitor with CloudWatch: EngineCPUUtilization, DatabaseMemoryUsagePercentage",
                "Use encryption in-transit and at-rest",
                "Reserve nodes for steady workloads (up to 55% savings)"]})

        return err("Unknown tool: " + t)
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}

def ok(body): return {"statusCode": 200, "body": json.dumps(body, default=str)}
def err(msg): return {"statusCode": 400, "body": json.dumps({"error": msg})}
