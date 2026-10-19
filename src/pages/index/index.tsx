import React, { useState } from 'react';
import { Button, Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { analyzeArticleUrlSync, createArticleUrlTask, normalizeArticleUrl, waitForReport } from '@/services/reread';
import styles from './index.module.scss';

const STEPS = ['公众号右上角「···」→ 复制链接', '回到这里，长按输入框粘贴', '等待 1–3 分钟，报告会自动打开'];

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : '链接解读失败，请稍后重试');

const getErrorToastTitle = (error: unknown): string => {
  const message = getErrorMessage(error);
  if (message.includes('额度')) {
    return '今日额度已用完';
  }
  if (message.includes('未获授权')) {
    return '当前账号未授权';
  }
  if (message.includes('微信访问验证')) {
    return '微信访问验证';
  }
  if (message.includes('仅支持公众号')) {
    return '仅支持公众号链接';
  }
  if (message.includes('链接格式不正确')) {
    return '链接格式不正确';
  }
  if (message.includes('抓取超时')) {
    return '抓取超时';
  }
  if (message.includes('未抓取到公众号正文')) {
    return '正文抓取失败';
  }
  return '链接解读失败';
};

const IndexPage: React.FC = () => {
  const [articleUrl, setArticleUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationError, setGenerationError] = useState('');

  const handleAnalyzeLink = async () => {
    const nextUrl = normalizeArticleUrl(articleUrl);

    if (!nextUrl) {
      Taro.showToast({ title: '请先粘贴文章链接', icon: 'none' });
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationStatus('正在创建分析任务');
      setGenerationProgress(4);
      setGenerationError('');

      const task = await createArticleUrlTask(nextUrl);

      if (task?.status === 'completed' && task.reportId) {
        setGenerationStatus('已命中历史报告，正在打开');
        setGenerationProgress(100);
        await Taro.navigateTo({ url: `/pages/report/index?id=${task.reportId}` });
        return;
      }

      if (task?.taskId) {
        setGenerationStatus('任务已创建，开始分析');
        setGenerationProgress(8);
        const reportId = await waitForReport(task.taskId, (status, progress) => {
          setGenerationStatus(status);
          setGenerationProgress(progress);
        });
        setGenerationStatus('报告已生成，正在打开');
        setGenerationProgress(100);
        await Taro.navigateTo({ url: `/pages/report/index?id=${reportId}` });
        return;
      }

      setGenerationStatus('异步队列不可用，改为直接生成');
      setGenerationProgress(12);
      const nextReport = await analyzeArticleUrlSync(nextUrl);
      setGenerationProgress(100);
      await Taro.navigateTo({ url: `/pages/report/index?id=${nextReport.id}` });
    } catch (error) {
      console.error('[IndexPage] analyze link failed', error);
      setGenerationError(getErrorMessage(error));
      Taro.showToast({ title: getErrorToastTitle(error), icon: 'none' });
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
      setGenerationProgress(0);
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.shell}>
        <View className={styles.masthead}>
          <Text className={styles.eyebrow}>RE-READ / 公众号解读</Text>
          <Text className={styles.headline}>读完公众号，{'\n'}再回原文</Text>
          <Text className={styles.slogan}>先拿到一版结构化判断，再决定这篇值不值得你花时间读原文。</Text>
        </View>

        <View className={styles.inputCard}>
          <View className={styles.inputHeader}>
            <Text className={styles.inputLabel}>文章链接</Text>
            <Text className={styles.inputHint}>仅支持 mp.weixin.qq.com</Text>
          </View>
          <View className={`${styles.inputWrap} ${isFocused ? styles.inputWrapFocus : ''}`}>
            <Input
              className={styles.urlInput}
              type='text'
              maxlength={-1}
              value={articleUrl}
              placeholder='长按此处粘贴链接'
              placeholderStyle='color:#a9b0a9'
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onInput={(event) => setArticleUrl(event.detail.value)}
            />
          </View>
          <Button className={styles.primaryButton} loading={isGenerating} onClick={handleAnalyzeLink}>
            {isGenerating ? '正在解读' : '开始解读'}
          </Button>

          {isGenerating ? (
            <View className={styles.progressBlock}>
              <View className={styles.progressHead}>
                <Text className={styles.progressStage}>{generationStatus || '准备中'}</Text>
                <Text className={styles.progressValue}>{generationProgress}%</Text>
              </View>
              <View className={styles.progressTrack}>
                <View className={styles.progressFill} style={{ width: `${generationProgress}%` }} />
              </View>
              <Text className={styles.progressNote}>生成期间请保持页面在前台，首次通常需要 1–3 分钟。</Text>
            </View>
          ) : null}

          {generationError ? (
            <View className={styles.errorBlock}>
              <Text className={styles.errorTitle}>这次没生成出来</Text>
              <Text className={styles.errorText}>{generationError}</Text>
              <View className={styles.errorActions}>
                <Button className={styles.ghostButton} onClick={() => setGenerationError('')}>
                  重新输入
                </Button>
                <Button className={styles.ghostButton} onClick={() => Taro.navigateTo({ url: '/pages/report/index?mock=1' })}>
                  看模板报告
                </Button>
              </View>
            </View>
          ) : null}
        </View>

        <View className={styles.notes}>
          <Text className={styles.notesTitle}>操作三步</Text>
          {STEPS.map((step, index) => (
            <View key={step} className={styles.noteRow}>
              <Text className={styles.noteIndex}>{String(index + 1).padStart(2, '0')}</Text>
              <Text className={styles.noteText}>{step}</Text>
            </View>
          ))}
          <Text className={styles.noteFoot}>报告由模型生成，仅供参考，不构成投资建议。</Text>
        </View>
      </View>
    </View>
  );
};

export default IndexPage;
