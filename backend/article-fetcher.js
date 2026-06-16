const FETCH_TIMEOUT_MS = 10000;
const FETCH_RETRY_COUNT = 2;

class ArticleFetchError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'ArticleFetchError';
    this.code = code;
    this.retryable = options.retryable || false;
    this.statusCode = options.statusCode;
    this.cause = options.cause;
  }
}

const decodeHtml = (text = '') =>
  text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const stripTags = (html = '') =>
  decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

const extractMatch = (html, pattern) => {
  const match = html.match(pattern);
  return match?.[1] ? stripTags(match[1]) : '';
};

const extractMeta = (html, name) => {
  const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const match = html.match(regex);
  return match?.[1] ? decodeHtml(match[1]).trim() : '';
};

const extractPublishDate = (html) => {
  const publishTimeMatch = html.match(/publish_time\s*=\s*["']([^"']+)["']/i);
  if (publishTimeMatch?.[1]) {
    return publishTimeMatch[1].trim();
  }

  const ctMatch = html.match(/var\s+ct\s*=\s*"?([0-9]+)"?/i) || html.match(/d\.ct\s*=\s*"?([0-9]+)"?/i);
  if (ctMatch?.[1]) {
    const timestamp = Number(ctMatch[1]) * 1000;
    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp).toISOString().slice(0, 10);
    }
  }

  return '';
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isWeChatVerificationPage = (html = '') =>
  /secitptpage\/verify|wappoc_appmsgcaptcha|访问过于频繁|微信公众平台/i.test(html) &&
  !/id=["']js_content["']/i.test(html);

const normalizeArticleUrl = (articleUrl = '') => {
  const value = articleUrl.trim();

  if (!value) {
    throw new ArticleFetchError('INVALID_ARTICLE_URL', '请先粘贴公众号文章链接');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(value);
  } catch (error) {
    throw new ArticleFetchError('INVALID_ARTICLE_URL', '链接格式不正确，请粘贴完整的公众号文章链接', {
      cause: error
    });
  }

  if (!/mp\.weixin\.qq\.com$/i.test(parsedUrl.hostname)) {
    throw new ArticleFetchError('INVALID_ARTICLE_URL', '当前仅支持公众号文章链接，请粘贴 mp.weixin.qq.com 链接');
  }

  parsedUrl.hash = '';
  return parsedUrl.toString();
};

const fetchWeChatArticleHtml = async (articleUrl) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(articleUrl, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new ArticleFetchError(
        'ARTICLE_FETCH_HTTP_ERROR',
        response.status >= 500 ? '公众号正文抓取失败，微信侧暂时不可用，请稍后重试' : `文章抓取失败：HTTP ${response.status}`,
        {
          retryable: response.status >= 500 || response.status === 429,
          statusCode: response.status
        }
      );
    }

    return await response.text();
  } catch (error) {
    if (error instanceof ArticleFetchError) {
      throw error;
    }

    if (error?.name === 'AbortError') {
      throw new ArticleFetchError('ARTICLE_FETCH_TIMEOUT', '公众号正文抓取超时，请稍后重试', {
        retryable: true,
        cause: error
      });
    }

    throw new ArticleFetchError('ARTICLE_FETCH_NETWORK_ERROR', '公众号正文抓取失败，请检查网络后重试', {
      retryable: true,
      cause: error
    });
  } finally {
    clearTimeout(timer);
  }
};

const fetchWeChatArticle = async (articleUrl) => {
  const normalizedUrl = normalizeArticleUrl(articleUrl);
  let lastError = null;

  for (let attempt = 0; attempt <= FETCH_RETRY_COUNT; attempt += 1) {
    try {
      const html = await fetchWeChatArticleHtml(normalizedUrl);
      if (isWeChatVerificationPage(html)) {
        throw new ArticleFetchError('WECHAT_VERIFICATION_REQUIRED', '公众号链接触发微信访问验证，当前抓取方式暂时无法直接读取正文');
      }

      const contentHtmlMatch = html.match(/<div[^>]+id=["']js_content["'][^>]*>([\s\S]*?)<\/div>/i);
      const content = contentHtmlMatch?.[1] ? stripTags(contentHtmlMatch[1]) : '';

      if (!content) {
        throw new ArticleFetchError('ARTICLE_CONTENT_EMPTY', '未抓取到公众号正文，请检查链接是否可访问');
      }

      const title =
        extractMatch(html, /<h1[^>]+id=["']activity-name["'][^>]*>([\s\S]*?)<\/h1>/i) ||
        extractMeta(html, 'og:title') ||
        extractMatch(html, /<title>([\s\S]*?)<\/title>/i);
      const sourceName =
        extractMatch(html, /<a[^>]+id=["']js_name["'][^>]*>([\s\S]*?)<\/a>/i) ||
        extractMeta(html, 'og:article:author');
      const publishDate = extractPublishDate(html);

      return {
        content,
        resolvedTitle: title,
        resolvedSourceName: sourceName,
        resolvedPublishDate: publishDate,
        originalMaterial: normalizedUrl
      };
    } catch (error) {
      lastError = error;
      if (!(error instanceof ArticleFetchError) || !error.retryable || attempt === FETCH_RETRY_COUNT) {
        throw error;
      }
      await sleep(300 * (attempt + 1));
    }
  }

  throw lastError;
};

const validateArticlePayload = (payload = {}) => {
  const articleUrl = (payload.articleUrl || '').trim();
  const content = (payload.content || '').trim();

  if (!articleUrl || content) {
    return payload;
  }

  return {
    ...payload,
    articleUrl: normalizeArticleUrl(articleUrl)
  };
};

const resolveArticlePayload = async (payload = {}) => {
  const validatedPayload = validateArticlePayload(payload);
  const articleUrl = (validatedPayload.articleUrl || '').trim();
  const content = (validatedPayload.content || '').trim();

  if (!articleUrl || content) {
    return validatedPayload;
  }

  const article = await fetchWeChatArticle(articleUrl);

  return {
    ...validatedPayload,
    ...article,
    sourceName: article.resolvedSourceName || validatedPayload.sourceName || '公众号链接导入'
  };
};

module.exports = {
  ArticleFetchError,
  resolveArticlePayload,
  validateArticlePayload
};
