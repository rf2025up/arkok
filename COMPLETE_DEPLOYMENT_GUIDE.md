# 🚀 Growark 系统 - Sealos 公网部署完整指南

## 📋 项目架构概述

**Growark** 是一个三端协作系统，包含：
- 📱 **手机端 (Mobile)**: 学生管理和成绩输入
- 🎓 **教师端**: 类实时大屏显示系统
- 🖥️ **大屏端 (BigScreen)**: 实时排行榜和成就展示
- ⚙️ **后端 API**: 数据处理和实时推送 (WebSocket)

---

## ✅ 当前状态

### 已完成

| 组件 | 状态 | 路径 | 说明 |
|------|------|------|------|
| 后端 | ✅ 部署 | `https://xysrxgjnpycd.sealoshzh.site` | Sealos 公网已运行 |
| 大屏端 | ✅ 构建 | `bigscreen/dist/` | 176KB，准备部署 |
| 手机端 | ✅ 构建 | `mobile/dist/` | 560KB，准备部署 |
| 配置 | ✅ 完成 | `.env.production` | HTTPS/WSS 已配置 |

### 待完成

| 任务 | 优先级 | 说明 |
|------|--------|------|
| 上传大屏端到 Sealos | 🔴 高 | 需在 Web UI 操作 |
| 上传手机端到 Sealos | 🔴 高 | 需在 Web UI 操作 |
| 功能测试 | 🟡 中 | 测试实时同步 |

---

## 🚀 快速开始 (5 步)

### 第 1 步: 准备工作
```bash
# 检查部署状态
bash deployment-status.sh

# 最终验证
bash verify-deployment.sh
```

### 第 2 步: 部署大屏端
1. 访问 https://cloud.sealos.io
2. 登录账户
3. **应用管理** → **创建应用**
4. 类型: **静态网站**
5. 名称: `bigscreen`
6. **上传** `bigscreen/dist/` 整个文件夹
7. **创建** → 等待完成
8. 记录分配地址: `https://bigscreen-xxx.sealoshzh.site`

### 第 3 步: 部署手机端
重复第 2 步，但：
- 名称: `mobile`
- 上传: `mobile/dist/`
- 记录: `https://mobile-xxx.sealoshzh.site`

### 第 4 步: 验证连接
```bash
# 检查大屏端
curl https://bigscreen-xxx.sealoshzh.site

# 检查手机端
curl https://mobile-xxx.sealoshzh.site

# 检查后端
curl https://xysrxgjnpycd.sealoshzh.site/api/health
```

### 第 5 步: 测试实时同步
1. 打开手机端: `https://mobile-xxx.sealoshzh.site`
2. 创建一个学生
3. 打开大屏端: `https://bigscreen-xxx.sealoshzh.site`
4. 验证学生在 1 秒内出现

---

## 🔗 关键地址速查表

| 用途 | 地址 | 用户 |
|------|------|------|
| Sealos 控制台 | https://cloud.sealos.io | Web UI |
| 后端 API | https://xysrxgjnpycd.sealoshzh.site/api | 前端 |
| 后端 WebSocket | wss://xysrxgjnpycd.sealoshzh.site | 大屏端 |
| 大屏端 | https://bigscreen-xxx.sealoshzh.site | 浏览器 |
| 手机端 | https://mobile-xxx.sealoshzh.site | 浏览器 |

---

## ⚙️ 配置详情

### 大屏端配置 (bigscreen/.env.production)
```env
# 使用 HTTPS 而不是 HTTP
REACT_APP_API_URL=https://xysrxgjnpycd.sealoshzh.site/api
# 使用 WSS (WebSocket Secure) 实时推送
REACT_APP_WS_URL=wss://xysrxgjnpycd.sealoshzh.site
VITE_API_URL=https://xysrxgjnpycd.sealoshzh.site/api
VITE_WS_URL=wss://xysrxgjnpycd.sealoshzh.site
```

**说明:**
- WSS 用于实时数据推送
- 大屏端通过 WebSocket 接收学生数据更新
- 延迟通常 < 100ms

### 手机端配置 (mobile/.env.production)
```env
# 仅需 HTTPS API
REACT_APP_API_URL=https://xysrxgjnpycd.sealoshzh.site/api
VITE_API_URL=https://xysrxgjnpycd.sealoshzh.site/api
```

---

## 🧪 验证检查清单

### ✅ 部署前检查
- [x] `bigscreen/dist/index.html` 存在
- [x] `bigscreen/dist/assets/` 有编译文件
- [x] `mobile/dist/index.html` 存在
- [x] `mobile/dist/assets/` 有编译文件
- [x] `.env.production` 配置正确

### ✅ 部署后检查
- [ ] 访问 `https://bigscreen-xxx.sealoshzh.site` 显示页面
- [ ] 访问 `https://mobile-xxx.sealoshzh.site` 显示页面
- [ ] 大屏端显示 "已连接" 状态
- [ ] 手机端可以交互
- [ ] 网络连接正常 (F12 控制台无错误)

---

## 🎯 预期效果

部署完成后，您将拥有:

✅ 公网可访问的大屏实时显示系统
✅ 公网可访问的手机管理系统
✅ 实时数据同步 (<100ms 延迟)
✅ 自动的 WebSocket 重连
✅ 响应式设计支持各种设备

---

## 🎉 总结

您的 Growark 系统已完全准备好部署到 Sealos 公网了！

**只需 3 个简单步骤:**
1. 上传 `bigscreen/dist` 到 Sealos
2. 上传 `mobile/dist` 到 Sealos
3. 测试连接和同步

**预计时间:** 5-10 分钟

祝您部署顺利! 🚀
