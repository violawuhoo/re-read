# Re-Read

`Re-Read` 是一个面向一级市场 AI4S 投资人的微信小程序，用于在“读完公众号之后、读原文之前”快速生成一份标准化结构解读。

当前版本已经包含：

- 微信小程序前端
- Node 原生 `http` 后端
- `P0 -> M1 -> M2 -> M3 -> M4 -> M5` 六模块顺序分析链路
- 固定 12 个 section 的完整报告页
- 零 token 的模板报告验收入口

## 当前能力

- 支持导入 `mp.weixin.qq.com` 公众号文章链接
- 后端按六个模块顺序生成结构化 JSON
- 报告输出固定遵循 [report-output-format.md](file:///Users/violawu/Documents/trae_projects/Re-Read/docs/report-output-format.md)
- 前端完整报告页按固定章节顺序展示：
  - `quality`
  - `hype`
  - `team`
  - `claim`
  - `innovation`
  - `bottleneck`
  - `industrial`
  - `timeline`
  - `overseas`
  - `domestic`
  - `opportunity`
  - `signals`

## 项目结构

- 前端：`src/`
- 后端：`backend/`
- 报告格式规范：`docs/report-output-format.md`
- mock 报告生成脚本：`scripts/generate-mock-report.js`
- 前端模板报告数据：`src/data/mock-report.ts`

## 本地安装

在项目根目录执行：

```bash
npm install --legacy-peer-deps
```

如果你本机的 Taro 缓存目录权限有问题，后续运行命令时可统一加：

```bash
HOME=/Users/violawu/Documents/trae_projects/Re-Read
```

## 启动前端小程序

开发模式：

```bash
cd /Users/violawu/Documents/trae_projects/Re-Read
HOME=/Users/violawu/Documents/trae_projects/Re-Read npm run dev:weapp
```

生产构建：

```bash
cd /Users/violawu/Documents/trae_projects/Re-Read
HOME=/Users/violawu/Documents/trae_projects/Re-Read npm run build:weapp
```

然后用微信开发者工具导入项目：

- 优先导入项目根目录：`/Users/violawu/Documents/trae_projects/Re-Read`
- 如果工具需要编译产物目录，也可导入：`/Users/violawu/Documents/trae_projects/Re-Read/dist`

## 启动后端

```bash
cd /Users/violawu/Documents/trae_projects/Re-Read
node backend/server.js
```

默认后端地址：

- `http://127.0.0.1:8787/health`

后端详细说明见 [backend/README.md](file:///Users/violawu/Documents/trae_projects/Re-Read/backend/README.md)。

## 真实模型配置

复制环境变量模板：

```bash
cp backend/.env.example backend/.env
```

当前支持：

- `Kimi / Moonshot`
- `豆包 / Ark`

Kimi 快速接入见 [kimi.quickstart.md](file:///Users/violawu/Documents/trae_projects/Re-Read/backend/kimi.quickstart.md)。

## 模板报告验收

如果只是验收报告格式，不想消耗 token，可以用项目内置 mock 报告。

先在本地生成一份模板报告：

```bash
npm run mock:report
```

生成结果默认写入：

- `.runtime-data/mock-report-preview.json`

前端还内置了一个固定查看入口：

- 页面路由：`/pages/report/index?mock=1`
- 首页按钮：`查看模板报告`

这个入口不会请求后端，也不会消耗模型 token，适合做：

- 报告模板验收
- 前端样式联调
- `timeline / references / tags / subtitle` 映射检查

## 当前推荐联调方式

1. 先跑 `npm run mock:report`
2. 用小程序打开 `查看模板报告`
3. 核对完整报告页展示
4. 再启动后端和真实模型，测试公众号链接分析

## 重要文档

- 总体后端说明：[backend/README.md](file:///Users/violawu/Documents/trae_projects/Re-Read/backend/README.md)
- Kimi 接入说明：[kimi.quickstart.md](file:///Users/violawu/Documents/trae_projects/Re-Read/backend/kimi.quickstart.md)
- 报告格式规范：[report-output-format.md](file:///Users/violawu/Documents/trae_projects/Re-Read/docs/report-output-format.md)
- 生产部署说明：[deploy.production.md](file:///Users/violawu/Documents/trae_projects/Re-Read/backend/deploy.production.md)
