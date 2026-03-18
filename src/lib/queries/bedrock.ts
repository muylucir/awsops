// Bedrock monitoring queries / Bedrock 모니터링 쿼리
export const queries = {
  // Foundation models summary / 파운데이션 모델 요약
  foundationSummary: `
    SELECT
      COUNT(*) AS total_models,
      COUNT(DISTINCT provider_name) AS total_providers,
      COUNT(*) FILTER (WHERE inference_types_supported::text LIKE '%ON_DEMAND%') AS on_demand_count,
      COUNT(*) FILTER (WHERE inference_types_supported::text LIKE '%PROVISIONED%') AS provisioned_count
    FROM
      aws_bedrock_foundation_model
  `,

  // Foundation models by provider / 프로바이더별 모델 분포
  providerDistribution: `
    SELECT
      provider_name AS name,
      COUNT(*) AS value
    FROM
      aws_bedrock_foundation_model
    GROUP BY
      provider_name
    ORDER BY
      value DESC
  `,

  // Foundation models by output modality / 출력 모달리티별 분포
  modalityDistribution: `
    SELECT
      m.modality AS name,
      COUNT(*) AS value
    FROM
      aws_bedrock_foundation_model,
      jsonb_array_elements_text(output_modalities) AS m(modality)
    GROUP BY
      m.modality
    ORDER BY
      value DESC
  `,

  // Foundation model list / 파운데이션 모델 목록
  foundationList: `
    SELECT
      model_id,
      model_name,
      provider_name,
      input_modalities::text AS input_modalities,
      output_modalities::text AS output_modalities,
      inference_types_supported::text AS inference_types,
      model_lifecycle_status AS status,
      response_streaming_supported AS streaming
    FROM
      aws_bedrock_foundation_model
    ORDER BY
      provider_name, model_name
  `,

  // Custom models / 커스텀 모델
  customModels: `
    SELECT
      model_name,
      model_arn,
      base_model_identifier,
      customization_type,
      creation_time,
      training_metrics::text AS training_metrics,
      region
    FROM
      aws_bedrock_custom_model
    ORDER BY
      creation_time DESC
  `,

  // Provisioned throughput / 프로비저닝된 처리량
  provisionedThroughput: `
    SELECT
      provisioned_model_name,
      provisioned_model_arn,
      model_arn,
      desired_model_units,
      commitment_duration,
      status,
      creation_time,
      last_modified_time,
      region
    FROM
      aws_bedrock_provisioned_model_throughput
    ORDER BY
      creation_time DESC
  `,

  // Agents / 에이전트
  agents: `
    SELECT
      agent_name,
      agent_id,
      agent_status,
      foundation_model,
      description,
      prepared_at,
      updated_at,
      region
    FROM
      aws_bedrock_agent_agent
    ORDER BY
      updated_at DESC
  `,

  // Knowledge bases / 지식 베이스
  knowledgeBases: `
    SELECT
      name,
      knowledge_base_id,
      status,
      description,
      updated_at,
      region
    FROM
      aws_bedrock_agent_knowledge_base
    ORDER BY
      updated_at DESC
  `,

  // Guardrails / 가드레일
  guardrails: `
    SELECT
      name,
      guardrail_id,
      status,
      version,
      description,
      created_at,
      updated_at,
      region
    FROM
      aws_bedrock_guardrail
    ORDER BY
      updated_at DESC
  `,

  // Model invocation logging / 모델 호출 로깅 설정
  loggingConfig: `
    SELECT
      logging_config::text AS logging_config,
      region
    FROM
      aws_bedrock_model_invocation_logging_configuration
  `,
};
