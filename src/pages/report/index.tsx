import React, { useEffect, useMemo, useState } from 'react';
import { Button, Image, Text, View } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import TagBadge from '@/components/TagBadge';
import { fetchReportById } from '@/services/reread';
import { getReportById, reportLibrary } from '@/data/report';
import { AnalysisSection, AnalysisStep, ReferenceItem, ReportRecord, TimelineItem } from '@/types/reread';
import styles from './index.module.scss';

const SECTION_ORDER = ['quality', 'hype', 'team', 'claim', 'innovation', 'bottleneck', 'industrial', 'timeline', 'overseas', 'domestic', 'opportunity', 'signals'];

const ReportPage: React.FC = () => {
  const router = useRouter();
  const fallbackReport = useMemo(() => getReportById(router.params.id) || reportLibrary[0], [router.params.id]);
  const [report, setReport] = useState<ReportRecord>(fallbackReport);

  useEffect(() => {
    setReport(fallbackReport);
  }, [fallbackReport]);

  useEffect(() => {
    let isMounted = true;

    const loadRemoteReport = async () => {
      if (!router.params.id) {
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
  }, [router.params.id]);

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

  const handleCopyLink = async (link: string) => {
    try {
      await Taro.setClipboardData({ data: link });
      Taro.showToast({ title: '链接已复制', icon: 'success' });
    } catch (error) {
      console.error('[ReportPage] copy link failed', error);
      Taro.showToast({ title: '复制失败', icon: 'error' });
    }
  };

  const renderSectionCard = (section: AnalysisSection) => (
    <View key={section.key} className={styles.sectionCard}>
      <View className={styles.sectionHeaderRow}>
        <Text className={styles.sectionTitle}>{section.title}</Text>
        {section.highlight ? <Text className={styles.highlightText}>{section.highlight}</Text> : null}
      </View>
      <Text className={styles.sectionSummary}>{section.summary}</Text>
      {section.bullets.map((bullet) => (
        <View key={`${section.key}-${bullet}`} className={styles.bulletRow}>
          <View className={styles.bulletDot} />
          <Text className={styles.bulletText}>{bullet}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View className={styles.page}>
      <View className={styles.heroCard}>
        <Image className={styles.cover} src={report.cover} mode='aspectFill' onError={(error: unknown) => console.error('[ReportPage] image failed', error)} />
        <Text className={styles.title}>{report.title}</Text>
        <Text className={styles.desc}>{report.subtitle}</Text>
        <View className={styles.tagRow}>
          <TagBadge label={report.articleType} tone='primary' />
          <TagBadge label={`可信度 ${report.meta.credibility}`} tone='default' />
          <TagBadge label={`夸大 ${report.meta.hypeLevel}`} tone='warning' />
          {report.meta.toVcRisk ? <TagBadge label={`To VC 风险 ${report.meta.toVcRisk}`} tone='warning' /> : null}
          {report.meta.fieldStage ? <TagBadge label={report.meta.fieldStage} tone='default' /> : null}
        </View>
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
        <Text className={styles.sectionTitle}>解读流程</Text>
        <View className={styles.grid}>
          {report.pipeline.map((step: AnalysisStep) => (
            <View key={step.key} className={styles.stepCard}>
              <Text className={styles.stepTitle}>{step.title}</Text>
              <Text className={styles.stepDesc}>{step.description}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>核心指标</Text>
        <View className={styles.metricsGrid}>
          <View className={styles.metricCard}>
            <Text className={styles.metricLabel}>创新类型</Text>
            <Text className={styles.metricValue}>{report.meta.innovationType || '待判断'}</Text>
          </View>
          <View className={styles.metricCard}>
            <Text className={styles.metricLabel}>TRL</Text>
            <Text className={styles.metricValue}>{report.meta.trl || '待判断'}</Text>
          </View>
          <View className={styles.metricCard}>
            <Text className={styles.metricLabel}>产业化窗口</Text>
            <Text className={styles.metricValue}>{report.meta.industrialWindow || '待判断'}</Text>
          </View>
          <View className={styles.metricCard}>
            <Text className={styles.metricLabel}>突破程度</Text>
            <Text className={styles.metricValue}>{report.meta.breakthroughDegree || '待判断'}</Text>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>{isStructuredReport ? '完整报告' : '通用报告'}</Text>
        <View className={styles.stack}>
          {(isStructuredReport ? structuredSections : report.sections).map((section: AnalysisSection) => renderSectionCard(section))}
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>领域时间线</Text>
        <View className={styles.stack}>
          {report.timeline.length ? (
            report.timeline.map((item: TimelineItem) => (
              <View key={`${item.year}-${item.title}`} className={styles.timelineCard}>
                <Text className={styles.timelineYear}>{item.year}</Text>
                <Text className={styles.timelineTitle}>{item.title}</Text>
                {item.description ? <Text className={styles.timelineDesc}>{item.description}</Text> : null}
              </View>
            ))
          ) : (
            <Text className={styles.emptyText}>暂无时间线数据</Text>
          )}
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>参考文献</Text>
        <View className={styles.stack}>
          {report.references.map((reference: ReferenceItem) => (
            <View key={reference.id} className={styles.referenceCard}>
              <Text className={styles.referenceTitle}>{reference.id} · {reference.title}</Text>
              <Text className={styles.metaText}>{reference.author}</Text>
              <Button className={styles.actionButton} onClick={() => handleCopyLink(reference.link)}>
                复制原文链接
              </Button>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default ReportPage;
