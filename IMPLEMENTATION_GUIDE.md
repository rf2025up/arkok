# 功能实现指南 - 详细步骤

**文档版本：** 1.0
**创建日期：** 2024年11月22日
**状态：** 实现准备

---

## 📋 快速导航

| 功能 | 优先级 | 预计工时 | 复杂度 | 开始页面 |
|------|--------|---------|--------|---------|
| **Feature 1** - 登陆认证系统 | 🔴 高 | 8h | ⭐⭐⭐ | [第1章](#feature-1-登陆认证系统) |
| **Feature 2** - 战队系统 & 经验值修复 | 🔴 高 | 4h | ⭐⭐⭐ | [第2章](#feature-2-战队系统) |
| **Feature 5** - 积分管理重构 | 🔴 高 | 6h | ⭐⭐ | [第5章](#feature-5-积分管理重构) |
| **Feature 8** - PK系统增强 | 🔴 高 | 8h | ⭐⭐⭐⭐ | [第8章](#feature-8-pk系统增强) |
| **Feature 9** - 进度条系统 | 🟠 中 | 6h | ⭐⭐⭐ | [第9章](#feature-9-进度条系统) |
| **Feature 3** - 个人信息编辑 | 🟡 中 | 3h | ⭐⭐ | [第3章](#feature-3-个人信息编辑) |
| **Feature 10** - 打卡系统优化 | 🟡 中 | 5h | ⭐⭐⭐ | [第10章](#feature-10-打卡系统优化) |
| **Feature 7** - 挑战历史记录 | 🟡 中 | 5h | ⭐⭐ | [第7章](#feature-7-挑战历史记录) |
| **Feature 6** - 学生管理优化 | 🟢 低 | 3h | ⭐ | [第6章](#feature-6-学生管理优化) |
| **Feature 4** - 班级预设 | 🟢 低 | 2h | ⭐ | [第4章](#feature-4-班级预设) |

---

## Feature 1: 登陆认证系统

### 预计工时：8 小时
### 优先级：🔴 高（基础功能）
### 复杂度：⭐⭐⭐

### 步骤 1.1：后端数据库设计

```sql
-- 创建用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  auth_type ENUM('phone', 'email', 'wechat') DEFAULT 'phone',
  school_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (username),
  INDEX (email),
  INDEX (phone)
);

-- 创建会话表（可选）
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (token)
);
```

### 步骤 1.2：后端 API 实现

**登陆端点：** `POST /auth/login`

```typescript
// backend/routes/auth.ts
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // 验证 admin/1234（当前阶段）
  if (username === 'admin' && password === '1234') {
    const token = generateToken(username);
    const user = {
      id: 0,
      username: 'admin',
      role: 'teacher',
      school_id: 1
    };

    res.json({
      success: true,
      data: {
        user,
        token,
        expiresIn: 86400 // 24 小时
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
});

// token 生成函数
const generateToken = (username: string): string => {
  const payload = {
    username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'secret');
};
```

**注册端点：** `POST /auth/register`

```typescript
router.post('/register', async (req, res) => {
  const { username, email, phone, authType, password } = req.body;

  // 当前阶段：保留接口，返回成功但不实际保存
  console.log(`[暂不实现] 注册请求：${authType}类型，${username}`);

  res.json({
    success: true,
    message: '注册接口已保留，暂不实现',
    data: {
      username,
      authType,
      registered: false
    }
  });
});
```

**密码找回端点：** `POST /auth/forgot-password`

```typescript
router.post('/forgot-password', async (req, res) => {
  const { email, phone } = req.body;

  // 当前阶段：保留接口，返回成功但不实际发送
  console.log(`[暂不实现] 密码找回请求：${email || phone}`);

  res.json({
    success: true,
    message: '密码找回接口已保留，暂不实现'
  });
});
```

### 步骤 1.3：前端登陆页面组件

**文件：** `mobile/pages/LoginPage.tsx`

```typescript
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface LoginFormData {
  username: string
  password: string
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'login' | 'phone' | 'email' | 'wechat'>('login')
  const [formData, setFormData] = useState<LoginFormData>({ username: 'admin', password: '1234' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('https://xysrxgjnpycd.sealoshzh.site/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        // 保存 token 到 localStorage
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        navigate('/home')
      } else {
        setError(data.message || '登陆失败')
      }
    } catch (err) {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">星途成长方舟</h1>
          <p className="text-gray-600">ClassHero 教师端</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'login', label: '账号登陆' },
            { id: 'phone', label: '手机注册' },
            { id: 'email', label: '邮箱注册' },
            { id: 'wechat', label: '微信注册' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="输入用户名（默认：admin）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="输入密码（默认：1234）"
              />
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {loading ? '登陆中...' : '登陆'}
            </button>
          </form>
        )}

        {/* Register Forms - Placeholder */}
        {(activeTab === 'phone' || activeTab === 'email' || activeTab === 'wechat') && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 text-blue-800 rounded-lg">
              <p className="text-sm">
                {activeTab === 'phone' && '📱 手机注册接口已保留，暂不实现'}
                {activeTab === 'email' && '📧 邮箱注册接口已保留，暂不实现'}
                {activeTab === 'wechat' && '🔗 微信注册接口已保留，暂不实现'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('login')}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700"
            >
              返回登陆
            </button>
          </div>
        )}

        {/* Forgot Password Link */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {/* 打开找回密码模态框 */}}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            忘记密码？
          </button>
        </div>

        {/* Test Credentials */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 font-medium mb-2">📝 测试账号：</p>
          <p className="text-xs text-gray-600">用户名：<span className="font-mono">admin</span></p>
          <p className="text-xs text-gray-600">密码：<span className="font-mono">1234</span></p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
```

### 步骤 1.4：前端路由保护

**文件：** `mobile/components/ProtectedRoute.tsx`

```typescript
import React from 'react'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
```

### 步骤 1.5：前端 App.tsx 路由配置

**修改：** `mobile/App.tsx`

```typescript
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/class-manage"
          element={
            <ProtectedRoute>
              <ClassManage />
            </ProtectedRoute>
          }
        />

        {/* 其他受保护的路由... */}
      </Routes>
    </Router>
  )
}
```

### 验证清单

- [ ] 后端登陆 API 响应正确
- [ ] 登陆页面 UI 完成
- [ ] admin/1234 登陆成功
- [ ] Token 保存到 localStorage
- [ ] 路由保护工作正常
- [ ] 未登陆时重定向到登陆页
- [ ] 注册和找回密码接口保留（暂不实现）

---

## Feature 2: 战队系统 & 经验值修复

### 预计工时：4 小时
### 优先级：🔴 高
### 复杂度：⭐⭐⭐

### 步骤 2.1：更新战队数据

**修改：** `mobile/services/mockData.ts`

```typescript
export const MOCK_TEAMS = [
  { id: 't1', name: '超能英雄', color: 'bg-cyan-500', textColor: 'text-cyan-400' },
  { id: 't2', name: '天才少年', color: 'bg-purple-500', textColor: 'text-purple-400' },
  { id: 't3', name: '学霸无敌', color: 'bg-red-500', textColor: 'text-red-400' },
]
```

### 步骤 2.2：修复经验值数据同步

**问题分析：**
- 手机端修改学生积分后，前端显示更新了
- 但学生卡的经验值没有变化
- 原因：经验值字段可能没有在 API 响应中包含或与数据库字段映射不一致

**修复方案：**

**后端修改：** `routes/students.ts`

```typescript
// 确保积分更新时也更新经验值
router.post('/students/:id/adjust-score', async (req, res) => {
  const { id } = req.params
  const { points, reason } = req.body

  try {
    // 计算对应的经验值（比例：1 积分 = 2 经验值）
    const experience = Math.floor(points * 2)

    const result = await db.query(
      'UPDATE students SET score = score + ?, total_exp = total_exp + ? WHERE id = ?',
      [points, experience, id]
    )

    // 返回更新后的学生信息
    const updated = await db.query('SELECT * FROM students WHERE id = ?', [id])

    res.json({
      success: true,
      data: {
        id: updated[0].id,
        name: updated[0].name,
        score: updated[0].score,
        total_exp: updated[0].total_exp,  // 确保包含
        avatar_url: updated[0].avatar_url,
        team_id: `t${updated[0].team_id}`
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})
```

**前端修改：** `mobile/App.tsx`

```typescript
// 在 handleUpdateScore 函数中，刷新学生列表后确保所有字段都更新
const handleUpdateScore = async (studentIds: string[], points: number, reason: string) => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'https://xysrxgjnpycd.sealoshzh.site/api'

    for (const id of studentIds) {
      await fetch(`${apiUrl}/students/${id}/adjust-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, reason })
      })
    }

    // 重新获取完整的学生列表
    const refreshResponse = await fetch(`${apiUrl}/students`)
    const refreshData = await refreshResponse.json()

    if (refreshData.success && Array.isArray(refreshData.data)) {
      const arr = refreshData.data.map((apiStudent: any) => ({
        id: String(apiStudent.id),
        name: apiStudent.name,
        avatar: apiStudent.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(apiStudent.name)}`,
        points: apiStudent.score || 0,
        exp: apiStudent.total_exp || 0,  // 确保包含
        level: apiStudent.level || 1,
        className: apiStudent.class_name || '未分配',
        team_id: `t${apiStudent.team_id}`,
        habitStats: {}
      }))
      setStudents(arr)
    }
  } catch (error) {
    console.error('Error updating scores:', error)
  }
}
```

**大屏端修改：** `mobile/bigscreen/main.tsx`

```typescript
// 删除战队显示逻辑，改为从学生数据获取
// 删除这一行：
// <Header wsConnected={wsConnected} showTeams={true} />

// 改为：
// <Header wsConnected={wsConnected} />

// 确保战队数据沿用手机端的
const teamsMap = useMemo(() => {
  return new Map<string, Team>([
    ['t1', { id: 't1', name: '超能英雄', color: 'bg-cyan-500', textColor: 'text-cyan-400' }],
    ['t2', { id: 't2', name: '天才少年', color: 'bg-purple-500', textColor: 'text-purple-400' }],
    ['t3', { id: 't3', name: '学霸无敌', color: 'bg-red-500', textColor: 'text-red-400' }],
  ])
}, [])
```

### 验证清单

- [ ] 战队数据已更新为三个新战队
- [ ] 手机端修改积分后，经验值同时更新
- [ ] 学生卡显示的经验值与修改结果一致
- [ ] 大屏端显示战队信息
- [ ] API 返回的数据包含 total_exp 字段

---

## Feature 3: 个人信息编辑

### 预计工时：3 小时
### 优先级：🟡 中
### 复杂度：⭐⭐

### 步骤 3.1：创建编辑模态框

**文件：** `mobile/components/StudentNameEditor.tsx`

```typescript
import React, { useState } from 'react'

interface StudentNameEditorProps {
  student: {
    id: string
    name: string
    avatar: string
  }
  onSave: (name: string) => Promise<void>
  onCancel: () => void
}

const StudentNameEditor: React.FC<StudentNameEditorProps> = ({
  student,
  onSave,
  onCancel
}) => {
  const [name, setName] = useState(student.name)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      alert('姓名不能为空')
      return
    }

    setLoading(true)
    try {
      await onSave(name)
      setLoading(false)
    } catch (error) {
      console.error('保存失败：', error)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80">
        <h2 className="text-xl font-bold mb-4">编辑学生姓名</h2>

        <div className="flex items-center gap-4 mb-4">
          <img
            src={student.avatar}
            alt={student.name}
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="输入新姓名"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default StudentNameEditor
```

### 步骤 3.2：集成到班级管理

**修改：** `mobile/pages/ClassManage.tsx`

```typescript
import StudentNameEditor from '../components/StudentNameEditor'

const ClassManage: React.FC = () => {
  const [editingStudent, setEditingStudent] = useState<any>(null)

  const handleStudentAvatarClick = (student: any) => {
    setEditingStudent(student)
  }

  const handleSaveName = async (newName: string) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://xysrxgjnpycd.sealoshzh.site/api'
      const response = await fetch(`${apiUrl}/students/${editingStudent.id}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      })

      if (response.ok) {
        // 更新本地状态
        setStudents(students.map(s =>
          s.id === editingStudent.id ? { ...s, name: newName } : s
        ))
        setEditingStudent(null)
      }
    } catch (error) {
      console.error('保存失败：', error)
    }
  }

  return (
    <>
      {/* 现有的班级管理内容 */}

      {/* 学生卡片 */}
      <div
        onClick={() => handleStudentAvatarClick(student)}
        className="cursor-pointer"
      >
        <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full" />
      </div>

      {/* 编辑模态框 */}
      {editingStudent && (
        <StudentNameEditor
          student={editingStudent}
          onSave={handleSaveName}
          onCancel={() => setEditingStudent(null)}
        />
      )}
    </>
  )
}
```

### 后端修改：`routes/students.ts`

```typescript
router.put('/students/:id/name', async (req, res) => {
  const { id } = req.params
  const { name } = req.body

  try {
    await db.query('UPDATE students SET name = ? WHERE id = ?', [name, id])

    const updated = await db.query('SELECT * FROM students WHERE id = ?', [id])

    res.json({
      success: true,
      data: updated[0]
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})
```

### 验证清单

- [ ] 点击学生头像打开编辑对话框
- [ ] 修改姓名后点击保存
- [ ] 数据库正确更新
- [ ] 前端列表实时显示新姓名
- [ ] 取消按钮正常工作

---

## 其余功能实现概览

由于篇幅限制，我已为前 3 个功能提供了详细的实现步骤。以下是其余功能的实现概览：

### Feature 4: 班级预设（2 小时）
- **后端：** 添加默认班级到数据库
- **前端：** 班级下拉初始化时加载默认值
- **修改文件：** `mobile/services/mockData.ts`

### Feature 5: 积分管理重构（6 小时）
- **前端 UI 重构：** 删除括号、红色数字、新增输入框
- **积分数据表：** 添加 experience_value 字段
- **修改文件：** `mobile/pages/ScorePreset.tsx`

### Feature 6: 学生管理优化（3 小时）
- **删除文字输入框，改为下拉选择**
- **学生下拉列表来自现有学生**
- **修改文件：** `mobile/pages/ClassManage.tsx`

### Feature 7: 挑战历史记录（5 小时）
- **创建 challenge_history 表**
- **添加标签页组件**
- **查询本周数据**

### Feature 8: PK 系统增强（8 小时）
- **添加"平"按钮和黄色标签**
- **参与时扣除 50 积分，增加 200 经验值**
- **获胜奖励输入框和自动分配**
- **大屏端同步显示**

### Feature 9: 进度条系统（6 小时）
- **设计升级经验曲线**
- **大屏端显示进度条**
- **根据经验值自动更新**

### Feature 10: 打卡系统优化（5 小时）
- **创建打卡数据表**
- **个人卡显示打卡数据**
- **优化成功反馈 UI**

---

## 📱 推荐实现顺序

1. **Feature 1** - 登陆系统（基础）
2. **Feature 2** - 战队和经验值（关键）
3. **Feature 5** - 积分管理（核心）
4. **Feature 8** - PK 系统（复杂业务）
5. **Feature 9** - 进度条（大屏）
6. **Feature 3** - 个人编辑
7. **Feature 10** - 打卡优化
8. **Feature 7** - 挑战历史
9. **Feature 6** - 学生管理优化
10. **Feature 4** - 班级预设

---

**下一步：** 选择是否从 Feature 1 开始实现？

