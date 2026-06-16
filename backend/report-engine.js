const { getReportById, reportLibrary } = require('./report-fixtures');

const clone = (value) => JSON.parse(JSON.stringify(value));

const inferReportIdFromContent = (content = '') => {
  if (/多模态|foundation model|分子基础模型/i.test(content)) {
    return 'reread-002';
  }

  if (/综述|PR|融资|发布会|announcement|产品发布/i.test(content)) {
    return 'reread-003';
  }

  return 'reread-001';
};

const normalizeToVcRisk = (value) => (value === '不适用' ? undefined : value);
const getModuleData = (agentResult, key) => agentResult[key.toLowerCase()] || agentResult.modules?.[key]?.data || null;
const unique = (items) => Array.from(new Set(items.filter(Boolean)));
const asYesNo = (value) => (value ? '是' : '否');
const joinMaterial = (...items) => unique(items).join(' · ');
const stripIssuePrefix = (value = '') => value.replace(/^[A-Z]/, '');
const safeText = (value, fallback = '当前公开信息不足，需结合原文继续判断') => value || fallback;
const safeArray = (items = [], fallbackText = '当前公开信息不足，需结合原文继续判断') => (items && items.length ? items : [fallbackText]);
const formatFallbackReason = (reason = '') => {
  if (!reason) {
    return '当前链路已完成正式报告装配，但部分判断仍需结合原文继续核验。';
  }

  return String(reason)
    .replace(/M\d|P0/g, '相关分析')
    .replace(/模块降级[:：]?\s*/g, '')
    .replace(/输出字段缺失，已按默认值补齐/g, '部分信息未完整返回，已按正式报告结构补齐')
    .replace(/模块请求超时/g, '分析耗时较长')
    .replace(/LLM response.*$/i, '模型返回不完整')
    .trim();
};
const buildFormalGapText = (reason = '', fallback = '当前公开信息不足，需结合原文继续核验') => {
  const normalizedReason = formatFallbackReason(reason);
  return normalizedReason || fallback;
};
const buildFormalMetricLine = (label, level, detail, fallbackDetail) =>
  `${label}：${level || '需继续核验'}；${detail || fallbackDetail}`;
const buildFormalKeywordLine = (keywords = []) =>
  keywords.length ? `相关关键词：${keywords.join(' / ')}` : '相关关键词：建议围绕核心技术路径、实验闭环和工程化能力继续补检';
const ensureSummary = (value, fallback) => safeText(value, fallback);
const normalizeRiskLevel = (value, fallback = '中') => {
  const normalized = String(value || '').trim();
  if (['高', '中', '低'].includes(normalized)) {
    return normalized;
  }
  if (['高风险', '较高'].includes(normalized)) {
    return '高';
  }
  if (['中等', '一般', '中风险'].includes(normalized)) {
    return '中';
  }
  if (['低风险', '较低'].includes(normalized)) {
    return '低';
  }
  return fallback;
};
const splitSentences = (value = '') =>
  value
    .split(/[。！？；\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
const buildClaimBullets = (coreClaim = '', limitations = []) => {
  const claimSentences = splitSentences(coreClaim);
  const claimBullets = (claimSentences.length ? claimSentences : coreClaim ? [coreClaim] : []).map((item, index) => `主张${index + 1}：${item}`);
  const limitBullets = (limitations.length ? limitations : ['未发现作者明确自述的核心局限']).map((item) => `局限：${item}`);
  return [...claimBullets, ...limitBullets];
};
const formatBreakthroughLabel = (degree = '') => {
  if (degree === '部分缓解') {
    return '关键瓶颈被部分缓解';
  }
  if (degree === '完全解决') {
    return '核心瓶颈已被实质性解决';
  }
  if (degree === '绕过问题') {
    return '通过替代路径实现阶段性推进';
  }
  return '仍需结合原文与同类工作继续判断';
};
const formatIndustrialStage = (phase = '') => {
  if (phase === '商业化期') {
    return '商业化窗口已打开';
  }
  if (phase === '产品期') {
    return '产品化验证窗口';
  }
  if (phase === '概念期') {
    return '概念验证窗口';
  }
  if (phase === '成熟期') {
    return '成熟部署阶段';
  }
  return '尚处于需要继续核验的阶段';
};
const buildQualityConclusion = (m1 = {}) => {
  const hypeLevel = normalizeRiskLevel(m1.exaggeration_level);
  if (m1.recommend_original && hypeLevel === '低') {
    return '结论：这篇公众号可以作为快速导读，也可直接作为进入原文前的参考。';
  }
  if (m1.recommend_original) {
    return '结论：这篇公众号适合作为快速导读，但不能直接替代原文判断。';
  }
  return '结论：这篇公众号更适合作为线索提示，关键结论仍需回到原文核对。';
};
const buildQualitySummary = (m1 = {}) => {
  const credibility = normalizeRiskLevel(m1.credibility);
  const hypeLevel = normalizeRiskLevel(m1.exaggeration_level);
  if (credibility === '高' && hypeLevel === '低') {
    return '信息源相对可靠，公众号表述与原文基本一致，可以作为进入原文前的快速导读。';
  }
  if (hypeLevel === '高') {
    return '标题或结论外推较多，这篇公众号更适合作为线索入口，不适合直接当作结论。';
  }
  if (hypeLevel === '中') {
    return '信息整体可读，但标题或结论存在外推，关键判断仍需回到原文核对。';
  }
  return '信息整体可读，适合先建立判断框架，再回到原文做进一步核验。';
};
const buildQualityBoundary = (m1 = {}) => {
  const hypeLevel = normalizeRiskLevel(m1.exaggeration_level);
  if (hypeLevel === '高') {
    return '边界：标题和结论外推较多，不能直接据此下判断。';
  }
  if (hypeLevel === '中') {
    return '边界：涉及结论外推或局限省略，仍必须回到原文核对。';
  }
  return '边界：未发现明显夸大，但投资判断仍应结合原文与领域对比。';
};
const buildOverseasIntro = (item = {}) => {
  if (item.intro) {
    return item.intro;
  }
  if (item.solved) {
    return `${item.institution || '该团队'} 的代表性工作，核心是在该方向上推进“${item.solved}”这一步。`;
  }
  return `${item.institution || '该团队'} 的代表性工作，用于帮助定位它在时间线上的位置。`;
};
const buildReferences = (payload = {}, structuredM4 = {}, fallbackTitle = '') => {
  const items = [];
  const pushReference = (reference) => {
    if (!reference?.link || items.find((item) => item.link === reference.link)) {
      return;
    }
    items.push(reference);
  };

  if (payload.articleUrl) {
    pushReference({
      author: payload.resolvedSourceName || payload.sourceName || '公众号原文',
      title: payload.resolvedTitle || fallbackTitle,
      link: payload.articleUrl
    });
  }

  [...(structuredM4?.overseas_works || []), ...(structuredM4?.china_teams || [])].forEach((item) => {
    if (!item?.ref_url) {
      return;
    }
    pushReference({
      author: item.institution || item.name || '',
      title: item.name || item.work || '相关工作',
      link: item.ref_url
    });
  });

  return items.map((item, index) => ({
    id: `Ref ${index}`,
    ...item
  }));
};
const createStructuredReportSkeleton = () => ({
  id: 'reread-report',
  title: '公众号文章解读',
  subtitle: '判断：已基于导入内容生成正式报告，关键结论仍需结合一手材料继续核验。',
  coreClaim: '',
  account: '公众号链接导入',
  cover: 'https://picsum.photos/id/119/750/500',
  articleType: 'A类',
  mode: '标准解读',
  generatedAt: '',
  status: '已完成 SOP 六模块分析',
  tags: [],
  meta: {
    credibility: '中',
    hypeLevel: '中',
    innovationType: '需结合原文继续判断',
    trl: '',
    industrialWindow: '需结合原文继续判断'
  },
  articleSnapshot: {
    sourceName: '公众号链接导入',
    sourceAuthor: '未识别',
    publishDate: '',
    articleUrl: '',
    originalMaterial: '公众号原文'
  },
  pipeline: [],
  timeline: [],
  sections: [],
  references: [],
  coreInnovation: {
    type: '',
    description: '',
    searchKeywords: []
  },
  bottleneck: {
    description: '',
    whyUnsolved: '',
    nextBottleneck: ''
  },
  productization: {
    dataBarrier: {
      level: '',
      benchmark: ''
    },
    computeCost: {
      level: '',
      benchmark: ''
    },
    engineeringGap: {
      level: '',
      note: ''
    },
    regulation: {
      level: '',
      benchmark: ''
    }
  },
  overseasWorks: [],
  chinaTeams: [],
  opportunities: [],
  investmentSignals: [],
  hyperDetail: {
    issues: []
  },
  teamDetail: {
    leadAuthor: '',
    institution: '',
    relatedCompany: null,
    fundingInfo: null,
    chinaConnection: null,
    commercialIntent: ''
  }
});

const buildDynamicSections = (payload, agentResult) => {
  const { p0 = {}, m1 = {}, m2 = {}, m3 = {}, m4 = {}, m5 = {} } = agentResult;
  const moduleErrors = agentResult.modules || {};
  const m1Gap = buildFormalGapText(moduleErrors.M1?.error);
  const m2Gap = buildFormalGapText(moduleErrors.M2?.error);
  const m3Gap = buildFormalGapText(moduleErrors.M3?.error);
  const m4Gap = buildFormalGapText(moduleErrors.M4?.error);
  const m5Gap = buildFormalGapText(moduleErrors.M5?.error);
  const sections = [];
  const overseasWorks = m4.overseas_works || [];
  const chinaTeams = (m4.china_teams || []).filter((item) => item.match_degree !== '表面相关');
  const opportunities = m5.opportunities || [];
  const signals = m5.signals || [];
  const credibility = normalizeRiskLevel(m1.credibility);
  const hypeLevel = normalizeRiskLevel(m1.exaggeration_level);
  const industrialStage = formatIndustrialStage(m5.field_stage?.phase);

  sections.push({
    key: 'quality',
    title: '公众号质量评估',
    summary: ensureSummary(m1.summary, moduleErrors.M1?.error ? `公众号质量判断已完成正式装配，但${m1Gap}。` : buildQualitySummary(m1)),
    bullets: [
      buildQualityConclusion(m1),
      `作者背景：${safeText(m1.author_background, moduleErrors.M1?.error ? '当前未返回稳定作者背景信息，建议回到原文与账号历史继续核查。' : '原文未明确披露作者背景。')}`,
      `证据：${m1.interest_conflict ? '存在利益相关，需要谨慎解读' : '未发现直接利益相关'}；建议参考原文：${asYesNo(m1.recommend_original)}`,
      buildQualityBoundary(m1)
    ],
    tone: credibility === '低' ? 'warning' : 'info',
    highlight: `可信度：${credibility}`
  });

  sections.push({
    key: 'hype',
    title: '夸大检测',
    summary:
      hypeLevel === '高'
        ? '主要问题集中在结论外推和局限省略，建议逐条对照原文核查。'
        : hypeLevel === '中'
          ? '主要问题在于标题或结论外推，关键信息边界需要回到原文确认。'
          : '未发现明显夸大，公众号表述与原文基本一致。',
    bullets: [],
    tone: ['高', '中'].includes(hypeLevel) ? 'warning' : 'default',
    highlight: `夸大程度：${hypeLevel}；建议参考原文：${asYesNo(m1.recommend_original)}`
  });

  sections.push({
    key: 'team',
    title: '团队背景与商业意图',
    summary: ensureSummary(m2.commercial_intent, moduleErrors.M2?.error ? `团队与用途分析已完成正式装配，但${m2Gap}。` : '已完成团队与用途分析。'),
    bullets: [
      m2.team?.lead_author ? `通讯作者：${m2.team.lead_author}${m2.team.institution ? `（${m2.team.institution}）` : ''}` : null,
      m2.team?.related_company ? `关联公司：${m2.team.related_company}` : null,
      m2.team?.funding_info ? `融资信息：${m2.team.funding_info}` : null,
      m2.team?.china_connection ? `中国关联：${m2.team.china_connection}` : null,
      m2.commercial_intent ? `商业意图：${m2.commercial_intent}` : null
    ].filter(Boolean).length
      ? [
          m2.team?.lead_author ? `通讯作者：${m2.team.lead_author}${m2.team.institution ? `（${m2.team.institution}）` : ''}` : null,
          m2.team?.related_company ? `关联公司：${m2.team.related_company}` : null,
          m2.team?.funding_info ? `融资信息：${m2.team.funding_info}` : null,
          m2.team?.china_connection ? `中国关联：${m2.team.china_connection}` : null,
          m2.commercial_intent ? `商业意图：${m2.commercial_intent}` : null
        ].filter(Boolean)
      : safeArray([], moduleErrors.M2?.error ? `团队与商业意图部分信息未完整返回，${m2Gap}。` : '当前公开信息不足，建议先围绕作者、机构与发布背景继续补证。'),
    tone: 'default'
  });

  sections.push({
    key: 'claim',
    title: '核心 Claim',
    summary: ensureSummary(m2.core_claim, moduleErrors.M2?.error ? `核心主张已完成正式装配，但${m2Gap}。` : '已完成核心主张提取。'),
    bullets: buildClaimBullets(m2.core_claim || '当前公开材料更像阶段性进展展示，关键 claim 仍需结合原文继续核验。', m2.limitations || [])
  });

  sections.push({
    key: 'innovation',
    title: '创新点识别',
    summary: ensureSummary(m2.innovation?.description, moduleErrors.M2?.error ? `创新点识别已完成正式装配，但${m2Gap}。` : '已完成创新点识别。'),
    bullets: [
      `创新类型：${safeText(m2.innovation?.type, '当前更接近系统整合式推进，仍需结合原文继续判断')}`,
      `一句话概括：${safeText(m2.innovation?.description, '当前公开信息更能支持方向性判断，仍需结合原文细节继续补证。')}`,
      buildFormalKeywordLine(m2.innovation?.search_keywords || [])
    ],
    highlight: `创新点类型：${safeText(m2.innovation?.type, '需继续核验')}`,
    tone: 'success'
  });

  sections.push({
    key: 'bottleneck',
    title: '领域瓶颈与突破程度',
    summary: ensureSummary(m3.bottleneck?.description, moduleErrors.M3?.error ? `领域瓶颈判断已完成正式装配，但${m3Gap}。` : '已完成领域瓶颈与突破程度判断。'),
    bullets: [
      `之前未解决原因：${safeText(m3.bottleneck?.why_unsolved, '当前仍缺少稳定公开证据，建议结合原文与同类工作继续判断。')}`,
      `突破说明：${safeText(m3.breakthrough?.explanation, '当前更适合作为阶段性推进来理解，仍需结合验证结果继续判断。')}`,
      `下一个瓶颈：${safeText(m3.breakthrough?.next_bottleneck, '下一步仍要观察规模化、可复现性与工程化约束。')}`
    ],
    highlight: `突破判断：${formatBreakthroughLabel(m3.breakthrough?.degree)}`
  });

  const productization = m3.productization || {};
  sections.push({
    key: 'industrial',
    title: '产业化可行性',
    summary:
      industrialStage === '尚处于需要继续核验的阶段'
        ? `当前已完成产业化可行性判断，但${moduleErrors.M3?.error ? m3Gap : '部分结论仍需结合公开验证材料继续核验'}。`
        : `当前更接近${industrialStage}，重点是验证产品交付、工程化能力和落地约束。`,
    bullets: [
      buildFormalMetricLine('数据壁垒', productization.data_barrier?.level, productization.data_barrier?.benchmark, '当前仍需结合数据来源与合作路径继续核验'),
      buildFormalMetricLine('算力成本', productization.compute_cost?.level, productization.compute_cost?.benchmark, '当前仍需结合训练与推理成本继续判断'),
      buildFormalMetricLine('工程化 gap', productization.engineering_gap?.level, productization.engineering_gap?.note, '当前仍需结合真实交付链路继续判断'),
      buildFormalMetricLine('监管路径', productization.regulation?.level, productization.regulation?.benchmark, '当前仍需结合具体赛道和落地路径继续判断'),
      `工具层商业化：${safeText(m3.trl?.time_window?.tool_layer, '当前仍处于需要继续核验的窗口')}`,
      `应用层商业化：${safeText(m3.trl?.time_window?.application_layer, '当前仍处于需要继续核验的窗口')}`
    ],
    tone: 'info',
    highlight: `当前阶段：${industrialStage}`
  });

  sections.push({
    key: 'timeline',
    title: '领域发展时间线',
    summary: '这一块只回答它在领域时间线上的位置：从哪里来、现在到了哪一步、下一步卡在哪里。',
    bullets: []
  });

  sections.push({
    key: 'overseas',
    title: '海外代表性工作',
    summary: overseasWorks.length ? '已筛出与当前方向最相关的海外代表性工作，用来定位它在全球进展中的位置。' : `当前还没有形成稳定的海外对照清单，${m4Gap}。`,
    bullets: []
  });

  sections.push({
    key: 'domestic',
    title: '国内研究扫描',
    summary: chinaTeams.length ? '已筛出与当前方向相关的国内团队或产品，用来判断国内跟进位置与差距。' : `当前还没有形成稳定的国内对照清单，${m4Gap}。`,
    bullets: []
  });

  sections.push({
    key: 'opportunity',
    title: '投资机会分析',
    summary:
      opportunities.length && industrialStage !== '待判断'
        ? `当前处于${industrialStage}，更值得关注供给缺口、工程化短板和验证空白，而不是直接寻找终局赢家。`
        : `当前还不足以形成明确的机会方向，${m5Gap}。`,
    bullets: opportunities.length
      ? opportunities.map((item) => `[${item.scope}·${item.gap_type}] ${item.direction}（依据：${item.basis || '当前仍需结合领域对比继续补证'}）`)
      : ['当前还不足以形成稳定机会方向，建议先补齐时间线对照、验证路径和工程化证据。'],
    tone: 'success',
    highlight: `领域阶段：${safeText(m5.field_stage?.phase, '需继续核验')}`
  });

  sections.push({
    key: 'signals',
    title: '关键待验证信号',
    summary: signals.length
      ? '这类方向的关键不在论文热度，而在闭环能否扩展、结果能否外推到更高验证层级。'
      : `当前还没有形成稳定的待验证信号，${m5Gap}。`,
    bullets: signals.length
      ? signals.map((item) => `[${item.time_window}] ${item.trigger} → ${item.meaning}`)
      : ['建议继续观察独立复现结果、实验层级提升以及真实产品交付信号。'],
    tone: 'warning'
  });

  return sections;
};

const buildStructuredPipeline = (agentResult) => {
  const p0 = agentResult.p0 || getModuleData(agentResult, 'P0') || {};
  const m1 = agentResult.m1 || getModuleData(agentResult, 'M1') || {};
  const m2 = agentResult.m2 || getModuleData(agentResult, 'M2') || {};
  const m4 = agentResult.m4 || getModuleData(agentResult, 'M4') || {};
  const m5 = agentResult.m5 || getModuleData(agentResult, 'M5') || {};

  return [
    {
      key: 'quality',
      title: '解读质量结论',
      description:
        m1.exaggeration_level === '高'
          ? '存在明显夸大，不能直接据此下结论。'
          : m1.exaggeration_level === '中'
            ? '信息整体可读，但标题或结论有外推。'
            : '信息整体可靠，可作为原文导读。'
    },
    { key: 'source', title: '溯源一手材料', description: p0.source_hint || '可定位到论文、技术报告或官方说明。' },
    { key: 'claim', title: '核心价值提取', description: m2.core_claim || m2.innovation?.description || '已完成核心主张提取。' },
    {
      key: 'landscape',
      title: '同时间横向对比',
      description: m4.timeline?.this_work_position || '已完成领域时间线与横向对比。'
    },
    {
      key: 'investment',
      title: '投资信号推导',
      description: m5.field_stage?.main_driver || '已完成领域阶段与投资信号推导。'
    }
  ];
};

const buildStructuredTags = (agentResult) => {
  const m2 = agentResult.m2 || getModuleData(agentResult, 'M2');
  const searchKeywords = m2?.innovation?.search_keywords || [];
  return unique(searchKeywords).slice(0, 3);
};

const buildReportFromPayload = (payload = {}, agentResult = {}) => {
  const {
    content = '',
    articleUrl = '',
    sourceName = '用户导入内容',
    resolvedTitle = '',
    resolvedSourceName = '',
    resolvedPublishDate = '',
    originalMaterial = ''
  } = payload;
  const isStructuredAdapter = agentResult.adapter && agentResult.adapter !== 'mock-sop-agent';
  const reportId = inferReportIdFromContent(content || agentResult.articleType || '');
  const baseReport = getReportById(reportId) || reportLibrary[0];
  const report = isStructuredAdapter ? createStructuredReportSkeleton() : clone(baseReport);
  const createdAt = new Date().toISOString();
  const structuredP0 = agentResult.p0 || getModuleData(agentResult, 'P0');
  const structuredM1 = agentResult.m1 || getModuleData(agentResult, 'M1');
  const structuredM2 = agentResult.m2 || getModuleData(agentResult, 'M2');
  const structuredM3 = agentResult.m3 || getModuleData(agentResult, 'M3');
  const structuredM4 = agentResult.m4 || getModuleData(agentResult, 'M4');
  const structuredM5 = agentResult.m5 || getModuleData(agentResult, 'M5');

  report.id = `${isStructuredAdapter ? 'reread-report' : baseReport.id}-${Date.now()}`;
  report.generatedAt = createdAt;
  report.status = agentResult.reportStatus || (isStructuredAdapter ? '已完成 SOP 六模块分析' : '已通过后端分析引擎生成');
  report.articleSnapshot.articleUrl = articleUrl || report.articleSnapshot.articleUrl;
  report.articleSnapshot.sourceName = resolvedSourceName || sourceName || report.articleSnapshot.sourceName;
  report.account = resolvedSourceName || sourceName || report.account;

  if (resolvedTitle) {
    report.title = resolvedTitle;
  }

  if (resolvedPublishDate) {
    report.articleSnapshot.publishDate = resolvedPublishDate;
  }

  const mergedOriginalMaterial = joinMaterial(originalMaterial, structuredM2?.team?.related_company, structuredP0?.source_hint);
  if (mergedOriginalMaterial) {
    report.articleSnapshot.originalMaterial = mergedOriginalMaterial;
  }

  if (agentResult.articleType || structuredP0?.type) {
    report.articleType = agentResult.articleType || structuredP0.type;
  }

  if (agentResult.credibility || structuredM1?.credibility) {
    report.meta.credibility = normalizeRiskLevel(agentResult.credibility || structuredM1.credibility);
  }

  if (agentResult.hypeLevel || structuredM1?.exaggeration_level) {
    report.meta.hypeLevel = normalizeRiskLevel(agentResult.hypeLevel || structuredM1.exaggeration_level);
  }

  if (agentResult.toVcRisk) {
    report.meta.toVcRisk = normalizeToVcRisk(agentResult.toVcRisk);
  }

  if (agentResult.innovationType || structuredM2?.innovation?.type) {
    report.meta.innovationType = agentResult.innovationType || structuredM2.innovation.type;
  }

  if (structuredM3?.trl?.time_window?.tool_layer) {
    report.meta.trl = '';
    report.meta.industrialWindow = structuredM3.trl.time_window?.tool_layer || '需结合验证节奏继续判断';
  }

  if (structuredM3?.breakthrough?.degree) {
    report.meta.breakthroughDegree = structuredM3.breakthrough?.degree;
  }

  if (structuredM2?.to_vc_risk && structuredM2.to_vc_risk.level !== '不适用') {
    report.meta.toVcSignals = {
      narrative: structuredM2.to_vc_risk.narrative_signals || 0,
      timing: structuredM2.to_vc_risk.timing_signals || 0,
      technical: structuredM2.to_vc_risk.technical_signals || 0
    };
  }

  if (structuredM5?.field_stage) {
    report.meta.fieldStage = structuredM5.field_stage.phase;
  }

  if (structuredM2?.innovation?.description) {
    report.subtitle = `判断：${structuredM2.innovation.description}`;
  } else if (content) {
    report.subtitle = isStructuredAdapter
      ? '判断：已基于导入内容生成正式报告，关键结论仍需结合原文继续核验。'
      : `${baseReport.subtitle} 当前导入文本长度约 ${content.length} 字。`;
  }

  if (!report.coreClaim && structuredM2?.core_claim) {
    report.coreClaim = structuredM2.core_claim;
  }

  report.coreClaim = report.coreClaim || '当前公开材料更适合作为方向性线索，关键主张仍需结合原文和补充材料继续核验。';
  report.meta.innovationType = report.meta.innovationType || '需结合原文继续判断';
  report.meta.industrialWindow = report.meta.industrialWindow || '需结合验证节奏继续判断';
  report.meta.fieldStage = report.meta.fieldStage || '概念期';

  if (isStructuredAdapter) {
    report.sections = buildDynamicSections(payload, agentResult);
    report.pipeline = buildStructuredPipeline(agentResult);
    report.tags = buildStructuredTags(agentResult);
    report.articleSnapshot.sourceAuthor =
      structuredM2?.team?.lead_author || payload.sourceAuthor || report.articleSnapshot.sourceAuthor;

    if (structuredM4?.timeline) {
      const timeline = structuredM4.timeline;
      report.timeline = [
        { year: '奠基', title: timeline.origin || '', description: '' },
        { year: '当前前沿', title: timeline.current_frontier || '', description: '' },
        { year: '下一难题', title: timeline.next_challenge || '', description: '' },
        { year: '本文位置', title: timeline.this_work_position || '', description: '' }
      ].filter((item) => item.title);
    }

    const references = buildReferences(payload, structuredM4, report.title);
    if (references.length) {
      report.references = references;
    }

    report.coreInnovation = structuredM2?.innovation
      ? {
          type: structuredM2.innovation.type || '',
          description: structuredM2.innovation.description || '',
          searchKeywords: structuredM2.innovation.search_keywords || []
        }
      : report.coreInnovation;
    report.coreClaim = structuredM2?.core_claim || report.coreClaim || '';

    report.bottleneck = structuredM3?.bottleneck
      ? {
          description: structuredM3.bottleneck.description || '',
          whyUnsolved: structuredM3.bottleneck.why_unsolved || '',
          nextBottleneck: structuredM3.breakthrough?.next_bottleneck || ''
        }
      : report.bottleneck;

    report.productization = structuredM3?.productization
      ? {
          dataBarrier: {
            level: structuredM3.productization.data_barrier?.level || '',
            benchmark: structuredM3.productization.data_barrier?.benchmark || ''
          },
          computeCost: {
            level: structuredM3.productization.compute_cost?.level || '',
            benchmark: structuredM3.productization.compute_cost?.benchmark || ''
          },
          engineeringGap: {
            level: structuredM3.productization.engineering_gap?.level || '',
            note: structuredM3.productization.engineering_gap?.note || ''
          },
          regulation: {
            level: structuredM3.productization.regulation?.level || '',
            benchmark: structuredM3.productization.regulation?.benchmark || ''
          }
        }
      : report.productization;

    report.overseasWorks = (structuredM4?.overseas_works || []).map((item) => ({
      name: item.name || '',
      institution: item.institution || '',
      date: item.date || '',
      intro: buildOverseasIntro(item),
      timelinePosition: item.timeline_position || '',
      solved: item.solved || '',
      unsolved: item.unsolved || '',
      refUrl: item.ref_url || ''
    }));

    report.chinaTeams = (structuredM4?.china_teams || [])
      .filter((item) => item.match_degree !== '表面相关')
      .map((item) => ({
        name: item.name || '',
        work: item.work || '',
        timelinePosition: item.timeline_position || '',
        attribute: item.attribute || '学术',
        matchDegree: item.match_degree || '表面相关',
        gap: item.gap || '',
        commercialization: item.commercialization || null,
        refUrl: item.ref_url || ''
      }));

    report.opportunities = (structuredM5?.opportunities || []).map((item) => ({
      direction: item.direction || '',
      basis: item.basis || '',
      gapType: item.gap_type || '验证空缺',
      scope: item.scope || '全球'
    }));

    report.investmentSignals = (structuredM5?.signals || []).map((item) => ({
      trigger: item.trigger || '',
      meaning: item.meaning || '',
      timeWindow: item.time_window || '不确定'
    }));

    report.hyperDetail = {
      issues: structuredM1?.issues || []
    };

    report.teamDetail = structuredM2
      ? {
          leadAuthor: structuredM2.team?.lead_author || '',
          institution: structuredM2.team?.institution || '',
          relatedCompany: structuredM2.team?.related_company || null,
          fundingInfo: structuredM2.team?.funding_info || null,
          chinaConnection: structuredM2.team?.china_connection || null,
          commercialIntent: structuredM2.commercial_intent || ''
        }
      : report.teamDetail;
  } else {
    if (agentResult.signals?.length) {
      report.sections = [
        {
          key: 'agentSignals',
          title: 'Agent 信号提取',
          summary: '以下内容来自后端研究型 Agent 的结构化判断。',
          bullets: agentResult.signals,
          tone: 'info',
          highlight: agentResult.adapter || 'agent'
        },
        ...report.sections
      ];
    }

    if (agentResult.missingItems?.length) {
      report.sections.push({
        key: 'agentMissingItems',
        title: '当前仍需补证的部分',
        summary: '以下内容是当前报告尚未完全补齐的证据空白，建议作为后续核查清单继续跟进。',
        bullets: agentResult.missingItems.map((item) => buildFormalGapText(item, '当前仍需补充一手材料或第三方证据。')),
        tone: 'warning'
      });
    }

    if (agentResult.followups?.length) {
      report.sections.push({
        key: 'agentFollowups',
        title: '后续跟踪建议',
        summary: '以下建议已整理成后续研究动作，便于继续追踪原文、实验和商业化信号。',
        bullets: agentResult.followups.map((item) => safeText(item, '建议继续观察原文、实验验证与产品化进展。')),
        tone: 'success'
      });
    }
  }

  return report;
};

module.exports = {
  inferReportIdFromContent,
  buildReportFromPayload
};
