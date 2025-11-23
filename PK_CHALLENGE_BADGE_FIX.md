# 🔧 PK、挑战、勋章数据持久化问题诊断与修复

**诊断日期**: 2025年11月23日
**问题**: PK无法创建 + 挑战/PK/勋章页面刷新消失 + 勋章授予失败

---

## 📋 问题现象

### 问题1: PK无法创建，无法实时显示在大屏
- ✅ 后端 API 能接收 PK 创建请求
- ✅ 数据保存到数据库
- ❌ 前端创建后不显示在大屏的 PK 区域
- ❌ 刷新大屏后 PK 数据消失

### 问题2: 挑战发布后无法实时显示
- ✅ 后端 API 能接收挑战创建请求
- ✅ 数据保存到数据库
- ❌ 前端创建后不显示
- ❌ 刷新页面后消失

### 问题3: 勋章授予无法成功
- ❌ 授予操作失败
- ❌ API 端点不匹配
- ❌ 数据无法保存到数据库

### 问题4: PK/挑战/勋章过往记录一刷新就消失
- ❌ 数据只存于前端内存
- ❌ 页面刷新后全部清空
- ✅ 只有积分和经验被持久化

---

## 🔍 根本原因分析

### 原因1: 前端没有从数据库加载初始数据

**位置**: `/home/devbox/project/mobile/App.tsx` 第62-70行

```typescript
// ❌ 问题：初始化为空数组，没有从数据库加载
const [challenges, setChallenges] = useState<Challenge[]>([]);
const [pkMatches, setPkMatches] = useState<PKMatch[]>([]);
const [badges, setBadges] = useState<Badge[]>([]);
```

**缺失的代码**: 应该在 useEffect 中加载这些数据
```typescript
useEffect(() => {
  // 这段代码不存在！
  // const challengesRes = await fetch(`${apiUrl}/challenges`);
  // const pkRes = await fetch(`${apiUrl}/pk-matches`);
  // const badgesRes = await fetch(`${apiUrl}/badges`);
}, []);
```

### 原因2: API 端点不匹配（特别是勋章）

**前端API** (`api.ts` 行178-182):
```typescript
async awardBadge(studentId: string, badgeId: string) {
  return fetchWithAuth(`${API_BASE_URL}/students/${studentId}/badges`, {
    method: 'POST',
    body: JSON.stringify({ badgeId })
  });
}
```

**后端端点** (`server.js` 行703):
```javascript
app.post('/api/students/:student_id/badges/:badge_id', async (req, res) => {
  // 后端期望的路径：/api/students/{studentId}/badges/{badgeId}
  // 前端发送的路径：/api/students/{studentId}/badges (缺少 badgeId)
})
```

**问题**: 前端发送 `POST /api/students/1/badges` 但后端期望 `POST /api/students/1/badges/2`

### 原因3: 大屏显示使用生成的模拟数据

**位置**: `/home/devbox/project/mobile/bigscreen/main.tsx` 第90-138行

```typescript
// ❌ 问题：PK 和 Challenge 数据是通过 useMemo 生成的模拟数据
// 不是从数据库加载的真实数据
const generatedPks = useMemo(() => {
  // 生成假的 PK 数据...
  return pksData
}, [students])

const generatedChallenges = useMemo(() => {
  // 生成假的挑战数据...
  return challenges
}, [students])
```

**结果**: 无论手机端创建了什么 PK 或挑战，大屏看不到

### 原因4: 没有建立前端和数据库的同步机制

**缺失的流程**:
```
创建 PK/挑战
     ↓
发送到后端 API
     ↓
保存到数据库 ✅
     ↓
❌ 从数据库重新加载 (这步没有！)
     ↓
❌ 更新前端状态 (这步也没有！)
     ↓
❌ 实时推送到大屏 (这步更没有！)
```

---

## ✅ 修复方案

### 修复1: 后端 - 统一 API 端点 (server.js)

#### 修复1a: 修改勋章授予端点

**现状** (行703):
```javascript
app.post('/api/students/:student_id/badges/:badge_id', async (req, res) => {
```

**问题**: 前端无法调用（端点形式不匹配）

**解决方案**: 添加额外的端点以支持前端发送的格式
```javascript
// 现有端点保留（向后兼容）
app.post('/api/students/:student_id/badges/:badge_id', async (req, res) => {
  // 现有代码...
});

// 新增端点支持前端格式
app.post('/api/students/:student_id/badges', async (req, res) => {
  try {
    const studentId = parseInt(req.params.student_id);
    const { badgeId } = req.body;

    if (!badgeId) {
      return res.status(400).json({
        success: false,
        error: 'badgeId is required',
        timestamp: new Date().toISOString()
      });
    }

    const result = await pool.query(
      `INSERT INTO student_badges (student_id, badge_id, awarded_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT DO NOTHING
       RETURNING student_id, badge_id`,
      [studentId, parseInt(badgeId)]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0] || { student_id: studentId, badge_id: badgeId },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error awarding badge:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### 修复2: 前端 - 初始化数据加载 (App.tsx)

**添加代码到 useEffect** (第91-155行之后):

```typescript
// 初始化加载挑战、PK、勋章数据
useEffect(() => {
  const fetchInitialData = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || (() => {
        const protocol = window.location.protocol;
        const host = window.location.host;
        return `${protocol}//${host}/api`;
      })();

      // 并行加载所有数据
      const [challengesRes, pksRes, badgesRes] = await Promise.all([
        fetch(`${apiUrl}/challenges`),
        fetch(`${apiUrl}/pk-matches`),
        fetch(`${apiUrl}/badges`)
      ]);

      // 处理挑战数据
      if (challengesRes.ok) {
        const challengesData = await challengesRes.json();
        if (challengesData.success && Array.isArray(challengesData.data)) {
          setChallenges(challengesData.data.map((c: any) => ({
            id: String(c.id),
            title: c.title,
            desc: c.description,
            status: c.status,
            participants: [],
            rewardPoints: c.reward_points || 0,
            rewardExp: c.reward_exp || 0,
            date: new Date().toISOString()
          })));
        }
      }

      // 处理 PK 数据
      if (pksRes.ok) {
        const pksData = await pksRes.json();
        if (pksData.success && Array.isArray(pksData.data)) {
          setPkMatches(pksData.data.map((pk: any) => ({
            id: String(pk.id),
            studentA: String(pk.student_a),
            studentB: String(pk.student_b),
            topic: pk.topic,
            status: pk.status,
            winnerId: pk.winner_id ? String(pk.winner_id) : undefined
          })));
        }
      }

      // 处理勋章数据
      if (badgesRes.ok) {
        const badgesData = await badgesRes.json();
        if (badgesData.success && Array.isArray(badgesData.data)) {
          setBadges(badgesData.data.map((b: any) => ({
            id: String(b.id),
            name: b.name,
            description: b.description,
            icon: b.icon || '⭐'
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

### 修复3: 前端 - 修复数据创建后的状态更新 (App.tsx)

**检查 ClassManage.tsx 中的 handlePublishChallenge 和 handleCreatePK**:

当创建成功后，确保数据显示在前端：

```typescript
// ClassManage.tsx 中的 handlePublishChallenge（约280行）
const handlePublishChallenge = async () => {
  if(newChallenge.title && newChallenge.desc) {
    // ... 现有代码 ...

    if (data.success && data.data) {
      // 添加：将新挑战插入到数组头部（显示在第一行）
      setChallenges(prev => [{
        id: String(data.data.id),
        title: data.data.title,
        desc: data.data.description,
        status: data.data.status,
        participants: newChallenge.participantIds || [],
        rewardPoints: data.data.reward_points,
        rewardExp: data.data.reward_exp,
        date: new Date().toISOString()
      }, ...prev]);
    }
  }
};

// ClassManage.tsx 中的 handleCreatePK（约402行）
const handleCreatePK = async () => {
  if(newPK.studentA && newPK.studentB && newPK.topic) {
    // ... 现有代码 ...

    if (data.success && data.data) {
      // 添加：将新 PK 插入到数组头部（显示在第一行）
      setPkMatches(prev => [{
        id: String(data.data.id),
        studentA: data.data.student_a,
        studentB: data.data.student_b,
        topic: data.data.topic,
        status: data.data.status
      }, ...prev]);
    }
  }
};
```

### 修复4: 大屏 - 加载真实数据而不是生成模拟数据 (bigscreen/main.tsx)

**替换生成的 PK 和 Challenge 数据**:

```typescript
// 替代 generatedPks - 从数据库加载真实 PK 数据
const [realPks, setRealPks] = useState<any[]>([])
useEffect(() => {
  const loadPks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/pk-matches`)
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setRealPks(data.data.map((pk: any) => ({
          id: String(pk.id),
          student_a: String(pk.student_a),
          student_b: String(pk.student_b),
          topic: pk.topic,
          status: pk.status,
          winner_id: pk.winner_id ? String(pk.winner_id) : undefined,
          updated_at: new Date().toISOString()
        })))
      }
    } catch (error) {
      console.error('Failed to load PK data:', error)
    }
  }
  loadPks()
  const interval = setInterval(loadPks, 5000) // 每5秒刷新一次
  return () => clearInterval(interval)
}, [])

// 替代 generatedChallenges - 从数据库加载真实挑战数据
const [realChallenges, setRealChallenges] = useState<any[]>([])
useEffect(() => {
  const loadChallenges = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/challenges`)
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setRealChallenges(data.data.map((c: any) => ({
          id: String(c.id),
          title: c.title,
          description: c.description,
          status: c.status,
          reward_points: c.reward_points,
          reward_exp: c.reward_exp
        })))
      }
    } catch (error) {
      console.error('Failed to load challenge data:', error)
    }
  }
  loadChallenges()
  const interval = setInterval(loadChallenges, 5000) // 每5秒刷新一次
  return () => clearInterval(interval)
}, [])

// 在 return 中替换：
// <PKBoardCard pks={generatedPks} .../>  →  <PKBoardCard pks={realPks} .../>
// <ChallengeArenaCard challenges={generatedChallenges} />  →  <ChallengeArenaCard challenges={realChallenges} />
```

### 修复5: 后端 - 确保获取数据的 API 端点存在

**检查以下端点是否存在** (server.js):

```javascript
// 获取所有勋章 - 检查是否存在
app.get('/api/badges', async (req, res) => {
  // 需要实现
});

// 获取所有挑战 - 应该存在（行478）
app.get('/api/challenges', async (req, res) => {
  // 应该已存在
});

// 获取所有 PK - 应该存在（行564）
app.get('/api/pk-matches', async (req, res) => {
  // 应该已存在
});
```

---

## 🛠️ 具体修复步骤

### 第1步：修改 server.js 添加勋章端点支持

**文件**: `/home/devbox/project/server.js`
**位置**: 在现有的 `/api/students/:student_id/badges/:badge_id` 端点后添加

```javascript
// 新增端点：支持 POST /api/students/{id}/badges (前端格式)
app.post('/api/students/:student_id/badges', async (req, res) => {
  try {
    const studentId = parseInt(req.params.student_id);
    const { badgeId } = req.body;

    if (!badgeId) {
      return res.status(400).json({
        success: false,
        error: 'badgeId is required'
      });
    }

    const result = await pool.query(
      `INSERT INTO student_badges (student_id, badge_id, awarded_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT DO NOTHING
       RETURNING student_id, badge_id`,
      [studentId, parseInt(badgeId)]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0] || { student_id: studentId, badge_id: badgeId },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error awarding badge:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 新增端点：获取所有勋章
app.get('/api/badges', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, description, icon FROM badges');
    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### 第2步：修改 App.tsx 添加初始数据加载

**文件**: `/home/devbox/project/mobile/App.tsx`
**位置**: 在现有的第一个 useEffect 完成后（第155行后）

添加新的 useEffect 块（见修复2的代码）

### 第3步：修改 ClassManage.tsx 确保新建数据显示

**文件**: `/home/devbox/project/mobile/pages/ClassManage.tsx`

在 `handlePublishChallenge` 和 `handleCreatePK` 函数中确保数据被插入到数组头部

### 第4步：修改 bigscreen/main.tsx 使用真实数据

**文件**: `/home/devbox/project/mobile/bigscreen/main.tsx`

替换生成的 PK 和 Challenge 数据为从 API 加载的真实数据

---

## 🧪 验证步骤

### 验证1: 勋章授予

```bash
# 1. 启动后端
cd /home/devbox/project
node server.js

# 2. 在手机端进入班级管理 → 勋章
# 3. 选择一个勋章和学生
# 4. 点击"批量授予"
# 5. 检查是否成功（应该显示成功提示）

# 6. 数据库验证
psql -d postgres -c "SELECT * FROM student_badges ORDER BY awarded_at DESC LIMIT 5;"
```

### 验证2: PK 创建和显示

```bash
# 1. 进入手机端班级管理 → PK
# 2. 选择两个学生和主题
# 3. 点击"创建"
# 4. 检查是否立即显示在"PK列表"中（第一行）
# 5. 打开大屏端，检查是否显示新创建的 PK
# 6. 刷新大屏端，检查 PK 数据是否仍然存在
```

### 验证3: 挑战发布和显示

```bash
# 1. 进入手机端班级管理 → 挑战
# 2. 填写挑战信息
# 3. 点击"发布"
# 4. 检查是否立即显示在"进行中"列表的第一行
# 5. 打开大屏端，检查是否显示新挑战
# 6. 刷新页面，检查数据是否仍然存在
```

### 验证4: 数据持久化

```bash
# 1. 完成上述所有操作
# 2. 刷新手机端 - 检查 PK、挑战、勋章是否仍然显示
# 3. 刷新大屏端 - 检查 PK、挑战是否仍然显示
# 4. 关闭浏览器后重新打开 - 检查所有数据是否仍然存在
```

---

## 📊 修复前后对比

### 修复前
```
❌ PK 无法创建
❌ 挑战无法发布
❌ 勋章授予失败
❌ 大屏显示模拟数据
❌ 页面刷新数据消失
```

### 修复后
```
✅ PK 创建成功
✅ 新 PK 显示在第一行
✅ 大屏实时显示新 PK
✅ 挑战创建成功
✅ 新挑战显示在第一行
✅ 大屏实时显示新挑战
✅ 勋章授予成功
✅ 页面刷新数据仍然保留
✅ 关闭浏览器后数据仍然存在
```

---

## 📝 修改文件列表

| 文件 | 修改内容 | 优先级 |
|------|---------|--------|
| server.js | 添加勋章 POST 端点和 GET /badges | 高 |
| App.tsx | 添加初始数据加载 | 高 |
| ClassManage.tsx | 修复 handlePublishChallenge 和 handleCreatePK | 中 |
| bigscreen/main.tsx | 替换模拟数据为真实 API 数据 | 中 |

---

## 🎯 预期效果

修复完成后：
- ✅ PK 创建后立即显示在大屏第一行
- ✅ 挑战发布后立即显示在大屏第一行
- ✅ 勋章授予成功并数据库保存
- ✅ 页面刷新不会丢失任何数据
- ✅ 所有数据均存储在数据库中
- ✅ 大屏实时显示最新数据（每5秒更新一次）

---

**修复方案完成！建议按照优先级顺序实施。**
