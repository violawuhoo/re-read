import Taro from '@tarojs/taro';
import { API_BASE, API_TRANSPORT, CLOUD_ENV, CLOUD_SERVICE } from '@/config/runtime';
import { reportLibrary } from '@/data/report';
import { AnalysisTaskRecord, QuotaInfo, ReportRecord } from '@/types/reread';

const DEFAULT_SOURCE_NAME = '公众号链接导入';

const cloud = () =>
  (Taro as unknown as {
    cloud?: {
      callContainer: (options: Record<string, unknown>) => Promise<{ statusCode: number; data: unknown }>;
    };
  }).cloud;

class BackendRequestError extends Error {
  statusCode?: number;
  errorCode?: string;
  isNetworkError: boolean;

  constructor(message: string, options: { statusCode?: number; errorCode?: string; isNetworkError?: boolean } = {}) {
    super(message);
    this.name = 'BackendRequestError';
    this.statusCode = options.statusCode;
    this.errorCode = options.errorCode;
    this.isNetworkError = options.isNetworkError || false;
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

const isBackendRequestError = (error: unknown): error is BackendRequestError => error instanceof BackendRequestError;

type ApiOptions = { method?: 'GET' | 'POST'; data?: Record<string, unknown>; timeout?: number };

/**
 * 唯一出口：小程序端所有后端调用都走这里。
 * 云托管用 callContainer（不校验域名，不用备案），本地调试走 http。
 */
const requestApi = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const method = options.method || 'GET';

  if (API_TRANSPORT === 'http') {
    try {
      const response = await Taro.request<T>({
        url: `${API_BASE}${path}`,
        method,
        data: options.data,
        timeout: options.timeout || 15000
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
      throw new BackendRequestError('连不上本地后端，请确认 backend/server.js 已启动且手机与电脑在同一网络', {
        isNetworkError: true
      });
    }
  }

  const taroCloud = cloud();
  if (!taroCloud) {
    throw new BackendRequestError('当前环境不支持云托管调用', { isNetworkError: true });
  }

  try {
    const response = await taroCloud.callContainer({
      config: { env: CLOUD_ENV },
      path,
      method,
      timeout: options.timeout || 30000,
      header: {
        'X-WX-SERVICE': CLOUD_SERVICE,
        'content-type': 'application/json'
      },
      data: options.data
    });

    const backendError = readBackendError(response.data);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response.data as T;
    }

    throw new BackendRequestError(backendError.message || '服务暂时不可用，请稍后重试', {
      statusCode: response.statusCode,
      errorCode: backendError.errorCode
    });
  } catch (error) {
    if (isBackendRequestError(error)) {
      throw error;
    }
    throw new BackendRequestError('云服务暂时不可达，请稍后重试', { isNetworkError: true });
  }
};

export const normalizeArticleUrl = (value: string): string => value.trim();

const buildAnalyzePayload = (payload: { content?: string; articleUrl?: string; sourceName?: string }) => ({
  content: payload.content || '',
  articleUrl: payload.articleUrl || '',
  sourceName: payload.sourceName || DEFAULT_SOURCE_NAME
});

export const createArticleUrlTask = async (articleUrl: string): Promise<AnalysisTaskRecord | null> =>
  requestApi<AnalysisTaskRecord>('/api/tasks', {
    method: 'POST',
    timeout: 20000,
    data: buildAnalyzePayload({
      articleUrl: normalizeArticleUrl(articleUrl),
      sourceName: DEFAULT_SOURCE_NAME
    })
  });

/**
 * 同步接口只作为任务队列不可用时的兜底。
 * 失败时直接报错，不再伪造本地样例报告。
 */
export const analyzeArticleUrlSync = async (articleUrl: string): Promise<ReportRecord> => {
  const report = await requestApi<ReportRecord>('/api/analyze', {
    method: 'POST',
    timeout: 30000,
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
  try {
    const task = await requestApi<AnalysisTaskRecord>(`/api/tasks/${encodeURIComponent(taskId)}`, {
      timeout: 10000
    });
    return task?.taskId ? task : null;
  } catch (error) {
    console.warn('[ReReadService] poll task failed', error);
    return null;
  }
};

export const fetchReportById = async (reportId: string): Promise<ReportRecord | null> => {
  try {
    const report = await requestApi<ReportRecord>(`/api/reports/${encodeURIComponent(reportId)}`, {
      timeout: 15000
    });
    return report?.id ? report : null;
  } catch (error) {
    console.warn('[ReReadService] fetch report failed', error);
    return null;
  }
};

export const fetchReports = async (): Promise<ReportRecord[] | null> => {
  try {
    const payload = await requestApi<{ items: ReportRecord[] }>('/api/reports', { timeout: 15000 });
    return Array.isArray(payload?.items) ? payload.items : null;
  } catch (error) {
    console.warn('[ReReadService] fetch reports failed', error);
    return null;
  }
};

export const fetchMe = async (): Promise<{
  openid: string;
  quota: QuotaInfo;
  llm: { enabled?: boolean; provider?: string; model?: string };
  store: { mode: string };
} | null> => {
  try {
    return await requestApi('/api/me', { timeout: 10000 });
  } catch (error) {
    console.warn('[ReReadService] fetch me failed', error);
    return null;
  }
};

export const checkBackendHealth = async (): Promise<{
  ok: boolean;
  service?: string;
  llmEnabled?: boolean;
  llmModel?: string;
  llmProvider?: string;
  storageMode?: string;
}> => {
  try {
    const payload = await requestApi<{
      ok: boolean;
      service: string;
      store?: { mode: string };
      llm?: { enabled?: boolean; model?: string; provider?: string };
    }>('/health', { timeout: 10000 });

    if (payload?.ok) {
      return {
        ok: true,
        service: payload.service,
        llmEnabled: payload.llm?.enabled,
        llmModel: payload.llm?.model,
        llmProvider: payload.llm?.provider,
        storageMode: payload.store?.mode
      };
    }
  } catch (error) {
    console.warn('[ReReadService] backend health failed', error);
  }

  return { ok: false };
};

export const getNextDemoReport = (currentId: string): ReportRecord => {
  const currentIndex = reportLibrary.findIndex((item) => item.id === currentId);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % reportLibrary.length : 0;
  return reportLibrary[nextIndex];
};

/** 首页等待报告时的轮询循环：2 秒一次，最多等 6 分钟 */
export const waitForReport = async (
  taskId: string,
  onProgress: (status: string, progress: number) => void
): Promise<string> => {
  for (let index = 0; index < 180; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const task = await pollAnalysisTask(taskId);

    if (!task) {
      onProgress('任务状态读取失败，正在重试...', 0);
      continue;
    }

    const statusText = [task.stage, typeof task.progress === 'number' ? `${task.progress}%` : '']
      .filter(Boolean)
      .join(' · ');
    onProgress(statusText || '正在生成报告...', typeof task.progress === 'number' ? task.progress : 0);

    if (task.status === 'completed' && task.reportId) {
      return task.reportId;
    }

    if (task.status === 'failed') {
      throw new Error(task.message || '分析失败，请稍后重试');
    }
  }

  throw new Error('报告生成时间较长，请稍后到历史页查看');
};
