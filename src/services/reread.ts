import Taro from '@tarojs/taro';
import { getBackendBaseUrl } from '@/config/runtime';
import { getReportById, reportLibrary } from '@/data/report';
import { AnalysisTaskRecord, ReportRecord } from '@/types/reread';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DEFAULT_SOURCE_NAME = '公众号链接导入';

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
    const response = await Taro.request<ReportRecord>({
      url: `${remoteBaseUrl}/api/analyze`,
      method: 'POST',
      timeout: 3000,
      data: buildAnalyzePayload({
        content,
        articleUrl: content,
        sourceName: '小程序剪贴板导入'
      })
    });

    if (response.statusCode >= 200 && response.statusCode < 300 && response.data?.id) {
      console.info('[ReReadService] remote analyze success');
      return response.data;
    }
  } catch (error) {
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
    const response = await Taro.request<AnalysisTaskRecord>({
      url: `${remoteBaseUrl}/api/tasks`,
      method: 'POST',
      timeout: 3000,
      data: buildAnalyzePayload(payload)
    });

    if (response.statusCode >= 200 && response.statusCode < 300 && response.data?.taskId) {
      return response.data;
    }
  } catch (error) {
    console.warn('[ReReadService] create task failed, fallback to sync mode', error);
  }

  return null;
};

export const createArticleUrlTask = async (articleUrl: string): Promise<AnalysisTaskRecord | null> =>
  createAnalysisTask({
    articleUrl: normalizeArticleUrl(articleUrl),
    sourceName: DEFAULT_SOURCE_NAME
  });

export const pollAnalysisTask = async (taskId: string): Promise<AnalysisTaskRecord | null> => {
  const remoteBaseUrl = getBackendBaseUrl();

  try {
    const response = await Taro.request<AnalysisTaskRecord>({
      url: `${remoteBaseUrl}/api/tasks/${taskId}`,
      method: 'GET',
      timeout: 2500
    });

    if (response.statusCode >= 200 && response.statusCode < 300 && response.data?.taskId) {
      return response.data;
    }
  } catch (error) {
    console.warn('[ReReadService] poll task failed', error);
  }

  return null;
};

export const fetchReportById = async (reportId: string): Promise<ReportRecord | null> => {
  const remoteBaseUrl = getBackendBaseUrl();

  try {
    const response = await Taro.request<ReportRecord>({
      url: `${remoteBaseUrl}/api/reports/${reportId}`,
      method: 'GET',
      timeout: 2500
    });

    if (response.statusCode >= 200 && response.statusCode < 300 && response.data?.id) {
      return response.data;
    }
  } catch (error) {
    console.warn('[ReReadService] fetch report failed', error);
  }

  return null;
};

export const fetchReports = async (): Promise<ReportRecord[] | null> => {
  const remoteBaseUrl = getBackendBaseUrl();

  try {
    const response = await Taro.request<{ items: ReportRecord[] }>({
      url: `${remoteBaseUrl}/api/reports`,
      method: 'GET',
      timeout: 2500
    });

    if (response.statusCode >= 200 && response.statusCode < 300 && Array.isArray(response.data?.items)) {
      return response.data.items;
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
    const response = await Taro.request<{
      ok: boolean;
      service: string;
      reports: number;
      llm?: { enabled?: boolean; model?: string; provider?: string };
    }>({
      url: `${remoteBaseUrl}/health`,
      method: 'GET',
      timeout: 2500
    });

    if (response.statusCode >= 200 && response.statusCode < 300 && response.data?.ok) {
      return {
        ok: true,
        service: response.data.service,
        reports: response.data.reports,
        baseUrl: remoteBaseUrl,
        llmEnabled: response.data.llm?.enabled,
        llmModel: response.data.llm?.model,
        llmProvider: response.data.llm?.provider
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
    const response = await Taro.request<{
      service: string;
      backend: { host: string; port: number; storeFile: string };
      llm: { enabled: boolean; model: string; baseUrl: string; provider: string; apiKeyConfigured: boolean };
    }>({
      url: `${remoteBaseUrl}/api/system/config`,
      method: 'GET',
      timeout: 2500
    });

    if (response.statusCode >= 200 && response.statusCode < 300 && response.data?.backend) {
      return {
        ok: true,
        backendHost: response.data.backend.host,
        backendPort: response.data.backend.port,
        llmEnabled: response.data.llm?.enabled,
        llmModel: response.data.llm?.model,
        llmBaseUrl: response.data.llm?.baseUrl,
        llmProvider: response.data.llm?.provider
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
