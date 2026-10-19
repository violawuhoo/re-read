import Taro from '@tarojs/taro';

/**
 * 运行环境配置。
 *
 * 两种传输方式，构建时决定，不再有"运行时切换到某个地址"这种玩法：
 * - cloudrun：微信云托管 callContainer（免域名校验、免 ICP 备案，推荐）
 * - http：本地或自有服务器（仅调试用）
 *
 * 构建时通过环境变量注入：
 *   TARO_APP_CLOUD_ENV      云开发环境 id
 *   TARO_APP_CLOUD_SERVICE  云托管服务名
 *   TARO_APP_API_BASE       一旦设置就改走 http，例：http://192.168.1.8:8787
 */
export const CLOUD_ENV = process.env.TARO_APP_CLOUD_ENV || '';
export const CLOUD_SERVICE = process.env.TARO_APP_CLOUD_SERVICE || 'reread-api';
export const API_BASE = (process.env.TARO_APP_API_BASE || '').replace(/\/$/, '');

export const API_TRANSPORT: 'cloudrun' | 'http' = API_BASE ? 'http' : 'cloudrun';

let cloudReady = false;

export const initCloud = () => {
  if (API_TRANSPORT !== 'cloudrun' || cloudReady) {
    return;
  }

  const cloud = (Taro as unknown as { cloud?: { init: (options: Record<string, unknown>) => void } }).cloud;
  if (!cloud) {
    console.warn('[Runtime] 当前平台不支持云开发调用，请检查运行环境');
    return;
  }

  if (!CLOUD_ENV) {
    console.warn('[Runtime] 未配置 TARO_APP_CLOUD_ENV，云托管调用会失败');
  }

  cloud.init({ env: CLOUD_ENV || undefined, traceUser: true });
  cloudReady = true;
};

export const describeTransport = () =>
  API_TRANSPORT === 'http' ? `本地接口 ${API_BASE}` : `云托管 ${CLOUD_SERVICE}`;
