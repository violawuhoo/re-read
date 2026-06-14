import React, { useEffect, useMemo, useState } from 'react';
import { Button, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import TagBadge from '@/components/TagBadge';
import { reportLibrary } from '@/data/report';
import { fetchReports } from '@/services/reread';
import { ReportRecord } from '@/types/reread';
import styles from './index.module.scss';

const filters = ['全部', 'A类', '混合', '部分'];

const normalizeSummary = (value = '') => value.replace(/\s+/g, ' ').trim();

const buildHistorySummary = (report: ReportRecord) => {
  const qualitySection = report.sections.find((item) => item.key === 'quality');
  const opportunitySection = report.sections.find((item) => item.key === 'opportunity');
  const signalSection = report.sections.find((item) => item.key === 'signals');

  if (report.subtitle?.startsWith('判断：')) {
    return report.subtitle;
  }

  if (qualitySection?.summary) {
    return `判断：${normalizeSummary(qualitySection.summary)}`;
  }

  if (opportunitySection?.summary) {
    return `判断：${normalizeSummary(opportunitySection.summary)}`;
  }

  if (signalSection?.summary) {
    return `判断：${normalizeSummary(signalSection.summary)}`;
  }

  return normalizeSummary(report.subtitle || '判断：已生成结构化研究报告。');
};

const HistoryPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('全部');
  const [reports, setReports] = useState<ReportRecord[]>(reportLibrary);

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      const remoteReports = await fetchReports();
      if (remoteReports?.length && isMounted) {
        setReports(remoteReports);
      }
    };

    loadReports().catch((error) => {
      console.warn('[HistoryPage] load reports failed', error);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredReports = useMemo(() => {
    if (activeFilter === '全部') {
      return reports;
    }

    if (activeFilter === 'A类') {
      return reports.filter((item) => item.articleType === 'A类论文解读');
    }

    if (activeFilter === '混合') {
      return reports.filter((item) => item.articleType === 'A+C混合');
    }

    return reports.filter((item) => item.articleType === '部分可分析');
  }, [activeFilter, reports]);

  const handleOpenReport = (id: string) => {
    Taro.navigateTo({ url: `/pages/report/index?id=${id}` });
  };

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.headerEyebrow}>Report Archive</Text>
        <Text className={styles.headerTitle}>解读历史</Text>
        <Text className={styles.headerDesc}>沉淀每篇公众号文章的结构化研究记录，便于赛道复盘与投前准备。</Text>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>筛选</Text>
        <Text className={styles.sectionDesc}>按文章类型快速回看历史报告，优先找出值得继续复盘的研究结论。</Text>
        <View className={styles.filterRow}>
          {filters.map((filter) => {
            const isActive = filter === activeFilter;
            return (
              <Button
                key={filter}
                className={`${styles.filterButton} ${isActive ? styles.filterActive : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </Button>
            );
          })}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionHead}>
          <Text className={styles.sectionTitle}>报告列表</Text>
          <Text className={styles.sectionCount}>{filteredReports.length} 篇</Text>
        </View>
        <Text className={styles.sectionDesc}>优先保留“判断”式摘要，帮助快速回忆这篇报告最值得带走的结论。</Text>
        <View className={styles.reportList}>
          {filteredReports.map((report) => (
            <View key={report.id} className={styles.reportCard}>
              <View className={styles.reportHeader}>
                <Text className={styles.reportTitle}>{report.title}</Text>
                <Text className={styles.reportMode}>{report.mode}</Text>
              </View>
              <View className={styles.tagRow}>
                <TagBadge label={report.articleType} tone='primary' />
                <TagBadge label={`可信度 ${report.meta.credibility}`} tone='default' />
                <TagBadge label={`夸大 ${report.meta.hypeLevel}`} tone='warning' />
              </View>
              <View className={styles.summaryBlock}>
                <Text className={styles.summaryLabel}>判断</Text>
                <Text className={styles.reportDesc}>{buildHistorySummary(report)}</Text>
              </View>
              <View className={styles.reportFooter}>
                <View className={styles.reportMetaGroup}>
                  <Text className={styles.reportMetaText}>{report.generatedAt}</Text>
                  <Text className={styles.reportMetaText}>{report.account}</Text>
                </View>
                <Button className={styles.actionButton} onClick={() => handleOpenReport(report.id)}>
                  查看完整报告
                </Button>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default HistoryPage;
