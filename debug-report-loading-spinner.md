# Debug Session: report-loading-spinner

- Status: OPEN
- Created At: 2026-06-15
- Symptom: 粘贴真实公众号链接 `https://mp.weixin.qq.com/s/xWuw6SQ40gxNJAbE1Yfcpg` 后，前端“生成报告”一直处于 loading，未跳转到报告页，也未明确报错。
- Scope: 小程序首页提交、异步任务创建与轮询、后端任务执行链路

## Hypotheses

1. 前端成功创建了任务，但轮询逻辑没有正确处理失败态或异常态，导致 loading 无法结束。
2. 后端任务在某个模块阶段长期卡住，任务状态一直停留在 `running`，前端因此持续等待。
3. 前端实际上收到了错误响应，但错误映射或 `finally` 收尾缺失，导致按钮 loading 状态未复位。
4. 对该微信链接的抓取进入了特殊分支（如验证码/正文为空/网络重试），但服务端没有把终态稳定写入任务记录。
5. 页面跳转条件依赖 `reportId`，而后端可能已结束任务但缺少 `reportId`，导致前端既不跳转也不报错。

## Evidence Log

- Pre-fix reproduction task: `task_1781532984057_oh77cc`
- 抓取链路正常结束，正文长度 `2701`，公众号 `DeepTech深科技`，标题已成功解析。
- 真实卡点不在抓取，而在 LLM 模块流水线：
  - `P0` 首轮 `700 tokens` 被截断，第二轮才成功。
  - `M1` 首轮 `1400 tokens` 被截断，第二轮才成功。
  - `M2` 首轮出现 `模块请求超时`，进入重试。
- 任务在 3 分钟后仍停留在 `45% / 团队背景与创新点`，说明用户看到的“一直转”是长耗时而非前端死锁。

## Analysis

1. 假设 1（前端未处理失败态）当前未命中。后端任务始终处于 `running`，前端继续等待符合现有逻辑。
2. 假设 2（后端任务长期卡住）已命中。卡点来自模块重试与超时，不是任务状态遗漏。
3. 假设 3（错误被吃掉但 loading 未复位）当前未命中。本次复现中没有进入错误分支。
4. 假设 4（微信抓取分支未写回终态）已排除。正文抓取成功且很快完成。
5. 假设 5（任务结束但缺少 reportId）当前未观察到，问题在任务尚未结束之前。

## Fix

- 首页增加真实链路生成进度文案，轮询期间显示 `stage + progress`，避免用户只看到无意义 spinner。
- 将 `P0` 初始 `maxTokens` 从 `700` 提升到 `1200`，减少首轮 JSON 截断。
- 将 `M1` 初始 `maxTokens` 从 `1400` 提升到 `2200`，减少首轮 JSON 截断概率。
- Post-fix reproduction task: `task_1781533288718_y3g6x4`
  - `P0` 已在首轮直接成功，不再进入截断重试。
  - `M1` 仍可能慢到触发超时，说明剩余瓶颈从“必然截断”收敛成“模型响应时延过长”。
- Post-fix progress verification task: `task_1781533546478_rgrg1p`
  - 提交 3 秒后任务状态已变为 `30% / 内容类型识别`。
  - 用户先前反馈的 `25% / 公众号质量评估` 停滞已被修正为更准确的阶段展示。
- Parallel speed verification task: `task_1781533968162_cm87bv`
  - `P0` 与 `M1` 已确认并行启动。
  - 35 秒时任务推进到 `47%`，随后进入 `55% / 团队背景与创新点`，前半段串行等待被缩短。
- Latest regression task: `task_1781534228388_5sr5d2`
  - `M1` 首轮成功，但 `P0` 首轮截断重试，导致页面仍可能停在 `40%`。
  - 进一步修复为：`P0/M1` 任一先完成即可把进度推进到 `47%`，并将 `P0` 初始 `maxTokens` 继续提升到 `1800`。
- M2 optimization
  - `M2` 初始 `maxTokens` 从 `1800` 提升到 `2600`。
  - `buildM2UserMsg()` 改为只传递 `P0/M1` 必要上下文，不再把完整前序 JSON 全量塞入提示词。
- M4 optimization
  - `buildM4UserMsg()` 改为只传递 `P0/M2/M3` 的必要摘要，不再塞入完整前序结构。
  - `M3` 与 `M4` 已改为并行启动，避免后半段纯串行等待。
  - `M4` 启动后进度会先推进到 `80%`，任一并行分支返回后再推进到 `84%`。

## Verification

- `node --check backend/task-queue.js`
- `node --check backend/agent-adapter.js`
- `HOME=/Users/violawu/Documents/trae_projects/Re-Read npm run build:h5`
