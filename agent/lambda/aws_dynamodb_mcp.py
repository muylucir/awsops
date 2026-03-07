"""AWS DynamoDB MCP Lambda - table management, query, scan, data modeling"""
import json
import boto3


def lambda_handler(event, context):
    params = event if isinstance(event, dict) else json.loads(event)
    t = params.get("tool_name", "")
    args = params.get("arguments", params)
    region = args.get("region", "ap-northeast-2")

    if not t:
        if "table_name" in params and "key" in params: t = "get_item"
        elif "table_name" in params and "query" in str(params).lower(): t = "query_table"
        elif "table_name" in params: t = "describe_table"
        else: t = "list_tables"
        args = params

    try:
        ddb = boto3.client('dynamodb', region_name=region)
        ddb_r = boto3.resource('dynamodb', region_name=region)

        if t == "list_tables":
            tables = ddb.list_tables().get("TableNames", [])
            result = []
            for tn in tables[:20]:
                desc = ddb.describe_table(TableName=tn)["Table"]
                result.append({"name": tn, "status": desc["TableStatus"],
                    "itemCount": desc.get("ItemCount", 0), "sizeBytes": desc.get("TableSizeBytes", 0),
                    "billingMode": desc.get("BillingModeSummary", {}).get("BillingMode", "PROVISIONED")})
            return ok({"tables": result, "count": len(tables)})

        elif t == "describe_table":
            desc = ddb.describe_table(TableName=args["table_name"])["Table"]
            keys = [{"name": k["AttributeName"], "type": k["KeyType"]} for k in desc.get("KeySchema", [])]
            attrs = {a["AttributeName"]: a["AttributeType"] for a in desc.get("AttributeDefinitions", [])}
            gsis = [{"name": g["IndexName"], "keys": [k["AttributeName"] for k in g["KeySchema"]],
                "projection": g["Projection"]["ProjectionType"]}
                for g in desc.get("GlobalSecondaryIndexes", [])]
            return ok({"table": args["table_name"], "status": desc["TableStatus"],
                "keySchema": keys, "attributes": attrs, "gsi": gsis,
                "itemCount": desc.get("ItemCount", 0), "sizeBytes": desc.get("TableSizeBytes", 0),
                "billingMode": desc.get("BillingModeSummary", {}).get("BillingMode", "PROVISIONED"),
                "streamEnabled": desc.get("StreamSpecification", {}).get("StreamEnabled", False)})

        elif t == "query_table":
            table = ddb_r.Table(args["table_name"])
            kwargs = {}
            if args.get("key_condition"):
                from boto3.dynamodb.conditions import Key
                kc = args["key_condition"]
                kwargs["KeyConditionExpression"] = Key(kc["key"]).eq(kc["value"])
            if args.get("index_name"): kwargs["IndexName"] = args["index_name"]
            if args.get("limit"): kwargs["Limit"] = args["limit"]
            resp = table.query(**kwargs) if kwargs.get("KeyConditionExpression") else table.scan(Limit=args.get("limit", 20))
            return ok({"items": resp.get("Items", [])[:50], "count": resp.get("Count", 0), "scannedCount": resp.get("ScannedCount", 0)})

        elif t == "get_item":
            table = ddb_r.Table(args["table_name"])
            resp = table.get_item(Key=args["key"])
            return ok({"item": resp.get("Item"), "found": "Item" in resp})

        elif t == "scan_table":
            table = ddb_r.Table(args["table_name"])
            kwargs = {"Limit": args.get("limit", 20)}
            if args.get("filter_expression"): kwargs["FilterExpression"] = args["filter_expression"]
            resp = table.scan(**kwargs)
            return ok({"items": resp.get("Items", [])[:50], "count": resp.get("Count", 0)})

        elif t == "dynamodb_data_modeling":
            return ok({"guidance": [
                "1. Identify access patterns FIRST (not schema)",
                "2. Design single-table where possible",
                "3. Use composite sort keys for hierarchical data",
                "4. GSI for alternative access patterns",
                "5. Use sparse indexes to reduce costs",
                "6. Avoid scan operations - always use query",
                "7. Use TTL for automatic expiry",
                "8. On-demand billing for unpredictable workloads",
                "9. Provisioned + auto-scaling for steady workloads",
                "10. Use DynamoDB Streams for change data capture"]})

        elif t == "compute_performances_and_costs":
            reads_per_sec = args.get("reads_per_sec", 100)
            writes_per_sec = args.get("writes_per_sec", 50)
            item_size_kb = args.get("item_size_kb", 1)
            storage_gb = args.get("storage_gb", 10)
            rcu = reads_per_sec * max(1, item_size_kb // 4)
            wcu = writes_per_sec * max(1, item_size_kb)
            rcu_cost = rcu * 0.00013 * 730
            wcu_cost = wcu * 0.00065 * 730
            storage_cost = storage_gb * 0.25
            return ok({"rcu": rcu, "wcu": wcu, "monthlyCost": {
                "rcu": round(rcu_cost, 2), "wcu": round(wcu_cost, 2),
                "storage": round(storage_cost, 2), "total": round(rcu_cost + wcu_cost + storage_cost, 2)},
                "note": "Provisioned pricing. On-demand: $1.25/M writes, $0.25/M reads"})

        return err("Unknown tool: " + t)
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}

def ok(body): return {"statusCode": 200, "body": json.dumps(body, default=str)}
def err(msg): return {"statusCode": 400, "body": json.dumps({"error": msg})}
