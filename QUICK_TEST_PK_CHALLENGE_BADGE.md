# 🧪 PK、挑战、勋章修复 - 快速测试指南

**修复日期**: 2025年11月23日
**Git 提交**: 5a16972 - Fix: 修复 PK、挑战、勋章数据持久化问题

---

## 🚀 快速启动

### 第1步：重启后端服务
```bash
cd /home/devbox/project
pkill -f "node server.js"
node server.js

# 预期输出：看到 "Growark Server Started Successfully"
```

### 第2步：重启前端（新终端）
```bash
cd /home/devbox/project/mobile
npm run dev

# 预期输出：看到 "Local: http://localhost:5173"
```

### 第3步：打开浏览器
- **手机端**: http://localhost:5173/admin
- **大屏端**: http://localhost:5173/display

---

## ✅ 测试场景

### 测试1: 勋章授予 (Badge Grant)

**操作流程**:
1. 手机端 → **班级管理** → **勋章** 选项卡
2. 在"新增勋章"区域填写勋章信息（可选）
3. 在"授予勋章"区域：
   - 选择一个勋章
   - 选择一个学生
   - 点击"添加"按钮
   - 点击"批量授予"按钮
4. **检查点**:
   - ✅ 应该看到成功提示
   - ✅ 没有错误信息

**验证数据持久化**:
```bash
# 检查数据库
psql -d postgres -c "SELECT student_id, badge_id, awarded_at FROM student_badges ORDER BY awarded_at DESC LIMIT 3;"
# 预期：看到刚才授予的勋章记录

# 刷新页面
# 预期：勋章仍然显示在学生的信息卡中
```

---

### 测试2: PK 创建和显示

**操作流程**:
1. 手机端 → **班级管理** → **PK** 选项卡
2. 填写 PK 信息：
   - 选择学生 A（例如：庞子玮）
   - 选择学生 B（例如：刘凡兮）
   - 填写主题（例如：数学竞赛）
3. 点击"创建"按钮
4. **检查点**:
   - ✅ 新 PK 应该立即出现在"PK 列表"的**第一行**
   - ✅ 状态应该是"pending"（待定）

**验证大屏显示**:
1. 打开大屏端 (http://localhost:5173/display)
2. 查看右上方"PK 区域"
3. **检查点**:
   - ✅ 新创建的 PK 应该显示在列表中
   - ✅ 显示学生 A vs 学生 B
   - ✅ 显示主题

**验证数据持久化**:
```bash
# 刷新大屏端
# 预期：PK 数据仍然显示（不是消失）

# 刷新手机端
# 预期：PK 列表中仍然显示该 PK

# 检查数据库
psql -d postgres -c "SELECT id, student_a, student_b, topic, status FROM pk_matches ORDER BY id DESC LIMIT 3;"
```

---

### 测试3: 挑战发布和显示

**操作流程**:
1. 手机端 → **班级管理** → **挑战** 选项卡
2. 在"发布挑战"区域填写：
   - 标题：例如"一周阅读挑战"
   - 描述：例如"完成 5 本书的阅读"
   - 选择参与学生（可选）
   - 积分奖励：例如 20
   - 经验值奖励：例如 50
3. 点击"发布"按钮
4. **检查点**:
   - ✅ 新挑战应该立即出现在"进行中"列表的**第一行**
   - ✅ 挑战内容显示正确

**验证大屏显示**:
1. 打开/刷新大屏端
2. 查看"挑战竞技场"区域
3. **检查点**:
   - ✅ 新发布的挑战应该显示在列表中
   - ✅ 挑战标题和描述正确显示

**验证数据持久化**:
```bash
# 刷新页面后检查
# 预期：挑战仍然显示，不是消失

# 数据库验证
psql -d postgres -c "SELECT id, title, description, status FROM challenges ORDER BY id DESC LIMIT 3;"
```

---

## 🔍 完整功能验证

### 验证1: 页面刷新不丢失数据

**操作流程**:
1. 完成所有上述操作（勋章、PK、挑战都创建过）
2. 手机端 F5 刷新页面
3. **检查点**:
   - ✅ 勋章仍然显示在学生卡片中
   - ✅ PK 列表仍然显示所有创建的 PK
   - ✅ 挑战列表仍然显示所有创建的挑战

4. 大屏端 F5 刷新页面
5. **检查点**:
   - ✅ PK 区域仍然显示
   - ✅ 挑战竞技场仍然显示
   - ✅ 没有恢复到初始空状态

### 验证2: 浏览器关闭后重新打开

**操作流程**:
1. 完成所有操作后，关闭浏览器
2. 重新打开浏览器
3. 访问 http://localhost:5173/admin
4. **检查点**:
   - ✅ 勋章、PK、挑战数据全部恢复
   - ✅ 没有任何数据丢失

### 验证3: 实时同步

**操作流程**:
1. 打开两个浏览器标签页：
   - 标签1：手机端 (http://localhost:5173/admin)
   - 标签2：大屏端 (http://localhost:5173/display)
2. 在手机端创建一个新 PK
3. 立即查看大屏端
4. **检查点**:
   - ✅ 大屏端应该在 5 秒内显示新 PK
   - ✅ 不需要手动刷新

---

## 🚨 故障排查

### 问题1: 勋章授予返回错误

**症状**: 点击"批量授予"后显示错误

**排查步骤**:
1. 打开浏览器 DevTools (F12)
2. 进入 **Network** 标签
3. 尝试授予勋章
4. 查看 POST 请求的 URL 和响应
5. **预期 URL**: `/api/students/{id}/badges` 或 `/api/students/{id}/badges/{badgeId}`
6. **预期响应**: `{"success": true, ...}`

**修复**:
- 检查 server.js 是否有新增的 POST 端点（第733-767行）
- 重启后端服务

### 问题2: PK/挑战创建后不显示

**症状**: 创建后不显示在列表中

**排查步骤**:
1. 检查浏览器 DevTools 中是否有 JavaScript 错误
2. 查看 POST 响应是否成功 (`"success": true`)
3. 检查网络请求是否正确发送到后端

**修复**:
- 确保 ClassManage.tsx 中的 handlePublishChallenge 和 handleCreatePK 有最新修改（包含 ...prev）
- 检查 setSt 函数调用是否正确

### 问题3: 大屏不显示 PK 和挑战

**症状**: 大屏始终为空或只显示模拟数据

**排查步骤**:
1. 打开浏览器 DevTools
2. 在 **Console** 中运行：
```javascript
fetch('http://localhost:3000/api/pk-matches')
  .then(r => r.json())
  .then(d => console.log('PK Data:', d))

fetch('http://localhost:3000/api/challenges')
  .then(r => r.json())
  .then(d => console.log('Challenge Data:', d))
```
3. **检查**:
   - 是否返回 `"success": true`
   - 是否有数据在 `data` 数组中

**修复**:
- 确保 bigscreen/main.tsx 有新增的 useEffect（第44-93行）
- 检查 realPks 和 realChallenges 状态是否更新
- 重启前端 npm run dev

---

## 📊 预期测试结果

| 功能 | 测试前 | 修复后 | 验证方法 |
|------|--------|--------|---------|
| **勋章授予** | ❌ 失败 | ✅ 成功 | 授予后检查数据库 |
| **PK 显示第一行** | ❌ 显示在最后 | ✅ 显示在第一行 | 创建后查看列表位置 |
| **挑战显示第一行** | ❌ 显示在最后 | ✅ 显示在第一行 | 发布后查看列表位置 |
| **大屏显示真实数据** | ❌ 模拟数据 | ✅ 真实数据 | 大屏查看 PK 和挑战 |
| **页面刷新保留数据** | ❌ 消失 | ✅ 保留 | F5 刷新后检查 |
| **浏览器关闭后恢复** | ❌ 丢失 | ✅ 恢复 | 关闭重打开检查 |

---

## ✅ 修复完成标志

当以下所有条件满足时，修复完成：

- [ ] 勋章授予成功，数据库有记录
- [ ] PK 创建成功，显示在第一行
- [ ] 挑战发布成功，显示在第一行
- [ ] 大屏显示真实 PK 和挑战（不是模拟数据）
- [ ] 页面刷新后数据仍然保留
- [ ] 浏览器关闭后数据仍然恢复
- [ ] 大屏每 5 秒自动更新最新数据

---

## 🆘 需要帮助？

如果测试失败，请：

1. 查看详细诊断文档：`PK_CHALLENGE_BADGE_FIX.md`
2. 检查浏览器 DevTools 的错误信息
3. 检查后端日志：
```bash
# 查看最后的错误
grep -i "error" /tmp/server.log | tail -20
```

4. 验证数据库连接：
```bash
psql -d postgres -c "SELECT 1"
```

---

**测试完成后，所有功能应该正常运行！**

修复提交: `5a16972`
修复文件: server.js, App.tsx, ClassManage.tsx, bigscreen/main.tsx
