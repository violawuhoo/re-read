# Re-Read Backend

`Re-Read` 当前内置了一套最小可用后端，使用 Node 原生 `http` 模块实现，不依赖额外安装。

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
- 生成的报告会持久化到 `backend/data/generated-reports.json`
- 当前已经内置 `SOP Agent` 适配层：
  - 未配置模型时，自动走 mock Agent
  - 配置 `REREAD_LLM_BASE_URL / REREAD_LLM_API_KEY / REREAD_LLM_MODEL` 后，可走 OpenAI 兼容接口
  - 默认 `.env.example` 已按 `Kimi / Moonshot` 方案提供示例
- 核心提示词位于 `backend/prompts/sop-system-prompt.md`
- 可通过 `GET /api/system/config` 检查当前后端是否已启用真实模型
- 下一步可以把当前适配层继续替换成真实公众号解析、溯源与数据库存储逻辑。
- 生产部署参考 [deploy.production.md](file:///Users/violawu/Documents/trae_projects/Re-Read/backend/deploy.production.md)
