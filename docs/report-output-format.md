# Re-Read 报告输出格式规范

版本：v1.1

来源：`/Users/violawu/Desktop/re-read-report-template.docx`

用途：固定第一阶段最终报告的字段结构、章节顺序、映射规则与验收标准，供后端 `report-engine.js`、前端完整报告页和联调用例共同遵循。当前 `backend/report-engine.js` 已与 `src/data/mock-report.ts` 对齐，真实输出与 mock 模版遵循同一套结构。

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
- 底层 `sections` 仍可保留细分章节，但前端模板展示应合并为 4 个大 section
- `references` 必须优先使用原公众号链接与 `M4` 中的真实工作链接；海外与国内工作只要进入最终正文，均应在文末提供对应链接
- `tags` 默认取 `M2.innovation.search_keywords` 的前 3 个
- `subtitle` 默认取 `M2.innovation.description`
- 顶部区域要更像投资简报：标题、副标题、标签和核心指标优先给出结论与阶段判断
- 正文 section 要更像研究分析：强调 claim、证据、瓶颈、对照和局限，避免只做投资腔摘要
- 保留完整信息，不通过合并章节来换取“更短”；优先通过改写摘要和 bullet 文风来提升可读性
- 不展示文章分类结果，不展示 `To VC` 相关字段
- 不把 `TRL` 作为顶部核心指标；如需保留，只能放在产业化可行性正文中并可省略
- 生成逻辑、筛选标准、检索用途等内部说明不直接展示在正文中

## 顶层字段

- `title`：公众号标题
- `subtitle`：`M2.innovation.description`
- `account`：公众号名称
- `articleType`：`P0.type`
- `status`：六模块分析状态文案
- `tags`：`M2.innovation.search_keywords.slice(0, 3)`
- `meta.credibility`：`M1.credibility`
- `meta.hypeLevel`：`M1.exaggeration_level`
- `meta.innovationType`：`M2.innovation.type`
- `meta.industrialWindow`：`M3.trl.time_window.tool_layer`
- `meta.fieldStage`：`M5.field_stage.phase`
- `meta.breakthroughDegree`：`M3.breakthrough.degree`

顶部文风要求：

- 标题区优先采用“原公众号标题 + 一句判断”的结构
- `title` 优先保留公众号原文标题，避免把解读标题写成新的媒体标题
- `subtitle` 优先写成一句判断，而不是重复标题
- 标题区语气保持克制，避免副标题比主标题更强
- `status` 可以提示当前模板风格，例如“投资简报顶部 + 研究分析正文”
- `tags` 仍保留技术检索词，不改成泛化投资标签

## ArticleSnapshot

- `sourceName`：公众号名称
- `sourceAuthor`：优先取 `M2.team.lead_author`
- `publishDate`：公众号发布日期
- `articleUrl`：原始链接
- `originalMaterial`：合并 `M2.team.related_company` 与 `P0.source_hint`

## 核心预览

将原 `pipeline` 展示文案改为 `核心预览`，固定 5 个条目：

1. `quality`：对于这篇公众号的解读质量结论（是否夸大）
2. `source`：溯源一手材料，证明来源
3. `claim`：原文 / 产品的核心价值提取
4. `landscape`：这个工作 / 产品的同时间横向对比
5. `investment`：投资信号推导

展示要求：

- `核心预览` 只承担摘要作用，字号和视觉权重低于正文分组
- 每条描述优先写成结论先行的一句话，避免解释性长文案
- 单条描述建议控制在 2 行以内

## 展示分组

前端展示按以下 4 个大 section 合并：

1. `公众号文章评价`
   - `quality`
   - `hype`
2. `原文 / 产品原出处分析`
   - `team`
   - `claim`
   - `innovation`
3. `领域分析`
   - `bottleneck`
   - `industrial`
   - `timeline`
   - `overseas`
   - `domestic`
4. `投资引导`
   - `opportunity`
   - `signals`

其中：

- 底层数据仍可保留细分 `section.key`
- 目的是在不损失信息的情况下，减少页面上“12 张同级卡片”的割裂感
- heading 标准固定为“分组标题 + 子标题 + 摘要 + 正文”
- 推荐分组标题：
  - `公众号文章评价`
  - `原文与产品分析`
  - `领域分析`
  - `投资引导`
- 推荐子标题：
  - `质量评估`
  - `夸大检测`
  - `团队与用途`
  - `核心 Claim`
  - `创新点识别`
  - `领域瓶颈`
  - `产业化可行性`
  - `时间线位置`
  - `海外相关工作`
  - `国内相关工作`
  - `投资机会`
  - `验证信号`

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
- 展示形式优先使用对照表
- 表头固定：
  - `问题`
  - `公众号表述`
  - `实际情况`
- 每行对应一条 `issue`
- `issue.type` 展示时去掉 `A/B/C` 前缀，只保留实际问题名称

### `team`

- `summary`：`M2.commercial_intent`
- `tone`：`default`
- `bullets`：
  - `通讯作者：...`
  - `关联公司：...`
  - `融资信息：...`
  - `中国关联：...`
  - `商业意图：...`

### `claim`

- `summary`：`M2.core_claim`
- `highlight`：`创新点类型：{M2.innovation.type}`
- `bullets`：`局限：{item}`
- 这里回答的是“作者说自己做成了什么”
- 展示格式固定为两块：
  - `主张`：编号 `1. 2. 3.`
  - `局限`：编号 `1. 2. 3.`

### `innovation`

- `summary`：`M2.innovation.description`
- `highlight`：`创新点类型：{M2.innovation.type}`
- `tone`：`success`
- 展示标题固定为 `创新点识别`
- 这里回答的是“真正的新意在哪里”
- `bullets` 可展示为：
  - `创新类型：...`
  - `一句话理解：...`
  - `相关关键词：keyword1 / keyword2 / keyword3`
- `相关关键词` 只作为附属信息弱化展示，不与主摘要并列竞争

### `bottleneck`

- `summary`：`M3.bottleneck.description`
- `highlight`：`突破程度：{M3.breakthrough.degree}`
- `bullets`：
  - `之前未解决原因：...`
  - `突破说明：...`
  - `下一个瓶颈：...`
- 建议压缩为 3 条核心信息，避免与 `产业化可行性` 重复

### `industrial`

- `summary`：当前产业化阶段判断
- `highlight`：可用作阶段提示，但不展示 `TRL`
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
- 页面展示优先使用时间线卡片，不再把同一组信息重复写成 bullets
- `summary` 只负责说明“这一块回答什么问题”，不重复时间线卡片内容

同时同步顶层 `timeline` 数组四项：

1. `奠基`
2. `当前前沿`
3. `下一难题`
4. `本文位置`

### `overseas`

- 生成筛选标准固定：
  - 尽可能与该方向高度契合
  - 优先选择领域内核心代表工作
  - 尽可能采用最近 12-18 个月的结果
- 检索范围包括公司、研究所、高校等
- 报告正文不展示筛选标准，只展示筛选结果
- 展示形式：
  - 加粗标题：`{name}（{institution}，{date}） [Ref N]`
  - 简短介绍：`工作简介：...`
  - 分行展示：
    - `时间线位置：...`
    - `解决了什么：...`
    - `还没解决什么：...`

同时同步顶层 `references`：

- 若有公众号原文，插入 `Ref 0`
- 其余 `Ref 1...n` 来自进入正文的 `M4.overseas_works` 与 `M4.china_teams`
- 正文统一只展示 `[Ref N]`，具体链接放到文末 `references`

### `domestic`

- 生成筛选标准与海外保持一致：
  - 方向高度契合
  - 优先核心代表
  - 尽可能采用最新信息
- 检索范围包括公司、研究所、高校等
- 若仅为“表面相关”且无真实参考意义，不进入最终对比列表
- 报告正文不展示筛选标准，只展示筛选结果
- 展示形式：
  - 加粗标题：`{name}（{attribute}，{match_degree}） [Ref N]`
  - 分行展示：
    - `时间线位置：...`
    - `具体工作：...`
    - `与国际前沿差距：...`
    - `转化迹象：...`

### `opportunity`

- `summary`：`领域处于{phase}，发现 {n} 个机会方向（含 {k} 个国内窗口）· 主要驱动力：{main_driver}`
- `highlight`：`领域阶段：{phase}`
- `tone`：`success`
- `bullets`：`[{scope}·{gap_type}] {direction}（依据：{basis}）`
- 约束：不得出现具体公司名

## 当前实现补充

- 真实报告生成使用：`backend/report-engine.js`
- mock 预览数据使用：`src/data/mock-report.ts`
- 后端零 token 验收样例使用：`backend/mock-report-sample.js`
- 上述三者当前已按同一套展示规则对齐：
  - `核心预览` 固定为 5 条
  - `timeline` section 只保留 summary，不重复 bullets
  - `overseas` work card 增加 `工作简介`
  - `domestic` 默认过滤仅“表面相关”的条目
  - `references` 同时覆盖公众号原文、海外工作、国内工作

### `signals`

- `summary`：`以下 {n} 个信号出现时，意味着可以进入下一步判断 · 最大不确定性：{key_uncertainty}`
- `tone`：`warning`
- `bullets`：`[{time_window}] {trigger} → {meaning}`

## 验收清单

- `sections.length === 12`
- key 顺序仍建议保持 `quality/hype/team/claim/innovation/bottleneck/industrial/timeline/overseas/domestic/opportunity/signals`
- 每个 `section.summary` 非空
- 除 `hype / timeline / overseas / domestic` 外，其余 section 建议至少保留 1 条 bullet
- `tone` 只允许 `default/info/warning/success`
- `timeline.length === 4`
- `references` 使用真实链接
- 顶部标题区读完后，用户应能立即回答“这篇文章对投资判断意味着什么”
- 正文读完后，用户应能复述“核心 claim 是什么、为何重要、限制在哪里、下一瓶颈是什么”
