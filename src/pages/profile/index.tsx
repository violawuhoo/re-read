import React, { useEffect, useState } from 'react';
import { Button, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getBackendBaseUrl, getLocalBackendUrl, getProductionPlaceholderUrl, setBackendBaseUrl } from '@/config/runtime';
import { checkBackendHealth, getBackendRuntimeConfig } from '@/services/reread';
import styles from './index.module.scss';

const launchChecklist = [
  '在单独终端运行 `node backend/server.js`，确保分析接口可用。',
  '在预览页面配置微信小程序 AppID 与管理员凭证。',
  '确认公众号解析与报告生成接口域名已完成小程序合法域名配置。',
  '准备正式环境的模型密钥、监控告警、限流与日志留存。',
  '完成真机回归，重点检查剪贴板读取、历史记录、Ref 复制与页面滚动。',
  '在预览界面内直接生成二维码、预览、上传代码、提审并发布。'
];

const ProfilePage: React.FC = () => {
  const [backendUrl, setBackendUrl] = useState(getBackendBaseUrl());
  const [healthText, setHealthText] = useState('尚未检测后端状态');
  const [llmText, setLlmText] = useState('尚未检测模型配置');

  useEffect(() => {
    setBackendUrl(getBackendBaseUrl());
  }, []);

  const handleCopyChecklist = async () => {
    try {
      await Taro.setClipboardData({ data: launchChecklist.join('\n') });
      Taro.showToast({ title: '清单已复制', icon: 'success' });
    } catch (error) {
      console.error('[ProfilePage] copy checklist failed', error);
      Taro.showToast({ title: '复制失败', icon: 'error' });
    }
  };

  const handleUseLocalBackend = () => {
    const nextValue = getLocalBackendUrl();
    setBackendBaseUrl(nextValue);
    setBackendUrl(nextValue);
    setHealthText('已切换到本地后端，请重新检测状态');
    Taro.showToast({ title: '已切到本地', icon: 'success' });
  };

  const handleUseProductionPlaceholder = () => {
    const nextValue = getProductionPlaceholderUrl();
    setBackendBaseUrl(nextValue);
    setBackendUrl(nextValue);
    setHealthText('已切换到生产占位地址，请替换为你的正式域名');
    Taro.showToast({ title: '已切到生产占位', icon: 'success' });
  };

  const handleCheckBackend = async () => {
    setHealthText('检测中...');
    const result = await checkBackendHealth();
    if (result.ok) {
      setHealthText(
        `联通正常：${result.service}，当前报告数 ${result.reports}，模型${result.llmEnabled ? `已启用 ${result.llmProvider || 'unknown'} / ${result.llmModel || ''}` : '未启用'}`
      );
      Taro.showToast({ title: '后端正常', icon: 'success' });
      return;
    }

    setHealthText(`当前地址不可达：${result.baseUrl}`);
    Taro.showToast({ title: '后端不可达', icon: 'none' });
  };

  const handleCheckLlm = async () => {
    setLlmText('检测中...');
    const result = await getBackendRuntimeConfig();
    if (result.ok) {
      setLlmText(
        result.llmEnabled
          ? `真实模型已配置：${result.llmProvider || 'unknown'} / ${result.llmModel || '未命名模型'} @ ${result.llmBaseUrl || '未知地址'}`
          : '当前未配置真实模型，后端会回退到 mock SOP Agent'
      );
      Taro.showToast({ title: '模型状态已更新', icon: 'success' });
      return;
    }

    setLlmText('无法读取后端运行配置');
    Taro.showToast({ title: '读取失败', icon: 'none' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.title}>Re-Read</Text>
        <Text className={styles.desc}>
          面向 AI4S 一级市场投资人的公众号深度解读小程序。对用户是微信小程序，对系统底层是执行 SOP 的研究型 Agent。
        </Text>
        <Text className={styles.desc}>当前版本已经内置后端 MVP，前端会优先请求当前配置的后端地址，失败时自动回退到本地样例。</Text>
        <Text className={styles.metaText}>当前后端地址：{backendUrl}</Text>
        <Text className={styles.metaText}>检测结果：{healthText}</Text>
        <Text className={styles.metaText}>模型状态：{llmText}</Text>
        <View className={styles.buttonGroup}>
          <Button className={styles.secondaryButton} onClick={handleUseLocalBackend}>
            切换到本地后端
          </Button>
          <Button className={styles.secondaryButton} onClick={handleUseProductionPlaceholder}>
            切换到生产占位地址
          </Button>
          <Button className={styles.actionButton} onClick={handleCheckBackend}>
            检测后端状态
          </Button>
          <Button className={styles.secondaryButton} onClick={handleCheckLlm}>
            检测模型配置
          </Button>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.title}>上线清单</Text>
        <View className={styles.list}>
          {launchChecklist.map((item) => (
            <View key={item} className={styles.item}>
              <Text className={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>
        <View className={styles.buttonGroup}>
          <Button className={styles.actionButton} onClick={handleCopyChecklist}>
            复制上线清单
          </Button>
        </View>
      </View>
    </View>
  );
};

export default ProfilePage;
