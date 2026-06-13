# Re-Read 报告输出格式规范

版本：v1.0

来源：`/Users/violawu/Desktop/re-read-report-template.docx`

用途：固定第一阶段最终报告的字段结构、章节顺序、映射规则与验收标准，供后端 `report-engine.js`、前端完整报告页和联调用例共同遵循。

## 本地验收入口

当前项目已经提供两种模板验收方式：

- 后端生成 mock 报告：`npm run mock:report`
- 前端固定预览路由：`/pages/report/index?mock=1`

其中：

- `npm run mock:report` 会生成 `.runtime-data/mock-report-preview.json`
- `mock=1` 页面直接读取 `src/data/mock-report.ts`
- 两者都应遵循本文档定义的同一份 `ReportRecord` 结构

## 总体约束

- 最终产物是一个 `ReportRecord`
- `P0` 不单独作为报告正文 section 输出，但会影响 `articleType`、`pipeline`、`articleSnapshot.originalMaterial`
- `sections` 必须固定为 12 个章节，且顺序固定
- `references` 必须优先使用 `M4.overseas_works[].ref_url`
- `tags` 默认取 `M2.innovation.search_keywords` 的前 3 个
- `subtitle` 默认取 `M2.innovation.description`

## 顶层字段

- `title`：公众号标题
- `subtitle`：`M2.innovation.description`
- `account`：公众号名称
- `articleType`：`P0.type`
- `status`：六模块分析状态文案
- `tags`：`M2.innovation.search_keywords.slice(0, 3)`
- `meta.credibility`：`M1.credibility`
- `meta.hypeLevel`：`M1.exaggeration_level`
- `meta.toVcRisk`：`M2.to_vc_risk.level`，`不适用` 时省略
- `meta.innovationType`：`M2.innovation.type`
- `meta.trl`：`TRL {M3.trl.score}/9`
- `meta.industrialWindow`：`M3.trl.time_window.tool_layer`
- `meta.fieldStage`：`M5.field_stage.phase`
- `meta.breakthroughDegree`：`M3.breakthrough.degree`

## ArticleSnapshot

- `sourceName`：公众号名称
- `sourceAuthor`：优先取 `M2.team.lead_author`
- `publishDate`：公众号发布日期
- `articleUrl`：原始链接
- `originalMaterial`：合并 `M2.team.related_company` 与 `P0.source_hint`

## Pipeline

固定 6 步：

1. `type`：内容价值预判，描述取 `P0.reason`
2. `source`：溯源一手材料，描述取 `P0.source_hint`
3. `quality`：公众号质量评估，描述取 `M1.summary`
4. `claim`：核心创新提取，描述取 `M2.innovation.description`
5. `landscape`：时间线与横向对比，描述取 `M4.timeline.this_work_position`
6. `investment`：投资信号推导，描述取 `M5.field_stage.phase + main_driver`

## Sections 顺序

固定顺序如下：

1. `quality`
2. `hype`
3. `team`
4. `claim`
5. `innovation`
6. `bottleneck`
7. `industrial`
8. `timeline`
9. `overseas`
10. `domestic`
11. `opportunity`
12. `signals`

## 关键映射规则

### `quality`

- `summary`：`M1.summary`
- `highlight`：`可信度：{M1.credibility}`
- `tone`：`credibility=低` 为 `warning`，否则 `info`
- `bullets`：
  - `作者背景：{M1.author_background}`
  - `是否有利益相关：是/否`
  - `建议直接参考公众号：是/否`

### `hype`

- `summary`：按 `M1.exaggeration_level` 生成
- `highlight`：`夸大程度：X；建议参考原文：是/否`
- `tone`：`高/中 => warning`，`低 => default`
- `bullets`：`[{type}·{severity}] 公众号：{claim} → 实际：{reality}`

### `team`

- `summary`：`M2.commercial_intent`
- `highlight`：`To VC 风险：{level}`，`不适用` 时省略
- `tone`：`高/中 => warning`，否则 `default`
- `bullets`：
  - `通讯作者：...`
  - `关联公司：...`
  - `融资信息：...`
  - `中国关联：...`
  - `To VC 风险计数：叙事x·时间x·技术x，{note}`

### `claim`

- `summary`：`M2.core_claim`
- `highlight`：`创新点类型：{M2.innovation.type}`
- `bullets`：`局限：{item}`

### `innovation`

- `summary`：`M2.innovation.description`
- `highlight`：`创新点类型：{M2.innovation.type}`
- `tone`：`success`
- `bullets`：`检索词：{keyword}`

### `bottleneck`

- `summary`：`M3.bottleneck.description`
- `highlight`：`突破程度：{M3.breakthrough.degree}`
- `bullets`：
  - `之前未解决原因：...`
  - `突破说明：...`
  - `下一个瓶颈：...`

### `industrial`

- `summary`：`TRL N/9，参照：{reference_case}`
- `highlight`：`TRL N/9`
- `tone`：`info`
- `bullets`：
  - `数据壁垒：...`
  - `算力成本：...`
  - `工程化 gap：...`
  - `监管路径：...`
  - `工具层商业化：...`
  - `应用层商业化：...`

### `timeline`

- `summary`：`本文位置：{this_work_position}`
- `bullets`：
  - `奠基性工作：...`
  - `当前前沿：...`
  - `下一难题：...`

同时同步顶层 `timeline` 数组四项：

1. `奠基`
2. `当前前沿`
3. `下一难题`
4. `本文位置`

### `overseas`

- `summary`：`找到 {n} 篇代表性工作，按时间线位置排列`
- `bullets`：`{name}（{institution}，{date}）· 时间线：... · 解决：... · 未解决：... · {ref_url}`

同时同步顶层 `references`：

- 若有公众号原文，插入 `Ref 0`
- 其余 `Ref 1...n` 来自 `M4.overseas_works`

### `domestic`

- `summary`：`找到 {n} 个相关团队（含 {k} 个商业产品）`
- `bullets`：`{name}（{attribute}·{match_degree}）· {work} · 差距：{gap} · 转化：{commercialization}`

### `opportunity`

- `summary`：`领域处于{phase}，发现 {n} 个机会方向（含 {k} 个国内窗口）· 主要驱动力：{main_driver}`
- `highlight`：`领域阶段：{phase}`
- `tone`：`success`
- `bullets`：`[{scope}·{gap_type}] {direction}（依据：{basis}）`
- 约束：不得出现具体公司名

### `signals`

- `summary`：`以下 {n} 个信号出现时，意味着可以进入下一步判断 · 最大不确定性：{key_uncertainty}`
- `tone`：`warning`
- `bullets`：`[{time_window}] {trigger} → {meaning}`

## 验收清单

- `sections.length === 12`
- key 顺序为 `quality/hype/team/claim/innovation/bottleneck/industrial/timeline/overseas/domestic/opportunity/signals`
- 每个 `section.summary` 非空
- 每个 `section.bullets.length >= 1`
- `tone` 只允许 `default/info/warning/success`
- `timeline.length === 4`
- `meta.trl` 符合 `TRL N/9`
- `references` 使用真实链接
