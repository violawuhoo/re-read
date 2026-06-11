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

  return 'openai-compatible';
};

const resolveModel = (provider, model) => {
  const normalizedModel = (model || '').trim();
  if (normalizedModel) {
    return normalizedModel;
  }

  if (provider === 'kimi') {
    return 'moonshot-v1-32k';
  }

  return '';
};

const getRuntimeConfig = () => {
  const baseUrl = process.env.REREAD_LLM_BASE_URL || '';
  const provider = detectProvider(baseUrl);
  const model = resolveModel(provider, process.env.REREAD_LLM_MODEL || '');

  return {
    host: process.env.REREAD_HOST || '127.0.0.1',
    port: Number(process.env.REREAD_PORT || 8787),
    llm: {
      enabled: Boolean(baseUrl && process.env.REREAD_LLM_API_KEY && model),
      baseUrl,
      model,
      provider,
      apiKeyConfigured: Boolean(process.env.REREAD_LLM_API_KEY),
      temperature: Number(process.env.REREAD_LLM_TEMPERATURE || 0.2)
    },
    envFilePath
  };
};

module.exports = {
  getRuntimeConfig,
  envFilePath
};
