# 📋 Growark 项目完整代码审查报告

**项目名称**: Classroom Hero (教师端) - 学生积分管理系统改版
**审查时间**: 2025-11-22
**审查人**: Claude Code
**严重程度**: 🔴 **高优先级** - 核心功能断开

---

## 📑 目录

1. [架构分析](#架构分析)
2. [核心问题分析](#核心问题分析)
3. [数据打通缺陷对比](#数据打通缺陷对比)
4. [三端同步完整实现方案](#三端同步完整实现方案)
5. [具体修复步骤](#具体修复步骤)
6. [数据流完整图](#数据流完整图)
7. [信息需求清单](#信息需求清单)

---

## 🔍 架构分析

你的项目是一个 **Classroom Hero** 教师端教学管理系统，包含三个端：

| 端点 | 技术栈 | 当前状态 | 问题严重程度 |
|------|---------|---------|-----------|
| **手机端** | React 18 + Vite + React Router | 本地状态管理 | 🔴 高 |
| **大屏端** | React 18 + Vite + 独立工程 | Mock 数据 | 🔴 高 |
| **后端** | 缺失 | 无数据库连接 | 🔴 严重 |

### 项目结构

```
growark/
├── 手机端源码（根目录）
│   ├── App.tsx              (主应用，全是本地状态)
│   ├── pages/
│   │   ├── Home.tsx         (学生列表页)
│   │   ├── ClassManage.tsx  (班级管理-含挑战、任务、PK)
│   │   ├── Habits.tsx       (习惯打卡页)
│   │   └── Settings.tsx     (设置页)
│   ├── services/
│   │   ├── mockData.ts      (静态模拟数据)
│   │   └── geminiService.ts (AI 相关)
│   └── components/
│       └── ActionSheet.tsx  (评分弹窗)
│
└── bigscreen/               (大屏端独立工程)
    ├── main.tsx             (初始加载一次，无订阅)
    ├── services/
    │   └── sealosService.ts (全是空实现)
    ├── api/                 (空文件夹，无实现)
    │   ├── award-badge.ts
    │   ├── create-teacher.ts
    │   └── update-student.ts
    └── components/
        ├── StudentLeaderboard.tsx
        ├── ChallengeArenaCard.tsx
        └── ... 其他展示组件
```

---

## 🚨 核心问题分析

### **问题 1: 手机端数据流完全断开** 🔴 严重

#### 现状分析

**App.tsx 中的问题 (行 92-109)**:

```typescript
// ❌ 硬编码的学生数据初始化
useEffect(() => {
  const names = ['庞子玮','刘凡兮',...]; // 硬编码名字
  const cls = ['三年一班','三年二班','三年三班'];
  const arr: Student[] = names.map((name, i) => ({
    id: `${i+1}`,
    name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    points: 0,      // 初始积分固定为 0
    exp: 0,
    level: 1,
    className: cls[i % cls.length],
    habitStats: Object.fromEntries(MOCK_HABITS.map(h => [h.id, 0]))
  }));
  setStudents(arr);  // ❌ 只在本地状态，没有数据库调用
  setPkMatches([]);
  setChallenges([]);
  setTasks([]);
}, []);
```

**handleUpdateScore 的问题 (行 117-129)**:

```typescript
const handleUpdateScore = (ids: string[], points: number, reason: string, exp?: number) => {
  setStudents(prev => prev.map(s => {
    if (ids.includes(s.id)) {
      const newPoints = s.points + points;  // ❌ 只在内存中修改
      const additionalExp = exp !== undefined ? exp : (points > 0 ? Math.abs(points * 10) : 0);
      const newExp = s.exp + additionalExp;
      const newLevel = calcLevelFromExp(newExp);
      console.log(`[WS-Mock] POINTS_UPDATED: Student ${s.name} points ${points}, exp ${additionalExp}. Total: ${newPoints}`);
      // ❌ 没有任何数据库调用
      // ❌ 没有 API 请求
      return { ...s, points: newPoints, exp: newExp, level: newLevel };
    }
    return s;
  }));
};
```

#### 影响范围

| 操作 | 是否保存 | 数据库 | 备注 |
|------|---------|---------|------|
| 创建学生 | ❌ | ❌ | `ClassManage.tsx` 中创建的学生只在内存中 |
| 加分/减分 | ❌ | ❌ | 手机端显示更新，但数据丢失 |
| 完成挑战 | ❌ | ❌ | `handleChallengeStatus` 只在内存修改 |
| 完成任务 | ❌ | ❌ | `handleCompleteTask` 只在内存修改 |
| PK 结果 | ❌ | ❌ | `handlePKWinner` 只在内存修改 |
| 授予勋章 | ❌ | ❌ | `handleBadgeGrant` 只在内存修改 |

**关键风险**:
- 🔴 **刷新页面 = 所有数据丢失**
- 🔴 **手机端关闭 = 无法查看历史数据**
- 🔴 **无法与大屏同步**

---

### **问题 2: 大屏端完全无实时更新** 🔴 严重

#### 现状分析

**bigscreen/main.tsx 中的问题 (行 21-29)**:

```typescript
useEffect(() => {
  // ❌ 一次性加载，没有订阅
  Promise.all([
    getTeams(),
    getStudents(),
    getChallenges(),
    getPKs(7),
    getRecentTasks(7)
  ]).then(([t, s, c, p, tk]) => {
    setTeams(t);
    setStudents(s);
    setChallenges(c);
    setPks(p);
    setTasks(tk);
  });
}, []); // ❌ 空依赖数组 = 只执行一次
```

**sealosService.ts 中的问题 (全文)**:

```typescript
// ❌ 所有数据都是静态 mock 数据，没有真实数据源

// 假实现
export const getStudents = async (): Promise<Student[]> => students;
export const getTeams = async (): Promise<Team[]> => teams;
export const getChallenges = async (): Promise<Challenge[]> => challenges;
export const getBadges = async (): Promise<Record<string, Badge[]>> => {
  // 这只是返回 mock 数据
  ...
};

// ❌ 这些订阅函数全是空的！
export const subscribeToStudentChanges = (_: (payload: { updatedStudents: Student[] }) => void) => () => {};
export const subscribeToChallengeChanges = (_: (updated: Challenge[]) => void) => () => {};
export const subscribeToPKChanges = (_: (updated: PKMatch[]) => void) => () => {};
export const subscribeToTaskChanges = (_: (updated: StudentTask[]) => void) => () => {};
// ❌ 都返回空函数，没有实现！
```

#### 影响范围

**场景**: 用户在手机端给学生加分
1. 手机端显示更新 ✅
2. 数据库保存 ❌
3. 大屏端更新 ❌
4. 大屏需要手动刷新才能看到最新数据

**结果**: 大屏展示的数据是**过时的**，无法用于实时排名展示

---

### **问题 3: 缺少真实后端 API** 🔴 严重

#### 现状

**bigscreen/api/ 文件夹**:

```
api/
├── award-badge.ts      (空文件)
├── create-teacher.ts   (空文件)
└── update-student.ts   (空文件)
```

这些文件存在，但没有实现任何逻辑。

#### 问题

- 没有数据库连接
- 没有数据持久化
- 没有 WebSocket 实现
- 没有身份验证
- 没有错误处理

---

## 📊 数据打通缺陷对比

### 对比表

| 操作 | 手机端状态 | 写入数据库 | 大屏端显示 | 实时同步 | 状态 |
|------|---------|----------|---------|--------|------|
| 创建学生 | ✅ | ❌ | ❌ | ❌ | **完全断开** |
| 添加积分 | ✅ | ❌ | ❌ | ❌ | **完全断开** |
| 减少积分 | ✅ | ❌ | ❌ | ❌ | **完全断开** |
| 创建挑战 | ✅ | ❌ | ❌ | ❌ | **完全断开** |
| 完成挑战 | ✅ | ❌ | ❌ | ❌ | **完全断开** |
| 创建 PK | ✅ | ❌ | ❌ | ❌ | **完全断开** |
| 完成任务 | ✅ | ❌ | ❌ | ❌ | **完全断开** |
| 授予勋章 | ✅ | ❌ | ❌ | ❌ | **完全断开** |
| 查看排行榜 | ✅ | N/A | ❌ 过时数据 | ❌ | **显示过时** |

### 数据生命周期

```
┌─────────────────────────────────────────────┐
│  手机端本地状态                              │
│  (React State - 内存中)                      │
└─────────────────────────────────────────────┘
                    ↓
            ❌ 无持久化
                    ↓
        (刷新页面后全部丢失)
                    ↓
        ❌ 数据库未更新
                    ↓
        ❌ 大屏看不到
```

---

## ✅ 三端同步完整实现方案

### 目标架构

```
┌────────────────────────────────────────────────────────────────┐
│                   Sealos 云平台 (公网)                          │
│                                                                 │
│  ┌─────────────────────┐    ┌──────────────────────────────┐  │
│  │  Express.js 后端    │◄──►│  PostgreSQL 数据库            │  │
│  │  (Node.js)          │    │  - students                  │  │
│  │                     │    │  - challenges, tasks, pks   │  │
│  │  功能:              │    │  - badges, teams, habits    │  │
│  │  • REST API         │    │  - score_history           │  │
│  │  • WebSocket        │    └──────────────────────────────┘  │
│  │  • 数据验证         │                                       │
│  │  • 实时推送         │                                       │
│  └────────┬────────────┘                                       │
└───────────┼────────────────────────────────────────────────┘
            │ HTTP + WebSocket
   ┌────────┴─────┬────────────┬──────────────┐
   │              │            │              │
   ▼              ▼            ▼              ▼
┌────────┐    ┌────────┐  ┌──────────┐  ┌──────────┐
│手机端  │    │大屏端  │  │管理后台  │  │第三方    │
│React   │    │React   │  │(可选)    │  │集成      │
│实时同步│    │实时订阅│  │         │  │         │
└────────┘    └────────┘  └──────────┘  └──────────┘
```

---

### 🔧 第一阶段: 后端 API 建设

#### 1.1 核心 API 端点设计

**学生管理 API** (`/api/students`)

```javascript
// POST /api/students
// 创建新学生
Request: {
  "name": "张三",
  "className": "三年一班",
  "teamId": "t1",
  "initialPoints": 0
}
Response: {
  "id": "uuid",
  "name": "张三",
  "className": "三年一班",
  "points": 0,
  "exp": 0,
  "level": 1,
  "teamId": "t1",
  "createdAt": "2025-11-22T10:00:00Z"
}

// GET /api/students
// 获取所有学生
Response: [
  { "id": "1", "name": "张三", "points": 100, "exp": 500, ... },
  ...
]

// GET /api/students/:id
// 获取单个学生详情
Response: {
  "id": "1",
  "name": "张三",
  "points": 100,
  "exp": 500,
  "level": 5,
  "challengeHistory": [...],
  "pkHistory": [...],
  "badgeHistory": [...]
}

// PUT /api/students/:id
// 更新学生信息
Request: {
  "points": 105,
  "exp": 510,
  "name": "张三三"
}
Response: { ...更新后的学生信息... }

// DELETE /api/students/:id
// 删除学生
Response: { "success": true }
```

**积分操作 API** (`/api/scores`)

```javascript
// POST /api/scores/add
// 添加积分（带操作记录）
Request: {
  "studentIds": ["1", "2"],
  "points": 50,
  "exp": 100,
  "reason": "完成挑战",
  "category": "challenge_success"
}
Response: {
  "updated": [
    { "id": "1", "points": 150, "exp": 600, "level": 5 },
    { "id": "2", "points": 155, "exp": 605, "level": 5 }
  ],
  "records": [...]
}

// GET /api/scores/history/:studentId
// 查看学生积分历史
Response: [
  {
    "id": "record-1",
    "studentId": "1",
    "points": 50,
    "exp": 100,
    "reason": "完成挑战",
    "timestamp": "2025-11-22T10:05:00Z"
  },
  ...
]
```

**挑战管理 API** (`/api/challenges`)

```javascript
// POST /api/challenges
// 创建挑战
Request: {
  "title": "一周阅读挑战",
  "description": "完成5本书的阅读",
  "participantIds": ["1", "2", "3"],
  "rewardPoints": 100,
  "rewardExp": 200,
  "status": "active"
}
Response: { "id": "c1", ...挑战信息... }

// PUT /api/challenges/:id/complete
// 完成挑战
Request: {
  "result": "success" // 或 "fail"
}
Response: {
  "challenge": { ...更新的挑战... },
  "updatedStudents": [...]  // 被更新的学生列表
}
```

**PK 比赛 API** (`/api/pk-matches`)

```javascript
// POST /api/pk-matches
// 创建 PK
Request: {
  "studentAId": "1",
  "studentBId": "2",
  "topic": "背诗词"
}
Response: { "id": "pk1", ...PK 信息... }

// PUT /api/pk-matches/:id/result
// 提交 PK 结果
Request: {
  "winnerId": "1"
}
Response: {
  "pk": { ...更新的 PK... },
  "updatedStudents": [...]
}
```

#### 1.2 WebSocket 实时推送

```javascript
// 连接
ws://your-server.com/ws?token=xxx

// 消息格式
{
  "type": "student:score-updated",
  "payload": {
    "studentId": "1",
    "points": 150,
    "exp": 600,
    "level": 5
  }
}

// 支持的事件类型
- student:created
- student:updated
- student:deleted
- student:score-updated
- challenge:created
- challenge:completed
- pk:completed
- task:completed
- badge:awarded
- team:created
- team:updated
```

---

### 🔄 第二阶段: 手机端集成

#### 2.1 创建 API 服务层

**文件: `services/api.ts` (新建)**

```typescript
// 环境配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-sealos-api.com/api';
const WS_URL = process.env.REACT_APP_WS_URL || 'wss://your-sealos-api.com/ws';

// 请求拦截器
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// 学生 API
export const studentAPI = {
  // 创建学生
  async createStudent(data: {
    name: string;
    className: string;
    teamId?: string;
  }) {
    return fetchWithAuth(`${API_BASE_URL}/students`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // 获取所有学生
  async getAllStudents() {
    return fetchWithAuth(`${API_BASE_URL}/students`);
  },

  // 获取单个学生
  async getStudent(studentId: string) {
    return fetchWithAuth(`${API_BASE_URL}/students/${studentId}`);
  },

  // 更新学生
  async updateStudent(studentId: string, data: Partial<Student>) {
    return fetchWithAuth(`${API_BASE_URL}/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // 删除学生
  async deleteStudent(studentId: string) {
    return fetchWithAuth(`${API_BASE_URL}/students/${studentId}`, {
      method: 'DELETE'
    });
  }
};

// 积分 API
export const scoreAPI = {
  // 添加积分
  async addScore(studentIds: string[], points: number, exp: number, reason: string) {
    return fetchWithAuth(`${API_BASE_URL}/scores/add`, {
      method: 'POST',
      body: JSON.stringify({
        studentIds,
        points,
        exp,
        reason,
        category: 'manual'
      })
    });
  },

  // 获取积分历史
  async getScoreHistory(studentId: string) {
    return fetchWithAuth(`${API_BASE_URL}/scores/history/${studentId}`);
  }
};

// 挑战 API
export const challengeAPI = {
  async createChallenge(data: any) {
    return fetchWithAuth(`${API_BASE_URL}/challenges`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getAllChallenges() {
    return fetchWithAuth(`${API_BASE_URL}/challenges`);
  },

  async updateChallengeStatus(challengeId: string, result: 'success' | 'fail') {
    return fetchWithAuth(`${API_BASE_URL}/challenges/${challengeId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ result })
    });
  }
};

// 类似实现 pkAPI, taskAPI, badgeAPI...
```

#### 2.2 改造 App.tsx 的状态管理

**主要改动 (App.tsx)**:

```typescript
// ❌ 原来的方式
const handleUpdateScore = (ids: string[], points: number, reason: string, exp?: number) => {
  setStudents(prev => prev.map(s => {
    if (ids.includes(s.id)) {
      // 只在内存中修改
      return { ...s, points: s.points + points };
    }
    return s;
  }));
};

// ✅ 改为
const handleUpdateScore = async (ids: string[], points: number, reason: string, exp?: number) => {
  try {
    // 立即更新 UI (乐观更新)
    setStudents(prev => prev.map(s => {
      if (ids.includes(s.id)) {
        const additionalExp = exp !== undefined ? exp : (points > 0 ? Math.abs(points * 10) : 0);
        return {
          ...s,
          points: s.points + points,
          exp: s.exp + additionalExp,
          level: calcLevelFromExp(s.exp + additionalExp)
        };
      }
      return s;
    }));

    // 向后端提交
    const result = await scoreAPI.addScore(
      ids,
      points,
      exp ?? (points > 0 ? Math.abs(points * 10) : 0),
      reason
    );

    // 如果服务器响应不同，更新为服务器数据
    if (result.updated) {
      setStudents(prev => {
        const updated = new Map(result.updated.map((s: Student) => [s.id, s]));
        return prev.map(s => updated.get(s.id) || s);
      });
    }
  } catch (error) {
    console.error('Failed to update score:', error);
    // 恢复到之前的状态
    setStudents(prev => prev.map(s => {
      if (ids.includes(s.id)) {
        return { ...s, points: s.points - points };
      }
      return s;
    }));
    // 显示错误提示
    alert('操作失败，请重试');
  }
};

// 初始化时改为从数据库加载
useEffect(() => {
  const loadStudents = async () => {
    try {
      const data = await studentAPI.getAllStudents();
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students:', error);
      // 降级处理：使用本地数据
      const names = [...]; // 备用名字列表
      setStudents(names.map((name, i) => ({...})));
    }
  };

  loadStudents();
}, []);
```

#### 2.3 添加错误处理和加载状态

```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// 在所有 API 调用处加入 try-catch 和加载状态指示
const handleCreateStudent = async (name: string, className: string) => {
  setIsLoading(true);
  setError(null);
  try {
    const newStudent = await studentAPI.createStudent({ name, className });
    setStudents(prev => [...prev, newStudent]);
    setToastMsg(`${name} 创建成功`);
  } catch (err) {
    setError('创建学生失败，请检查网络连接');
  } finally {
    setIsLoading(false);
  }
};
```

---

### 📡 第三阶段: 大屏端实时订阅

#### 3.1 实现 WebSocket 连接

**文件: `bigscreen/services/websocket.ts` (新建)**

```typescript
type MessageCallback = (data: any) => void;

interface Subscribers {
  'student:updated': MessageCallback[];
  'challenge:updated': MessageCallback[];
  'pk:updated': MessageCallback[];
  'task:updated': MessageCallback[];
  'badge:awarded': MessageCallback[];
}

let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

const subscribers: Subscribers = {
  'student:updated': [],
  'challenge:updated': [],
  'pk:updated': [],
  'task:updated': [],
  'badge:awarded': []
};

export function connectWebSocket(token?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }

    const wsUrl = `${process.env.REACT_APP_WS_URL || 'wss://your-sealos-api.com/ws'}${token ? `?token=${token}` : ''}`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts = 0;
        resolve();
      };

      ws.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);

          // 分发消息给订阅者
          if (type in subscribers) {
            subscribers[type as keyof Subscribers].forEach(callback => {
              try {
                callback(payload);
              } catch (err) {
                console.error('Callback error:', err);
              }
            });
          }
        } catch (err) {
          console.error('Message parse error:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        ws = null;
        attemptReconnect();
      };
    } catch (error) {
      reject(error);
    }
  });
}

function attemptReconnect() {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(`Reconnecting... (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    setTimeout(() => {
      connectWebSocket().catch(() => {}); // 忽略错误，让函数自动重试
    }, RECONNECT_DELAY);
  }
}

export function subscribe(eventType: keyof Subscribers, callback: MessageCallback) {
  subscribers[eventType].push(callback);
  return () => {
    subscribers[eventType] = subscribers[eventType].filter(cb => cb !== callback);
  };
}

export function disconnect() {
  if (ws) {
    ws.close();
    ws = null;
  }
}
```

#### 3.2 改造 sealosService.ts

**文件: `bigscreen/services/sealosService.ts` (改造)**

```typescript
import { Student, Team, Challenge, Badge } from '../types'
import { connectWebSocket, subscribe, disconnect } from './websocket'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-sealos-api.com/api';

// 缓存数据
let cachedData = {
  students: [] as Student[],
  teams: [] as Team[],
  challenges: [] as Challenge[],
  badges: [] as Badge[],
  lastUpdated: 0
};

// ✅ 改造后的真实实现

export const getStudents = async (): Promise<Student[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/students`);
    const data = await response.json();
    cachedData.students = data;
    return data;
  } catch (error) {
    console.error('Failed to get students:', error);
    return cachedData.students; // 返回缓存数据
  }
};

export const getTeams = async (): Promise<Team[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/teams`);
    const data = await response.json();
    cachedData.teams = data;
    return data;
  } catch (error) {
    console.error('Failed to get teams:', error);
    return cachedData.teams;
  }
};

export const getChallenges = async (): Promise<Challenge[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/challenges`);
    const data = await response.json();
    cachedData.challenges = data;
    return data;
  } catch (error) {
    console.error('Failed to get challenges:', error);
    return cachedData.challenges;
  }
};

// ✅ 实现真实的订阅

export const subscribeToStudentChanges = (callback: (students: Student[]) => void) => {
  return subscribe('student:updated', (payload) => {
    // 更新缓存
    if (Array.isArray(payload)) {
      cachedData.students = payload;
    } else {
      // 单个学生更新
      const index = cachedData.students.findIndex(s => s.id === payload.id);
      if (index >= 0) {
        cachedData.students[index] = payload;
      }
    }
    callback(cachedData.students);
  });
};

export const subscribeToChallengeChanges = (callback: (challenges: Challenge[]) => void) => {
  return subscribe('challenge:updated', (payload) => {
    cachedData.challenges = payload;
    callback(cachedData.challenges);
  });
};

export const subscribeToPKChanges = (callback: (pks: any[]) => void) => {
  return subscribe('pk:updated', callback);
};

export const subscribeToTaskChanges = (callback: (tasks: any[]) => void) => {
  return subscribe('task:updated', callback);
};

// 初始化函数
export const initializeWebSocket = async (token?: string) => {
  try {
    await connectWebSocket(token);
  } catch (error) {
    console.error('Failed to connect WebSocket:', error);
  }
};

export const disconnectWebSocket = () => {
  disconnect();
};
```

#### 3.3 改造 bigscreen/main.tsx

**主要改动**:

```typescript
import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Header from './components/Header'
import LeaderboardCard from './components/LeaderboardCard'
import StudentLeaderboard from './components/StudentLeaderboard'
import TeamLeaderboard from './components/TeamLeaderboard'
import TeamTicker from './components/TeamTicker'
import ChallengeArenaCard from './components/ChallengeArenaCard'
import HonorBadgesCard from './components/HonorBadgesCard'
import PKBoardCard from './components/PKBoardCard'
import { Student, Team, Challenge } from './types'
import {
  getStudents,
  getTeams,
  getChallenges,
  getBadges,
  getPKs,
  getRecentTasks,
  // ✅ 新增导入
  subscribeToStudentChanges,
  subscribeToChallengeChanges,
  subscribeToPKChanges,
  subscribeToTaskChanges,
  initializeWebSocket,
  disconnectWebSocket
} from './services/sealosService'

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [pks, setPks] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // ✅ 连接 WebSocket
        await initializeWebSocket();
        setConnectionStatus('connected');

        // ✅ 初始加载数据
        const [t, s, c, p, tk] = await Promise.all([
          getTeams(),
          getStudents(),
          getChallenges(),
          getPKs(7),
          getRecentTasks(7)
        ]);

        setTeams(t);
        setStudents(s);
        setChallenges(c);
        setPks(p);
        setTasks(tk);

        // ✅ 订阅实时更新
        const unsubStudents = subscribeToStudentChanges((updatedStudents) => {
          console.log('Students updated:', updatedStudents);
          setStudents(updatedStudents);
        });

        const unsubChallenges = subscribeToChallengeChanges((updatedChallenges) => {
          console.log('Challenges updated:', updatedChallenges);
          setChallenges(updatedChallenges);
        });

        const unsubPKs = subscribeToPKChanges((updatedPks) => {
          console.log('PKs updated:', updatedPks);
          setPks(updatedPks);
        });

        const unsubTasks = subscribeToTaskChanges((updatedTasks) => {
          console.log('Tasks updated:', updatedTasks);
          setTasks(updatedTasks);
        });

        // 清理函数
        return () => {
          unsubStudents();
          unsubChallenges();
          unsubPKs();
          unsubTasks();
          disconnectWebSocket();
        };
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setConnectionStatus('disconnected');
      }
    };

    const cleanup = initializeApp();
    cleanup && cleanup.then(cb => cb?.());

    return () => {
      cleanup?.then(cb => cb?.());
    };
  }, []);

  const teamsMap = useMemo(() => new Map<string, Team>(teams.map(t => [t.id, t])), [teams])
  const sortedByExp = useMemo(() => [...students].sort((a, b) => b.total_exp - a.total_exp), [students])

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white p-4 flex flex-col overflow-hidden">
      {/* ✅ 添加连接状态指示器 */}
      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold ${
        connectionStatus === 'connected' ? 'bg-green-500' :
        connectionStatus === 'connecting' ? 'bg-yellow-500' :
        'bg-red-500'
      }`}>
        {connectionStatus === 'connected' ? '🟢 实时连接' :
         connectionStatus === 'connecting' ? '🟡 连接中...' :
         '🔴 连接断开'}
      </div>

      <Header />
      <main className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
        <div className="lg:col-span-2 h-full min-h-0">
          <LeaderboardCard title="等级大厅" rightSlot={<TeamTicker students={students} teams={teams} sortBy="total_exp" unit="经验" />}>
            <StudentLeaderboard students={sortedByExp} teamsMap={teamsMap} onAvatarChange={() => {}} />
          </LeaderboardCard>
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6 h-full min-h-0">
          <div className="flex-shrink-0">
            <PKBoardCard pks={pks} teamsMap={teamsMap} />
          </div>
          <div className="flex-grow min-h-0">
            <ChallengeArenaCard challenges={challenges} />
          </div>
        </div>
      </main>
      <div className="mt-4 grid grid-cols-1 gap-6 flex-shrink-0">
        <div className="col-span-1">
          <HonorBadgesCard students={students} />
        </div>
      </div>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
```

---

## 🛠️ 具体修复步骤

### Step 1: 后端准备 (Sealos 部署)

**需要的 npm 包**:
```bash
npm install express ws pg pg-promise dotenv cors jsonwebtoken body-parser
```

**基础服务器结构 (改进现有 server.js)**:

```javascript
const express = require('express');
const { Pool } = require('pg');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 数据库连接
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// 中间件
app.use(cors());
app.use(express.json());

// WebSocket 连接管理
const clients = new Set();
wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

// 广播函数
function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// API 路由
const studentRoutes = require('./routes/students');
const challengeRoutes = require('./routes/challenges');
// ... 其他路由

app.use('/api/students', studentRoutes);
app.use('/api/challenges', challengeRoutes);
// ... 其他路由

server.listen(3000, () => {
  console.log('Server running on port 3000');
});

// 导出 broadcast 供路由使用
module.exports = { broadcast };
```

### Step 2: 手机端修改

**优先级任务**:
1. ✅ 创建 `services/api.ts` - API 服务层
2. ✅ 改造 `App.tsx` - 改为异步数据获取
3. ✅ 改造所有 Handler - 添加 API 调用
4. ✅ 添加错误处理和加载状态

### Step 3: 大屏端修改

**优先级任务**:
1. ✅ 创建 `services/websocket.ts` - WebSocket 管理
2. ✅ 改造 `services/sealosService.ts` - 实现真实 API 和订阅
3. ✅ 改造 `bigscreen/main.tsx` - 添加连接管理
4. ✅ 添加连接状态指示器

---

## 📊 数据流完整图

### 场景: 手机端加分 → 大屏端实时显示

```
┌─────────────────────────────────────────────────────────────────┐
│  手机端操作                                                     │
│  用户点击: +5分 按钮                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    App.handleUpdateScore()
                              ↓
           ┌──────────────────────────────────┐
           │ 1. 乐观更新本地状态              │
           │    setStudents(...)              │
           │    显示 Toast: "正在保存..."     │
           └──────────────────────────────────┘
                              ↓
           ┌──────────────────────────────────────────┐
           │ 2. 调用 API                              │
           │    POST /api/scores/add                  │
           │    {                                     │
           │      "studentIds": ["1"],               │
           │      "points": 5,                        │
           │      "exp": 50,                          │
           │      "reason": "课堂表现"                │
           │    }                                     │
           └──────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  后端处理 (Express)                                             │
│  1. 数据验证                                                    │
│  2. 数据库更新: UPDATE students SET points = points + 5        │
│  3. 记录操作日志                                                │
│  4. 广播 WebSocket 消息                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
           ┌──────────────────────────────────┐
           │ WebSocket 广播:                  │
           │ {                                │
           │   "type": "student:updated",   │
           │   "payload": {                  │
           │     "id": "1",                  │
           │     "points": 105,              │
           │     "exp": 550,                 │
           │     "level": 5                  │
           │   }                             │
           │ }                               │
           └──────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  大屏端接收                                                     │
│  subscribeToStudentChanges() 监听                               │
│  setStudents(updatedStudents)                                   │
│  StudentLeaderboard 自动重新渲染                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                  🎉 排行榜实时更新显示
```

---

## 📋 信息需求清单

为了帮你完成完整实现，我需要从你这边获取以下信息：

### 必需信息

#### 1. **Sealos 部署信息**
- [ ] Sealos 数据库类型是什么？(PostgreSQL / MySQL / MongoDB)
- [ ] 数据库连接字符串 (或者至少提供格式)
- [ ] Sealos API 的公网地址是什么？
- [ ] 是否已有 Express 后端在运行？

#### 2. **数据库 Schema**
- [ ] 现有的 SQL table 结构是什么？
- [ ] `students` 表有哪些字段？
- [ ] 是否已创建 `challenges`, `tasks`, `pk_matches` 等表？

#### 3. **认证和授权**
- [ ] 需要用户登录吗？
- [ ] 使用什么认证方式？(JWT / Session / 其他)
- [ ] 有没有教师和管理员的权限区分？

#### 4. **环境配置**
- [ ] 手机端的部署 URL 是什么？
- [ ] 大屏端的部署 URL 是什么？
- [ ] 需要 HTTPS 吗？

#### 5. **业务需求澄清**
- [ ] 积分上限是多少？
- [ ] 等级系统的数值如何定义？
- [ ] 团队功能是否必须？

### 可选信息

- [ ] 是否需要数据导出功能？
- [ ] 是否需要数据备份？
- [ ] 是否需要操作审计日志？
- [ ] 预期的并发用户数量？

---

## 🎯 后续建议

### 短期 (1-2 周)

1. **建立后端 API** - 创建 REST API 端点
2. **手机端数据打通** - 连接到数据库
3. **基础 WebSocket** - 实现实时推送机制

### 中期 (2-4 周)

1. **完善错误处理** - 所有 API 调用的异常处理
2. **离线支持** - 添加本地存储备份
3. **性能优化** - API 缓存策略

### 长期 (1-3 月)

1. **用户认证** - 教师登录系统
2. **数据分析** - 学生成长报表
3. **移动端优化** - PWA 支持

---

## 📞 总结

**当前状态**: 🔴 **严重** - 三端完全断开

**主要问题**:
1. 手机端无数据库连接
2. 大屏端无实时订阅
3. 缺少后端 API

**解决方案**:
- 建立完整的后端系统
- 实现 WebSocket 实时通信
- 改造客户端连接逻辑

**预计工作量**:
- 后端: 3-5 天
- 手机端: 2-3 天
- 大屏端: 1-2 天
- 测试: 2-3 天
- **总计: 1-2 周**

---

**下一步**: 请提供上面信息清单中的关键信息，我可以帮你完成具体的代码实现。

