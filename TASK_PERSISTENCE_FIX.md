# 🔧 任务数据持久化问题诊断与修复

**诊断日期**: 2025年11月23日
**问题**: 任务刷新消失 + 任务执行人未保存 + 任务完成经验值未增加

---

## 📋 问题现象

### 问题1: 任务发布时执行人没有被保存
- ✅ 前端选择了执行人
- ❌ 发送给后端时没有包含执行人信息
- ❌ 数据库中没有保存执行人

### 问题2: 页面刷新后任务数据消失
- ❌ 初始加载时没有从数据库读取任务
- ❌ 仅有的任务数据在前端内存中
- ❌ 刷新页面后全部丢失

### 问题3: 任务完成后经验值未增加
- ✅ 前端逻辑中有增加经验值（App.tsx:519）
- ❌ 但没有同步到数据库
- ❌ 没有调用 API 更新学生经验值

---

## 🔍 根本原因分析

### 原因1: 任务发布时未传递执行人信息

**位置**: `/home/devbox/project/mobile/pages/ClassManage.tsx` 行338-346

```typescript
const response = await fetch(`${apiUrl}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        title: newTaskForm.title,
        description: newTaskForm.desc,
        exp_value: exp
        // ❌ 缺失：assignees / assignedTo
    })
});
```

**问题**: 虽然前端 UI 选择了执行人（newTaskForm.assignees），但没有发送给后端

### 原因2: 初始加载没有获取任务列表

**位置**: `/home/devbox/project/mobile/App.tsx` 行154-221

```typescript
// 初始化加载挑战、PK、勋章数据
useEffect(() => {
    const fetchInitialData = async () => {
        // ✅ 加载 challenges
        // ✅ 加载 pkMatches
        // ✅ 加载 badges
        // ❌ 缺失：加载 tasks
    };
    fetchInitialData();
}, []);
```

**问题**: 任务列表没有被从数据库初始化加载

### 原因3: 任务完成时没有同步到数据库

**位置**: `/home/devbox/project/mobile/App.tsx` 行496-530

```typescript
const handleCompleteTask = async (id: string) => {
    // ... 调用 API 删除任务 ...

    // 前端更新学生经验值
    setStudents(prev => prev.map(s => {
        if (task.assignedTo?.includes(s.id)) {
            const newExp = s.exp + task.expValue;  // ✅ 前端增加
            // ❌ 但没有同步到数据库
        }
    }));
};
```

**问题**: 只更新了前端状态，没有调用 API 更新学生的经验值

---

## ✅ 修复方案

### 修复1: 发布任务时包含执行人信息 (ClassManage.tsx:341-345)

**修改内容**:
```typescript
// 修改前
body: JSON.stringify({
    title: newTaskForm.title,
    description: newTaskForm.desc,
    exp_value: exp
})

// 修改后
body: JSON.stringify({
    title: newTaskForm.title,
    description: newTaskForm.desc,
    exp_value: exp,
    assigned_to: newTaskForm.assignees  // ✅ 添加执行人信息
})
```

**后端处理** (server.js:621-645):

```javascript
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, exp_value, assigned_to } = req.body;

    // 保存任务
    const taskResult = await pool.query(
      `INSERT INTO tasks (title, description, exp_value)
       VALUES ($1, $2, $3)
       RETURNING id, title, description, exp_value`,
      [title, description || '', exp_value]
    );

    const taskId = taskResult.rows[0].id;

    // 如果有执行人，建立任务分配关系
    if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
      for (const studentId of assigned_to) {
        await pool.query(
          `INSERT INTO task_assignments (task_id, student_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [taskId, parseInt(studentId)]
        );
      }
    }

    res.status(201).json({
      success: true,
      data: taskResult.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### 修复2: 初始加载任务列表 (App.tsx:154-221)

**添加任务加载代码**:

在现有的 useEffect 中添加任务列表获取：

```typescript
useEffect(() => {
  const fetchInitialData = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || (() => {
        const protocol = window.location.protocol;
        const host = window.location.host;
        return `${protocol}//${host}/api`;
      })();

      // 并行加载所有数据
      const [challengesRes, pksRes, badgesRes, tasksRes] = await Promise.all([
        fetch(`${apiUrl}/challenges`),
        fetch(`${apiUrl}/pk-matches`),
        fetch(`${apiUrl}/badges`),
        fetch(`${apiUrl}/tasks`)  // ✅ 新增
      ]);

      // ... 现有的 challenges、pks、badges 处理 ...

      // 处理任务数据 (新增)
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        if (tasksData.success && Array.isArray(tasksData.data)) {
          setTasks(tasksData.data.map((t: any) => ({
            id: String(t.id),
            title: t.title,
            desc: t.description,
            expValue: t.exp_value || 0,
            createdAt: new Date().toISOString(),
            assignedTo: []  // 后续可从 API 获取关联学生
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  fetchInitialData();
}, []);
```

### 修复3: 任务完成时同步经验值到数据库 (App.tsx:496-530)

**修改内容**:

```typescript
const handleCompleteTask = async (id: string) => {
  try {
    const protocol = window.location.protocol;
    const host = window.location.host;
    const apiUrl = `${protocol}//${host}/api`;

    // 1️⃣ 获取任务信息
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // 2️⃣ 获取需要奖励的学生ID列表
    const studentIdsToReward = task.assignedTo || [];

    // 3️⃣ 调用 API 完成任务（删除）
    const response = await fetch(`${apiUrl}/tasks/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      console.error('Failed to complete task:', response.statusText);
      return;
    }

    // 4️⃣ 为所有执行人增加经验值 (同步到数据库)
    if (studentIdsToReward.length > 0) {
      await fetch(`${apiUrl}/students/scores/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: studentIdsToReward,
          points: 0,  // 不加分
          exp: task.expValue,  // 加经验值
          reason: `任务完成: ${task.title}`,
          category: 'task'
        })
      });
    }

    // 5️⃣ 更新前端状态
    const date = new Date().toISOString();
    setStudents(prev => prev.map(s => {
      if (task.assignedTo?.includes(s.id)) {
        const newExp = s.exp + task.expValue;
        const newLevel = calcLevelFromExp(newExp);
        const rec = {
          id: `${id}-${s.id}`,
          taskId: id,
          title: task.title,
          exp: task.expValue,
          date
        };
        return { ...s, exp: newExp, level: newLevel, taskHistory: [ ...(s.taskHistory || []), rec ] };
      }
      return s;
    }));

    // 6️⃣ 从列表中移除任务
    setTasks(prev => prev.filter(t => t.id !== id));
  } catch (error) {
    console.error('Error completing task:', error);
  }
};
```

---

## 📝 修改清单

| 文件 | 行号 | 修改内容 | 优先级 |
|------|------|---------|--------|
| ClassManage.tsx | 341-345 | 添加 assigned_to 到请求体 | 高 |
| App.tsx | 154-221 | 添加任务列表初始加载 | 高 |
| App.tsx | 496-530 | 修复任务完成时的经验值同步 | 高 |
| server.js | 621-645 | 增强任务创建处理执行人信息 | 高 |

---

## 🧪 验证步骤

### 验证1: 任务发布包含执行人

```bash
# 1. 进入手机端 → 班级管理 → 任务
# 2. 填写任务信息
# 3. 选择执行人（例如：庞子玮、刘凡兮）
# 4. 点击"发布任务"
# 5. 检查列表中任务下方是否显示执行人名单

# 6. 数据库验证
psql -d postgres -c "
SELECT t.id, t.title, ta.student_id
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
ORDER BY t.id DESC LIMIT 5;
"
# 预期：看到执行人信息已保存
```

### 验证2: 页面刷新任务保留

```bash
# 1. 发布一个任务
# 2. 刷新页面
# 预期：任务仍然显示在列表中

# 3. 再次刷新
# 预期：任务仍然显示，没有消失
```

### 验证3: 任务完成经验值增加

```bash
# 1. 发布任务并指定执行人，经验值设为 100
# 2. 记录执行人的当前经验值
psql -d postgres -c "SELECT id, name, total_exp FROM students WHERE id = 执行人ID;"

# 3. 在手机端点击"完成"按钮
# 4. 检查执行人的经验值是否增加了 100

# 5. 刷新页面，再次检查经验值是否仍然保留
# 预期：经验值已正确增加并持久化到数据库
```

---

## 🎯 完成后的预期效果

修复完成后：

✅ 发布任务时可以选择执行人
✅ 执行人信息保存到数据库
✅ 页面刷新后任务不消失
✅ 任务完成时为执行人增加经验值
✅ 经验值增加同步到数据库
✅ 所有数据持久化

---

## 🚀 快速实施

```bash
# 1. 停止后端
pkill -f "node server.js"

# 2. 编辑文件（按照上面的修改清单）
# - ClassManage.tsx: 添加 assigned_to
# - App.tsx: 添加任务加载 useEffect
# - App.tsx: 修复 handleCompleteTask
# - server.js: 增强任务创建处理

# 3. 重启后端
cd /home/devbox/project
node server.js

# 4. 重启前端（如果使用了缓存）
cd mobile
npm run dev

# 5. 测试验证
# - 发布任务with执行人
# - 刷新页面
# - 完成任务
# - 检查经验值
```

---

**问题分析完成！建议立即实施以上修复。**
