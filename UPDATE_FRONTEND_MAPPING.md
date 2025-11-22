# 🚀 前端应用映射升级方案

**目标**: 将星途方舟（新版 bigscreen + mobile）和 ClassHero 教师端映射到公网

**当前状态**:
- 旧版: public/display.html 和 public/admin.html
- 新版: bigscreen/dist/ 和 mobile/dist/ 已编译

---

## 📊 映射规划

### 新的公网地址映射

| 应用 | 公网地址 | 源代码 | 编译输出 | 对应HTML |
|------|---------|--------|---------|----------|
| **大屏展示** | `/display` | `bigscreen/src/` | `bigscreen/dist/` | ⭐ 新 |
| **学生端** | `/student` | `mobile/src/` | `mobile/dist/` | ⭐ 新 |
| **教师端** | `/admin` | `mobile/src/` (教师版) | `mobile/dist/` | ⭐ 新 ClassHero |
| **API** | `/api/*` | `server.js` | - | - |

---

## 🔄 映射方案

### 方案 1: 直接替换（推荐，5分钟）

```bash
# 1. 备份旧文件
cd /home/devbox/project
cp public/display.html public/display.html.bak
cp public/admin.html public/admin.html.bak

# 2. 复制大屏端（新星途方舟）
cp bigscreen/dist/index.html public/display.html

# 3. 复制手机端（新星途方舟学生端）
cp mobile/dist/index.html public/student.html

# 4. 复制教师端（ClassHero）
# 如果 mobile/dist 中包含教师端，复制为 admin.html
cp mobile/dist/bigscreen/index.html public/admin.html

# 5. 更新 server.js 路由
```

### 方案 2: 从源码重新编译（完整，15分钟）

```bash
# 1. 进入 bigscreen 目录
cd /home/devbox/project/bigscreen
npm install
npm run build

# 2. 进入 mobile 目录
cd /home/devbox/project/mobile
npm install
npm run build

# 3. 复制编译输出
cp /home/devbox/project/bigscreen/dist/index.html /home/devbox/project/public/display.html
cp /home/devbox/project/mobile/dist/index.html /home/devbox/project/public/student.html
cp /home/devbox/project/mobile/dist/bigscreen/index.html /home/devbox/project/public/admin.html

# 4. 确保资源文件也复制
cp -r /home/devbox/project/bigscreen/dist/assets/* /home/devbox/project/public/assets/
```

---

## 🔧 server.js 路由配置

需要更新 server.js 中的路由，将新的页面映射到对应的路径：

```javascript
// 大屏端（星途方舟大屏）
app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/display.html'));
});

// 学生端（星途方舟学生版）
app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/student.html'));
});

// 教师端（ClassHero 教师端）
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// 其他路由...
```

---

## 📂 文件结构对比

### 当前（旧版）
```
public/
├── display.html      ❌ 旧版大屏
├── admin.html        ❌ 旧版手机端
└── api-docs.html
```

### 升级后（新版）
```
public/
├── display.html      ✅ 星途方舟大屏
├── student.html      ✅ 星途方舟学生端（新增）
├── admin.html        ✅ ClassHero 教师端
├── assets/           ✅ React 编译资源
└── api-docs.html
```

---

## 🌐 公网地址映射（升级后）

```
https://xysrxgjnpycd.sealoshzh.site/display  → 星途方舟大屏 (新)
https://xysrxgjnpycd.sealoshzh.site/student  → 星途方舟学生端 (新)
https://xysrxgjnpycd.sealoshzh.site/admin    → ClassHero 教师端 (新)
https://xysrxgjnpycd.sealoshzh.site/api      → 后端 API
```

---

## ⚙️ 详细步骤

### 步骤 1: 检查构建产物

```bash
# 检查大屏端是否已编译
ls -la /home/devbox/project/bigscreen/dist/

# 检查学生端是否已编译
ls -la /home/devbox/project/mobile/dist/

# 检查是否有教师端版本
ls -la /home/devbox/project/mobile/dist/bigscreen/
```

### 步骤 2: 备份当前文件

```bash
cd /home/devbox/project/public
mkdir backups
cp *.html backups/
cp -r assets/ backups/
```

### 步骤 3: 复制新文件

```bash
# 大屏端
cp /home/devbox/project/bigscreen/dist/index.html /home/devbox/project/public/display.html

# 学生端
cp /home/devbox/project/mobile/dist/index.html /home/devbox/project/public/student.html

# 教师端（如果在 mobile/dist/bigscreen 中）
cp /home/devbox/project/mobile/dist/bigscreen/index.html /home/devbox/project/public/admin.html

# 复制资源文件
cp -r /home/devbox/project/bigscreen/dist/assets/* /home/devbox/project/public/assets/ 2>/dev/null
cp -r /home/devbox/project/mobile/dist/assets/* /home/devbox/project/public/assets/ 2>/dev/null
```

### 步骤 4: 验证文件

```bash
# 检查文件是否存在
ls -la /home/devbox/project/public/display.html
ls -la /home/devbox/project/public/student.html
ls -la /home/devbox/project/public/admin.html

# 检查文件大小（不应为 0）
wc -c /home/devbox/project/public/*.html
```

### 步骤 5: 更新 server.js

编辑 `/home/devbox/project/server.js`，更新路由：

```javascript
// 在现有路由中添加或更新：

// 学生端路由（新增）
app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/student.html'));
});
```

### 步骤 6: 本地测试

```bash
cd /home/devbox/project
./entrypoint.sh development

# 在浏览器中测试：
# http://localhost:3000/display  - 大屏端
# http://localhost:3000/student  - 学生端
# http://localhost:3000/admin    - 教师端
```

### 步骤 7: 提交代码

```bash
git add public/ server.js
git commit -m "Update frontend mapping: deploy Xingtu Fangzhou and ClassHero"
git push origin main
```

### 步骤 8: 部署到公网

```bash
# Sealos 自动部署或手动触发
# 访问公网验证
curl https://xysrxgjnpycd.sealoshzh.site/display
curl https://xysrxgjnpycd.sealoshzh.site/student
curl https://xysrxgjnpycd.sealoshzh.site/admin
```

---

## 🎯 应用说明

### 星途方舟大屏（/display）
- 文件: `bigscreen/dist/index.html`
- 功能: 实时显示学生排行榜、荣誉卡、挑战等
- 支持: WebSocket 实时更新

### 星途方舟学生端（/student）
- 文件: `mobile/dist/index.html`
- 功能: 学生积分管理、挑战参与等
- 支持: HTTP API 调用

### ClassHero 教师端（/admin）
- 文件: `mobile/dist/bigscreen/index.html`（或其他位置）
- 功能: 教师管理学生、发布挑战等
- 支持: 完整的管理功能

---

## 🔍 需要确认的事项

请确认以下信息，以便正确映射：

1. **大屏应用**
   - ✅ 编译位置: `bigscreen/dist/`
   - ✅ 主文件: `index.html`
   - 应该在公网路由: `/display`

2. **学生端应用**
   - ✅ 编译位置: `mobile/dist/`
   - ✅ 主文件: `index.html`
   - 应该在公网路由: `/student`（新增）

3. **教师端应用（ClassHero）**
   - ❓ 编译位置: `mobile/dist/` 或 `mobile/dist/bigscreen/`?
   - ❓ 主文件: `index.html`?
   - 应该在公网路由: `/admin`

---

## ⚠️ 注意事项

### 资源文件路径

确保 HTML 文件中引用的资源路径正确：

```html
<!-- 旧方式（可能不工作） -->
<script src="/assets/index.abc123.js"></script>

<!-- 新方式（可能需要） -->
<script src="./assets/index.abc123.js"></script>
```

### 跨域资源共享（CORS）

确保 server.js 中已启用 CORS：

```javascript
app.use(cors());  // 应该已有
```

### 环境变量

确保前端应用中的 API 地址配置正确：

```javascript
// 应该指向：
const API_BASE = 'https://xysrxgjnpycd.sealoshzh.site/api'
const WS_URL = 'wss://xysrxgjnpycd.sealoshzh.site'
```

---

## 🚀 快速执行命令

如果一切就绪，运行以下命令一键升级：

```bash
#!/bin/bash

# 备份
cp /home/devbox/project/public/display.html /home/devbox/project/public/display.html.bak
cp /home/devbox/project/public/admin.html /home/devbox/project/public/admin.html.bak

# 复制新文件
cp /home/devbox/project/bigscreen/dist/index.html /home/devbox/project/public/display.html
cp /home/devbox/project/mobile/dist/index.html /home/devbox/project/public/student.html
cp /home/devbox/project/mobile/dist/bigscreen/index.html /home/devbox/project/public/admin.html

# 复制资源
mkdir -p /home/devbox/project/public/assets
cp -r /home/devbox/project/bigscreen/dist/assets/* /home/devbox/project/public/assets/
cp -r /home/devbox/project/mobile/dist/assets/* /home/devbox/project/public/assets/

# 验证
echo "✅ 文件已复制"
ls -la /home/devbox/project/public/display.html
ls -la /home/devbox/project/public/student.html
ls -la /home/devbox/project/public/admin.html

# 本地测试
cd /home/devbox/project
./entrypoint.sh development

echo "🌐 访问 http://localhost:3000/display, /student, /admin 进行测试"
```

---

## 📋 验证清单

部署前检查：

- [ ] 所有 HTML 文件已复制到 `public/`
- [ ] 所有资源文件已复制到 `public/assets/`
- [ ] server.js 中的路由已更新
- [ ] 本地测试通过
- [ ] 浏览器 F12 无报错
- [ ] API 连接正常
- [ ] WebSocket 连接正常

---

**准备好执行了吗？** 告诉我是否需要继续，我会帮你完成整个部署流程！

