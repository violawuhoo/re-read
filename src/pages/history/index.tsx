import React, { useCallback, useState } from 'react';
import { Button, Text, View } from '@tarojs/components';
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

const formatTime = (value = '') => {
  if (!value) {
    return '';
  }
  return value.replace('T', ' ').slice(0, 16);
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
      setErrorText('暂时读不到历史报告，请检查服务是否可用。');
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

  const handleBackToRead = () => {
    Taro.switchTab({ url: '/pages/index/index' });
  };

  return (
    <View className={styles.page}>
      {isLoading ? (
        <View className={styles.noticeCard}>
          <Text className={styles.noticeTitle}>正在读取历史</Text>
          <Text className={styles.noticeText}>正在加载你生成过的报告…</Text>
        </View>
      ) : null}

      {!isLoading && errorText ? (
        <View className={styles.noticeCard}>
          <Text className={styles.noticeTitle}>读取失败</Text>
          <Text className={styles.noticeText}>{errorText}</Text>
          <Button className={styles.actionButton} onClick={loadReports}>
            重新加载
          </Button>
        </View>
      ) : null}

      {!isLoading && !errorText && items.length > 0 ? (
        <View className={styles.reportList}>
          {items.map((report) => (
            <View key={report.id} className={styles.reportCard}>
              <Text className={styles.reportTitle}>{report.title}</Text>
              <Text className={styles.reportDesc}>{buildHistoryClaim(report)}</Text>
              <Text className={styles.reportDesc}>
                {formatTime(report.generatedAt)}
                {report.isSample ? ' · 样例数据' : ''}
              </Text>
              <Button className={styles.actionButton} onClick={() => handleOpenReport(report.id)}>
                查看
              </Button>
            </View>
          ))}
        </View>
      ) : null}

      {!isLoading && !errorText && items.length === 0 ? (
        <View className={styles.emptyCard}>
          <Text className={styles.emptyTitle}>还没有生成过报告</Text>
          <Text className={styles.emptyText}>回到解读页，粘贴一篇公众号文章链接就能开始。</Text>
          <Button className={styles.actionButton} onClick={handleBackToRead}>
            去解读页面
          </Button>
        </View>
      ) : null}

      <View className={styles.noticeCard}>
        <Text className={styles.noticeTitle}>模板报告</Text>
        <Text className={styles.noticeText}>示例报告不会写入历史，只用于查看完整报告的结构和排版。</Text>
        <Button className={styles.actionButton} onClick={() => Taro.navigateTo({ url: '/pages/report/index?mock=1' })}>
          查看模板报告
        </Button>
      </View>
    </View>
  );
};

export default HistoryPage;
