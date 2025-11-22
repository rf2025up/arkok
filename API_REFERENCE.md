# Growark API 参考文档

**Base URL**: `https://xysrxgjnpycd.sealoshzh.site/api`

## 学生管理

### 获取所有学生
```http
GET /api/students
```
**响应**: 200 OK
```json
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

### 创建学生
```http
POST /api/students
Content-Type: application/json

{
  "name": "新学生",
  "class_name": "黄老师班",
  "avatar_url": "https://...",
  "score": 0,
  "total_exp": 0,
  "level": 1
}
```
**响应**: 201 Created
```json
{
  "success": true,
  "data": {
    "id": 29,
    "name": "新学生",
    "score": 0,
    "total_exp": 0,
    "level": 1,
    "class_name": "黄老师班",
    "avatar_url": "https://..."
  },
  "message": "Student created successfully"
}
```

### 编辑学生
```http
PUT /api/students/:id
Content-Type: application/json

{
  "name": "新名字",
  "class_name": "新班级",
  "score": 100,
  "total_exp": 500,
  "level": 2
}
```
**说明**: 支持部分更新，只需发送要更改的字段

### 删除学生
```http
DELETE /api/students/:id
```
**说明**: 会自动删除该学生的所有关联数据（勋章、打卡记录、任务等）

### 调整学生分数
```http
POST /api/students/:id/adjust-score
Content-Type: application/json

{
  "delta": 50
}
```
**说明**: delta 为正数表示增加，负数表示减少

### 获取单个学生
```http
GET /api/students/:id
```

## 挑战系统

### 创建挑战
```http
POST /api/challenges
Content-Type: application/json

{
  "title": "挑战名称",
  "description": "挑战描述",
  "status": "active",
  "reward_points": 100,
  "reward_exp": 200
}
```

### 获取所有挑战
```http
GET /api/challenges
```

### 更新挑战状态
```http
PUT /api/challenges/:id
Content-Type: application/json

{
  "status": "completed",
  "result": "success"
}
```
**说明**:
- status: "active" | "completed"
- result: "success" | "fail"

## PK 比赛

### 创建 PK
```http
POST /api/pk-matches
Content-Type: application/json

{
  "student_a": "1",
  "student_b": "2",
  "topic": "PK 主题",
  "status": "pending"
}
```

### 获取所有 PK
```http
GET /api/pk-matches
```

### 更新 PK 结果
```http
PUT /api/pk-matches/:id
Content-Type: application/json

{
  "status": "finished",
  "winner_id": 1
}
```
**说明**:
- status: "pending" | "finished"
- winner_id: 赢家的学生 ID（可为 null 表示平局）

## 任务系统

### 创建任务
```http
POST /api/tasks
Content-Type: application/json

{
  "title": "任务名称",
  "description": "任务描述",
  "exp_value": 100
}
```

### 获取所有任务
```http
GET /api/tasks
```

### 完成/删除任务
```http
DELETE /api/tasks/:id
```

## 勋章系统

### 颁发勋章
```http
POST /api/students/:student_id/badges/:badge_id
```
**说明**:
- student_id: 学生 ID
- badge_id: 勋章 ID

**响应**: 201 Created
```json
{
  "success": true,
  "data": {
    "student_id": 1,
    "badge_id": 5
  }
}
```

## 习惯打卡

### 习惯打卡
```http
POST /api/habits/:habit_id/checkin
Content-Type: application/json

{
  "student_id": 1
}
```

**响应**: 201 Created
```json
{
  "success": true,
  "data": {
    "student_id": 1,
    "habit_id": 3,
    "checked_in_at": "2025-11-22T17:45:44.927Z"
  }
}
```

## 健康检查

### 服务健康状态
```http
GET /api/health
```

**响应**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-22T17:45:44.927Z"
}
```

## 错误处理

### 通用错误响应格式
```json
{
  "success": false,
  "error": "错误信息描述",
  "timestamp": "2025-11-22T17:45:44.927Z"
}
```

### 常见 HTTP 状态码
- `200 OK` - 请求成功
- `201 Created` - 资源创建成功
- `400 Bad Request` - 请求参数错误
- `404 Not Found` - 资源不存在
- `500 Internal Server Error` - 服务器错误

## 前端集成示例

### JavaScript/React
```javascript
// 获取学生列表
const apiUrl = `${window.location.protocol}//${window.location.host}/api`;

async function getStudents() {
  const response = await fetch(`${apiUrl}/students`);
  if (!response.ok) throw new Error('Failed to fetch students');
  return response.json();
}

// 创建学生
async function createStudent(name, className) {
  const response = await fetch(`${apiUrl}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      class_name: className,
      score: 0,
      total_exp: 0,
      level: 1
    })
  });
  if (!response.ok) throw new Error('Failed to create student');
  return response.json();
}

// 更新学生分数
async function adjustScore(studentId, delta) {
  const response = await fetch(`${apiUrl}/students/${studentId}/adjust-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta })
  });
  if (!response.ok) throw new Error('Failed to adjust score');
  return response.json();
}
```

## 数据库约束

### 表关系
- `students` - 学生主表
- `challenges` - 挑战
- `pk_matches` - PK 比赛
- `tasks` - 任务
- `student_badges` - 学生勋章关联
- `habit_checkins` - 习惯打卡记录

### 级联删除
- 删除学生时，会自动删除其所有相关数据
- 删除勋章时，会删除所有学生对该勋章的颁发记录

---

**最后更新**: 2025-11-22
