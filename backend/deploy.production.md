# Re-Read 后端生产部署说明

## 目标

把当前本地后端从 `127.0.0.1:8787` 部署为公网 `HTTPS` 服务，并接入微信小程序合法域名。

## 最小部署步骤

1. 准备一台可公网访问的 Linux 主机
2. 拉取当前仓库代码
3. 配置环境变量
4. 使用 `node backend/server.js` 启动服务
5. 用 Nginx 或云负载均衡转发到 `HTTPS`
6. 在微信公众平台配置 request 合法域名
7. 在小程序内切换后端地址为生产域名

## 环境变量

参考 [`.env.example`](file:///Users/violawu/Documents/trae_projects/Re-Read/backend/.env.example)

- `REREAD_HOST=0.0.0.0`
- `REREAD_PORT=8787`

## 推荐域名

- `https://api.reread.your-domain.com`

## 反向代理要求

- 对外必须是 `HTTPS`
- `/health` 用于健康检查
- `/api/*` 转发到 Node 服务

## 当前局限

- 仍是本地文件持久化
- 还未接数据库
- 还未接真实 LLM / Agent
- 还未加鉴权、限流、审计

## 下一步建议

1. 接数据库保存历史报告
2. 接真实公众号解析与 Step 0 溯源
3. 接 SOP Agent
4. 加管理员后台与调用监控
