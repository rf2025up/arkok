# Sealos 公网部署指南

## 📋 部署概述

本指南说明如何将Growark三端同步系统部署到Sealos公网环境。

**部署架构**：
```
公网用户
  ↓
Sealos Load Balancer (公网IP)
  ↓
Backend Pod (自动扩缩容, 3+ 副本)
  ↓
PostgreSQL 数据库 (Sealos托管)
```

---

## ✅ 前置条件

- [ ] Sealos账户
- [ ] 已创建的Sealos集群
- [ ] kubectl 已配置
- [ ] Docker 已安装（本地测试用）
- [ ] git 已安装

---

## 🚀 快速部署（推荐）

### 方法1: 使用Sealos应用市场（最简单）

**步骤1**: 登录Sealos控制面板
```
https://cloud.sealos.io 或 https://sealos.run
```

**步骤2**: 进入"应用管理"→"应用模板"

**步骤3**: 查找或导入"Growark Backend"模板

**步骤4**: 点击"部署"，填写基本信息：
- 应用名称: `growark-backend`
- 镜像版本: `node:18-alpine`
- 副本数: `3`
- CPU: `500m`
- 内存: `512Mi`

**步骤5**: 点击"确认部署"

**等待**: 约1-2分钟后部署完成，系统会提供公网地址

---

### 方法2: 使用 kubectl 命令行

**步骤1**: 克隆项目并进入目录
```bash
git clone https://github.com/rf2025up/growark.git
cd growark
```

**步骤2**: 修改配置文件中的镜像和数据库信息
```bash
# 编辑 k8s-deployment.yaml
# 修改以下内容：
# - image: 改为你的Docker镜像地址
# - DB_HOST: 改为你的PostgreSQL地址
# - DB_PASSWORD: 改为实际密码
```

**步骤3**: 应用Kubernetes配置
```bash
kubectl apply -f k8s-deployment.yaml
```

**步骤4**: 验证部署
```bash
# 查看Pod状态
kubectl get pods -n growark

# 查看Service（获取公网IP）
kubectl get svc -n growark

# 查看日志
kubectl logs -n growark -l app=backend -f
```

---

### 方法3: 使用 docker-compose（仅限开发）

```bash
# 1. 克隆项目
git clone https://github.com/rf2025up/growark.git
cd growark

# 2. 构建Docker镜像
docker build -t growark-backend:latest .

# 3. 启动容器
docker-compose up -d

# 4. 验证
docker logs growark-backend

# 5. 访问
curl http://localhost:3000/health
```

---

## 🔑 配置环境变量

### 方法1: ConfigMap 和 Secret

```bash
# 创建Secret存储敏感信息
kubectl create secret generic postgres-secret \
  --from-literal=password='4z2hdw8n' \
  -n growark

# 或编辑YAML文件并应用
kubectl apply -f k8s-deployment.yaml
```

### 方法2: Sealos UI

1. 进入应用详情页
2. 点击"环境变量"
3. 添加以下变量：

```
NODE_ENV=production
PORT=3000
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password
```

### 环境变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| NODE_ENV | Node环境 | production |
| PORT | 服务端口 | 3000 |
| DB_HOST | 数据库主机 | entr-postgresql.ns-ll4yxeb3.svc |
| DB_PORT | 数据库端口 | 5432 |
| DB_NAME | 数据库名 | postgres |
| DB_USER | 数据库用户 | postgres |
| DB_PASSWORD | 数据库密码 | 你的密码 |

---

## 🖼️ 从Sealos UI部署

### 步骤1: 进入应用中心

```
https://cloud.sealos.io → 应用管理
```

### 步骤2: 选择部署方式

3种选择：
- ✅ 推荐: 应用模板 (最简单)
- 高级: Dockerfile
- 高级: YAML配置

### 步骤3: 配置应用

**基本信息**:
- 应用名: growark-backend
- 镜像: `node:18-alpine` 或自己的镜像
- 版本: latest

**网络配置**:
- 暴露端口: 3000
- 访问方式: 公网LoadBalancer

**环境配置**:
- 添加所有数据库环境变量（见上表）

**资源配置**:
```
CPU: 250m-500m
内存: 256Mi-512Mi
副本数: 3
```

**自动扩缩容**:
- 启用HPA
- 最小副本: 1
- 最大副本: 10
- CPU阈值: 70%

### 步骤4: 完成部署

点击"确认部署"后，系统将：
1. 创建Deployment（3个副本）
2. 创建Service（LoadBalancer）
3. 配置自动扩缩容
4. 设置健康检查

约1-2分钟后部署完成。

---

## 📊 部署验证

### 1. 检查Pod状态

```bash
kubectl get pods -n growark

# 预期输出：
# NAME                               READY   STATUS    RESTARTS   AGE
# backend-65f9c9d8b4-abc12           1/1     Running   0          2m
# backend-65f9c9d8b4-def34           1/1     Running   0          2m
# backend-65f9c9d8b4-ghi56           1/1     Running   0          2m
```

### 2. 检查Service和公网IP

```bash
kubectl get svc -n growark

# 预期输出：
# NAME              TYPE           CLUSTER-IP      EXTERNAL-IP      PORT(S)        AGE
# backend           LoadBalancer   10.96.x.x       公网IP地址        80:xxxx/TCP    2m
```

记录 EXTERNAL-IP，这是你的公网访问地址。

### 3. 测试API连接

```bash
# 使用公网IP测试
curl http://<EXTERNAL_IP>/health

# 预期响应：
# {"status":"OK"}
```

### 4. 检查日志

```bash
# 查看所有Pod日志
kubectl logs -n growark -l app=backend -f

# 预期日志：
# ✓ 后端服务器已启动: http://0.0.0.0:3000
# ✓ WebSocket 服务: ws://0.0.0.0:3000
```

### 5. 监控性能

```bash
# 实时查看资源使用
kubectl top pods -n growark

# 查看HPA状态
kubectl get hpa -n growark
```

---

## 🌐 配置前端应用

### 大屏端(BigScreen)

更新环境变量指向公网后端：

**`.env.production`**:
```
REACT_APP_API_URL=http://<EXTERNAL_IP>/api
REACT_APP_WS_URL=ws://<EXTERNAL_IP>
```

部署到Sealos:
```bash
cd bigscreen
npm install
npm run build
# 上传dist文件夹到Sealos或创建新应用
```

### 手机端(Mobile)

更新环境变量：

**`.env.production`**:
```
REACT_APP_API_URL=http://<EXTERNAL_IP>/api
```

部署到Sealos:
```bash
cd mobile
npm install
npm run build
# 上传dist文件夹到Sealos或创建新应用
```

---

## 🔐 生产环保规范

### 1. 数据库安全

```bash
# 使用强密码
DB_PASSWORD=ComplexPassword123!@#

# 限制数据库访问IP
# 在Sealos数据库配置中设置白名单
```

### 2. CORS安全配置

编辑 `server.js`：
```javascript
const corsOptions = {
  origin: ['https://your-domain.com', 'https://mobile.your-domain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
```

### 3. HTTPS/WSS配置

```bash
# 获取SSL证书（Sealos通常提供）
# 配置SSL终止
# 更新前端连接地址为 https 和 wss
```

### 4. 速率限制

添加速率限制中间件：
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制100个请求
});

app.use('/api/', limiter);
```

### 5. 监控告警

```bash
# 设置Sealos告警
# - CPU使用 > 80%
# - 内存使用 > 90%
# - Pod重启次数 > 3
# - 错误率 > 5%
```

---

## 📈 性能优化

### 1. 数据库连接池

```javascript
const pool = new Pool({
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 2. 缓存策略

```javascript
// 使用Redis缓存（可选）
const redis = require('redis');
const client = redis.createClient({
  host: 'redis-host',
  port: 6379
});
```

### 3. 负载均衡

```bash
# Sealos自动配置
# - Round Robin负载均衡
# - Session亲和性
# - 连接池复用
```

### 4. 副本扩缩容

```yaml
# 已在k8s-deployment.yaml中配置
replicas: 3 # 最小3个
HPA: 1-10 # 自动扩至10个
```

---

## 🔍 故障排查

### 问题1: Pod持续重启

```bash
# 查看日志
kubectl logs -n growark <pod-name> --previous

# 常见原因：
# 1. 数据库连接失败 → 检查DB_HOST, DB_PASSWORD
# 2. 端口冲突 → 检查PORT环境变量
# 3. 内存不足 → 增加副本或资源限制
```

**解决**:
```bash
# 增加资源限制
kubectl edit deployment backend -n growark
# 修改 resources.limits.memory 为 1Gi
```

### 问题2: 无法连接数据库

```bash
# 测试数据库连接
kubectl run -it --rm psql --image=postgres:15-alpine -- \
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# 检查凭证
kubectl get secret -n growark postgres-secret -o yaml
```

### 问题3: WebSocket连接失败

```bash
# 检查Service类型
kubectl get svc -n growark

# 应该是 LoadBalancer 类型
# 查看外部IP已分配

# 测试WebSocket
wscat -c ws://EXTERNAL_IP/
```

### 问题4: 高延迟或超时

```bash
# 查看Pod资源使用
kubectl top pods -n growark

# 如果接近限制，增加资源或副本数

# 查看数据库连接数
# SELECT count(*) FROM pg_stat_activity;
```

---

## 📊 监控和日志

### 1. 查看实时日志

```bash
# 所有Pod日志
kubectl logs -n growark -l app=backend -f

# 特定Pod日志
kubectl logs -n growark backend-65f9c9d8b4-abc12 -f

# 最后100行
kubectl logs -n growark -l app=backend --tail=100
```

### 2. 性能指标

```bash
# CPU和内存使用
kubectl top pods -n growark

# 详细指标
kubectl describe pod -n growark <pod-name>
```

### 3. 事件监控

```bash
# 查看集群事件
kubectl get events -n growark --sort-by='.lastTimestamp'

# 关注错误事件
kubectl get events -n growark | grep Error
```

### 4. WebSocket连接监控

```bash
# 检查连接数（在Pod中执行）
netstat -an | grep 3000 | wc -l

# 检查活跃连接
ss -s | grep -i tcp
```

---

## 🚀 自动化部署

### GitHub Actions示例

```yaml
# .github/workflows/deploy.yml
name: Deploy to Sealos

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Build Docker Image
      run: |
        docker build -t growark-backend:${{ github.sha }} .
        docker tag growark-backend:${{ github.sha }} growark-backend:latest

    - name: Push to Registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push growark-backend:latest

    - name: Deploy to Sealos
      run: |
        kubectl set image deployment/backend \
          backend=growark-backend:${{ github.sha }} \
          -n growark
```

---

## ✅ 部署检查清单

部署前：
- [ ] 数据库已准备就绪
- [ ] 环境变量已配置
- [ ] 镜像已构建和测试
- [ ] Kubernetes配置已审查

部署中：
- [ ] kubectl已连接到正确集群
- [ ] Namespace已创建
- [ ] Secret已创建
- [ ] Deployment已创建

部署后：
- [ ] 所有Pod正在运行
- [ ] Service已获得公网IP
- [ ] 健康检查通过
- [ ] API可正常访问
- [ ] WebSocket连接正常
- [ ] 前端应用已配置新地址

---

## 📞 获取公网地址

部署完成后，获取公网访问地址：

```bash
kubectl get svc -n growark -o wide

# 输出示例：
# NAME      TYPE           CLUSTER-IP   EXTERNAL-IP      PORT(S)        AGE
# backend   LoadBalancer   10.96.1.1    123.45.67.89     80:30123/TCP   2m
```

**公网地址**: `http://123.45.67.89`

使用这个地址配置前端应用的API_URL和WS_URL。

---

## 🎉 部署完成

恭喜！你的Growark系统已部署到Sealos公网！

### 后续步骤

1. **配置前端应用**
   - 更新大屏端和手机端的API地址
   - 部署前端到Sealos

2. **启用https**
   - 申请SSL证书
   - 配置Ingress

3. **监控和维护**
   - 设置监控告警
   - 定期检查日志
   - 备份数据库

4. **性能优化**
   - 优化查询
   - 添加缓存
   - 扩展副本

---

## 📚 参考资源

- [Sealos官方文档](https://docs.sealos.io/)
- [Kubernetes文档](https://kubernetes.io/docs/)
- [Docker文档](https://docs.docker.com/)

---

**最后更新**: 2024年11月22日
**文档版本**: 1.0
**适用环境**: Sealos公网
