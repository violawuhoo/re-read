const fs = require('fs');
const path = require('path');

const { buildReportFromPayload } = require('../backend/report-engine');
const { mockArticlePayload, mockAgentResult } = require('../backend/mock-report-sample');

const outputArg = process.argv[2];
const outputPath = outputArg
  ? path.resolve(process.cwd(), outputArg)
  : path.resolve(process.cwd(), '.runtime-data/mock-report-preview.json');

const ensureDir = (filePath) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
};

const main = () => {
  const report = buildReportFromPayload(mockArticlePayload, mockAgentResult);
  ensureDir(outputPath);
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const summary = {
    outputPath,
    title: report.title,
    subtitle: report.subtitle,
    articleType: report.articleType,
    sectionCount: report.sections.length,
    sectionKeys: report.sections.map((item) => item.key),
    pipelineKeys: report.pipeline.map((item) => item.key),
    tags: report.tags,
    referenceCount: report.references.length,
    timelineCount: report.timeline.length
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
};

main();
