const fs = require('fs');
const path = require('path');
const { getRuntimeConfig } = require('./config');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const systemPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'sop-system-prompt.md'), 'utf-8');

const hasRealLlmConfig = () => {
  const runtimeConfig = getRuntimeConfig();
  return Boolean(runtimeConfig.llm.baseUrl && process.env.REREAD_LLM_API_KEY && runtimeConfig.llm.model);
};

const buildUserPrompt = ({ content = '', articleUrl = '', sourceName = '' }) => {
  return [
    `来源账号：${sourceName || '未知'}`,
    `文章链接：${articleUrl || '未知'}`,
    '公众号文章正文如下：',
    content || '空内容'
  ].join('\n');
};

const buildMockResult = ({ content = '' }) => {
  const signals = [];
  let articleType = 'A+C混合';
  let credibility = '中';
  let hypeLevel = '中';
  let toVcRisk = '中';
  let innovationType = '技术 + 应用 + 系统工程';
  const missingItems = [];
  const followups = [];

  if (/多模态|foundation model|分子基础模型/i.test(content)) {
    articleType = 'A类论文解读';
    credibility = '高';
    toVcRisk = '不适用';
    innovationType = '技术创新';
    signals.push('识别为论文型信号：多模态基础模型');
    followups.push('继续溯源 arXiv、补充材料和作者主页');
  } else if (/综述|PR|融资|发布会|announcement|产品发布/i.test(content)) {
    articleType = '部分可分析';
    credibility = '低';
    hypeLevel = '高';
    toVcRisk = '高';
    innovationType = '叙事包装为主';
    signals.push('识别为 PR / 发布会导向内容');
    missingItems.push('缺少论文 DOI、技术报告或第三方评测');
    followups.push('等待技术报告或客户案例发布');
  } else {
    signals.push('识别为默认 A+C 混合研究线索');
    followups.push('继续核查论文、官网和融资新闻的一致性');
  }

  return {
    adapter: 'mock-sop-agent',
    articleType,
    credibility,
    hypeLevel,
    toVcRisk,
    innovationType,
    reportStatus: '已通过 mock SOP Agent 完成结构化判断',
    signals,
    missingItems,
    followups
  };
};

const parseAgentJson = (content) => {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('No JSON object found in LLM response');
  }
  return JSON.parse(match[0]);
};

const callOpenAiCompatible = async (payload) => {
  const runtimeConfig = getRuntimeConfig();
  const response = await fetch(`${process.env.REREAD_LLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.REREAD_LLM_API_KEY}`
    },
    body: JSON.stringify({
      model: runtimeConfig.llm.model,
      temperature: runtimeConfig.llm.temperature,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: buildUserPrompt(payload)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status}`);
  }

  const data = await response.json();
  const messageContent = data?.choices?.[0]?.message?.content;

  if (!messageContent) {
    throw new Error('LLM response missing message content');
  }

  const parsed = parseAgentJson(messageContent);
  return {
    adapter: runtimeConfig.llm.provider,
    ...parsed
  };
};

const runSopAgent = async (payload) => {
  await sleep(350);

  if (hasRealLlmConfig()) {
    try {
      return await callOpenAiCompatible(payload);
    } catch (error) {
      console.error('[AgentAdapter] real llm failed, fallback to mock', error);
    }
  }

  return buildMockResult(payload);
};

module.exports = {
  runSopAgent
};
