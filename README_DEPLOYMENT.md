# 🎯 Growark 三端打通部署 - 完整指南

**项目**: Classroom Hero - 学生积分管理系统改版
**当前环境**: Sealos Devbox
**目标**: 实现手机端 ↔ Sealos数据库 ↔ 大屏端 的完整同步

---

## 📑 快速导航

- 🟢 [当前状态](#当前状态) - 系统现状评估
- 📊 [技术架构](#技术架构) - 三端架构设计
- 📋 [部署步骤](#部署步骤) - 一步步部署指南
- ✅ [验证清单](#验证清单) - 部署后检查项
- 🐛 [问题排查](#问题排查) - 常见问题解决

---

## 当前状态

### ✅ 已就绪

| 组件 | 状态 | 文件位置 |
|------|------|--------|
| **后端** | ✅ 已存在 | `server.js` |
| **数据库** | ✅ 可连接 | Sealos PostgreSQL |
| **权限** | ✅ 充足 | 可建表、可修改 |
| **新代码** | ✅ 已下载 | `/tmp/growark/` |
| **文档** | ✅ 已完成 | 本目录下 |

### ❌ 待完成

| 功能 | 优先级 | 耗时 |
|------|-------|------|
| **创建数据库表** | 🔴 高 | 10分钟 |
| **扩展后端 API** | 🔴 高 | 1-2小时 |
| **部署手机端** | 🔴 高 | 1小时 |
| **部署大屏端** | 🔴 高 | 1小时 |
| **测试同步** | 🟡 中 | 30分钟 |

---

## 技术架构

```
                    手机端 (React)
                    ↓ HTTP POST/PUT
                    ↓
        ┌───────────────────────────┐
        │   Express.js 后端         │
        │   - REST API              │
        │   - WebSocket 服务器      │
        └───────────┬───────────────┘
                    │
                    ├─→ 数据库操作 (CRUD)
                    │
                    └─→ 广播 WebSocket 消息
                    ↑
                    │ 实时推送
                    │
                    大屏端 (React)
                    ← WebSocket 订阅
```

### 数据流

```
用户在手机端操作
    ↓
调用 API (HTTP POST)
    ↓
后端更新数据库
    ↓
广播 WebSocket 消息
    ↓
大屏端接收并更新
    ↓
排行榜实时刷新
```

---

## 部署步骤

### 步骤 1: 创建数据库 Schema (10分钟)

```bash
cd /home/devbox/project
node create-schema.js
```

**预期输出**:
```
✨ 数据库 Schema 创建完成！
📋 创建的表:
  1. teams - 团队表
  2. students (扩展) - 学生表
  3. groups - 分组表
  4. challenges - 挑战表
  ...
  13. score_history - 积分历史表

📊 数据验证:
  teams: 4 行
  students: 5 行
  badges: 6 行
  ...
```

**验证**:
```bash
# 检查表是否创建成功
psql postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres \
  -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"
```

---

### 步骤 2: 扩展后端 API (1-2小时)

#### 2.1 安装依赖

```bash
cd /home/devbox/project
npm install ws
```

#### 2.2 改造 server.js

需要在 `server.js` 中添加 WebSocket 支持。关键改动:

**添加导入**:
```javascript
const http = require('http');
const WebSocket = require('ws');
```

**创建 HTTP 服务器**:
```javascript
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
```

**添加 WebSocket 连接处理**:
```javascript
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
```

**添加广播函数**:
```javascript
function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
```

**修改端口监听**:
```javascript
// 改为
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 替代
// app.listen(PORT, ...)
```

#### 2.3 创建新的 API 路由文件

需要创建以下文件:

**routes/challenges.js** - 挑战管理

```javascript
const express = require('express');
const { pool, broadcast } = require('../server');

const router = express.Router();

// POST /api/challenges
router.post('/', async (req, res) => {
  try {
    const { title, description, participantIds, rewardPoints, rewardExp } = req.body;

    const result = await pool.query(
      `INSERT INTO challenges (title, description, reward_points, reward_exp, status)
       VALUES ($1, $2, $3, $4, 'active') RETURNING *`,
      [title, description, rewardPoints, rewardExp]
    );

    const challenge = result.rows[0];

    // 添加参与者
    for (const studentId of participantIds) {
      await pool.query(
        'INSERT INTO challenge_participants (challenge_id, student_id) VALUES ($1, $2)',
        [challenge.id, studentId]
      );
    }

    // 广播
    broadcast('challenge:created', challenge);

    res.json({ success: true, data: challenge });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/challenges/:id/complete
router.put('/:id/complete', async (req, res) => {
  try {
    const { result: resultType } = req.body;

    const result = await pool.query(
      'UPDATE challenges SET status = $1, result = $2 WHERE id = $3 RETURNING *',
      ['completed', resultType, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: '挑战不存在' });
    }

    // 广播
    broadcast('challenge:updated', result.rows[0]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

**类似地创建**:
- `routes/pk.js` - PK 比赛
- `routes/tasks.js` - 任务管理
- `routes/badges.js` - 勋章系统
- `routes/habits.js` - 习惯打卡
- `routes/scores.js` - 积分管理

#### 2.4 在 server.js 中注册路由

```javascript
const challengesRoutes = require('./routes/challenges');
const pkRoutes = require('./routes/pk');
const tasksRoutes = require('./routes/tasks');
// ...

app.use('/api/challenges', challengesRoutes);
app.use('/api/pk-matches', pkRoutes);
app.use('/api/tasks', tasksRoutes);
// ...
```

#### 2.5 启动后端测试

```bash
node server.js
```

**预期输出**:
```
✓ 后端服务器已启动: http://localhost:3000
✓ 管理后台: http://localhost:3000/admin
✓ API 文档: http://localhost:3000/api-docs
```

---

### 步骤 3: 部署新的手机端 (1小时)

#### 3.1 复制代码

```bash
cp -r /tmp/growark /home/devbox/project/mobile
cd /home/devbox/project/mobile
```

#### 3.2 安装依赖

```bash
npm install
```

#### 3.3 创建 API 服务层

**新建文件**: `services/api.ts`

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.json();
};

export const studentAPI = {
  async createStudent(data: any) {
    return fetchWithAuth(`${API_BASE_URL}/students`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getAllStudents() {
    return fetchWithAuth(`${API_BASE_URL}/students`);
  },

  async updateStudent(studentId: string, data: any) {
    return fetchWithAuth(`${API_BASE_URL}/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // ... 其他方法
};

export const scoreAPI = {
  async addScore(studentIds: string[], points: number, exp: number, reason: string) {
    return fetchWithAuth(`${API_BASE_URL}/scores/add`, {
      method: 'POST',
      body: JSON.stringify({ studentIds, points, exp, reason })
    });
  }
};

// ... 其他 API 对象
```

#### 3.4 改造 App.tsx

主要改动:

```typescript
// 改造初始化
useEffect(() => {
  const loadStudents = async () => {
    try {
      const data = await studentAPI.getAllStudents();
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  loadStudents();
}, []);

// 改造 handleUpdateScore
const handleUpdateScore = async (ids: string[], points: number, reason: string, exp?: number) => {
  try {
    // 乐观更新 UI
    setStudents(prev => prev.map(s => {
      if (ids.includes(s.id)) {
        return { ...s, points: s.points + points };
      }
      return s;
    }));

    // 调用 API
    await scoreAPI.addScore(ids, points, exp ?? 0, reason);
  } catch (error) {
    console.error('Failed to update score:', error);
    // 回滚
    setStudents(prev => prev.map(s => {
      if (ids.includes(s.id)) {
        return { ...s, points: s.points - points };
      }
      return s;
    }));
  }
};
```

#### 3.5 启动手机端

```bash
npm run dev
```

**预期输出**:
```
  VITE v6.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

### 步骤 4: 部署新的大屏端 (1小时)

#### 4.1 复制代码

```bash
cp -r /tmp/growark/bigscreen /home/devbox/project/bigscreen
cd /home/devbox/project/bigscreen
```

#### 4.2 安装依赖

```bash
npm install
```

#### 4.3 创建 WebSocket 服务

**新建文件**: `services/websocket.ts`

```typescript
type Callback = (data: any) => void;

let ws: WebSocket | null = null;
let subscribers = {
  'student:updated': [] as Callback[],
  'challenge:updated': [] as Callback[],
  'pk:updated': [] as Callback[]
};

export function connectWebSocket(url: string = 'ws://localhost:3000'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }

    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('WebSocket connected');
        resolve();
      };

      ws.onmessage = (event) => {
        const { type, payload } = JSON.parse(event.data);

        if (type in subscribers) {
          subscribers[type as keyof typeof subscribers].forEach(cb => cb(payload));
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        ws = null;
      };
    } catch (error) {
      reject(error);
    }
  });
}

export function subscribe(eventType: string, callback: Callback) {
  if (eventType in subscribers) {
    subscribers[eventType as keyof typeof subscribers].push(callback);
  }

  return () => {
    if (eventType in subscribers) {
      const index = subscribers[eventType as keyof typeof subscribers].indexOf(callback);
      if (index >= 0) {
        subscribers[eventType as keyof typeof subscribers].splice(index, 1);
      }
    }
  };
}
```

#### 4.4 改造 sealosService.ts

```typescript
import { connectWebSocket, subscribe } from './websocket';

const API_BASE_URL = 'http://localhost:3000/api';

export const getStudents = async () => {
  const response = await fetch(`${API_BASE_URL}/students`);
  return response.json();
};

export const subscribeToStudentChanges = (callback: (data: any) => void) => {
  return subscribe('student:updated', callback);
};

export const initializeWebSocket = async () => {
  await connectWebSocket('ws://localhost:3000');
};
```

#### 4.5 改造 main.tsx

```typescript
useEffect(() => {
  const initialize = async () => {
    try {
      // 初始化 WebSocket
      await initializeWebSocket();

      // 加载初始数据
      const students = await getStudents();
      setStudents(students);

      // 订阅更新
      const unsubscribe = subscribeToStudentChanges((updatedStudents) => {
        setStudents(updatedStudents);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  };

  const cleanup = initialize();
  return () => {
    cleanup?.then(cb => cb?.());
  };
}, []);
```

#### 4.6 启动大屏端

```bash
npm run dev
```

**预期输出**:
```
  VITE v6.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5174/
  ➜  press h to show help
```

---

### 步骤 5: 测试三端同步 (30分钟)

#### 5.1 三个终端同时运行

```bash
# 终端 1 - 后端
cd /home/devbox/project
node server.js

# 终端 2 - 手机端
cd /home/devbox/project/mobile
npm run dev

# 终端 3 - 大屏端
cd /home/devbox/project/bigscreen
npm run dev
```

#### 5.2 打开浏览器

- 📱 **手机端**: http://localhost:5173
- 📺 **大屏端**: http://localhost:5174

#### 5.3 测试场景

**场景 1: 创建学生**

1. 在手机端首页，点击"添加学生"
2. 输入学生名称，选择班级
3. 点击"保存"
4. 检查大屏端是否立即显示新学生

**预期结果**: ✅ 新学生立即出现在大屏排行榜中

**场景 2: 增加积分**

1. 在手机端首页，选择一个学生
2. 输入积分数值，点击"+5分"按钮
3. 检查大屏端排行榜是否更新

**预期结果**: ✅ 学生排名改变，实时显示在大屏上

**场景 3: 创建挑战**

1. 在手机端"班级管理"页，创建新挑战
2. 选择参与学生，设置奖励
3. 点击"创建"
4. 检查大屏端"挑战区"

**预期结果**: ✅ 新挑战显示在大屏的"挑战竞技场"

**场景 4: 完成任务**

1. 在手机端"班级管理"页，创建任务
2. 分配给学生，设置经验奖励
3. 学生完成后，点击"完成"
4. 检查学生经验和等级是否更新

**预期结果**: ✅ 学生经验增加，等级可能升级

---

## 验证清单

### 数据库验证

- [ ] 13 个表已创建
- [ ] 默认数据已插入
- [ ] 学生数据已更新（avatar_url, team_id 等）
- [ ] 索引已创建

**验证命令**:
```bash
psql postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres \
  -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='public';"
```

### 后端验证

- [ ] Express 服务器启动成功
- [ ] WebSocket 服务可连接
- [ ] `/api/students` 返回学生列表
- [ ] `/api/challenges` 可创建挑战
- [ ] WebSocket 可接收消息

**验证命令**:
```bash
# 检查 API
curl http://localhost:3000/api/students

# 检查 WebSocket
wscat -c ws://localhost:3000
```

### 手机端验证

- [ ] npm 依赖安装成功
- [ ] 开发服务器启动成功
- [ ] 可加载学生列表
- [ ] 可创建学生
- [ ] 可增加/减少积分
- [ ] 浏览器控制台无错误

**验证命令**:
```bash
# 开发服务器应该运行在 http://localhost:5173
# F12 打开开发者工具，检查 Network 和 Console 标签
```

### 大屏端验证

- [ ] npm 依赖安装成功
- [ ] 开发服务器启动成功
- [ ] WebSocket 连接显示"已连接"
- [ ] 可显示排行榜
- [ ] 实时更新工作

**验证命令**:
```bash
# 开发服务器应该运行在 http://localhost:5174
# F12 打开开发者工具，在 Network 标签中查看 WebSocket 连接
```

### 集成验证

- [ ] 手机端 → 数据库 → 大屏端 的完整流程工作
- [ ] 没有延迟明显的时间差
- [ ] 断网重连后数据保持一致
- [ ] 多用户操作不会产生数据冲突

---

## 问题排查

### 数据库连接失败

**症状**: `Error: connect ECONNREFUSED`

**解决**:
1. 检查连接字符串是否正确
2. 检查 Sealos PostgreSQL 是否运行
3. 尝试直接连接数据库

```bash
psql postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres
```

### WebSocket 连接失败

**症状**: 大屏端显示"连接断开"或连接状态为"连接中"

**解决**:
1. 检查后端是否运行
2. 检查 WebSocket 地址是否正确
3. 检查防火墙设置

```bash
# 检查后端是否运行
curl http://localhost:3000/health

# 监听 WebSocket 连接
wscat -c ws://localhost:3000
```

### 手机端 API 调用失败

**症状**: "操作失败" 或空白屏幕

**解决**:
1. 打开浏览器开发者工具 (F12)
2. 查看 Network 标签，检查 API 请求
3. 查看 Console 标签，检查错误信息

```javascript
// 在浏览器控制台测试 API
fetch('http://localhost:3000/api/students')
  .then(r => r.json())
  .then(data => console.log(data))
  .catch(e => console.error(e))
```

### 数据不同步

**症状**: 手机端创建的数据在大屏端看不到

**解决**:
1. 检查数据是否保存到数据库
2. 检查 WebSocket 是否连接
3. 检查大屏端是否正确订阅事件

```sql
-- 检查数据库中的数据
SELECT * FROM students ORDER BY id DESC LIMIT 5;
SELECT * FROM challenges ORDER BY id DESC LIMIT 5;
```

---

## 性能优化

### 后端优化

1. **使用连接池**
   ```javascript
   const pool = new Pool({
     max: 20,                        // 最大连接数
     idleTimeoutMillis: 30000,       // 空闲超时
     connectionTimeoutMillis: 2000   // 连接超时
   });
   ```

2. **添加查询缓存**
   ```javascript
   const studentCache = new Map();
   const CACHE_DURATION = 60000; // 1分钟
   ```

3. **使用索引**
   - 已在 `create-schema.js` 中创建

### 大屏端优化

1. **虚拟滚动**
   - 排行榜可能很长，用虚拟滚动减少 DOM 节点

2. **防抖 WebSocket 消息**
   ```typescript
   const debouncedUpdate = debounce((data) => {
     setStudents(data);
   }, 100);
   ```

3. **内存管理**
   - 定期清理不需要的数据
   - 避免内存泄漏

---

## 部署到生产环境

完成开发测试后:

1. **构建生产版本**
   ```bash
   # 手机端
   cd mobile && npm run build

   # 大屏端
   cd bigscreen && npm run build
   ```

2. **配置生产 API URL**
   ```bash
   # .env.production
   REACT_APP_API_URL=https://your-sealos-api.com/api
   REACT_APP_WS_URL=wss://your-sealos-api.com
   ```

3. **在 Sealos 中部署**
   - 配置 Nginx 或 Apache
   - 配置 HTTPS 证书
   - 配置域名

4. **监控和日志**
   - 设置日志收集
   - 监控 API 响应时间
   - 监控 WebSocket 连接

---

## 总结

| 步骤 | 耗时 | 状态 |
|------|------|------|
| 1️⃣ 创建数据库 | 10分钟 | 待执行 |
| 2️⃣ 扩展后端 | 1-2小时 | 待执行 |
| 3️⃣ 部署手机端 | 1小时 | 待执行 |
| 4️⃣ 部署大屏端 | 1小时 | 待执行 |
| 5️⃣ 测试同步 | 30分钟 | 待执行 |
| **总计** | **4-6小时** | 🚀 准备开始 |

---

## 🚀 立即开始

```bash
# 1. 进入项目目录
cd /home/devbox/project

# 2. 创建数据库 Schema
node create-schema.js

# 3. 查看其他文档
cat CODE_REVIEW_GROWARK.md       # 代码审查
cat IMPLEMENTATION_PLAN.md       # 实施计划
cat QUICK_START.md              # 快速指南
cat CURRENT_STATUS.md           # 当前状态

# 4. 开始部署!
```

祝你部署顺利! 🎉
