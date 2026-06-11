import React, { useEffect, useMemo, useState } from 'react';
import { Button, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import TagBadge from '@/components/TagBadge';
import { reportLibrary } from '@/data/report';
import { fetchReports } from '@/services/reread';
import { ReportRecord } from '@/types/reread';
import styles from './index.module.scss';

const filters = ['全部', 'A类', '混合', '部分'];

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
        <Text className={styles.headerTitle}>解读历史</Text>
        <Text className={styles.headerDesc}>沉淀每篇公众号文章的结构化研究记录，便于赛道复盘与投前准备。</Text>
      </View>

      <View className={styles.card}>
        <Text className={styles.headerTitle}>筛选</Text>
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
        <Text className={styles.headerTitle}>报告列表</Text>
        {filteredReports.map((report) => (
          <View key={report.id} className={styles.reportCard}>
            <Text className={styles.reportTitle}>{report.title}</Text>
            <View className={styles.tagRow}>
              <TagBadge label={report.articleType} tone='primary' />
              <TagBadge label={`可信度 ${report.meta.credibility}`} tone='default' />
              <TagBadge label={`夸大 ${report.meta.hypeLevel}`} tone='warning' />
            </View>
            <Text className={styles.reportDesc}>{report.subtitle}</Text>
            <Text className={styles.reportMetaText}>{report.generatedAt} · {report.account}</Text>
            <Button className={styles.actionButton} onClick={() => handleOpenReport(report.id)}>
              查看完整报告
            </Button>
          </View>
        ))}
      </View>
    </View>
  );
};

export default HistoryPage;
