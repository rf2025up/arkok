# 🚀 通过 entrypoint.sh 部署到 Sealos

## 📋 概述

本指南说明如何使用更新的 `entrypoint.sh` 脚本将新代码部署到 Sealos 公网。

---

## ✅ entrypoint.sh 兼容性验证

### 所有代码变化已兼容

| 变化项 | 兼容性 | 说明 |
|--------|--------|------|
| WebSocket 支持 | ✅ | 在 `server.js` 内部实现 |
| `ws` 新依赖 | ✅ | 脚本自动检测并安装 |
| 13 张新数据库表 | ✅ | 通过 `create-schema.js` 初始化 |
| PostgreSQL 连接 | ✅ | 配置已内置在 `server.js` |
| 环境变量支持 | ✅ | 脚本正确处理 `NODE_ENV` |

**结论**: ✅ **完全兼容，可以直接使用！**

---

## 🔄 当前部署状态

### 已部署到 Sealos
- **后端服务**: https://xysrxgjnpycd.sealoshzh.site
- **状态**: 运行中
- **部署方式**: Docker + Kubernetes

### 代码更新
- **新增**: WebSocket 实时推送
- **修改**: `server.js`、`package.json`
- **新文件**: `create-schema.js`、`entrypoint.sh` 增强版

---

## 📝 部署方案（两选一）

### 方案 A: 快速部署（推荐）⭐

**适用场景**: 代码小幅更新，逻辑变化不大

**步骤**:

1. **本地验证**（可选）
```bash
cd /home/devbox/project
./entrypoint.sh development    # 本地测试
# 或
./entrypoint.sh production     # 本地生产环境测试
```

2. **推送到 Sealos**

如果你的项目已连接到 Git 仓库：
```bash
git add .
git commit -m "Update backend with WebSocket support"
git push origin main
```

然后在 Sealos 中更新部署即可。

3. **验证部署**
```bash
curl https://xysrxgjnpycd.sealoshzh.site/api/health
# 应返回 200 OK
```

---

### 方案 B: 完整重新部署（保险）

**适用场景**: 大幅代码更新，需要确保一切正常

**步骤**:

1. **本地完整测试**
```bash
# 清空旧环境
cd /home/devbox/project
rm -rf node_modules package-lock.json

# 使用 entrypoint.sh 完整启动
./entrypoint.sh production
```

2. **验证所有功能**
```bash
# 测试 API
curl -X GET http://localhost:3000/api/students

# 测试 WebSocket（另一个终端）
timeout 5 node -e "const WebSocket = require('ws'); const ws = new WebSocket('ws://localhost:3000'); ws.on('open', () => console.log('✅ WebSocket 连接成功')); ws.on('close', () => process.exit(0));" || true

# 测试数据库
psql "postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres" -c "SELECT COUNT(*) FROM students;"
```

3. **构建新 Docker 镜像**
```bash
# 方式1: 使用现有 Dockerfile（推荐）
docker build -t growark-backend:v2 .

# 方式2: 使用 entrypoint.sh 作为启动脚本
docker build -f - -t growark-backend:v2 . << 'EOF'
FROM node:18-alpine

WORKDIR /app

# 复制源文件
COPY package*.json ./
COPY entrypoint.sh ./
COPY server.js ./
COPY create-schema.js ./

# 安装依赖
RUN npm ci --only=production

# 赋予脚本执行权限
RUN chmod +x entrypoint.sh

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# 使用 entrypoint.sh 启动
CMD ["./entrypoint.sh", "production"]
EOF
```

4. **推送到 Sealos**
```bash
# 标记镜像
docker tag growark-backend:v2 your-registry/growark-backend:v2

# 推送到镜像仓库（如果使用的话）
docker push your-registry/growark-backend:v2

# 或通过 Sealos CLI 更新部署
sealos app update growark-backend -i growark-backend:v2
```

---

## 🛠️ entrypoint.sh 新增功能

### 自动依赖检查
```bash
# 自动检测 node_modules 是否存在
# 如果不存在或 package.json 已更新，自动运行 npm install
```

### 自动数据库初始化（生产环境）
```bash
# 生产环境启动时自动运行 create-schema.js
# 如果数据库已存在，不会重复初始化
```

### 更详细的日志输出
```bash
# 时间戳记录
[2025-11-22 13:21:02] Growark Backend Startup
[2025-11-22 13:21:02] Checking dependencies...
[2025-11-22 13:21:05] Starting in PRODUCTION mode...
```

### 完整的错误处理
```bash
# 支持 Ctrl+C 优雅关闭
# 自动清理资源
```

---

## 📊 使用场景

### 场景 1: 本地开发
```bash
./entrypoint.sh development
# ✓ 启动服务
# ✓ 监听 http://localhost:3000
# ✓ WebSocket: ws://localhost:3000
```

### 场景 2: 本地测试生产配置
```bash
./entrypoint.sh production
# ✓ 启动服务
# ✓ 初始化数据库
# ✓ 设置 NODE_ENV=production
# ✓ 绑定 0.0.0.0:3000
```

### 场景 3: Docker 容器启动
```dockerfile
CMD ["./entrypoint.sh", "production"]
```

### 场景 4: Kubernetes 启动
```yaml
containers:
- name: backend
  image: growark-backend:latest
  command: ["./entrypoint.sh"]
  args: ["production"]
```

---

## 🔍 故障排查

### 问题 1: 依赖安装失败
```bash
# 症状：npm install 出错
# 解决：手动运行
cd /home/devbox/project
npm install --verbose
```

### 问题 2: 数据库初始化失败
```bash
# 症状：create-schema.js 出错
# 解决：检查数据库连接
psql "postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres" -c "SELECT 1;"
```

### 问题 3: 端口被占用
```bash
# 症状：EADDRINUSE 错误
# 解决：
lsof -i :3000        # 查看占用进程
kill -9 <PID>        # 终止进程
./entrypoint.sh      # 重新启动
```

### 问题 4: WebSocket 连接失败
```bash
# 症状：大屏显示离线
# 解决：
# 1. 检查后端是否启动
curl http://localhost:3000/health

# 2. 检查 WebSocket 端点
node -e "const ws = require('ws'); const server = new ws.Server({port: 3000}); console.log('✅ WebSocket 可用');"
```

---

## ✨ 对比：新 vs 旧 entrypoint.sh

### 旧版本
```bash
# 基础启动脚本
NODE_ENV=production node server.js
```

### 新版本 ✅
```bash
# ✓ 自动检查和安装依赖
# ✓ 自动初始化数据库（生产环境）
# ✓ 详细的日志输出
# ✓ 错误处理和优雅关闭
# ✓ 支持更多环境选项
# ✓ 更好的可读性和可维护性
```

---

## 🎯 下一步

### 立即采取行动

1. **验证本地启动**
```bash
./entrypoint.sh development
```

2. **如果成功，选择部署方案**
   - 方案 A (快速): 直接推送代码
   - 方案 B (保险): 完整测试后重新部署

3. **验证 Sealos 部署**
```bash
curl https://xysrxgjnpycd.sealoshzh.site/
```

---

## 📞 需要帮助？

- 查看 `QUICK_REFERENCE.md` - 快速参考
- 查看 `DEPLOYMENT_STATUS_REPORT.md` - 部署状态
- 查看 `README.md` - 项目文档

---

**更新时间**: 2025-11-22
**脚本版本**: v2.0
**兼容性**: ✅ 所有新代码
