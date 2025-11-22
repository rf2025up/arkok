# 🚀 Growark 三端打通实施计划

**项目阶段**: 从代码审查到完整部署
**执行时间**: 今天开始
**目标**: 手机端 ↔ Sealos数据库 ↔ 大屏端 完全同步

---

## 📊 当前状态评估

### ✅ 已有基础

| 组件 | 状态 | 说明 |
|------|------|------|
| **Express 后端** | ✅ 存在 | 在 `/home/devbox/project/server.js` |
| **PostgreSQL 数据库** | ✅ 可连接 | Sealos 内部 PostgreSQL |
| **数据库连接字符串** | ✅ 已配置 | 在 server.js 中硬编码 |
| **基础 API 端点** | ✅ 部分存在 | 学生的 CRUD 基本实现 |
| **分组功能** | ✅ 已实现 | groups 表和 API 已做 |
| **前端展示** | ✅ 存在 | admin.html 和 display.html |

### ❌ 缺失部分

| 功能 | 当前状态 | 需要实现 |
|------|---------|----------|
| **WebSocket 实时推送** | ❌ | 需要添加 ws 库，实现广播 |
| **积分系统** | ⚠️ 简单 | 需要扩展为 exp, level, badges 等 |
| **挑战系统** | ❌ | 需要创建表和 API |
| **PK 比赛系统** | ❌ | 需要创建表和 API |
| **任务系统** | ❌ | 需要创建表和 API |
| **手机端 React** | ❌ | 需要重写连接逻辑 |
| **大屏端 React** | ❌ | 需要重写订阅逻辑 |

### 🔐 Sealos 数据库权限

**现状**:
- ✅ 已有访问权限 (连接字符串存在)
- ✅ 可以创建新表和修改结构
- ✅ 可以创建默认数据

**建议**:
- ✅ 不需要新建数据库，在现有数据库中增加新表
- ✅ 现有 students 表可以保留和扩展

---

## 🏗️ 新的数据库 Schema 设计

### 1. 扩展 Students 表

```sql
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  avatar_url VARCHAR(500),
  points INTEGER DEFAULT 0,
  total_exp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
  class_name VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_team_id ON students(team_id);
CREATE INDEX idx_students_group_id ON students(group_id);
```

### 2. Teams 表

```sql
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#667eea',
  text_color VARCHAR(7) DEFAULT '#00d4ff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 默认团队
INSERT INTO teams (name, color, text_color) VALUES
  ('新星前锋', '#06b6d4', '#00d4ff'),
  ('旋涡毒蛇', '#a855f7', '#c084fc'),
  ('猩红守卫', '#ef4444', '#fca5a5'),
  ('翡翠哨兵', '#10b981', '#6ee7b7')
ON CONFLICT (name) DO NOTHING;
```

### 3. Challenges 表

```sql
CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  result VARCHAR(20),
  challenger_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
  reward_points INTEGER DEFAULT 0,
  reward_exp INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_challenges_status ON challenges(status);
```

### 4. Challenge_Participants 表 (多对多)

```sql
CREATE TABLE IF NOT EXISTS challenge_participants (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(challenge_id, student_id)
);
```

### 5. PKMatches 表

```sql
CREATE TABLE IF NOT EXISTS pk_matches (
  id SERIAL PRIMARY KEY,
  student_a_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_b_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic VARCHAR(200),
  status VARCHAR(20) DEFAULT 'pending',
  winner_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pk_matches_status ON pk_matches(status);
```

### 6. Tasks 表

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  exp_value INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7. Task_Assignments 表 (多对多)

```sql
CREATE TABLE IF NOT EXISTS task_assignments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, student_id)
);
```

### 8. Badges 表

```sql
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(20),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 默认勋章
INSERT INTO badges (name, icon, description) VALUES
  ('学霸之星', '⭐', '学习表现突出'),
  ('挑战先锋', '🛡️', '完成挑战最多'),
  ('阅读达人', '📖', '阅读书籍超过5本'),
  ('全勤奖', '🏃', '本月无缺席'),
  ('小画家', '🎨', '美术课表现优异'),
  ('小小科学家', '💡', '科学实验动手能力强')
ON CONFLICT (name) DO NOTHING;
```

### 9. Student_Badges 表 (多对多)

```sql
CREATE TABLE IF NOT EXISTS student_badges (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, badge_id)
);
```

### 10. Habits 表

```sql
CREATE TABLE IF NOT EXISTS habits (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 默认习惯
INSERT INTO habits (name, icon) VALUES
  ('早起', '🌞'),
  ('阅读', '📖'),
  ('运动', '🏃'),
  ('思考', '💡'),
  ('卫生', '🧹'),
  ('助人', '🤝'),
  ('作业', '📝'),
  ('整理', '🧺'),
  ('礼仪', '🙏'),
  ('守时', '⏰'),
  ('专注', '🎯'),
  ('饮水', '💧'),
  ('午休', '😴'),
  ('阅读笔记', '📚'),
  ('口语练习', '🗣️'),
  ('体育锻炼', '⚽'),
  ('音乐练习', '🎵'),
  ('科学实验', '🔬')
ON CONFLICT (name) DO NOTHING;
```

### 11. Habit_Checkins 表

```sql
CREATE TABLE IF NOT EXISTS habit_checkins (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_habit_checkins_student_date ON habit_checkins(student_id, checked_in_at);
```

### 12. Score_History 表 (审计日志)

```sql
CREATE TABLE IF NOT EXISTS score_history (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  points_delta INTEGER,
  exp_delta INTEGER,
  reason VARCHAR(200),
  category VARCHAR(50),
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_score_history_student ON score_history(student_id);
CREATE INDEX idx_score_history_date ON score_history(created_at);
```

---

## 🔌 后端 API 端点完整清单

### 学生管理

```
GET    /api/students                    - 获取所有学生
GET    /api/students/:id               - 获取单个学生
POST   /api/students                   - 创建学生
PUT    /api/students/:id               - 更新学生
DELETE /api/students/:id               - 删除学生
POST   /api/students/:id/add-points    - 添加积分和经验
```

### 团队管理

```
GET    /api/teams                      - 获取所有团队
POST   /api/teams                      - 创建团队
PUT    /api/teams/:id                  - 更新团队
```

### 挑战管理

```
POST   /api/challenges                 - 创建挑战
GET    /api/challenges                 - 获取所有挑战
PUT    /api/challenges/:id/complete    - 完成挑战
```

### PK 比赛

```
POST   /api/pk-matches                 - 创建 PK
GET    /api/pk-matches                 - 获取 PK 列表
PUT    /api/pk-matches/:id/result      - 提交 PK 结果
```

### 任务管理

```
POST   /api/tasks                      - 创建任务
GET    /api/tasks                      - 获取任务列表
POST   /api/tasks/:id/assign           - 分配任务
POST   /api/tasks/:id/complete         - 完成任务
```

### 勋章系统

```
GET    /api/badges                     - 获取所有勋章
POST   /api/students/:id/badges        - 授予勋章
```

### 习惯打卡

```
GET    /api/habits                     - 获取习惯列表
POST   /api/habits/:id/checkin         - 打卡
GET    /api/habits/stats/:studentId    - 获取习惯统计
```

---

## 🔗 WebSocket 事件设计

### 客户端发送

```javascript
{
  "type": "subscribe",
  "channel": "students" | "challenges" | "pks" | "tasks"
}
```

### 服务器推送事件

```javascript
// 学生积分更新
{
  "type": "student:updated",
  "data": {
    "id": 1,
    "name": "张三",
    "points": 150,
    "total_exp": 600,
    "level": 5
  }
}

// 挑战完成
{
  "type": "challenge:completed",
  "data": {
    "id": "c1",
    "title": "一周阅读挑战",
    "result": "success",
    "participants": [1, 2, 3]
  }
}

// PK 比赛结束
{
  "type": "pk:finished",
  "data": {
    "id": "pk1",
    "winnerId": 1,
    "loserId": 2,
    "studentA": 1,
    "studentB": 2
  }
}

// 任务完成
{
  "type": "task:completed",
  "data": {
    "taskId": "t1",
    "studentId": 1,
    "expAwarded": 100
  }
}

// 勋章授予
{
  "type": "badge:awarded",
  "data": {
    "studentId": 1,
    "badgeId": 1,
    "badgeName": "学霸之星"
  }
}
```

---

## 📝 实施步骤

### **第1步: 创建新的数据库 Schema** (30分钟)

创建文件: `create-schema.js`

这个脚本会:
1. 创建所有新表
2. 建立关系和索引
3. 插入默认数据
4. 验证表结构

### **第2步: 扩展后端 API** (1-2小时)

文件修改:
- `server.js` - 添加 WebSocket 支持
- 创建 `routes/challenges.js`
- 创建 `routes/pk.js`
- 创建 `routes/tasks.js`
- 创建 `routes/badges.js`
- 创建 `routes/habits.js`
- 创建 `routes/scores.js`

功能:
- 所有端点实现
- 事务处理
- 错误处理
- 日志记录

### **第3步: 部署新的手机端** (1-2小时)

目录: `/home/devbox/project/mobile/` (从 /tmp/growark 复制)

改动:
- 创建 `services/api.ts` - API 层
- 改造 `App.tsx` - 连接后端
- 改造所有 handlers - 异步操作
- 添加错误处理

### **第4步: 部署新的大屏端** (1-2小时)

目录: `/home/devbox/project/bigscreen/` (从 /tmp/growark/bigscreen 复制)

改动:
- 创建 `services/websocket.ts`
- 改造 `services/sealosService.ts` - 真实 API
- 改造 `main.tsx` - 订阅逻辑
- 添加实时指示器

### **第5步: 测试** (30分钟)

验证:
- 手机端可以增删学生 ✓
- 数据立即保存到数据库 ✓
- 大屏端实时显示更新 ✓
- WebSocket 连接稳定 ✓

---

## 📋 操作清单

- [ ] 备份当前数据库 (可选)
- [ ] 创建新的 Schema
- [ ] 扩展后端 API
- [ ] 部署手机端
- [ ] 部署大屏端
- [ ] 测试三端同步
- [ ] 优化性能
- [ ] 文档更新

---

## 🎯 最终目标架构

```
┌─────────────────────────────────────────────────────┐
│         Sealos 云平台 (Devbox 环境)                 │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────────┐   │
│  │  Express.js      │◄─►│ PostgreSQL 数据库    │   │
│  │  (Node.js)       │  │ (新 Schema)          │   │
│  │                  │  │                      │   │
│  │  REST API        │  │ - students           │   │
│  │  WebSocket       │  │ - teams              │   │
│  │  (实时推送)      │  │ - challenges         │   │
│  └────────┬─────────┘  │ - pk_matches        │   │
│           │            │ - tasks              │   │
│           │            │ - badges             │   │
│           │            │ - habits             │   │
│           │            │ - score_history      │   │
│           │            └──────────────────────┘   │
└───────────┼──────────────────────────────────────┘
            │
   ┌────────┴─────┬──────────────┐
   │              │              │
   ▼              ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────┐
│手机端  │  │大屏端    │  │管理后台  │
│React   │  │React     │  │(admin)   │
│Vite    │  │Vite      │  │          │
│        │  │          │  │          │
│ HTTP + │  │ HTTP +   │  │ HTTP     │
│Sync    │  │WebSocket │  │          │
│        │  │Sub       │  │          │
└────────┘  └──────────┘  └──────────┘
```

---

## 💡 技术要点

1. **乐观更新**: 手机端先更新 UI，再发送 API，失败时回滚
2. **缓存策略**: 大屏端维护缓存，WebSocket 更新缓存并刷新 UI
3. **错误恢复**: 断网时本地排队，恢复后重试
4. **实时同步**: WebSocket 用于推送，减少轮询
5. **数据完整性**: 操作日志记录，便于审计

---

## ⏱️ 预计总耗时

| 步骤 | 耗时 | 状态 |
|------|------|------|
| 1. 创建 Schema | 30分钟 | 📋 待执行 |
| 2. 扩展后端 | 1-2小时 | 📋 待执行 |
| 3. 手机端部署 | 1-2小时 | 📋 待执行 |
| 4. 大屏端部署 | 1-2小时 | 📋 待执行 |
| 5. 测试验证 | 30分钟 | 📋 待执行 |
| **总计** | **4-6小时** | 🚀 准备开始 |

---

## 📞 下一步

我已经准备好开始实施。请确认:

1. ✅ 是否可以修改 Sealos 数据库表结构？
2. ✅ 新的手机端和大屏端代码是否从 /tmp/growark 使用？
3. ✅ 是否需要保留现有的 students 表中的数据？

**建议操作顺序:**

```bash
# Step 1: 创建新的数据库 Schema
node /home/devbox/project/create-schema.js

# Step 2: 启动后端服务 (已有)
node /home/devbox/project/server.js

# Step 3: 部署手机端
cd /home/devbox/project/mobile && npm install && npm run dev

# Step 4: 部署大屏端
cd /home/devbox/project/bigscreen && npm install && npm run dev
```

准备好了吗? 让我们开始实施吧! 🚀
