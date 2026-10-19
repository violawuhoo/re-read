const fs = require('fs');
const path = require('path');

const envFilePath = path.join(__dirname, '.env');

const loadEnvFile = () => {
  if (!fs.existsSync(envFilePath)) {
    return;
  }

  const content = fs.readFileSync(envFilePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
};

loadEnvFile();

const detectProvider = (baseUrl = '') => {
  if (!baseUrl) {
    return 'mock';
  }

  const lowerUrl = baseUrl.toLowerCase();

  if (lowerUrl.includes('moonshot') || lowerUrl.includes('kimi')) {
    return 'kimi';
  }

  if (lowerUrl.includes('openai')) {
    return 'openai';
  }

  if (lowerUrl.includes('deepseek')) {
    return 'deepseek';
  }

  if (lowerUrl.includes('volcengine') || lowerUrl.includes('doubao') || lowerUrl.includes('ark')) {
    return 'doubao';
  }

  return 'openai-compatible';
};

const resolveModel = (provider, model) => {
  const normalizedModel = (model || '').trim();
  if (normalizedModel) {
    return normalizedModel;
  }

  if (provider === 'kimi') {
    return 'kimi-k2.6';
  }

  if (provider === 'doubao') {
    return 'doubao-seed-2.0-pro';
  }

  return '';
};

const parseOpenidList = (value = '') =>
  String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const getRuntimeConfig = () => {
  const baseUrl = process.env.REREAD_LLM_BASE_URL || '';
  const provider = detectProvider(baseUrl);
  const model = resolveModel(provider, process.env.REREAD_LLM_MODEL || '');

  return {
    // 云托管会注入 PORT，本地默认 8787
    host: process.env.REREAD_HOST || '0.0.0.0',
    port: Number(process.env.PORT || process.env.REREAD_PORT || 8787),
    llm: {
      enabled: Boolean(baseUrl && process.env.REREAD_LLM_API_KEY && model),
      baseUrl,
      model,
      provider,
      apiKeyConfigured: Boolean(process.env.REREAD_LLM_API_KEY),
      temperature: Number(process.env.REREAD_LLM_TEMPERATURE || 0.2)
    },
    // 自用保护：填了白名单就只允许这些 openid 调用，留空则不做限制（仅本地调试）
    allowedOpenids: parseOpenidList(process.env.REREAD_ALLOWED_OPENIDS),
    requireOpenid: process.env.REREAD_REQUIRE_OPENID === '1',
    dailyLimit: Number(process.env.REREAD_DAILY_LIMIT || 20),
    storeMode: process.env.REREAD_STORE || (process.env.TCB_ENV ? 'cloud' : 'file'),
    envFilePath
  };
};

module.exports = {
  getRuntimeConfig,
  envFilePath
};
