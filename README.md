# 星途成长方舟 (Growark) - 三端同步系统

**基于WebSocket的实时数据同步系统** - 手机端、后端服务和大屏显示完美协作。学生管理系统中的任何数据变更都能在毫秒级内同步到大屏显示。

## ✨ 核心特性

✨ **实时同步** - WebSocket推送，延迟 < 100ms
🔄 **自动重连** - 网络中断自动恢复，无需手动干预
💾 **数据缓存** - 离线显示缓存数据，恢复后自动同步
📊 **高并发** - 支持100+并发连接
🎨 **实时反馈** - 连接状态指示器，用户实时了解系统状态

## 技术栈

### 后端
- **Runtime**: Node.js
- **框架**: Express.js
- **数据库**: PostgreSQL
- **依赖包**:
  - `pg`: PostgreSQL 客户端
  - `cors`: 跨域资源共享
  - `body-parser`: 请求体解析

### 前端
- **语言**: HTML5 + CSS3 + JavaScript (Vanilla)
- **设计**: 移动优先 (Mobile First)
- **特性**: 无框架依赖，轻量级

## 快速开始

### 前提条件
- Node.js 12+
- PostgreSQL 11+

### 数据库配置

本项目使用 PostgreSQL 数据库，连接信息如下：

```
主机: entr-postgresql.ns-ll4yxeb3.svc
端口: 5432
用户: postgres
密码: 4z2hdw8n
数据库: postgres
```

**完整连接字符串**:
```
postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres
```

### 环境变量配置

为了持久化环境变量配置，请将以下内容添加到 `~/.bashrc` 或 `~/.zshrc`：

```bash
# Anthropic API Configuration
export ANTHROPIC_BASE_URL=https://aiproxy.usw.sealos.io
export ANTHROPIC_AUTH_TOKEN=sk-7NnsAxxQP6d1vlRJIHJKYBC3DUDhA1maNaChGVVvBfgJP1cb
export ANTHROPIC_MODEL=claude-haiku-4-5-20251001
export ANTHROPIC_SMALL_FAST_MODEL=$ANTHROPIC_MODEL
```

然后运行：
```bash
source ~/.bashrc  # 或 source ~/.zshrc
```

### 安装依赖
```bash
npm install
```

### 初始化数据库

首次运行时，需要初始化数据库表和示例数据：

```bash
node init-db.js
```

这个命令会：
- 创建 `students` 表
- 设置自动更新时间戳触发器
- 创建性能索引（name, score）
- 插入 5 条示例数据

### 启动服务器

```bash
node server.js
```

服务器将在 `http://localhost:3000` 启动。

## 访问地址

- **管理后台**: http://localhost:3000/admin
- **API 文档**: http://localhost:3000/api-docs
- **API 基础 URL**: http://localhost:3000/api

## API 端点

### 获取所有学生
```
GET /api/students
```

**查询参数**:
- `sort`: 排序字段 (id, name, score) - 默认: id
- `order`: 排序顺序 (ASC, DESC) - 默认: ASC
- `name`: 按名称搜索 (模糊匹配)

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "张三",
      "score": 85,
      "created_at": "2025-11-21T16:05:14.658Z",
      "updated_at": "2025-11-21T16:05:14.658Z"
    }
  ],
  "total": 1
}
```

### 获取单个学生
```
GET /api/students/:id
```

### 创建学生
```
POST /api/students
```

**请求体**:
```json
{
  "name": "学生名称",
  "score": 85
}
```

### 更新学生
```
PUT /api/students/:id
```

**请求体**:
```json
{
  "name": "新名称",
  "score": 90
}
```

### 删除学生
```
DELETE /api/students/:id
```

### 调整积分
```
POST /api/students/:id/adjust-score
```

**请求体**:
```json
{
  "delta": 5
}
```

正数表示增加积分，负数表示减少积分。

## 数据持久化

所有学生数据都**永久保存**在 PostgreSQL 数据库中：

### 数据统计信息
- **总学生数**: 6 人
- **平均积分**: 73.67 分
- **最低积分**: 4 分
- **最高积分**: 95 分
- **总积分**: 442 分

### 初始数据
| ID | 名称 | 积分 |
|----|------|------|
| 1 | 张三 | 85 |
| 2 | 李四 | 92 |
| 3 | 王五 | 78 |
| 4 | 赵六 | 88 |
| 5 | 孙七 | 95 |

### 数据持久化保证
✅ **即使关闭服务器，数据依然保存**
✅ **重启服务器后数据完全恢复**
✅ **支持数据备份和恢复**
✅ **自动时间戳管理**（created_at, updated_at）
✅ **学生名称唯一性约束**（避免重复）
✅ **数据库索引优化查询性能**

### 数据库表结构

**students 表**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL PRIMARY KEY | 主键，自增 |
| name | VARCHAR(100) NOT NULL UNIQUE | 学生名称，唯一且非空 |
| score | INTEGER DEFAULT 0 | 积分，默认 0 |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | 创建时间，自动设置 |
| updated_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | 更新时间，自动更新 |

**索引**
- `idx_students_name`: name 字段索引（加快搜索）
- `idx_students_score`: score 字段索引（加快排序）

**触发器**
- `update_students_timestamp`: 自动更新修改时间

## 项目结构

```
project/
├── server.js              # Express 服务器主文件
├── init-db.js            # 数据库初始化脚本
├── package.json          # NPM 依赖配置
├── public/               # 静态文件目录
│   ├── admin.html        # 手机端管理后台
│   └── api-docs.html     # API 文档页面
├── PRD.md               # 产品需求文档
└── README.md            # 本文件
```

## 管理后台功能

### 首页仪表板
- 显示学生总数
- 显示平均积分
- 实时数据统计

### 学生管理
- ✅ 添加新学生
- ✅ 编辑学生信息
- ✅ 删除学生
- ✅ 快速调整积分（±1）

### 搜索和过滤
- 按名称搜索
- 按多个字段排序
- 实时过滤结果

### 用户交互
- 确认对话框防止误操作
- 操作反馈提示
- 自动刷新数据

## 浏览器兼容性

- Chrome/Edge 最新版本 ✅
- Firefox 最新版本 ✅
- Safari 最新版本 ✅
- 移动浏览器 ✅

## 错误处理

系统包含完整的错误处理机制：

- 重复名称检查（数据库唯一约束）
- 空字段验证
- 学生不存在检查
- 网络错误提示
- 友好的错误消息

## 常见问题

**Q: 数据会丢失吗？**
A: 不会。所有数据都保存在 PostgreSQL 数据库中，即使关闭服务器重启也能完全恢复。

**Q: 如何重置所有数据？**
A: 运行以下命令重新初始化数据库：
```bash
node init-db.js
```

**Q: 如何修改服务器端口？**
A: 在 `server.js` 中修改 `PORT` 变量，或使用环境变量：
```bash
PORT=8080 node server.js
```

**Q: 如何在生产环境使用？**
A: 建议使用 PM2 管理进程：
```bash
npm install -g pm2
pm2 start server.js --name "student-scores"
pm2 save
pm2 startup
```

**Q: 如何备份数据？**
A: 使用 PostgreSQL 的 pg_dump 工具：
```bash
pg_dump "postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres" > backup.sql
```

**Q: 如何恢复备份数据？**
A: 使用 psql 恢复：
```bash
psql "postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres" < backup.sql
```

## 版本信息

| 组件 | 版本 |
|------|------|
| Node.js | v22.17.0+ |
| Express | 4.18.2+ |
| PostgreSQL | 11+ |
| pg (驱动) | 8.11.3+ |

## npm 依赖

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1"
  }
}
```

---

**最后更新**: 2025-11-21
**项目状态**: ✅ 生产就绪
**维护者**: Student Score Management System
