// Report section definitions for AI diagnosis
export interface ReportSectionDef {
  section: string; title: string; titleKo: string; systemPrompt: string;
}
export const REPORT_SECTIONS: ReportSectionDef[] = [
  { section: 'executive-summary', title: 'Executive Summary', titleKo: '경영진 요약', systemPrompt: 'You are a senior AWS cloud architect. Summarize key findings, risks, and top 3 recommendations.' },
  { section: 'cost-overview', title: 'Cost Overview', titleKo: '비용 개요', systemPrompt: 'Analyze cost data: total spend, top services, trends, anomalies.' },
  { section: 'cost-compute', title: 'Compute Cost', titleKo: '컴퓨팅 비용', systemPrompt: 'Analyze EC2, Lambda, ECS costs. Identify rightsizing opportunities.' },
  { section: 'cost-network', title: 'Network Cost', titleKo: '네트워크 비용', systemPrompt: 'Analyze network costs: data transfer, NAT, VPN, CloudFront.' },
  { section: 'cost-storage', title: 'Storage Cost', titleKo: '스토리지 비용', systemPrompt: 'Analyze S3, EBS storage costs. Identify lifecycle optimization.' },
  { section: 'idle-resources', title: 'Idle Resources', titleKo: '유휴 리소스', systemPrompt: 'Identify idle resources: stopped EC2, unattached EBS, unused EIPs.' },
  { section: 'security-posture', title: 'Security Posture', titleKo: '보안 현황', systemPrompt: 'Assess security: public S3, open SGs, unencrypted resources, IAM.' },
  { section: 'network-architecture', title: 'Network Architecture', titleKo: '네트워크 아키텍처', systemPrompt: 'Analyze VPC architecture, routing, NAT/IGW, security groups.' },
  { section: 'compute-analysis', title: 'Compute Analysis', titleKo: '컴퓨팅 분석', systemPrompt: 'Analyze EC2 types, Lambda config, ECS services. Recommend Graviton.' },
  { section: 'eks-analysis', title: 'EKS Analysis', titleKo: 'EKS 분석', systemPrompt: 'Analyze EKS clusters, nodes, pods, resource requests vs limits.' },
  { section: 'database-analysis', title: 'Database Analysis', titleKo: 'DB 분석', systemPrompt: 'Analyze RDS, DynamoDB, ElastiCache. Recommend optimization.' },
  { section: 'msk-analysis', title: 'MSK Analysis', titleKo: 'MSK 분석', systemPrompt: 'Analyze MSK Kafka clusters, broker config, monitoring.' },
  { section: 'storage-analysis', title: 'Storage Analysis', titleKo: '스토리지 분석', systemPrompt: 'Analyze S3, EBS, OpenSearch storage and optimization.' },
  { section: 'recommendations', title: 'Recommendations', titleKo: '권장 사항', systemPrompt: 'Provide prioritized action plan: immediate (0-30d), short (1-3m), long (3-6m).' },
  { section: 'appendix', title: 'Appendix', titleKo: '부록', systemPrompt: '' },
];
