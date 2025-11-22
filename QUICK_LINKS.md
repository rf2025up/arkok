# 🔗 快速链接卡片

## 📍 公网地址（生产环境）

### 大屏展示系统 📺
```
https://xysrxgjnpycd.sealoshzh.site/display
```
- 文件: `public/display.html`
- 功能: 实时学生排行榜
- 适合: 大屏/投影仪显示

### 手机管理系统 📱
```
https://xysrxgjnpycd.sealoshzh.site/admin
```
- 文件: `public/admin.html`
- 功能: 学生管理、积分调整
- 适合: 手机/Pad 操作

### 后端 API 基础地址 🔌
```
https://xysrxgjnpycd.sealoshzh.site/api
```
- 文件: `server.js`
- 功能: 数据接口
- 格式: RESTful JSON

### API 文档 📖
```
https://xysrxgjnpycd.sealoshzh.site/api-docs
```
- 内容: API 接口说明
- 功能: API 测试工具

### WebSocket 连接 🔄
```
wss://xysrxgjnpycd.sealoshzh.site
```
- 协议: WebSocket (加密)
- 功能: 实时推送
- 用于: 大屏实时更新

---

## 🏠 本地开发地址

### 后端服务
```
http://localhost:3000
```

### 大屏本地版
```
http://localhost:3000/display
```

### 手机本地版
```
http://localhost:3000/admin
```

### 本地 API
```
http://localhost:3000/api
```

### 本地 WebSocket
```
ws://localhost:3000
```

---

## 📂 文件位置

| 用途 | 文件位置 |
|------|---------|
| 后端程序 | `/home/devbox/project/server.js` |
| 大屏页面 | `/home/devbox/project/public/display.html` |
| 手机页面 | `/home/devbox/project/public/admin.html` |
| 大屏源码 | `/home/devbox/project/bigscreen/src/` |
| 手机源码 | `/home/devbox/project/mobile/src/` |

---

## 🚀 常用命令

### 启动开发环境
```bash
cd /home/devbox/project
./entrypoint.sh development
```

### 启动生产环境
```bash
cd /home/devbox/project
./entrypoint.sh production
```

### 查看后端日志
```bash
# 如果后端在后台运行
tail -f /tmp/backend.log
```

### 测试 API
```bash
# 获取所有学生
curl https://xysrxgjnpycd.sealoshzh.site/api/students

# 创建新学生
curl -X POST https://xysrxgjnpycd.sealoshzh.site/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"新学生","score":85}'
```

### 完整系统测试
```bash
curl https://xysrxgjnpycd.sealoshzh.site/health
```

---

## 📞 API 端点速查

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/students` | 获取所有学生 |
| GET | `/api/students/:id` | 获取单个学生 |
| POST | `/api/students` | 创建学生 |
| PUT | `/api/students/:id` | 更新学生 |
| DELETE | `/api/students/:id` | 删除学生 |
| POST | `/api/students/:id/adjust-score` | 调整积分 |
| GET | `/health` | 健康检查 |

---

## 🔑 关键配置

### 后端配置文件
- **数据库连接**: `server.js` 第 16 行
- **监听端口**: `server.js` 第 12 行 (默认 3000)
- **CORS 配置**: `server.js` 第 20 行

### 前端配置
- **大屏 API**: `public/display.html` 顶部
- **手机 API**: `public/admin.html` 顶部
- **WebSocket 地址**: `display.html` 中定义

---

## 💻 系统要求

| 项目 | 要求 | 状态 |
|------|------|------|
| Node.js | 12+ | ✅ v22.17.0 |
| npm | 6+ | ✅ 10.9.2 |
| PostgreSQL | 11+ | ✅ 已连接 |
| 现代浏览器 | Chrome/Safari/Firefox | ✅ 支持 |

---

## 🆘 快速故障排查

### 问题: 无法访问大屏
```bash
# 检查后端是否运行
curl https://xysrxgjnpycd.sealoshzh.site/health

# 检查文件是否存在
ls -la /home/devbox/project/public/display.html
```

### 问题: API 返回错误
```bash
# 查询数据库
psql "postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres"
SELECT COUNT(*) FROM students;
```

### 问题: WebSocket 连接失败
```bash
# 检查 WebSocket 服务
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  https://xysrxgjnpycd.sealoshzh.site
```

---

## 📊 部署状态检查

```bash
# 完整系统检查脚本
bash /tmp/test-all.sh
```

---

## 📚 相关文档导航

| 文档 | 用途 |
|------|------|
| `FRONTEND_MAPPING.md` | 详细映射说明 |
| `FRONTEND_TEST_GUIDE.md` | 测试指南 |
| `FRONTEND_MAPPING_SUMMARY.md` | 验证报告 |
| `DEPLOY_WITH_ENTRYPOINT.md` | 部署指南 |
| `README.md` | 项目概览 |

---

## ✨ 备忘录

- 大屏在 `/display` 路由
- 手机在 `/admin` 路由
- API 在 `/api` 路由
- WebSocket 通过 `wss://` 连接
- 所有文件在 `public/` 目录
- 后端是 `server.js`

---

**最后更新**: 2025-11-22
**系统状态**: ✅ 运行正常
**映射状态**: ✅ 完全对应
