// AgentCore Status API — Runtime, Gateways, Code Interpreter status
// AgentCore 상태 API — 런타임, 게이트웨이, 코드 인터프리터 상태
import { NextResponse } from 'next/server';
import {
  BedrockAgentCoreClient,
  ListGatewaysCommand,
  GetAgentRuntimeCommand,
  ListGatewayTargetsCommand,
} from '@aws-sdk/client-bedrock-agentcore';

const REGION = 'ap-northeast-2';
const client = new BedrockAgentCoreClient({ region: REGION });

// These are set by 6e script / 6e 스크립트에서 설정됨
const RUNTIME_ID = process.env.AGENTCORE_RUNTIME_ID || 'awsops_agent-CicSMK8CTI';
const CODE_INTERPRETER_ID = process.env.CODE_INTERPRETER_ID || 'awsops_code_interpreter-9S5Hv5cS14';

export async function GET() {
  try {
    // Parallel fetch: runtime + gateways / 병렬 조회: 런타임 + 게이트웨이
    const [runtimeResult, gatewaysResult] = await Promise.allSettled([
      client.send(new GetAgentRuntimeCommand({ agentRuntimeId: RUNTIME_ID })),
      client.send(new ListGatewaysCommand({})),
    ]);

    // Runtime info / 런타임 정보
    let runtime: any = null;
    if (runtimeResult.status === 'fulfilled') {
      const r = runtimeResult.value;
      runtime = {
        id: r.agentRuntimeId,
        status: r.status,
        version: r.agentRuntimeVersion,
        createdAt: r.createdAt,
        lastUpdatedAt: r.lastUpdatedAt,
      };
    }

    // Gateways info / 게이트웨이 정보
    const gateways: any[] = [];
    if (gatewaysResult.status === 'fulfilled') {
      const items = (gatewaysResult.value as any).items || [];
      // Fetch target counts per gateway in parallel / 게이트웨이별 타겟 수 병렬 조회
      const targetResults = await Promise.allSettled(
        items
          .filter((g: any) => g.name?.startsWith('awsops'))
          .map((g: any) =>
            client.send(new ListGatewayTargetsCommand({ gatewayIdentifier: g.gatewayId }))
              .then((r: any) => ({ gatewayId: g.gatewayId, targets: r.items?.length || 0 }))
          )
      );

      const targetMap: Record<string, number> = {};
      targetResults.forEach((r) => {
        if (r.status === 'fulfilled') targetMap[r.value.gatewayId] = r.value.targets;
      });

      items
        .filter((g: any) => g.name?.startsWith('awsops'))
        .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
        .forEach((g: any) => {
          gateways.push({
            id: g.gatewayId,
            name: g.name,
            status: g.status,
            description: g.description,
            targets: targetMap[g.gatewayId] || 0,
          });
        });
    }

    return NextResponse.json({
      runtime,
      gateways,
      codeInterpreter: { id: CODE_INTERPRETER_ID },
      region: REGION,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch AgentCore status' }, { status: 500 });
  }
}
