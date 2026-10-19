# 个人自用部署指南

目标是：**只有你自己用，停在体验版，不发布**。这样不需要 ICP 备案、不需要 HTTPS 证书、不需要类目资质、不需要走提审。

整条链路如下：

```
微信小程序（体验版）
  └─ wx.cloud.callContainer   ← 不校验域名，不用备案
       └─ 云托管容器（backend/，Node 原生 http）
            ├─ 云开发数据库（reports / tasks / usage）
            └─ Kimi 或豆包（六模块分析）
```

---

## 一、前置：注册个人小程序

1. 打开 <https://mp.weixin.qq.com>，注册「小程序」，主体类型选**个人**，身份证 + 人脸验证，免费。
2. 记下 AppID，填进 `project.config.json` 的 `appid` 字段（现在是 `touristappid`，不改无法上传）。
3. 开通「云开发」环境，记下**环境 ID**（形如 `reread-3gxxxxxx`）。

> 个人主体无法微信认证，因此不能用微信支付、不能用部分开放能力。自用够用。

## 二、部署后端到云托管

代码在 `backend/`，已经带好 `Dockerfile`。

1. 云开发控制台 →「云托管」→ 新建服务，服务名填 **`reread-api`**（要和前端 `TARO_APP_CLOUD_SERVICE` 一致）。
2. 部署方式选「本地代码 / 代码包上传」，目录指向 `backend/`，端口填 **80**。
3. 在「服务设置 → 环境变量」里填：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `REREAD_LLM_BASE_URL` | 是 | `https://api.moonshot.cn/v1` 或 `https://ark.cn-beijing.volces.com/api/v3` |
| `REREAD_LLM_API_KEY` | 是 | 模型密钥 |
| `REREAD_LLM_MODEL` | 是 | 例如 `kimi-k2.6`、`doubao-seed-2.0-pro` |
| `TCB_ENV` | 是 | 云开发环境 ID，用于连数据库 |
| `REREAD_STORE` | 是 | 填 `cloud`，表示用云数据库 |
| `REREAD_DAILY_LIMIT` | 否 | 每日上限，默认 20 |
| `REREAD_ALLOWED_OPENIDS` | 建议 | 只允许你的 openid 调用，多个用逗号分隔 |
| `REREAD_REQUIRE_OPENID` | 建议 | 填 `1`，没拿到微信身份直接拒绝 |

4. 在云开发控制台 → 数据库，新建三个集合：**`reports`**、**`tasks`**、**`usage`**。
   权限都设成「仅管理端可读写」——小程序端不直连数据库，全部走容器接口，所以不需要给客户端开权限。
5. 部署完成后，先访问 `https://<你的服务域名>/health`，应返回 `store.mode = "cloud"`。

> 如果 `/health` 里 `llm.enabled` 是 `false`，说明三个模型变量没配全，此时生成的报告会明确标注为「内置样例」。

## 三、拿自己的 openid

1. 先不填 `REREAD_ALLOWED_OPENIDS`，把小程序跑起来（见下一步）。
2. 打开「我的」页，或直接调 `GET /api/me`，返回里的 `openid` 就是你的。
3. 把它填进 `REREAD_ALLOWED_OPENIDS`，重启服务。之后只有你能调用。

## 四、构建并安装到手机

构建时注入云环境：

```bash
TARO_APP_CLOUD_ENV=reread-3gxxxxxx \
TARO_APP_CLOUD_SERVICE=reread-api \
npm run build:weapp
```

Windows PowerShell：

```powershell
$env:TARO_APP_CLOUD_ENV="reread-3gxxxxxx"; $env:TARO_APP_CLOUD_SERVICE="reread-api"; npm run build:weapp
```

然后用微信开发者工具打开项目根目录：

1. 确认 `project.config.json` 的 `miniprogramRoot` 指向 `dist/`，`appid` 是你的正式 AppID。
2. 点「上传」，版本号随意，备注写「自用版」。
3. 小程序后台 →「版本管理」→ 把刚上传的版本设为**体验版**。
4. 后台 →「成员管理」→ 把自己加为**体验成员**。
5. 用微信扫体验版二维码，加到「我的小程序」，之后从微信首页下拉就能进。

> **不要点「提交审核」。** 一旦发布，就进入完整审核流程，而且个人主体做「AI + 投资解读」类目基本过不了；发布后还会被别人搜到，替别人付模型钱。

## 五、本地调试（不连云托管）

后端本机跑：

```bash
cd backend
cp .env.example .env    # 填模型 key
npm install
node server.js
```

前端走本地 HTTP 构建（手机和电脑要在同一 WiFi）：

```bash
TARO_APP_API_BASE=http://192.168.1.8:8787 npm run build:weapp
```

开发者工具里勾选「详情 → 本地设置 → 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」，预览二维码就能连本机后端。

不设 `TARO_APP_API_BASE` 时，默认走云托管，不会被误连到本机。

## 六、这套配置下不需要做的事

- ❌ ICP 备案 / HTTPS 证书 / 合法域名配置（`callContainer` 免校验）
- ❌ 小程序类目与提审
- ❌ 算法备案、AIGC 服务备案材料
- ❌ 微信支付、订阅消息、开放平台资质
- ❌ 多用户隔离、分享、内容安全接口

## 七、自己用仍然要注意的三件事

1. **剪贴板 API 已移除**。首页改成在输入框里长按粘贴，避开隐私接口声明那一套。别再把 `getClipboardData` 加回来。
2. **额度是真的会挡你**。默认每天 20 次，抓取失败会把额度退回去，但正常生成会实扣。嫌少就改 `REREAD_DAILY_LIMIT`。
3. **抓取随时可能失效**。微信改版或触发验证时，报告会生成失败。这是外部依赖，自用也无法消除，只能等风控过去再试。
