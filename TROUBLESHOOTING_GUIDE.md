# 故障排查和快速参考指南

## 快速查找表

当遇到问题时，使用本表格快速定位问题和解决方案：

| # | 问题描述 | 症状 | 根本原因 | 解决方案 | 文件位置 |
|----|---------|------|---------|---------|---------|
| 1 | WebSocket 连接失败 | 大屏不显示实时数据 | Sealos 反向代理不支持 WSS | 改用 HTTP 轮询 | `main.tsx:34-77` |
| 2 | PK 榜单固定显示同一学生 | PK 榜显示学生 ID 16 vs 17 | API 返回固定顺序，未按积分排序 | 按 `total_points` 排序后取前N个 | `main.tsx:83-105` |
| 3 | 挑战榜不更新 | 挑战榜显示固定学生 | 同问题 2 | 按积分排序 | `main.tsx:108-131` |
| 4 | 荣誉勋章不更新 | 勋章显示固定数据 | 同问题 2 | 按积分排序 | `main.tsx:133-175` |
| 5 | PK 卡片显示空白 | 页面切换时有时为空 | 页面索引不重置 | 监听 `pks` 变化重置页面 | `PKBoardCard.tsx:34-37` |
| 6 | 调试日志混乱 | 控制台输出过多 | 未删除调试代码 | 删除 console.log 语句 | `App.tsx:151,170,179` |
| 7 | 构建失败 | npm run build 报错 | 配置问题或依赖问题 | 清理重装依赖 | 见下文 |
| 8 | 大屏静态资源 404 | 页面不显示或样式缺失 | 资源哈希值不匹配 | 更新 HTML 中的资源哈希 | `public/*.html` |

---

## 常见问题和解决方案

### Q1: 大屏显示"数据同步中"但从不更新

**诊断步骤：**
1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 刷新页面
4. 观察是否有对 `/api/students` 的请求

**如果没有看到请求：**
```javascript
// 在控制台运行以测试 API 连接
fetch('https://xysrxgjnpycd.sealoshzh.site/api/students')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error('API 错误:', e))
```

**如果 API 无响应：**
- 检查 API 服务器是否运行
- 验证网络连接
- 检查防火墙/代理设置

---

### Q2: 教师端修改积分，大屏不变化

**快速检查：**
1. 等待 3 秒（轮询延迟最多 2 秒 + 反应时间）
2. 检查大屏右上角连接状态（应显示绿色连接标志）
3. 打开浏览器控制台，观察网络请求频率

**如果没有网络请求：**
```javascript
// 在大屏页面控制台运行
const API_BASE_URL = 'https://xysrxgjnpycd.sealoshzh.site/api'
fetch(`${API_BASE_URL}/students`)
  .then(r => r.json())
  .then(d => {
    console.log('学生数据：', d.data?.map(s => ({id: s.id, name: s.name, score: s.score})))
  })
```

**如果教师端修改不工作：**
1. 打开教师端浏览器控制台
2. 修改学生积分
3. 查看是否有 POST 请求到 `/api/students/:id/adjust-score`

---

### Q3: PK 榜总是显示固定学生

**原因详解：**
```javascript
// ❌ 问题代码
const students = [
  {id: '16', name: '张三', score: 50},
  {id: '17', name: '李四', score: 40},
  {id: '18', name: '王五', score: 60},  // 最高分但不显示
]

// 直接使用索引，总是第一和第二个
const pk = {
  student_a: students[0].id,  // 总是 16
  student_b: students[1].id,  // 总是 17
}

// ✅ 正确代码
const sorted = students.sort((a, b) => b.score - a.score)  // 按分数排序
const pk = {
  student_a: sorted[0].id,  // 最高分（王五 60）
  student_b: sorted[1].id,  // 次高分（张三 50）
}
```

**验证方法：**
在浏览器控制台运行：
```javascript
// 查看当前 PK 数据
// 应该反映最高分的学生
const display = document.querySelector('[class*="PK榜"]')
console.log(display?.textContent)
```

---

### Q4: 构建成功但访问 404

**步骤：**
1. 验证构建输出：
```bash
ls -la /home/devbox/project/mobile/dist/
# 应该看到 assets/ 和 index.html
```

2. 检查是否复制到公开目录：
```bash
ls -la /home/devbox/project/public/
# 应该看到 assets/ 和多个 *.html
```

3. 验证文件时间戳是否最新：
```bash
# 应该是最近的时间
stat /home/devbox/project/public/admin.html
```

**如果文件存在但仍 404：**
1. 清除浏览器缓存（Ctrl+Shift+Del）
2. 使用无痕窗口测试
3. 检查 web 服务器配置

---

### Q5: 资源加载失败（白屏）

**原因通常是资源哈希值不匹配**

**检查步骤：**
1. 打开浏览器控制台（F12）
2. 查看 Console 标签的错误
3. 查看 Network 标签，找加载失败的请求

**常见错误信息：**
```
Failed to fetch resource:
/assets/bigscreen-Cc0BpzZl.js (NOT FOUND)
```

**解决方案：**
1. 重新构建：
```bash
npm run build
```

2. 查看新的资源哈希值：
```bash
ls /home/devbox/project/mobile/dist/assets/
# 记下新的文件名
```

3. 更新 HTML 文件：
```html
<!-- display.html 中的 -->
<script type="module" crossorigin src="/assets/bigscreen-[NEW_HASH].js"></script>
```

4. 复制到公开目录：
```bash
cp -r /home/devbox/project/mobile/dist/* /home/devbox/project/public/
```

---

## 代码检查清单

在修改代码后，使用以下清单验证质量：

### ✓ 导入检查
```bash
# 搜索未使用的导入
grep -n "import.*from" mobile/bigscreen/main.tsx | head -20

# 应该只有这些：
# import React, { useEffect, useMemo, useState } from 'react'
# import { createRoot } from 'react-dom/client'
# [其他使用过的组件]
# import { Student, Team } from './types'
# import { getTeams } from './services/sealosService'
```

### ✓ 调试代码检查
```bash
# 搜索所有 console 语句
grep -n "console\." mobile/bigscreen/main.tsx

# 应该只有错误处理语句，如：
# console.error('Failed to load teams:', error)
# console.error('Polling error:', error)
```

### ✓ 构建检查
```bash
npm run build

# 输出应该包含：
# ✓ built in X.XXs
# 没有 ERROR 或 warning
```

### ✓ 文件同步检查
```bash
# 检查最新的构建文件是否已复制
ls -lh /home/devbox/project/mobile/dist/assets/*.js | head -3
ls -lh /home/devbox/project/public/assets/*.js | head -3

# 时间戳应该一致（或公开目录更新）
```

---

## 性能监控

### 轮询性能检查

在大屏页面的浏览器控制台运行：

```javascript
// 记录每次轮询时间
let pollCount = 0
const originalFetch = window.fetch
window.fetch = function(...args) {
  if (args[0].includes('/api/students')) {
    const startTime = performance.now()
    return originalFetch.apply(this, args).then(r => {
      const duration = performance.now() - startTime
      pollCount++
      console.log(`轮询 #${pollCount}: ${duration.toFixed(2)}ms`)
      return r
    })
  }
  return originalFetch.apply(this, args)
}

// 停止监控
// 刷新页面或关闭控制台
```

### 内存监控

```javascript
// 监控内存使用（如果浏览器支持）
if (performance.memory) {
  setInterval(() => {
    const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(2)
    const limit = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)
    console.log(`内存使用: ${used}MB / ${limit}MB`)
  }, 5000)
}
```

---

## 部署检查清单

在部署到生产环境前：

- [ ] 代码已通过 `npm run build`
- [ ] 没有 TypeScript 错误或警告
- [ ] 所有调试日志已删除
- [ ] 未使用的导入已清理
- [ ] 所有 console.log 都已删除
- [ ] HTML 文件中的资源哈希值已更新
- [ ] 构建产物已复制到 public 目录
- [ ] 浏览器测试通过
- [ ] 大屏显示正常
- [ ] 教师端修改能实时反映在大屏
- [ ] 没有浏览器控制台错误

---

## 快速命令参考

```bash
# 构建
npm run build

# 复制构建产物
cp -r /home/devbox/project/mobile/dist/* /home/devbox/project/public/

# 检查大屏文件
ls -la /home/devbox/project/public/bigscreen/

# 检查资源文件
ls /home/devbox/project/public/assets/ | grep -E "bigscreen|main"

# 查看构建大小
du -sh /home/devbox/project/mobile/dist/

# 快速测试 API
curl https://xysrxgjnpycd.sealoshzh.site/api/students | jq '.data | length'
```

---

## 日志级别参考

在修改代码时，遵循以下日志原则：

```typescript
// ✅ 保留：关键业务错误
console.error('Failed to load teams:', error)
console.error('Polling error:', error)

// ❌ 删除：调试信息
console.log('更新了学生积分')
console.log(`Current PK: ${pk.student_a} vs ${pk.student_b}`)

// ❌ 删除：业务流程日志
console.log('[API] POINTS_UPDATED: 5 students')

// ❌ 删除：功能验证日志
console.log('✅ Component mounted')
```

---

## 相关资源

- **主技术文档：** `TECHNICAL_DOCUMENTATION.md`
- **项目根目录：** `/home/devbox/project/`
- **大屏应用：** `/home/devbox/project/mobile/bigscreen/`
- **教师端应用：** `/home/devbox/project/mobile/`
- **公开资源：** `/home/devbox/project/public/`

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| 1.0 | 2024-11-22 | 初始版本 |

---

**最后更新：** 2024年11月22日
**文档版本：** 1.0
