# Re-Read

面向一级市场 AI4S 投资人的公众号深度解读工具：读完公众号、读原文之前，先得到一版结构化判断。

当前版本按**个人自用**形态交付：只上体验版，不发布，因此不涉及备案、类目与提审。

## 架构

```
微信小程序（Taro 4 + React 18）
  └─ wx.cloud.callContainer（免域名校验，不用备案）
       └─ 微信云托管容器（backend/，Node 原生 http）
            ├─ 云开发数据库：reports / tasks / usage
            └─ Kimi / 豆包：六模块顺序分析
```

- 前端：`src/`（解读 / 历史 / 我的 / 报告四个页面）
- 后端：`backend/`（Dockerfile 已带，可直接部署到云托管）
- 部署：**[docs/personal-deploy.md](docs/personal-deploy.md)**
- 报告格式：`docs/report-output-format.md`

## 分析链路

`P0 分类 → M1 信源质量 → M2 团队/主张/创新 → M3 瓶颈/TRL → M4 时间线与国际对标 → M5 机会与信号`

- 单模块独立超时、重试、JSON 修复，失败按保守路径降级，不阻断整份报告
- M4 会带联网检索
- 报告固定 12 章节，前后端共用同一套结构

## 本地运行

```bash
npm install --legacy-peer-deps

# 后端
cd backend && cp .env.example .env   # 填模型 key
npm install && node server.js        # 默认 http://127.0.0.1:8787

# 前端（走本地接口，手机与电脑同一 WiFi）
TARO_APP_API_BASE=http://192.168.1.8:8787 npm run build:weapp
```

不设 `TARO_APP_API_BASE` 时默认走云托管：

```bash
TARO_APP_CLOUD_ENV=reread-3gxxxxxx TARO_APP_CLOUD_SERVICE=reread-api npm run build:weapp
```

## 环境变量

见 [backend/.env.example](backend/.env.example)。几个关键项：

| 变量 | 作用 |
| --- | --- |
| `REREAD_STORE` | `cloud` 用云数据库，`file` 用本地 JSON（仅调试） |
| `TCB_ENV` | 云开发环境 id |
| `REREAD_ALLOWED_OPENIDS` | 只允许这些 openid 调用，自用务必填 |
| `REREAD_REQUIRE_OPENID` | 填 `1` 则必须带微信身份 |
| `REREAD_DAILY_LIMIT` | 每日额度，失败会退回 |

## 两个必须知道的约定

1. **没接通模型时会明确标成「样例」**。报告 `isSample=true`，页面顶部提示"与这篇文章无关"，不再用样例冒充真实解读。
2. **首页不做剪贴板读取**。已移除 `getClipboardData`，改为输入框长按粘贴，避免隐私接口声明。

## 测试

```bash
npm run test:baseline   # report-engine 结构与降级文案
```

## 免 token 验收报告版式

```bash
npm run mock:report     # 生成 .runtime-data/mock-report-preview.json
```

小程序内打开「历史 → 查看模板报告」，或直接访问 `/pages/report/index?mock=1`，不调后端、不消耗额度。
