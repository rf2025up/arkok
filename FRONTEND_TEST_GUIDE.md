# ✅ 前端应用测试指南

## 🎯 目标

验证前端应用与后端的映射关系是否正确，三端协作是否正常。

---

## ✅ 映射验证（已确认）

### 大屏端
- **公网地址**: https://xysrxgjnpycd.sealoshzh.site/display ✅
- **对应文件**: `public/display.html` ✅
- **状态**: 正常返回 ✅

### 手机端
- **公网地址**: https://xysrxgjnpycd.sealoshzh.site/admin ✅
- **对应文件**: `public/admin.html` ✅
- **状态**: 正常返回 ✅

### 后端 API
- **公网 API**: https://xysrxgjnpycd.sealoshzh.site/api ✅
- **对应文件**: `server.js` ✅
- **状态**: 正常运行 ✅

---

## 📋 测试清单

### ✅ 第 1 步：验证后端服务

```bash
# 测试后端健康检查
curl -i https://xysrxgjnpycd.sealoshzh.site/health

# 预期结果：
# HTTP/2 200
# {"status":"OK"}
```

### ✅ 第 2 步：验证 API 功能

**获取所有学生**
```bash
curl -s https://xysrxgjnpycd.sealoshzh.site/api/students | jq .

# 预期结果：
# {
#   "success": true,
#   "data": [
#     {"id": 1, "name": "张三", "score": 85, ...},
#     ...
#   ],
#   "total": N
# }
```

**创建新学生**
```bash
curl -X POST https://xysrxgjnpycd.sealoshzh.site/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"新学生","score":90}' | jq .

# 预期结果：
# {
#   "success": true,
#   "data": {"id": N, "name": "新学生", "score": 90, ...}
# }
```

### ✅ 第 3 步：验证大屏端显示

**打开浏览器访问**
```
https://xysrxgjnpycd.sealoshzh.site/display
```

**应该看到**:
- ✅ 蓝色渐变背景
- ✅ "学生积分排行榜"标题
- ✅ 学生列表排行榜
- ✅ 连接状态指示器（右上角）
- ✅ 实时数据刷新

**检查 WebSocket 连接**:
1. 按 F12 打开开发者工具
2. 进入 Network 标签
3. 查看 WS 连接
4. 应该看到连接到 `wss://xysrxgjnpycd.sealoshzh.site`

### ✅ 第 4 步：验证手机端管理

**打开浏览器访问**
```
https://xysrxgjnpycd.sealoshzh.site/admin
```

**应该看到**:
- ✅ 浅色背景的管理界面
- ✅ 学生列表
- ✅ 创建学生按钮
- ✅ 编辑/删除功能
- ✅ 积分调整按钮

### ✅ 第 5 步：测试实时同步（关键！）

**步骤**:

1. **打开两个浏览器标签页**
   - 标签 1: 大屏端 https://xysrxgjnpycd.sealoshzh.site/display
   - 标签 2: 手机端 https://xysrxgjnpycd.sealoshzh.site/admin

2. **在手机端创建新学生**
   - 点击"创建学生"按钮
   - 输入名称和积分
   - 点击保存

3. **观察大屏端**
   - ✅ 应该在 **1 秒内** 显示新学生
   - ✅ 排行榜应该自动更新
   - ✅ 不需要手动刷新

4. **在手机端调整积分**
   - 选择一个学生
   - 调整积分（如 +50）
   - 点击保存

5. **观察大屏端**
   - ✅ 排名应该立即改变
   - ✅ 积分应该实时更新

**✅ 如果所有以上都正常，说明三端协作完美！**

---

## 🔍 详细验证流程

### 验证流程图

```
┌─────────────────────────────────────────────────┐
│ 手机端 (/admin)                                 │
│ 用户创建/修改学生                                │
└────────────────┬────────────────────────────────┘
                 │
                 ↓ HTTP POST
        ┌────────────────────┐
        │ 后端 API (/api)    │
        │ - 保存到数据库      │
        │ - 触发事件广播      │
        └────────┬───────────┘
                 │
         ┌───────┴──────────┐
         │                  │
         ↓                  ↓
    HTTP 响应         WebSocket 广播
         │                  │
         ↓                  ↓
   手机端更新        大屏端实时更新
   (更新列表)        (更新排行榜)
```

### 性能指标验证

**延迟测试**:
1. 在手机端创建学生，记录时间
2. 观察大屏端出现时间
3. 应该 < 100ms 显示

**并发测试**:
1. 快速在手机端创建多个学生
2. 大屏端应该流畅显示，无卡顿
3. 支持 100+ 并发连接

---

## 🛠️ 故障排查

### 问题 1: 大屏端无法访问

```bash
# 测试
curl -v https://xysrxgjnpycd.sealoshzh.site/display

# 排查
- [ ] 检查网络连接
- [ ] 检查后端服务是否运行
- [ ] 检查 Sealos 部署是否正常
```

### 问题 2: 手机端无法访问

```bash
# 测试
curl -v https://xysrxgjnpycd.sealoshzh.site/admin

# 排查
- [ ] 检查 public/admin.html 是否存在
- [ ] 检查 server.js 中的路由
- [ ] 检查 Sealos 部署是否正常
```

### 问题 3: 大屏端连接失败（显示红色离线）

```bash
# 检查 WebSocket
# 在浏览器 F12 → Console 中运行：
new WebSocket('wss://xysrxgjnpycd.sealoshzh.site')

# 排查
- [ ] 检查后端 WebSocket 是否启动
- [ ] 检查 WSS 证书是否有效
- [ ] 检查防火墙是否阻止
```

### 问题 4: 数据不同步

```bash
# 测试
# 1. 手机端创建学生
# 2. 立即查询 API
curl https://xysrxgjnpycd.sealoshzh.site/api/students

# 3. 大屏端是否显示新学生

# 排查
- [ ] 检查大屏端 WebSocket 连接状态
- [ ] 检查浏览器控制台是否有错误
- [ ] 检查数据库连接是否正常
```

---

## 📱 浏览器开发者工具验证

### 大屏端调试

**F12 → Network 标签**:
```
Filter: ws
应该看到连接到 wss://xysrxgjnpycd.sealoshzh.site
Status: 101 Switching Protocols
```

**F12 → Console**:
```javascript
// 手动测试 WebSocket
const ws = new WebSocket('wss://xysrxgjnpycd.sealoshzh.site');
ws.onopen = () => console.log('✅ 连接成功');
ws.onmessage = (e) => console.log('📨 收到消息:', e.data);
ws.onerror = (e) => console.log('❌ 错误:', e);
```

### 手机端调试

**F12 → Network 标签**:
```
Filter: api
应该看到请求到 /api/students 等端点
Status: 200 OK
Response: JSON 格式的学生数据
```

**F12 → Application → Storage**:
```
检查是否有缓存的学生数据
查看 LocalStorage 或 SessionStorage
```

---

## 📊 测试报告模板

```
测试日期: 2025-11-22
环境: 生产 (Sealos)
测试者: [你的名字]

✅ 测试结果

1. 后端服务
   - [ ] 健康检查通过
   - [ ] API 端点响应正常
   - [ ] 数据库连接正常

2. 大屏端
   - [ ] 页面能访问
   - [ ] WebSocket 连接
   - [ ] 实时显示数据

3. 手机端
   - [ ] 页面能访问
   - [ ] 能创建学生
   - [ ] 能修改积分

4. 实时同步
   - [ ] 创建学生 < 1 秒显示
   - [ ] 修改积分立即更新
   - [ ] 排行榜正确排序

5. 性能指标
   - [ ] 延迟 < 100ms
   - [ ] 无卡顿现象
   - [ ] 支持多用户

总体评分: ⭐⭐⭐⭐⭐ (5/5)
```

---

## 🎯 测试命令速查

### 快速验证所有服务

```bash
#!/bin/bash

echo "=== 测试后端服务 ==="
curl -s https://xysrxgjnpycd.sealoshzh.site/health | jq .

echo "=== 测试大屏端 ==="
curl -s https://xysrxgjnpycd.sealoshzh.site/display | head -5

echo "=== 测试手机端 ==="
curl -s https://xysrxgjnpycd.sealoshzh.site/admin | head -5

echo "=== 测试 API ==="
curl -s https://xysrxgjnpycd.sealoshzh.site/api/students | jq '.total'

echo "=== 所有测试完成 ==="
```

保存为 `test-all.sh` 并运行：
```bash
chmod +x test-all.sh
./test-all.sh
```

---

## 📞 需要帮助？

- **映射问题**: 查看 `FRONTEND_MAPPING.md`
- **部署问题**: 查看 `DEPLOY_WITH_ENTRYPOINT.md`
- **API 文档**: 访问 https://xysrxgjnpycd.sealoshzh.site/api-docs
- **项目概览**: 查看 `README.md`

---

**测试状态**: ✅ 前端映射正确，系统准备就绪
**最后更新**: 2025-11-22
**验证日期**: 2025-11-22
