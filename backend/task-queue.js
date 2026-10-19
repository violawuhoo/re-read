const { buildReportFromPayload } = require('./report-engine');
const { runSopAgent } = require('./agent-adapter');
const { resolveArticlePayload } = require('./article-fetcher');
const { getStore } = require('./store');
const { todayKey } = require('./quota');

const createTaskId = () => `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const createTaskRecord = (ownerOpenid) => ({
  taskId: createTaskId(),
  ownerOpenid: ownerOpenid || '',
  status: 'queued',
  progress: 0,
  stage: '任务已创建',
  message: '等待进入分析队列',
  createdAt: new Date().toISOString()
});

const serializeTaskError = (error) => ({
  message: error?.message || '分析过程中发生错误',
  errorCode: error?.code || 'UNKNOWN_ERROR'
});

const getTaskById = async (taskId) => getStore().getTask(taskId);

/**
 * 任务落库后异步执行。
 * 进程内不再保存任务状态——重启、缩容到 0 都不会丢任务。
 */
const createAnalysisTask = async ({ payload, ownerOpenid, onCompleted }) => {
  const store = getStore();
  const task = createTaskRecord(ownerOpenid);
  await store.createTask(task);

  const updateTask = async (partial) => {
    const next = await store.patchTask(task.taskId, partial);
    return next || { ...task, ...partial };
  };

  const run = async () => {
    try {
      let resolvedPayload = payload;

      await updateTask({
        status: 'running',
        progress: 10,
        stage: '内容预判',
        message: '正在识别文章类型与内容价值'
      });

      if (payload.articleUrl && !payload.content) {
        await updateTask({
          progress: 20,
          stage: '正文抓取',
          message: '正在根据公众号链接抓取正文'
        });
        resolvedPayload = await resolveArticlePayload(payload);
      }

      await updateTask({
        progress: 25,
        stage: '公众号质量评估',
        message: '公众号质量评估'
      });

      const agentResult = await runSopAgent(resolvedPayload, (stage, progress) => {
        updateTask({ progress, stage, message: stage }).catch(() => {});
      });

      await updateTask({
        progress: 95,
        stage: '整合报告',
        message: `正在生成结构化报告：${(agentResult.signals || ['模块执行中']).join('；')}`
      });

      const report = buildReportFromPayload(resolvedPayload, agentResult, { ownerOpenid });

      if (typeof onCompleted === 'function') {
        await onCompleted(report);
      }

      await updateTask({
        status: 'completed',
        progress: 100,
        stage: '任务完成',
        message: '报告已生成',
        reportId: report.id
      });
    } catch (error) {
      console.error('[TaskQueue] task failed', error);
      const serializedError = serializeTaskError(error);
      // 任务在真正消耗模型之前就失败（比如公众号正文抓不到），把额度还回去
      if (ownerOpenid) {
        await store.incUsage(ownerOpenid, todayKey(), -1).catch(() => {});
      }
      await updateTask({
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
