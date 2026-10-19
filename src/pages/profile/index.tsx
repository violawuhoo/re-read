import React, { useState } from 'react';
import { Button, Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { describeTransport } from '@/config/runtime';
import { checkBackendHealth, fetchMe } from '@/services/reread';
import styles from './index.module.scss';

const usageNotes = [
  '在公众号文章右上角「复制链接」，回到解读页长按输入框粘贴。',
  '单篇报告需要 1-3 分钟，期间请保持页面在前台。',
  '同一篇文章再次生成会直接复用已有报告，不重复消耗额度。',
  '报告由模型生成，仅作为进入原文前的判断框架，关键结论请回到论文或官方材料核对。'
];

const ProfilePage: React.FC = () => {
  const [quotaText, setQuotaText] = useState('读取中...');
  const [serviceText, setServiceText] = useState('读取中...');
  const [modelText, setModelText] = useState('读取中...');
  const [storageText, setStorageText] = useState('');

  const refresh = async () => {
    const me = await fetchMe();
    if (me) {
      setQuotaText(`今日已用 ${me.quota.used} / ${me.quota.limit} 次`);
      setModelText(
        me.llm?.enabled
          ? `已接通 ${me.llm.provider || 'unknown'} / ${me.llm.model || ''}`
          : '未配置模型，结果会是内置样例'
      );
      setStorageText(me.store?.mode === 'cloud' ? '云数据库' : '本地文件');
      setServiceText(`正常（${describeTransport()}）`);
      return;
    }

    const health = await checkBackendHealth();
    setQuotaText('读取失败');
    setModelText(health.ok ? (health.llmEnabled ? '已接通模型' : '未配置模型') : '无法读取');
    setServiceText(health.ok ? `正常（${describeTransport()}）` : '服务不可达');
    setStorageText(health.storageMode === 'cloud' ? '云数据库' : health.storageMode || '');
  };

  useDidShow(() => {
    refresh();
  });

  const handleCopyNotes = async () => {
    try {
      await Taro.setClipboardData({ data: usageNotes.join('\n') });
      Taro.showToast({ title: '说明已复制', icon: 'success' });
    } catch (error) {
      console.error('[ProfilePage] copy notes failed', error);
      Taro.showToast({ title: '复制失败', icon: 'error' });
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.title}>Re-Read</Text>
        <Text className={styles.desc}>面向 AI4S 一级市场投资人的公众号深度解读工具。读完公众号、读原文之前，先建立一份结构化的判断框架。</Text>
        <Text className={styles.metaText}>今日额度：{quotaText}</Text>
        <Text className={styles.metaText}>服务状态：{serviceText}</Text>
        <Text className={styles.metaText}>模型：{modelText}</Text>
        {storageText ? <Text className={styles.metaText}>存储：{storageText}</Text> : null}
        <View className={styles.buttonGroup}>
          <Button className={styles.secondaryButton} onClick={refresh}>
            刷新状态
          </Button>
          <Button className={styles.actionButton} onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
            去解读
          </Button>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.title}>使用说明</Text>
        <View className={styles.list}>
          {usageNotes.map((item) => (
            <View key={item} className={styles.item}>
              <Text className={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>
        <View className={styles.buttonGroup}>
          <Button className={styles.actionButton} onClick={handleCopyNotes}>
            复制说明
          </Button>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.title}>免责说明</Text>
        <Text className={styles.desc}>
          报告内容由人工智能模型生成，会明确标注为 AI 生成内容。它不构成任何投资建议，也不对信息的完整性和准确性作出保证。涉及投资决策时，请以论文原文、公司公告和一手材料为准。
        </Text>
      </View>
    </View>
  );
};

export default ProfilePage;
