import React, { useCallback, useState } from 'react';
import { Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { fetchReports } from '@/services/reread';
import { ReportRecord } from '@/types/reread';
import styles from './index.module.scss';

const normalizeSummary = (value = '') => value.replace(/\s+/g, ' ').trim();

const buildHistoryClaim = (report: ReportRecord) =>
  normalizeSummary(
    report.coreClaim ||
      report.sections?.find((item) => item.key === 'claim')?.summary ||
      (report.subtitle || '').replace(/^判断[:：]\s*/, '') ||
      '已生成结构化研究报告。'
  );

const splitDate = (value = '') => {
  const matched = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!matched) {
    return { day: '--/--', year: '' };
  }
  return { day: `${matched[2]}/${matched[3]}`, year: matched[1] };
};

const HistoryPage: React.FC = () => {
  const [items, setItems] = useState<ReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    const list = await fetchReports();
    if (list === null) {
      setErrorText('暂时读不到历史报告，服务可能未启动。');
      setItems([]);
    } else {
      setItems(list);
    }
    setIsLoading(false);
  }, []);

  useDidShow(() => {
    loadReports();
  });

  const handleOpenReport = (id: string) => {
    Taro.navigateTo({ url: `/pages/report/index?id=${id}` });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>历史</Text>
        {items.length ? <Text className={styles.headerCount}>{items.length} 篇</Text> : null}
      </View>

      {isLoading ? (
        <View className={styles.stateCard}>
          <Text className={styles.stateText}>正在读取已生成的报告…</Text>
        </View>
      ) : null}

      {!isLoading && errorText ? (
        <View className={styles.stateCard}>
          <Text className={styles.stateTitle}>读取失败</Text>
          <Text className={styles.stateText}>{errorText}</Text>
          <Text className={styles.stateAction} onClick={loadReports}>
            重新加载
          </Text>
        </View>
      ) : null}

      {!isLoading && !errorText && items.length === 0 ? (
        <View className={styles.stateCard}>
          <Text className={styles.stateTitle}>还没有报告</Text>
          <Text className={styles.stateText}>
            回到解读页，粘贴一篇公众号链接就能开始。同一篇文章再次解读会直接复用，不重复消耗额度。
          </Text>
          <Text className={styles.stateAction} onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
            去解读 →
          </Text>
        </View>
      ) : null}

      <View className={styles.list}>
        {items.map((report) => {
          const date = splitDate(report.generatedAt);
          return (
            <View key={report.id} className={styles.entry} onClick={() => handleOpenReport(report.id)}>
              <View className={styles.entrySide}>
                <Text className={styles.entryDate}>{date.day}</Text>
                <Text className={styles.entryYear}>{date.year}</Text>
              </View>
              <View className={styles.entryMain}>
                <Text className={styles.entryTitle}>{report.title}</Text>
                <Text className={styles.entryClaim}>{buildHistoryClaim(report)}</Text>
                <View className={styles.entryFoot}>
                  <Text className={styles.entryTag}>{report.isSample ? '样例' : report.articleType || '解读'}</Text>
                  <Text className={styles.entryArrow}>查看 →</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {!isLoading ? (
        <View className={styles.templateRow} onClick={() => Taro.navigateTo({ url: '/pages/report/index?mock=1' })}>
          <Text className={styles.templateLabel}>模板报告</Text>
          <Text className={styles.templateHint}>查看完整报告的结构与排版 →</Text>
        </View>
      ) : null}
    </View>
  );
};

export default HistoryPage;
