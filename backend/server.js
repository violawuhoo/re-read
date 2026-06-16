const http = require('http');
const { URL } = require('url');
const { getRuntimeConfig } = require('./config');
const { buildReportFromPayload } = require('./report-engine');
const { loadReports, saveReports, storeFile } = require('./storage');
const { createAnalysisTask, getTaskById } = require('./task-queue');
const { resolveArticlePayload, validateArticlePayload } = require('./article-fetcher');
const { runSopAgent } = require('./agent-adapter');

const runtimeConfig = getRuntimeConfig();
const PORT = runtimeConfig.port;
const HOST = runtimeConfig.host;
let generatedReports = loadReports();

const findExistingReportByArticleUrl = (articleUrl = '') => {
  if (!articleUrl) {
    return null;
  }

  return (
    generatedReports.find((report) => report?.articleSnapshot?.articleUrl === articleUrl && /^reread-report-/.test(report.id || '')) || null
  );
};

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 2 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });

    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });

const serializeApiError = (error, fallbackMessage) => ({
  message: error?.message || fallbackMessage,
  errorCode: error?.code || 'UNKNOWN_ERROR'
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && pathname === '/health') {
    sendJson(res, 200, {
      ok: true,
      service: 're-read-backend',
      reports: generatedReports.length,
      storeFile,
      llm: runtimeConfig.llm
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/system/config') {
    sendJson(res, 200, {
      service: 're-read-backend',
      backend: {
        host: HOST,
        port: PORT,
        storeFile
      },
      llm: runtimeConfig.llm
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/reports') {
    sendJson(res, 200, {
      items: generatedReports.map((report) => ({
        id: report.id,
        title: report.title,
        subtitle: report.subtitle,
        coreClaim: report.coreClaim,
        account: report.account,
        cover: report.cover,
        articleType: report.articleType,
        mode: report.mode,
        generatedAt: report.generatedAt,
        status: report.status,
        tags: report.tags,
        meta: report.meta,
        articleSnapshot: report.articleSnapshot,
        pipeline: report.pipeline,
        timeline: report.timeline,
        sections: report.sections,
        references: report.references
      }))
    });
    return;
  }

  if (req.method === 'GET' && pathname.startsWith('/api/reports/')) {
    const reportId = pathname.replace('/api/reports/', '');
    const report = generatedReports.find((item) => item.id === reportId);

    if (!report) {
      sendJson(res, 404, { message: 'Report not found' });
      return;
    }

    sendJson(res, 200, report);
    return;
  }

  if (req.method === 'GET' && pathname.startsWith('/api/tasks/')) {
    const taskId = pathname.replace('/api/tasks/', '');
    const task = getTaskById(taskId);

    if (!task) {
      sendJson(res, 404, { message: 'Task not found' });
      return;
    }

    sendJson(res, 200, task);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/tasks') {
    try {
      const payload = validateArticlePayload(await readBody(req));
      const existingReport = findExistingReportByArticleUrl(payload.articleUrl);

      if (existingReport) {
        sendJson(res, 202, {
          taskId: `task_cached_${Date.now()}`,
          status: 'completed',
          progress: 100,
          stage: '复用已生成报告',
          message: '检测到相同链接的已生成报告，直接打开结果',
          reportId: existingReport.id
        });
        return;
      }

      const task = createAnalysisTask({
        payload,
        onCompleted: (report) => {
          generatedReports = [report, ...generatedReports];
          saveReports(generatedReports);
        }
      });
      sendJson(res, 202, task);
      return;
    } catch (error) {
      console.error('[Backend] create task failed', error);
      sendJson(res, 400, serializeApiError(error, 'Invalid task payload'));
      return;
    }
  }

  if (req.method === 'POST' && pathname === '/api/analyze') {
    try {
      const payload = validateArticlePayload(await readBody(req));
      const existingReport = findExistingReportByArticleUrl(payload.articleUrl);

      if (existingReport) {
        sendJson(res, 200, existingReport);
        return;
      }

      const resolvedPayload = await resolveArticlePayload(payload);
      const agentResult = await runSopAgent(resolvedPayload);
      const report = buildReportFromPayload(resolvedPayload, agentResult);
      generatedReports = [report, ...generatedReports];
      saveReports(generatedReports);
      sendJson(res, 200, report);
      return;
    } catch (error) {
      console.error('[Backend] analyze failed', error);
      sendJson(res, 400, serializeApiError(error, 'Invalid request payload'));
      return;
    }
  }

  sendJson(res, 404, { message: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`[ReReadBackend] listening on http://${HOST}:${PORT}`);
});
