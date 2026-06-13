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

        resolvedPayload = await resolveArticlePayload(payload);
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
