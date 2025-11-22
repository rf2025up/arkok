# 🚀 快速启动指南 - 三端打通完整部署

**当前状态**: 准备部署新的三端架构
**预计耗时**: 4-6 小时
**难度**: 中等

---

## ✅ 前提条件检查

### 已验证

- ✅ Sealos PostgreSQL 数据库可连接
- ✅ Express 后端已存在并可运行
- ✅ 现有数据库有访问权限
- ✅ devbox 环境已准备好
- ✅ Node.js 和 npm 可用

### 需要确认

- ❓ 是否允许修改数据库表结构？
- ❓ 是否保留现有 students 表中的示例数据？
- ❓ 新手机端和大屏端从何处获取？

---

## 🎯 部署步骤

### **步骤 1: 创建新的数据库 Schema** (10分钟)

这一步会创建所有需要的新表和默认数据。

```bash
# 进入项目目录
cd /home/devbox/project

# 运行 Schema 创建脚本
node create-schema.js
```

**输出应该包含**:
```
✨ 数据库 Schema 创建完成！

📋 创建的表:
  1. teams - 团队表
  2. students (扩展) - 学生表
  ... 其他表
```

✅ **完成后**: 所有表已创建，包含默认数据

---

### **步骤 2: 扩展后端 API** (1-2小时)

需要添加 WebSocket 支持和新的 API 端点。

#### 2.1 更新 package.json

```bash
cd /home/devbox/project
npm install ws
```

#### 2.2 改造 server.js

需要添加 WebSocket 支持。我来帮你做这个改造。

**主要改动**:
1. 添加 WebSocket 服务器
2. 添加实时广播函数
3. 添加新的 API 路由
4. 实现事件发射

#### 2.3 创建新的 API 路由文件

创建以下文件:
- `routes/challenges.js` - 挑战 API
- `routes/pk.js` - PK 比赛 API
- `routes/tasks.js` - 任务 API
- `routes/badges.js` - 勋章 API
- `routes/habits.js` - 习惯 API
- `routes/scores.js` - 积分管理 API

---

### **步骤 3: 部署新的手机端** (1小时)

这步会将 Growark 的手机端代码复制到项目中，并改造为连接真实后端。

```bash
# 复制 Growark 手机端代码到项目
cp -r /tmp/growark /home/devbox/project/mobile

# 进入手机端目录
cd /home/devbox/project/mobile

# 安装依赖
npm install

# 创建 API 服务层 (services/api.ts)
# 这里需要新建 api.ts 文件，连接到后端

# 改造 App.tsx - 连接真实后端
# 改造所有 handlers - 使用异步 API 调用

# 启动开发服务器
npm run dev
```

**访问地址**: `http://localhost:5173` (或后续显示的地址)

---

### **步骤 4: 部署新的大屏端** (1小时)

这步会部署新的大屏展示，并实现 WebSocket 实时订阅。

```bash
# 复制 Growark 大屏代码到项目
cp -r /tmp/growark/bigscreen /home/devbox/project/bigscreen

# 进入大屏目录
cd /home/devbox/project/bigscreen

# 安装依赖
npm install

# 创建 WebSocket 服务 (services/websocket.ts)
# 改造 sealosService.ts - 连接真实后端
# 改造 main.tsx - 实现实时订阅

# 启动开发服务器
npm run dev
```

**访问地址**: `http://localhost:5174` (或后续显示的地址)

---

### **步骤 5: 测试三端同步** (30分钟)

三个终端同时运行:

```bash
# 终端 1: 启动后端
cd /home/devbox/project
node server.js

# 终端 2: 启动手机端
cd /home/devbox/project/mobile
npm run dev

# 终端 3: 启动大屏端
cd /home/devbox/project/bigscreen
npm run dev
```

#### 测试流程

1. **打开手机端** (http://localhost:5173)
   - [ ] 能看到学生列表
   - [ ] 能创建新学生
   - [ ] 能增加/减少积分

2. **打开大屏端** (http://localhost:5174)
   - [ ] 能看到排行榜
   - [ ] 能看到团队分布
   - [ ] 显示连接状态

3. **测试同步**
   - 在手机端创建学生 → 大屏端是否立即显示？
   - 在手机端增加积分 → 大屏端排行榜是否更新？
   - 断开手机端 → 大屏端是否显示？
   - 重新连接 → 数据是否保持一致？

4. **查看浏览器控制台**
   - [ ] 有没有错误日志？
   - [ ] WebSocket 连接是否成功？
   - [ ] API 请求是否正确？

---

## 🔧 技术细节

### 当前架构

```
┌─────────────────────────────────────────────────┐
│         Sealos PostgreSQL 数据库                 │
│  (teams, students, challenges, tasks, ...)      │
└─────────────────────────────────────────────────┘
                      ▲
                      │
          ┌───────────┴───────────┐
          │                       │
    [Express Server]        [WebSocket]
    (REST API)             (实时推送)
          │                       │
    ┌─────┴─────┐          ┌─────┴────────┐
    │           │          │              │
[手机端]     [管理后台]  [大屏端]      [第三方]
React      (admin.html)  React        应用
```

### 关键文件

**后端**:
- `server.js` - Express 主服务器 (需要扩展)
- `routes/*.js` - API 路由 (需要新建)
- `create-schema.js` - 数据库初始化 (已准备)

**手机端** (`/mobile/`):
- `services/api.ts` - API 客户端 (需要新建)
- `App.tsx` - 主应用 (需要改造)
- `pages/*.tsx` - 页面 (需要改造)

**大屏端** (`/bigscreen/`):
- `services/websocket.ts` - WebSocket 客户端 (需要新建)
- `services/sealosService.ts` - 数据服务 (需要改造)
- `main.tsx` - 主应用 (需要改造)

---

## 📊 验证清单

### 数据库

- [ ] 所有 13 个新表已创建
- [ ] 默认数据已插入
- [ ] 现有学生数据已更新

### 后端

- [ ] Express 服务器启动成功
- [ ] WebSocket 服务可连接
- [ ] API 端点都可访问
- [ ] 日志输出正常

### 手机端

- [ ] npm 依赖安装成功
- [ ] 开发服务器启动成功
- [ ] 可加载学生列表
- [ ] API 调用返回数据
- [ ] 状态管理工作正常

### 大屏端

- [ ] npm 依赖安装成功
- [ ] 开发服务器启动成功
- [ ] WebSocket 连接建立
- [ ] 可显示排行榜
- [ ] 实时更新工作

### 集成测试

- [ ] 手机端 → 创建学生 → 数据库保存 → 大屏端显示
- [ ] 手机端 → 增加积分 → 数据库更新 → 大屏端排序变化
- [ ] 手机端 → 创建挑战 → 大屏端显示
- [ ] 手机端 → 完成任务 → 学生经验更新
- [ ] 大屏端 ← 实时推送更新 ← 后端 ← 手机端

---

## 🐛 常见问题

### 1. 数据库连接失败

**症状**: `Error: connect ECONNREFUSED`

**解决**:
```bash
# 检查连接字符串
grep connectionString /home/devbox/project/server.js

# 尝试直接连接
psql postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres
```

### 2. WebSocket 连接失败

**症状**: 大屏端显示"连接断开"

**解决**:
```bash
# 检查后端是否启动
curl http://localhost:3000/health

# 检查 WebSocket 日志
# 在 server.js 中查看连接日志
```

### 3. 手机端 API 调用失败

**症状**: "操作失败" 或空白屏幕

**解决**:
```bash
# 检查 API 基础 URL
# 确保 api.ts 中的 API_BASE_URL 正确
# 检查浏览器控制台错误
# 检查 CORS 配置
```

### 4. 数据不同步

**症状**: 手机端更新，大屏端未变化

**解决**:
1. 检查 WebSocket 连接
2. 检查浏览器控制台错误
3. 检查后端日志是否有错误
4. 检查大屏端是否正确订阅事件

---

## 💡 性能优化建议

1. **添加缓存**
   - 客户端缓存学生列表
   - 缓存失效策略

2. **分页加载**
   - 大屏端分页显示排行榜
   - 手机端分页显示学生

3. **连接管理**
   - 自动重连机制
   - 心跳检测

4. **数据库优化**
   - 索引已创建
   - 定期备份

---

## 📞 获取帮助

如果遇到问题:

1. 查看本文档的"常见问题"部分
2. 检查后端日志: `node server.js` 的输出
3. 检查浏览器控制台: F12 打开开发者工具
4. 查看网络请求: 在浏览器中查看 Network 标签
5. 查看 WebSocket 消息: 在浏览器中监听 WS 连接

---

## ✨ 部署完成后

一旦所有三端都正常运行并同步工作:

1. 在 Sealos 中部署生产版本
2. 配置域名和 HTTPS
3. 设置数据备份计划
4. 监控系统性能
5. 持续迭代改进

---

## 🎉 下一步

1. 确认以上所有前提条件都满足
2. 按步骤执行部署
3. 在各个步骤后验证
4. 完成后通知

**准备好了吗? 让我们开始吧! 🚀**

---

## 📋 所需时间表

| 步骤 | 任务 | 耗时 | 检查点 |
|------|------|------|--------|
| 1 | 创建数据库 Schema | 10分钟 | 13 个表创建成功 |
| 2 | 扩展后端 API | 1.5小时 | 所有 API 端点可用 |
| 3 | 部署手机端 | 1小时 | 学生列表能显示 |
| 4 | 部署大屏端 | 1小时 | 排行榜能显示 |
| 5 | 测试同步 | 30分钟 | 三端完全同步 |
| | **总计** | **4-5小时** | ✅ 完成 |

---

**现在就开始吧!** 从"步骤 1"开始。
