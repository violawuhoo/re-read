import React, { useState } from 'react';
import { Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { describeTransport } from '@/config/runtime';
import { checkBackendHealth, fetchMe } from '@/services/reread';
import styles from './index.module.scss';

const NOTES = [
  '在公众号文章里复制链接，回到解读页长按输入框粘贴。',
  '单篇报告需要 1–3 分钟，期间保持页面在前台。',
  '同一篇文章再次解读会复用已有报告，不重复消耗额度。',
  '报告仅作为进入原文前的判断框架，关键结论请回到论文或官方材料核对。'
];

type StatusValue = string;

const ProfilePage: React.FC = () => {
  const [quota, setQuota] = useState({ used: 0, limit: 0 });
  const [service, setService] = useState<StatusValue>('读取中');
  const [model, setModel] = useState<StatusValue>('读取中');
  const [storage, setStorage] = useState<StatusValue>('读取中');
  const [isLoading, setIsLoading] = useState(false);

  const refresh = async () => {
    setIsLoading(true);
    const me = await fetchMe();
    if (me) {
      setQuota({ used: me.quota.used || 0, limit: me.quota.limit || 0 });
      setService(`正常 · ${describeTransport()}`);
      setModel(me.llm?.enabled ? `${me.llm.provider || 'model'} / ${me.llm.model || ''}` : '未配置模型');
      setStorage(me.store?.mode === 'cloud' ? '云数据库' : '本地文件');
      setIsLoading(false);
      return;
    }

    const health = await checkBackendHealth();
    setService(health.ok ? `正常 · ${describeTransport()}` : '服务不可达');
    setModel(health.ok ? (health.llmEnabled ? `${health.llmProvider || 'model'} / ${health.llmModel || ''}` : '未配置模型') : '—');
    setStorage(health.storageMode === 'cloud' ? '云数据库' : health.storageMode || '—');
    setIsLoading(false);
  };

  useDidShow(() => {
    refresh();
  });

  const handleCopyNotes = async () => {
    try {
      await Taro.setClipboardData({ data: NOTES.join('\n') });
      Taro.showToast({ title: '说明已复制', icon: 'success' });
    } catch (error) {
      console.error('[ProfilePage] copy notes failed', error);
      Taro.showToast({ title: '复制失败', icon: 'error' });
    }
  };

  const percent = quota.limit > 0 ? Math.min(100, Math.round((quota.used / quota.limit) * 100)) : 0;

  return (
    <View className={styles.page}>
      <View className={styles.masthead}>
        <Text className={styles.eyebrow}>RE-READ / 设置</Text>
        <Text className={styles.headline}>今天的状态</Text>
      </View>

      <View className={styles.quotaCard}>
        <Text className={styles.quotaLabel}>今日解读额度</Text>
        <View className={styles.quotaRow}>
          <Text className={styles.quotaUsed}>{quota.limit ? quota.used : '—'}</Text>
          <Text className={styles.quotaLimit}>/ {quota.limit || '—'}</Text>
          <Text className={styles.quotaRefresh} onClick={refresh}>
            {isLoading ? '刷新中' : '刷新'}
          </Text>
        </View>
        <View className={styles.quotaTrack}>
          <View className={styles.quotaFill} style={{ width: `${percent}%` }} />
        </View>
        <Text className={styles.quotaNote}>
          {quota.limit
            ? `失败的任务会自动退回额度。剩余 ${Math.max(0, quota.limit - quota.used)} 次，按北京时间次日重置。`
            : '暂时读不到额度信息，请检查服务是否可用。'}
        </Text>
      </View>

      <View className={styles.statusCard}>
        <Text className={styles.cardTitle}>运行状态</Text>
        <View className={styles.statusRow}>
          <Text className={styles.statusKey}>服务</Text>
          <Text className={styles.statusValue}>{service}</Text>
        </View>
        <View className={styles.statusRow}>
          <Text className={styles.statusKey}>模型</Text>
          <Text className={styles.statusValue}>{model}</Text>
        </View>
        <View className={styles.statusRow}>
          <Text className={styles.statusKey}>存储</Text>
          <Text className={styles.statusValue}>{storage}</Text>
        </View>
      </View>

      <View className={styles.notesCard}>
        <Text className={styles.cardTitle}>使用说明</Text>
        {NOTES.map((note, index) => (
          <View key={note} className={styles.noteRow}>
            <Text className={styles.noteIndex}>{String(index + 1).padStart(2, '0')}</Text>
            <Text className={styles.noteText}>{note}</Text>
          </View>
        ))}
        <Text className={styles.copyAction} onClick={handleCopyNotes}>
          复制说明
        </Text>
      </View>

      <View className={styles.disclaimer}>
        <Text className={styles.disclaimerTitle}>免责声明</Text>
        <Text className={styles.disclaimerText}>
          报告内容由人工智能模型生成，会明确标注为 AI 生成内容。它不构成任何投资建议，也不对信息的完整性与准确性作出保证。涉及投资决策时，请以论文原文、公司公告和一手材料为准。
        </Text>
      </View>
    </View>
  );
};

export default ProfilePage;
