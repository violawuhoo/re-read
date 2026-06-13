# Kimi 接入说明

`Re-Read` 当前后端已经兼容 `Kimi / Moonshot` 的 OpenAI-compatible API。

## 推荐配置

复制环境变量模板：

```bash
cp backend/.env.example backend/.env
```

然后编辑 `backend/.env`，至少填入以下字段：

```bash
REREAD_LLM_BASE_URL=https://api.moonshot.cn/v1
REREAD_LLM_API_KEY=你的 Kimi API Key
REREAD_LLM_MODEL=kimi-k2.6
REREAD_LLM_TEMPERATURE=0.2
```

## 模型建议

- `kimi-k2.6`
  - 当前项目默认推荐模型
  - 适合 `P0-M5` 六模块结构化输出
- 如果你账户下有其他兼容模型，也可以直接替换 `REREAD_LLM_MODEL`

## 启动方式

```bash
node backend/server.js
```

## 验证方式

启动后可检查：

- `GET /health`
- `GET /api/system/config`

在小程序“我的”页中点击：

- `检测后端状态`
- `检测模型配置`

如果配置成功，页面会显示：

- 当前模型已启用
- 模型名称
- 模型网关地址

## 当前注意事项

- 如果模型接口调用失败，后端会自动回退到 `mock SOP Agent`
- `M4` 会优先尝试使用 Kimi 的 `$web_search`；如果当前网关不支持，会自动回退到无工具模式
- `Re-Read` 现在最重要的是先验证真实文章效果，不必一开始做多模型路由
- 推荐先用 `Kimi` 跑 20-30 篇公众号文章，重点观察：
  - 结构化输出是否稳定
  - `缺失说明` 是否克制
  - `To VC 风险` 是否过软
  - 投资机会是否过度脑补

## 配套的本地验收方式

如果你只是想验证报告格式，不想消耗 token，可以直接运行：

```bash
npm run mock:report
```

然后在前端打开：

```text
/pages/report/index?mock=1
```

这个入口会直接展示内置模板报告，不会请求 Kimi。
