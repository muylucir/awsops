'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import { Activity, Cpu, Wifi, Box, Shield, DollarSign, Database, Network, Terminal, Zap } from 'lucide-react';

const GATEWAY_ICONS: Record<string, any> = {
  network: Network, container: Box, iac: Terminal, data: Database,
  security: Shield, monitoring: Activity, cost: DollarSign, ops: Zap,
};

const GATEWAY_TOOLS: Record<string, number> = {
  network: 17, container: 24, iac: 12, data: 24,
  security: 14, monitoring: 16, cost: 9, ops: 9,
};

export default function AgentCorePage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = () => {
    setLoading(true);
    fetch('/awsops/api/agentcore')
      .then(r => r.json())
      .then(d => { if (!d.error) setStatus(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStatus(); }, []);

  const totalTools = Object.values(GATEWAY_TOOLS).reduce((a, b) => a + b, 0);
  const readyGateways = status?.gateways?.filter((g: any) => g.status === 'READY').length || 0;
  const totalGateways = status?.gateways?.length || 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <Header title="AgentCore Dashboard" subtitle="Amazon Bedrock AgentCore Runtime & Gateways" onRefresh={fetchStatus} />

      {loading && (
        <div className="w-full h-1 bg-navy-700 rounded-full overflow-hidden">
          <div className="h-full bg-accent-cyan rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      )}

      {/* Stats / 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard label="Runtime" value={status?.runtime?.status || '--'} icon={Cpu}
          color={status?.runtime?.status === 'READY' ? 'green' : 'orange'}
          change={`v${status?.runtime?.version || '?'} · ${status?.runtime?.id?.slice(-10) || ''}`} />
        <StatsCard label="Gateways" value={`${readyGateways}/${totalGateways}`} icon={Wifi}
          color={readyGateways === totalGateways && totalGateways > 0 ? 'green' : 'orange'}
          change={`${totalGateways} gateways · ${totalTools} tools`} />
        <StatsCard label="MCP Tools" value={totalTools} icon={Activity} color="cyan"
          change="8 gateways · 19 Lambda" />
        <StatsCard label="Code Interpreter" value="Active" icon={Terminal} color="purple"
          change={status?.codeInterpreter?.id?.slice(-10) || ''} />
      </div>

      {/* Runtime Detail / 런타임 상세 */}
      {status?.runtime && (
        <div className="bg-navy-800 rounded-lg border border-navy-600 p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Cpu size={16} className="text-accent-cyan" /> Runtime
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div><span className="text-gray-500">ID:</span> <span className="text-white">{status.runtime.id}</span></div>
            <div><span className="text-gray-500">Status:</span> <span className={status.runtime.status === 'READY' ? 'text-accent-green' : 'text-accent-orange'}>{status.runtime.status}</span></div>
            <div><span className="text-gray-500">Version:</span> <span className="text-white">{status.runtime.version}</span></div>
            <div><span className="text-gray-500">Region:</span> <span className="text-white">{status.region}</span></div>
            <div><span className="text-gray-500">Created:</span> <span className="text-gray-300">{status.runtime.createdAt ? new Date(status.runtime.createdAt).toLocaleString() : '--'}</span></div>
            <div><span className="text-gray-500">Updated:</span> <span className="text-gray-300">{status.runtime.lastUpdatedAt ? new Date(status.runtime.lastUpdatedAt).toLocaleString() : '--'}</span></div>
          </div>
        </div>
      )}

      {/* Gateways Grid / 게이트웨이 그리드 */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Wifi size={16} className="text-accent-cyan" /> Gateways ({totalGateways})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(status?.gateways || []).map((gw: any) => {
            const shortName = (gw.name || '').replace('awsops-', '').replace('-gateway', '');
            const Icon = GATEWAY_ICONS[shortName] || Activity;
            const tools = GATEWAY_TOOLS[shortName] || 0;
            return (
              <div key={gw.id} className="bg-navy-800 rounded-lg border border-navy-600 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-accent-cyan/10">
                      <Icon size={16} className="text-accent-cyan" />
                    </div>
                    <span className="text-white font-semibold text-sm capitalize">{shortName}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${gw.status === 'READY' ? 'bg-accent-green/15 text-accent-green' : 'bg-accent-red/15 text-accent-red'}`}>
                    {gw.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Tools</span><span className="text-accent-cyan font-mono font-bold">{tools}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Targets</span><span className="text-white font-mono">{gw.targets}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">ID</span><span className="text-gray-400 font-mono text-[9px]">{gw.id}</span></div>
                </div>
                {gw.description && <p className="text-[10px] text-gray-600 mt-2 truncate">{gw.description}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Gateway Tools / 게이트웨이 도구 목록 */}
      <div className="bg-navy-800 rounded-lg border border-navy-600 p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Activity size={16} className="text-accent-cyan" /> MCP Tools by Gateway (125 total)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { gw: 'Network', tools: ['list_vpcs', 'get_vpc_network_details', 'describe_network', 'find_ip_address', 'get_eni_details', 'get_vpc_flow_logs', 'list_transit_gateways', 'get_tgw_details', 'get_tgw_routes', 'get_all_tgw_routes', 'list_tgw_peerings', 'list_vpn_connections', 'list_network_firewalls', 'get_firewall_rules', 'analyze_reachability', 'query_flow_logs', 'get_path_trace_methodology'], color: 'cyan' },
            { gw: 'Container', tools: ['list_eks_clusters', 'get_eks_vpc_config', 'get_eks_insights', 'get_cloudwatch_logs', 'get_cloudwatch_metrics', 'get_eks_metrics_guidance', 'get_policies_for_role', 'search_eks_troubleshoot_guide', 'generate_app_manifest', 'ecs_resource_management', 'ecs_troubleshooting_tool', 'wait_for_service_ready', 'istio_overview', 'list_virtual_services', 'list_destination_rules', 'list_istio_gateways', 'list_service_entries', 'list_authorization_policies', 'list_peer_authentications', 'check_sidecar_injection', 'list_envoy_filters', 'list_istio_crds', 'istio_troubleshooting', 'query_istio_resource'], color: 'pink' },
            { gw: 'Security', tools: ['list_users', 'get_user', 'list_roles', 'get_role_details', 'list_groups', 'get_group', 'list_policies', 'list_user_policies', 'list_role_policies', 'get_user_policy', 'get_role_policy', 'list_access_keys', 'simulate_principal_policy', 'get_account_security_summary'], color: 'red' },
            { gw: 'Cost', tools: ['get_today_date', 'get_cost_and_usage', 'get_cost_and_usage_comparisons', 'get_cost_comparison_drivers', 'get_cost_forecast', 'get_dimension_values', 'get_tag_values', 'get_pricing', 'list_budgets'], color: 'orange' },
            { gw: 'Monitoring', tools: ['get_metric_data', 'get_metric_metadata', 'analyze_metric', 'get_recommended_metric_alarms', 'get_active_alarms', 'get_alarm_history', 'describe_log_groups', 'analyze_log_group', 'execute_log_insights_query', 'get_logs_insight_query_results', 'cancel_logs_insight_query', 'lookup_events', 'list_event_data_stores', 'lake_query', 'get_query_status', 'get_query_results'], color: 'green' },
            { gw: 'Data', tools: ['list_tables', 'describe_table', 'query_table', 'get_item', 'dynamodb_data_modeling', 'compute_performances_and_costs', 'list_db_instances', 'list_db_clusters', 'describe_db_instance', 'describe_db_cluster', 'execute_sql', 'list_snapshots', 'list_cache_clusters', 'describe_cache_cluster', 'list_replication_groups', 'describe_replication_group', 'list_serverless_caches', 'elasticache_best_practices', 'list_clusters', 'get_cluster_info', 'get_configuration_info', 'get_bootstrap_brokers', 'list_nodes', 'msk_best_practices'], color: 'purple' },
            { gw: 'IaC', tools: ['validate_cloudformation_template', 'check_cloudformation_template_compliance', 'troubleshoot_cloudformation_deployment', 'search_cdk_documentation', 'search_cloudformation_documentation', 'cdk_best_practices', 'read_iac_documentation_page', 'SearchAwsProviderDocs', 'SearchAwsccProviderDocs', 'SearchSpecificAwsIaModules', 'SearchUserProvidedModule', 'terraform_best_practices'], color: 'cyan' },
            { gw: 'Ops', tools: ['search_documentation', 'read_documentation', 'recommend', 'list_regions', 'get_regional_availability', 'prompt_understanding', 'call_aws', 'suggest_aws_commands', 'run_steampipe_query'], color: 'green' },
          ].map(({ gw, tools, color }) => (
            <div key={gw} className="bg-navy-900 rounded-lg border border-navy-600 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-semibold text-accent-${color}`}>{gw}</span>
                <span className="text-[10px] text-gray-500 font-mono">{tools.length} tools</span>
              </div>
              <div className="space-y-0.5 max-h-40 overflow-y-auto">
                {tools.map((t) => (
                  <div key={t} className="text-[9px] font-mono text-gray-400 truncate">{t}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture / 아키텍처 */}
      <div className="bg-navy-800 rounded-lg border border-navy-600 p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Architecture</h3>
        <div className="text-xs font-mono text-gray-400 space-y-1">
          <p>route.ts → <span className="text-accent-cyan">classifyIntent()</span> → 1-3 routes</p>
          <p>  → Single: <span className="text-white">AgentCore Runtime</span> → Gateway → Lambda → AWS API</p>
          <p>  → Multi:  <span className="text-accent-purple">Parallel Gateway calls</span> → <span className="text-accent-green">Synthesize</span> → Response</p>
          <p>  → Code:   <span className="text-accent-orange">Bedrock</span> → Python extract → <span className="text-white">Code Interpreter</span></p>
          <p>  → SQL:    <span className="text-accent-orange">Bedrock</span> → SQL generate → <span className="text-accent-cyan">Steampipe pg Pool</span></p>
        </div>
      </div>
    </div>
  );
}
