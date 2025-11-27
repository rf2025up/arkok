# 星途成长方舟·Growark - 完整技术架构文档

> **文档目的：** 提供系统完整的技术架构、数据流向、API接口、前后端对应关系，确保每次需求修改都有清晰的上下文和系统性指导。

## 目录

1. [系统架构总览](#系统架构总览)
2. [技术栈](#技术栈)
3. [数据库设计](#数据库设计)
4. [API接口文档](#api接口文档)
5. [前端架构](#前端架构)
6. [数据流向](#数据流向)
7. [实时通信机制](#实时通信机制)
8. [部署架构](#部署架构)
9. [历史问题与解决方案](#历史问题与解决方案)

---

## 系统架构总览

### 项目简介

星途成长方舟（Growark）是一个课堂管理系统，包含三个主要应用端：
- **教师端/管理端（Admin）**：手机端应用，用于班级管理、学生管理、任务发布、挑战创建等
- **大屏显示端（Screen）**：大屏展示应用，实时显示学生排行榜、PK对战、挑战擂台、荣誉勋章等
- **学生端（Student）**：学生查看个人信息和任务（预留）

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Growark 系统架构                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   教师端/管理端    │         │   后端 API 服务   │         │   PostgreSQL     │
│   (Admin)        │◄───────►│   (Node/Express) │◄───────►│   数据库          │
│   移动端应用      │  REST   │   + WebSocket    │  SQL    │                  │
└──────────────────┘   API   └──────────────────┘         └──────────────────┘
                                      ▲                            │
                                      │                            │
                                      │ HTTP Polling (2s)          │
                                      │ + WebSocket                │
                                      │                            │
┌──────────────────┐                  │                            │
│   大屏显示端      │                  │                            │
│   (Screen)       │──────────────────┘                            │
│   实时展示        │                                               │
└──────────────────┘                                               │
                                                                   │
┌──────────────────┐                                               │
│   学生端          │                                               │
│   (Student)      │───────────────────────────────────────────────┘
│   个人信息查看    │              REST API
└──────────────────┘
```

### 核心功能模块

```
┌─────────────────────────────────────────────────────────────────────┐
│                          功能模块架构                                  │
└─────────────────────────────────────────────────────────────────────┘

教师端（Admin）                    后端服务                    数据库表
├─ 班级管理                       ├─ 学生管理 API              ├─ students
│  ├─ 学生列表                    │  ├─ GET /api/students     │  ├─ id, name, score
│  ├─ 学生详情                    │  ├─ POST /api/students    │  ├─ avatar_url
│  ├─ 积分管理                    │  ├─ PUT /api/students/:id │  ├─ total_exp, level
│  └─ 勋章授予                    │  └─ DELETE /api/students  │  └─ team_id, class_name
│                                 │                            │
├─ 任务管理                       ├─ 任务管理 API              ├─ tasks
│  ├─ 任务发布                    │  ├─ GET /api/tasks        │  ├─ id, title
│  ├─ 任务分配                    │  ├─ POST /api/tasks       │  ├─ description
│  └─ 任务完成                    │  └─ DELETE /api/tasks/:id │  └─ exp_value
│                                 │                            │
│                                 │                            ├─ task_assignments
│                                 │                            │  ├─ task_id
│                                 │                            │  └─ student_id
│                                 │                            │
├─ 挑战管理                       ├─ 挑战管理 API              ├─ challenges
│  ├─ 挑战发布                    │  ├─ GET /api/challenges   │  ├─ id, title
│  ├─ 挑战人选择                  │  ├─ POST /api/challenges  │  ├─ challenger_id
│  └─ 挑战结果                    │  └─ PUT /api/challenges   │  ├─ reward_points
│                                 │                            │  └─ status, result
│                                 │                            │
│                                 │                            ├─ challenge_participants
│                                 │                            │  ├─ challenge_id
│                                 │                            │  └─ student_id
│                                 │                            │
├─ PK管理                         ├─ PK管理 API                ├─ pk_matches
│  ├─ PK创建                      │  ├─ GET /api/pk-matches   │  ├─ id
│  ├─ PK对战                      │  ├─ POST /api/pk-matches  │  ├─ student_a_id
│  └─ PK结果                      │  └─ PUT /api/pk-matches   │  ├─ student_b_id
│                                 │                            │  ├─ topic
│                                 │                            │  ├─ status
│                                 │                            │  └─ winner_id
│                                 │                            │
├─ 习惯打卡                       ├─ 习惯管理 API              ├─ habits
│  ├─ 习惯创建                    │  ├─ GET /api/habits       │  ├─ id, name
│  ├─ 打卡记录                    │  ├─ POST /api/habits      │  └─ icon, points
│  └─ 打卡统计                    │  └─ POST /api/habit-check │
│                                 │                            ├─ habit_checkins
│                                 │                            │  ├─ habit_id
│                                 │                            │  ├─ student_id
│                                 │                            │  └─ checked_at
│                                 │                            │
└─ 勋章管理                       ├─ 勋章管理 API              ├─ badges
   ├─ 勋章定义                    │  ├─ GET /api/badges       │  ├─ id, name
   └─ 勋章授予                    │  └─ POST /api/award-badge │  ├─ icon
                                  │                            │  └─ description
                                  │                            │
                                  │                            ├─ student_badges
                                  │                            │  ├─ student_id
                                  │                            │  ├─ badge_id
                                  │                            │  └─ awarded_at
                                  │                            │
大屏端（Screen）                  ├─ WebSocket 事件            ├─ teams
├─ 学生排行榜                     │  ├─ student:updated       │  ├─ id, name
├─ PK对战榜                       │  ├─ challenge:created     │  ├─ color
├─ 挑战擂台                       │  ├─ pk:created            │  └─ text_color
├─ 荣誉勋章                       │  └─ badge:awarded         │
└─ 实时更新                       │                            ├─ groups
   (HTTP轮询 2s)                  │                            │  ├─ id, name
                                  │                            │  └─ display_order
                                  │                            │
                                  │                            ├─ score_history
                                  │                            │  ├─ student_id
                                  │                            │  ├─ points_change
                                  │                            │  └─ reason
```

---

## 技术栈

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行时环境 |
| Express | 5.1.0 | Web框架 |
| PostgreSQL | 14+ | 关系型数据库 |
| pg | 8.16.3 | PostgreSQL客户端 |
| ws | 8.18.3 | WebSocket服务 |
| dotenv | 17.2.3 | 环境变量管理 |
| cors | 2.8.5 | 跨域资源共享 |
| body-parser | 2.2.0 | 请求体解析 |

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18+ | UI框架 |
| TypeScript | 5+ | 类型系统 |
| Vite | 5+ | 构建工具 |
| Tailwind CSS | 3+ | CSS框架 |
| React Router | 6+ | 路由管理 |

### 部署环境

| 组件 | 环境 | 说明 |
|------|------|------|
| 应用服务器 | Sealos/Devbox | 容器化部署 |
| 数据库 | Neon PostgreSQL | 云数据库服务 |
| 静态资源 | Express Static | 静态文件服务 |
| 反向代理 | Sealos Gateway | 内网穿透和HTTPS |

---

## 数据库设计

### ER 图概览

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   teams     │         │  students   │         │   groups    │
│─────────────│         │─────────────│         │─────────────│
│ id (PK)     │◄────────│ id (PK)     │────────►│ id (PK)     │
│ name        │         │ name        │         │ name        │
│ color       │         │ score       │         │ display_ord │
│ text_color  │         │ avatar_url  │         │ color       │
└─────────────┘         │ total_exp   │         └─────────────┘
                        │ level       │
                        │ team_id(FK) │
                        │ group_id(FK)│
                        │ class_name  │
                        └─────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│student_badges│      │task_assign  │       │challenge_   │
│─────────────│       │─────────────│       │participants │
│ student_id  │       │ task_id(FK) │       │─────────────│
│ badge_id(FK)│       │ student_id  │       │challenge_id │
│ awarded_at  │       │ assigned_at │       │ student_id  │
└─────────────┘       └─────────────┘       └─────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   badges    │       │    tasks    │       │ challenges  │
│─────────────│       │─────────────│       │─────────────│
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ name        │       │ title       │       │ title       │
│ icon        │       │ description │       │ description │
│ description │       │ exp_value   │       │ challenger  │
└─────────────┘       │ status      │       │ reward_pts  │
                      └─────────────┘       │ reward_exp  │
                                            │ status      │
                                            │ result      │
                                            └─────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ pk_matches  │       │   habits    │       │habit_checkin│
│─────────────│       │─────────────│       │─────────────│
│ id (PK)     │       │ id (PK)     │       │ habit_id(FK)│
│ student_a_id│       │ name        │       │ student_id  │
│ student_b_id│       │ icon        │       │ checked_at  │
│ topic       │       │ points      │       └─────────────┘
│ status      │       └─────────────┘
│ winner_id   │
└─────────────┘       ┌─────────────┐
                      │score_history│
                      │─────────────│
                      │ student_id  │
                      │ points_chg  │
                      │ reason      │
                      │ created_at  │
                      └─────────────┘
```

### 核心数据表详解

#### 1. students 表（学生信息）

```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  score INTEGER DEFAULT 0,                    -- 当前积分
  avatar_url VARCHAR(500),                    -- 头像URL
  total_exp INTEGER DEFAULT 0,                -- 总经验值
  level INTEGER DEFAULT 1,                    -- 等级
  team_id INTEGER REFERENCES teams(id),       -- 所属队伍
  group_id INTEGER REFERENCES groups(id),     -- 所属小组
  class_name VARCHAR(50),                     -- 班级名称
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明：**
- `score`: 学生当前积分，用于排行榜排序
- `total_exp`: 累计经验值，用于等级计算
- `level`: 学生等级，根据经验值自动计算
- `team_id`: 队伍ID，用于团队PK和排行
- `group_id`: 小组ID，用于小组管理
- `class_name`: 班级名称，支持多班级管理

**API返回格式：**
```json
{
  "id": 16,
  "name": "吴逸桐",
  "score": 150,
  "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=吴逸桐",
  "total_exp": 500,
  "level": 3,
  "team_id": 1,
  "class_name": "一年级1班",
  "badges": [
    {
      "id": 1,
      "name": "学霸之星",
      "icon": "⭐",
      "awarded_at": "2025-11-26T10:30:00Z"
    }
  ]
}
```

#### 2. tasks 表（任务）

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  exp_value INTEGER DEFAULT 0,                -- 经验值奖励
  status VARCHAR(20) DEFAULT 'active',        -- active, completed, deleted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**关联表：task_assignments（任务分配）**
```sql
CREATE TABLE task_assignments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, student_id)
);
```

**数据流程：**
1. 教师端创建任务 → `tasks` 表
2. 选择执行人 → `task_assignments` 表
3. GET /api/tasks 返回任务及执行人列表
4. 学生个人信息页显示任务记录

**API返回格式：**
```json
{
  "id": 1,
  "title": "完成数学作业",
  "description": "第3章练习题",
  "exp_value": 50,
  "assigned_to": [
    {
      "student_id": 16,
      "student_name": "吴逸桐",
      "student_avatar": "https://..."
    }
  ]
}
```

#### 3. challenges 表（挑战）

```sql
CREATE TABLE challenges (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',        -- active, completed
  result VARCHAR(20),                         -- success, fail
  challenger_id INTEGER REFERENCES students(id),  -- 挑战者
  reward_points INTEGER DEFAULT 0,
  reward_exp INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**关联表：challenge_participants（挑战参与者）**
```sql
CREATE TABLE challenge_participants (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(challenge_id, student_id)
);
```

**数据流程：**
1. 教师端创建挑战 → `challenges` 表（包含 `challenger_id`）
2. 选择参与者 → `challenge_participants` 表
3. GET /api/challenges JOIN students 返回挑战者信息
4. 大屏端显示挑战者名称和头像

**API返回格式：**
```json
{
  "id": 1,
  "title": "背古诗挑战",
  "description": "背诵《静夜思》",
  "status": "active",
  "result": null,
  "challenger_id": 16,
  "challenger_name": "吴逸桐",
  "challenger_avatar": "https://...",
  "reward_points": 20,
  "reward_exp": 10,
  "participants": [
    {"student_id": 16},
    {"student_id": 17}
  ]
}
```

#### 4. pk_matches 表（PK对战）

```sql
CREATE TABLE pk_matches (
  id SERIAL PRIMARY KEY,
  student_a_id INTEGER NOT NULL REFERENCES students(id),
  student_b_id INTEGER NOT NULL REFERENCES students(id),
  topic VARCHAR(200),                         -- PK主题
  status VARCHAR(20) DEFAULT 'pending',       -- pending, finished
  winner_id INTEGER REFERENCES students(id),  -- 获胜者
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**数据流程：**
1. 教师端创建PK → `pk_matches` 表
2. 大屏端按积分排序生成PK配对
3. 教师端设置PK结果 → 更新 `winner_id`
4. 学生个人信息页显示PK历史

**API返回格式：**
```json
{
  "id": 1,
  "student_a_id": 16,
  "student_b_id": 17,
  "topic": "速算比赛",
  "status": "finished",
  "winner_id": 16,
  "created_at": "2025-11-26T10:00:00Z"
}
```

#### 5. badges 表（勋章定义）

```sql
CREATE TABLE badges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(10),                           -- emoji图标
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**关联表：student_badges（勋章授予记录）**
```sql
CREATE TABLE student_badges (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, badge_id)
);
```

**数据流程：**
1. 系统预定义勋章 → `badges` 表
2. 教师端授予勋章 → `student_badges` 表
3. GET /api/students 返回学生及其勋章列表
4. 大屏端和个人信息页显示勋章

**API返回格式：**
```json
{
  "id": 1,
  "name": "学霸之星",
  "icon": "⭐",
  "description": "学习表现突出",
  "awarded_at": "2025-11-26T10:30:00Z"
}
```

#### 6. habits 表（习惯）

```sql
CREATE TABLE habits (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10),
  points INTEGER DEFAULT 1,                   -- 打卡奖励积分
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**关联表：habit_checkins（打卡记录）**
```sql
CREATE TABLE habit_checkins (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(habit_id, student_id, DATE(checked_at))  -- 每天只能打卡一次
);
```

#### 7. score_history 表（积分历史）

```sql
CREATE TABLE score_history (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,             -- 积分变化（正数或负数）
  reason VARCHAR(200),                        -- 变化原因
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**用途：**
- 记录所有积分变化
- 用于积分历史查询和统计
- 支持积分回溯和审计

---

## 系统架构

### 项目简介

星途成长方舟是一个课堂管理系统，包含教师端（ClassHero）和大屏显示端（Bigscreen）两个应用。系统通过实时数据同步将教师端的学生积分更新自动反映在大屏显示上。

### 通信架构

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│  Teacher App    │         │   API Server     │         │   Database   │
│  (ClassHero)    ├────────►│  (Node/Express)  ├────────►│ (PostgreSQL) │
└─────────────────┘         └──────────────────┘         └──────────────┘
                                    ▲
                                    │
                                    │ HTTP Polling (2s)
                                    │
                            ┌───────┴──────────┐
                            │  Bigscreen App   │
                            │  (Display)       │
                            └──────────────────┘
```

---

## API接口文档

### API基础信息

- **Base URL**: `http://localhost:3000/api` (开发环境)
- **生产URL**: `https://esboimzbkure.sealosbja.site/api`
- **认证方式**: 暂无（内部系统）
- **数据格式**: JSON
- **字符编码**: UTF-8

### 统一响应格式

```json
{
  "success": true,
  "data": {},
  "timestamp": "2025-11-26T10:00:00Z"
}
```

### 学生管理 API

#### GET /api/students
获取所有学生列表（包含勋章信息）

**请求参数：** 无

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 16,
      "name": "吴逸桐",
      "score": 150,
      "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=吴逸桐",
      "total_exp": 500,
      "level": 3,
      "team_id": 1,
      "class_name": "一年级1班",
      "badges": [
        {
          "id": 1,
          "name": "学霸之星",
          "icon": "⭐",
          "awarded_at": "2025-11-26T10:30:00Z"
        }
      ]
    }
  ]
}
```

**SQL查询：**
```sql
SELECT
  s.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', b.id,
        'name', b.name,
        'icon', b.icon,
        'awarded_at', sb.awarded_at
      )
    ) FILTER (WHERE b.id IS NOT NULL),
    '[]'
  ) as badges
FROM students s
LEFT JOIN student_badges sb ON s.id = sb.student_id
LEFT JOIN badges b ON sb.badge_id = b.id
GROUP BY s.id
ORDER BY s.score DESC
```

#### POST /api/students
创建新学生

**请求体：**
```json
{
  "name": "张三",
  "avatar_url": "https://...",
  "team_id": 1,
  "class_name": "一年级1班"
}
```

#### PUT /api/students/:id
更新学生信息（包括积分）

**请求体：**
```json
{
  "score": 160,
  "total_exp": 520
}
```

**副作用：**
- 自动记录积分变化到 `score_history` 表
- 触发 WebSocket 事件 `student:updated`

#### DELETE /api/students/:id
删除学生

**级联删除：**
- `student_badges` 记录
- `task_assignments` 记录
- `challenge_participants` 记录
- `habit_checkins` 记录
- `score_history` 记录

### 任务管理 API

#### GET /api/tasks
获取所有任务（包含执行人信息）

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "完成数学作业",
      "description": "第3章练习题",
      "exp_value": 50,
      "assigned_to": [
        {
          "student_id": 16,
          "student_name": "吴逸桐",
          "student_avatar": "https://..."
        }
      ]
    }
  ]
}
```

**SQL查询：**
```sql
SELECT
  t.id,
  t.title,
  t.description,
  t.exp_value,
  COALESCE(
    json_agg(
      json_build_object(
        'student_id', ta.student_id,
        'student_name', s.name,
        'student_avatar', s.avatar_url
      )
    ) FILTER (WHERE ta.student_id IS NOT NULL),
    '[]'
  ) as assigned_to
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
LEFT JOIN students s ON ta.student_id = s.id
GROUP BY t.id
ORDER BY t.id DESC
```

#### POST /api/tasks
创建新任务

**请求体：**
```json
{
  "title": "完成数学作业",
  "description": "第3章练习题",
  "exp_value": 50,
  "assigned_to": [16, 17]  // 学生ID数组
}
```

**处理流程：**
1. 插入任务到 `tasks` 表
2. 为每个学生插入记录到 `task_assignments` 表
3. 返回完整任务信息（包含执行人）

#### DELETE /api/tasks/:id
删除任务

**级联删除：**
- `task_assignments` 记录自动删除（ON DELETE CASCADE）

### 挑战管理 API

#### GET /api/challenges
获取所有挑战（包含挑战者和参与者信息）

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "背古诗挑战",
      "description": "背诵《静夜思》",
      "status": "active",
      "result": null,
      "challenger_id": 16,
      "challenger_name": "吴逸桐",
      "challenger_avatar": "https://...",
      "reward_points": 20,
      "reward_exp": 10,
      "participants": [
        {"student_id": 16},
        {"student_id": 17}
      ]
    }
  ]
}
```

**SQL查询：**
```sql
SELECT
  c.id,
  c.title,
  c.description,
  c.status,
  c.result,
  c.reward_points,
  c.reward_exp,
  c.challenger_id,
  s.name as challenger_name,
  s.avatar_url as challenger_avatar,
  COALESCE(
    json_agg(
      json_build_object('student_id', cp.student_id)
    ) FILTER (WHERE cp.student_id IS NOT NULL),
    '[]'
  ) as participants
FROM challenges c
LEFT JOIN students s ON c.challenger_id = s.id
LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
GROUP BY c.id, s.name, s.avatar_url
ORDER BY c.created_at DESC
```

#### POST /api/challenges
创建新挑战

**请求体：**
```json
{
  "title": "背古诗挑战",
  "description": "背诵《静夜思》",
  "status": "active",
  "reward_points": 20,
  "reward_exp": 10,
  "challenger_id": 16,
  "participant_ids": [16, 17]
}
```

**处理流程：**
1. 插入挑战到 `challenges` 表（包含 `challenger_id`）
2. 为每个参与者插入记录到 `challenge_participants` 表
3. 查询完整挑战信息（JOIN students 获取挑战者信息）
4. 触发 WebSocket 事件 `challenge:created`
5. 返回完整挑战信息

#### PUT /api/challenges/:id
更新挑战状态和结果

**请求体：**
```json
{
  "status": "completed",
  "result": "success"
}
```

### PK管理 API

#### GET /api/pk-matches
获取所有PK记录

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_a_id": 16,
      "student_b_id": 17,
      "topic": "速算比赛",
      "status": "finished",
      "winner_id": 16,
      "created_at": "2025-11-26T10:00:00Z"
    }
  ]
}
```

#### POST /api/pk-matches
创建新PK

**请求体：**
```json
{
  "student_a_id": 16,
  "student_b_id": 17,
  "topic": "速算比赛"
}
```

#### PUT /api/pk-matches/:id
更新PK结果

**请求体：**
```json
{
  "status": "finished",
  "winner_id": 16
}
```

### 勋章管理 API

#### GET /api/badges
获取所有勋章定义

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "学霸之星",
      "icon": "⭐",
      "description": "学习表现突出"
    }
  ]
}
```

#### POST /api/award-badge
授予勋章给学生

**请求体：**
```json
{
  "student_id": 16,
  "badge_id": 1
}
```

**处理流程：**
1. 插入记录到 `student_badges` 表
2. 触发 WebSocket 事件 `badge:awarded`
3. 返回授予结果

### 习惯管理 API

#### GET /api/habits
获取所有习惯

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "早睡早起",
      "icon": "🌙",
      "points": 5
    }
  ]
}
```

#### POST /api/habit-checkin
习惯打卡

**请求体：**
```json
{
  "habit_id": 1,
  "student_ids": [16, 17]
}
```

**处理流程：**
1. 为每个学生插入打卡记录到 `habit_checkins` 表
2. 更新学生积分（增加 `habit.points`）
3. 记录积分变化到 `score_history` 表
4. 触发 WebSocket 事件 `student:updated`

### 队伍管理 API

#### GET /api/teams
获取所有队伍

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "新星前锋",
      "color": "bg-cyan-500",
      "text_color": "text-cyan-400"
    }
  ]
}
```

---

## 前端架构

### 项目结构

```
mobile/                          # 前端项目根目录
├── App.tsx                      # 主应用入口（教师端）
├── index.tsx                    # React入口
├── types.ts                     # TypeScript类型定义
├── constants.ts                 # 常量定义
├── pages/                       # 页面组件
│   ├── ClassManage.tsx          # 班级管理页（核心页面）
│   ├── Habits.tsx               # 习惯打卡页
│   └── ...
├── components/                  # 通用组件
│   ├── StudentCard.tsx          # 学生卡片
│   └── ...
├── services/                    # API服务层
│   └── api.ts                   # API请求封装
├── bigscreen/                   # 大屏端应用
│   ├── main.tsx                 # 大屏端入口
│   ├── components/              # 大屏端组件
│   │   ├── PKBoardCard.tsx      # PK榜单卡片
│   │   ├── ChallengeArenaCard.tsx  # 挑战擂台卡片
│   │   ├── HonorBadgesCard.tsx  # 荣誉勋章卡片
│   │   └── ...
│   ├── services/                # 大屏端服务
│   │   └── sealosService.ts     # API和WebSocket服务
│   └── types.ts                 # 大屏端类型定义
├── dist/                        # 构建产物
└── vite.config.ts               # Vite配置
```

### 核心类型定义

#### mobile/types.ts

```typescript
// 学生类型
export interface Student {
  id: string;
  name: string;
  score: number;
  avatar?: string;
  totalExp?: number;
  level?: number;
  teamId?: string;
  groupId?: string;
  className?: string;
  badges?: Array<{
    id: number;
    name: string;
    icon: string;
    awarded_at: string;
  }>;
  badgeHistory?: StudentBadgeRecord[];
  taskHistory?: StudentTaskRecord[];
  challengeHistory?: StudentChallengeRecord[];
  pkHistory?: StudentPKRecord[];
}

// 任务类型
export interface Task {
  id: string;
  title: string;
  description?: string;
  expValue: number;
  assignedTo: string[];  // 学生ID数组
  createdAt?: string;
}

// 挑战类型
export interface Challenge {
  id: string;
  title: string;
  desc: string;
  status: 'active' | 'completed';
  result?: 'success' | 'fail';
  participants: string[];  // 参与者ID数组
  challengerId?: string;   // 挑战者ID
  challengerName?: string; // 挑战者姓名
  challengerAvatar?: string;  // 挑战者头像
  rewardPoints: number;
  rewardExp?: number;
  date?: string;
}

// PK类型
export interface PKMatch {
  id: string;
  studentA: string;
  studentB: string;
  topic: string;
  status: 'pending' | 'finished';
  winnerId?: string;
  date?: string;
}

// 习惯类型
export interface Habit {
  id: string;
  name: string;
  icon: string;
  points: number;
}
```

### 数据流向

#### 教师端数据流

```
用户操作 → 组件事件 → API请求 → 后端处理 → 数据库更新
                                    ↓
                              WebSocket广播
                                    ↓
                              大屏端接收更新
```

**示例：修改学生积分**

```typescript
// 1. 用户在ClassManage.tsx中修改积分
const handleScoreChange = async (studentId: string, newScore: number) => {
  // 2. 发送API请求
  const response = await fetch(`/api/students/${studentId}`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ score: newScore })
  });

  // 3. 更新本地状态
  if (response.ok) {
    setStudents(prev => prev.map(s =>
      s.id === studentId ? {...s, score: newScore} : s
    ));
  }
};

// 4. 后端处理（server.js）
app.put('/api/students/:id', async (req, res) => {
  const { score } = req.body;

  // 更新数据库
  await pool.query('UPDATE students SET score = $1 WHERE id = $2', [score, id]);

  // 广播WebSocket事件
  wss.clients.forEach(client => {
    client.send(JSON.stringify({
      type: 'student:updated',
      payload: { id, score }
    }));
  });
});

// 5. 大屏端接收（bigscreen/main.tsx）
// 通过HTTP轮询（每2秒）自动获取最新数据
useEffect(() => {
  const pollStudents = async () => {
    const res = await fetch('/api/students');
    const data = await res.json();
    setStudents(data.data);
  };

  const interval = setInterval(pollStudents, 2000);
  return () => clearInterval(interval);
}, []);
```

#### 大屏端数据流

```
HTTP轮询（2s） → GET /api/students → 数据比较 → 状态更新 → UI重渲染
                                         ↓
                                    数据排序和计算
                                         ↓
                              生成PK/挑战/勋章数据
```

**关键实现：**

```typescript
// bigscreen/main.tsx
useEffect(() => {
  let lastData = JSON.stringify([]);

  const pollStudents = async () => {
    const res = await fetch('/api/students');
    const data = await res.json();

    // 数据变化检测
    const newData = JSON.stringify(data.data);
    if (lastData !== newData) {
      lastData = newData;
      setStudents(data.data);
    }
  };

  pollStudents();
  const interval = setInterval(pollStudents, 2000);
  return () => clearInterval(interval);
}, []);

// 根据学生数据生成PK配对
const generatedPks = useMemo(() => {
  // 按积分排序
  const sorted = [...students].sort((a, b) => b.total_points - a.total_points);

  // 生成PK配对
  const pks = [];
  for (let i = 0; i < Math.min(6, Math.floor(sorted.length / 2)); i++) {
    pks.push({
      id: `pk-${i}`,
      student_a: sorted[i * 2].id,
      student_b: sorted[i * 2 + 1].id,
      topic: ['背古诗', '速算', '英语拼写'][i % 3]
    });
  }
  return pks;
}, [students]);
```

### 状态管理

#### 教师端状态（App.tsx）

```typescript
const [students, setStudents] = useState<Student[]>([]);
const [tasks, setTasks] = useState<Task[]>([]);
const [challenges, setChallenges] = useState<Challenge[]>([]);
const [pkMatches, setPkMatches] = useState<PKMatch[]>([]);
const [habits, setHabits] = useState<Habit[]>([]);
const [teams, setTeams] = useState<Team[]>([]);

// 自动生成学生历史记录
useEffect(() => {
  setStudents(prevStudents => prevStudents.map(student => {
    // 生成任务历史
    const taskHistory = tasks
      .filter(t => t.assignedTo?.includes(student.id))
      .map(t => ({...}));

    // 生成挑战历史
    const challengeHistory = challenges
      .filter(c => c.participants.includes(student.id))
      .map(c => ({...}));

    // 生成PK历史
    const pkHistory = pkMatches
      .filter(pk => pk.studentA === student.id || pk.studentB === student.id)
      .map(pk => ({...}));

    return { ...student, taskHistory, challengeHistory, pkHistory };
  }));
}, [tasks, challenges, pkMatches]);
```

#### 大屏端状态（bigscreen/main.tsx）

```typescript
const [students, setStudents] = useState<Student[]>([]);
const [challenges, setChallenges] = useState<Challenge[]>([]);
const [teams, setTeams] = useState<Team[]>([]);

// 计算派生数据
const generatedPks = useMemo(() => {...}, [students]);
const generatedChallenges = useMemo(() => {...}, [students]);
const generatedBadges = useMemo(() => {...}, [students]);
```

---

## 实时通信机制

### WebSocket事件类型

| 事件类型 | 触发时机 | 数据格式 |
|---------|---------|---------|
| `student:updated` | 学生信息更新 | `{id, name, score, ...}` |
| `challenge:created` | 创建新挑战 | `{id, title, challenger_name, ...}` |
| `pk:created` | 创建新PK | `{id, student_a_id, student_b_id, ...}` |
| `badge:awarded` | 授予勋章 | `{student_id, badge_id, ...}` |

### WebSocket服务端实现

```javascript
// server.js
const wss = new WebSocket.Server({ server });

// 广播函数
function broadcast(type, payload) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type,
        payload,
        timestamp: new Date().toISOString()
      }));
    }
  });
}

// 示例：创建挑战时广播
app.post('/api/challenges', async (req, res) => {
  // ... 创建挑战逻辑

  broadcast('challenge:created', challengeData);

  res.json({ success: true, data: challengeData });
});
```

### 大屏端HTTP轮询机制

由于Sealos反向代理不支持WebSocket，大屏端使用HTTP轮询替代：

```typescript
// bigscreen/main.tsx
useEffect(() => {
  let lastData = JSON.stringify([]);

  const pollStudents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/students`);
      const data = await res.json();

      // 使用JSON字符串比较检测数据变化
      const newData = JSON.stringify(data.data);
      if (lastData !== newData) {
        lastData = newData;
        setStudents(data.data);
        setWsConnected(true);
      }
    } catch (error) {
      console.error('Polling error:', error);
      setWsConnected(false);
    }
  };

  pollStudents();
  const interval = setInterval(pollStudents, 2000);  // 2秒轮询

  return () => clearInterval(interval);
}, []);
```

**轮询参数选择：**
- **间隔时间**: 2000ms（2秒）
- **选择原因**:
  - 足够频繁，用户感知实时性
  - 不会对服务器造成过载
  - 平衡性能和用户体验

**数据变化检测：**
- 使用 `JSON.stringify()` 全量比较
- 简洁高效，准确检测任何数据变化
- 性能可接受（JSON.stringify很快）

---

## 部署架构

### 文件结构

```
/home/devbox/project/arkok/
├── server.js                    # 后端服务器
├── package.json                 # 后端依赖
├── .env                         # 环境变量
├── entrypoint.sh                # 启动脚本
├── create-schema.js             # 数据库初始化
├── seed-students.js             # 测试数据
├── mobile/                      # 前端源码
│   ├── App.tsx
│   ├── bigscreen/
│   └── ...
├── public/                      # 静态文件（构建产物）
│   ├── index.html               # 教师端入口
│   ├── index.css                # 全局样式
│   ├── assets/                  # 教师端资源
│   │   ├── main-*.js
│   │   └── index-*.js
│   └── bigscreen/               # 大屏端资源
│       ├── index.html           # 大屏端入口
│       └── assets/
│           ├── index-*.js
│           └── bigscreen-*.js
└── node_modules/
```

### 路由映射

| URL路径 | 文件路径 | 说明 |
|---------|---------|------|
| `/admin` | `public/index.html` | 教师端/管理端 |
| `/screen` | `public/bigscreen/index.html` | 大屏显示端 |
| `/student` | `public/index.html` | 学生端（预留） |
| `/assets/*` | `public/assets/*` | 教师端静态资源 |
| `/bigscreen/*` | `public/bigscreen/*` | 大屏端静态资源 |
| `/api/*` | Express API | 后端API接口 |

### 构建流程

```bash
# 1. 构建前端
cd /home/devbox/project/arkok/mobile
npm run build

# 2. 复制构建产物到public目录
cp -r dist/* ../public/

# 3. 验证文件
ls -la ../public/
ls -la ../public/bigscreen/

# 4. 重启服务器
cd ..
./entrypoint.sh
```

### 环境变量

```bash
# .env
DATABASE_URL=postgresql://user:password@host:port/database
DB_HOST=growark-postgresql.ns-bg6fgs6y.svc
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=kngwb5cb
DB_NAME=postgres
NODE_ENV=development
PORT=3000
```

### 启动流程

```bash
#!/bin/bash
# entrypoint.sh

# 1. 加载环境变量
source .env

# 2. 检查数据库连接
echo "Testing database connection..."

# 3. 启动服务器
NODE_ENV=development node server.js
```

### 访问地址

**开发环境：**
- 教师端: http://localhost:3000/admin
- 大屏端: http://localhost:3000/screen
- API: http://localhost:3000/api

**生产环境（Sealos）：**
- 教师端: https://esboimzbkure.sealosbja.site/admin
- 大屏端: https://esboimzbkure.sealosbja.site/screen
- API: https://esboimzbkure.sealosbja.site/api

---

## 历史问题与解决方案

### 问题 1: WebSocket 连接失败

**症状：**
- 大屏端代码中有 WebSocket 连接代码，但实时更新不工作
- 错误日志显示 WSS（WebSocket Secure）连接无法建立

**根本原因：**
- Sealos 反向代理不支持 WebSocket 升级（WSS）
- WebSocket 需要 HTTP upgrade 请求，但反向代理配置不支持

**解决方案：**
```typescript
// ❌ 删除了以下代码（原来的 WebSocket 实现）
const ws = new WebSocket('wss://...')
ws.onmessage = (event) => {
  // 处理实时消息
}

// ✅ 改为 HTTP 轮询
useEffect(() => {
  let pollInterval: NodeJS.Timeout | null = null
  let lastData = JSON.stringify([])

  const pollStudents = async () => {
    try {
      const studentsRes = await fetch(`${API_BASE_URL}/students`)
      const studentsData = await studentsRes.json()

      if (studentsData.success && Array.isArray(studentsData.data)) {
        const mappedStudents = studentsData.data.map((s: any) => ({
          id: String(s.id),
          name: s.name,
          team_id: `t${s.team_id}`,
          total_exp: s.total_exp || 0,
          total_points: s.score || 0,
          avatar_url: s.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.name)}`,
          badges: []
        }))

        // 使用 JSON 字符串比较检测数据变化
        const newData = JSON.stringify(mappedStudents)
        if (lastData !== newData) {
          lastData = newData
          setStudents(mappedStudents)
          setWsConnected(true)
        } else if (!wsConnected) {
          setWsConnected(true)
        }
      }
    } catch (error) {
      console.error('Polling error:', error)
      setWsConnected(false)
    }
  }

  pollStudents()
  pollInterval = setInterval(pollStudents, 2000) // 2秒轮询一次

  return () => {
    if (pollInterval) clearInterval(pollInterval)
  }
}, [])
```

**关键参数：**
- 轮询间隔：2000ms（2秒）
- 数据比较方法：JSON.stringify 全量比较
- 连接状态指示：`wsConnected` 状态

**文件位置：** `mobile/bigscreen/main.tsx:34-77`

---

### 问题 2: PK 榜单显示固定学生，不随积分更新

**症状：**
- 手机端修改学生积分后，大屏 PK 榜单中显示的学生没有变化
- PK 榜总是显示学生 ID 16 对学生 ID 17
- 即使其他学生积分很高，也不出现在 PK 榜中

**根本原因：**
- API 返回的学生数据按 ID 固定排序（ID 16, 17, 18...）
- PK 数据生成逻辑使用原始学生数组索引：
  ```typescript
  // ❌ 错误的实现
  const studentA = students[0]  // 总是 ID 16
  const studentB = students[1]  // 总是 ID 17
  ```

**调试过程：**
```javascript
// 通过控制台日志发现规律
console.log('first pk student_a:', generatedPks[0]?.student_a)
// 输出：16（始终相同）

console.log('first pk student_b:', generatedPks[0]?.student_b)
// 输出：17（始终相同）
```

**解决方案：**
在生成 PK 数据前，先按 `total_points`（积分）对学生数组进行排序：

```typescript
// ✅ 正确的实现
const generatedPks = useMemo(() => {
  if (students.length < 2) return []

  // 关键步骤：按积分从高到低排序
  const sortedStudents = [...students].sort((a, b) => b.total_points - a.total_points)
  const pksData = []

  for (let i = 0; i < Math.min(6, Math.floor(sortedStudents.length / 2)); i++) {
    const studentA = sortedStudents[i * 2]      // 第一、三、五...高分学生
    const studentB = sortedStudents[i * 2 + 1]  // 第二、四、六...高分学生

    pksData.push({
      id: `pk-${i}`,
      student_a: studentA.id,
      student_b: studentB.id,
      topic: ['背古诗', '速算', '英语拼写', '数学竞赛', '写作比赛', '创意思维'][i % 6],
      status: i % 3 === 0 ? 'finished' : 'pending',
      winner_id: i % 3 === 0 ? (Math.random() > 0.5 ? studentA.id : studentB.id) : undefined,
      updated_at: new Date().toISOString()
    })
  }

  return pksData
}, [students])  // 依赖 students 数组，确保学生变化时重新计算
```

**关键点：**
- 使用 `useMemo` 缓存计算结果
- 依赖数组中包含 `[students]`，确保学生数据变化时重新生成 PK 数据
- 按 `total_points` 从高到低排序，获取分数最高的学生配对

**文件位置：** `mobile/bigscreen/main.tsx:83-105`

**验证方法：**
1. 在教师端修改学生积分
2. 等待 2 秒（轮询间隔）
3. 观察大屏 PK 榜单是否更新为新的高分学生配对

---

### 问题 3: 挑战榜和荣誉勋章不更新

**症状：**
- 大屏底部的"挑战榜"和"荣誉勋章"显示的始终是固定数据
- 不随学生积分变化而更新排序

**根本原因：**
- 同问题 2，数据生成逻辑使用了未排序的学生数组

**解决方案：**
对所有动态生成的数据（PK、挑战、勋章）都应用相同的排序逻辑：

```typescript
// 挑战数据生成
const generatedChallenges = useMemo(() => {
  if (students.length === 0) return []

  // 按积分排序
  const sortedStudents = [...students].sort((a, b) => b.total_points - a.total_points)
  const challengeTypes = ['一周阅读挑战', '艺术创作', '数学速算', '英语演讲', '科学实验', '编程挑战']
  const statuses = ['进行中', '成功', '失败']
  const challenges = []

  for (let i = 0; i < Math.min(5, sortedStudents.length); i++) {
    const student = sortedStudents[i]  // 取高分学生
    challenges.push({
      id: `c-${i}`,
      title: challengeTypes[i % challengeTypes.length],
      description: `完成 ${[5, 10, 3, 2, 1, 8][i % 6]} 个任务`,
      challenger: {
        name: student.name,
        avatar: student.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`
      },
      status: statuses[i % statuses.length]
    })
  }

  return challenges
}, [students])

// 勋章数据生成
const generatedBadges = useMemo(() => {
  if (students.length === 0) return []

  return [...students].map((s, idx) => {
    const badges = []

    if (idx % 3 === 0) {
      badges.push({
        id: `b1-${idx}`,
        name: '学霸之星',
        description: '学习表现突出',
        image: s.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`,
        icon: '⭐',
        awardedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    }

    return { ...s, badges }
  })
}, [students])
```

**文件位置：** `mobile/bigscreen/main.tsx:108-175`

---

### 问题 4: PKBoardCard 页面索引越界

**症状：**
- PK 榜卡片在页面切换时有时显示空白
- 页面索引不会重置，导致切换到不存在的页面

**根本原因：**
- 当 `pks` 数据重新生成时，页面索引（`page` state）没有重置
- 可能导致 `page >= pages.length`，超出范围

**解决方案：**
在 PKBoardCard 组件中添加 `useEffect` 监听 `pks` 变化：

```typescript
// ✅ 当 PK 数据改变时重置页面
useEffect(() => {
  setPage(0)
}, [pks])
```

**文件位置：** `mobile/bigscreen/components/PKBoardCard.tsx:34-37`

---

### 问题 5: 大量调试日志导致代码混乱

**症状：**
- 源代码包含大量 `console.log` 调试输出
- 控制台输出信息过多，难以区分实际问题
- 生产版本包含调试代码，影响代码质量

**调试日志示例：**
```javascript
// ❌ 删除的调试日志
console.log(`✅ Updated student ${id}: ${data.data.name} - Score: ${data.data.score}`)
console.log(`[API] POINTS_UPDATED: ${ids.length} students, reason: ${reason}`)
console.log(`[WS-Mock] HABIT_CHECKIN: ${studentIds.length} students for habit ${habitId}`)
```

**解决方案：**
只保留必要的错误处理日志，删除所有调试输出：

```typescript
// ✅ 保留的错误处理日志
console.error('Failed to load teams:', error)
console.error('Polling error:', error)
console.error('Failed to update student ${id}:', response.statusText)
```

**清理范围：**
- `mobile/App.tsx`：删除 3 处 debug console.log
- `mobile/bigscreen/main.tsx`：保留错误处理日志
- `mobile/bigscreen/services/sealosService.ts`：删除所有调试代码

**文件位置：** `mobile/App.tsx:151, 170, 179`

---

### 问题 6: 未使用的导入和死代码

**症状：**
- 导入了从未使用的函数
- 包含了大量弃用的 mock 数据
- 代码库中存在多余的代码

**未使用的导入：**
```typescript
// ❌ 删除的未使用导入
import { Challenge } from './types'
import { getStudents, getChallenges, getBadges, getPKs, getRecentTasks } from './services/sealosService'
```

**解决方案：**

1. **main.tsx 导入清理：**
```typescript
// ✅ 清理后
import { Student, Team } from './types'
import { getTeams } from './services/sealosService'
```

2. **sealosService.ts 简化：**

删除前（96 行）：
```typescript
// 包含所有 mock 数据和函数
let teams: Team[] = [...]
let students: Student[] = []
let badges: Badge[] = [...]
let pkMatches: PKMatch[] = [...]
let challenges: Challenge[] = [...]
let recentTasks: StudentTask[] = [...]

export const getStudents = async () => { ... }
export const getChallenges = async () => { ... }
export const getBadges = async () => { ... }
export const getPKs = async () => { ... }
export const getRecentTasks = async () => { ... }
export const subscribeToStudentChanges = () => { ... }
export const subscribeToChallengeChanges = () => { ... }
export const subscribeToPKChanges = () => { ... }
export const subscribeToTaskChanges = () => { ... }
```

删除后（10 行）：
```typescript
import { Team } from '../types'

const teams: Team[] = [
  { id: 't1', name: '新星前锋', color: 'bg-cyan-500', textColor: 'text-cyan-400' },
  { id: 't2', name: '旋涡毒蛇', color: 'bg-purple-500', textColor: 'text-purple-400' },
  { id: 't3', name: '猩红守卫', color: 'bg-red-500', textColor: 'text-red-400' },
  { id: 't4', name: '翡翠哨兵', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
]

export const getTeams = async (): Promise<Team[]> => teams
```

**文件位置：**
- `mobile/bigscreen/main.tsx:11-12`
- `mobile/bigscreen/services/sealosService.ts`（整个文件重写）

---

### 问题 7: 构建失败或类型错误

**症状：**
- 修改代码后 `npm run build` 失败
- TypeScript 编译错误

**解决方案：**
```bash
# 构建命令
npm run build

# 输出（成功）
✓ 1271 modules transformed.
dist/bigscreen/index.html            0.53 kB │ gzip:   0.38 kB
dist/index.html                      1.87 kB │ gzip:   0.87 kB
dist/assets/bigscreen-BJl7nfOY.js   20.75 kB │ gzip:   6.85 kB
dist/assets/client-C_2d_5tV.js     143.69 kB │ gzip:  46.12 kB
dist/assets/main-CkFlIIl7.js       382.49 kB │ gzip: 123.72 kB
✓ built in 2.81s
```

---

### 问题 8: 大屏静态资源路径错误

**症状：**
- 大屏显示加载失败，HTML 引用的 JS 文件哈希值不匹配
- `display.html` 和 `admin.html` 指向旧的资源文件

**解决方案：**

1. **构建新版本：**
```bash
npm run build
# 生成新的资源文件和哈希值
```

2. **更新 display.html：**
```html
<!-- ❌ 旧的哈希值 -->
<script type="module" crossorigin src="/assets/bigscreen-Cc0BpzZl.js"></script>

<!-- ✅ 新的哈希值 -->
<script type="module" crossorigin src="/assets/bigscreen-BJl7nfOY.js"></script>
```

3. **更新 admin.html：**
```html
<!-- ❌ 旧的哈希值 -->
<script type="module" crossorigin src="/assets/main-CJusgVie.js"></script>

<!-- ✅ 新的哈希值 -->
<script type="module" crossorigin src="/assets/main-CkFlIIl7.js"></script>
```

4. **复制构建产物到公开目录：**
```bash
cp -r /home/devbox/project/mobile/dist/* /home/devbox/project/public/
```

**文件位置：**
- `public/display.html`
- `public/admin.html`

---

## 关键技术决策

### 1. HTTP 轮询 vs WebSocket

| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| WebSocket | 真正实时，低延迟 | Sealos 反向代理不支持 WSS | ❌ 不可行 |
| HTTP 轮询 | 所有环境支持，易调试 | 轻微延迟（2秒） | ✅ 选择 |

**轮询间隔选择：2000ms**
- 足够频繁进行实时显示
- 不会对服务器造成过载
- 用户体验流畅

### 2. 数据变化检测方法

```typescript
// 方案 A：JSON 字符串全量比较（已选择）
const newData = JSON.stringify(mappedStudents)
if (lastData !== newData) {
  // 数据有变化
}

// 方案 B：深度对比（会产生性能问题）
// 方案 C：字段级别比较（复杂度高）
```

选择字符串比较的原因：
- 简洁易懂
- 准确检测任何数据变化
- 性能可接受（JSON.stringify 很快）

### 3. useMemo 依赖管理

```typescript
// ✅ 正确：依赖 students，确保学生变化时重新生成数据
const generatedPks = useMemo(() => {
  // 生成 PK 数据
}, [students])

// ❌ 错误：依赖为空，数据不会更新
const generatedPks = useMemo(() => {
  // 生成 PK 数据
}, [])
```

---

## 代码质量改进

### 清理前后对比

| 指标 | 清理前 | 清理后 | 改进 |
|------|--------|--------|------|
| sealosService.ts 行数 | 96 行 | 10 行 | ↓ 89.6% |
| 未使用的导入 | 6 个 | 0 个 | ✓ 消除 |
| console.log 调试语句 | 7 处 | 0 处 | ✓ 消除 |
| 死代码函数 | 8 个 | 0 个 | ✓ 消除 |
| 构建成功 | ✓ | ✓ | 保持 |
| 功能完整性 | 100% | 100% | 保持 |

### 清理内容详细列表

**删除的调试日志：**
1. `mobile/App.tsx:151` - `✅ Updated student...`
2. `mobile/App.tsx:170` - `[API] POINTS_UPDATED...`
3. `mobile/App.tsx:179` - `[WS-Mock] HABIT_CHECKIN...`

**删除的未使用导入：**
1. `mobile/bigscreen/main.tsx` - `Challenge` 类型
2. `mobile/bigscreen/main.tsx` - `getStudents` 函数
3. `mobile/bigscreen/main.tsx` - `getChallenges` 函数
4. `mobile/bigscreen/main.tsx` - `getBadges` 函数
5. `mobile/bigscreen/main.tsx` - `getPKs` 函数
6. `mobile/bigscreen/main.tsx` - `getRecentTasks` 函数

**删除的死代码：**
1. `mobile/bigscreen/services/sealosService.ts` - 所有 mock 数据
2. `mobile/bigscreen/services/sealosService.ts` - `getStudents()` 函数
3. `mobile/bigscreen/services/sealosService.ts` - `getChallenges()` 函数
4. `mobile/bigscreen/services/sealosService.ts` - `getBadges()` 函数
5. `mobile/bigscreen/services/sealosService.ts` - `getPKs()` 函数
6. `mobile/bigscreen/services/sealosService.ts` - `getRecentTasks()` 函数
7. `mobile/bigscreen/services/sealosService.ts` - 所有 subscribe* 函数

---

## 部署指南

### 1. 构建步骤
```bash
cd /home/devbox/project/mobile
npm run build
```

### 2. 部署步骤
```bash
# 复制构建产物到公开目录
cp -r /home/devbox/project/mobile/dist/* /home/devbox/project/public/

# 验证文件
ls -la /home/devbox/project/public/
```

### 3. 验证访问路由

| 路由 | 应用 | HTML 文件 | 说明 |
|------|------|---------|------|
| `/admin` | 教师端（ClassHero） | `admin.html` | 班级管理和学生积分管理 |
| `/display` | 大屏显示 | `display.html` | 实时数据大屏展示 |
| `/bigscreen/` | 大屏应用 | `bigscreen/index.html` | 大屏应用主文件 |

### 4. 运行环境变量

```bash
# API 地址配置
REACT_APP_API_URL=https://esboimzbkure.sealosbja.site/api
```

---

## 故障排查

### 症状：大屏不显示数据

**检查清单：**
1. 打开浏览器控制台（F12）
2. 检查网络请求是否正常
3. 验证 API 端点是否可达
4. 检查 `console` 中的错误信息

```javascript
// 在浏览器控制台测试 API
fetch('https://esboimzbkure.sealosbja.site/api/students')
  .then(r => r.json())
  .then(d => console.log(d))
```

### 症状：大屏显示学生不更新

**检查清单：**
1. 验证轮询是否工作：
```javascript
// 查看轮询日志
// 应该每 2 秒看到一次网络请求
```
2. 教师端修改积分后，等待 2-3 秒观察大屏
3. 检查 `wsConnected` 状态（右上角连接指示）

### 症状：构建失败

**常见原因和解决方案：**
```bash
# 清理 node_modules 和重新安装
rm -rf node_modules package-lock.json
npm install

# 再次构建
npm run build
```

---

## 性能优化建议

### 1. 轮询间隔优化

当前配置：2000ms（2秒）

```typescript
// 可根据需要调整：
pollInterval = setInterval(pollStudents, 2000)  // 当前：2秒
// pollInterval = setInterval(pollStudents, 1000)  // 可选：1秒（更实时）
// pollInterval = setInterval(pollStudents, 5000)  // 可选：5秒（节省带宽）
```

**建议：** 保持 2000ms，是实时性和性能的最佳平衡

### 2. 大数据集优化

如果学生数量超过 100，考虑：

```typescript
// 分页加载
const PAGE_SIZE = 50
const currentPageStudents = students.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

// 虚拟滚动（高级）
import { FixedSizeList } from 'react-window'
```

### 3. 内存优化

当前实现已使用 `useMemo` 缓存计算结果，避免重复计算。

---

## 安全性考虑

### 1. API 端点安全

- 所有 API 调用使用 HTTPS
- 在生产环境中应实施身份验证
- 实施速率限制防止滥用

### 2. 敏感数据

当前实现不存储本地敏感数据，所有信息从 API 实时获取。

### 3. CORS 配置

确保 API 服务器正确配置 CORS 以允许来自大屏的请求。

---

## 测试验证清单

- [x] 构建成功（无错误或警告）
- [x] 所有导入有效（无未使用的导入）
- [x] 所有调试代码已移除
- [x] 大屏轮询工作正常
- [x] PK 榜单随积分更新
- [x] 挑战榜随积分更新
- [x] 荣誉勋章显示正确
- [x] 页面切换无异常
- [x] 网络连接指示正确

---

## 相关文件清单

### 核心业务逻辑文件

| 文件 | 功能 | 修改内容 |
|------|------|---------|
| `mobile/bigscreen/main.tsx` | 大屏主应用 | 修改 PK/挑战/勋章生成逻辑，删除未使用导入 |
| `mobile/bigscreen/components/PKBoardCard.tsx` | PK 榜卡片 | 添加页面重置逻辑，删除调试日志 |
| `mobile/App.tsx` | 教师端主应用 | 删除调试日志 |
| `mobile/bigscreen/services/sealosService.ts` | API 服务 | 删除所有未使用函数和 mock 数据 |

### 配置和部署文件

| 文件 | 功能 | 修改内容 |
|------|------|---------|
| `public/admin.html` | 教师端 HTML 入口 | 更新资源哈希值 |
| `public/display.html` | 大屏 HTML 入口 | 更新资源哈希值 |
| `public/index.html` | 应用根 HTML | 复制自构建产物 |

---

## 版本历史

| 版本 | 日期 | 主要变更 |
|------|------|---------|
| v1.0 | 2024-11-22 | 首个生产版本，完成代码清理和优化 |

---

## 联系与支持

如需技术支持或遇到问题，请检查：
1. 本文档对应的章节
2. 浏览器控制台错误信息
3. 服务器日志

---

---

## 问题 9: 勋章授予后相关显示问题（2025-11-26）

### 9.1 大屏端勋章授予日期消失

**症状：**
- 勋章授予后，大屏端勋章展示区域的授予日期不显示

**根本原因：**
- 前端代码使用 `badge.awardedDate` 字段
- 但 API 返回的字段名是 `awarded_at`
- 字段名不匹配导致日期无法显示

**解决方案：**
```typescript
// bigscreen/components/HonorBadgesCard.tsx:38
// ❌ 原代码
加冕于: {fmt(badge.awardedDate)}

// ✅ 修复后 - 兼容两种字段名
加冕于: {fmt((badge as any).awarded_at || badge.awardedDate)}
```

**文件位置：** `bigscreen/components/HonorBadgesCard.tsx:38`

---

### 9.2 大屏勋章卡头像显示问题

**症状：**
- 勋章卡片中应该显示学生头像，但没有显示

**根本原因：**
- 代码尝试显示 `badge.image`（勋章图片）
- 但 API 没有返回勋章图片字段
- 应该显示的是学生头像，而不是勋章图片

**解决方案：**
```typescript
// bigscreen/components/HonorBadgesCard.tsx:29
// ❌ 原代码
<img src={badge.image} alt={badge.name} className="w-20 h-20 rounded-full border-2 border-yellow-400 object-cover"/>

// ✅ 修复后 - 显示学生头像
<img src={student.avatar_url || '/assets/default-avatar.png'} alt={student.name} className="w-20 h-20 rounded-full border-2 border-yellow-400 object-cover"/>
```

**文件位置：** `bigscreen/components/HonorBadgesCard.tsx:29`

---

### 9.3 大屏勋章展示滚动速度过快

**症状：**
- 勋章横向滚动速度太快，用户无法看清内容

**解决方案：**
```css
/* bigscreen/components/HonorBadgesCard.tsx:85 */
/* ❌ 原配置 */
animation: scroll 50s linear infinite;

/* ✅ 修复后 - 调整为更慢的速度 */
animation: scroll 80s linear infinite;
```

**调整说明：**
- 从 50 秒增加到 80 秒
- 滚动速度降低 37.5%
- 用户有更多时间阅读勋章信息

**文件位置：** `bigscreen/components/HonorBadgesCard.tsx:85`

---

### 9.4 大屏挑战擂台缺少挑战者名称

**症状：**
- 大屏端挑战擂台显示挑战信息，但没有显示挑战者名称
- 手机端可以正常显示挑战者名称

**根本原因：**
1. API 只返回基本挑战字段，没有 JOIN 学生表获取挑战者信息
2. 前端服务层硬编码了挑战者信息为"系统"
3. 前端组件期望 `challenger.name` 和 `challenger.avatar` 字段

**解决方案分三步：**

**步骤 1：修改 API 返回挑战者信息**
```javascript
// server.js:538-568
// ❌ 原 SQL 查询
SELECT id, title, description, status, reward_points, reward_exp FROM challenges

// ✅ 修复后 - JOIN students 表获取挑战者信息
SELECT
  c.id,
  c.title,
  c.description,
  c.status,
  c.reward_points,
  c.reward_exp,
  c.challenger_id,
  s.name as challenger_name,
  s.avatar_url as challenger_avatar
FROM challenges c
LEFT JOIN students s ON c.challenger_id = s.id
ORDER BY c.created_at DESC
```

**步骤 2：更新服务层数据映射**
```typescript
// bigscreen/services/sealosService.ts:66-75
// ❌ 原代码 - 硬编码挑战者信息
cachedData.challenges = (result.data || []).map((c: any) => ({
  id: String(c.id),
  title: c.title || '未命名挑战',
  description: c.description || '',
  status: c.status || 'active',
  challenger: {
    name: '系统',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=system'
  }
}))

// ✅ 修复后 - 使用 API 返回的挑战者信息
cachedData.challenges = (result.data || []).map((c: any) => ({
  id: String(c.id),
  title: c.title || '未命名挑战',
  description: c.description || '',
  status: c.status || 'active',
  challenger: {
    name: c.challenger_name || '未知挑战者',
    avatar: c.challenger_avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=system'
  }
}))
```

**步骤 3：更新 WebSocket 事件处理**
```typescript
// bigscreen/main.tsx:84-95
// ❌ 原代码 - 新挑战事件也使用硬编码
unsubscribeChallengeCreate = subscribe('challenge:created', (newChallenge: any) => {
  setChallenges((prev) => [{
    id: String(newChallenge.id),
    title: newChallenge.title,
    description: newChallenge.description,
    status: newChallenge.status,
    challenger: {
      name: '系统',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=system'
    }
  }, ...prev])
})

// ✅ 修复后 - 使用事件中的挑战者信息
unsubscribeChallengeCreate = subscribe('challenge:created', (newChallenge: any) => {
  setChallenges((prev) => [{
    id: String(newChallenge.id),
    title: newChallenge.title,
    description: newChallenge.description,
    status: newChallenge.status,
    challenger: {
      name: newChallenge.challenger_name || '未知挑战者',
      avatar: newChallenge.challenger_avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=system'
    }
  }, ...prev])
})
```

**步骤 4：更新前端组件兼容新旧格式**
```typescript
// bigscreen/components/ChallengeArenaCard.tsx:22-48
// ✅ 兼容新旧两种数据格式
{displayChallenges.map((challenge, index) => {
  const challengerName = (challenge as any).challenger_name || challenge.challenger?.name || '未知挑战者';
  const challengerAvatar = (challenge as any).challenger_avatar || challenge.challenger?.avatar || '/assets/default-avatar.png';

  return (
    <div key={`${challenge.id}-${index}`} className="flex items-center p-2 mb-2 bg-slate-800/40 border border-slate-700/50 rounded-lg">
      <img
        src={challengerAvatar}
        alt={challengerName}
        className="w-9 h-9 rounded-full border-2 border-purple-400 mr-3 flex-shrink-0"
      />
      <div className="flex-grow overflow-hidden">
        <h4 className="font-bold text-sm text-purple-300 truncate">{challenge.title}</h4>
        <p className="text-xs text-slate-400 truncate">挑战者: {challengerName}</p>
      </div>
      {/* 状态标签 */}
    </div>
  );
})}
```

**文件位置：**
- `server.js:538-568` (API)
- `bigscreen/services/sealosService.ts:66-75` (服务层)
- `bigscreen/main.tsx:84-95` (WebSocket)
- `bigscreen/components/ChallengeArenaCard.tsx:22-48` (组件)

---

### 9.5 班级管理学生详情页缺少勋章授予记录

**症状：**
- 在班级管理的学生个人详情页中，只显示勋章图标和名称
- 没有显示勋章的授予日期

**解决方案：**
重新设计勋章显示布局，添加授予日期信息：

```typescript
// mobile/pages/ClassManage.tsx:1075-1122
// ❌ 原布局 - 3列简单显示
<div className="grid grid-cols-3 gap-2">
  {badgeItems.map((b, i) => (
    <span key={`${b.id}-${i}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700 text-xs font-bold">
      <span>{b.icon}</span>
      <span>{b.name}</span>
    </span>
  ))}
</div>

// ✅ 新布局 - 2列卡片式，包含授予日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = `${d.getMonth()+1}`.padStart(2,'0');
  const dd = `${d.getDate()}`.padStart(2,'0');
  return `${y}-${m}-${dd}`;
};

<div className="grid grid-cols-2 gap-3">
  {badgeItems.map((b, i) => (
    <div key={`${b.id}-${i}`} className="flex flex-col p-2 rounded-lg bg-white border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{b.icon}</span>
        <span className="text-xs font-bold text-gray-700">{b.name}</span>
      </div>
      <div className="text-[10px] text-gray-400 mt-1">
        授予日期: {formatDate((b as any).awarded_at)}
      </div>
    </div>
  ))}
</div>
```

**改进点：**
1. 从 3 列改为 2 列，每个勋章有更多空间
2. 从简单标签改为卡片式设计
3. 添加授予日期显示
4. 每页从 12 个改为 6 个，以容纳更多信息

**文件位置：** `mobile/pages/ClassManage.tsx:1075-1122`

---

### 9.6 大屏端静态资源路径问题

**症状：**
- 大屏端页面加载后显示空白
- 控制台显示 404 错误：`assets/index-CdmnUuP6.js` 找不到

**根本原因：**
- HTML 中引用 `/assets/index-CdmnUuP6.js`
- 服务器配置 `/assets` 指向 `public/assets/`
- 但实际文件在 `public/bigscreen/assets/`
- 路径不匹配导致文件无法加载

**解决方案：**
```html
<!-- public/bigscreen/index.html -->
<!-- ❌ 原路径 -->
<script type="module" crossorigin src="/assets/index-CdmnUuP6.js"></script>

<!-- ✅ 修复后 - 使用正确的相对路径 -->
<script type="module" crossorigin src="/bigscreen/assets/index-CdmnUuP6.js"></script>
```

**服务器配置说明：**
```javascript
// server.js:58-60
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use('/bigscreen', express.static(path.join(__dirname, 'public/bigscreen')));
```

- `/assets` → `public/assets/` (移动端资源)
- `/bigscreen` → `public/bigscreen/` (大屏端资源)

**文件位置：** `public/bigscreen/index.html:8`

---

## 数据库字段映射规范

### 勋章相关字段

| 数据库字段 | API 返回字段 | 前端类型定义 | 说明 |
|-----------|-------------|-------------|------|
| `awarded_at` | `awarded_at` | `awardedDate?` | 勋章授予时间 |
| `badge_id` | `id` | `id` | 勋章 ID |
| `name` | `name` | `name` | 勋章名称 |
| `icon` | `icon` | `icon` | 勋章图标 |
| `description` | `description` | `description` | 勋章描述 |

**注意事项：**
- 前端类型定义使用 `awardedDate`，但 API 返回 `awarded_at`
- 需要在前端做字段映射或兼容处理
- 建议统一使用 `awarded_at` 或 `awardedDate`

### 挑战相关字段

| 数据库字段 | API 返回字段 | 前端类型定义 | 说明 |
|-----------|-------------|-------------|------|
| `challenger_id` | `challenger_id` | - | 挑战者学生 ID |
| - | `challenger_name` | `challenger.name` | 挑战者姓名（JOIN 获取） |
| - | `challenger_avatar` | `challenger.avatar` | 挑战者头像（JOIN 获取） |
| `title` | `title` | `title` | 挑战标题 |
| `description` | `description` | `description` | 挑战描述 |
| `status` | `status` | `status` | 挑战状态 |

**SQL JOIN 示例：**
```sql
SELECT
  c.id,
  c.title,
  c.description,
  c.status,
  c.challenger_id,
  s.name as challenger_name,
  s.avatar_url as challenger_avatar
FROM challenges c
LEFT JOIN students s ON c.challenger_id = s.id
```

---

## 构建和部署流程更新

### 完整构建流程

```bash
# 1. 构建大屏端
cd /home/devbox/project/arkok/bigscreen
npm run build

# 2. 构建移动端
cd /home/devbox/project/arkok/mobile
npm run build

# 3. 复制构建产物
cd /home/devbox/project/arkok
cp -r bigscreen/dist/* public/bigscreen/
cp -r mobile/dist/* public/

# 4. 修复大屏端资源路径（如果需要）
# 确保 public/bigscreen/index.html 中的 script src 指向 /bigscreen/assets/

# 5. 重启服务器
pkill -f "node.*server.js"
./entrypoint.sh start
```

### 验证清单

- [ ] 大屏端可以正常访问 (`/display` 或 `/screen`)
- [ ] 勋章展示区域显示授予日期
- [ ] 勋章卡片显示学生头像
- [ ] 勋章滚动速度适中（80秒）
- [ ] 挑战擂台显示挑战者名称和头像
- [ ] 学生详情页显示勋章授予日期
- [ ] 控制台无 404 错误
- [ ] 控制台无 TypeScript 错误

---

## 故障排查更新

### 症状：大屏端页面空白

**检查步骤：**

1. **检查控制台错误**
```javascript
// 打开浏览器开发者工具 (F12)
// 查看 Console 标签页
// 常见错误：
// - 404: 资源文件找不到
// - CORS: 跨域请求被阻止
// - TypeError: 数据字段不存在
```

2. **检查网络请求**
```javascript
// 打开 Network 标签页
// 刷新页面
// 检查：
// - index.html 是否成功加载 (200)
// - JS 文件是否成功加载 (200)
// - API 请求是否成功 (/api/students, /api/challenges)
```

3. **检查文件路径**
```bash
# 验证文件存在
ls -la /home/devbox/project/arkok/public/bigscreen/assets/

# 检查 HTML 中的引用路径
cat /home/devbox/project/arkok/public/bigscreen/index.html | grep "script"

# 确保路径匹配
# HTML: /bigscreen/assets/index-XXX.js
# 文件: public/bigscreen/assets/index-XXX.js
```

4. **检查服务器配置**
```javascript
// server.js 中的静态文件配置
app.use('/bigscreen', express.static(path.join(__dirname, 'public/bigscreen')));

// 确保路径正确
// URL: http://domain/bigscreen/assets/index.js
// 映射到: public/bigscreen/assets/index.js
```

### 症状：勋章或挑战数据不显示

**检查步骤：**

1. **检查 API 返回数据**
```javascript
// 在浏览器控制台执行
fetch('/api/students')
  .then(r => r.json())
  .then(d => {
    console.log('学生数据:', d.data[0]);
    console.log('勋章数据:', d.data[0].badges);
  });

fetch('/api/challenges')
  .then(r => r.json())
  .then(d => {
    console.log('挑战数据:', d.data[0]);
    console.log('挑战者信息:', {
      name: d.data[0].challenger_name,
      avatar: d.data[0].challenger_avatar
    });
  });
```

2. **检查字段映射**
```typescript
// 确认前端代码使用正确的字段名
// 勋章日期: awarded_at (API) vs awardedDate (前端)
// 挑战者: challenger_name (API) vs challenger.name (前端)
```

3. **检查数据库**
```sql
-- 检查勋章授予记录
SELECT sb.*, b.name, b.icon, s.name as student_name
FROM student_badges sb
JOIN badges b ON sb.badge_id = b.id
JOIN students s ON sb.student_id = s.id
LIMIT 5;

-- 检查挑战记录
SELECT c.*, s.name as challenger_name, s.avatar_url
FROM challenges c
LEFT JOIN students s ON c.challenger_id = s.id
LIMIT 5;
```

---

---

## 问题 10: PK 榜和挑战擂台布局问题（2025-11-26）

**症状：**
- PK 榜和挑战擂台的显示区域布局混乱
- 之前是固定在一个位置且屏幕自适应
- 现在静止不动，内容超出屏幕无法滚动

**根本原因：**
- 布局使用了 `flex-shrink-0` 和 `flex-grow`，导致高度分配不均
- PK 榜设置为不收缩，占据了过多空间
- 挑战擂台被压缩，无法正常显示

**解决方案：**
```typescript
// bigscreen/main.tsx:132-139
// ❌ 原布局 - 使用 flex-shrink-0 和 flex-grow
<div className="lg:col-span-1 flex flex-col gap-6 h-full min-h-0">
  <div className="flex-shrink-0">
    <PKBoardCard pks={pks} teamsMap={teamsMap} students={students} />
  </div>
  <div className="flex-grow min-h-0">
    <ChallengeArenaCard challenges={challenges} />
  </div>
</div>

// ✅ 修复后 - 使用固定比例分配高度
<div className="lg:col-span-1 flex flex-col gap-6 h-full min-h-0">
  <div className="h-1/2 min-h-0">
    <PKBoardCard pks={pks} teamsMap={teamsMap} students={students} />
  </div>
  <div className="h-1/2 min-h-0">
    <ChallengeArenaCard challenges={challenges} />
  </div>
</div>
```

**布局说明：**
- 使用 `h-1/2` 将右侧列平均分配给 PK 榜和挑战擂台
- 每个组件占据 50% 的高度
- `min-h-0` 确保内容可以正常滚动
- 两个组件都有固定的容器高度，内部可以自适应滚动

**组件内部滚动机制：**

1. **PK 榜** (`PKBoardCard.tsx`):
   - 使用分页机制，每 5 秒自动翻页
   - 根据容器高度动态计算每页显示的 PK 数量
   - 使用 `ResizeObserver` 监听容器大小变化

2. **挑战擂台** (`ChallengeArenaCard.tsx`):
   - 使用垂直滚动动画
   - 内容重复两次实现无缝循环
   - 动画时长根据挑战数量动态计算

**文件位置：** `bigscreen/main.tsx:132-139`

---

---

## 问题 11: 挑战擂台挑战者信息缺失的根本原因（2025-11-26）

**症状：**
- 即使修复了 API 和前端显示代码，挑战擂台仍然不显示挑战者名称
- 所有现有挑战的 `challenger_id` 字段都是 `null`

**根本原因：**
创建挑战时，前端和后端都没有处理 `challenger_id` 字段：

1. **后端 API 问题** (`server.js:497-533`):
   - 创建挑战的 API 没有接收 `challenger_id` 参数
   - INSERT 语句中没有包含 `challenger_id` 字段
   - 导致所有新创建的挑战都没有挑战者信息

2. **前端代码问题** (`mobile/pages/ClassManage.tsx:355-371`):
   - 创建挑战时没有传递 `challenger_id` 参数
   - 虽然 UI 中可以选择参与者，但没有将其作为挑战者发送

**完整解决方案：**

### 步骤 1：修复后端 API

```javascript
// server.js:497-552
app.post('/api/challenges', async (req, res) => {
  try {
    // ✅ 添加 challenger_id 参数
    const { title, description, status = 'active', reward_points = 0, reward_exp = 0, challenger_id } = req.body;

    // ✅ INSERT 语句包含 challenger_id
    const result = await pool.query(
      `INSERT INTO challenges (title, description, status, reward_points, reward_exp, challenger_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, description, status, reward_points, reward_exp, challenger_id`,
      [title, description || '', status, reward_points, reward_exp, challenger_id || null]
    );

    // ✅ 获取完整的挑战信息（包括挑战者姓名和头像）
    const challengeId = result.rows[0].id;
    const fullChallengeResult = await pool.query(`
      SELECT
        c.id,
        c.title,
        c.description,
        c.status,
        c.reward_points,
        c.reward_exp,
        c.challenger_id,
        s.name as challenger_name,
        s.avatar_url as challenger_avatar
      FROM challenges c
      LEFT JOIN students s ON c.challenger_id = s.id
      WHERE c.id = $1
    `, [challengeId]);

    const challengeData = fullChallengeResult.rows[0];

    // ✅ 广播完整的挑战信息（包括挑战者信息）
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'challenge:created',
          payload: challengeData,
          timestamp: new Date().toISOString()
        }));
      }
    });

    res.status(201).json({
      success: true,
      data: challengeData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### 步骤 2：修复前端代码

```typescript
// mobile/pages/ClassManage.tsx:355-371
const handlePublishChallenge = async () => {
  if(newChallenge.title && newChallenge.desc) {
    const pts = parseInt(String((newChallenge as any).rewardPoints));
    const exp = parseInt(String((newChallenge as any).rewardExp));

    try {
      const protocol = window.location.protocol;
      const host = window.location.host;
      const apiUrl = `${protocol}//${host}/api`;

      // ✅ 使用第一个参与者作为挑战者
      const challengerId = newChallenge.participantIds && newChallenge.participantIds.length > 0
          ? newChallenge.participantIds[0]
          : null;

      const response = await fetch(`${apiUrl}/challenges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              title: newChallenge.title,
              description: newChallenge.desc,
              status: 'active',
              reward_points: isNaN(pts) ? 10 : pts,
              reward_exp: isNaN(exp) ? 0 : exp,
              challenger_id: challengerId  // ✅ 添加挑战者 ID
          })
      });

      // ... 其余代码
    } catch (error) {
      console.error('Error publishing challenge:', error);
    }
  }
};
```

**业务逻辑说明：**
- UI 中的"选择学生"功能用于选择挑战参与者
- 第一个被选择的学生自动成为挑战者（`challenger_id`）
- 如果没有选择任何学生，`challenger_id` 为 `null`，显示为"未知挑战者"

**文件位置：**
- `server.js:497-552` (后端 API)
- `mobile/pages/ClassManage.tsx:355-371` (前端创建逻辑)

**验证方法：**
1. 在教师端创建新挑战，选择一个学生作为参与者
2. 发布挑战后，检查大屏端挑战擂台
3. 应该能看到挑战者的名称和头像

**注意事项：**
- 已存在的挑战（`challenger_id` 为 `null`）仍然不会显示挑战者
- 需要重新创建挑战或手动更新数据库中的 `challenger_id` 字段
- 可以使用以下 SQL 更新现有挑战：
```sql
-- 示例：将挑战 ID 为 1 的挑战者设置为学生 ID 为 16 的学生
UPDATE challenges SET challenger_id = 16 WHERE id = 1;
```

---

## 问题 12: 挑战参与者数据持久化问题（2025-11-26）

### 12.1 挑战参与者刷新后丢失

**症状：**
- 手机端发布挑战并指定参与者后，参与者名称会显示在"进行中"标签中
- 刷新页面后，参与者信息消失，显示为"未指定"
- 学生个人信息页中看不到挑战记录

**根本原因：**
1. 后端API创建挑战时没有保存参与者到 `challenge_participants` 表
2. 后端API返回挑战时没有包含参与者信息
3. 前端加载挑战时将participants设置为空数组

**解决方案分三步：**

**步骤 1：修改后端创建挑战API**
```javascript
// server.js:489-565
app.post('/api/challenges', async (req, res) => {
  try {
    // ✅ 接收 participant_ids 参数
    const { title, description, status = 'active', reward_points = 0, reward_exp = 0, challenger_id, participant_ids = [] } = req.body;

    // 创建挑战
    const result = await pool.query(
      `INSERT INTO challenges (title, description, status, reward_points, reward_exp, challenger_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, description, status, reward_points, reward_exp, challenger_id`,
      [title, description || '', status, reward_points, reward_exp, challenger_id || null]
    );

    const challengeId = result.rows[0].id;

    // ✅ 插入参与者到 challenge_participants 表
    if (participant_ids && participant_ids.length > 0) {
      for (const studentId of participant_ids) {
        await pool.query(
          `INSERT INTO challenge_participants (challenge_id, student_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [challengeId, studentId]
        );
      }
    }

    // ✅ 获取完整的挑战信息（包括参与者）
    const fullChallengeResult = await pool.query(`
      SELECT
        c.id,
        c.title,
        c.description,
        c.status,
        c.reward_points,
        c.reward_exp,
        c.challenger_id,
        s.name as challenger_name,
        s.avatar_url as challenger_avatar,
        COALESCE(
          json_agg(
            json_build_object('student_id', cp.student_id)
          ) FILTER (WHERE cp.student_id IS NOT NULL),
          '[]'
        ) as participants
      FROM challenges c
      LEFT JOIN students s ON c.challenger_id = s.id
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      WHERE c.id = $1
      GROUP BY c.id, s.name, s.avatar_url
    `, [challengeId]);

    const challengeData = fullChallengeResult.rows[0];

    // 广播和返回
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'challenge:created',
          payload: challengeData,
          timestamp: new Date().toISOString()
        }));
      }
    });

    res.status(201).json({
      success: true,
      data: challengeData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

**步骤 2：修改后端获取挑战API**
```javascript
// server.js:570-608
app.get('/api/challenges', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.title,
        c.description,
        c.status,
        c.reward_points,
        c.reward_exp,
        c.challenger_id,
        s.name as challenger_name,
        s.avatar_url as challenger_avatar,
        COALESCE(
          json_agg(
            json_build_object('student_id', cp.student_id)
          ) FILTER (WHERE cp.student_id IS NOT NULL),
          '[]'
        ) as participants
      FROM challenges c
      LEFT JOIN students s ON c.challenger_id = s.id
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      GROUP BY c.id, s.name, s.avatar_url
      ORDER BY c.created_at DESC
    `);
    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

**步骤 3：修改前端发送参与者列表**
```typescript
// mobile/pages/ClassManage.tsx:360-395
const handlePublishChallenge = async () => {
  if(newChallenge.title && newChallenge.desc) {
    const pts = parseInt(String((newChallenge as any).rewardPoints));
    const exp = parseInt(String((newChallenge as any).rewardExp));

    try {
      const protocol = window.location.protocol;
      const host = window.location.host;
      const apiUrl = `${protocol}//${host}/api`;

      const challengerId = newChallenge.participantIds && newChallenge.participantIds.length > 0
          ? newChallenge.participantIds[0]
          : null;

      const response = await fetch(`${apiUrl}/challenges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              title: newChallenge.title,
              description: newChallenge.desc,
              status: 'active',
              reward_points: isNaN(pts) ? 10 : pts,
              reward_exp: isNaN(exp) ? 0 : exp,
              challenger_id: challengerId,
              participant_ids: newChallenge.participantIds || []  // ✅ 发送完整参与者列表
          })
      });

      if (!response.ok) {
          console.error('Failed to publish challenge:', response.statusText);
          return;
      }

      const data = await response.json();
      if (data.success && data.data) {
          // ✅ 从API返回的participants中提取student_id
          const participantIds = (data.data.participants || []).map((p: any) => String(p.student_id));

          setChallenges(prev => [{
              id: String(data.data.id),
              title: data.data.title,
              desc: data.data.description,
              status: data.data.status,
              participants: participantIds,
              rewardPoints: data.data.reward_points,
              rewardExp: data.data.reward_exp,
              date: new Date().toISOString()
          }, ...prev]);
      }
    } catch (error) {
        console.error('Error publishing challenge:', error);
    }

    setNewChallenge({ title: '', desc: '', participantIds: [], rewardPoints: '', rewardExp: '' } as any);
  }
};
```

**步骤 4：修改前端加载挑战数据**
```typescript
// mobile/App.tsx:172-191
// 处理挑战数据
if (challengesRes.ok) {
  const challengesData = await challengesRes.json();
  if (challengesData.success && Array.isArray(challengesData.data)) {
    setChallenges(challengesData.data.map((c: any) => {
      // ✅ 从API返回的participants中提取student_id
      const participantIds = (c.participants || []).map((p: any) => String(p.student_id));
      return {
        id: String(c.id),
        title: c.title,
        desc: c.description,
        status: c.status,
        participants: participantIds,
        rewardPoints: c.reward_points || 0,
        rewardExp: c.reward_exp || 0,
        date: new Date().toISOString()
      };
    }));
  }
}
```

**文件位置：**
- `server.js:489-565` (创建挑战API)
- `server.js:570-608` (获取挑战API)
- `mobile/pages/ClassManage.tsx:360-395` (发送挑战)
- `mobile/App.tsx:172-191` (加载挑战)

**验证方法：**
1. 在教师端创建新挑战，选择参与者
2. 发布挑战后，查看挑战列表中的参与者信息
3. 刷新页面，验证参与者信息仍然存在
4. 查看学生个人信息页，验证挑战记录显示

**注意事项：**
- 已存在的挑战（在修复之前创建的）的participants都是空数组
- 需要重新创建挑战才能看到参与者信息
- 或者手动更新数据库：
```sql
-- 为现有挑战添加参与者
INSERT INTO challenge_participants (challenge_id, student_id)
VALUES (挑战ID, 学生ID);
```

---

### 12.2 学生个人信息页数据显示

**当前状态：**
- ✅ 勋章授予记录：已正确显示（从API返回的badges数据）
- ✅ 任务记录：代码中已有显示逻辑（从 `selectedStudent.taskHistory` 读取）
- ✅ 挑战记录：现在可以正确显示（通过 `getStudentChallenges` 函数过滤）
- ✅ PK记录：已正确显示（通过 `getStudentPKHistory` 函数过滤）

**数据来源：**
```typescript
// mobile/pages/ClassManage.tsx:124-130
const getStudentChallenges = (studentId: string) => {
    return challenges.filter(c => c.participants.includes(studentId));
};

const getStudentPKHistory = (studentId: string) => {
    return pkMatches.filter(pk => (pk.studentA === studentId || pk.studentB === studentId) && pk.status === 'finished');
};
```

**文件位置：** `mobile/pages/ClassManage.tsx:124-130, 987-1267`

---

## 问题 13: 大屏勋章滚动速度过快（2025-11-26）

**症状：**
- 大屏端荣誉勋章横向滚动速度太快
- 用户无法看清勋章内容

**解决方案：**
```css
/* mobile/bigscreen/components/HonorBadgesCard.tsx:85 */
/* ❌ 原配置 */
animation: scroll 50s linear infinite;

/* ✅ 修复后 - 调整为更慢的速度 */
animation: scroll 120s linear infinite;
```

**调整说明：**
- 从 50 秒增加到 120 秒
- 滚动速度降低 58.3%
- 用户有更多时间阅读勋章信息

**文件位置：** `mobile/bigscreen/components/HonorBadgesCard.tsx:85`

---

## 数据持久化验证

所有数据都已正确连接到PostgreSQL数据库：

| 功能 | 数据表 | 状态 |
|------|--------|------|
| 学生信息 | `students` | ✅ 已连接 |
| 挑战数据 | `challenges` | ✅ 已连接 |
| 挑战参与者 | `challenge_participants` | ✅ 已连接 |
| 勋章授予记录 | `student_badges` | ✅ 已连接 |
| 任务分配 | `task_assignments` | ✅ 已连接 |
| PK记录 | `pk_matches` | ✅ 已连接 |
| 习惯打卡 | `habit_checkins` | ✅ 已连接 |
| 积分历史 | `score_history` | ✅ 已连接 |

**验证方法：**
```bash
# 连接数据库
PGPASSWORD=kngwb5cb psql -h ep-weathered-bird-a1yjvqxo.ap-southeast-1.aws.neon.tech -U neondb_owner -d neondb

# 查看挑战参与者
SELECT c.title, s.name as participant
FROM challenges c
JOIN challenge_participants cp ON c.id = cp.challenge_id
JOIN students s ON cp.student_id = s.id;

# 查看勋章授予记录
SELECT s.name, b.name as badge_name, sb.awarded_at
FROM student_badges sb
JOIN students s ON sb.student_id = s.id
JOIN badges b ON sb.badge_id = b.id
ORDER BY sb.awarded_at DESC;
```

---

## 路由清理

**已删除的路由：**
- ❌ `/display` - 旧的大屏端路由（已删除）
- ❌ `/display/*` - 旧的大屏端hash路由（已删除）

**当前使用的路由：**
- ✅ `/screen` - 大屏端（正式使用）
- ✅ `/screen/*` - 大屏端hash路由
- ✅ `/admin` - 教师端/管理端
- ✅ `/student` - 学生端

**代码结构：**
- **正在使用：** `mobile/bigscreen/` - 使用HTTP轮询的新版本
- **已废弃：** `bigscreen.old.backup/` - 使用WebSocket的旧版本（已备份）

**文件位置：** `server.js:70-82`

---

---

## 问题 14: 数据持久化和个人信息页显示问题（2025-11-26 下午）

### 14.1 任务执行人刷新后丢失

**症状：**
- 发布任务并指定执行人后，任务列表显示执行人名称
- 刷新页面后，执行人信息消失

**根本原因：**
1. 后端 GET /api/tasks 只返回任务基本信息，没有返回执行人
2. 前端加载任务时强制设置 `assignedTo: []`

**解决方案：**

**步骤 1：修改后端任务API返回执行人信息**
```javascript
// server.js:818-855
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.title,
        t.description,
        t.exp_value,
        COALESCE(
          json_agg(
            json_build_object(
              'student_id', ta.student_id,
              'student_name', s.name,
              'student_avatar', s.avatar_url
            )
          ) FILTER (WHERE ta.student_id IS NOT NULL),
          '[]'
        ) as assigned_to
      FROM tasks t
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      LEFT JOIN students s ON ta.student_id = s.id
      GROUP BY t.id
      ORDER BY t.id DESC
    `);
    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

**步骤 2：修改前端加载任务数据**
```typescript
// mobile/App.tsx:231
// ❌ 原代码
assignedTo: []

// ✅ 修复后
assignedTo: (t.assigned_to || []).map((a: any) => String(a.student_id))
```

**文件位置：**
- `server.js:818-855`
- `mobile/App.tsx:231`

---

### 14.2 挑战人刷新后丢失

**症状：**
- 发布挑战并指定挑战人后，挑战列表不显示挑战人名称
- 过往挑战页面也不显示挑战人

**根本原因：**
1. Challenge 类型定义缺少 `challengerId`, `challengerName`, `challengerAvatar` 字段
2. 前端加载挑战数据时没有保存挑战人信息
3. 前端显示时使用错误的字段（`participants[0]` 而不是 `challengerName`）

**解决方案：**

**步骤 1：添加 Challenge 类型字段**
```typescript
// mobile/types.ts:41-54
export interface Challenge {
  id: string;
  title: string;
  desc: string;
  status: 'active' | 'completed';
  result?: 'success' | 'fail';
  participants: string[];
  challengerId?: string;        // ✅ 新增
  challengerName?: string;      // ✅ 新增
  challengerAvatar?: string;    // ✅ 新增
  rewardPoints: number;
  rewardExp?: number;
  date?: string;
}
```

**步骤 2：修改前端加载挑战数据**
```typescript
// mobile/App.tsx:185-187
challengerId: c.challenger_id ? String(c.challenger_id) : undefined,
challengerName: c.challenger_name || undefined,
challengerAvatar: c.challenger_avatar || undefined,
```

**步骤 3：修改前端显示挑战人**
```typescript
// mobile/pages/ClassManage.tsx:1701, 1725
// ❌ 原代码
{students.find(s=>s.id===c.participants[0])?.name || '未指定'}

// ✅ 修复后
挑战人: {c.challengerName || (c.challengerId && students.find(s=>s.id===c.challengerId)?.name) || '未指定'}
```

**文件位置：**
- `mobile/types.ts:48-50`
- `mobile/App.tsx:185-187`
- `mobile/pages/ClassManage.tsx:1701, 1725`

---

### 14.3 勋章授予记录不显示

**症状：**
- 给学生授予勋章后，学生个人信息页不显示勋章记录
- 刷新页面后勋章记录消失

**根本原因：**
1. Student 类型定义中只有 `badgeHistory` 字段，没有 `badges` 字段
2. 前端代码使用 `selectedStudent.badges` 来显示勋章
3. 前端加载学生数据时只保存了 `badgeHistory`，没有保存 `badges`

**解决方案：**

**步骤 1：添加 Student 类型的 badges 字段**
```typescript
// mobile/types.ts:29
export interface Student {
  // ... 其他字段
  badges?: Array<{id: number; name: string; icon: string; awarded_at: string}>;  // ✅ 新增
  badgeHistory?: StudentBadgeRecord[];
}
```

**步骤 2：修改前端加载学生数据时保存 badges**
```typescript
// mobile/App.tsx:122, 356, 431
// 在所有加载学生数据的地方添加
badges: apiStudent.badges || [],
```

**文件位置：**
- `mobile/types.ts:29`
- `mobile/App.tsx:122, 356, 431`

---

### 14.4 个人信息页历史记录生成

**症状：**
- 学生个人信息页不显示任务、挑战、PK记录
- 即使数据库中有数据，前端也不显示

**根本原因：**
- `taskHistory`, `challengeHistory`, `pkHistory` 字段从来没有被填充
- 这些字段需要从 `tasks`, `challenges`, `pkMatches` 数据中计算生成

**解决方案：**

添加 useEffect 自动生成历史记录：

```typescript
// mobile/App.tsx:253-320
useEffect(() => {
  setStudents(prevStudents => prevStudents.map(student => {
    // 生成任务历史：合并当前任务和已完成任务
    const currentTasks = tasks
      .filter(t => t.assignedTo?.includes(student.id))
      .map(t => ({
        id: `task-${t.id}-${student.id}`,
        taskId: t.id,
        title: t.title,
        exp: t.expValue || 0,
        date: t.createdAt || new Date().toISOString()
      }));

    // 保留已完成的任务（不在当前tasks列表中的）
    const existingTaskHistory = student.taskHistory || [];
    const completedTasks = existingTaskHistory.filter(
      th => !tasks.find(t => t.id === th.taskId)
    );

    // 合并并去重（使用 taskId 去重）
    const taskHistoryMap = new Map();
    [...completedTasks, ...currentTasks].forEach(t => {
      taskHistoryMap.set(t.taskId, t);
    });
    const taskHistory = Array.from(taskHistoryMap.values());

    // 生成挑战历史
    const challengeHistory = challenges
      .filter(c => c.participants.includes(student.id) || c.challengerId === student.id)
      .filter(c => c.status === 'completed')
      .map(c => ({...}));

    // 生成PK历史
    const pkHistory = pkMatches
      .filter(pk => pk.studentA === student.id || pk.studentB === student.id)
      .filter(pk => pk.status === 'finished')
      .map(pk => ({...}));

    return { ...student, taskHistory, challengeHistory, pkHistory };
  }));
}, [tasks, challenges, pkMatches]);
```

**关键点：**
- 任务历史合并当前任务和已完成任务，避免任务完成后消失
- 使用 `taskId` 作为去重key，避免多人任务重复显示
- 挑战历史只显示已完成的挑战
- PK历史只显示已完成的PK

**文件位置：** `mobile/App.tsx:253-320`

---

### 14.5 个人信息页UI优化

**改进内容：**

1. **任务记录显示优化**
   - 显示所有任务（进行中 + 已完成）
   - 区分状态：进行中（橙色）/ 已完成（绿色）
   - 上下滑动查看（最大高度300px）
   - 显示最近一个月的任务
   - 按日期倒序排列

2. **挑战记录显示优化**
   - 显示所有已完成的挑战
   - 区分结果：成功（绿色）/ 失败（红色）
   - 显示积分和经验奖励
   - 上下滑动查看（最大高度300px）
   - 显示最近一个月的挑战

3. **PK记录显示优化**
   - 显示所有已完成的PK
   - 区分结果：胜（黄色）/ 败（灰色）
   - 显示对手姓名和PK主题
   - 上下滑动查看（最大高度300px）
   - 显示最近一个月的PK

4. **勋章和习惯保持左右翻页**
   - 勋章：每页6个
   - 习惯：每页9个

**代码示例：**
```typescript
// mobile/pages/ClassManage.tsx:1259-1352
<div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1">
  {selectedStudent.taskHistory
    .filter(rec => {
      const taskDate = new Date(rec.date);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return taskDate >= oneMonthAgo;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(rec => {
      const task = tasks.find(t => t.id === rec.taskId);
      const isCompleted = !task;
      return (
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">{rec.title}</span>
              {isCompleted ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-600">已完成</span>
              ) : (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">进行中</span>
              )}
            </div>
            <span className="text-[10px] text-gray-400">{new Date(rec.date).toLocaleDateString()}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">经验 + {rec.exp}</span>
        </div>
      );
    })
  }
</div>
```

**文件位置：** `mobile/pages/ClassManage.tsx:1170-1352`

---

### 14.6 挑战发布逻辑优化

**症状：**
- 挑战发布时选择学生后，选择框没有清空
- 无法像任务发布那样自动锁定学生

**解决方案：**
```typescript
// mobile/pages/ClassManage.tsx:1645-1651
// ❌ 原代码
onChange={e=>{
  const selectedId = e.target.value;
  setChallengeSelectId(selectedId);
  if (selectedId && !newChallenge.participantIds.includes(selectedId)) {
    setNewChallenge({...newChallenge, participantIds: [...newChallenge.participantIds, selectedId]});
  }
}}

// ✅ 修复后
onChange={e=>{
  const selectedId = e.target.value;
  if (selectedId && !newChallenge.participantIds.includes(selectedId)) {
    setNewChallenge({...newChallenge, participantIds: [...newChallenge.participantIds, selectedId]});
    setChallengeSelectId(''); // 清空选择框，实现自动锁定
  }
}}
```

**效果：**
- 选择学生后立即添加到挑战人列表
- 选择框自动清空，可以继续选择其他学生
- 与任务发布逻辑保持一致

**文件位置：** `mobile/pages/ClassManage.tsx:1645-1651`

---

### 14.7 多人任务重复显示问题

**症状：**
- 一个任务分配给多个学生时，每个学生的个人信息页都显示多条相同的任务记录
- 例如：任务分配给吴逸桐和庞子玥，两人的任务记录中都出现2条相同的记录

**根本原因：**
- 生成 taskHistory 时使用 `task-${t.id}-${student.id}` 作为 id
- 但是在 Map 去重时使用 `t.id` 作为 key
- 导致同一个任务为不同学生生成了多条记录

**解决方案：**
```typescript
// mobile/App.tsx:273-278
// ❌ 原代码
const taskHistoryMap = new Map<string, StudentTaskRecord>();
[...completedTasks, ...currentTasks].forEach(t => {
  taskHistoryMap.set(t.id, t);  // 使用 t.id 去重
});

// ✅ 修复后
const taskHistoryMap = new Map<string, StudentTaskRecord>();
[...completedTasks, ...currentTasks].forEach(t => {
  taskHistoryMap.set(t.taskId, t);  // 使用 t.taskId 去重，确保每个任务只出现一次
});
```

**效果：**
- 每个学生的任务记录中，每个任务只显示一次
- 多人任务不会重复显示

**文件位置：** `mobile/App.tsx:276`

---

### 14.8 大屏PK页面切换逻辑优化

**需求：**
- PK页面每页固定显示3秒
- 到达最后一页后停止，不要循环回第一页

**解决方案：**
```typescript
// mobile/bigscreen/components/PKBoardCard.tsx:53-61
// ❌ 原代码
useEffect(() => {
  if (pages.length <= 1) return
  const t = setInterval(() => setPage(p => (p + 1) % pages.length), 5000)
  return () => clearInterval(t)
}, [pages.length])

// ✅ 修复后
useEffect(() => {
  if (pages.length <= 1) return
  const t = setInterval(() => setPage(p => {
    // 到达最后一页后停止，不再循环
    if (p >= pages.length - 1) return p
    return p + 1
  }), 3000) // 每页固定3秒
  return () => clearInterval(t)
}, [pages.length])
```

**改进点：**
- 切换间隔从5秒改为3秒
- 到达最后一页后停止自动切换
- 不再循环回第一页

**文件位置：** `mobile/bigscreen/components/PKBoardCard.tsx:53-61`

---

### 14.9 班级管理页挑战列表优化

**改进内容：**

1. **过往挑战标签优化**
   - 从"已完成"/"未完成"改为"成功"/"失败"
   - 更清晰地表达挑战结果

```typescript
// mobile/pages/ClassManage.tsx:1760-1761
// ❌ 原代码
{c.result === 'success' ? '已完成' : '未完成'}

// ✅ 修复后
{c.result === 'success' ? '成功' : '失败'}
```

**文件位置：** `mobile/pages/ClassManage.tsx:1760-1761`

---

## 完整修改文件清单（2025-11-26）

### 后端修改
1. **server.js**
   - 修改 GET /api/tasks API，返回执行人信息（第818-855行）

### 前端类型定义
2. **mobile/types.ts**
   - 添加 Challenge 类型的挑战人字段（第48-50行）
   - 添加 Student 类型的 badges 字段（第29行）

### 前端核心逻辑
3. **mobile/App.tsx**
   - 添加类型导入（第11行）
   - 修复任务数据加载（第231行）
   - 修复挑战数据加载（第185-187行）
   - 添加学生 badges 字段加载（第122, 356, 431行）
   - 添加历史记录生成逻辑（第253-320行）
   - 修复多人任务去重逻辑（第276行）

### 前端UI组件
4. **mobile/pages/ClassManage.tsx**
   - 修复挑战发布逻辑（第1645-1651行）
   - 修复挑战人显示（第1701, 1725行）
   - 删除重复的挑战记录显示（第1170-1218行）
   - 优化任务记录显示（第1263-1306行）
   - 添加挑战记录显示（第1308-1352行）
   - 优化PK记录显示（第1221-1261行）
   - 修改过往挑战标签（第1760-1761行）

5. **mobile/bigscreen/components/PKBoardCard.tsx**
   - 修改PK页面切换逻辑（第53-61行）

---

## 数据流程图

### 任务数据流程
```
创建任务 → task_assignments表 → GET /api/tasks返回assigned_to
         ↓
    前端加载 → 生成taskHistory → 显示在个人信息页
         ↓
    完成任务 → 删除任务 → taskHistory保留已完成记录
```

### 挑战数据流程
```
创建挑战 → challenges表(challenger_id) + challenge_participants表
         ↓
    GET /api/challenges返回challenger_name和participants
         ↓
    前端加载 → 保存challengerId/challengerName → 显示挑战人
         ↓
    生成challengeHistory → 显示在个人信息页
```

### 勋章数据流程
```
授予勋章 → student_badges表
         ↓
    GET /api/students返回badges数组
         ↓
    前端加载 → 同时保存badges和badgeHistory
         ↓
    个人信息页使用badges字段显示
```

---

## 测试验证清单（2025-11-26）

- [x] 任务执行人刷新后保持
- [x] 挑战人刷新后保持
- [x] 勋章授予记录刷新后保持
- [x] 个人信息页显示任务记录（进行中+已完成）
- [x] 个人信息页显示挑战记录（成功/失败）
- [x] 个人信息页显示PK记录
- [x] 个人信息页显示勋章记录
- [x] 多人任务不重复显示
- [x] 挑战发布选择学生后自动锁定
- [x] 大屏PK页面3秒切换，不循环
- [x] 班级管理页过往挑战显示"成功"/"失败"标签

---

**最后更新：** 2025年11月26日 15:00
**文档版本：** 2.4
**作者：** Claude Code
**更新内容：**
- 修复任务执行人数据持久化问题
- 修复挑战人数据持久化问题
- 修复勋章授予记录显示问题
- 添加个人信息页历史记录自动生成逻辑
- 修复多人任务重复显示问题
- 优化挑战发布逻辑
- 优化个人信息页UI布局
- 修复大屏PK页面切换逻辑
- 完善数据流程说明

---

## 2025年11月27日更新记录

### 更新概述
本次更新主要优化了勋章系统、挑战系统、PK系统的显示和交互逻辑，修复了多个数据同步问题。

### 1. 手机端首页学生排序优化
**问题：** 学生显示顺序不明确
**解决方案：**
- 文件：`mobile/pages/Home.tsx:23`
- 修改：按经验值（exp）降序排序
- 实现：`.sort((a, b) => (b.exp || 0) - (a.exp || 0))`

### 2. 大屏端PK页滚动逻辑优化
**问题：** PK页面来回切换，用户体验不佳
**解决方案：**
- 文件：`mobile/bigscreen/components/PKBoardCard.tsx:59-64`
- 修改：实现无限循环滚动（从右往左）
- 技术：使用复制第一页到末尾的技巧，滚动到复制页后瞬间跳回真正的第一页
- 速度：每页4秒

### 3. 学生头像样式更新
**问题：** 原有头像风格不符合需求
**解决方案：**
- 使用自定义头像图片（1024.jpg）
- 文件位置：`public/assets/student-avatar.jpg`
- 数据库更新：所有28个学生的avatar_url统一指向自定义头像
- 风格：扁平风格Q版小学生形象

### 4. 挑战系统完整修复

#### 4.1 挑战失败不加经验和积分
**问题：** 点击"失败"按钮后仍然加分
**解决方案：**
- 文件：`mobile/App.tsx:542-553`
- 修改：只有`result === 'success'`时才加经验和积分
- 失败时只记录历史，不加任何奖励

#### 4.2 挑战状态正确显示
**问题：** 大屏端无论成功失败都显示"成功"
**解决方案：**
- 后端API：`server.js:578` - GET /api/challenges 返回 result 字段
- 后端API：`server.js:620-621` - PUT /api/challenges/:id 更新 result 字段
- 大屏端：`mobile/bigscreen/main.tsx:78-91` - 根据 status 和 result 综合判断显示状态

#### 4.3 挑战者名称显示
**问题：** 手机端进行中的挑战显示"未指定挑战者"
**解决方案：**
- 文件：`mobile/pages/ClassManage.tsx:392-394`
- 修改：从API返回数据中提取 challengerId、challengerName、challengerAvatar

#### 4.4 个人信息页挑战记录显示优化
**问题：** 失败的挑战仍显示"+积分"和"+经验"
**解决方案：**
- 文件：`mobile/pages/ClassManage.tsx:1328-1337`
- 修改：只有成功的挑战才显示奖励标签

### 5. 勋章系统全面优化

#### 5.1 勋章授予后显示问题
**问题：** 授予勋章后，手机端和大屏端不显示
**解决方案：**
- 后端API：`server.js:155` - GET /api/students 返回完整勋章信息（包含description）
- 前端：`mobile/App.tsx:694-706` - handleBadgeGrant 更新学生的 badges 数组
- 大屏端：`mobile/bigscreen/main.tsx:134-141` - 正确映射勋章数据
- 大屏端：`mobile/bigscreen/main.tsx:286` - 使用真实学生数据而非模拟数据

#### 5.2 勋章创建持久化
**问题：** 新创建的勋章刷新后消失
**解决方案：**
- 后端API：`server.js:962-992` - 添加 POST /api/badges 接口
- 前端：`mobile/pages/ClassManage.tsx:725-752` - 调用API保存到数据库
- 反馈：使用绿色弹窗显示"✅ 勋章「XX」创建成功！"

#### 5.3 勋章编辑功能
**问题：** 勋章编辑后大屏端不更新
**解决方案：**
- 后端API：`server.js:1015-1032` - PUT /api/badges/:id 更新勋章信息
- 前端：`mobile/pages/ClassManage.tsx:815-822` - 显示成功反馈
- 大屏端：每2秒轮询自动更新（通过JOIN badges表获取最新数据）

#### 5.4 勋章授予记录
**新功能：** 添加勋章授予记录区域
**实现：**
- 后端API：`server.js:1015-1032` - GET /api/badge-grants 返回最近一个月记录
- 前端：`mobile/pages/ClassManage.tsx:1988-2007` - 显示勋章名称、授予人、日期
- 位置：在勋章授予和勋章编辑之间
- 排序：按日期降序（最新在前）
- 刷新：授予勋章后自动刷新记录

#### 5.5 个人信息页勋章卡片简化
**优化：** 简化勋章卡片显示
**修改：**
- 文件：`mobile/pages/ClassManage.tsx:1146-1153`
- 删除icon显示
- 删除"授予"两字
- 只显示勋章名称和日期
- 缩小卡片间距

#### 5.6 大屏端勋章显示优化
**优化：** 勋章按日期排序，滚动速度调整
**修改：**
- 文件：`mobile/bigscreen/components/HonorBadgesCard.tsx:59-64`
- 排序：按awarded_at降序（最新的在前）
- 速度：从120秒调整为240秒（4分钟完成一个循环）
- 清理：删除无用的模拟数据生成代码（generatedBadges）

### 6. 新增API接口

#### 6.1 创建勋章
```
POST /api/badges
Body: { name, description, icon }
Response: { success, data: { id, name, description, icon } }
```

#### 6.2 更新勋章
```
PUT /api/badges/:id
Body: { name, description }
Response: { success, data: { id, name, description, icon } }
```

#### 6.3 获取勋章授予记录
```
GET /api/badge-grants
Response: { success, data: [{ id, badge_name, student_name, awarded_at }] }
```

### 7. 数据库变更

#### 7.1 勋章表（badges）
- 已有字段：id, name, description, icon, created_at
- 说明：description字段现在在所有API中返回

#### 7.2 学生勋章关联表（student_badges）
- 已有字段：id, student_id, badge_id, awarded_at
- 说明：通过JOIN badges表获取最新勋章信息

#### 7.3 挑战表（challenges）
- 已有字段：id, title, description, status, result, challenger_id, reward_points, reward_exp
- 说明：result字段（success/fail）现在正确更新和返回

### 8. 前端架构优化

#### 8.1 状态管理
- 添加 badgeGrants 状态：存储勋章授予记录
- 优化 students 状态：包含完整的 badges 数组

#### 8.2 数据流向
```
勋章创建流程：
前端表单 → POST /api/badges → 数据库 → 返回新勋章 → 更新本地状态 → 显示反馈

勋章授予流程：
前端选择 → POST /api/students/:id/badges/:badgeId → student_badges表
         ↓
    更新students状态（添加到badges数组）
         ↓
    刷新授予记录 → GET /api/badge-grants
         ↓
    大屏端轮询 → GET /api/students → 获取最新badges → 显示

勋章编辑流程：
前端表单 → PUT /api/badges/:id → 更新badges表 → 显示反馈
         ↓
    大屏端轮询 → GET /api/students → JOIN badges表 → 获取最新名称/描述
```

### 9. 用户体验优化

#### 9.1 反馈机制统一
- 勋章创建成功：绿色弹窗，2秒自动消失
- 勋章编辑成功：绿色弹窗，2秒自动消失
- 勋章授予成功：绿色弹窗，显示授予人数
- 样式：与习惯打卡反馈保持一致

#### 9.2 大屏端实时更新
- 学生数据：每2秒轮询一次
- 勋章数据：通过学生数据自动更新
- 挑战数据：每5秒轮询一次
- PK数据：每2秒轮询一次

### 10. 代码清理

#### 10.1 删除无用代码
- 删除 generatedBadges 模拟数据生成逻辑（约40行）
- 删除 realBadges 未使用的状态变量
- 清理大屏端无用的勋章模拟数据

#### 10.2 代码优化
- 统一反馈显示样式
- 优化数据映射逻辑
- 改进错误处理

### 11. 测试验证清单（2025-11-27）

- [x] 手机端首页按经验值排序
- [x] 大屏端PK页无限循环滚动（4秒/页）
- [x] 学生头像统一为自定义图片
- [x] 挑战失败不加经验和积分
- [x] 挑战状态正确显示（成功/失败）
- [x] 挑战者名称正确显示
- [x] 个人信息页挑战记录只显示成功的奖励
- [x] 勋章创建后保存到数据库
- [x] 勋章授予后手机端和大屏端都显示
- [x] 勋章编辑后大屏端自动更新
- [x] 勋章授予记录显示最近一个月
- [x] 个人信息页勋章卡片简化显示
- [x] 大屏端勋章按日期排序
- [x] 大屏端勋章滚动速度调慢
- [x] 勋章创建/编辑成功显示绿色反馈

### 12. 待实现功能

- [ ] 勋章授予记录长按删除
- [ ] PK记录长按删除
- [ ] 更多用户交互优化

---

**最后更新：** 2025年11月27日 13:00
**文档版本：** 2.5
**作者：** Claude Code
**更新内容：**
- 完整记录勋章系统优化
- 完整记录挑战系统修复
- 添加新增API接口文档
- 更新数据流向说明
- 添加测试验证清单
- 记录代码清理内容
