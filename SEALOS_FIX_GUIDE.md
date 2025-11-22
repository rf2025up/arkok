# 🔧 Sealos 公网地址 - 快速修复指南

## 🎯 你的情况

```
✅ 有公网地址: https://xysrxgjnpycd.sealoshzh.site
✅ 有内网地址: http://devbox-2.ns-ll4yxeb3:3000
❌ 后端服务未运行 (Connection refused)
```

## 🔍 问题根因

后端应用没有在 Sealos 中运行。需要：
1. 启动后端应用
2. 验证应用运行
3. 配置前端连接

---

## 🚀 快速修复（3步）

### 步骤1️⃣: 启动后端应用

**方法A: 通过 Sealos UI 启动**

1. 打开 https://cloud.sealos.io
2. 应用管理 → 我的应用
3. 查找你的应用（如果显示已停止，点击启动按钮）
4. 等待状态变为 "Running"

**方法B: 通过部署脚本启动**

```bash
cd /home/devbox/project
./deploy-to-sealos.sh
```

然后按提示输入参数。

**方法C: 通过 kubectl 部署**

```bash
# 需要先安装 kubectl 并配置 kubeconfig
kubectl apply -f k8s-deployment.yaml
```

---

### 步骤2️⃣: 验证后端运行

等待 1-2 分钟，然后测试：

```bash
# 测试内网地址
curl http://devbox-2.ns-ll4yxeb3:3000/health

# 应该返回
# {"status":"OK"}
```

如果成功，继续下一步。

---

### 步骤3️⃣: 配置前端地址

现在后端已经运行，配置前端应用指向公网地址。

#### 大屏端配置

创建 `bigscreen/.env.production`:

```env
REACT_APP_API_URL=https://xysrxgjnpycd.sealoshzh.site/api
REACT_APP_WS_URL=wss://xysrxgjnpycd.sealoshzh.site
```

#### 手机端配置

创建 `mobile/.env.production`:

```env
REACT_APP_API_URL=https://xysrxgjnpycd.sealoshzh.site/api
```

#### 部署前端

```bash
# 大屏端
cd /home/devbox/project/bigscreen
npm install
npm run build

# 手机端
cd /home/devbox/project/mobile
npm install
npm run build
```

然后将 `dist` 文件夹上传到 Sealos。

---

## 📊 完整的访问配置

### 内网开发测试

```
后端 API: http://devbox-2.ns-ll4yxeb3:3000/api
WebSocket: ws://devbox-2.ns-ll4yxeb3:3000
健康检查: http://devbox-2.ns-ll4yxeb3:3000/health
```

**用途**:
- 本地调试
- 内部测试
- DevBox 环境

### 公网生产访问

```
后端 API: https://xysrxgjnpycd.sealoshzh.site/api
WebSocket: wss://xysrxgjnpycd.sealoshzh.site
健康检查: https://xysrxgjnpycd.sealoshzh.site/health
```

**用途**:
- 外网用户访问
- 手机端/大屏端连接
- 生产环境

---

## ✅ 测试连接

### 测试1: 后端健康检查

```bash
curl https://xysrxgjnpycd.sealoshzh.site/health
# 应该返回: {"status":"OK"}
```

### 测试2: API 可访问性

```bash
curl https://xysrxgjnpycd.sealoshzh.site/api/students
# 应该返回: [{...}] 或 []
```

### 测试3: WebSocket 连接（可选）

```bash
# 需要 wscat 工具
npm install -g wscat
wscat -c wss://xysrxgjnpycd.sealoshzh.site/
```

---

## 🔐 HTTPS 配置说明

你的公网地址是 **HTTPS**（安全协议），所以：

✅ **API 地址必须用 HTTPS**:
```
https://xysrxgjnpycd.sealoshzh.site/api
```

✅ **WebSocket 必须用 WSS**:
```
wss://xysrxgjnpycd.sealoshzh.site
```

❌ **不能用 HTTP**:
```
http://xysrxgjnpycd.sealoshzh.site  ← 会被阻止
```

❌ **不能用 WS**:
```
ws://xysrxgjnpycd.sealoshzh.site  ← 会被阻止
```

---

## 📋 前端应用部署指南

### 大屏端 (BigScreen)

**1. 更新环境变量**

编辑 `bigscreen/.env.production`:

```env
# API 服务器地址
REACT_APP_API_URL=https://xysrxgjnpycd.sealoshzh.site/api

# WebSocket 服务器地址
REACT_APP_WS_URL=wss://xysrxgjnpycd.sealoshzh.site
```

**2. 构建**

```bash
cd bigscreen
npm install
npm run build
```

**3. 部署**

方式A - 上传到 Sealos 静态站点:
```bash
# 进入 Sealos UI
# 应用管理 → 创建应用 → 静态网站
# 上传 dist 文件夹
```

方式B - Docker 容器部署:
```bash
# 创建 Dockerfile
cat > bigscreen/Dockerfile << 'EOF'
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

# 构建并上传到 Sealos
```

### 手机端 (Mobile)

**1. 更新环境变量**

编辑 `mobile/.env.production`:

```env
# API 服务器地址
REACT_APP_API_URL=https://xysrxgjnpycd.sealoshzh.site/api
```

**2. 构建**

```bash
cd mobile
npm install
npm run build
```

**3. 部署**

步骤同大屏端。

---

## 🔄 完整的三端同步流程

```
用户操作 (手机端或大屏端)
    ↓
HTTP/HTTPS 请求
    ↓
后端 API (https://xysrxgjnpycd.sealoshzh.site/api)
    ↓
PostgreSQL 数据库
    ↓
后端通过 WebSocket 广播事件
    ↓
所有连接的大屏端
    ↓
实时显示更新
```

---

## 🆘 如果还是不工作

### 问题1: 后端还是连接不上

```bash
# 检查后端状态
# 1. 登录 Sealos UI
# 2. 应用管理 → 查看应用状态
# 3. 应该显示 "Running"
# 4. 查看日志找出错误
```

### 问题2: WebSocket 连接失败

```bash
# 确保使用 WSS 而不是 WS
# REACT_APP_WS_URL=wss://xysrxgjnpycd.sealoshzh.site  ✓ 正确
# REACT_APP_WS_URL=ws://xysrxgjnpycd.sealoshzh.site   ✗ 错误
```

### 问题3: 浏览器报 CORS 错误

```javascript
// 已在后端配置，应该没问题
// 如果仍有错误，检查 server.js 中的 CORS 设置
```

### 问题4: API 返回 404

```bash
# 检查 API 端点
# 应该是: https://xysrxgjnpycd.sealoshzh.site/api/students
# 不是: https://xysrxgjnpycd.sealoshzh.site/students
```

---

## 📈 验证完整流程

### ✅ 成功的标志

```bash
# 1. 后端健康检查
$ curl https://xysrxgjnpycd.sealoshzh.site/health
{"status":"OK"}

# 2. API 可访问
$ curl https://xysrxgjnpycd.sealoshzh.site/api/students
[...]

# 3. 前端可以加载
# 在浏览器打开 https://your-frontend-domain

# 4. 手机端创建学生
# 应立即显示在大屏端（< 100ms）

# 5. 大屏端调整积分
# 应立即更新排行榜
```

### ❌ 失败的迹象

- 后端无法连接
- API 返回 500 错误
- WebSocket 连接超时
- 前端页面空白
- 浏览器控制台有错误

---

## 🎯 接下来要做的

1. ✅ **启动后端应用**
   - 如果还未启动，立即启动
   - 通过 Sealos UI 或脚本

2. ✅ **测试后端连接**
   - 运行 `curl https://xysrxgjnpycd.sealoshzh.site/health`
   - 应该返回 `{"status":"OK"}`

3. ✅ **配置前端环境变量**
   - 更新大屏端和手机端的 `.env.production`
   - 使用你的公网地址 `https://xysrxgjnpycd.sealoshzh.site`

4. ✅ **构建前端应用**
   - `npm run build` 生成 dist 文件

5. ✅ **部署前端到 Sealos**
   - 上传到静态网站或 Docker 容器

6. ✅ **测试三端同步**
   - 手机端创建学生
   - 大屏端实时显示

---

## 📞 快速参考

| 功能 | 地址 |
|------|------|
| 后端 API | https://xysrxgjnpycd.sealoshzh.site/api |
| WebSocket | wss://xysrxgjnpycd.sealoshzh.site |
| 健康检查 | https://xysrxgjnpycd.sealoshzh.site/health |
| 大屏端 | 待部署 |
| 手机端 | 待部署 |

---

**最后更新**: 2024年11月22日
**状态**: 🔧 需要启动后端应用并部署前端
