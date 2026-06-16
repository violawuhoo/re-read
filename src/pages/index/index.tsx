import React, { useState } from 'react';
import { Button, Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import {
  analyzeArticleUrlSync,
  createArticleUrlTask,
  normalizeArticleUrl,
  pollAnalysisTask,
  readClipboardCandidate
} from '@/services/reread';
import styles from './index.module.scss';

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : '链接解读失败，请稍后重试');

const getErrorToastTitle = (error: unknown): string => {
  const message = getErrorMessage(error);
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationError, setGenerationError] = useState('');

  const waitForTaskResult = async (taskId: string) => {
    for (let index = 0; index < 240; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const nextTask = await pollAnalysisTask(taskId);

      if (!nextTask) {
        setGenerationStatus('任务状态读取失败，正在重试...');
        setGenerationProgress(0);
        break;
      }

      const statusText = [nextTask.stage, typeof nextTask.progress === 'number' ? `${nextTask.progress}%` : '']
        .filter(Boolean)
        .join(' · ');
      setGenerationStatus(statusText || '正在生成报告...');
      setGenerationProgress(typeof nextTask.progress === 'number' ? Math.max(0, Math.min(100, nextTask.progress)) : 0);

      if (nextTask.status === 'completed' && nextTask.reportId) {
        setGenerationStatus('报告已生成，正在打开...');
        setGenerationProgress(100);
        await Taro.navigateTo({ url: `/pages/report/index?id=${nextTask.reportId}` });
        return true;
      }

      if (nextTask.status === 'failed') {
        setGenerationStatus(nextTask.message || '报告生成失败');
        setGenerationProgress(100);
        throw new Error(nextTask.message || 'analysis task failed');
      }
    }

    throw new Error('报告生成时间较长，请稍后到历史页查看');
  };

  const handlePasteLink = async () => {
    try {
      const nextValue = await readClipboardCandidate();
      const nextUrl = normalizeArticleUrl(nextValue);
      setArticleUrl(nextUrl);
      if (nextUrl) {
        Taro.showToast({ title: '已粘贴链接', icon: 'success' });
        return;
      }
      Taro.showToast({ title: '剪贴板里没有可用链接', icon: 'none' });
    } catch (error) {
      console.error('[IndexPage] paste link failed', error);
      Taro.showToast({ title: '读取失败', icon: 'none' });
    }
  };

  const handleAnalyzeLink = async () => {
    const nextUrl = normalizeArticleUrl(articleUrl);

    if (!nextUrl) {
      Taro.showToast({ title: '请先粘贴文章链接', icon: 'none' });
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationStatus('正在创建分析任务...');
      setGenerationProgress(4);
      setGenerationError('');

      const task = await createArticleUrlTask(nextUrl);

      if (task?.status === 'completed' && task.reportId) {
        setGenerationStatus('检测到已生成报告，正在打开...');
        setGenerationProgress(100);
        await Taro.navigateTo({ url: `/pages/report/index?id=${task.reportId}` });
        return;
      }

      if (task?.taskId) {
        setGenerationStatus('任务已创建，准备开始分析...');
        setGenerationProgress(Math.max(generationProgress, 8));
        await waitForTaskResult(task.taskId);
        return;
      }

      setGenerationStatus('异步队列不可用，正在直接生成报告...');
      setGenerationProgress(12);
      const nextReport = await analyzeArticleUrlSync(nextUrl);
      setGenerationStatus('报告已生成，正在打开...');
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
        <View className={styles.brandBlock}>
          <Text className={styles.brand}>Re-Read</Text>
          <Text className={styles.slogan}>公众号读完之后，原文之前。</Text>
        </View>

        <View className={styles.importCard}>
          <View className={styles.inputWrap}>
            <Input
              className={styles.urlInput}
              type='text'
              maxlength={-1}
              value={articleUrl}
              placeholder='粘贴 mp.weixin.qq.com 文章链接'
              onInput={(event) => setArticleUrl(event.detail.value)}
            />
          </View>
          <View className={styles.buttonGroup}>
            <Button className={styles.primaryButton} loading={isGenerating} onClick={handleAnalyzeLink}>
              {isGenerating ? '生成中' : '生成报告'}
            </Button>
            <Button className={styles.secondaryButton} onClick={handlePasteLink}>
              从剪贴板粘贴链接
            </Button>
          </View>
          {isGenerating ? (
            <View className={styles.helperBlock}>
              <Text className={styles.helperTitle}>正在生成真实报告</Text>
              <View className={styles.progressTrack}>
                <View className={styles.progressFill} style={{ width: `${generationProgress}%` }} />
              </View>
              <Text className={styles.progressValue}>{generationProgress}%</Text>
              <Text className={styles.helperText}>{generationStatus || '首次生成通常需要 1-3 分钟，请保持页面停留。'}</Text>
            </View>
          ) : null}
          {generationError ? (
            <View className={styles.helperBlock}>
              <Text className={styles.helperTitle}>这次没有顺利生成报告</Text>
              <Text className={styles.helperText}>{generationError}</Text>
              <View className={styles.buttonGroup}>
                <Button className={styles.secondaryButton} onClick={() => setGenerationError('')}>
                  重新输入后再试
                </Button>
                <Button className={styles.secondaryButton} onClick={() => Taro.navigateTo({ url: '/pages/report/index?mock=1' })}>
                  先看模板报告
                </Button>
              </View>
            </View>
          ) : null}
          <View className={styles.helperBlock}>
            <Text className={styles.helperTitle}>如何获得公众号文章链接</Text>
            <Text className={styles.helperText}>在公众号文章右上角点击“复制链接”，再回到小程序粘贴到这里即可。</Text>
            <Text className={styles.helperText}>当前版本暂不支持把公众号文章直接转发到小程序。</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default IndexPage;
