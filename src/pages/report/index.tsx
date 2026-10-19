import React, { useEffect, useMemo, useState } from 'react';
import { Button, Text, View } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { mockTemplateReport } from '@/data/mock-report';
import { fetchReportById } from '@/services/reread';
import { getReportById } from '@/data/report';
import { AnalysisSection, AnalysisStep, ReferenceItem, ReportRecord, TimelineItem } from '@/types/reread';
import styles from './index.module.scss';



const SECTION_ORDER = ['quality', 'hype', 'team', 'claim', 'innovation', 'bottleneck', 'industrial', 'timeline', 'overseas', 'domestic', 'opportunity', 'signals'];
const SECTION_GROUPS = [
  {
    key: 'article-review',
    title: '公众号文章评价',
    description: '判断这篇公众号讲得是否准确，哪些地方值得直接参考，哪些地方需要回到原文核对。',
    sectionKeys: ['quality', 'hype']
  },
  {
    key: 'source-analysis',
    title: '原文与产品分析',
    description: '回到原始论文或产品本身，看团队背景、核心主张、创新点，以及作者自己承认的限制。',
    sectionKeys: ['team', 'claim', 'innovation']
  },
  {
    key: 'field-analysis',
    title: '领域分析',
    description: '把这个工作放回领域时间线和横向对比里，判断它解决了什么，还缺什么。',
    sectionKeys: ['bottleneck', 'industrial', 'timeline', 'overseas', 'domestic']
  },
  {
    key: 'investment-guide',
    title: '投资引导',
    description: '从研究判断推到投资判断，只保留机会方向和待验证信号，不展开标的推荐。',
    sectionKeys: ['opportunity', 'signals']
  }
] as const;
const SECTION_TITLE_OVERRIDES: Record<string, string> = {
  quality: '质量评估',
  team: '团队与用途',
  claim: '核心 Claim',
  innovation: '创新点识别',
  bottleneck: '领域瓶颈',
  timeline: '时间线位置',
  overseas: '海外相关工作',
  domestic: '国内相关工作',
  signals: '验证信号'
};

const sectionNumber = (key: string) => {
  const index = SECTION_ORDER.indexOf(key);
  return index >= 0 ? String(index + 1).padStart(2, '0') : '··';
};

const ReportPage: React.FC = () => {
  const router = useRouter();
  const isMockPreview = router.params.mock === '1';
  const fallbackReport = useMemo(() => {
    if (isMockPreview) {
      return mockTemplateReport;
    }

    return getReportById(router.params.id) || null;
  }, [isMockPreview, router.params.id]);
  const [report, setReport] = useState<ReportRecord | null>(fallbackReport);
  const [isRemoteLoading, setIsRemoteLoading] = useState(Boolean(!isMockPreview && router.params.id && !fallbackReport));
  const [remoteStatusMessage, setRemoteStatusMessage] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {

    setReport(fallbackReport);
    setRemoteStatusMessage('');
    setIsRemoteLoading(Boolean(!isMockPreview && router.params.id && !fallbackReport));
  }, [fallbackReport, isMockPreview, router.params.id]);

  useEffect(() => {
    let isMounted = true;



    const loadRemoteReport = async () => {
      if (isMockPreview || !router.params.id) {
        setIsRemoteLoading(false);
        return;
      }

      setIsRemoteLoading(true);
      setRemoteStatusMessage('');
      const remoteReport = await fetchReportById(router.params.id);
      if (remoteReport && isMounted) {

        setReport(remoteReport);
        setRemoteStatusMessage('');
        setIsRemoteLoading(false);
        return;
      }

      if (!isMounted) {
        return;
      }

      setIsRemoteLoading(false);
      setRemoteStatusMessage(fallbackReport ? '远端报告暂时不可达，当前展示本地缓存版本。' : '报告详情暂时不可用，请稍后重试。');
    };

    loadRemoteReport().catch((error) => {
      console.warn('[ReportPage] fetch remote report failed', error);
      if (!isMounted) {
        return;
      }
      setIsRemoteLoading(false);
      setRemoteStatusMessage(fallbackReport ? '远端报告加载失败，当前展示本地缓存版本。' : '报告详情加载失败，请稍后重试。');
    });

    return () => {

      isMounted = false;
    };
  }, [fallbackReport, isMockPreview, reloadToken, router.params.id]);

  useEffect(() => {
    if (!report) {
      return;
    }

  }, [report]);

  const degradedModuleCount = useMemo(() => {
    const matched = report?.status?.match(/部分模块降级\((\d+)\)/);
    return matched ? Number(matched[1]) : 0;
  }, [report?.status]);

  const missingSectionTitles = useMemo(
    () =>
      report
        ? SECTION_ORDER.filter((key) => !report.sections.some((section) => section.key === key)).map((key) => SECTION_TITLE_OVERRIDES[key] || key)
        : [],
    [report]
  );

  const pageWarnings = useMemo(() => {
    if (!report) {
      return [];
    }

    const warnings: string[] = [];

    if (degradedModuleCount > 0) {
      warnings.push(`本次真实生成中有 ${degradedModuleCount} 个模块走了降级路径，报告可读，但个别判断可能比模板版更保守。`);
    }

    if (missingSectionTitles.length) {
      warnings.push(`以下 section 暂未完整返回：${missingSectionTitles.join('、')}。`);
    }

    if (!report.references.length) {
      warnings.push('当前没有返回参考文献，建议结合原文链接继续核查。');
    }

    return warnings;
  }, [degradedModuleCount, missingSectionTitles, report]);

  const sectionMap = useMemo(
    () =>
      (report?.sections || []).reduce<Record<string, AnalysisSection>>((accumulator: Record<string, AnalysisSection>, section: AnalysisSection) => {
        accumulator[section.key] = section;
        return accumulator;
      }, {}),
    [report?.sections]
  );

  const structuredSections = useMemo(() => SECTION_ORDER.map((key) => sectionMap[key]).filter(Boolean), [sectionMap]);
  const isStructuredReport = structuredSections.length >= 6;
  const groupedSections = useMemo(
    () =>
      SECTION_GROUPS.map((group) => ({
        ...group,
        sections: group.sectionKeys.map((key: string) => sectionMap[key]).filter(Boolean)
      })).filter((group) => group.sections.length),
    [sectionMap]
  );
  const metricItems = useMemo(
    () =>
      [
        { label: '创新类型', value: report?.meta.innovationType || '待判断' },
        {
          label: '突破判断',
          value:
            report?.meta.breakthroughDegree === '部分缓解'
              ? '验证了闭环可行性，但没有解决规模化与自动化'
              : report?.meta.breakthroughDegree === '完全解决'
                ? '核心瓶颈已被实质性解决'
                : report?.meta.breakthroughDegree === '绕过问题'
                  ? '通过替代路径实现阶段性推进'
                  : '待判断'
        },
        { label: '产业化窗口', value: report?.meta.industrialWindow || '待判断' },
        { label: '领域阶段', value: report?.meta.fieldStage || '待判断' }
      ].filter((item) => item.value),
    [report?.meta.breakthroughDegree, report?.meta.fieldStage, report?.meta.industrialWindow, report?.meta.innovationType]
  );
  const referenceMap = useMemo(
    () =>
      (report?.references || []).reduce<Record<string, ReferenceItem>>((accumulator: Record<string, ReferenceItem>, reference: ReferenceItem) => {
        accumulator[reference.link] = reference;
        return accumulator;
      }, {}),
    [report?.references]
  );

  const handleRetryLoad = () => {
    setRemoteStatusMessage('');
    setReloadToken((value) => value + 1);
  };

  const handleCopyLink = async (link: string) => {
    try {
      await Taro.setClipboardData({ data: link });
      Taro.showToast({ title: '链接已复制', icon: 'success' });
    } catch (error) {
      console.error('[ReportPage] copy link failed', error);
      Taro.showToast({ title: '复制失败', icon: 'error' });
    }
  };

  const handleReadAnother = () => {
    Taro.switchTab({ url: '/pages/index/index' });
  };

  const getReferenceId = (link?: string) => {
    if (!link) {
      return '';
    }

    return referenceMap[link]?.id || '';
  };

  const formatIssueType = (type: string) => type.replace(/^[A-Z]\s*/, '');

  const splitClaimBlocks = (section: AnalysisSection) => {
    const claims = section.bullets.filter((bullet) => bullet.startsWith('主张'));
    const limits = section.bullets.filter((bullet) => bullet.startsWith('局限'));
    return { claims, limits };
  };

  const splitInnovationBullets = (section: AnalysisSection) => {
    const keywordLine = section.bullets.find((bullet) => bullet.startsWith('相关关键词：'));
    const regularBullets = section.bullets.filter((bullet) => !bullet.startsWith('相关关键词：'));
    const keywords = keywordLine
      ? keywordLine
          .replace(/^相关关键词[:：]\s*/, '')
          .split('/')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
    return { regularBullets, keywords };
  };

  const renderIssueTable = () => {
    const issues = report?.hyperDetail?.issues || [];
    if (!issues.length) {
      return null;
    }

    return (
      <View className={styles.compareTable}>
        <View className={`${styles.compareRow} ${styles.compareHeader}`}>
          <Text className={styles.compareType}>问题</Text>
          <Text className={styles.compareCell}>公众号表述</Text>
          <Text className={styles.compareCell}>实际情况</Text>
        </View>
        {issues.map((issue) => (
          <View key={`${issue.type}-${issue.claim}`} className={styles.compareRow}>
            <View className={styles.compareTypeWrap}>
              <Text className={styles.compareType}>{formatIssueType(issue.type)}</Text>
              {issue.severity ? <Text className={styles.compareSeverity}>{issue.severity}</Text> : null}
            </View>
            <Text className={styles.compareCell}>{issue.claim}</Text>
            <Text className={styles.compareCell}>{issue.reality}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderWorkCards = (kind: 'overseas' | 'domestic') => {
    if (kind === 'overseas') {
      if (!report?.overseasWorks?.length) {
        return <Text className={styles.emptyText}>暂未返回可展示的海外相关工作，建议结合原文与参考文献继续核查。</Text>;
      }

      return (
        <View className={styles.workStack}>
          {(report.overseasWorks || []).map((work) => {
            const refId = getReferenceId(work.refUrl);
            return (
              <View key={`${work.name}-${work.date}`} className={styles.workCard}>
                <Text className={styles.workTitle}>
                  {work.name}（{work.institution}，{work.date}）
                  {refId ? <Text className={styles.refInline}> [{refId}]</Text> : null}
                </Text>
                {work.intro ? <Text className={styles.workIntro}>工作简介：{work.intro}</Text> : null}
                <Text className={styles.workLine}>时间线位置：{work.timelinePosition}</Text>
                <Text className={styles.workLine}>解决了什么：{work.solved}</Text>
                <Text className={styles.workLine}>还没解决什么：{work.unsolved}</Text>
              </View>
            );
          })}
        </View>
      );
    }

    if (!report?.chinaTeams?.length) {
      return <Text className={styles.emptyText}>暂未返回可展示的国内相关团队，本次报告先保留正式结构。</Text>;
    }

    return (
      <View className={styles.workStack}>
        {(report.chinaTeams || []).map((team) => {
          const refId = getReferenceId(team.refUrl);
          return (
            <View key={`${team.name}-${team.attribute}`} className={styles.workCard}>
              <Text className={styles.workTitle}>
                {team.name}（{team.attribute}，{team.matchDegree}）
                {refId ? <Text className={styles.refInline}> [{refId}]</Text> : null}
              </Text>
              <Text className={styles.workLine}>时间线位置：{team.timelinePosition}</Text>
              <Text className={styles.workLine}>具体工作：{team.work}</Text>
              <Text className={styles.workLine}>与国际前沿差距：{team.gap}</Text>
              {team.commercialization ? <Text className={styles.workLine}>转化迹象：{team.commercialization}</Text> : null}
            </View>
          );
        })}
      </View>
    );
  };

  const renderOpportunityCards = () => {
    const opportunities = report?.opportunities || [];
    if (!opportunities.length) {
      return <Text className={styles.emptyText}>本次没有形成稳定的机会方向，建议先回到领域判断与参考文献继续核查。</Text>;
    }

    return (
      <View className={styles.investmentStack}>
        {opportunities.map((item) => (
          <View key={`${item.scope}-${item.direction}`} className={styles.investmentCard}>
            <View className={styles.investmentHeader}>
              <Text className={styles.investmentTag}>{item.scope}</Text>
              <Text className={styles.investmentType}>{item.gapType}</Text>
            </View>
            <Text className={styles.investmentTitle}>{item.direction}</Text>
            <Text className={styles.investmentBody}>依据：{item.basis}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderSignalCards = () => {
    const signals = report?.investmentSignals || [];
    if (!signals.length) {
      return <Text className={styles.emptyText}>当前没有足够的验证信号，本节先保留正式结构。</Text>;
    }

    return (
      <View className={styles.investmentStack}>
        {signals.map((item) => (
          <View key={`${item.timeWindow}-${item.trigger}`} className={styles.signalCard}>
            <View className={styles.investmentHeader}>
              <Text className={styles.signalWindow}>{item.timeWindow}</Text>
            </View>
            <Text className={styles.investmentTitle}>{item.trigger}</Text>
            <Text className={styles.investmentBody}>意味着：{item.meaning}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderClaimBlocks = (section: AnalysisSection) => {
    const { claims, limits } = splitClaimBlocks(section);
    return (
      <View className={styles.claimBlockWrap}>
        {claims.length ? (
          <View className={styles.claimBlock}>
            <Text className={styles.claimLabel}>主张</Text>
            {claims.map((item, index) => (
              <View key={`${section.key}-claim-${item}`} className={styles.numberRow}>
                <Text className={styles.numberIndex}>{index + 1}.</Text>
                <Text className={styles.numberText}>{item.replace(/^主张[一二三四五六七八九十\d]*[:：]\s*/, '')}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {limits.length ? (
          <View className={styles.claimBlock}>
            <Text className={styles.claimLabel}>局限</Text>
            {limits.map((item, index) => (
              <View key={`${section.key}-limit-${item}`} className={styles.numberRow}>
                <Text className={styles.numberIndex}>{index + 1}.</Text>
                <Text className={styles.numberText}>{item.replace(/^局限[:：]\s*/, '')}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  const renderInnovationKeywords = (section: AnalysisSection) => {
    const { keywords } = splitInnovationBullets(section);
    if (!keywords.length) {
      return null;
    }

    return (
      <View className={styles.keywordBlock}>
        <Text className={styles.keywordLabel}>相关关键词</Text>
        <View className={styles.keywordRow}>
          {keywords.map((keyword) => (
            <Text key={`${section.key}-${keyword}`} className={styles.keywordChip}>
              {keyword}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderSectionCard = (section: AnalysisSection) => (
    <View key={section.key} className={styles.sectionCard}>
      <View className={styles.sectionHeaderRow}>
        <Text className={styles.sectionNumber}>{sectionNumber(section.key)}</Text>
        <Text className={styles.subsectionTitle}>{SECTION_TITLE_OVERRIDES[section.key] || section.title}</Text>
        {section.highlight && section.key !== 'claim' ? <Text className={styles.highlightText}>{section.highlight}</Text> : null}
      </View>
      <Text className={styles.sectionSummary}>{section.summary || '本节已保留正式结构，当前未返回更多细节。'}</Text>
      {section.key === 'hype' ? renderIssueTable() : null}
      {section.key === 'claim' ? renderClaimBlocks(section) : null}
      {section.key === 'innovation' ? renderInnovationKeywords(section) : null}
      {section.key === 'opportunity' ? renderOpportunityCards() : null}
      {section.key === 'signals' ? renderSignalCards() : null}
      {(section.key === 'innovation'
        ? splitInnovationBullets(section).regularBullets
        : !['hype', 'overseas', 'domestic', 'claim', 'timeline', 'opportunity', 'signals'].includes(section.key)
          ? section.bullets
          : []
      ).map((bullet) => (
        <View key={`${section.key}-${bullet}`} className={styles.bulletRow}>
          <View className={styles.bulletDot} />
          <Text className={styles.bulletText}>{bullet}</Text>
        </View>
      ))}
      {!section.bullets.length && !['hype', 'overseas', 'domestic', 'claim', 'timeline', 'opportunity', 'signals'].includes(section.key) ? (
        <Text className={styles.emptyText}>本节暂无更多细节，已按正式报告骨架保留位置。</Text>
      ) : null}
      {section.key === 'timeline' ? (
        report?.timeline?.length ? (
          <View className={styles.timelineStack}>
            {report.timeline.map((item: TimelineItem) => (
              <View key={`${item.year}-${item.title}`} className={styles.timelineCard}>
                <Text className={styles.timelineYear}>{item.year}</Text>
                <Text className={styles.timelineTitle}>{item.title}</Text>
                {item.description ? <Text className={styles.timelineDesc}>{item.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : (
          <Text className={styles.emptyText}>当前没有足够的时间线信息，本节先保留正式结构。</Text>
        )
      ) : null}
      {section.key === 'overseas' ? renderWorkCards('overseas') : null}
      {section.key === 'domestic' ? renderWorkCards('domestic') : null}
    </View>
  );

  const renderMissingSectionCard = (sectionKey: string) => (
    <View key={`${sectionKey}-missing`} className={`${styles.sectionCard} ${styles.sectionCardMuted}`}>
      <View className={styles.sectionHeaderRow}>
        <Text className={styles.subsectionTitle}>{SECTION_TITLE_OVERRIDES[sectionKey] || sectionKey}</Text>
        <Text className={styles.highlightText}>暂未完整返回</Text>
      </View>
      <Text className={styles.sectionSummary}>本节已保留在正式报告结构中，但这次真实生成没有返回足够内容，建议结合原文与参考文献继续核查。</Text>
    </View>
  );

  if (isRemoteLoading && !report) {
    return (
      <View className={styles.page}>
        <View className={styles.card}>
          <Text className={styles.sectionTitle}>正在加载报告</Text>
          <Text className={styles.sectionSummary}>正在读取真实报告详情，请保持页面停留。如果长时间没有结果，可以稍后重试。</Text>
        </View>
      </View>
    );
  }

  if (!report) {
    return (
      <View className={styles.page}>
        <View className={styles.card}>
          <Text className={styles.sectionTitle}>报告暂时不可用</Text>
          <Text className={styles.sectionSummary}>{remoteStatusMessage || '当前没有可展示的报告内容，请稍后重试。'}</Text>
          <View className={styles.quickActionRow}>
            <Button className={styles.actionButton} onClick={handleRetryLoad}>
              重新加载
            </Button>
            <Button className={styles.actionButton} onClick={handleReadAnother}>
              再读一篇
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.heroCard}>
        <Text className={styles.heroEyebrow}>解读报告 / {report.articleType}</Text>
        <Text className={styles.title}>{report.title}</Text>
        <View className={styles.judgement}>
          <View className={styles.judgementBar} />
          <Text className={styles.desc}>{report.subtitle}</Text>
        </View>
        <View className={styles.heroMetrics}>
          <View className={styles.heroMetric}>
            <Text className={styles.heroMetricLabel}>可信度</Text>
            <Text className={styles.heroMetricValue}>{report.meta.credibility || '—'}</Text>
          </View>
          <View className={styles.heroMetric}>
            <Text className={styles.heroMetricLabel}>夸大程度</Text>
            <Text className={styles.heroMetricValue}>{report.meta.hypeLevel || '—'}</Text>
          </View>
          <View className={styles.heroMetric}>
            <Text className={styles.heroMetricLabel}>技术成熟</Text>
            <Text className={styles.heroMetricValue}>{report.meta.trl || '—'}</Text>
          </View>
          <View className={styles.heroMetric}>
            <Text className={styles.heroMetricLabel}>领域阶段</Text>
            <Text className={styles.heroMetricValue}>{report.meta.fieldStage || '—'}</Text>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>报告状态</Text>
        <View className={styles.statusTagRow}>
          <Text className={styles.statusTag}>{isMockPreview ? '模板报告' : report.isSample ? '样例数据' : 'AI 生成报告'}</Text>
          {degradedModuleCount > 0 ? <Text className={styles.statusTag}>部分模块降级</Text> : null}
          {remoteStatusMessage ? <Text className={styles.statusTag}>本地兜底展示</Text> : null}
        </View>
        <Text className={styles.sectionSummary}>{report.status || '已生成结构化报告。'}</Text>
        {report.isSample && !isMockPreview ? (
          <Text className={styles.noticeText}>
            本次没有接通真实模型，下面是内置样例内容，与这篇文章无关，仅用于检查报告结构。
          </Text>
        ) : null}
        <Text className={styles.noticeText}>
          本报告由人工智能模型生成，仅供参考，不构成任何投资建议。</Text>
        {remoteStatusMessage ? <Text className={styles.noticeText}>{remoteStatusMessage}</Text> : null}
        {pageWarnings.map((warning) => (
          <Text key={warning} className={styles.noticeText}>
            {warning}
          </Text>
        ))}
        {remoteStatusMessage && !isMockPreview ? (
          <View className={styles.quickActionRow}>
            <Button className={styles.actionButton} onClick={handleRetryLoad}>
              重新拉取远端报告
            </Button>
          </View>
        ) : null}
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>文章快照</Text>
        <Text className={styles.metaText}>来源：{report.account}</Text>
        <Text className={styles.metaText}>发布时间：{report.articleSnapshot.publishDate || '未识别'}</Text>
        <Text className={styles.metaText}>原始材料：{report.articleSnapshot.originalMaterial || '未识别到明确的一手材料'}</Text>
        <View className={styles.quickActionRow}>
          {report.articleSnapshot.articleUrl ? (
            <Button className={styles.actionButton} onClick={() => handleCopyLink(report.articleSnapshot.articleUrl)}>
              复制公众号原文链接
            </Button>
          ) : null}
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>核心预览</Text>
        {report.pipeline.length ? (
          <View className={styles.previewGrid}>
            {report.pipeline.map((step: AnalysisStep) => (
              <View key={step.key} className={styles.previewCard}>
                <Text className={styles.stepTitle}>{step.title}</Text>
                <Text className={styles.stepDesc}>{step.description}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className={styles.emptyText}>当前没有可展示的流程预览，报告仍保留正式内容结构。</Text>
        )}
      </View>

      {(isStructuredReport ? groupedSections : []).map((group, groupIndex) => (
        <View key={group.key} className={styles.card}>
          <View className={styles.groupHead}>
            <Text className={styles.groupIndex}>{String(groupIndex + 1).padStart(2, '0')}</Text>
            <View className={styles.groupTitleWrap}>
              <Text className={styles.groupTitle}>{group.title}</Text>
              <Text className={styles.groupDesc}>{group.description}</Text>
            </View>
          </View>
          <View className={styles.stack}>
            {group.key === 'source-analysis' ? (
              <>
                {group.sections.filter((section: AnalysisSection) => section.key === 'team').map((section: AnalysisSection) => renderSectionCard(section))}
                <View className={styles.metricsPanel}>
                  <Text className={styles.metricsTitle}>关键判断</Text>
                  <View className={styles.metricsGrid}>
                    {metricItems.map((item) => (
                      <View key={item.label} className={styles.metricCard}>
                        <Text className={styles.metricLabel}>{item.label}</Text>
                        <Text className={styles.metricValue}>{item.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                {group.sections
                  .filter((section: AnalysisSection) => section.key !== 'team')
                  .map((section: AnalysisSection) => renderSectionCard(section))}
                {group.sectionKeys
                  .filter((sectionKey: string) => !group.sections.some((section: AnalysisSection) => section.key === sectionKey))
                  .map((sectionKey: string) => renderMissingSectionCard(sectionKey))}
              </>
            ) : (
              <>
                {group.sections.map((section: AnalysisSection) => renderSectionCard(section))}
                {group.sectionKeys
                  .filter((sectionKey: string) => !group.sections.some((section: AnalysisSection) => section.key === sectionKey))
                  .map((sectionKey: string) => renderMissingSectionCard(sectionKey))}
              </>
            )}
          </View>
        </View>
      ))}

      {!isStructuredReport ? (
        <View className={styles.card}>
          <Text className={styles.sectionTitle}>通用报告</Text>
          <View className={styles.stack}>{report.sections.map((section: AnalysisSection) => renderSectionCard(section))}</View>
        </View>
      ) : null}

      <View className={`${styles.card} ${styles.referenceSectionCard}`}>
        <Text className={styles.sectionTitle}>参考文献</Text>
        {report.references.length ? (
          <View className={styles.referenceList}>
            {report.references.map((reference: ReferenceItem) => (
              <View key={reference.id} className={styles.referenceRow}>
                <View className={styles.referenceMain}>
                  <Text className={styles.referenceId}>[{reference.id}]</Text>
                  <Text className={styles.referenceTitle}>{reference.title}</Text>
                </View>
                <Button className={styles.referenceActionButton} onClick={() => handleCopyLink(reference.link)}>
                  复制链接
                </Button>
              </View>
            ))}
          </View>
        ) : (
          <Text className={styles.emptyText}>本次未返回参考文献，请优先复制公众号原文链接并回到原文继续核查。</Text>
        )}
      </View>

      <View className={styles.bottomActionCard}>
        <Button className={styles.bottomPrimaryButton} onClick={handleReadAnother}>
          再读一篇
        </Button>
      </View>
    </View>
  );
};

export default ReportPage;
