# 📑 Sealos 部署资源索引

## 🎯 快速开始

**如果你只有 5 分钟:**
1. 阅读本文件的"快速检查清单"部分
2. 运行 `bash verify-deployment.sh`
3. 按照"Web UI 部署步骤"进行部署

**如果你有 10 分钟:**
1. 阅读 `DEPLOYMENT_READY.md`
2. 按照"部署步骤"操作
3. 验证连接

**如果你想了解完整细节:**
1. 阅读 `COMPLETE_DEPLOYMENT_GUIDE.md`
2. 查看 `SEALOS_DEPLOY_GUIDE.md` 了解故障排查

---

## 📚 文档导航

### 第一次部署？从这里开始

| 文档 | 用途 | 阅读时间 |
|------|------|---------|
| **DEPLOYMENT_READY.md** | ⭐ 快速部署指南 | 5-10 分钟 |
| **COMPLETE_DEPLOYMENT_GUIDE.md** | 完整部署指南 | 10-15 分钟 |
| **SEALOS_DEPLOY_GUIDE.md** | 详细步骤和故障排查 | 15-20 分钟 |

### 遇到问题？查看这些文档

| 问题 | 文档 | 解决方案 |
|------|------|---------|
| 应用无法加载 | SEALOS_DEPLOY_GUIDE.md | Q1: 应用无法访问 |
| WebSocket 连接失败 | SEALOS_DEPLOY_GUIDE.md | Q2: WebSocket 连接失败 |
| CORS 错误 | SEALOS_DEPLOY_GUIDE.md | Q3: CORS 错误 |
| 数据不同步 | SEALOS_DEPLOY_GUIDE.md | Q4: 数据不同步 |

---

## 🛠️ 可用的脚本和工具

### 验证脚本

```bash
# 检查部署状态
bash deployment-status.sh

# 最终验证（部署前必运行）
bash verify-deployment.sh
```

### 配置检查

```bash
# 查看大屏端生产配置
cat bigscreen/.env.production

# 查看手机端生产配置
cat mobile/.env.production

# 查看后端生产配置
cat .env.production

# 检查后端 API 状态
curl https://xysrxgjnpycd.sealoshzh.site/api/health
```

---

## 📦 部署产物位置

### 可部署文件

```
bigscreen/dist/                 ← 大屏端应用
├── index.html
└── assets/

mobile/dist/                    ← 手机端应用
├── index.html
└── assets/
```

### 所需文件清单 ✅

- [x] `bigscreen/dist/index.html` - 大屏端主页面
- [x] `bigscreen/dist/assets/` - 编译后的 JavaScript
- [x] `mobile/dist/index.html` - 手机端主页面
- [x] `mobile/dist/assets/` - 编译后的 JavaScript

---

## 🚀 Web UI 部署步骤（简明版）

### 部署大屏端

1. 访问 https://cloud.sealos.io
2. **应用管理** → **创建应用**
3. 类型: **静态网站**
4. 名称: `bigscreen`
5. 上传: `bigscreen/dist/`
6. 点击 **创建**
7. ⭐ **记录** 分配地址

### 部署手机端

1. 重复上述步骤
2. 名称: `mobile`
3. 上传: `mobile/dist/`
4. ⭐ **记录** 分配地址

---

## ✅ 快速检查清单

### 部署前检查

- [ ] 运行 `bash verify-deployment.sh`
- [ ] 确认大屏端和手机端都已构建
- [ ] 确认环境配置文件存在
- [ ] 后端 API 可访问

### 部署时检查

- [ ] 选择了 "静态网站" 类型
- [ ] 上传了完整的 dist 文件夹
- [ ] 记录了分配的公网地址

### 部署后检查

- [ ] 大屏端地址可访问
- [ ] 手机端地址可访问
- [ ] 大屏端显示 "已连接"
- [ ] 可以创建学生/修改数据

### 同步验证

- [ ] 手机端创建学生
- [ ] 大屏端 <1 秒内显示
- [ ] 数据一致

---

## 🔗 关键地址（必记）

```
后端公网地址:    https://xysrxgjnpycd.sealoshzh.site
后端 API:        https://xysrxgjnpycd.sealoshzh.site/api
WebSocket:       wss://xysrxgjnpycd.sealoshzh.site

Sealos 控制台:   https://cloud.sealos.io

大屏端地址:      https://bigscreen-<id>.sealoshzh.site
手机端地址:      https://mobile-<id>.sealoshzh.site
```

---

## 📊 构建产物统计

| 应用 | 大小 | 文件数 | 状态 |
|------|------|--------|------|
| 大屏端 | 176KB | 1 JS + 1 HTML | ✅ 可用 |
| 手机端 | 560KB | 3 JS + 1 HTML | ✅ 可用 |

---

## 🎯 预期效果

部署完成后你将拥有：

✅ **公网实时大屏系统**
  - 实时排行榜显示
  - WebSocket 自动更新
  - 支持移动浏览器

✅ **公网学生管理系统**
  - 创建/编辑学生
  - 修改成绩和徽章
  - 实时同步到大屏

✅ **完整的三端架构**
  - 后端 API + WebSocket
  - 手机端管理
  - 大屏端展示

---

## ⏱️ 时间预估

| 任务 | 时间 |
|------|------|
| 阅读文档 | 5-10 分钟 |
| 运行验证脚本 | 1 分钟 |
| 部署大屏端 | 2-3 分钟 |
| 部署手机端 | 2-3 分钟 |
| 测试验证 | 5 分钟 |
| **总计** | **15-20 分钟** |

---

## 💡 关键概念

### 为什么使用 HTTPS/WSS？

- Sealos 强制 HTTPS
- 浏览器安全政策
- 已在 `.env.production` 配置

### 为什么要上传整个 dist 文件夹？

- index.html 是应用入口
- assets 文件夹包含编译代码
- 目录结构很重要

### 为什么部署需要等待？

- Pod 初始化需要时间
- 通常 1-2 分钟
- 网络传输需要时间

### 如何验证实时同步？

1. 打开两个浏览器标签
2. 一个打开手机端，一个大屏端
3. 手机端创建学生
4. 观察大屏端 (<1 秒更新)

---

## 🆘 常见问题快速链接

📖 查看 `SEALOS_DEPLOY_GUIDE.md` 了解：

- Q1: 应用无法访问 → 检查 dist 文件夹
- Q2: WebSocket 连接失败 → 检查后端状态
- Q3: CORS 错误 → 检查 HTTPS 配置
- Q4: 数据不同步 → 刷新页面并检查连接

---

## 📞 获取帮助的步骤

1. **运行验证脚本**
   ```bash
   bash verify-deployment.sh
   ```

2. **查看相关文档**
   - 快速参考: `DEPLOYMENT_READY.md`
   - 详细指南: `SEALOS_DEPLOY_GUIDE.md`

3. **检查浏览器控制台**
   按 F12 查看错误信息

4. **检查 Sealos 状态**
   访问 https://cloud.sealos.io 查看 Pod 状态

---

## ✨ 下一步

🚀 **立即开始部署:**

1. 运行验证脚本
   ```bash
   bash verify-deployment.sh
   ```

2. 打开 DEPLOYMENT_READY.md
   ```bash
   cat DEPLOYMENT_READY.md
   ```

3. 访问 Sealos 控制台
   https://cloud.sealos.io

4. 按照步骤部署应用

5. 记录分配的地址

6. 测试并享受你的系统！

---

**祝您部署顺利！** 🎉
