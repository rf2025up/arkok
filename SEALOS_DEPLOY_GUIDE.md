# Sealos Frontend 部署完整指南

## 📋 部署前检查清单

✅ **已完成:**
- [x] 大屏端前端已构建: `bigscreen/dist/`
- [x] 手机端前端已构建: `mobile/dist/`
- [x] 环境变量已配置 (使用公网地址)
- [x] 后端已部署在 Sealos 公网: `https://xysrxgjnpycd.sealoshzh.site`

## 🚀 快速部署步骤

### 第 1 步: 部署大屏端 (BigScreen)

#### 方法 A: 使用 Sealos Web UI（推荐用户界面操作）

1. 访问 https://cloud.sealos.io
2. 登录您的账户
3. 在左侧菜单中选择 **应用管理** 或 **应用**
4. 点击 **创建应用** 或 **新建应用**
5. 选择 **静态网站** 作为应用类型
6. 在应用名称中填写: `bigscreen`
7. 将 `bigscreen/dist` 文件夹中的所有文件上传
   - 可以直接拖拽整个文件夹
   - 或逐个上传文件
8. 点击 **创建/部署**
9. 等待部署完成，记录分配的公网地址
   - 格式通常为: `https://bigscreen-xxx.sealoshzh.site`

#### 配置验证:
```
✓ 大屏端应该能访问后端 API:
  - API: https://xysrxgjnpycd.sealoshzh.site/api
  - WebSocket: wss://xysrxgjnpycd.sealoshzh.site
  (这些已在 bigscreen/.env.production 中配置)
```

### 第 2 步: 部署手机端 (Mobile)

#### 方法 A: 使用 Sealos Web UI

1. 访问 https://cloud.sealos.io
2. 在 **应用管理** 中选择 **创建应用**
3. 选择 **静态网站** 作为应用类型
4. 在应用名称中填写: `mobile`
5. 将 `mobile/dist` 文件夹中的所有文件上传
6. 点击 **创建/部署**
7. 等待部署完成，记录分配的公网地址
   - 格式通常为: `https://mobile-xxx.sealoshzh.site`

#### 配置验证:
```
✓ 手机端应该能访问后端 API:
  - API: https://xysrxgjnpycd.sealoshzh.site/api
  (这个已在 mobile/.env.production 中配置)
```

---

## 🔍 部署后验证

### 第 1 步: 检查大屏端连接状态
```bash
curl https://bigscreen-xxx.sealoshzh.site
# 应该返回 HTML 页面
```

### 第 2 步: 检查手机端连接状态
```bash
curl https://mobile-xxx.sealoshzh.site
# 应该返回 HTML 页面
```

### 第 3 步: 检查后端 API 连接
```bash
curl https://xysrxgjnpycd.sealoshzh.site/api/health
# 应该返回 {"status":"OK"} 或类似响应
```

---

## 🧪 功能测试

### 测试实时同步功能

#### 手机端测试:
1. 打开手机端地址: `https://mobile-xxx.sealoshzh.site`
2. 进入应用界面
3. 创建一个新学生或修改分数
4. 记录时间戳

#### 大屏端验证:
1. 打开大屏端地址: `https://bigscreen-xxx.sealoshzh.site`
2. 查看该学生是否出现在排行榜中
3. 检查显示是否在创建后 **1 秒内** 更新

**预期结果**: 两端数据应该实时同步，延迟不超过 1 秒

---

## ⚙️ 环境配置说明

### 大屏端配置 (bigscreen/.env.production)
```env
# 公网 API 地址
REACT_APP_API_URL=https://xysrxgjnpycd.sealoshzh.site/api
# 公网 WebSocket 地址
REACT_APP_WS_URL=wss://xysrxgjnpycd.sealoshzh.site
VITE_API_URL=https://xysrxgjnpycd.sealoshzh.site/api
VITE_WS_URL=wss://xysrxgjnpycd.sealoshzh.site
```

**说明**:
- 使用 `https` 而不是 `http` (Sealos 强制 HTTPS)
- 使用 `wss` 而不是 `ws` (WebSocket Secure)
- 这些配置在构建时被编入 dist 文件

### 手机端配置 (mobile/.env.production)
```env
# 公网 API 地址
REACT_APP_API_URL=https://xysrxgjnpycd.sealoshzh.site/api
VITE_API_URL=https://xysrxgjnpycd.sealoshzh.site/api
```

---

## 🆘 故障排查

### 问题 1: 应用无法加载

**症状**: 访问 `https://bigscreen-xxx.sealoshzh.site` 返回 404 或空白页

**解决方案**:
1. 确认 `dist` 文件夹中有 `index.html` 文件
2. 在 Sealos 中重新部署该应用
3. 清除浏览器缓存后重试

### 问题 2: WebSocket 连接失败

**症状**: 大屏端显示"未连接"或无法接收实时更新

**解决方案**:
1. 检查后端是否在 Sealos 中正常运行
2. 验证 WebSocket URL 是否正确: `wss://xysrxgjnpycd.sealoshzh.site`
3. 检查浏览器控制台错误信息
4. 尝试使用 `https://cloud.sealos.io` 检查后端 Pod 状态

### 问题 3: API 请求返回 CORS 错误

**症状**: 浏览器控制台显示 CORS 错误

**解决方案**:
1. 确认后端 `server.js` 中已配置 CORS
2. 检查后端是否正常运行
3. 等待 Pod 完全启动（可能需要 30-60 秒）

### 问题 4: 数据不同步

**症状**: 手机端创建的学生没有在大屏端显示

**解决方案**:
1. 检查大屏端的连接状态指示器
2. 刷新大屏端页面
3. 检查后端日志是否有错误
4. 验证数据库是否成功保存

---

## 📊 部署架构

```
手机端 (Mobile)
    ↓
    ├─→ REST API: https://xysrxgjnpycd.sealoshzh.site/api
    │
后端 (Backend)
    ↓
    └─→ WebSocket: wss://xysrxgjnpycd.sealoshzh.site
        ↓
    大屏端 (BigScreen)

所有通信都通过 Sealos 的公网地址进行
```

---

## 📝 相关文件

| 文件路径 | 说明 |
|---------|------|
| `bigscreen/dist/` | 大屏端构建输出文件 |
| `mobile/dist/` | 手机端构建输出文件 |
| `bigscreen/.env.production` | 大屏端生产环境配置 |
| `mobile/.env.production` | 手机端生产环境配置 |
| `.env.production` | 后端生产环境配置 |

---

## ✅ 完整部署检查清单

- [ ] 大屏端已上传到 Sealos
- [ ] 手机端已上传到 Sealos
- [ ] 大屏端公网地址已记录
- [ ] 手机端公网地址已记录
- [ ] 大屏端可以访问: `https://bigscreen-xxx.sealoshzh.site`
- [ ] 手机端可以访问: `https://mobile-xxx.sealoshzh.site`
- [ ] 后端 API 可以访问: `https://xysrxgjnpycd.sealoshzh.site/api/health`
- [ ] 大屏端显示"已连接"状态
- [ ] 手机端可以创建学生
- [ ] 大屏端实时显示新创建的学生

---

## 🎉 部署完成!

一旦以上所有检查都通过，您的三端应用就已经完全部署到 Sealos 公网上了！

**关键地址:**
- 后端 API: `https://xysrxgjnpycd.sealoshzh.site`
- 大屏端: `https://bigscreen-xxx.sealoshzh.site`
- 手机端: `https://mobile-xxx.sealoshzh.site`
