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

const fetchWeChatArticle = async (articleUrl) => {
  const response = await fetch(articleUrl, {
    method: 'GET',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    }
  });

  if (!response.ok) {
    throw new Error(`文章抓取失败：HTTP ${response.status}`);
  }

  const html = await response.text();
  const contentHtmlMatch = html.match(/<div[^>]+id=["']js_content["'][^>]*>([\s\S]*?)<\/div>/i);
  const content = contentHtmlMatch?.[1] ? stripTags(contentHtmlMatch[1]) : '';

  if (!content) {
    throw new Error('未抓取到公众号正文，请检查链接是否可访问');
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
    originalMaterial: articleUrl
  };
};

const resolveArticlePayload = async (payload = {}) => {
  const articleUrl = (payload.articleUrl || '').trim();
  const content = (payload.content || '').trim();

  if (!articleUrl || content) {
    return payload;
  }

  if (!/mp\.weixin\.qq\.com/i.test(articleUrl)) {
    throw new Error('当前仅支持公众号文章链接，请粘贴 mp.weixin.qq.com 链接');
  }

  const article = await fetchWeChatArticle(articleUrl);

  return {
    ...payload,
    ...article,
    sourceName: article.resolvedSourceName || payload.sourceName || '公众号链接导入'
  };
};

module.exports = {
  resolveArticlePayload
};
