import React, { useEffect, useMemo, useState } from 'react';
import { Button, Image, Text, View } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import TagBadge from '@/components/TagBadge';
import { fetchReportById } from '@/services/reread';
import { getReportById, reportLibrary } from '@/data/report';
import { ReportRecord } from '@/types/reread';
import styles from './index.module.scss';

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

  const handleCopyLink = async (link: string) => {
    try {
      await Taro.setClipboardData({ data: link });
      Taro.showToast({ title: '链接已复制', icon: 'success' });
    } catch (error) {
      console.error('[ReportPage] copy link failed', error);
      Taro.showToast({ title: '复制失败', icon: 'error' });
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.heroCard}>
        <Image className={styles.cover} src={report.cover} mode='aspectFill' onError={(error) => console.error('[ReportPage] image failed', error)} />
        <Text className={styles.title}>{report.title}</Text>
        <Text className={styles.desc}>{report.subtitle}</Text>
        <View className={styles.tagRow}>
          <TagBadge label={report.articleType} tone='primary' />
          <TagBadge label={`可信度 ${report.meta.credibility}`} tone='default' />
          <TagBadge label={`夸大 ${report.meta.hypeLevel}`} tone='warning' />
          {report.meta.toVcRisk ? <TagBadge label={`To VC 风险 ${report.meta.toVcRisk}`} tone='warning' /> : null}
        </View>
        <Text className={styles.metaText}>来源：{report.account} · {report.articleSnapshot.publishDate}</Text>
        <Text className={styles.metaText}>Step 0 一手材料：{report.articleSnapshot.originalMaterial}</Text>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>完整报告</Text>
        {report.sections.map((section) => (
          <View key={section.key} className={styles.sectionCard}>
            <Text className={styles.sectionTitle}>{section.title}</Text>
            <Text className={styles.sectionSummary}>{section.summary}</Text>
            {section.bullets.map((bullet) => (
              <View key={bullet} className={styles.bulletRow}>
                <View className={styles.bulletDot} />
                <Text className={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>参考文献</Text>
        {report.references.map((reference) => (
          <View key={reference.id} className={styles.referenceCard}>
            <Text className={styles.sectionTitle}>{reference.id} · {reference.title}</Text>
            <Text className={styles.metaText}>{reference.author}</Text>
            <Button className={styles.actionButton} onClick={() => handleCopyLink(reference.link)}>
              复制原文链接
            </Button>
          </View>
        ))}
      </View>
    </View>
  );
};

export default ReportPage;
