import React, { useEffect, useMemo, useState } from 'react';
import { Button, Image, Text, View } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { mockTemplateReport } from '@/data/mock-report';
import { fetchReportById } from '@/services/reread';
import { getReportById, reportLibrary } from '@/data/report';
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

const ReportPage: React.FC = () => {
  const router = useRouter();
  const isMockPreview = router.params.mock === '1';
  const fallbackReport = useMemo(() => {
    if (isMockPreview) {
      return mockTemplateReport;
    }

    return getReportById(router.params.id) || reportLibrary[0];
  }, [isMockPreview, router.params.id]);
  const [report, setReport] = useState<ReportRecord>(fallbackReport);

  useEffect(() => {
    setReport(fallbackReport);
  }, [fallbackReport]);

  useEffect(() => {
    let isMounted = true;

    const loadRemoteReport = async () => {
      if (isMockPreview || !router.params.id) {
        return;
      }

      const remoteReport = await fetchReportById(router.params.id);
      if (remoteReport && isMounted) {
        setReport(remoteReport);
      }
    };

    loadRemoteReport().catch((error) => {
      console.warn('[ReportPage] fetch remote report failed', error);
    });

    return () => {
      isMounted = false;
    };
  }, [isMockPreview, router.params.id]);

  const sectionMap = useMemo(
    () =>
      report.sections.reduce<Record<string, AnalysisSection>>((accumulator: Record<string, AnalysisSection>, section: AnalysisSection) => {
        accumulator[section.key] = section;
        return accumulator;
      }, {}),
    [report.sections]
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
        { label: '创新类型', value: report.meta.innovationType || '待判断' },
        {
          label: '突破判断',
          value:
            report.meta.breakthroughDegree === '部分缓解'
              ? '验证了闭环可行性，但没有解决规模化与自动化'
              : report.meta.breakthroughDegree === '完全解决'
                ? '核心瓶颈已被实质性解决'
                : report.meta.breakthroughDegree === '绕过问题'
                  ? '通过替代路径实现阶段性推进'
                  : '待判断'
        },
        { label: '产业化窗口', value: report.meta.industrialWindow || '待判断' },
        { label: '领域阶段', value: report.meta.fieldStage || '待判断' }
      ].filter((item) => item.value),
    [report.meta.breakthroughDegree, report.meta.fieldStage, report.meta.industrialWindow, report.meta.innovationType]
  );
  const referenceMap = useMemo(
    () =>
      report.references.reduce<Record<string, ReferenceItem>>((accumulator: Record<string, ReferenceItem>, reference: ReferenceItem) => {
        accumulator[reference.link] = reference;
        return accumulator;
      }, {}),
    [report.references]
  );

  const handleCopyLink = async (link: string) => {
    try {
      await Taro.setClipboardData({ data: link });
      Taro.showToast({ title: '链接已复制', icon: 'success' });
    } catch (error) {
      console.error('[ReportPage] copy link failed', error);
      Taro.showToast({ title: '复制失败', icon: 'error' });
    }
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
    const issues = report.hyperDetail?.issues || [];
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
    const opportunities = report.opportunities || [];
    if (!opportunities.length) {
      return null;
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
    const signals = report.investmentSignals || [];
    if (!signals.length) {
      return null;
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
        <Text className={styles.subsectionTitle}>{SECTION_TITLE_OVERRIDES[section.key] || section.title}</Text>
        {section.highlight && section.key !== 'claim' ? <Text className={styles.highlightText}>{section.highlight}</Text> : null}
      </View>
      <Text className={styles.sectionSummary}>{section.summary}</Text>
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
      {section.key === 'timeline' && report.timeline.length ? (
        <View className={styles.timelineStack}>
          {report.timeline.map((item: TimelineItem) => (
            <View key={`${item.year}-${item.title}`} className={styles.timelineCard}>
              <Text className={styles.timelineYear}>{item.year}</Text>
              <Text className={styles.timelineTitle}>{item.title}</Text>
              {item.description ? <Text className={styles.timelineDesc}>{item.description}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
      {section.key === 'overseas' ? renderWorkCards('overseas') : null}
      {section.key === 'domestic' ? renderWorkCards('domestic') : null}
    </View>
  );

  return (
    <View className={styles.page}>
      <View className={styles.heroCard}>
        <Text className={styles.heroEyebrow}>公众号文章解读</Text>
        <Image className={styles.cover} src={report.cover} mode='aspectFill' onError={(error: unknown) => console.error('[ReportPage] image failed', error)} />
        <Text className={styles.title}>{report.title}</Text>
        <Text className={styles.desc}>{report.subtitle}</Text>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>文章快照</Text>
        <Text className={styles.metaText}>来源：{report.account}</Text>
        <Text className={styles.metaText}>发布时间：{report.articleSnapshot.publishDate}</Text>
        <Text className={styles.metaText}>原始材料：{report.articleSnapshot.originalMaterial}</Text>
        {report.articleSnapshot.articleUrl ? (
          <Button className={styles.actionButton} onClick={() => handleCopyLink(report.articleSnapshot.articleUrl)}>
            复制公众号原文链接
          </Button>
        ) : null}
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>核心预览</Text>
        <View className={styles.previewGrid}>
          {report.pipeline.map((step: AnalysisStep) => (
            <View key={step.key} className={styles.previewCard}>
              <Text className={styles.stepTitle}>{step.title}</Text>
              <Text className={styles.stepDesc}>{step.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {(isStructuredReport ? groupedSections : []).map((group) => (
        <View key={group.key} className={styles.card}>
          <Text className={styles.sectionTitle}>{group.title}</Text>
          <Text className={styles.groupDesc}>{group.description}</Text>
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
              </>
            ) : (
              group.sections.map((section: AnalysisSection) => renderSectionCard(section))
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
      </View>
    </View>
  );
};

export default ReportPage;
