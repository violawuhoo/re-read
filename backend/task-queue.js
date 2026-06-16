const { buildReportFromPayload } = require('./report-engine');
const { runSopAgent } = require('./agent-adapter');
const { resolveArticlePayload } = require('./article-fetcher');

const tasks = new Map();
const DEBUG_ENV_PATH = '.dbg/report-loading-spinner.env';

// #region debug-point A:report-task-events
const reportDebugEvent = (hypothesisId, location, msg, data = {}) => {
  let url = 'http://127.0.0.1:7777/event';
  let sessionId = 'report-loading-spinner';
  try {
    const envText = require('fs').readFileSync(DEBUG_ENV_PATH, 'utf8');
    url = envText.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || url;
    sessionId = envText.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || sessionId;
  } catch {}
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, runId: 'post-fix', hypothesisId, location, msg: `[DEBUG] ${msg}`, data, ts: Date.now() })
  }).catch(() => {});
};
// #endregion

const createTaskId = () => `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const createTaskRecord = () => ({
  taskId: createTaskId(),
  status: 'queued',
  progress: 0,
  stage: '任务已创建',
  message: '等待进入分析队列'
});

const serializeTaskError = (error) => ({
  message: error?.message || '分析过程中发生错误',
  errorCode: error?.code || 'UNKNOWN_ERROR'
});

const getTaskById = (taskId) => tasks.get(taskId);

const createAnalysisTask = ({ payload, onCompleted }) => {
  const task = createTaskRecord();
  tasks.set(task.taskId, task);
  // #region debug-point A:task-created
  reportDebugEvent('A', 'backend/task-queue.js:createAnalysisTask', 'task created', {
    taskId: task.taskId,
    hasArticleUrl: Boolean(payload?.articleUrl),
    hasContent: Boolean(payload?.content),
    sourceName: payload?.sourceName || ''
  });
  // #endregion

  const updateTask = (partial) => {
    const nextTask = {
      ...tasks.get(task.taskId),
      ...partial
    };
    tasks.set(task.taskId, nextTask);
    // #region debug-point B:task-updated
    reportDebugEvent('B', 'backend/task-queue.js:updateTask', 'task state updated', {
      taskId: task.taskId,
      status: nextTask.status,
      progress: nextTask.progress,
      stage: nextTask.stage,
      message: nextTask.message,
      reportId: nextTask.reportId || null,
      errorCode: nextTask.errorCode || null
    });
    // #endregion
    return nextTask;
  };

  const run = async () => {
    try {
      let resolvedPayload = payload;

      updateTask({
        status: 'running',
        progress: 10,
        stage: '内容预判',
        message: '正在识别文章类型与内容价值'
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      if (payload.articleUrl && !payload.content) {
        updateTask({
          progress: 20,
          stage: '正文抓取',
          message: '正在根据公众号链接抓取正文'
        });

        // #region debug-point D:resolve-article-start
        reportDebugEvent('D', 'backend/task-queue.js:resolveArticlePayload:start', 'resolve article payload start', {
          taskId: task.taskId,
          articleUrl: payload.articleUrl
        });
        // #endregion
        resolvedPayload = await resolveArticlePayload(payload);
        // #region debug-point D:resolve-article-done
        reportDebugEvent('D', 'backend/task-queue.js:resolveArticlePayload:done', 'resolve article payload done', {
          taskId: task.taskId,
          contentLength: resolvedPayload?.content?.length || 0,
          resolvedSourceName: resolvedPayload?.sourceName || '',
          resolvedTitle: resolvedPayload?.resolvedTitle || ''
        });
        // #endregion
      }

      updateTask({
        progress: 25,
        stage: '公众号质量评估',
        message: '公众号质量评估'
      });

      const agentResult = await runSopAgent(resolvedPayload, (stage, progress) => {
        updateTask({
          progress,
          stage,
          message: stage
        });
      });
      // #region debug-point B:agent-finished
      reportDebugEvent('B', 'backend/task-queue.js:runSopAgent:done', 'agent pipeline finished', {
        taskId: task.taskId,
        reportStatus: agentResult?.reportStatus || '',
        signals: Array.isArray(agentResult?.signals) ? agentResult.signals.length : 0,
        moduleErrors: agentResult?.moduleErrors || {}
      });
      // #endregion

      updateTask({
        progress: 95,
        stage: '整合报告',
        message: `正在生成结构化报告：${(agentResult.signals || ['模块执行中']).join('；')}`
      });

      await new Promise((resolve) => setTimeout(resolve, 400));

      const report = buildReportFromPayload(resolvedPayload, agentResult);
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
      const serializedError = serializeTaskError(error);
      // #region debug-point C:task-failed
      reportDebugEvent('C', 'backend/task-queue.js:run:catch', 'task failed', {
        taskId: task.taskId,
        message: serializedError.message,
        errorCode: serializedError.errorCode
      });
      // #endregion
      updateTask({
        status: 'failed',
        progress: 100,
        stage: '任务失败',
        message: serializedError.message,
        errorCode: serializedError.errorCode
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
