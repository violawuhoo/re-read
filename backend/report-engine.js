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

const buildDynamicSections = (payload, agentResult) => {
  const { p0 = {}, m1 = {}, m2 = {}, m3 = {}, m4 = {}, m5 = {} } = agentResult;
  const sections = [];
  const toVcLevel = m2.to_vc_risk?.level;
  const overseasWorks = m4.overseas_works || [];
  const chinaTeams = m4.china_teams || [];
  const opportunities = m5.opportunities || [];
  const signals = m5.signals || [];
  const commercializedChinaTeams = chinaTeams.filter((item) => item.attribute === '商业产品').length;
  const domesticOpportunityCount = opportunities.filter((item) => item.scope === '国内').length;

  sections.push({
    key: 'quality',
    title: '公众号质量评估',
    summary: m1.summary || '评估完成',
    bullets: [
      `作者背景：${m1.author_background || '未知'}`,
      `是否有利益相关：${asYesNo(m1.interest_conflict)}`,
      `建议直接参考公众号：${asYesNo(m1.recommend_original)}`
    ],
    tone: m1.credibility === '低' ? 'warning' : 'info',
    highlight: `可信度：${m1.credibility || '中'}`
  });

  sections.push({
    key: 'hype',
    title: '夸大检测',
    summary:
      m1.exaggeration_level === '高'
        ? '发现多处夸大，建议对照原文核实'
        : m1.exaggeration_level === '中'
          ? '存在轻度夸大'
          : '未发现明显夸大',
    bullets: (m1.issues || []).length
      ? m1.issues.map((item) => `[${item.type}·${item.severity}] 公众号：${item.claim} → 实际：${item.reality}`)
      : ['未发现明显夸大问题'],
    tone: ['高', '中'].includes(m1.exaggeration_level) ? 'warning' : 'default',
    highlight: `夸大程度：${m1.exaggeration_level || '中'}；建议参考原文：${asYesNo(m1.recommend_original)}`
  });

  sections.push({
    key: 'team',
    title: '团队背景与商业意图',
    summary: m2.commercial_intent || '',
    bullets: [
      m2.team?.lead_author ? `通讯作者：${m2.team.lead_author}（${m2.team.institution || '未知机构'}）` : null,
      m2.team?.related_company ? `关联公司：${m2.team.related_company}` : null,
      m2.team?.funding_info ? `融资信息：${m2.team.funding_info}` : null,
      m2.team?.china_connection ? `中国关联：${m2.team.china_connection}` : null,
      toVcLevel && toVcLevel !== '不适用'
        ? `To VC 风险计数：叙事${m2.to_vc_risk?.narrative_signals || 0}·时间${m2.to_vc_risk?.timing_signals || 0}·技术${m2.to_vc_risk?.technical_signals || 0}，${m2.to_vc_risk?.note || '暂无补充说明'}`
        : null
    ].filter(Boolean),
    tone: ['高', '中'].includes(toVcLevel) ? 'warning' : 'default',
    highlight: toVcLevel && toVcLevel !== '不适用' ? `To VC 风险：${toVcLevel}` : undefined
  });

  sections.push({
    key: 'claim',
    title: '核心 Claim',
    summary: m2.core_claim || '',
    bullets: ((m2.limitations || []).length ? m2.limitations : ['未发现自述局限']).map((item) => `局限：${item}`),
    highlight: `创新点类型：${m2.innovation?.type || ''}`
  });

  sections.push({
    key: 'innovation',
    title: '创新点识别',
    summary: m2.innovation?.description || '',
    bullets: ((m2.innovation?.search_keywords || []).length ? m2.innovation.search_keywords : ['待补充检索词']).map((item) => `检索词：${item}`),
    highlight: `创新点类型：${m2.innovation?.type || ''}`,
    tone: 'success'
  });

  sections.push({
    key: 'bottleneck',
    title: '领域瓶颈与突破程度',
    summary: m3.bottleneck?.description || '',
    bullets: [
      `之前未解决原因：${m3.bottleneck?.why_unsolved || ''}`,
      `突破说明：${m3.breakthrough?.explanation || ''}`,
      `下一个瓶颈：${m3.breakthrough?.next_bottleneck || ''}`
    ].filter(Boolean),
    highlight: `突破程度：${m3.breakthrough?.degree || ''}`
  });

  const productization = m3.productization || {};
  const trlLabel = m3.trl?.score ? `TRL ${m3.trl.score}/9` : 'TRL 待判断';
  sections.push({
    key: 'industrial',
    title: '产业化可行性',
    summary: `${trlLabel}，参照：${m3.trl?.reference_case || '待补充参照案例'}`,
    bullets: [
      `数据壁垒：${productization.data_barrier?.level || '待判断'}（${productization.data_barrier?.benchmark || '待补充'}）`,
      `算力成本：${productization.compute_cost?.level || '待判断'}（${productization.compute_cost?.benchmark || '待补充'}）`,
      `工程化 gap：${productization.engineering_gap?.level || '待判断'}（${productization.engineering_gap?.note || '待补充'}）`,
      `监管路径：${productization.regulation?.level || '待判断'}（${productization.regulation?.benchmark || '待补充'}）`,
      `工具层商业化：${m3.trl?.time_window?.tool_layer || '待判断'}`,
      `应用层商业化：${m3.trl?.time_window?.application_layer || '待判断'}`
    ],
    tone: 'info',
    highlight: trlLabel
  });

  sections.push({
    key: 'timeline',
    title: '领域发展时间线',
    summary: `本文位置：${m4.timeline?.this_work_position || ''}`,
    bullets: [
      `奠基性工作：${m4.timeline?.origin || ''}`,
      `当前前沿：${m4.timeline?.current_frontier || ''}`,
      `下一难题：${m4.timeline?.next_challenge || ''}`
    ].filter(Boolean)
  });

  sections.push({
    key: 'overseas',
    title: '海外代表性工作',
    summary: `找到 ${overseasWorks.length} 篇代表性工作，按时间线位置排列`,
    bullets: overseasWorks.length
      ? overseasWorks.map(
          (item) =>
            `${item.name}（${item.institution}，${item.date}）· 时间线：${item.timeline_position} · 解决：${item.solved} · 未解决：${item.unsolved} · ${item.ref_url || '链接缺失'}`
        )
      : ['暂未找到满足条件的海外代表性工作']
  });

  sections.push({
    key: 'domestic',
    title: '国内研究扫描',
    summary: `找到 ${chinaTeams.length} 个相关团队（含 ${commercializedChinaTeams} 个商业产品）`,
    bullets: chinaTeams.length
      ? chinaTeams.map((item) => {
          const commercializationSuffix = item.commercialization ? ` · 转化：${item.commercialization}` : '';
          return `${item.name}（${item.attribute}·${item.match_degree}）· ${item.work} · 差距：${item.gap}${commercializationSuffix}`;
        })
      : ['暂未找到满足条件的国内团队']
  });

  sections.push({
    key: 'opportunity',
    title: '投资机会分析',
    summary: `领域处于${m5.field_stage?.phase || '待判断'}，发现 ${opportunities.length} 个机会方向（含 ${domesticOpportunityCount} 个国内窗口）· 主要驱动力：${m5.field_stage?.main_driver || '待判断'}`,
    bullets: opportunities.length
      ? opportunities.map((item) => `[${item.scope}·${item.gap_type}] ${item.direction}（依据：${item.basis || '待补充'}）`)
      : ['暂未形成明确的机会方向'],
    tone: 'success',
    highlight: `领域阶段：${m5.field_stage?.phase || '待判断'}`
  });

  sections.push({
    key: 'signals',
    title: '关键待验证信号',
    summary: `以下 ${signals.length} 个信号出现时，意味着可以进入下一步判断 · 最大不确定性：${m5.field_stage?.key_uncertainty || '待判断'}`,
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
    { key: 'type', title: '内容价值预判', description: p0.reason || '已完成文章类型识别' },
    { key: 'source', title: '溯源一手材料', description: p0.source_hint || '暂未识别到论文或报告来源' },
    { key: 'quality', title: '公众号质量评估', description: m1.summary || '已完成可信度与夸大检测' },
    { key: 'claim', title: '核心创新提取', description: m2.innovation?.description || '已完成核心 Claim 与创新点提取' },
    { key: 'landscape', title: '时间线与横向对比', description: m4.timeline?.this_work_position || '已完成领域时间线与横向扫描' },
    {
      key: 'investment',
      title: '投资信号推导',
      description: [m5.field_stage?.phase, m5.field_stage?.main_driver].filter(Boolean).join(' · ') || '已完成领域阶段与投资信号推导'
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
    report.meta.trl = `TRL ${structuredM3.trl.score}/9`;
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
    report.subtitle = structuredM2.innovation.description;
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

    const references = [];
    if (payload.articleUrl) {
      references.push({
        id: 'Ref 0',
        author: payload.resolvedSourceName || payload.sourceName || '公众号原文',
        title: payload.resolvedTitle || report.title,
        link: payload.articleUrl
      });
    }
    (structuredM4?.overseas_works || []).filter((item) => item.ref_url).forEach((item, index) => {
      references.push({
        id: `Ref ${index + 1}`,
        author: item.institution || '',
        title: item.name || '',
        link: item.ref_url
      });
    });
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
      timelinePosition: item.timeline_position || '',
      solved: item.solved || '',
      unsolved: item.unsolved || '',
      refUrl: item.ref_url || ''
    }));

    report.chinaTeams = (structuredM4?.china_teams || []).map((item) => ({
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
