const test = require('node:test');
const assert = require('node:assert/strict');
const { buildReportFromPayload } = require('../backend/report-engine');

const flattenSectionText = (report) =>
  report.sections
    .flatMap((section) => [section.title, section.summary, section.highlight || '', ...(section.bullets || [])])
    .filter(Boolean)
    .join('\n');

test('structured report keeps formal fallback language under module degradation', () => {
  const report = buildReportFromPayload(
    {
      content: '这是一篇公众号文章，讨论多模态分子基础模型的阶段性进展。',
      articleUrl: 'https://mp.weixin.qq.com/s/xWuw6SQ40gxNJAbE1Yfcpg',
      sourceName: '真实链接回归样本',
      resolvedTitle: '真实链路回归样本',
      resolvedSourceName: '回归样本库'
    },
    {
      adapter: 'structured-sop-agent',
      articleType: 'A+C混合',
      reportStatus: '已完成 SOP 六模块分析 · A+C混合 · 部分模块降级(4)',
      modules: {
        M1: { error: 'M1 模块降级：输出字段缺失，已按默认值补齐' },
        M2: { error: 'M2 模块降级：模块请求超时' },
        M4: { error: 'M4 模块降级：模块请求超时' },
        M5: { error: 'M5 模块降级：输出字段缺失，已按默认值补齐' }
      },
      p0: {
        type: 'A+C混合',
        source_hint: '论文摘要 + 公司技术博客'
      },
      m1: {
        credibility: '中',
        exaggeration_level: '中',
        recommend_original: true,
        interest_conflict: false
      },
      m2: {},
      m3: {},
      m4: {},
      m5: {}
    }
  );

  const combinedText = flattenSectionText(report);

  assert.equal(report.articleType, 'A+C混合');
  assert.match(report.meta.innovationType, /继续判断/);
  assert.match(report.meta.industrialWindow, /继续判断/);
  assert.equal(report.meta.fieldStage, '概念期');
  assert.equal(report.coreClaim, '当前公开材料更适合作为方向性线索，关键主张仍需结合原文和补充材料继续核验。');
  assert.ok(report.references.some((reference) => reference.link === 'https://mp.weixin.qq.com/s/xWuw6SQ40gxNJAbE1Yfcpg'));
  assert.match(combinedText, /已完成正式装配/);
  assert.match(combinedText, /继续核验|继续判断|继续补证/);
  assert.doesNotMatch(combinedText, /待补充/);
  assert.doesNotMatch(combinedText, /缺失项提示/);
  assert.doesNotMatch(combinedText, /\bM[1-5]\b/);
});

test('non-structured agent output uses formal section titles for missing items and followups', () => {
  const report = buildReportFromPayload(
    {
      content: '这是一篇偏发布会和 PR 的公众号文章。'
    },
    {
      signals: ['作者引用了官网说法，但没有给出独立实验数据。'],
      missingItems: ['M4 模块降级：输出字段缺失，已按默认值补齐'],
      followups: ['继续跟踪官网开发者文档、第三方评测和客户案例。']
    }
  );

  const missingSection = report.sections.find((section) => section.key === 'agentMissingItems');
  const followupSection = report.sections.find((section) => section.key === 'agentFollowups');

  assert.ok(missingSection);
  assert.ok(followupSection);
  assert.equal(missingSection.title, '当前仍需补证的部分');
  assert.equal(followupSection.title, '后续跟踪建议');
  assert.match(missingSection.summary, /后续核查清单/);
  assert.match(missingSection.bullets.join('\n'), /正式报告结构补齐|继续补充一手材料|继续核验/);
  assert.doesNotMatch(missingSection.bullets.join('\n'), /\bM[1-5]\b/);
});
