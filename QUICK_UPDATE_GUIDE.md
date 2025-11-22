# ⚡ 快速更新指南 - 手机端新功能上线

## 🎯 目标
将手机端修改后的新功能（9个功能 + 新团队名称）同步到公网

## 📊 当前状态
- ✅ 手机端新代码已完成
- ✅ npm run build 已执行
- ✅ /home/devbox/project/mobile/dist/ 已生成
- ✅ 新团队名称已确认在 dist 中
- ❌ 还未映射到公网 (public/ 文件夹)

---

## 🚀 执行步骤 (总共 5 步，耗时 15 分钟)

### 步骤1️⃣: 验证新 dist 文件 (1分钟)

```bash
# 检查 dist 是否已生成
ls -lh /home/devbox/project/mobile/dist/
# 应该看到 index.html 和 assets/ 文件夹

# 验证新团队名称已打包
grep -c "超能英雄" /home/devbox/project/mobile/dist/assets/*.js
# 应该返回大于 0 的数字
```

### 步骤2️⃣: 复制新文件到公网静态文件夹 (2分钟)

```bash
# 进入项目目录
cd /home/devbox/project

# 备份当前的教师端文件
cp public/admin.html public/admin.html.bak.$(date +%s)
echo "✅ 已备份旧文件"

# 复制新的手机端应用作为教师端
cp mobile/dist/bigscreen/index.html public/admin.html
echo "✅ 已复制 admin.html"

# 更新资源文件
rm -rf public/assets/*
cp -r mobile/dist/assets/* public/assets/
echo "✅ 已更新 assets/"

# 验证复制成功
echo "📋 验证文件:"
ls -lh public/admin.html
ls public/assets/ | head -5
```

### 步骤3️⃣: 提交到 Git (1分钟)

```bash
cd /home/devbox/project

# 检查文件状态
git status

# 添加更改
git add public/

# 提交
git commit -m "Update: 手机端新功能上线 - 9个新功能集成 + 新团队名称(超能英雄/天才少年/学霸无敌)"

# 推送
git push origin main
echo "✅ 已推送到 Git"
```

### 步骤4️⃣: 等待 Sealos 自动部署 (5-10分钟)

```bash
# Sealos 自动流程:
# 1. 检测 Git 变化 (30秒内)
# 2. 构建 Docker 镜像 (2-5分钟)
# 3. 重启容器 (1-2分钟)
# 4. 应用上线

echo "⏳ 请等待 5-10 分钟..."
echo "📌 或访问 Sealos 控制台查看部署进度"
```

### 步骤5️⃣: 验证新功能已上线 (2分钟)

```bash
# 方式1: 访问公网（最直接）
# 打开浏览器访问:
# https://xysrxgjnpycd.sealoshzh.site/admin

# 必须:
# 1. 清除缓存 (Ctrl+Shift+Delete)
# 2. 硬刷新 (Ctrl+F5)
# 3. 查看是否显示新团队名称

# 方式2: 命令行验证
curl -s "https://xysrxgjnpycd.sealoshzh.site/admin" | \
  grep -o "超能英雄\|天才少年\|学霸无敌" | head -1

# 如果输出新团队名称，说明成功 ✅
```

---

## 📋 完整执行脚本

如果你想一键执行，直接复制下面的脚本：

```bash
#!/bin/bash

echo "🚀 开始同步手机端新功能到公网..."
echo ""

# 第1步: 验证
echo "1️⃣ 验证 dist 文件..."
if [ ! -f "/home/devbox/project/mobile/dist/index.html" ]; then
    echo "❌ 错误: dist 文件不存在"
    exit 1
fi
echo "✅ dist 文件存在"
echo ""

# 第2步: 复制文件
echo "2️⃣ 复制新文件到公网文件夹..."
cd /home/devbox/project
cp public/admin.html public/admin.html.bak.$(date +%s)
cp mobile/dist/bigscreen/index.html public/admin.html
cp -r mobile/dist/assets/* public/assets/
echo "✅ 文件已复制"
echo ""

# 第3步: 提交
echo "3️⃣ 提交到 Git..."
git add public/
git commit -m "Update: 手机端新功能上线 - 9个功能 + 新团队名称"
git push origin main
echo "✅ 已推送到 Git"
echo ""

# 显示下一步
echo "🎉 同步完成！"
echo ""
echo "⏳ 等待 5-10 分钟 Sealos 自动部署..."
echo "📌 之后访问: https://xysrxgjnpycd.sealoshzh.site/admin"
echo "🔧 清除缓存 (Ctrl+Shift+Delete) 并硬刷新 (Ctrl+F5)"
```

---

## ✅ 验证清单

完成每个步骤后，检查是否成功：

### 第1步验证
- [ ] mobile/dist/index.html 存在
- [ ] mobile/dist/assets/ 文件夹非空
- [ ] grep 找到了新团队名称

### 第2步验证
- [ ] public/admin.html 文件大小 > 1KB
- [ ] public/assets/ 文件夹已更新
- [ ] 没有显示错误信息

### 第3步验证
- [ ] git commit 成功
- [ ] git push 成功
- [ ] 没有 permission denied 错误

### 第5步验证 (最重要)
- [ ] 访问 https://xysrxgjnpycd.sealoshzh.site/admin
- [ ] 看到新的界面布局
- [ ] 显示新团队名称: 超能英雄、天才少年、学霸无敌
- [ ] 所有新功能可以使用

---

## 🔄 对应关系对照表

| 内容 | 修改前 | 修改后 | 位置 |
|------|--------|--------|------|
| **手机端源代码** | /mobile/src/ | ✅ 已修改 | /mobile/src/ |
| **手机端构建** | /mobile/dist/ | ✅ 已生成 | /mobile/dist/ |
| **教师端应用** | public/admin.html | ⏳ 待更新 | public/ |
| **公网教师端** | 旧版本 | ⏳ 待更新 | https://...../admin |

---

## 🎯 核心概念

### 为什么要复制？
```
手机端源代码
    ↓ npm run build
编译后的 dist/
    ↓ 手动复制
公网静态文件夹 (public/)
    ↓ Express 服务器
公网访问 https://.../admin
```

### 为什么要 git push？
```
修改 public/ 文件
    ↓ git push
GitHub/GitLab
    ↓ Sealos 自动检测
自动构建和部署
    ↓
公网应用更新
```

---

## ⚠️ 常见问题

### Q: 执行 git push 时出错？
**A**: 检查:
1. 是否已 `git add public/`
2. 是否已 `git commit -m "..."`
3. 检查网络连接
4. 查看 `git status` 输出

### Q: 访问公网后还是看不到新功能？
**A**: 一定要:
1. 等待 5-10 分钟（Sealos 部署需要时间）
2. 清除缓存: `Ctrl+Shift+Delete`
3. 硬刷新: `Ctrl+F5`
4. 或用隐身窗口访问（完全不使用缓存）

### Q: 如何回滚到旧版本？
**A**:
```bash
# 恢复备份
cp public/admin.html.bak.<timestamp> public/admin.html
git add public/
git commit -m "Revert: 回滚到旧版本"
git push origin main
```

### Q: 可以在本地先测试吗？
**A**: 可以的:
```bash
cd /home/devbox/project
./entrypoint.sh development
# 访问 http://localhost:3000/admin
```

---

## 📊 时间估计

| 步骤 | 耗时 |
|------|------|
| 1. 验证 dist | 1 分钟 |
| 2. 复制文件 | 2 分钟 |
| 3. Git 提交 | 1 分钟 |
| 4. Sealos 部署 | 5-10 分钟 |
| 5. 验证 | 2 分钟 |
| **总计** | **11-16 分钟** |

---

## 🎉 完成标志

当你看到以下情况，说明更新成功：

✅ 访问 https://xysrxgjnpycd.sealoshzh.site/admin
✅ 显示新的团队名称 (超能英雄、天才少年、学霸无敌)
✅ 所有新功能都可以使用
✅ 浏览器 F12 控制台无重大错误

---

**准备好执行了吗？**

下一步: 执行上面的 5 个步骤或使用一键执行脚本！

