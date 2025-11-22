# Growark 教学管理系统 - 快速部署指南

## 目录
1. [问题诊断与解决](#问题诊断与解决)
2. [Sealos 部署方案](#sealos-部署方案)
3. [快速更新部署](#快速更新部署)
4. [API 接口文档](#api-接口文档)

---

## 问题诊断与解决

### 问题场景：网页打不开

#### 常见原因及解决方案

| 问题 | 原因 | 解决方案 |
|------|------|--------|
| 手机端/大屏端白屏 | 前端路由映射错误 | 检查 `server.js` 中的路由配置 |
| API 请求失败 | 后端服务未运行 | 查看服务日志，重启 entrypoint.sh |
| 学生数据为空 | 数据库未初始化或连接失败 | 运行 `create-schema.js` 初始化数据库 |
| 数据被清空 | 错误处理不完善导致状态回滚 | 更新前端错误处理逻辑 |

#### 诊断命令
```bash
# 1. 检查健康状态
curl https://xysrxgjnpycd.sealoshzh.site/health

# 2. 查看前端是否加载
curl https://xysrxgjnpycd.sealoshzh.site/admin | grep "script"

# 3. 测试 API
curl https://xysrxgjnpycd.sealoshzh.site/api/students

# 4. 查看服务日志（本地）
tail -f /home/devbox/.pm2/logs/server-out.log
```

---

## Sealos 部署方案

### 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    Sealos 云平台                         │
├─────────────────────────────────────────────────────────┤
│  1. 前端应用                2. 后端服务               3. 数据库    │
│  ┌─────────────┐          ┌──────────────┐        ┌─────────┐  │
│  │ Vite Build  │────────→ │ Express.js   │───────→│ PostgreSQL  │
│  │ (dist/)     │          │ server.js    │        └─────────┘  │
│  └─────────────┘          └──────────────┘                     │
│                           WebSocket 实时推送              │
└─────────────────────────────────────────────────────────┘
```

### 部署前提

1. **Sealos 账户** - 已配置公网域名: `xysrxgjnpycd.sealoshzh.site`
2. **数据库** - PostgreSQL 已配置连接字符串
3. **源代码** - Git 仓库已初始化

### 初次部署流程

#### 步骤 1：准备代码和资源

```bash
# 登录 Sealos 云平台后，创建应用部署
# 项目结构应该是：
/project
  ├── server.js          # Express 服务器
  ├── create-schema.js   # 数据库初始化脚本
  ├── entrypoint.sh      # 启动脚本
  ├── package.json       # Node.js 依赖
  ├── public/            # 前端静态文件
  │   ├── index.html     # 手机端入口
  │   ├── assets/        # JavaScript 包
  │   └── bigscreen/     # 大屏端文件
  └── mobile/            # 前端源代码
      ├── pages/
      ├── components/
      └── dist/          # 编译后的文件
```

#### 步骤 2：配置环境变量

在 Sealos 中设置以下环境变量：

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres
```

#### 步骤 3：启动应用

```bash
# 使用 entrypoint.sh 启动生产环境
./entrypoint.sh production
```

**启动流程：**
1. 检查依赖（npm install 如需要）
2. 初始化数据库（首次部署）
3. 启动 Express 服务器
4. 监听 0.0.0.0:3000

---

## 快速更新部署

### 场景：代码有更新，需要快速部署到 Sealos

#### 方案 1：本地编译 + Git 推送（推荐）

**时间：2-3 分钟**

```bash
# 1. 确保在项目根目录
cd /home/devbox/project

# 2. 编译前端（生成 dist/）
cd mobile
npm run build
cd ..

# 3. 复制前端文件到 public
cp -r mobile/dist/* public/

# 4. 提交代码
git add -A
git commit -m "Update: [功能描述]"

# 5. 推送到远程仓库
git push origin master
```

**Sealos 上自动部署：**
- Sealos 会自动拉取最新代码
- 运行 entrypoint.sh 重新启动
- 新版本在 1-2 分钟内上线

#### 方案 2：直接修改 + Sealos 重启

**时间：1 分钟（紧急修复）**

```bash
# 在 Sealos 界面中：
1. 进入应用详情
2. 修改文件（server.js 或 public 中的文件）
3. 点击"重启应用"
4. 等待 30 秒完成
```

#### 方案 3：使用 Sealos CLI 推送

**时间：1-2 分钟**

```bash
# 需要先安装 sealos CLI
# 1. 编译前端
cd mobile && npm run build && cd ..

# 2. 复制到 public
cp -r mobile/dist/* public/

# 3. 使用 sealos 命令推送
sealos exec --cwd /project "cd /project && ./entrypoint.sh production"
```

---

## API 接口文档

### 基础信息

- **Base URL**: `https://xysrxgjnpycd.sealoshzh.site/api`
- **响应格式**: JSON
- **错误处理**: 所有响应包含 `success` 字段和 `timestamp`

### 学生管理 API

#### 获取所有学生
```
GET /api/students

响应示例：
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "张三",
      "score": 850,
      "total_exp": 1200,
      "level": 5,
      "class_name": "黄老师班",
      "avatar_url": "https://..."
    }
  ],
  "timestamp": "2025-11-22T17:45:44.927Z"
}
```

#### 创建学生
```
POST /api/students

请求体：
{
  "name": "新学生",
  "class_name": "黄老师班",
  "avatar_url": "https://...",
  "score": 0,
  "total_exp": 0,
  "level": 1
}

响应：创建的学生对象
```

#### 编辑学生
```
PUT /api/students/:id

请求体（支持部分更新）：
{
  "name": "新名字",
  "class_name": "新班级",
  "score": 100,
  "level": 2
}
```

#### 删除学生
```
DELETE /api/students/:id

响应：
{
  "success": true,
  "message": "Student deleted successfully",
  "timestamp": "..."
}
```

#### 调整学生分数
```
POST /api/students/:id/adjust-score

请求体：
{
  "delta": 50  // 增加50分
}
```

### 挑战管理 API

#### 创建挑战
```
POST /api/challenges

请求体：
{
  "title": "挑战名称",
  "description": "挑战描述",
  "status": "active",
  "reward_points": 100,
  "reward_exp": 200
}
```

#### 获取所有挑战
```
GET /api/challenges
```

#### 更新挑战状态
```
PUT /api/challenges/:id

请求体：
{
  "status": "completed",
  "result": "success"
}
```

### PK 比赛 API

#### 创建 PK
```
POST /api/pk-matches

请求体：
{
  "student_a": "学生A ID",
  "student_b": "学生B ID",
  "topic": "PK 主题",
  "status": "pending"
}
```

#### 获取所有 PK
```
GET /api/pk-matches
```

#### 更新 PK 结果
```
PUT /api/pk-matches/:id

请求体：
{
  "status": "finished",
  "winner_id": 123
}
```

### 任务管理 API

#### 创建任务
```
POST /api/tasks

请求体：
{
  "title": "任务名称",
  "description": "任务描述",
  "exp_value": 100
}
```

#### 获取所有任务
```
GET /api/tasks
```

### 勋章系统 API

#### 颁发勋章
```
POST /api/students/:student_id/badges/:badge_id

响应：
{
  "success": true,
  "data": {
    "student_id": 1,
    "badge_id": 1
  }
}
```

### 习惯打卡 API

#### 习惯打卡
```
POST /api/habits/:habit_id/checkin

请求体：
{
  "student_id": 1
}

响应：
{
  "success": true,
  "data": {
    "student_id": 1,
    "habit_id": 1,
    "checked_in_at": "2025-11-22T17:45:44.927Z"
  }
}
```

---

## 常见问题

### Q1: 部署后前端仍然是旧版本？
**A**: 清除浏览器缓存，或使用硬刷新（Ctrl+Shift+R / Cmd+Shift+R）。也可以检查 `public/index.html` 中的 JS 文件名是否已更新。

### Q2: 数据库连接失败？
**A**: 检查环境变量中的 `DATABASE_URL` 是否正确，确保 PostgreSQL 服务正在运行。

### Q3: 如何恢复误删的数据？
**A**:
1. 检查数据库备份
2. 使用 `clean-mock-data.js` 可以恢复数据库初始状态
3. 联系 Sealos 客服进行数据库快照恢复

### Q4: WebSocket 连接失败？
**A**: 确保 Sealos 的安全组已开放 WebSocket 端口，或使用 `/admin` 路由检查连接状态。

---

## 快速命令参考

```bash
# 本地开发环境启动
./entrypoint.sh development

# 本地生产环境启动
./entrypoint.sh production

# 编译前端
cd mobile && npm run build && cd ..

# 初始化数据库（开发环境）
node create-schema.js

# 查看服务日志
tail -f /home/devbox/.pm2/logs/server-out.log

# 重启 PM2 应用
pm2 restart server

# 提交代码并推送
git add -A && git commit -m "描述" && git push origin master
```

---

**最后更新**: 2025-11-22
**维护者**: 系统管理员
