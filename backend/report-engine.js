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
const safeText = (value, fallback = '待判断') => value || fallback;
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
    return '验证了闭环可行性';
  }
  if (degree === '完全解决') {
    return '核心瓶颈已被实质性解决';
  }
  if (degree === '绕过问题') {
    return '通过替代路径实现阶段性推进';
  }
  return '待判断';
};
const formatIndustrialStage = (phase = '') => {
  if (phase === '商业化期') {
    return '早期平台化窗口';
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
  return '待判断';
};
const buildQualityConclusion = (m1 = {}) => {
  if (m1.recommend_original && m1.exaggeration_level === '低') {
    return '结论：这篇公众号可以作为快速导读，也可直接作为进入原文前的参考。';
  }
  if (m1.recommend_original) {
    return '结论：这篇公众号适合作为快速导读，但不能直接替代原文判断。';
  }
  return '结论：这篇公众号更适合作为线索提示，关键结论仍需回到原文核对。';
};
const buildQualityBoundary = (m1 = {}) => {
  if (m1.exaggeration_level === '高') {
    return '边界：标题和结论外推较多，不能直接据此下判断。';
  }
  if (m1.exaggeration_level === '中') {
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

const buildDynamicSections = (payload, agentResult) => {
  const { p0 = {}, m1 = {}, m2 = {}, m3 = {}, m4 = {}, m5 = {} } = agentResult;
  const sections = [];
  const overseasWorks = m4.overseas_works || [];
  const chinaTeams = (m4.china_teams || []).filter((item) => item.match_degree !== '表面相关');
  const opportunities = m5.opportunities || [];
  const signals = m5.signals || [];

  sections.push({
    key: 'quality',
    title: '公众号质量评估',
    summary: m1.summary || '已完成公众号质量评估。',
    bullets: [
      buildQualityConclusion(m1),
      `作者背景：${safeText(m1.author_background, '未知')}`,
      `证据：${m1.interest_conflict ? '存在利益相关，需要谨慎解读' : '未发现直接利益相关'}；建议参考原文：${asYesNo(m1.recommend_original)}`,
      buildQualityBoundary(m1)
    ],
    tone: m1.credibility === '低' ? 'warning' : 'info',
    highlight: `可信度：${m1.credibility || '中'}`
  });

  sections.push({
    key: 'hype',
    title: '夸大检测',
    summary:
      m1.exaggeration_level === '高'
        ? '主要问题集中在结论外推和局限省略，建议逐条对照原文核查。'
        : m1.exaggeration_level === '中'
          ? '主要问题在于标题或结论外推，关键信息边界需要回到原文确认。'
          : '未发现明显夸大，公众号表述与原文基本一致。',
    bullets: [],
    tone: ['高', '中'].includes(m1.exaggeration_level) ? 'warning' : 'default',
    highlight: `夸大程度：${m1.exaggeration_level || '中'}；建议参考原文：${asYesNo(m1.recommend_original)}`
  });

  sections.push({
    key: 'team',
    title: '团队背景与商业意图',
    summary: m2.commercial_intent || '已完成团队与用途分析。',
    bullets: [
      m2.team?.lead_author ? `通讯作者：${m2.team.lead_author}${m2.team.institution ? `（${m2.team.institution}）` : ''}` : null,
      m2.team?.related_company ? `关联公司：${m2.team.related_company}` : null,
      m2.team?.funding_info ? `融资信息：${m2.team.funding_info}` : null,
      m2.team?.china_connection ? `中国关联：${m2.team.china_connection}` : null,
      m2.commercial_intent ? `商业意图：${m2.commercial_intent}` : null
    ].filter(Boolean),
    tone: 'default'
  });

  sections.push({
    key: 'claim',
    title: '核心 Claim',
    summary: m2.core_claim || '已完成核心主张提取。',
    bullets: buildClaimBullets(m2.core_claim, m2.limitations || [])
  });

  sections.push({
    key: 'innovation',
    title: '创新点识别',
    summary: m2.innovation?.description || '已完成创新点识别。',
    bullets: [
      `创新类型：${safeText(m2.innovation?.type)}`,
      `一句话概括：${safeText(m2.innovation?.description)}`,
      `相关关键词：${(m2.innovation?.search_keywords || []).join(' / ') || '待补充'}`
    ],
    highlight: `创新点类型：${m2.innovation?.type || ''}`,
    tone: 'success'
  });

  sections.push({
    key: 'bottleneck',
    title: '领域瓶颈与突破程度',
    summary: m3.bottleneck?.description || '',
    bullets: [
      `之前未解决原因：${safeText(m3.bottleneck?.why_unsolved, '')}`,
      `突破说明：${safeText(m3.breakthrough?.explanation, '')}`,
      `下一个瓶颈：${safeText(m3.breakthrough?.next_bottleneck, '')}`
    ].filter(Boolean),
    highlight: `突破判断：${formatBreakthroughLabel(m3.breakthrough?.degree)}`
  });

  const productization = m3.productization || {};
  sections.push({
    key: 'industrial',
    title: '产业化可行性',
    summary: `研究能力已经被证明，但距离稳定的平台化交付仍有明显工程距离，现阶段更接近${formatIndustrialStage(m5.field_stage?.phase)}。`,
    bullets: [
      `数据壁垒：${productization.data_barrier?.level || '待判断'}；${productization.data_barrier?.benchmark || '待补充'}`,
      `算力成本：${productization.compute_cost?.level || '待判断'}；${productization.compute_cost?.benchmark || '待补充'}`,
      `工程化 gap：${productization.engineering_gap?.level || '待判断'}；${productization.engineering_gap?.note || '待补充'}`,
      `监管路径：${productization.regulation?.level || '待判断'}；${productization.regulation?.benchmark || '待补充'}`,
      `工具层商业化：${m3.trl?.time_window?.tool_layer || '待判断'}`,
      `应用层商业化：${m3.trl?.time_window?.application_layer || '待判断'}`
    ],
    tone: 'info',
    highlight: `当前阶段：${formatIndustrialStage(m5.field_stage?.phase)}`
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
    summary: overseasWorks.length ? '近两年，闭环科研系统开始成为海外的核心对比方向。' : '暂未找到满足条件的海外代表性工作。',
    bullets: []
  });

  sections.push({
    key: 'domestic',
    title: '国内研究扫描',
    summary: chinaTeams.length ? '国内已有相关平台和框架，但公开工作仍以局部闭环为主。' : '暂未找到满足条件的国内团队。',
    bullets: []
  });

  sections.push({
    key: 'opportunity',
    title: '投资机会分析',
    summary:
      opportunities.length && m5.field_stage?.phase
        ? `这个方向当前更像平台层和配套层的窗口，而不是立刻出现大规模终局赢家的阶段。`
        : '暂未形成明确的机会方向。',
    bullets: opportunities.length
      ? opportunities.map((item) => `[${item.scope}·${item.gap_type}] ${item.direction}（依据：${item.basis || '待补充'}）`)
      : ['暂未形成明确的机会方向'],
    tone: 'success',
    highlight: `领域阶段：${m5.field_stage?.phase || '待判断'}`
  });

  sections.push({
    key: 'signals',
    title: '关键待验证信号',
    summary: signals.length
      ? '这类方向的关键不在论文热度，而在闭环能否扩展、结果能否外推到更高验证层级。'
      : '暂无待验证信号。',
    bullets: signals.length ? signals.map((item) => `[${item.time_window}] ${item.trigger} → ${item.meaning}`) : ['暂无待验证信号'],
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
  const reportId = inferReportIdFromContent(content || agentResult.articleType || '');
  const baseReport = getReportById(reportId) || reportLibrary[0];
  const report = clone(baseReport);
  const createdAt = new Date().toISOString();
  const structuredP0 = agentResult.p0 || getModuleData(agentResult, 'P0');
  const structuredM1 = agentResult.m1 || getModuleData(agentResult, 'M1');
  const structuredM2 = agentResult.m2 || getModuleData(agentResult, 'M2');
  const structuredM3 = agentResult.m3 || getModuleData(agentResult, 'M3');
  const structuredM4 = agentResult.m4 || getModuleData(agentResult, 'M4');
  const structuredM5 = agentResult.m5 || getModuleData(agentResult, 'M5');

  report.id = `${baseReport.id}-${Date.now()}`;
  report.generatedAt = createdAt;
  report.status = agentResult.reportStatus || '已通过后端分析引擎生成';
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

  if (agentResult.articleType) {
    report.articleType = agentResult.articleType;
  }

  if (agentResult.credibility) {
    report.meta.credibility = agentResult.credibility;
  }

  if (agentResult.hypeLevel) {
    report.meta.hypeLevel = agentResult.hypeLevel;
  }

  if (agentResult.toVcRisk) {
    report.meta.toVcRisk = normalizeToVcRisk(agentResult.toVcRisk);
  }

  if (agentResult.innovationType) {
    report.meta.innovationType = agentResult.innovationType;
  }

  if (structuredM3?.trl?.score) {
    report.meta.trl = '';
    report.meta.industrialWindow = structuredM3.trl.time_window?.tool_layer || '待判断';
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
    report.subtitle = `${baseReport.subtitle} 当前导入文本长度约 ${content.length} 字。`;
  }

  if (agentResult.adapter && agentResult.adapter !== 'mock-sop-agent') {
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
        title: '缺失项提示',
        summary: '后端 Agent 检测到以下缺失项，需要后续继续补证。',
        bullets: agentResult.missingItems,
        tone: 'warning'
      });
    }

    if (agentResult.followups?.length) {
      report.sections.push({
        key: 'agentFollowups',
        title: '后续跟踪建议',
        summary: '以下建议来自 SOP Agent，用于后续研究动作。',
        bullets: agentResult.followups,
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
