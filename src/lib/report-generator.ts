// Report data collector stub — provides interfaces for report generation
// PR#13 squash merge에서 누락된 파일 재생성
import { batchQuery, checkCostAvailability } from '@/lib/steampipe';
import { queries as ec2Q } from '@/lib/queries/ec2';
import { queries as s3Q } from '@/lib/queries/s3';
import { queries as rdsQ } from '@/lib/queries/rds';
import { queries as vpcQ } from '@/lib/queries/vpc';
import { queries as iamQ } from '@/lib/queries/iam';
import { queries as ecsQ } from '@/lib/queries/ecs';
import { queries as lambdaQ } from '@/lib/queries/lambda';
import { queries as costQ } from '@/lib/queries/cost';
import { queries as secQ } from '@/lib/queries/security';
import { queries as k8sQ } from '@/lib/queries/k8s';
import { queries as ebsQ } from '@/lib/queries/ebs';
import { queries as mskQ } from '@/lib/queries/msk';
import { queries as osQ } from '@/lib/queries/opensearch';
import { queries as ecacheQ } from '@/lib/queries/elasticache';
import { queries as dynamoQ } from '@/lib/queries/dynamodb';

export interface ReportData {
  [key: string]: any;
  costAvailable: boolean;
  accountId?: string;
}

type LiveSendFn = (event: string, data: any) => void;

export async function collectReportData(
  accountId?: string, liveSend?: LiveSendFn, isEn?: boolean,
): Promise<ReportData> {
  const opts = accountId ? { accountId } : undefined;
  const send = liveSend || (() => {});
  const costResult = await checkCostAvailability(false, accountId);
  send('status', { message: isEn ? 'Collecting data...' : '데이터 수집 중...' });
  const data = await batchQuery({
    ec2Status: ec2Q.statusCount, ec2Types: ec2Q.typeDistribution,
    s3Summary: s3Q.summary, rdsSummary: rdsQ.summary, vpcSummary: vpcQ.summary,
    iamSummary: iamQ.summary, ecsSummary: ecsQ.summary, lambdaSummary: lambdaQ.summary,
    secSummary: secQ.summary, k8sNodes: k8sQ.nodeSummary, k8sPods: k8sQ.podSummary,
    ebsSummary: ebsQ.summary, mskSummary: mskQ.summary, osSummary: osQ.summary,
    ecacheSummary: ecacheQ.summary, dynamoSummary: dynamoQ.summary,
    ...(costResult.available ? { costSummary: costQ.summary, costDetail: costQ.dashboardDetail } : {}),
  }, opts);
  return { ...data, costAvailable: costResult.available, accountId };
}

function fmt(data: any, key: string): string {
  const rows = data?.[key]?.rows;
  if (!rows || rows.length === 0) return 'No data available.';
  return JSON.stringify(rows, null, 2).slice(0, 8000);
}

export async function formatReportForBedrock(data: ReportData, section: string): Promise<string> {
  const m: Record<string, string> = {
    'cost-overview': `# Cost\n${fmt(data,'costSummary')}\n${fmt(data,'costDetail')}`,
    'cost-compute': `# Cost\n${fmt(data,'costSummary')}`, 'cost-network': `# Cost\n${fmt(data,'costSummary')}`,
    'cost-storage': `# Cost\n${fmt(data,'costSummary')}`,
    'idle-resources': `# EC2\n${fmt(data,'ec2Status')}\n# EBS\n${fmt(data,'ebsSummary')}`,
    'security-posture': `# Security\n${fmt(data,'secSummary')}\n# IAM\n${fmt(data,'iamSummary')}`,
    'network-architecture': `# VPC\n${fmt(data,'vpcSummary')}`,
    'compute-analysis': `# EC2\n${fmt(data,'ec2Status')}\n# Lambda\n${fmt(data,'lambdaSummary')}\n# ECS\n${fmt(data,'ecsSummary')}`,
    'eks-analysis': `# K8s\n${fmt(data,'k8sNodes')}\n${fmt(data,'k8sPods')}`,
    'database-analysis': `# RDS\n${fmt(data,'rdsSummary')}\n# DynamoDB\n${fmt(data,'dynamoSummary')}\n# ElastiCache\n${fmt(data,'ecacheSummary')}`,
    'msk-analysis': `# MSK\n${fmt(data,'mskSummary')}`,
    'storage-analysis': `# S3\n${fmt(data,'s3Summary')}\n# EBS\n${fmt(data,'ebsSummary')}\n# OpenSearch\n${fmt(data,'osSummary')}`,
    'executive-summary': `# EC2\n${fmt(data,'ec2Status')}\n# Security\n${fmt(data,'secSummary')}`,
    'recommendations': `# EC2\n${fmt(data,'ec2Status')}\n# Security\n${fmt(data,'secSummary')}`,
    'appendix': `# Inventory\n${fmt(data,'ec2Status')}\n${fmt(data,'s3Summary')}\n${fmt(data,'rdsSummary')}`,
  };
  if (!data.costAvailable && section.startsWith('cost')) return 'Cost Explorer not available.';
  return m[section] || 'No data for this section.';
}
