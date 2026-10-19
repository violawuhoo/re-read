const http = require('http');
const { URL } = require('url');
const { getRuntimeConfig } = require('./config');
const { buildReportFromPayload } = require('./report-engine');
const { getStore } = require('./store');
const { createAnalysisTask, getTaskById } = require('./task-queue');
const { resolveArticlePayload, validateArticlePayload } = require('./article-fetcher');
const { runSopAgent } = require('./agent-adapter');
const { getQuota, consumeQuota } = require('./quota');

const runtimeConfig = getRuntimeConfig();
const PORT = runtimeConfig.port;
const HOST = runtimeConfig.host;
const store = getStore();
const GUEST_OWNER = 'local-user';

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-wx-openid, x-reread-openid'
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

/**
 * 云托管会透传微信身份：x-wx-openid 由平台注入，前端伪造不了。
 * 本地调试时允许 x-reread-openid 或 query.openid 顶上。
 */
const resolveOpenid = (req, url) => {
  const headerOpenid = req.headers['x-wx-openid'];
  if (headerOpenid) {
    return String(headerOpenid);
  }

  if (store.mode === 'file') {
    const debugOpenid = req.headers['x-reread-openid'] || url.searchParams.get('openid') || '';
    if (debugOpenid) {
      return String(debugOpenid);
    }
  }

  return '';
};

const authorize = (req, url, res) => {
  const openid = resolveOpenid(req, url);

  if (runtimeConfig.requireOpenid && !openid) {
    sendJson(res, 401, {
      message: '缺少微信身份，请在小程序内打开',
      errorCode: 'OPENID_REQUIRED'
    });
    return null;
  }

  if (runtimeConfig.allowedOpenids.length > 0 && !runtimeConfig.allowedOpenids.includes(openid)) {
    sendJson(res, 403, {
      message: '当前账号未获授权使用',
      errorCode: 'OPENID_NOT_ALLOWED'
    });
    return null;
  }

  return openid || GUEST_OWNER;
};

const ensureQuota = async (openid, res) => {
  const quota = await getQuota(openid);
  if (!quota.allowed) {
    sendJson(res, 429, {
      message: `今天的解读额度已用完（${quota.used}/${quota.limit}），明天再来`,
      errorCode: 'QUOTA_EXCEEDED',
      quota
    });
    return false;
  }
  return true;
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  // 健康检查不鉴权，供云托管探针使用
  if (req.method === 'GET' && pathname === '/health') {
    sendJson(res, 200, {
      ok: true,
      service: 're-read-backend',
      store: store.describe(),
      llm: {
        enabled: runtimeConfig.llm.enabled,
        provider: runtimeConfig.llm.provider,
        model: runtimeConfig.llm.model
      },
      quota: { limit: runtimeConfig.dailyLimit }
    });
    return;
  }

  const openid = authorize(req, url, res);
  if (!openid) {
    return;
  }

  if (req.method === 'GET' && pathname === '/api/me') {
    const quota = await getQuota(openid);
    sendJson(res, 200, {
      ok: true,
      openid,
      quota,
      llm: {
        enabled: runtimeConfig.llm.enabled,
        provider: runtimeConfig.llm.provider,
        model: runtimeConfig.llm.model
      },
      store: store.describe()
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/system/config') {
    sendJson(res, 200, {
      service: 're-read-backend',
      backend: {
        host: HOST,
        port: PORT,
        store: store.describe()
      },
      llm: {
        enabled: runtimeConfig.llm.enabled,
        provider: runtimeConfig.llm.provider,
        model: runtimeConfig.llm.model,
        baseUrl: runtimeConfig.llm.baseUrl,
        apiKeyConfigured: runtimeConfig.llm.apiKeyConfigured
      },
      quota: { limit: runtimeConfig.dailyLimit }
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/reports') {
    const items = await store.listReports({ ownerOpenid: openid, limit: 50 });
    sendJson(res, 200, { items });
    return;
  }

  if (req.method === 'GET' && pathname.startsWith('/api/reports/')) {
    const reportId = decodeURIComponent(pathname.replace('/api/reports/', ''));
    const report = await store.getReport(reportId);

    if (!report || (report.ownerOpenid && report.ownerOpenid !== openid)) {
      sendJson(res, 404, { message: 'Report not found', errorCode: 'REPORT_NOT_FOUND' });
      return;
    }

    sendJson(res, 200, report);
    return;
  }

  if (req.method === 'GET' && pathname.startsWith('/api/tasks/')) {
    const taskId = decodeURIComponent(pathname.replace('/api/tasks/', ''));
    const task = await getTaskById(taskId);

    if (!task || (task.ownerOpenid && task.ownerOpenid !== openid)) {
      sendJson(res, 404, { message: 'Task not found', errorCode: 'TASK_NOT_FOUND' });
      return;
    }

    sendJson(res, 200, task);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/tasks') {
    try {
      const payload = validateArticlePayload(await readBody(req));
      const existingReport = await store.findReportByArticleUrl(payload.articleUrl, openid);

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

      if (!(await ensureQuota(openid, res))) {
        return;
      }

      const task = await createAnalysisTask({
        payload,
        ownerOpenid: openid,
        onCompleted: async (report) => {
          await store.addReport(report);
        }
      });
      await consumeQuota(openid);

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
      const existingReport = await store.findReportByArticleUrl(payload.articleUrl, openid);

      if (existingReport) {
        sendJson(res, 200, existingReport);
        return;
      }

      if (!(await ensureQuota(openid, res))) {
        return;
      }

      const resolvedPayload = await resolveArticlePayload(payload);
      const agentResult = await runSopAgent(resolvedPayload);
      const report = buildReportFromPayload(resolvedPayload, agentResult, { ownerOpenid: openid });
      await store.addReport(report);
      await consumeQuota(openid);
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

// 任务表定期清理，避免历史任务无限堆积
const cleanupTimer = setInterval(() => {
  store.cleanupTasks().catch((error) => console.warn('[Backend] cleanup failed', error));
}, 6 * 60 * 60 * 1000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

server.listen(PORT, HOST, () => {
  console.log(`[ReReadBackend] listening on http://${HOST}:${PORT} (store=${store.mode})`);
});
