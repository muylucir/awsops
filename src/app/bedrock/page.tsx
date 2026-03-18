'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import PieChartCard from '@/components/charts/PieChartCard';
import BarChartCard from '@/components/charts/BarChartCard';
import DataTable from '@/components/table/DataTable';
import { Sparkles, Bot, BookOpen, ShieldCheck, X, Settings, Cpu } from 'lucide-react';
import { queries as brQ } from '@/lib/queries/bedrock';

type TabKey = 'foundation' | 'custom' | 'provisioned' | 'agents' | 'knowledgebases' | 'guardrails';

interface PageData {
  [key: string]: { rows: Record<string, unknown>[]; error?: string };
}

export default function BedrockPage() {
  const [data, setData] = useState<PageData>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('foundation');
  const [selected, setSelected] = useState<any>(null);

  const fetchData = useCallback(async (bustCache = false) => {
    setLoading(true);
    try {
      const res = await fetch(bustCache ? '/awsops/api/steampipe?bustCache=true' : '/awsops/api/steampipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queries: {
            foundationSummary: brQ.foundationSummary,
            providerDistribution: brQ.providerDistribution,
            modalityDistribution: brQ.modalityDistribution,
            foundationList: brQ.foundationList,
            customModels: brQ.customModels,
            provisionedThroughput: brQ.provisionedThroughput,
            agents: brQ.agents,
            knowledgeBases: brQ.knowledgeBases,
            guardrails: brQ.guardrails,
            loggingConfig: brQ.loggingConfig,
          },
        }),
      });
      setData(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const get = (key: string) => data[key]?.rows || [];
  const getFirst = (key: string) => get(key)[0] || {};

  const summary = getFirst('foundationSummary') as Record<string, unknown>;
  const providerData = get('providerDistribution').map((r: any) => ({ name: String(r.name), value: Number(r.value) || 0 }));
  const modalityData = get('modalityDistribution').map((r: any) => ({ name: String(r.name), value: Number(r.value) || 0 }));
  const foundationList = get('foundationList');
  const customModels = get('customModels');
  const provisionedThroughput = get('provisionedThroughput');
  const agents = get('agents');
  const knowledgeBases = get('knowledgeBases');
  const guardrails = get('guardrails');
  const loggingConfig = get('loggingConfig');

  const totalModels = Number(summary?.total_models) || 0;
  const totalProviders = Number(summary?.total_providers) || 0;
  const onDemandCount = Number(summary?.on_demand_count) || 0;
  const provisionedCount = Number(summary?.provisioned_count) || 0;

  // Logging enabled check / 로깅 활성화 여부
  const loggingEnabled = loggingConfig.length > 0 && loggingConfig.some((r: any) => {
    try {
      const config = JSON.parse(r.logging_config || '{}');
      return config.textDataDeliveryEnabled || config.imageDataDeliveryEnabled || config.embeddingDataDeliveryEnabled;
    } catch { return false; }
  });

  // Parse JSON array display / JSON 배열 파싱 표시
  const parseJsonArray = (val: any) => {
    if (!val) return '--';
    try {
      const arr = JSON.parse(val);
      return Array.isArray(arr) ? arr.join(', ') : val;
    } catch { return String(val); }
  };

  const statusColor = (status: string) => {
    const s = String(status).toUpperCase();
    if (s === 'ACTIVE' || s === 'READY' || s === 'PREPARED') return 'text-accent-green';
    if (s === 'CREATING' || s === 'UPDATING' || s === 'IN_PROGRESS') return 'text-accent-orange';
    if (s === 'FAILED' || s === 'DELETING') return 'text-accent-red';
    return 'text-gray-400';
  };

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'foundation', label: `Foundation (${foundationList.length})`, icon: Sparkles },
    { key: 'custom', label: `Custom (${customModels.length})`, icon: Settings },
    { key: 'provisioned', label: `Provisioned (${provisionedThroughput.length})`, icon: Cpu },
    { key: 'agents', label: `Agents (${agents.length})`, icon: Bot },
    { key: 'knowledgebases', label: `Knowledge Bases (${knowledgeBases.length})`, icon: BookOpen },
    { key: 'guardrails', label: `Guardrails (${guardrails.length})`, icon: ShieldCheck },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <Header title="Bedrock Monitoring" subtitle="Foundation Models, Agents, Knowledge Bases, Guardrails" onRefresh={() => fetchData(true)} />

      {loading && (
        <div className="w-full h-1 bg-navy-700 rounded-full overflow-hidden">
          <div className="h-full bg-accent-cyan rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      )}

      {/* Stats Cards / 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatsCard label="Foundation Models" value={totalModels} icon={Sparkles} color="cyan" />
        <StatsCard label="Providers" value={totalProviders} icon={Sparkles} color="purple" />
        <StatsCard label="On-Demand" value={onDemandCount} icon={Sparkles} color="green" />
        <StatsCard label="Provisioned" value={provisionedThroughput.length} icon={Cpu} color="orange"
          change={provisionedCount > 0 ? `${provisionedCount} models support provisioned` : undefined} />
        <StatsCard label="Agents" value={agents.length} icon={Bot} color="cyan" />
        <StatsCard label="Knowledge Bases" value={knowledgeBases.length} icon={BookOpen} color="purple" />
        <StatsCard label="Guardrails" value={guardrails.length} icon={ShieldCheck} color="green"
          change={loggingEnabled ? 'Logging ON' : 'Logging OFF'} />
      </div>

      {/* Charts / 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PieChartCard title="Models by Provider / 프로바이더별 모델" data={providerData.slice(0, 10)} />
        <BarChartCard title="Output Modalities / 출력 모달리티" data={modalityData} color="#a855f7" />
      </div>

      {/* Tabs / 탭 */}
      <div className="flex gap-1 bg-navy-800 rounded-lg border border-navy-600 p-1 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-gray-400 hover:text-white hover:bg-navy-700'
            }`}>
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      {/* Foundation Models Tab / 파운데이션 모델 탭 */}
      {activeTab === 'foundation' && (
        <DataTable
          columns={[
            { key: 'model_id', label: 'Model ID', render: (v: string) => (
              <span className="font-mono text-xs">{v}</span>
            )},
            { key: 'model_name', label: 'Model Name' },
            { key: 'provider_name', label: 'Provider', render: (v: string) => (
              <span className="text-accent-cyan">{v}</span>
            )},
            { key: 'input_modalities', label: 'Input', render: (v: string) => parseJsonArray(v) },
            { key: 'output_modalities', label: 'Output', render: (v: string) => parseJsonArray(v) },
            { key: 'inference_types', label: 'Inference', render: (v: string) => parseJsonArray(v) },
            { key: 'streaming', label: 'Stream', render: (v: any) => (
              <span className={v ? 'text-accent-green' : 'text-gray-600'}>{v ? 'Yes' : 'No'}</span>
            )},
            { key: 'status', label: 'Status', render: (v: string) => (
              <span className={statusColor(v)}>{v || 'ACTIVE'}</span>
            )},
          ]}
          data={loading && !foundationList.length ? undefined : foundationList}
          onRowClick={(row) => setSelected({ ...row, type: 'foundation' })}
        />
      )}

      {/* Custom Models Tab / 커스텀 모델 탭 */}
      {activeTab === 'custom' && (
        customModels.length > 0 ? (
          <DataTable
            columns={[
              { key: 'model_name', label: 'Model Name' },
              { key: 'base_model_identifier', label: 'Base Model', render: (v: string) => (
                <span className="font-mono text-xs">{v}</span>
              )},
              { key: 'customization_type', label: 'Type' },
              { key: 'creation_time', label: 'Created', render: (v: string) => v ? new Date(v).toLocaleDateString() : '--' },
              { key: 'region', label: 'Region' },
            ]}
            data={customModels}
            onRowClick={(row) => setSelected({ ...row, type: 'custom' })}
          />
        ) : (
          <EmptyState icon={Settings} message="No custom models found" detail="Fine-tuned or custom models will appear here." />
        )
      )}

      {/* Provisioned Throughput Tab / 프로비저닝된 처리량 탭 */}
      {activeTab === 'provisioned' && (
        provisionedThroughput.length > 0 ? (
          <DataTable
            columns={[
              { key: 'provisioned_model_name', label: 'Name' },
              { key: 'desired_model_units', label: 'Model Units' },
              { key: 'commitment_duration', label: 'Commitment' },
              { key: 'status', label: 'Status', render: (v: string) => (
                <span className={statusColor(v)}>{v}</span>
              )},
              { key: 'creation_time', label: 'Created', render: (v: string) => v ? new Date(v).toLocaleDateString() : '--' },
              { key: 'region', label: 'Region' },
            ]}
            data={provisionedThroughput}
            onRowClick={(row) => setSelected({ ...row, type: 'provisioned' })}
          />
        ) : (
          <EmptyState icon={Cpu} message="No provisioned throughput" detail="Provisioned model throughput configurations will appear here." />
        )
      )}

      {/* Agents Tab / 에이전트 탭 */}
      {activeTab === 'agents' && (
        agents.length > 0 ? (
          <DataTable
            columns={[
              { key: 'agent_name', label: 'Agent Name' },
              { key: 'agent_id', label: 'Agent ID', render: (v: string) => (
                <span className="font-mono text-xs">{v}</span>
              )},
              { key: 'agent_status', label: 'Status', render: (v: string) => (
                <span className={statusColor(v)}>{v}</span>
              )},
              { key: 'foundation_model', label: 'Foundation Model', render: (v: string) => (
                <span className="font-mono text-xs">{v}</span>
              )},
              { key: 'description', label: 'Description', render: (v: string) => (
                <span className="truncate max-w-[200px] inline-block" title={v}>{v || '--'}</span>
              )},
              { key: 'updated_at', label: 'Updated', render: (v: string) => v ? new Date(v).toLocaleDateString() : '--' },
              { key: 'region', label: 'Region' },
            ]}
            data={agents}
            onRowClick={(row) => setSelected({ ...row, type: 'agent' })}
          />
        ) : (
          <EmptyState icon={Bot} message="No Bedrock Agents found" detail="Bedrock Agents will appear here when created." />
        )
      )}

      {/* Knowledge Bases Tab / 지식 베이스 탭 */}
      {activeTab === 'knowledgebases' && (
        knowledgeBases.length > 0 ? (
          <DataTable
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'knowledge_base_id', label: 'KB ID', render: (v: string) => (
                <span className="font-mono text-xs">{v}</span>
              )},
              { key: 'status', label: 'Status', render: (v: string) => (
                <span className={statusColor(v)}>{v}</span>
              )},
              { key: 'description', label: 'Description', render: (v: string) => (
                <span className="truncate max-w-[200px] inline-block" title={v}>{v || '--'}</span>
              )},
              { key: 'updated_at', label: 'Updated', render: (v: string) => v ? new Date(v).toLocaleDateString() : '--' },
              { key: 'region', label: 'Region' },
            ]}
            data={knowledgeBases}
            onRowClick={(row) => setSelected({ ...row, type: 'kb' })}
          />
        ) : (
          <EmptyState icon={BookOpen} message="No Knowledge Bases found" detail="Bedrock Knowledge Bases will appear here when created." />
        )
      )}

      {/* Guardrails Tab / 가드레일 탭 */}
      {activeTab === 'guardrails' && (
        guardrails.length > 0 ? (
          <DataTable
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'guardrail_id', label: 'Guardrail ID', render: (v: string) => (
                <span className="font-mono text-xs">{v}</span>
              )},
              { key: 'status', label: 'Status', render: (v: string) => (
                <span className={statusColor(v)}>{v}</span>
              )},
              { key: 'version', label: 'Version' },
              { key: 'description', label: 'Description', render: (v: string) => (
                <span className="truncate max-w-[200px] inline-block" title={v}>{v || '--'}</span>
              )},
              { key: 'updated_at', label: 'Updated', render: (v: string) => v ? new Date(v).toLocaleDateString() : '--' },
              { key: 'region', label: 'Region' },
            ]}
            data={guardrails}
            onRowClick={(row) => setSelected({ ...row, type: 'guardrail' })}
          />
        ) : (
          <EmptyState icon={ShieldCheck} message="No Guardrails found" detail="Bedrock Guardrails will appear here when created." />
        )
      )}

      {/* Detail Panel / 상세 패널 */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full max-w-2xl h-full bg-navy-800 border-l border-navy-600 overflow-y-auto shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-navy-800 border-b border-navy-600 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-white font-mono">
                  {selected.model_name || selected.agent_name || selected.provisioned_model_name || selected.name || 'Detail'}
                </h2>
                <p className="text-sm text-gray-400">
                  {selected.type === 'foundation' && selected.provider_name}
                  {selected.type === 'custom' && `Custom Model · ${selected.customization_type}`}
                  {selected.type === 'provisioned' && `Provisioned · ${selected.desired_model_units} units`}
                  {selected.type === 'agent' && `Agent · ${selected.agent_status}`}
                  {selected.type === 'kb' && `Knowledge Base · ${selected.status}`}
                  {selected.type === 'guardrail' && `Guardrail · v${selected.version}`}
                </p>
              </div>
              <button onClick={() => setSelected(null)}
                className="p-2 rounded-lg hover:bg-navy-700 text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Foundation Model Detail / 파운데이션 모델 상세 */}
              {selected.type === 'foundation' && (
                <Section title="Foundation Model" icon={Sparkles}>
                  <Row label="Model ID" value={selected.model_id} />
                  <Row label="Model Name" value={selected.model_name} />
                  <Row label="Provider" value={selected.provider_name} />
                  <Row label="Input Modalities" value={parseJsonArray(selected.input_modalities)} />
                  <Row label="Output Modalities" value={parseJsonArray(selected.output_modalities)} />
                  <Row label="Inference Types" value={parseJsonArray(selected.inference_types)} />
                  <Row label="Streaming" value={selected.streaming ? 'Supported' : 'Not supported'} />
                  <Row label="Status" value={selected.status || 'ACTIVE'} />
                </Section>
              )}

              {/* Custom Model Detail / 커스텀 모델 상세 */}
              {selected.type === 'custom' && (
                <Section title="Custom Model" icon={Settings}>
                  <Row label="Model Name" value={selected.model_name} />
                  <Row label="ARN" value={selected.model_arn} />
                  <Row label="Base Model" value={selected.base_model_identifier} />
                  <Row label="Customization" value={selected.customization_type} />
                  <Row label="Created" value={selected.creation_time ? new Date(selected.creation_time).toLocaleString() : '--'} />
                  <Row label="Region" value={selected.region} />
                </Section>
              )}

              {/* Provisioned Throughput Detail / 프로비저닝 상세 */}
              {selected.type === 'provisioned' && (
                <Section title="Provisioned Throughput" icon={Cpu}>
                  <Row label="Name" value={selected.provisioned_model_name} />
                  <Row label="ARN" value={selected.provisioned_model_arn} />
                  <Row label="Model ARN" value={selected.model_arn} />
                  <Row label="Model Units" value={selected.desired_model_units} />
                  <Row label="Commitment" value={selected.commitment_duration || 'No commitment'} />
                  <Row label="Status" value={selected.status} />
                  <Row label="Created" value={selected.creation_time ? new Date(selected.creation_time).toLocaleString() : '--'} />
                  <Row label="Last Modified" value={selected.last_modified_time ? new Date(selected.last_modified_time).toLocaleString() : '--'} />
                  <Row label="Region" value={selected.region} />
                </Section>
              )}

              {/* Agent Detail / 에이전트 상세 */}
              {selected.type === 'agent' && (
                <Section title="Agent" icon={Bot}>
                  <Row label="Name" value={selected.agent_name} />
                  <Row label="Agent ID" value={selected.agent_id} />
                  <Row label="Status" value={selected.agent_status} />
                  <Row label="Foundation Model" value={selected.foundation_model} />
                  <Row label="Description" value={selected.description} />
                  <Row label="Prepared At" value={selected.prepared_at ? new Date(selected.prepared_at).toLocaleString() : '--'} />
                  <Row label="Updated At" value={selected.updated_at ? new Date(selected.updated_at).toLocaleString() : '--'} />
                  <Row label="Region" value={selected.region} />
                </Section>
              )}

              {/* Knowledge Base Detail / 지식 베이스 상세 */}
              {selected.type === 'kb' && (
                <Section title="Knowledge Base" icon={BookOpen}>
                  <Row label="Name" value={selected.name} />
                  <Row label="KB ID" value={selected.knowledge_base_id} />
                  <Row label="Status" value={selected.status} />
                  <Row label="Description" value={selected.description} />
                  <Row label="Updated At" value={selected.updated_at ? new Date(selected.updated_at).toLocaleString() : '--'} />
                  <Row label="Region" value={selected.region} />
                </Section>
              )}

              {/* Guardrail Detail / 가드레일 상세 */}
              {selected.type === 'guardrail' && (
                <Section title="Guardrail" icon={ShieldCheck}>
                  <Row label="Name" value={selected.name} />
                  <Row label="Guardrail ID" value={selected.guardrail_id} />
                  <Row label="Status" value={selected.status} />
                  <Row label="Version" value={selected.version} />
                  <Row label="Description" value={selected.description} />
                  <Row label="Created At" value={selected.created_at ? new Date(selected.created_at).toLocaleString() : '--'} />
                  <Row label="Updated At" value={selected.updated_at ? new Date(selected.updated_at).toLocaleString() : '--'} />
                  <Row label="Region" value={selected.region} />
                </Section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-navy-900 rounded-lg border border-navy-600 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-accent-cyan" />
        <h3 className="text-xs font-mono uppercase text-accent-cyan tracking-wider">{title}</h3>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-gray-500 min-w-[130px] shrink-0">{label}</span>
      <span className="text-gray-200 font-mono text-xs break-all">{value ?? '--'}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, message, detail }: { icon: any; message: string; detail: string }) {
  return (
    <div className="text-center py-10 text-gray-500">
      <Icon size={40} className="mx-auto mb-3 text-gray-600" />
      <p>{message}</p>
      <p className="text-xs mt-1">{detail}</p>
    </div>
  );
}
