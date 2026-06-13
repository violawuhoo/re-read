# Re-Read Backend

`Re-Read` 当前内置了一套最小可用后端，使用 Node 原生 `http` 模块实现，不依赖额外安装。

当前版本已经接入：

- 公众号链接抓取
- `P0 -> M1 -> M2 -> M3 -> M4 -> M5` 六模块顺序调用
- 结构化报告装配
- 异步任务轮询
- mock 报告本地验收脚本

## 启动

```bash
node backend/server.js
```

默认端口为 `8787`，也可以通过环境变量覆盖：

```bash
REREAD_PORT=9000 node backend/server.js
```

对外监听示例：

```bash
REREAD_HOST=0.0.0.0 REREAD_PORT=8787 node backend/server.js
```

如果希望从 `backend/.env` 自动读取配置，可以直接复制环境变量模板：

```bash
cp backend/.env.example backend/.env
node backend/server.js
```

如果你准备直接接 `Kimi`，可参考 [kimi.quickstart.md](file:///Users/violawu/Documents/trae_projects/Re-Read/backend/kimi.quickstart.md)。

## 接口

- `GET /health`
- `GET /api/system/config`
- `GET /api/reports`
- `GET /api/reports/:id`
- `GET /api/tasks/:id`
- `POST /api/tasks`
- `POST /api/analyze`

`POST /api/analyze` 请求体示例：

```json
{
  "content": "公众号文章正文或剪贴板内容",
  "articleUrl": "https://mp.weixin.qq.com/xxx",
  "sourceName": "来源账号名"
}
```

`POST /api/tasks` 与 `POST /api/analyze` 请求体一致，但返回异步任务信息，前端可轮询 `GET /api/tasks/:id` 获取任务状态，待 `reportId` 可用后再读取报告详情。

## 说明

- 这是当前版本的后端 MVP，用于承接小程序前端联调。
- 当前已经内置 `SOP Agent` 适配层：
  - 未配置模型时，自动走 mock Agent
  - 配置 `REREAD_LLM_BASE_URL / REREAD_LLM_API_KEY / REREAD_LLM_MODEL` 后，默认走 OpenAI 兼容接口
  - 真实模式按 `P0 -> M1 -> M2 -> M3 -> M4 -> M5` 六个模块串行调用
  - `M4` 会优先尝试联网搜索；如果当前端点不支持 `$web_search`，会自动回退到无工具模式继续执行
- Kimi 平台分国内/国际两套域名：`.cn` key 对应 `https://api.moonshot.cn/v1`，`.ai` key 对应 `https://api.moonshot.ai/v1`
- 豆包平台可使用 `https://ark.cn-beijing.volces.com/api/v3`
- 模块化 Prompt 定义位于 `backend/prompts/phase1-module-prompts.js`
- mock 样例数据位于 `backend/mock-report-sample.js`
- 可通过 `GET /api/system/config` 检查当前后端是否已启用真实模型
- 生产部署参考 [deploy.production.md](file:///Users/violawu/Documents/trae_projects/Re-Read/backend/deploy.production.md)

## 零 Token 报告验收

如果只是验证最终报告格式、`sections` 顺序、`timeline/references/tags` 映射，不想消耗模型 token，可以直接运行：

```bash
npm run mock:report
```

默认会使用：

- 样例输入：[mock-report-sample.js](file:///Users/violawu/Documents/trae_projects/Re-Read/backend/mock-report-sample.js)
- 生成脚本：[generate-mock-report.js](file:///Users/violawu/Documents/trae_projects/Re-Read/scripts/generate-mock-report.js)
- 输出文件：`.runtime-data/mock-report-preview.json`
- 前端固定预览路由：`/pages/report/index?mock=1`

也可以手动指定输出路径：

```bash
node scripts/generate-mock-report.js ./tmp/mock-report.json
```

## 与前端联调

推荐按下面顺序联调：

1. 先运行 `npm run mock:report`
2. 在小程序首页点击 `查看模板报告`
3. 确认 12 个 section、时间线和参考文献渲染正确
4. 再启动后端真实链路，测试公众号链接解读

如果只是验证完整报告页的展示，不需要先启动模型。
