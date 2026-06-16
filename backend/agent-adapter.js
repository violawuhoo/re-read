const { getRuntimeConfig } = require('./config');
const {
  P0_SYSTEM_PROMPT,
  M1_SYSTEM_PROMPT,
  M2_SYSTEM_PROMPT,
  M3_SYSTEM_PROMPT,
  M4_SYSTEM_PROMPT,
  M5_SYSTEM_PROMPT,
  buildP0UserMsg,
  buildM1UserMsg,
  buildM2UserMsg,
  buildM3UserMsg,
  buildM4UserMsg,
  buildM5UserMsg
} = require('./prompts/phase1-module-prompts');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const MODULE_REQUEST_TIMEOUT_MS = 45000;
const MODULE_RETRYABLE_STATUS = new Set([408, 409, 429, 500, 502, 503, 504]);
let kimiWebSearchUnsupported = false;
const DEBUG_ENV_PATH = '.dbg/report-loading-spinner.env';

// #region debug-point B:agent-module-events
const reportDebugEvent = (hypothesisId, location, msg, data = {}) => {
  let url = 'http://127.0.0.1:7777/event';
  let sessionId = 'report-loading-spinner';
  try {
    const envText = require('fs').readFileSync(DEBUG_ENV_PATH, 'utf8');
    url = envText.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || url;
    sessionId = envText.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || sessionId;
  } catch {}
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, runId: 'post-fix', hypothesisId, location, msg: `[DEBUG] ${msg}`, data, ts: Date.now() })
  }).catch(() => {});
};
// #endregion

const MODULE_INPUT_LIMITS = {
  P0: 3200,
  M1: 5200,
  M2: 9000,
  M3: 5500,
  M4: 4500,
  M5: 3200
};

const buildMockResult = ({ content = '' }) => {
  const signals = [];
  let articleType = 'A+C混合';
  let credibility = '中';
  let hypeLevel = '中';
  let toVcRisk = '中';
  let innovationType = '技术 + 应用 + 系统工程';
  const missingItems = [];
  const followups = [];

  if (/多模态|foundation model|分子基础模型/i.test(content)) {
    articleType = 'A类论文解读';
    credibility = '高';
    toVcRisk = '不适用';
    innovationType = '技术创新';
    signals.push('识别为论文型信号：多模态基础模型');
    followups.push('继续溯源 arXiv、补充材料和作者主页');
  } else if (/综述|PR|融资|发布会|announcement|产品发布/i.test(content)) {
    articleType = '部分可分析';
    credibility = '低';
    hypeLevel = '高';
    toVcRisk = '高';
    innovationType = '叙事包装为主';
    signals.push('识别为 PR / 发布会导向内容');
    missingItems.push('缺少论文 DOI、技术报告或第三方评测');
    followups.push('等待技术报告或客户案例发布');
  } else {
    signals.push('识别为默认 A+C 混合研究线索');
    followups.push('继续核查论文、官网和融资新闻的一致性');
  }

  const mockModules = buildMockModules({ articleType, credibility, hypeLevel, toVcRisk, innovationType, signals, missingItems, followups });

  return {
    adapter: 'mock-sop-agent',
    provider: 'mock',
    model: 'mock',
    articleType,
    credibility,
    hypeLevel,
    toVcRisk,
    innovationType,
    reportStatus: '已通过 mock SOP Agent 完成结构化判断',
    signals,
    missingItems,
    followups,
    p0: mockModules.P0.data,
    m1: mockModules.M1.data,
    m2: mockModules.M2.data,
    m3: mockModules.M3.data,
    m4: mockModules.M4.data,
    m5: mockModules.M5.data,
    modules: mockModules
  };
};

const buildMockModules = ({ articleType, credibility, hypeLevel, toVcRisk, innovationType, signals, missingItems, followups }) => ({
  P0: {
    ok: true,
    data: {
      type: articleType === '部分可分析' ? '部分可分析' : articleType === 'A+C混合' ? 'A+C混合' : 'A类',
      subtype: articleType === '部分可分析' ? '纯PR' : null,
      confidence: 0.68,
      reason: '基于关键词和行文方式做了保守判断。',
      source_hint: null,
      can_proceed: true,
      partial_note: articleType === '部分可分析' ? '当前只能完成信源与商业叙事分析，缺少一手技术材料。' : null
    }
  },
  M1: {
    ok: true,
    data: {
      credibility,
      author_background: '基于文章文本的保守推断，未做外部核验。',
      interest_conflict: credibility === '低',
      interest_conflict_note: credibility === '低' ? '可能存在营销或利益相关表达。' : null,
      exaggeration_level: hypeLevel,
      issues: [],
      recommend_original: credibility !== '低',
      summary: '这是 mock 质量评估结果，仅用于后端流程兜底。'
    }
  },
  M2: {
    ok: true,
    data: {
      team: {
        lead_author: '未识别',
        institution: '未识别',
        related_company: null,
        funding_info: null,
        china_connection: null
      },
      commercial_intent: '当前更适合作为研究线索而非直接投资结论。',
      to_vc_risk: {
        level: toVcRisk,
        narrative_signals: 1,
        timing_signals: 1,
        technical_signals: 1,
        note: 'mock 结果，仅作风险方向提示。'
      },
      core_claim: signals.join('；') || '未识别到稳定 claim。',
      limitations: missingItems,
      innovation: {
        type: innovationType.includes('技术') ? '技术创新' : '混合',
        description: innovationType,
        search_keywords: ['科研流程', '科研自动化', '研究管线']
      }
    }
  },
  M3: {
    ok: true,
    data: {
      bottleneck: {
        description: '缺少可核验的一手材料与上下文对照。',
        why_unsolved: '现有文本不足以定位真实技术瓶颈。'
      },
      breakthrough: {
        degree: '部分缓解',
        explanation: '当前只能给出方向性判断。',
        next_bottleneck: '需要补齐论文、技术报告与真实 benchmark。'
      },
      productization: {
        data_barrier: { level: '中', benchmark: '缺少外部对照，按保守中位处理。' },
        compute_cost: { level: '中', benchmark: '缺少训练与推理成本披露。' },
        engineering_gap: { level: '中', note: '从 demo 到产品仍需补齐验证链路。' },
        regulation: { level: '中等', benchmark: '需结合具体赛道再判断。' }
      },
      trl: {
        score: 4,
        reference_case: 'Mock 参考：停留在实验室验证阶段。',
        time_window: {
          tool_layer: '中期(6-24个月)',
          application_layer: '长期(>2年)'
        }
      }
    }
  },
  M4: {
    ok: true,
    data: {
      timeline: {
        origin: 'mock 模式下未接入真实时间线检索。',
        current_frontier: '需要联网补齐过去18个月工作。',
        next_challenge: '建立可复核的国际与国内对照。',
        this_work_position: '当前仅能作为研究线索入口。'
      },
      overseas_works: [],
      china_teams: []
    }
  },
  M5: {
    ok: true,
    data: {
      field_stage: {
        phase: '概念期',
        main_driver: '信息增多但证据仍不足。',
        key_uncertainty: '缺少可复核的技术与验证材料。'
      },
      opportunities: followups.map((item, index) => ({
        direction: item,
        basis: `基于 mock 线索 ${index + 1}`,
        gap_type: '验证空缺',
        scope: index === 0 ? '国内' : '全球'
      })),
      signals: followups.map((item) => ({
        trigger: item,
        meaning: '补齐这一信息后才能进入下一步判断。',
        time_window: '近期(<6个月)'
      }))
    }
  }
});

const hasRealLlmConfig = () => {
  const runtimeConfig = getRuntimeConfig();
  return Boolean(runtimeConfig.llm.enabled);
};

const extractJsonCandidate = (content = '') => {
  const fencedJsonMatch = content.match(/```json\s*([\s\S]*?)```/i);
  if (fencedJsonMatch) {
    return fencedJsonMatch[1];
  }

  const fencedMatch = content.match(/```\s*([\s\S]*?)```/);
  if (fencedMatch) {
    return fencedMatch[1];
  }

  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return content.slice(firstBrace, lastBrace + 1);
  }

  throw new Error('No JSON object found in LLM response');
};

const parseAgentJson = (content) => JSON.parse(extractJsonCandidate(content));

const clampNumber = (value, min, max, fallback) => {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return Math.min(max, Math.max(min, numericValue));
  }
  return fallback;
};

const pickEnum = (value, validValues, fallback) => (validValues.includes(value) ? value : fallback);
const normalizeText = (value, fallback = '') => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
};

const normalizeNullableText = (value) => {
  const text = normalizeText(value, '');
  return text || null;
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);
const isEnglishLike = (value) => /[A-Za-z]/.test(value || '');
const describeModuleFailure = (moduleKey, reason) => `${moduleKey} 模块降级：${reason}`;
const trimArticleContent = (value = '', maxLength = 8000) => {
  if (!value || value.length <= maxLength) {
    return value;
  }

  const headLength = Math.floor(maxLength * 0.7);
  const tailLength = maxLength - headLength;
  return `${value.slice(0, headLength)}\n\n[中间内容已截断]\n\n${value.slice(-tailLength)}`;
};

const buildRetryInstruction = (moduleKey, errorMessage = '') => {
  const common = '请从头重新输出一个完整、合法、可解析的 JSON 对象，不要附加解释，不要使用 markdown 代码块。';
  const repair = /required|missing/i.test(errorMessage)
    ? '上一次缺少必填字段，这次必须把所有必填字段补齐。'
    : /truncated|incomplete|JSON/i.test(errorMessage)
      ? '上一次输出被截断，这次请保证 JSON 完整，并保留关键判断与必要细节。'
      : '上一次输出不可解析，这次请保持结构稳定、字段完整。';
  const moduleHints = {
    P0: 'reason 保持一句话但要写清判断依据，source_hint 没有就填 null。',
    M1: 'issues 最多 2 条，summary 保持 1-2 句话。',
    M2: 'limitations 最多 3 条，search_keywords 只保留 3-5 个中文短词。',
    M3: '每个说明字段控制在一句话内，time_window 用短语。',
    M4: 'overseas_works 输出 3-5 条，china_teams 输出 2-4 条，覆盖关键时间线位置和差距。',
    M5: 'opportunities 最多 3 条，signals 最多 3 条，每条写清方向、依据和待验证点。'
  };

  return `${repair}${common}${moduleHints[moduleKey] || ''}`;
};

const normalizeModuleOutput = (moduleKey, data = {}) => {
  if (moduleKey === 'P0') {
    return {
      type: pickEnum(data.type, ['A类', 'C类', 'A+C混合', '部分可分析', '不支持'], '部分可分析'),
      subtype: pickEnum(data.subtype, ['纯PR', '综述', '科普', '重复报道', null], null),
      confidence: clampNumber(data.confidence, 0, 1, 0.5),
      reason: normalizeText(data.reason, '模型未提供明确判断依据。'),
      source_hint: normalizeNullableText(data.source_hint),
      can_proceed: typeof data.can_proceed === 'boolean' ? data.can_proceed : data.type !== '不支持',
      partial_note: normalizeNullableText(data.partial_note)
    };
  }

  if (moduleKey === 'M1') {
    return {
      credibility: pickEnum(data.credibility, ['高', '中', '低'], '中'),
      author_background: normalizeText(data.author_background, '未识别作者或机构背景。'),
      interest_conflict: Boolean(data.interest_conflict),
      interest_conflict_note: normalizeNullableText(data.interest_conflict_note),
      exaggeration_level: pickEnum(data.exaggeration_level, ['低', '中', '高'], '中'),
      issues: ensureArray(data.issues)
        .map((item) => ({
          type: pickEnum(item?.type, ['A数字失真', 'B局限性省略', 'C结论超范围'], 'C结论超范围'),
          claim: normalizeText(item?.claim, ''),
          reality: normalizeText(item?.reality, ''),
          severity: pickEnum(item?.severity, ['轻微', '中等', '严重'], '中等')
        }))
        .filter((item) => item.claim && item.reality),
      recommend_original: Boolean(data.recommend_original),
      summary: normalizeText(data.summary, '未生成公众号质量总结。')
    };
  }

  if (moduleKey === 'M2') {
    const keywords = ensureArray(data.innovation?.search_keywords)
      .map((item) => normalizeText(item, ''))
      .filter(Boolean);

    const normalizedKeywords = keywords.length >= 3 ? keywords : keywords.filter(isEnglishLike);

    return {
      team: {
        lead_author: normalizeText(data.team?.lead_author, '未识别'),
        institution: normalizeText(data.team?.institution, '未识别'),
        related_company: normalizeNullableText(data.team?.related_company),
        funding_info: normalizeNullableText(data.team?.funding_info),
        china_connection: normalizeNullableText(data.team?.china_connection)
      },
      commercial_intent: normalizeText(data.commercial_intent, '未识别明确商业意图。'),
      to_vc_risk: {
        level: pickEnum(data.to_vc_risk?.level, ['低', '中', '高', '不适用'], '不适用'),
        narrative_signals: clampNumber(data.to_vc_risk?.narrative_signals, 0, 3, 0),
        timing_signals: clampNumber(data.to_vc_risk?.timing_signals, 0, 3, 0),
        technical_signals: clampNumber(data.to_vc_risk?.technical_signals, 0, 3, 0),
        note: normalizeText(data.to_vc_risk?.note, '未识别显著 To VC 风险。')
      },
      core_claim: normalizeText(data.core_claim, '未提取到稳定的核心 claim。'),
      limitations: ensureArray(data.limitations).map((item) => normalizeText(item, '')).filter(Boolean),
      innovation: {
        type:
          data.innovation?.type === '系统/工程创新'
            ? '系统工程创新'
            : pickEnum(data.innovation?.type, ['技术创新', '应用创新', '系统工程创新', '混合'], '混合'),
        description: normalizeText(data.innovation?.description, '未提炼出创新点描述。'),
        search_keywords: normalizedKeywords.length >= 3 ? normalizedKeywords : ['科研流程', '科研自动化', '研究管线']
      }
    };
  }

  if (moduleKey === 'M3') {
    return {
      bottleneck: {
        description: normalizeText(data.bottleneck?.description, '未识别长期未解决的问题。'),
        why_unsolved: normalizeText(data.bottleneck?.why_unsolved, '未说明此前为何难以解决。')
      },
      breakthrough: {
        degree: pickEnum(data.breakthrough?.degree, ['完全解决', '部分缓解', '绕过问题'], '部分缓解'),
        explanation: normalizeText(data.breakthrough?.explanation, '未给出突破程度说明。'),
        next_bottleneck: normalizeText(data.breakthrough?.next_bottleneck, '未给出下一阶段瓶颈。')
      },
      productization: {
        data_barrier: {
          level: pickEnum(data.productization?.data_barrier?.level, ['高', '中', '低'], '中'),
          benchmark: normalizeText(data.productization?.data_barrier?.benchmark, '未提供数据壁垒对照基准。')
        },
        compute_cost: {
          level: pickEnum(data.productization?.compute_cost?.level, ['高', '中', '低'], '中'),
          benchmark: normalizeText(data.productization?.compute_cost?.benchmark, '未提供算力成本对照基准。')
        },
        engineering_gap: {
          level: pickEnum(data.productization?.engineering_gap?.level, ['大', '中', '小'], '中'),
          note: normalizeText(data.productization?.engineering_gap?.note, '未说明从 demo 到产品的工程 gap。')
        },
        regulation: {
          level: pickEnum(data.productization?.regulation?.level, ['复杂', '中等', '简单'], '中等'),
          benchmark: normalizeText(data.productization?.regulation?.benchmark, '未提供监管路径对照基准。')
        }
      },
      trl: {
        score: Math.round(clampNumber(data.trl?.score, 1, 9, 4)),
        reference_case: normalizeText(data.trl?.reference_case, '未提供 TRL 历史参照案例。'),
        time_window: {
          tool_layer: normalizeText(data.trl?.time_window?.tool_layer, '中期(6-24个月)'),
          application_layer: normalizeText(data.trl?.time_window?.application_layer, '长期(>2年)')
        }
      }
    };
  }

  if (moduleKey === 'M4') {
    return {
      timeline: {
        origin: normalizeText(data.timeline?.origin, '未识别奠基性工作。'),
        current_frontier: normalizeText(data.timeline?.current_frontier, '未识别当前前沿。'),
        next_challenge: normalizeText(data.timeline?.next_challenge, '未识别下一阶段难题。'),
        this_work_position: normalizeText(data.timeline?.this_work_position, '未给出本文时间线位置。')
      },
      overseas_works: ensureArray(data.overseas_works)
        .map((item) => ({
          name: normalizeText(item?.name, ''),
          institution: normalizeText(item?.institution, ''),
          date: normalizeText(item?.date, ''),
          timeline_position: normalizeText(item?.timeline_position, ''),
          solved: normalizeText(item?.solved, ''),
          unsolved: normalizeText(item?.unsolved, ''),
          ref_url: normalizeText(item?.ref_url, '')
        }))
        .filter((item) => item.name),
      china_teams: ensureArray(data.china_teams)
        .map((item) => ({
          name: normalizeText(item?.name, ''),
          work: normalizeText(item?.work, ''),
          timeline_position: normalizeText(item?.timeline_position, ''),
          attribute: pickEnum(item?.attribute, ['学术', '开源', '商业产品'], '学术'),
          match_degree: pickEnum(item?.match_degree, ['完全对标', '部分对标', '表面相关'], '表面相关'),
          gap: normalizeText(item?.gap, ''),
          commercialization: normalizeNullableText(item?.commercialization),
          ref_url: normalizeText(item?.ref_url, '')
        }))
        .filter((item) => item.name)
    };
  }

  if (moduleKey === 'M5') {
    return {
      field_stage: {
        phase: pickEnum(data.field_stage?.phase, ['概念期', '产品期', '商业化期', '成熟期'], '概念期'),
        main_driver: normalizeText(data.field_stage?.main_driver, '未识别主要驱动力。'),
        key_uncertainty: normalizeText(data.field_stage?.key_uncertainty, '未识别关键不确定性。')
      },
      opportunities: ensureArray(data.opportunities)
        .map((item) => ({
          direction: normalizeText(item?.direction, ''),
          basis: normalizeText(item?.basis, ''),
          gap_type: pickEnum(item?.gap_type, ['技术空缺', '商业化空缺', '验证空缺'], '验证空缺'),
          scope: pickEnum(item?.scope, ['全球', '国内'], '全球')
        }))
        .filter((item) => item.direction),
      signals: ensureArray(data.signals)
        .map((item) => ({
          trigger: normalizeText(item?.trigger, ''),
          meaning: normalizeText(item?.meaning, ''),
          time_window: pickEnum(item?.time_window, ['近期(<6个月)', '中期(6-24个月)', '长期(>2年)', '不确定'], '不确定')
        }))
        .filter((item) => item.trigger)
    };
  }

  return data;
};

const isUsableModuleOutput = (moduleKey, data = {}) => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  if (moduleKey === 'P0') {
    return Boolean(data.type && data.reason);
  }

  if (moduleKey === 'M1') {
    return Boolean(data.credibility && data.summary);
  }

  if (moduleKey === 'M2') {
    return Boolean(data.core_claim && data.innovation?.description);
  }

  if (moduleKey === 'M3') {
    return Boolean(data.bottleneck?.description && data.breakthrough?.next_bottleneck);
  }

  if (moduleKey === 'M4') {
    return Boolean(data.timeline?.origin && data.timeline?.this_work_position);
  }

  if (moduleKey === 'M5') {
    return Boolean(data.field_stage?.phase && data.field_stage?.key_uncertainty);
  }

  return true;
};

const buildModuleFallback = (moduleKey, reason = '模型输出解析失败，已按保守路径兜底。') => {
  const fallbackMap = {
    P0: {
      type: '部分可分析',
      subtype: '综述',
      confidence: 0.5,
      reason,
      source_hint: null,
      can_proceed: true,
      partial_note: '当前无法稳定识别文章类型，建议人工确认后继续。'
    },
    M1: {
      credibility: '中',
      author_background: reason,
      interest_conflict: false,
      interest_conflict_note: null,
      exaggeration_level: '中',
      issues: [],
      recommend_original: false,
      summary: '质量评估解析失败，建议独立核查原文。'
    },
    M2: {
      team: {
        lead_author: '未识别',
        institution: '未识别',
        related_company: null,
        funding_info: null,
        china_connection: null
      },
      commercial_intent: '未识别商业意图。',
      to_vc_risk: {
        level: '不适用',
        narrative_signals: 0,
        timing_signals: 0,
        technical_signals: 0,
        note: reason
      },
      core_claim: '核心 claim 提取失败。',
      limitations: ['未稳定解析出局限性。'],
      innovation: {
        type: '混合',
        description: reason,
        search_keywords: ['科研流程', '科研自动化', '研究管线']
      }
    },
    M3: {
      bottleneck: {
        description: '未稳定解析出领域瓶颈。',
        why_unsolved: reason
      },
      breakthrough: {
        degree: '部分缓解',
        explanation: '当前只能保守判断为尚未充分验证。',
        next_bottleneck: '需要补齐可复核 benchmark 与真实验证。'
      },
      productization: {
        data_barrier: { level: '中', benchmark: reason },
        compute_cost: { level: '中', benchmark: reason },
        engineering_gap: { level: '中', note: reason },
        regulation: { level: '中等', benchmark: reason }
      },
      trl: {
        score: 4,
        reference_case: '保守默认值：实验室验证阶段。',
        time_window: {
          tool_layer: '中期(6-24个月)',
          application_layer: '长期(>2年)'
        }
      }
    },
    M4: {
      timeline: {
        origin: reason,
        current_frontier: '未完成稳定联网检索。',
        next_challenge: '需要补齐国际与国内对照。',
        this_work_position: '当前仅可视为待核实线索。'
      },
      overseas_works: [],
      china_teams: []
    },
    M5: {
      field_stage: {
        phase: '概念期',
        main_driver: '更多证据出现前仍以概念验证为主。',
        key_uncertainty: reason
      },
      opportunities: [],
      signals: []
    }
  };

  return fallbackMap[moduleKey];
};

const shouldOmitTemperature = (runtimeConfig, useWebSearch) => {
  if (runtimeConfig.llm.provider !== 'kimi') {
    return false;
  }

  if (useWebSearch) {
    return true;
  }

  return /^kimi-k2/i.test(runtimeConfig.llm.model);
};

const getAlternateKimiBaseUrl = (baseUrl = '') => {
  if (baseUrl.includes('api.moonshot.ai')) {
    return baseUrl.replace('api.moonshot.ai', 'api.moonshot.cn');
  }

  if (baseUrl.includes('api.moonshot.cn')) {
    return baseUrl.replace('api.moonshot.cn', 'api.moonshot.ai');
  }

  return null;
};

const isKimiAuthMismatch = (status, errorText) =>
  status === 401 && /invalid_authentication_error|invalid authentication/i.test(errorText || '');

const isUnsupportedWebSearchTool = (status, errorText) =>
  status === 400 && /unknown tool type:\s*\$web_search/i.test(errorText || '');

const isRetryableRequestError = (error) =>
  error?.code === 'MODULE_TIMEOUT' || error?.code === 'MODULE_NETWORK_ERROR' || MODULE_RETRYABLE_STATUS.has(error?.status);

const createModuleError = (message, extra = {}) => {
  const error = new Error(message);
  Object.assign(error, extra);
  return error;
};

const sendChatCompletionRequest = async ({ baseUrl, body, timeoutMs = MODULE_REQUEST_TIMEOUT_MS }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.REREAD_LLM_API_KEY}`
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw createModuleError(`LLM request failed: ${response.status} ${errorText}`, {
        status: response.status,
        errorText,
        code: MODULE_RETRYABLE_STATUS.has(response.status) ? 'MODULE_HTTP_RETRYABLE' : 'MODULE_HTTP_ERROR'
      });
    }

    return response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw createModuleError('模块请求超时', { code: 'MODULE_TIMEOUT' });
    }

    if (error?.status || error?.code) {
      throw error;
    }

    throw createModuleError(`模块请求失败：${error?.message || '网络错误'}`, {
      code: 'MODULE_NETWORK_ERROR'
    });
  } finally {
    clearTimeout(timer);
  }
};

const requestChatCompletion = async ({ messages, maxTokens, useWebSearch, timeoutMs }) => {
  const runtimeConfig = getRuntimeConfig();
  const effectiveUseWebSearch = useWebSearch && !(runtimeConfig.llm.provider === 'kimi' && kimiWebSearchUnsupported);
  const body = {
    model: runtimeConfig.llm.model,
    messages,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' }
  };

  if (!shouldOmitTemperature(runtimeConfig, effectiveUseWebSearch)) {
    body.temperature = runtimeConfig.llm.temperature;
  }

  if (runtimeConfig.llm.provider === 'kimi' && effectiveUseWebSearch) {
    body.tools = [{ type: '$web_search' }];
  }

  try {
    return await sendChatCompletionRequest({
      baseUrl: runtimeConfig.llm.baseUrl,
      body,
      timeoutMs
    });
  } catch (error) {
    if (effectiveUseWebSearch && isUnsupportedWebSearchTool(error.status, error.errorText)) {
      if (runtimeConfig.llm.provider === 'kimi') {
        kimiWebSearchUnsupported = true;
      }
      const fallbackBody = { ...body };
      delete fallbackBody.tools;

      console.warn('[AgentAdapter] kimi web search tool unsupported, retrying without tools');
      return sendChatCompletionRequest({
        baseUrl: runtimeConfig.llm.baseUrl,
        body: fallbackBody,
        timeoutMs
      });
    }

    const alternateBaseUrl =
      runtimeConfig.llm.provider === 'kimi' ? getAlternateKimiBaseUrl(runtimeConfig.llm.baseUrl) : null;

    if (!alternateBaseUrl || !isKimiAuthMismatch(error.status, error.errorText)) {
      throw error;
    }

    console.warn(
      `[AgentAdapter] kimi auth failed on ${runtimeConfig.llm.baseUrl}, retrying with alternate endpoint ${alternateBaseUrl}`
    );

    return sendChatCompletionRequest({
      baseUrl: alternateBaseUrl,
      body,
      timeoutMs
    });
  }
};

const MODULE_OPTIONS = {
  P0: { maxTokens: 1800, useWebSearch: false, timeoutMs: 35000, retries: 2 },
  M1: { maxTokens: 2200, useWebSearch: false, timeoutMs: 45000, retries: 2 },
  M2: { maxTokens: 2600, useWebSearch: false, timeoutMs: 50000, retries: 2 },
  M3: { maxTokens: 1800, useWebSearch: false, timeoutMs: 50000, retries: 2 },
  M4: { maxTokens: 3000, useWebSearch: true, timeoutMs: 75000, retries: 3 },
  M5: { maxTokens: 1600, useWebSearch: false, timeoutMs: 65000, retries: 2 }
};

const callModule = async (moduleKey, systemPrompt, userMessage) => {
  const { maxTokens, useWebSearch, timeoutMs, retries } = MODULE_OPTIONS[moduleKey] || {
    maxTokens: 1500,
    useWebSearch: false,
    timeoutMs: 30000,
    retries: 2
  };
  const baseMessages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];
  let lastError = null;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    const messages =
      attempt === 0
        ? [...baseMessages]
        : [
            ...baseMessages,
            {
              role: 'user',
              content: buildRetryInstruction(moduleKey, lastError?.message || '')
            }
          ];
    const attemptMaxTokens = attempt === 0 ? maxTokens : Math.min(maxTokens * (attempt + 1), useWebSearch ? 6000 : 4000);
    const attemptTimeoutMs = timeoutMs + attempt * 15000;
    let finishReason = null;

    try {
      // #region debug-point B:module-attempt-start
      reportDebugEvent('B', 'backend/agent-adapter.js:callModule:start', 'module attempt start', {
        moduleKey,
        attempt: attempt + 1,
        retries,
        useWebSearch,
        timeoutMs: attemptTimeoutMs,
        maxTokens: attemptMaxTokens
      });
      // #endregion
      while (finishReason === null || finishReason === 'tool_calls') {
        const data = await requestChatCompletion({ messages, maxTokens: attemptMaxTokens, useWebSearch, timeoutMs: attemptTimeoutMs });
        const choice = data?.choices?.[0];

        if (!choice?.message) {
          throw new Error('LLM response missing choice.message');
        }

        finishReason = choice.finish_reason;

        if (finishReason === 'tool_calls') {
          messages.push(choice.message);
          const toolCalls = Array.isArray(choice.message.tool_calls) ? choice.message.tool_calls : [];

          toolCalls.forEach((toolCall) => {
            const toolArguments = JSON.parse(toolCall?.function?.arguments || '{}');
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall?.function?.name || '$web_search',
              content: JSON.stringify(toolArguments)
            });
          });
          continue;
        }

        if (finishReason === 'length') {
          throw new Error('LLM response truncated before JSON completion');
        }

        const parsed = parseAgentJson(choice.message.content || '');
        const normalized = normalizeModuleOutput(moduleKey, parsed);

        if (!isUsableModuleOutput(moduleKey, parsed)) {
          if (attempt < retries - 1) {
            throw new Error('LLM response missing required fields');
          }

          // #region debug-point B:module-degraded-success
          reportDebugEvent('B', 'backend/agent-adapter.js:callModule:degraded', 'module completed with degraded output', {
            moduleKey,
            attempt: attempt + 1,
            finishReason
          });
          // #endregion
          return {
            data: normalized,
            error: describeModuleFailure(moduleKey, '输出字段缺失，已按默认值补齐'),
            degraded: true
          };
        }

        // #region debug-point B:module-success
        reportDebugEvent('B', 'backend/agent-adapter.js:callModule:success', 'module attempt success', {
          moduleKey,
          attempt: attempt + 1,
          finishReason
        });
        // #endregion
        return {
          data: normalized,
          error: null,
          degraded: false
        };
      }

      throw new Error('LLM response incomplete after retry');
    } catch (error) {
      lastError = error;
      const canRetry = attempt < retries - 1 && (isRetryableRequestError(error) || /JSON|missing|required|truncated|incomplete/i.test(error.message || ''));
      console.warn('[AgentAdapter] module attempt failed', {
        moduleKey,
        attempt: attempt + 1,
        retries,
        error: error.message,
        willRetry: canRetry
      });
      // #region debug-point B:module-attempt-failed
      reportDebugEvent('B', 'backend/agent-adapter.js:callModule:failed', 'module attempt failed', {
        moduleKey,
        attempt: attempt + 1,
        retries,
        error: error.message,
        willRetry: canRetry
      });
      // #endregion

      if (canRetry) {
        await sleep(300 * (attempt + 1));
        continue;
      }
      break;
    }
  }

  console.error('[AgentAdapter] module call failed', { moduleKey, error: lastError?.message });
  const fallbackReason = describeModuleFailure(moduleKey, lastError?.message || '模块执行失败');
  // #region debug-point B:module-fallback
  reportDebugEvent('B', 'backend/agent-adapter.js:callModule:fallback', 'module fallback generated', {
    moduleKey,
    error: lastError?.message || '',
    fallbackReason
  });
  // #endregion
  return {
    data: buildModuleFallback(moduleKey, fallbackReason),
    error: fallbackReason,
    degraded: true
  };
};
const buildSignalsArray = (p0 = {}, m1 = {}, m2 = {}) =>
  [
    p0.type ? `文章类型：${p0.type}${p0.subtype ? ` / ${p0.subtype}` : ''}` : null,
    m1.credibility ? `公众号可信度：${m1.credibility}；夸大程度：${m1.exaggeration_level || '中'}` : null,
    m2.innovation?.description ? `创新点：${m2.innovation.description}` : null
  ].filter(Boolean);

const buildMissingItems = (p0 = {}, m1 = {}, moduleErrors = {}) => {
  const items = [];

  if (p0.type === '部分可分析') {
    items.push(`部分可分析类型：${p0.subtype || '待确认'}，需补充一手技术材料`);
  }

  if (p0.type === '不支持') {
    items.push('当前内容不属于技术、科研或产品分析范畴，不建议进入完整分析');
  }

  if (m1.recommend_original === false) {
    items.push('建议回到原始论文、技术报告或官方发布进行核查');
  }

  Object.entries(moduleErrors).forEach(([moduleKey, error]) => {
    if (error) {
      items.push(`${moduleKey} 模块失败：${error}`);
    }
  });

  return items;
};

const buildModuleRecord = (moduleKey, data, error) => ({
  ok: !error,
  error: error || null,
  data: error ? buildModuleFallback(moduleKey, error) : data
});

const countModuleErrors = (moduleErrors = {}) => Object.values(moduleErrors).filter(Boolean).length;

const runStructuredPipeline = async (payload, onProgress) => {
  const runtimeConfig = getRuntimeConfig();
  const rawArticleContent = payload.content || payload.articleUrl || '';
  const getModuleContent = (moduleKey) => trimArticleContent(rawArticleContent, MODULE_INPUT_LIMITS[moduleKey] || 8000);
  const moduleErrors = {};
  // #region debug-point B:pipeline-start
  reportDebugEvent('B', 'backend/agent-adapter.js:runStructuredPipeline:start', 'structured pipeline start', {
    provider: runtimeConfig?.llm?.provider || '',
    model: runtimeConfig?.llm?.model || '',
    contentLength: rawArticleContent.length
  });
  // #endregion

  onProgress?.('内容类型识别', 30);
  const p0Promise = callModule('P0', P0_SYSTEM_PROMPT, buildP0UserMsg(getModuleContent('P0')));

  onProgress?.('公众号质量评估', 40);
  const m1Promise = callModule('M1', M1_SYSTEM_PROMPT, buildM1UserMsg(getModuleContent('M1')));

  await Promise.race([p0Promise, m1Promise]);
  onProgress?.('公众号质量评估', 47);

  const p0Result = await p0Promise;
  if (p0Result.error) {
    moduleErrors.P0 = p0Result.error;
  }

  const m1Result = await m1Promise;
  if (m1Result.error) {
    moduleErrors.M1 = m1Result.error;
  }

  onProgress?.('团队背景与创新点', 55);
  const m2Result = await callModule('M2', M2_SYSTEM_PROMPT, buildM2UserMsg(getModuleContent('M2'), p0Result.data, m1Result.data));
  if (m2Result.error) {
    moduleErrors.M2 = m2Result.error;
  }

  onProgress?.('创新点价值判断', 68);
  const m3Promise = callModule('M3', M3_SYSTEM_PROMPT, buildM3UserMsg(getModuleContent('M3'), p0Result.data, m1Result.data, m2Result.data));

  onProgress?.('领域发展全景', 80);
  const m4Promise = callModule('M4', M4_SYSTEM_PROMPT, buildM4UserMsg(getModuleContent('M4'), p0Result.data, m2Result.data));

  await Promise.race([m3Promise, m4Promise]);
  onProgress?.('领域发展全景', 84);

  const m3Result = await m3Promise;
  if (m3Result.error) {
    moduleErrors.M3 = m3Result.error;
  }

  const m4Result = await m4Promise;
  if (m4Result.error) {
    moduleErrors.M4 = m4Result.error;
  }

  onProgress?.('投资信号提取', 90);
  const m5Result = await callModule('M5', M5_SYSTEM_PROMPT, buildM5UserMsg(getModuleContent('M5'), m3Result.data, m4Result.data));
  if (m5Result.error) {
    moduleErrors.M5 = m5Result.error;
  }
  onProgress?.('整合报告', 95);

  const p0 = p0Result.data || {};
  const m1 = m1Result.data || {};
  const m2 = m2Result.data || {};
  const m3 = m3Result.data || {};
  const m4 = m4Result.data || {};
  const m5 = m5Result.data || {};

  const modules = {
    P0: buildModuleRecord('P0', p0, p0Result.error),
    M1: buildModuleRecord('M1', m1, m1Result.error),
    M2: buildModuleRecord('M2', m2, m2Result.error),
    M3: buildModuleRecord('M3', m3, m3Result.error),
    M4: buildModuleRecord('M4', m4, m4Result.error),
    M5: buildModuleRecord('M5', m5, m5Result.error)
  };
  const degradedModuleCount = countModuleErrors(moduleErrors);
  const reportStatus =
    degradedModuleCount > 0
      ? `已完成 SOP 六模块分析 · ${p0.type || 'A+C混合'} · 部分模块降级(${degradedModuleCount})`
      : `已完成 SOP 六模块分析 · ${p0.type || 'A+C混合'}`;
  // #region debug-point B:pipeline-finished
  reportDebugEvent('B', 'backend/agent-adapter.js:runStructuredPipeline:done', 'structured pipeline finished', {
    degradedModuleCount,
    moduleErrors,
    reportStatus
  });
  // #endregion

  return {
    adapter: runtimeConfig.llm.provider,
    provider: runtimeConfig.llm.provider,
    model: runtimeConfig.llm.model,
    articleType: p0.type || 'A+C混合',
    credibility: m1.credibility || '中',
    hypeLevel: m1.exaggeration_level || '中',
    toVcRisk: m2.to_vc_risk?.level || '不适用',
    innovationType: m2.innovation?.type || '',
    reportStatus,
    signals: buildSignalsArray(p0, m1, m2),
    missingItems: buildMissingItems(p0, m1, moduleErrors),
    followups: Array.isArray(m5.signals) ? m5.signals.map((item) => item.trigger).filter(Boolean) : [],
    p0,
    m1,
    m2,
    m3,
    m4,
    m5,
    modules,
    moduleErrors
  };
};

const runSopAgent = async (payload, onProgress) => {
  await sleep(350);

  if (hasRealLlmConfig()) {
    try {
      return await runStructuredPipeline(payload, onProgress);
    } catch (error) {
      console.error('[AgentAdapter] real llm failed, fallback to mock', error);
    }
  }

  return buildMockResult(payload);
};

module.exports = {
  runSopAgent
};
