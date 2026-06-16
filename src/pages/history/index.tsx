import React from 'react';
import { Button, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { mockTemplateReport } from '@/data/mock-report';
import { ReportRecord } from '@/types/reread';
import styles from './index.module.scss';

const normalizeSummary = (value = '') => value.replace(/\s+/g, ' ').trim();

const buildHistoryClaim = (report: ReportRecord) =>
  normalizeSummary(
    report.coreClaim ||
      report.sections.find((item) => item.key === 'claim')?.summary ||
      report.subtitle.replace(/^判断[:：]\s*/, '') ||
      '已生成结构化研究报告。'
  );

const HistoryPage: React.FC = () => {
  const handleOpenReport = (id: string) => {
    if (id === mockTemplateReport.id) {
      Taro.navigateTo({ url: '/pages/report/index?mock=1' });
      return;
    }
    Taro.navigateTo({ url: `/pages/report/index?id=${id}` });
  };

  const items = [mockTemplateReport];
  const hasItems = items.length > 0;
  const handleBackToRead = () => {
    Taro.switchTab({ url: '/pages/index/index' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.noticeCard}>
        <Text className={styles.noticeTitle}>历史说明</Text>
        <Text className={styles.noticeText}>当前历史页只保留模板报告卡片，用来检查正式报告结构、文风和页面展示是否一致。</Text>
        <Text className={styles.noticeText}>真实生成的报告暂不写入历史，读完后可通过“再读一篇”返回首页继续导入。</Text>
      </View>

      {hasItems ? (
        <View className={styles.reportList}>
          {items.map((report) => (
            <View key={report.id} className={styles.reportCard}>
              <Text className={styles.reportTitle}>{report.title}</Text>
              <Text className={styles.reportDesc}>{buildHistoryClaim(report)}</Text>
              <Button className={styles.actionButton} onClick={() => handleOpenReport(report.id)}>
                查看
              </Button>
            </View>
          ))}
        </View>
      ) : (
        <View className={styles.emptyCard}>
          <Text className={styles.emptyTitle}>还没有可展示的历史卡片</Text>
          <Text className={styles.emptyText}>当前版本的历史页只承载模板报告。如果后续恢复真实历史，这里会展示已生成报告列表。</Text>
          <Button className={styles.actionButton} onClick={handleBackToRead}>
            去解读页面
          </Button>
        </View>
      )}
    </View>
  );
};

export default HistoryPage;
