import Taro from '@tarojs/taro';

const STORAGE_KEY = 'reread_backend_base_url';
const LOCAL_BACKEND_URL = 'http://127.0.0.1:8787';
const PRODUCTION_PLACEHOLDER_URL = 'https://api.reread.your-domain.com';

export const getLocalBackendUrl = () => LOCAL_BACKEND_URL;

export const getProductionPlaceholderUrl = () => PRODUCTION_PLACEHOLDER_URL;

export const getBackendBaseUrl = (): string => {
  const savedValue = Taro.getStorageSync<string>(STORAGE_KEY);
  return savedValue || LOCAL_BACKEND_URL;
};

export const setBackendBaseUrl = (value: string) => {
  Taro.setStorageSync(STORAGE_KEY, value);
};
