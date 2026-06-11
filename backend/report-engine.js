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
const createContentPreview = (content = '') =>
  content
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);

const buildDynamicSections = (payload, agentResult) => {
  const preview = createContentPreview(payload.content || '');
  const sections = [];

  sections.push({
    key: 'agentSignals',
    title: 'Agent 信号提取',
    summary: '以下内容来自当前文章的真实模型解读结果。',
    bullets: agentResult.signals?.length ? agentResult.signals : ['当前模型未返回明确信号，请继续查看原文与完整报告。'],
    tone: 'info',
    highlight: agentResult.adapter || 'agent'
  });

  sections.push({
    key: 'articleSnapshot',
    title: '当前文章快照',
    summary: '以下信息直接来自当前抓取到的公众号文章，用于确认本次解读对象。',
    bullets: [
      `标题：${payload.resolvedTitle || '未解析到标题'}`,
      `来源：${payload.resolvedSourceName || payload.sourceName || '未解析到公众号名'}`,
      `发布时间：${payload.resolvedPublishDate || '未解析到发布时间'}`,
      `正文片段：${preview || '未抓取到正文片段'}`
    ],
    tone: 'default'
  });

  sections.push({
    key: 'agentConclusion',
    title: '模型结论',
    summary: agentResult.reportStatus || '当前模型未返回摘要性判断。',
    bullets: [
      `文章类型：${agentResult.articleType || '未判断'}`,
      `公众号可信度：${agentResult.credibility || '未判断'}`,
      `夸大程度：${agentResult.hypeLevel || '未判断'}`,
      `创新点类型：${agentResult.innovationType || '未判断'}`,
      `To VC 风险：${agentResult.toVcRisk || '不适用'}`
    ],
    tone: 'success'
  });

  if (agentResult.missingItems?.length) {
    sections.push({
      key: 'agentMissingItems',
      title: '缺失项提示',
      summary: '当前文章要继续进入完整投资研究，还需要补齐以下缺失信息。',
      bullets: agentResult.missingItems,
      tone: 'warning'
    });
  }

  if (agentResult.followups?.length) {
    sections.push({
      key: 'agentFollowups',
      title: '后续跟踪建议',
      summary: '以下建议来自当前模型输出，用于继续追踪这篇文章所涉及的方向。',
      bullets: agentResult.followups,
      tone: 'success'
    });
  }

  return sections;
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

  if (originalMaterial) {
    report.articleSnapshot.originalMaterial = originalMaterial;
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

  if (content) {
    report.subtitle = `${baseReport.subtitle} 当前导入文本长度约 ${content.length} 字。`;
  }

  if (agentResult.adapter && agentResult.adapter !== 'mock-sop-agent') {
    report.sections = buildDynamicSections(payload, agentResult);
    report.references = articleUrl
      ? [
          {
            id: 'Ref 1',
            author: resolvedSourceName || sourceName || '公众号原文',
            title: resolvedTitle || report.title,
            link: articleUrl
          }
        ]
      : report.references;
    report.timeline = [
      {
        year: resolvedPublishDate || new Date().toISOString().slice(0, 10),
        title: '当前文章进入解读流程',
        description: '本次时间线暂以当前文章为锚点，待后续补齐领域历史对照。'
      }
    ];
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
