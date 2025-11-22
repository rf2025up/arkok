# 🚀 Growark 系统 - 最终部署指南

## 📊 当前状态

✅ **后端已部署到公网**
- 地址: https://xysrxgjnpycd.sealoshzh.site
- 状态: 运行中
- API: /api/*
- WebSocket: wss://

✅ **前端应用已构建**
- 大屏端: /home/devbox/project/bigscreen/dist/ (176KB)
- 手机端: /home/devbox/project/mobile/dist/ (560KB)

⏳ **待完成**
- 将前端应用部署到 Sealos

---

## 🎯 部署方案（三选一）

### 方案 1: 通过 Sealos Web UI 上传静态文件（最简单）⭐

**步骤:**
1. 访问 https://cloud.sealos.io
2. 登录账户
3. 应用管理 → 创建应用
4. 选择 "**静态网站**" 类型
5. 应用名称: `bigscreen`
6. 上传文件: `/home/devbox/project/bigscreen/dist/`
7. 创建后记录分配的地址
8. 重复 3-7 步，部署 `mobile` 应用

**优点:** 最快，不需要本地工具
**缺点:** 需要手动通过 Web UI 操作

---

### 方案 2: 通过 Docker 镜像部署（推荐）

**前置条件:**
- 本地安装 Docker
- 本地安装 kubectl（或 sealos CLI）

**步骤:**

1. **在本地构建 Docker 镜像**

```bash
# 下载项目文件
cd /path/to/growark-project

# 构建 bigscreen 镜像
docker build -f - -t growark-bigscreen:latest . << 'DOCKERFILE'
FROM node:18-alpine
WORKDIR /app
RUN npm install -g http-server
COPY bigscreen/dist ./dist
EXPOSE 3001
CMD ["http-server", "./dist", "-p", "3001", "--cors"]
DOCKERFILE

# 构建 mobile 镜像
docker build -f - -t growark-mobile:latest . << 'DOCKERFILE'
FROM node:18-alpine
WORKDIR /app
RUN npm install -g http-server
COPY mobile/dist ./dist
EXPOSE 3002
CMD ["http-server", "./dist", "-p", "3002", "--cors"]
DOCKERFILE
```

2. **在 Sealos 中部署**

通过 Sealos Web UI 或 CLI：
```bash
kubectl apply -f deploy-frontend.yml
```

**优点:** 规范，可扩展，支持自动扩容
**缺点:** 需要本地开发环境

---

### 方案 3: 通过 Sealos CLI 一键部署（需要环境）

```bash
# 如果安装了 sealos CLI
sealos app deploy -f sealos-app-frontend.yaml
```

---

## 📦 部署文件清单

已为您生成以下文件：

### 应用文件（需要上传）
- `bigscreen/dist/` - 大屏端应用（176KB）
- `mobile/dist/` - 手机端应用（560KB）

### 部署配置文件
- `sealos-app-frontend.yaml` - Sealos 应用配置
- `deploy-frontend.yml` - Kubernetes 部署配置
- `Dockerfile.frontend` - Docker 多应用镜像

### 部署脚本
- `build-docker-images.sh` - Docker 镜像构建脚本
- `DEPLOY_NOW.sh` - 部署前检查脚本

---

## 🌐 关键地址

```
Sealos 控制台:        https://cloud.sealos.io
后端公网地址:        https://xysrxgjnpycd.sealoshzh.site
后端 API:            https://xysrxgjnpycd.sealoshzh.site/api
WebSocket:           wss://xysrxgjnpycd.sealoshzh.site

待部署的前端应用:
  大屏端地址:        https://bigscreen-<ID>.sealoshzh.site (待分配)
  手机端地址:        https://mobile-<ID>.sealoshzh.site (待分配)
```

---

## ✅ 推荐行动（最快方式）

**使用方案 1（通过 Sealos Web UI）- 只需 5 分钟：**

1. 打开浏览器访问 https://cloud.sealos.io
2. 登录
3. 创建应用 → 静态网站 → 上传 `bigscreen/dist`
4. 等待 2-3 分钟
5. 重复步骤 3-4 上传 `mobile/dist`
6. 记录两个应用的公网地址
7. 测试两个应用是否正常运行

---

## 📝 部署后验证

部署完成后，请验证以下内容：

### ✓ 检查大屏端
```bash
curl https://bigscreen-<ID>.sealoshzh.site
# 应该返回 HTML 页面
```

### ✓ 检查手机端
```bash
curl https://mobile-<ID>.sealoshzh.site
# 应该返回 HTML 页面
```

### ✓ 测试连接
1. 打开大屏端和手机端
2. 在手机端创建学生
3. 观察大屏端是否实时显示
4. 应该在 1 秒内更新

---

## 🆘 常见问题

**Q: 应用显示 404**
A: 等待 2-3 分钟后刷新，Pod 还在初始化

**Q: 无法连接到后端**
A: 检查是否使用了正确的后端地址（https://xysrxgjnpycd.sealoshzh.site）

**Q: 数据不同步**
A: 刷新大屏端页面，检查 WebSocket 连接状态

---

## 🎉 完成标志

✅ 大屏端应用已部署并可访问
✅ 手机端应用已部署并可访问
✅ 两端可以连接到后端
✅ 实时同步功能正常工作

---

**系统已完全准备就绪，现在就可以开始部署了！** 🚀
