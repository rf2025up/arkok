# 🎯 前端应用映射指南

## 📊 当前状态分析

### 公网地址
- **大屏端**: https://xysrxgjnpycd.sealoshzh.site/display
- **手机端**: https://xysrxgjnpycd.sealoshzh.site/admin

### 本地开发地址
- **大屏端**: http://localhost:3000/display
- **手机端**: http://localhost:3000/admin
- **API**: http://localhost:3000/api

---

## 🗂️ 前端应用结构

### 当前配置（公网）

```
后端: server.js (Express + Node.js)
    ├── 静态文件服务 (public 目录)
    │   ├── /display → public/display.html (大屏展示)
    │   ├── /admin → public/admin.html (手机管理)
    │   └── /api-docs → public/api-docs.html
    └── API 路由 (Express)
        ├── GET /api/students
        ├── POST /api/students
        ├── PUT /api/students/:id
        └── DELETE /api/students/:id
```

### 项目中的应用目录

```
项目根目录/
├── server.js ← 后端主程序
├── public/ ← 当前部署的前端
│   ├── admin.html (✓ 手机端)
│   ├── display.html (✓ 大屏端)
│   └── api-docs.html
│
├── mobile/ ← 手机应用源码（React）
│   ├── src/
│   ├── dist/ ← 编译后文件
│   └── package.json
│
├── bigscreen/ ← 大屏应用源码（React）
│   ├── src/
│   ├── dist/ ← 编译后文件
│   └── package.json
└── ...
```

---

## 🔄 映射关系详解

### ✅ 已部署的映射（公网正常运行）

| 访问地址 | 对应文件 | 应用名称 | 功能 | 状态 |
|---------|--------|--------|------|------|
| `/display` | `public/display.html` | 大屏展示系统 | 实时显示学生排行榜 | ✅ 运行中 |
| `/admin` | `public/admin.html` | 手机管理系统 | 学生管理、积分调整 | ✅ 运行中 |
| `/api-docs` | `public/api-docs.html` | API 文档 | API 接口说明 | ✅ 运行中 |
| `/api/*` | server.js | 后端 API | 数据接口 | ✅ 运行中 |

---

## 📋 详细对应关系

### 1️⃣ 大屏端（Display）

**公网地址**: https://xysrxgjnpycd.sealoshzh.site/display

**对应文件**: `public/display.html`

**功能**:
- 实时显示学生排行榜
- WebSocket 连接状态显示
- 实时更新学生积分

**源代码**（可选）:
- `bigscreen/src/` - React 源代码
- `bigscreen/dist/` - 编译后文件

**调整方式**:
```bash
# 如果需要修改大屏样式
# 编辑 public/display.html

# 如果需要使用 React 版本
# 编译 bigscreen 应用
cd bigscreen
npm run build
# 复制 dist 内容到 public
```

---

### 2️⃣ 手机端（Admin）

**公网地址**: https://xysrxgjnpycd.sealoshzh.site/admin

**对应文件**: `public/admin.html`

**功能**:
- 学生管理（增删改查）
- 积分调整
- 数据统计

**源代码**（可选）:
- `mobile/src/` - React 源代码
- `mobile/dist/` - 编译后文件

**调整方式**:
```bash
# 如果需要修改手机端样式
# 编辑 public/admin.html

# 如果需要使用 React 版本
# 编译 mobile 应用
cd mobile
npm run build
# 复制 dist 内容到 public
```

---

### 3️⃣ API 后端

**公网 API 地址**: https://xysrxgjnpycd.sealoshzh.site/api

**对应文件**: `server.js`

**API 端点**:
```
GET    /api/students              # 获取所有学生
GET    /api/students/:id          # 获取单个学生
POST   /api/students              # 创建学生
PUT    /api/students/:id          # 更新学生
DELETE /api/students/:id          # 删除学生
POST   /api/students/:id/adjust-score  # 调整积分
GET    /api/health                # 健康检查
```

---

## 🚀 使用场景

### 场景 1: 公网使用（当前）

✅ **已正确映射**

```
用户访问 https://xysrxgjnpycd.sealoshzh.site/display
    ↓
后端 server.js 接收请求
    ↓
返回 public/display.html 文件
    ↓
前端连接后端 WebSocket
    ↓
实时显示学生数据
```

### 场景 2: 本地开发

1. **启动后端**
```bash
cd /home/devbox/project
./entrypoint.sh development
```

2. **访问应用**
- 大屏端: http://localhost:3000/display
- 手机端: http://localhost:3000/admin

### 场景 3: 修改前端应用

**方式 A: 直接编辑 HTML（快速）**
```bash
# 编辑现有 HTML 文件
vim public/admin.html
vim public/display.html

# 刷新浏览器查看效果
```

**方式 B: 使用 React 源码（完整）**
```bash
# 编辑 React 组件
vim mobile/src/App.tsx
vim bigscreen/src/App.tsx

# 编译
cd mobile && npm run build
cp mobile/dist/* ../public/

# 重启后端
./entrypoint.sh development
```

---

## 🔧 配置文件位置

### 前端配置

**大屏端** (`public/display.html`)
```html
<!-- WebSocket 连接配置 -->
const wsUrl = 'ws://localhost:3000';  // 本地
const wsUrl = 'wss://xysrxgjnpycd.sealoshzh.site';  // 公网

<!-- API 配置 -->
const apiUrl = 'http://localhost:3000/api';  // 本地
const apiUrl = 'https://xysrxgjnpycd.sealoshzh.site/api';  // 公网
```

**手机端** (`public/admin.html`)
```html
<!-- API 配置 -->
const apiUrl = 'http://localhost:3000/api';  // 本地
const apiUrl = 'https://xysrxgjnpycd.sealoshzh.site/api';  // 公网
```

---

## ✅ 映射验证清单

部署前检查：

- [ ] 大屏端访问正常
  ```bash
  curl https://xysrxgjnpycd.sealoshzh.site/display
  ```

- [ ] 手机端访问正常
  ```bash
  curl https://xysrxgjnpycd.sealoshzh.site/admin
  ```

- [ ] 大屏能连接 WebSocket
  ```bash
  # 在浏览器 F12 → Network → WS 查看
  ```

- [ ] 手机端能调用 API
  ```bash
  curl https://xysrxgjnpycd.sealoshzh.site/api/students
  ```

- [ ] 实时推送正常工作
  - 在手机端创建学生
  - 观察大屏端是否立即显示

---

## 🎨 前端应用对比

### 当前部署版本（public/）

| 功能 | 版本 | 文件 | 特点 |
|------|------|------|------|
| 大屏展示 | HTML/CSS/JS | display.html | 轻量、直接、已优化 |
| 手机管理 | HTML/CSS/JS | admin.html | 轻量、直接、已优化 |

### 源代码版本（可选升级）

| 功能 | 版本 | 文件夹 | 特点 |
|------|------|--------|------|
| 大屏展示 | React | bigscreen/ | 可扩展、组件化 |
| 手机管理 | React | mobile/ | 可扩展、组件化 |

---

## 📈 如何升级到 React 版本

如果你想使用更强大的 React 版本：

### 步骤 1: 编译大屏应用
```bash
cd /home/devbox/project/bigscreen
npm install
npm run build
```

### 步骤 2: 编译手机应用
```bash
cd /home/devbox/project/mobile
npm install
npm run build
```

### 步骤 3: 替换到 public
```bash
# 备份旧文件
cp public/display.html public/display.html.bak
cp public/admin.html public/admin.html.bak

# 复制新文件
cp bigscreen/dist/index.html public/display.html
cp mobile/dist/index.html public/admin.html
```

### 步骤 4: 验证
```bash
./entrypoint.sh development
# 访问 http://localhost:3000/display 和 /admin 验证
```

### 步骤 5: 部署
```bash
git add .
git commit -m "Upgrade to React-based frontend"
git push origin main
# 触发 Sealos 部署
```

---

## 🔄 路由流程图

```
用户请求
    ↓
https://xysrxgjnpycd.sealoshzh.site/display
    ↓
server.js 路由处理
    ↓
app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/display.html'));
});
    ↓
返回 public/display.html
    ↓
前端代码执行
    ↓
连接后端 API 和 WebSocket
    ↓
实时显示数据
```

---

## 💡 常见问题

**Q: 修改了 HTML 文件后没有生效？**
A: 清除浏览器缓存或使用 Ctrl+Shift+R 强制刷新

**Q: 手机端连不上后端？**
A: 检查 admin.html 中的 API_URL 是否正确（应该是 https://xysrxgjnpycd.sealoshzh.site/api）

**Q: WebSocket 连接失败？**
A: 检查 display.html 中的 WS_URL 是否正确（应该是 wss://xysrxgjnpycd.sealoshzh.site）

**Q: 想使用 React 版本应该怎么做？**
A: 按照"升级到 React 版本"章节的步骤操作

**Q: 两个版本可以同时运行吗？**
A: 可以，但需要不同的路由路径。当前仅支持一个版本。

---

## 📞 支持

查看其他文档：
- `README.md` - 项目概览
- `DEPLOYMENT_STATUS_REPORT.md` - 部署状态
- `DEPLOY_WITH_ENTRYPOINT.md` - 部署指南

---

**更新时间**: 2025-11-22
**映射状态**: ✅ 正确对应
**验证**: ✅ 公网运行中
