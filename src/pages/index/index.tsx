import React, { useMemo, useState } from 'react';
import { Button, Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import TagBadge from '@/components/TagBadge';
import { reportLibrary } from '@/data/report';
import { ReportRecord } from '@/types/reread';
import {
  createArticleUrlTask,
  fetchReportById,
  generateReportFromContent,
  getNextDemoReport,
  normalizeArticleUrl,
  pollAnalysisTask,
  readClipboardCandidate
} from '@/services/reread';
import styles from './index.module.scss';

const IndexPage: React.FC = () => {
  const [report, setReport] = useState<ReportRecord>(reportLibrary[0]);
  const [articleUrl, setArticleUrl] = useState('');
  const [detectedLink, setDetectedLink] = useState('等待粘贴公众号文章链接');
  const [statusText, setStatusText] = useState('等待导入公众号文章链接');
  const [isGenerating, setIsGenerating] = useState(false);

  const metricList = useMemo(
    () => [
      { label: '文章类型', value: report.articleType },
      { label: '公众号可信度', value: report.meta.credibility },
      { label: '夸大程度', value: report.meta.hypeLevel },
      { label: 'To VC 风险', value: report.meta.toVcRisk || '不适用' },
      { label: '创新点类型', value: report.meta.innovationType },
      { label: 'TRL + 时间窗', value: `${report.meta.trl} / ${report.meta.industrialWindow}` }
    ],
    [report]
  );

  const waitForTaskResult = async (taskId: string) => {
    for (let index = 0; index < 12; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const nextTask = await pollAnalysisTask(taskId);

      if (!nextTask) {
        break;
      }

      setStatusText(`${nextTask.stage} · ${nextTask.message}`);

      if (nextTask.status === 'completed' && nextTask.reportId) {
        const remoteReport = await fetchReportById(nextTask.reportId);
        if (remoteReport) {
          setReport(remoteReport);
          setStatusText(remoteReport.status);
          // #region debug-point D:render-remote-report
          fetch('http://127.0.0.1:7777/event', {
            method: 'POST',
            body: JSON.stringify({
              sessionId: 'wechat-link-analysis',
              runId: 'pre-fix',
              hypothesisId: 'D',
              location: 'src/pages/index/index.tsx:waitForTaskResult:completed',
              msg: '[DEBUG] remote report rendered on frontend',
              data: {
                taskId,
                reportId: remoteReport.id,
                title: remoteReport.title,
                sourceName: remoteReport.articleSnapshot?.sourceName,
                articleUrl: remoteReport.articleSnapshot?.articleUrl,
                highlight: remoteReport.sections?.[0]?.highlight
              },
              ts: Date.now()
            })
          }).catch(() => {});
          // #endregion
          Taro.showToast({ title: '解读已刷新', icon: 'success' });
          return true;
        }
      }

      if (nextTask.status === 'failed') {
        throw new Error(nextTask.message || 'analysis task failed');
      }
    }

    return false;
  };

  const handlePasteLink = async () => {
    try {
      setStatusText('正在读取剪贴板内容');
      const nextValue = await readClipboardCandidate();
      const nextUrl = normalizeArticleUrl(nextValue);
      setArticleUrl(nextUrl);
      setDetectedLink(nextUrl || '剪贴板未检测到公众号链接');
      setStatusText(nextUrl ? '已从剪贴板识别到链接' : '剪贴板里没有可用链接');
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
      setDetectedLink(nextUrl);
      setStatusText('正在创建链接分析任务');
      // #region debug-point A:submit-link
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'wechat-link-analysis',
          runId: 'pre-fix',
          hypothesisId: 'A',
          location: 'src/pages/index/index.tsx:handleAnalyzeLink:start',
          msg: '[DEBUG] submit article url',
          data: { articleUrl: nextUrl },
          ts: Date.now()
        })
      }).catch(() => {});
      // #endregion

      const task = await createArticleUrlTask(nextUrl);

      if (task?.taskId) {
        setStatusText(`${task.stage} · ${task.message}`);
        // #region debug-point B:task-created
        fetch('http://127.0.0.1:7777/event', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: 'wechat-link-analysis',
            runId: 'pre-fix',
            hypothesisId: 'B',
            location: 'src/pages/index/index.tsx:handleAnalyzeLink:task-created',
            msg: '[DEBUG] task created on frontend',
            data: { taskId: task.taskId, articleUrl: nextUrl },
            ts: Date.now()
          })
        }).catch(() => {});
        // #endregion
        const completed = await waitForTaskResult(task.taskId);
        if (completed) {
          return;
        }
      }

      setStatusText('异步任务不可用，回退到本地分析');
      const nextReport = await generateReportFromContent(nextUrl);
      setReport(nextReport);
      setStatusText(nextReport.status);
      // #region debug-point C:fallback-report
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'wechat-link-analysis',
          runId: 'pre-fix',
          hypothesisId: 'C',
          location: 'src/pages/index/index.tsx:handleAnalyzeLink:fallback',
          msg: '[DEBUG] fallback report rendered on frontend',
          data: {
            reportId: nextReport.id,
            title: nextReport.title,
            sourceName: nextReport.articleSnapshot?.sourceName,
            articleUrl: nextReport.articleSnapshot?.articleUrl
          },
          ts: Date.now()
        })
      }).catch(() => {});
      // #endregion
      Taro.showToast({ title: '已生成回退报告', icon: 'success' });
    } catch (error) {
      console.error('[IndexPage] analyze link failed', error);
      setStatusText(error instanceof Error ? error.message : '链接解读失败，请稍后重试');
      Taro.showToast({ title: '链接解读失败', icon: 'none' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSwitchReport = () => {
    const nextReport = getNextDemoReport(report.id);
    setReport(nextReport);
    setStatusText(`已切换到 ${nextReport.articleType} 样例`);
    Taro.showToast({ title: '已切换样例', icon: 'success' });
  };

  const handleOpenReport = () => {
    Taro.navigateTo({ url: `/pages/report/index?id=${report.id}` });
  };

  const handleOpenMockReport = () => {
    Taro.navigateTo({ url: '/pages/report/index?mock=1' });
  };

  const handleCopyLink = async (link: string) => {
    try {
      await Taro.setClipboardData({ data: link });
      Taro.showToast({ title: '链接已复制', icon: 'success' });
    } catch (error) {
      console.error('[IndexPage] copy link failed', error);
      Taro.showToast({ title: '复制失败', icon: 'error' });
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.heroCard}>
        <Text className={styles.brand}>RE-READ / AI4S INVESTOR RESEARCH</Text>
        <Text className={styles.title}>公众号读完之后，原文之前。</Text>
        <Text className={styles.subtitle}>
          自动识别文章并按固定 SOP 输出标准解读，目标控制在 3-5 分钟阅读完成。
        </Text>
        <View className={styles.tagRow}>
          <TagBadge label={report.mode} tone='dark' />
          {report.tags.map((tag) => (
            <TagBadge key={tag} label={tag} tone='primary' />
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>文章导入</Text>
          <Text className={styles.sectionDesc}>粘贴公众号文章链接后直接解读</Text>
        </View>

        <Text className={styles.snapshotTitle}>{report.title}</Text>
        <View className={styles.metaRow}>
          <TagBadge label={report.articleType} tone='primary' />
          <TagBadge label={`可信度 ${report.meta.credibility}`} tone='default' />
          <Text className={styles.metaText}>{report.account}</Text>
          <Text className={styles.metaText}>{report.articleSnapshot.publishDate}</Text>
        </View>

        <View className={styles.detectedBox}>
          <Text className={styles.detectedLabel}>公众号链接</Text>
          <Input
            className={styles.urlInput}
            type='text'
            maxlength={-1}
            value={articleUrl}
            placeholder='粘贴 mp.weixin.qq.com 文章链接'
            onInput={(event) => setArticleUrl(event.detail.value)}
          />
        </View>

        <View className={styles.detectedBox}>
          <Text className={styles.detectedLabel}>检测到的导入内容</Text>
          <Text className={styles.detectedValue}>{detectedLink}</Text>
        </View>

        <View className={styles.buttonGroup}>
          <Button className={styles.primaryButton} loading={isGenerating} onClick={handleAnalyzeLink}>
            生成公众号解读
          </Button>
          <Button className={styles.secondaryButton} onClick={handlePasteLink}>
            从剪贴板粘贴链接
          </Button>
          <Button className={styles.secondaryButton} onClick={handleSwitchReport}>
            切换另一篇样例文章
          </Button>
          <Button className={styles.secondaryButton} onClick={handleOpenMockReport}>
            查看模板报告
          </Button>
          <Button className={styles.ghostButton} onClick={handleOpenReport}>
            查看完整报告页
          </Button>
        </View>
      </View>

      <View className={styles.statusCard}>
        <Text className={styles.statusLabel}>当前生成状态</Text>
        <Text className={styles.statusValue}>{statusText}</Text>
        <View className={styles.sourceGrid}>
          <View className={styles.sourceItem}>
            <Text className={styles.sourceLabel}>一手材料</Text>
            <Text className={styles.sourceValue}>{report.articleSnapshot.originalMaterial}</Text>
          </View>
          <View className={styles.sourceItem}>
            <Text className={styles.sourceLabel}>来源账号</Text>
            <Text className={styles.sourceValue}>{report.articleSnapshot.sourceName}</Text>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>解读流程</Text>
          <Text className={styles.sectionDesc}>遵循你定义的标准 SOP</Text>
        </View>
        <View className={styles.progressList}>
          {report.pipeline.map((step, index) => (
            <View key={step.key} className={styles.progressRow}>
              <View className={styles.progressIndex}>
                <Text>{index + 1}</Text>
              </View>
              <View className={styles.progressBody}>
                <Text className={styles.progressTitle}>{step.title}</Text>
                <Text className={styles.progressDesc}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>核心指标</Text>
          <Text className={styles.sectionDesc}>适合先扫一遍，再进入详细模块</Text>
        </View>
        <View className={styles.metricGrid}>
          {metricList.map((metric) => (
            <View key={metric.label} className={styles.metricCard}>
              <Text className={styles.metricLabel}>{metric.label}</Text>
              <Text className={styles.metricValue}>{metric.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {report.sections.map((section) => (
        <View key={section.key} className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>{section.title}</Text>
            {section.highlight ? <TagBadge label={section.highlight} tone='primary' /> : null}
          </View>
          <Text className={styles.sectionSummary}>{section.summary}</Text>
          <View className={styles.bulletList}>
            {section.bullets.map((bullet) => (
              <View key={bullet} className={styles.bulletRow}>
                <View className={styles.bulletDot} />
                <Text className={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <View className={styles.card}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>领域发展时间线</Text>
          <Text className={styles.sectionDesc}>用于定位本文在赛道中的位置</Text>
        </View>
        <View className={styles.timelineList}>
          {report.timeline.map((item) => (
            <View key={item.year + item.title} className={styles.timelineRow}>
              <Text className={styles.timelineYear}>{item.year}</Text>
              <Text className={styles.timelineTitle}>{item.title}</Text>
              <Text className={styles.timelineDesc}>{item.description}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>参考文献</Text>
          <Text className={styles.sectionDesc}>每条引用都可复制链接继续追原文</Text>
        </View>
        <View className={styles.referenceList}>
          {report.references.map((reference) => (
            <View key={reference.id} className={styles.referenceCard}>
              <Text className={styles.snapshotTitle}>{reference.id} · {reference.title}</Text>
              <Text className={styles.metaText}>{reference.author}</Text>
              <Button className={styles.ghostButton} onClick={() => handleCopyLink(reference.link)}>
                复制原文链接
              </Button>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
};

export default IndexPage;
