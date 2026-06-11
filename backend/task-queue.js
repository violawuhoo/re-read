const { buildReportFromPayload } = require('./report-engine');
const { runSopAgent } = require('./agent-adapter');
const { resolveArticlePayload } = require('./article-fetcher');

const tasks = new Map();

const createTaskId = () => `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const createTaskRecord = () => ({
  taskId: createTaskId(),
  status: 'queued',
  progress: 0,
  stage: '任务已创建',
  message: '等待进入分析队列'
});

const getTaskById = (taskId) => tasks.get(taskId);

const createAnalysisTask = ({ payload, onCompleted }) => {
  const task = createTaskRecord();
  tasks.set(task.taskId, task);

  const updateTask = (partial) => {
    const nextTask = {
      ...tasks.get(task.taskId),
      ...partial
    };
    tasks.set(task.taskId, nextTask);
    return nextTask;
  };

  const run = async () => {
    try {
      let resolvedPayload = payload;

      updateTask({
        status: 'running',
        progress: 15,
        stage: '内容预判',
        message: '正在识别文章类型与内容价值'
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      if (payload.articleUrl && !payload.content) {
        updateTask({
          progress: 35,
          stage: '正文抓取',
          message: '正在根据公众号链接抓取正文'
        });

        resolvedPayload = await resolveArticlePayload(payload);
        // #region debug-point E:resolved-article
        fetch('http://127.0.0.1:7777/event', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: 'wechat-link-analysis',
            runId: 'pre-fix',
            hypothesisId: 'E',
            location: 'backend/task-queue.js:resolvedPayload',
            msg: '[DEBUG] backend resolved article payload',
            data: {
              articleUrl: resolvedPayload.articleUrl,
              title: resolvedPayload.resolvedTitle,
              sourceName: resolvedPayload.resolvedSourceName,
              publishDate: resolvedPayload.resolvedPublishDate,
              contentLength: resolvedPayload.content?.length || 0
            },
            ts: Date.now()
          })
        }).catch(() => {});
        // #endregion
      }

      updateTask({
        progress: 45,
        stage: '一手材料溯源',
        message: '正在模拟 Step 0 与公众号质量核查'
      });

      const agentResult = await runSopAgent(resolvedPayload);
      // #region debug-point F:agent-result
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'wechat-link-analysis',
          runId: 'pre-fix',
          hypothesisId: 'F',
          location: 'backend/task-queue.js:agentResult',
          msg: '[DEBUG] backend received agent result',
          data: {
            adapter: agentResult.adapter,
            articleType: agentResult.articleType,
            reportStatus: agentResult.reportStatus,
            signals: agentResult.signals
          },
          ts: Date.now()
        })
      }).catch(() => {});
      // #endregion

      updateTask({
        progress: 75,
        stage: 'SOP 解读',
        message: `正在生成结构化报告：${agentResult.signals.join('；')}`
      });

      await new Promise((resolve) => setTimeout(resolve, 400));

      const report = buildReportFromPayload(resolvedPayload, agentResult);
      // #region debug-point G:report-built
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'wechat-link-analysis',
          runId: 'pre-fix',
          hypothesisId: 'G',
          location: 'backend/task-queue.js:reportBuilt',
          msg: '[DEBUG] backend built report',
          data: {
            reportId: report.id,
            title: report.title,
            sourceName: report.articleSnapshot?.sourceName,
            articleUrl: report.articleSnapshot?.articleUrl,
            highlight: report.sections?.[0]?.highlight
          },
          ts: Date.now()
        })
      }).catch(() => {});
      // #endregion
      onCompleted(report);

      updateTask({
        status: 'completed',
        progress: 100,
        stage: '任务完成',
        message: '报告已生成',
        reportId: report.id
      });
    } catch (error) {
      console.error('[TaskQueue] task failed', error);
      updateTask({
        status: 'failed',
        progress: 100,
        stage: '任务失败',
        message: error.message || '分析过程中发生错误'
      });
    }
  };

  run();

  return task;
};

module.exports = {
  createAnalysisTask,
  getTaskById
};
