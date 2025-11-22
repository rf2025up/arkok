# 📚 部署架构回顾与更新指南

## 🔍 之前是如何部署到公网的

### 整体架构

```
开发代码
├── /home/devbox/project/bigscreen/src/     (大屏应用源代码)
├── /home/devbox/project/mobile/src/        (手机应用源代码)
│
构建产物
├── /home/devbox/project/bigscreen/dist/    (大屏编译输出)
├── /home/devbox/project/mobile/dist/       (手机编译输出)
│   └── /bigscreen/                         (教师端内嵌应用)
│
映射到静态文件夹
└── /home/devbox/project/public/            (后端静态文件)
    ├── display.html                        (大屏应用入口)
    ├── student.html                        (学生端应用入口)
    ├── admin.html                          (教师端应用入口)
    ├── assets/                             (React 编译资源)
    └── ...

    ↓ (Express server.js 提供路由)

公网访问
├── https://xysrxgjnpycd.sealoshzh.site/display    → display.html → 大屏应用
├── https://xysrxgjnpycd.sealoshzh.site/student    → student.html → 学生端
├── https://xysrxgjnpycd.sealoshzh.site/admin      → admin.html   → 教师端
└── https://xysrxgjnpycd.sealoshzh.site/api        → server.js    → 后端API
```

---

## 🔄 具体的部署流程

### 第1步：编译前端应用

```bash
# 编译大屏应用
cd /home/devbox/project/bigscreen
npm run build
# 输出: /home/devbox/project/bigscreen/dist/

# 编译手机应用
cd /home/devbox/project/mobile
npm run build
# 输出: /home/devbox/project/mobile/dist/
```

### 第2步：映射到静态文件夹

```bash
# 大屏端映射
cp /home/devbox/project/bigscreen/dist/index.html /home/devbox/project/public/display.html

# 学生端映射
cp /home/devbox/project/mobile/dist/index.html /home/devbox/project/public/student.html

# 教师端映射
cp /home/devbox/project/mobile/dist/bigscreen/index.html /home/devbox/project/public/admin.html

# 复制资源文件
cp -r /home/devbox/project/bigscreen/dist/assets/* /home/devbox/project/public/assets/
cp -r /home/devbox/project/mobile/dist/assets/* /home/devbox/project/public/assets/
```

### 第3步：Express 服务器路由配置

文件: `/home/devbox/project/server.js`

```javascript
// 大屏端
app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/display.html'));
});

// 学生端
app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/student.html'));
});

// 教师端
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});
```

### 第4步：在 Sealos 中部署

1. **代码提交到 Git**
   ```bash
   git add public/ server.js
   git commit -m "Deploy updated frontend"
   git push origin main
   ```

2. **Sealos 自动部署**
   - Sealos 监听 Git 仓库变化
   - 自动构建和部署 Docker 镜像
   - 容器重启后应用立即更新

3. **公网地址自动映射**
   - Sealos LoadBalancer 接收请求
   - Express server.js 根据路由返回相应的 HTML
   - 浏览器加载应用

---

## 🎯 当前状态

### ✅ 已完成
- ✅ 手机端新功能已开发完成 (9个功能)
- ✅ 新代码已编译: `/home/devbox/project/mobile/dist/`
- ✅ 新团队名称已集成在 dist 中
- ✅ 大屏端和学生端已正常部署到公网
- ✅ 后端 API 正在运行

### ⏳ 待执行
- ⏳ 手机端新 dist 文件需要映射到 `public/admin.html`
- ⏳ 需要重新部署到 Sealos

---

## 🚀 如何同步更新手机端功能到公网

### 方案：快速同步更新（推荐）

#### 第1步：确认新 dist 文件已生成

```bash
ls -lh /home/devbox/project/mobile/dist/
# 应该看到:
# - index.html
# - assets/ 文件夹
# - bigscreen/ 文件夹（教师端）
```

#### 第2步：验证新功能已打包

```bash
# 检查新团队名称是否在 dist 中
grep -o "超能英雄\|天才少年\|学霸无敌" /home/devbox/project/mobile/dist/assets/*.js
# 应该输出新团队名称
```

#### 第3步：映射新 dist 到公网静态文件夹

```bash
# 备份当前文件
cp /home/devbox/project/public/admin.html /home/devbox/project/public/admin.html.bak

# 复制新的手机端应用到教师端
cp /home/devbox/project/mobile/dist/bigscreen/index.html /home/devbox/project/public/admin.html

# 更新资源文件
cp -r /home/devbox/project/mobile/dist/assets/* /home/devbox/project/public/assets/
```

#### 第4步：验证文件

```bash
# 检查文件是否正确复制
ls -lh /home/devbox/project/public/admin.html
wc -c /home/devbox/project/public/admin.html
# 文件大小应该大于 1KB
```

#### 第5步：提交到 Git（触发 Sealos 部署）

```bash
cd /home/devbox/project
git add public/
git commit -m "Update: 手机端新功能上线（9个功能更新）- 新团队名称已集成"
git push origin main
```

#### 第6步：等待 Sealos 自动部署

- Sealos 检测到 Git 变化 (自动，约 30 秒)
- 构建新的 Docker 镜像 (约 2-5 分钟)
- 容器重启并上线新版本 (约 1 分钟)
- **总耗时**: 约 4-8 分钟

#### 第7步：验证公网已更新

```bash
# 方式1: 访问公网
# https://xysrxgjnpycd.sealoshzh.site/admin
# 手动刷新浏览器，清除缓存后查看新功能

# 方式2: 命令行验证
curl -s https://xysrxgjnpycd.sealoshzh.site/admin | grep -o "超能英雄\|天才少年\|学霸无敌"
# 应该输出新的团队名称
```

---

## 📊 完整的更新流程图

```
修改手机端功能
     ↓
npm run build (生成新 dist)
     ↓
cp dist/bigscreen/index.html → public/admin.html
cp dist/assets/* → public/assets/
     ↓
git add public/
git commit -m "..."
git push origin main
     ↓
Sealos 检测到变化
     ↓
构建 Docker 镜像
     ↓
容器重启
     ↓
公网 https://xysrxgjnpycd.sealoshzh.site/admin 已更新
     ↓
用户访问，清除缓存后看到新功能
```

---

## 🎯 关键点总结

| 步骤 | 操作 | 位置 | 说明 |
|------|------|------|------|
| 1 | 修改代码 | `/home/devbox/project/mobile/src/` | 手机端源代码 |
| 2 | 构建 | `npm run build` | 生成 `/mobile/dist/` |
| 3 | 映射 | 复制 dist 到 public/ | 关键步骤！ |
| 4 | 提交 | `git push` | 触发 Sealos 自动部署 |
| 5 | 部署 | Sealos 自动处理 | 约 4-8 分钟 |
| 6 | 验证 | 清除缓存后访问 | 确认新功能 |

---

## ⚠️ 常见问题

### Q: 为什么修改了代码但公网上看不到？
**A**: 因为需要:
1. ✅ 运行 `npm run build` 生成新 dist
2. ✅ 复制新 dist 文件到 `public/` 文件夹
3. ✅ 提交到 Git (`git push`)
4. ✅ 等待 Sealos 自动部署
5. ✅ 清除浏览器缓存后访问

### Q: 如何知道 Sealos 已经部署完成？
**A**: 有几种方式:
1. 访问 Sealos 控制台查看 Pod 状态
2. 查看 Git Actions 日志 (如果配置了)
3. 等待 4-8 分钟后手动访问并清除缓存

### Q: 如果需要快速测试？
**A**: 可以在本地先测试:
```bash
cd /home/devbox/project
./entrypoint.sh development
# 访问 http://localhost:3000/admin
```

### Q: 新功能没有出现怎么办？
**A**: 按顺序检查:
1. ✅ dist 文件是否已生成
2. ✅ 文件是否已复制到 public/
3. ✅ 代码是否已 push 到 Git
4. ✅ 浏览器缓存是否已清除 (Ctrl+Shift+Delete)
5. ✅ 硬刷新页面 (Ctrl+F5)
6. ✅ 用隐身窗口测试（完全不使用缓存）

---

## 📋 快速检查清单

执行更新前，请确认：

- [ ] 手机端代码已修改并测试
- [ ] 运行了 `npm run build`
- [ ] 新 dist 文件已生成
- [ ] 已备份旧的 `public/admin.html`
- [ ] 已复制新文件到 public/ 文件夹
- [ ] 已将更改 push 到 Git
- [ ] 已等待 Sealos 部署完成 (4-8 分钟)
- [ ] 已清除浏览器缓存
- [ ] 已硬刷新页面
- [ ] 已验证新功能出现

---

## 🎯 总结

### 之前的部署方式
1. 代码 → 编译 → 映射到 public/ → Git push → Sealos 自动部署 → 公网更新

### 现在需要做什么
1. ✅ 新 dist 已生成 (之前完成)
2. ⏳ 复制新 dist 到 public/admin.html (需要执行)
3. ⏳ Git push (需要执行)
4. ⏳ 等待 Sealos 自动部署 (自动)
5. ⏳ 清除缓存验证 (需要手动)

**预计耗时**: 10-15 分钟（包括等待部署时间）

---

**文档创建**: 2024年11月22日
**来源**: 检查之前的部署文档 + 当前的代码状态
**下一步**: 执行第2步的映射和 Git 提交
