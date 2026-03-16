'use client';
// EKS Container Cost Dashboard / EKS 컨테이너 비용 대시보드
// Request-based cost estimation: Pod resource requests + EC2 node pricing
// 리소스 요청 기반 비용 추정: Pod 리소스 요청 + EC2 노드 가격

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import DataTable from '@/components/table/DataTable';
import { DollarSign, Box, Server, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PodCost {
  pod_name: string;
  namespace: string;
  node_name: string;
  instance_type: string;
  cpu_request_vcpu: number;
  memory_request_mb: number;
  cpuCostDaily: number;
  memCostDaily: number;
  totalCostDaily: number;
  containers: { name: string; cpu_request: string; memory_request: string }[];
}

interface NodeCost {
  node_name: string;
  instance_type: string;
  hourlyRate: number;
  dailyCost: number;
  pod_count: number;
}

interface EksCostData {
  summary: {
    totalPodCostDaily: number;
    totalPodCostMonthly: number;
    totalNodeCostDaily: number;
    totalNodeCostMonthly: number;
    podCount: number;
    nodeCount: number;
    namespaceCount: number;
    topNamespace: { name: string; cost: number } | null;
  };
  pods: PodCost[];
  nodes: NodeCost[];
  namespaceCosts: { name: string; cost: number }[];
  opencostEnabled: boolean;
}

const CHART_COLORS = ['#00d4ff', '#00ff88', '#a855f7', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6', '#f97316'];

export default function EksContainerCostPage() {
  const [data, setData] = useState<EksCostData | null>(null);
  const [_loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBasis, setShowBasis] = useState(false);
  const [activeTab, setActiveTab] = useState<'pods' | 'nodes'>('pods');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/awsops/api/eks-container-cost');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;
  const formatCostLg = (cost: number) => `$${cost.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <Header
        title="EKS Container Cost"
        subtitle="Pod cost estimation based on resource requests and EC2 node pricing"
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {data?.opencostEnabled && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">
          OpenCost is configured. For more accurate cost data (Network, Storage, GPU), use the OpenCost integration.
        </div>
      )}

      {/* StatsCards / 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          label="Pod Cost (Daily)"
          value={data ? formatCostLg(data.summary.totalPodCostDaily) : '-'}
          icon={DollarSign}
          color="cyan"
        />
        <StatsCard
          label="Pod Cost (Monthly)"
          value={data ? formatCostLg(data.summary.totalPodCostMonthly) : '-'}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          label="Running Pods"
          value={data ? `${data.summary.podCount} pods / ${data.summary.nodeCount} nodes` : '-'}
          icon={Box}
          color="purple"
        />
        <StatsCard
          label="Top Namespace"
          value={data?.summary.topNamespace ? `${data.summary.topNamespace.name} (${formatCost(data.summary.topNamespace.cost)}/day)` : '-'}
          icon={Server}
          color="orange"
        />
      </div>

      {/* Charts / 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Namespace Cost Distribution / 네임스페이스별 비용 분포 */}
        <div className="bg-navy-800 rounded-lg p-4 border border-navy-600">
          <h3 className="text-white font-medium mb-4">Namespace Cost Distribution (Daily)</h3>
          {data && data.namespaceCosts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.namespaceCosts.map(s => ({ name: s.name, value: s.cost }))}
                  cx="50%" cy="50%" outerRadius={100}
                  dataKey="value" nameKey="name"
                  label={({ name, value }) => `${name}: $${value.toFixed(3)}`}
                >
                  {data.namespaceCosts.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f1629', border: '1px solid #1a2540', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">No pods running</div>
          )}
        </div>

        {/* Node Cost Bar Chart / 노드별 비용 바 차트 */}
        <div className="bg-navy-800 rounded-lg p-4 border border-navy-600">
          <h3 className="text-white font-medium mb-4">Node Daily Cost + Pod Count</h3>
          {data && data.nodes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.nodes.map(n => ({
                name: n.node_name.split('.')[0],
                'Daily Cost': n.dailyCost,
                'Pod Count': n.pod_count,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1629', border: '1px solid #1a2540', borderRadius: '8px' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="Daily Cost" fill="#00d4ff" />
                <Bar yAxisId="right" dataKey="Pod Count" fill="#a855f7" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">No node data</div>
          )}
        </div>
      </div>

      {/* Tab: Pods / Nodes */}
      <div className="bg-navy-800 rounded-lg p-4 border border-navy-600">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setActiveTab('pods')}
            className={`px-3 py-1.5 rounded text-sm font-medium ${activeTab === 'pods' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
          >
            Pods ({data?.summary.podCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('nodes')}
            className={`px-3 py-1.5 rounded text-sm font-medium ${activeTab === 'nodes' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'}`}
          >
            Nodes ({data?.summary.nodeCount || 0})
          </button>
          <span className="ml-auto text-xs text-gray-400">
            Cost = Pod resource request ratio x EC2 node cost (50% CPU + 50% Memory)
          </span>
        </div>

        {activeTab === 'pods' ? (
          <DataTable
            columns={[
              { key: 'namespace', label: 'Namespace', render: (v: string) => <span className="text-cyan-400">{v}</span> },
              { key: 'pod_name', label: 'Pod', render: (v: string) => <span className="font-mono text-xs">{v}</span> },
              { key: 'node_name', label: 'Node', render: (v: string) => <span className="text-xs">{v?.split('.')[0]}</span> },
              { key: 'instance_type', label: 'Instance', render: (v: string) => <span className="text-xs text-gray-400">{v}</span> },
              { key: 'cpu_request_vcpu', label: 'CPU Req (vCPU)', render: (v: number) => <span>{v?.toFixed(3)}</span> },
              { key: 'memory_request_mb', label: 'Mem Req (MB)', render: (v: number) => <span>{v}</span> },
              {
                key: 'totalCostDaily', label: 'Daily Cost',
                render: (v: number) => <span className="text-green-400 font-medium">{formatCost(v)}</span>,
              },
            ]}
            data={data?.pods}
          />
        ) : (
          <DataTable
            columns={[
              { key: 'node_name', label: 'Node', render: (v: string) => <span className="font-mono text-xs">{v?.split('.')[0]}</span> },
              { key: 'instance_type', label: 'Instance Type', render: (v: string) => <span className="text-cyan-400">{v}</span> },
              { key: 'hourlyRate', label: 'Hourly Rate', render: (v: number) => <span className="text-green-400">${v?.toFixed(4)}</span> },
              { key: 'dailyCost', label: 'Daily Cost', render: (v: number) => <span className="text-green-400 font-medium">${v?.toFixed(2)}</span> },
              { key: 'pod_count', label: 'Pods' },
            ]}
            data={data?.nodes}
          />
        )}
      </div>

      {/* Cost Calculation Basis / 비용 계산 근거 */}
      <div className="bg-navy-800 rounded-lg p-4 border border-navy-600">
        <button
          onClick={() => setShowBasis(!showBasis)}
          className="flex items-center gap-2 text-white font-medium w-full text-left"
        >
          <span className={`transition-transform ${showBasis ? 'rotate-90' : ''}`}>▶</span>
          Cost Calculation Basis / 비용 계산 근거
        </button>
        {showBasis && (
          <div className="mt-4 space-y-4 text-sm text-gray-300">
            <div>
              <h4 className="text-cyan-400 font-medium mb-2">Method / 계산 방식</h4>
              <p className="text-gray-400">
                Request-based cost allocation: Each pod&apos;s cost is proportional to its CPU/Memory requests
                relative to the node&apos;s allocatable resources. Node cost is split 50% by CPU ratio and 50% by Memory ratio.
              </p>
              <p className="text-gray-400 mt-1">
                리소스 요청 기반 비용 분배: 각 Pod의 비용은 노드의 할당 가능 리소스 대비 CPU/Memory 요청 비율에 비례합니다.
                노드 비용은 CPU 비율 50% + Memory 비율 50%로 분배됩니다.
              </p>
            </div>

            <div>
              <h4 className="text-cyan-400 font-medium mb-2">Formula / 공식</h4>
              <div className="bg-navy-900 rounded p-3 font-mono text-xs space-y-1">
                <p><span className="text-purple-400">CPU Ratio</span> = Pod CPU Request / Node Allocatable CPU</p>
                <p><span className="text-purple-400">Memory Ratio</span> = Pod Memory Request / Node Allocatable Memory</p>
                <p><span className="text-yellow-400">Pod Daily Cost</span> = (CPU Ratio x 0.5 + Memory Ratio x 0.5) x Node Hourly Rate x 24h</p>
              </div>
            </div>

            <div>
              <h4 className="text-cyan-400 font-medium mb-2">Example / 예시</h4>
              <div className="bg-navy-900 rounded p-3 text-xs space-y-1">
                <p className="text-gray-400">Pod: 0.5 vCPU request, 512 MB memory request</p>
                <p className="text-gray-400">Node: m5.xlarge (4 vCPU, 16 GB allocatable), $0.236/hr</p>
                <p>CPU Ratio: 0.5 / 4 = 0.125</p>
                <p>Memory Ratio: 512 / 16384 = 0.03125</p>
                <p>Daily Cost: (0.125 x 0.5 + 0.03125 x 0.5) x $0.236 x 24 = <span className="text-yellow-400 font-medium">$0.442/day</span></p>
              </div>
            </div>

            <div>
              <h4 className="text-cyan-400 font-medium mb-2">EC2 Pricing (ap-northeast-2, on-demand) / EC2 가격</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {[
                  ['m5.large', '$0.118'], ['m5.xlarge', '$0.236'], ['m6g.large', '$0.100'], ['c5.xlarge', '$0.196'],
                  ['r5.large', '$0.152'], ['t3.large', '$0.104'], ['t4g.large', '$0.086'], ['c6g.xlarge', '$0.166'],
                ].map(([type, price]) => (
                  <div key={type} className="bg-navy-700 rounded px-2 py-1">
                    <span className="text-cyan-400">{type}</span>: <span className="text-green-400">{price}</span>/hr
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-cyan-400 font-medium mb-2">Limitations / 제한 사항</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Based on resource <strong>requests</strong>, not actual usage (리소스 <strong>요청</strong> 기준, 실제 사용량 아님)</li>
                <li>Pods without resource requests show $0.00 (리소스 요청이 없는 Pod는 $0.00)</li>
                <li>Network, Storage, GPU costs not included (네트워크, 스토리지, GPU 비용 미포함)</li>
                <li>For actual usage-based cost, install OpenCost (<code className="text-cyan-400">scripts/06f-setup-opencost.sh</code>)</li>
                <li>EC2 on-demand pricing used — Spot/RI not reflected (온디맨드 가격 사용 — Spot/RI 미반영)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
