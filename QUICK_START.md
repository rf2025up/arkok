# Growark 快速开始指南

## 访问应用

### 生产环境
- **手机端/管理端**: https://xysrxgjnpycd.sealoshzh.site/admin
- **大屏显示端**: https://xysrxgjnpycd.sealoshzh.site/display
- **API 接口**: https://xysrxgjnpycd.sealoshzh.site/api

### 本地开发
```bash
# 启动开发环境
./entrypoint.sh development

# 访问
http://localhost:3000/admin        # 手机端
http://localhost:3000/display      # 大屏端
http://localhost:3000/api/students # API
```

---

## 完整的数据库持久化功能

所有以下操作的数据都会自动保存到数据库：

### ✅ 学生管理
- 创建学生 → 保存到 `students` 表
- 编辑学生信息 → 更新数据库
- 删除学生 → 删除数据库记录及关联数据
- 调整学生分数 → 实时更新数据库

### ✅ 挑战系统
- 发布挑战 → 保存到 `challenges` 表
- 标记挑战成功/失败 → 更新数据库及参与学生的分数/经验

### ✅ PK 系统
- 创建 PK 比赛 → 保存到 `pk_matches` 表
- 标记 PK 结果 → 更新赢家和参与者的积分

### ✅ 任务系统
- 发布任务 → 保存到 `tasks` 表
- 完成任务 → 删除任务并奖励参与者经验值

### ✅ 勋章系统
- 创建勋章 → 保存到系统
- 颁发勋章 → 记录到 `student_badges` 表并奖励积分

### ✅ 习惯打卡
- 打卡记录 → 保存到 `habit_checkins` 表

---

## 快速部署流程

### 场景 1: 修改代码后快速部署

**步骤 1: 编译前端**
```bash
cd mobile
npm run build
cd ..
```

**步骤 2: 复制到 public**
```bash
cp -r mobile/dist/* public/
```

**步骤 3: 提交并推送**
```bash
git add -A
git commit -m "描述更改内容"
git push origin master
```

**Sealos 会自动拉取并部署** ✨

---

### 场景 2: 紧急修复（快速重启）

在 Sealos 平台上：
1. 点击应用详情
2. 修改代码（如需要）
3. 点击"重启应用"
4. 等待 30 秒完成

---

## 常用命令

```bash
# 开发环境
./entrypoint.sh development

# 生产环境
./entrypoint.sh production

# 编译前端
cd mobile && npm run build && cd ..

# 复制前端文件
cp -r mobile/dist/* public/

# 初始化数据库（开发）
node create-schema.js

# 提交更改
git add -A && git commit -m "描述" && git push origin master
```

---

## 验证部署成功

```bash
# 1. 检查服务健康
curl https://xysrxgjnpycd.sealoshzh.site/health

# 2. 获取学生列表
curl https://xysrxgjnpycd.sealoshzh.site/api/students

# 3. 检查前端是否加载
curl https://xysrxgjnpycd.sealoshzh.site/admin | grep "script"
```

详见:
- [API_REFERENCE.md](./API_REFERENCE.md) - 完整 API 文档
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 完整部署指南

**最后更新**: 2025-11-22
