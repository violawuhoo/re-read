import Taro from '@tarojs/taro';
import { getBackendBaseUrl } from '@/config/runtime';
import { getReportById, reportLibrary } from '@/data/report';
import { AnalysisTaskRecord, ReportRecord } from '@/types/reread';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DEFAULT_SOURCE_NAME = '公众号链接导入';

class BackendRequestError extends Error {
  statusCode?: number;
  errorCode?: string;
  shouldFallback: boolean;

  constructor(message: string, options: { statusCode?: number; errorCode?: string; shouldFallback?: boolean } = {}) {
    super(message);
    this.name = 'BackendRequestError';
    this.statusCode = options.statusCode;
    this.errorCode = options.errorCode;
    this.shouldFallback = options.shouldFallback || false;
  }
}

const readBackendError = (payload: unknown): { message?: string; errorCode?: string } => {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const maybePayload = payload as { message?: unknown; errorCode?: unknown };
  return {
    message: typeof maybePayload.message === 'string' ? maybePayload.message : undefined,
    errorCode: typeof maybePayload.errorCode === 'string' ? maybePayload.errorCode : undefined
  };
};

const getNetworkErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '后端暂时不可达，请稍后重试';
};

const isBackendRequestError = (error: unknown): error is BackendRequestError => error instanceof BackendRequestError;

const requestJson = async <T>(options: Taro.request.Option): Promise<T> => {
  try {
    const response = await Taro.request<T>({
      ...options
    });
    const backendError = readBackendError(response.data);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response.data;
    }

    throw new BackendRequestError(backendError.message || '后端请求失败，请稍后重试', {
      statusCode: response.statusCode,
      errorCode: backendError.errorCode
    });
  } catch (error) {
    if (isBackendRequestError(error)) {
      throw error;
    }

    throw new BackendRequestError(getNetworkErrorMessage(error), {
      shouldFallback: true
    });
  }
};

export const readClipboardCandidate = async (): Promise<string> => {
  try {
    const result = await Taro.getClipboardData();
    console.info('[ReReadService] clipboard detected', { length: result.data?.length ?? 0 });
    return result.data || '';
  } catch (error) {
    console.error('[ReReadService] clipboard read failed', error);
    throw error;
  }
};

export const normalizeArticleUrl = (value: string): string => value.trim();

const buildAnalyzePayload = (payload: { content?: string; articleUrl?: string; sourceName?: string }) => ({
  content: payload.content || '',
  articleUrl: payload.articleUrl || '',
  sourceName: payload.sourceName || DEFAULT_SOURCE_NAME
});

export const inferReportIdFromContent = (content: string): string => {
  if (!content) {
    return 'reread-001';
  }

  if (/多模态|foundation model|分子基础模型/i.test(content)) {
    return 'reread-002';
  }

  if (/综述|PR|融资|发布会|announcement|产品发布/i.test(content)) {
    return 'reread-003';
  }

  return 'reread-001';
};

export const generateReportFromContent = async (content: string): Promise<ReportRecord> => {
  console.info('[ReReadService] generate report from content');
  await sleep(300);
  const remoteBaseUrl = getBackendBaseUrl();

  try {
    const report = await requestJson<ReportRecord>({
      url: `${remoteBaseUrl}/api/analyze`,
      method: 'POST',
      timeout: 3000,
      data: buildAnalyzePayload({
        content,
        articleUrl: content,
        sourceName: '小程序剪贴板导入'
      })
    });

    if (report?.id) {
      console.info('[ReReadService] remote analyze success');
      return report;
    }
  } catch (error) {
    if (!isBackendRequestError(error) || !error.shouldFallback) {
      throw error;
    }
    console.warn('[ReReadService] remote analyze unavailable, fallback to local mock', error);
  }

  const reportId = inferReportIdFromContent(content);
  const report = getReportById(reportId);

  if (!report) {
    const error = new Error(`Report not found for content: ${reportId}`);
    console.error('[ReReadService] missing report', error);
    throw error;
  }

  await sleep(600);

  return {
    ...report,
    generatedAt: '2026-06-10 22:06',
    status: '已按最新导入内容刷新（本地回退）'
  };
};

export const createAnalysisTask = async (payload: {
  content?: string;
  articleUrl?: string;
  sourceName?: string;
}): Promise<AnalysisTaskRecord | null> => {
  const remoteBaseUrl = getBackendBaseUrl();

  try {
    const task = await requestJson<AnalysisTaskRecord>({
      url: `${remoteBaseUrl}/api/tasks`,
      method: 'POST',
      timeout: 3000,
      data: buildAnalyzePayload(payload)
    });

    if (task?.taskId) {
      return task;
    }
  } catch (error) {
    if (!isBackendRequestError(error) || !error.shouldFallback) {
      throw error;
    }
    console.warn('[ReReadService] create task failed, fallback to sync mode', error);
  }

  return null;
};

export const createArticleUrlTask = async (articleUrl: string): Promise<AnalysisTaskRecord | null> =>
  createAnalysisTask({
    articleUrl: normalizeArticleUrl(articleUrl),
    sourceName: DEFAULT_SOURCE_NAME
  });

export const analyzeArticleUrlSync = async (articleUrl: string): Promise<ReportRecord> => {
  const remoteBaseUrl = getBackendBaseUrl();
  const report = await requestJson<ReportRecord>({
    url: `${remoteBaseUrl}/api/analyze`,
    method: 'POST',
    timeout: 12000,
    data: buildAnalyzePayload({
      articleUrl: normalizeArticleUrl(articleUrl),
      sourceName: DEFAULT_SOURCE_NAME
    })
  });

  if (!report?.id) {
    throw new BackendRequestError('报告生成失败，请稍后重试');
  }

  return report;
};

export const pollAnalysisTask = async (taskId: string): Promise<AnalysisTaskRecord | null> => {
  const remoteBaseUrl = getBackendBaseUrl();

  try {
    const task = await requestJson<AnalysisTaskRecord>({
      url: `${remoteBaseUrl}/api/tasks/${taskId}`,
      method: 'GET',
      timeout: 2500
    });

    if (task?.taskId) {
      return task;
    }
  } catch (error) {
    console.warn('[ReReadService] poll task failed', error);
  }

  return null;
};

export const fetchReportById = async (reportId: string): Promise<ReportRecord | null> => {
  const remoteBaseUrl = getBackendBaseUrl();

  try {
    const report = await requestJson<ReportRecord>({
      url: `${remoteBaseUrl}/api/reports/${reportId}`,
      method: 'GET',
      timeout: 2500
    });

    if (report?.id) {
      return report;
    }
  } catch (error) {
    console.warn('[ReReadService] fetch report failed', error);
  }

  return null;
};

export const fetchReports = async (): Promise<ReportRecord[] | null> => {
  const remoteBaseUrl = getBackendBaseUrl();

  try {
    const payload = await requestJson<{ items: ReportRecord[] }>({
      url: `${remoteBaseUrl}/api/reports`,
      method: 'GET',
      timeout: 2500
    });

    if (Array.isArray(payload?.items)) {
      return payload.items;
    }
  } catch (error) {
    console.warn('[ReReadService] fetch reports failed', error);
  }

  return null;
};

export const checkBackendHealth = async (): Promise<{
  ok: boolean;
  service?: string;
  reports?: number;
  baseUrl: string;
  llmEnabled?: boolean;
  llmModel?: string;
  llmProvider?: string;
}> => {
  const remoteBaseUrl = getBackendBaseUrl();

  try {
    const payload = await requestJson<{
      ok: boolean;
      service: string;
      reports: number;
      llm?: { enabled?: boolean; model?: string; provider?: string };
    }>({
      url: `${remoteBaseUrl}/health`,
      method: 'GET',
      timeout: 2500
    });

    if (payload?.ok) {
      return {
        ok: true,
        service: payload.service,
        reports: payload.reports,
        baseUrl: remoteBaseUrl,
        llmEnabled: payload.llm?.enabled,
        llmModel: payload.llm?.model,
        llmProvider: payload.llm?.provider
      };
    }
  } catch (error) {
    console.warn('[ReReadService] backend health failed', error);
  }

  return {
    ok: false,
    baseUrl: remoteBaseUrl
  };
};

export const getBackendRuntimeConfig = async (): Promise<{
  ok: boolean;
  backendHost?: string;
  backendPort?: number;
  llmEnabled?: boolean;
  llmModel?: string;
  llmBaseUrl?: string;
  llmProvider?: string;
}> => {
  const remoteBaseUrl = getBackendBaseUrl();

  try {
    const payload = await requestJson<{
      service: string;
      backend: { host: string; port: number; storeFile: string };
      llm: { enabled: boolean; model: string; baseUrl: string; provider: string; apiKeyConfigured: boolean };
    }>({
      url: `${remoteBaseUrl}/api/system/config`,
      method: 'GET',
      timeout: 2500
    });

    if (payload?.backend) {
      return {
        ok: true,
        backendHost: payload.backend.host,
        backendPort: payload.backend.port,
        llmEnabled: payload.llm?.enabled,
        llmModel: payload.llm?.model,
        llmBaseUrl: payload.llm?.baseUrl,
        llmProvider: payload.llm?.provider
      };
    }
  } catch (error) {
    console.warn('[ReReadService] backend config failed', error);
  }

  return { ok: false };
};

export const getNextDemoReport = (currentId: string): ReportRecord => {
  const currentIndex = reportLibrary.findIndex((item) => item.id === currentId);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % reportLibrary.length : 0;
  return reportLibrary[nextIndex];
};
