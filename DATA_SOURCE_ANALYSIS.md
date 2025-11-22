# 🔍 数据源分析报告

**分析时间**: 2025-11-22
**问题**: 大屏和手机端显示的数据不一致

---

## 🎯 问题诊断

### 现象
- ❌ 大屏显示：模拟数据 (20 个学生，随机生成)
- ✅ 手机端显示：真实数据 (28 个学生，来自 useEffect 初始化)
- ❌ 两端数据完全不同，无法同步

---

## 📊 代码分析

### 问题 1: 大屏应用 (mobile/bigscreen/services/sealosService.ts)

**第 13-21 行：使用模拟数据**
```typescript
let students: Student[] = Array.from({ length: 20 }).map((_, index) => ({
  id: String(index + 1),
  name: `学生${index + 1}`,
  team_id: teams[(index % teams.length)].id,
  total_exp: Math.floor(Math.random() * 500) + 50,
  total_points: Math.floor(Math.random() * 100) + 10,
  avatar_url: `https://i.pravatar.cc/100?u=${index + 1}`,
  badges: []
}))
```

**问题**:
- ❌ 硬编码 20 个学生
- ❌ 随机数据，每次刷新不同
- ❌ 没有从真实 API 获取数据
- ❌ `getStudents()` 函数返回模拟数据

**第 53 行：返回模拟数据**
```typescript
export const getStudents = async (): Promise<Student[]> => students
```

---

### 问题 2: 手机端应用 (mobile/App.tsx)

**第 92-100 行：使用真实 28 个学生名单**
```typescript
useEffect(() => {
  const names = ['庞子玮','刘凡兮','余沁妍','吴逸桐','刘润霖','肖正楠','王彦舒','陈金锐','宋子晨','徐汇洋','黄衍恺','舒昱恺','方景怡','廖研曦','廖一凡','唐艺馨','何泽昕','陈笑妍','彭柏成','樊牧宸','曾欣媛','肖雨虹','宁可歆','廖潇然','肖浩轩','陈梓萌','彭斯晟','谭雨涵'];
  const cls = ['三年一班','三年二班','三年三班'];
  const arr: Student[] = names.map((name, i) => ({
    id: `${i+1}`,
    name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    points: 0,
    exp: 0,
    // ... 更多字段
  }))
})
```

**优点**:
- ✅ 28 个真实学生名字
- ✅ 数据一致，不随机变化
- ✅ 来自初始化列表

**缺点**:
- ❌ 仍然是本地模拟数据
- ❌ 应该从后端 API 获取

---

## 🔴 根本问题

### 数据源配置不正确

| 应用 | 应该做 | 实际做 | 状态 |
|------|--------|--------|------|
| 大屏 | 从 API 获取真实学生数据 | 使用模拟数据 (20 个) | ❌ |
| 手机 | 从 API 获取真实学生数据 | 使用硬编码数据 (28 个) | ⚠️ |
| 后端 | 提供 API 端点 | ✅ /api/students 可用 | ✅ |

---

## ✅ 解决方案

### 方案 1: 大屏应用修复 (推荐)

**修改**: `mobile/bigscreen/services/sealosService.ts`

**步骤 1**: 添加 API 调用函数
```typescript
// 添加真实 API 调用
const API_URL = 'https://xysrxgjnpycd.sealoshzh.site/api';

export const getStudents = async (): Promise<Student[]> => {
  try {
    const response = await fetch(`${API_URL}/students`);
    const data = await response.json();
    if (data.success) {
      return data.data.map((student: any) => ({
        id: String(student.id),
        name: student.name,
        team_id: student.team_id,
        total_exp: student.total_exp || 0,
        total_points: student.score || 0,
        avatar_url: student.avatar_url || `https://i.pravatar.cc/100?u=${student.id}`,
        badges: []
      }));
    }
  } catch (error) {
    console.error('Failed to fetch students:', error);
  }
  return [];
}
```

**步骤 2**: 移除模拟数据
```typescript
// ❌ 删除这些行：
let students: Student[] = Array.from({ length: 20 }).map(...)
```

**步骤 3**: 重新编译
```bash
cd /home/devbox/project/mobile
npm run build
```

**步骤 4**: 复制编译输出
```bash
cp /home/devbox/project/mobile/dist/bigscreen/index.html /home/devbox/project/public/display.html
```

---

### 方案 2: 手机端应用修复 (可选)

**修改**: `mobile/App.tsx`

**从硬编码数据改为 API 调用**:
```typescript
useEffect(() => {
  // 从 API 获取学生数据
  fetch('https://xysrxgjnpycd.sealoshzh.site/api/students')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const students = data.data.map((s: any) => ({
          id: String(s.id),
          name: s.name,
          avatar: s.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`,
          points: 0,
          exp: s.total_exp || 0,
          // ... 其他字段
        }));
        setStudents(students);
      }
    });
}, []);
```

---

## 📋 对比分析

### 当前状态

**大屏数据流**:
```
sealosService.ts (模拟20个学生)
    ↓
main.tsx getStudents()
    ↓
setStudents()
    ↓
显示模拟排行榜
    ↓
❌ 与手机端 28 个学生不同
```

**手机数据流**:
```
App.tsx 初始化 (28个学生名单)
    ↓
setStudents(MOCK_STUDENTS)
    ↓
显示 28 个学生
    ↓
❌ 与大屏 20 个学生不同
```

**后端数据流**:
```
PostgreSQL 数据库 (8 个学生)
    ↓
server.js /api/students
    ↓
HTTP 200 + JSON
    ↓
✅ 从未被前端使用！
```

---

## 🎯 修复步骤

### 第 1 步：修改大屏数据源

编辑 `/home/devbox/project/mobile/bigscreen/services/sealosService.ts`

**关键改动**:
1. 移除硬编码的 20 个学生数据
2. 添加真实 API 调用
3. 映射 API 数据到应用数据结构

### 第 2 步：重新编译

```bash
cd /home/devbox/project/mobile
npm install  # 如需要
npm run build
```

### 第 3 步：部署

```bash
# 复制大屏应用
cp /home/devbox/project/mobile/dist/bigscreen/index.html /home/devbox/project/public/display.html

# 可选：复制手机应用
cp /home/devbox/project/mobile/dist/index.html /home/devbox/project/public/admin.html

# 复制资源文件
cp -r /home/devbox/project/mobile/dist/assets/* /home/devbox/project/public/assets/
```

### 第 4 步：验证

访问大屏地址：
```
https://xysrxgjnpycd.sealoshzh.site/display
```

应该看到：
- ✅ 实时学生数据（来自后端数据库）
- ✅ 与手机端一致的学生列表
- ✅ 能够实时同步更新

---

## 📊 修复后的效果

### 数据一致性

```
后端数据库 (8 个学生)
    ↓
    ├─→ /api/students API
    │       ↓
    │   大屏应用 (fetch API)
    │   手机应用 (fetch API)
    │       ↓
    │   显示相同的学生列表 ✅
    │
    └─→ WebSocket 推送更新
            ↓
        大屏实时显示 ✅
```

### 用户体验

- ✅ 大屏显示真实数据
- ✅ 手机端操作立即同步到大屏
- ✅ 刷新后数据不变
- ✅ 支持并发操作

---

## 🔍 其他发现

### sealosService.ts 的订阅函数

**第 73-76 行**：订阅函数都是空实现
```typescript
export const subscribeToStudentChanges = (_: (payload: { updatedStudents: Student[] }) => void) => () => {}
export const subscribeToChallengeChanges = (_: (updated: Challenge[]) => void) => () => {}
export const subscribeToPKChanges = (_: (updated: PKMatch[]) => void) => () => {}
export const subscribeToTaskChanges = (_: (updated: StudentTask[]) => void) => () => {}
```

**问题**: 这些函数没有实现 WebSocket 连接，无法接收实时更新

**解决**: 如需实时推送，需要实现 WebSocket 连接

---

## 📌 建议优先级

1. **高优先级** ⚠️
   - 修复大屏数据源，改用真实 API
   - 确保大屏显示后端数据

2. **中优先级** ⚠️
   - 修复手机端，改用真实 API（而不是硬编码）
   - 统一数据源

3. **低优先级** ℹ️
   - 实现 WebSocket 订阅以支持实时推送
   - 优化性能和缓存

---

## 📝 总结

**现状**:
- ❌ 大屏：20 个模拟学生
- ❌ 手机：28 个硬编码学生
- ✅ 后端：8 个真实学生 (在数据库中)

**问题**:
- 前端应用没有使用真实 API
- 大屏和手机端数据源不一致
- 无法真正实现数据同步

**解决**:
- 修改前端应用，改用真实 API
- 重新编译并部署
- 验证数据一致性

**预期效果**:
- ✅ 所有端点显示相同的真实数据
- ✅ 实时同步更新
- ✅ 数据持久化

---

**分析完成**: 2025-11-22
**优先级**: 🔴 高（需要立即修复）
**影响范围**: 大屏和手机应用数据显示
