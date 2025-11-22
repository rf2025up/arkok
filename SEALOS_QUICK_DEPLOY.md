# 🚀 Sealos 公网部署 - 3分钟快速指南

## ⚡ 最快部署方式

### 方式1: 使用部署脚本（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/rf2025up/growark.git
cd growark

# 2. 运行部署脚本
./deploy-to-sealos.sh

# 3. 按提示输入参数
# - 应用名称
# - 命名空间
# - 副本数
# - 数据库凭证
# 等等...

# 4. 完成！脚本会输出公网地址
```

---

### 方式2: 使用 kubectl 一行命令

```bash
# 确保 kubectl 已连接到 Sealos 集群
kubectl apply -f k8s-deployment.yaml

# 获取公网IP
kubectl get svc -n growark growark-backend-svc -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

---

### 方式3: 通过 Sealos 控制面板（最简单）

1. **登录 Sealos**: https://cloud.sealos.io

2. **进入应用管理** → 创建新应用

3. **选择部署方式**:
   - 应用市场（如果有Growark模板）
   - Dockerfile
   - YAML

4. **填写基本信息**:
   ```
   名称: growark-backend
   镜像: node:18-alpine
   端口: 3000
   副本: 3
   ```

5. **添加环境变量**:
   ```
   NODE_ENV=production
   DB_HOST=entr-postgresql.ns-ll4yxeb3.svc
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=4z2hdw8n
   ```

6. **点击部署** → 等待 1-2 分钟

7. **获取公网IP** → 点击服务详情

---

## 📊 部署后立即可用

部署完成后，你会获得：

```
✅ 后端API服务
   http://<公网IP>/api/students
   http://<公网IP>/api/challenges
   等所有API端点

✅ WebSocket实时推送
   ws://<公网IP>

✅ 健康检查
   http://<公网IP>/health
```

---

## 🔗 配置前端应用

### 大屏端（BigScreen）

创建 `bigscreen/.env.production`:
```env
REACT_APP_API_URL=http://<YOUR_PUBLIC_IP>/api
REACT_APP_WS_URL=ws://<YOUR_PUBLIC_IP>
```

部署：
```bash
cd bigscreen
npm install
npm run build
# 上传 dist 文件夹到Sealos或使用Docker
```

### 手机端（Mobile）

创建 `mobile/.env.production`:
```env
REACT_APP_API_URL=http://<YOUR_PUBLIC_IP>/api
```

部署：
```bash
cd mobile
npm install
npm run build
# 上传 dist 文件夹到Sealos或使用Docker
```

---

## ✅ 验证部署成功

### 1. 检查Pod状态

```bash
kubectl get pods -n growark

# 应该看到3个Running的Pod
# NAME                                READY   STATUS    RESTARTS   AGE
# growark-backend-xxxx-yyyy           1/1     Running   0          2m
# growark-backend-xxxx-zzzz           1/1     Running   0          2m
# growark-backend-xxxx-aaaa           1/1     Running   0          2m
```

### 2. 测试API

```bash
# 替换 YOUR_PUBLIC_IP
curl http://YOUR_PUBLIC_IP/health

# 应该返回
# {"status":"OK"}
```

### 3. 查看日志

```bash
kubectl logs -n growark -l app=backend -f

# 应该看到
# ✓ 后端服务器已启动: http://0.0.0.0:3000
# ✓ WebSocket 服务: ws://0.0.0.0:3000
# ✓ 数据库已连接: PostgreSQL
```

---

## 📍 获取公网IP地址

### 方法1: kubectl 命令

```bash
kubectl get svc -n growark

# 查找 LoadBalancer 类型的 EXTERNAL-IP 列
# NAME              TYPE           CLUSTER-IP      EXTERNAL-IP      PORT(S)
# growark-backend   LoadBalancer   10.96.x.x       YOUR_PUBLIC_IP   80:30123/TCP
```

### 方法2: Sealos UI

1. 登录 https://cloud.sealos.io
2. 应用管理 → 选择你的应用
3. 点击"服务"标签
4. 查看"公网地址"或"外部IP"

### 方法3: 使用 jsonpath

```bash
kubectl get svc -n growark -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}'
```

---

## 🎯 常见场景

### 场景1: 使用HTTPS/WSS

```bash
# 申请SSL证书后，创建Ingress
cat << EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: growark-ingress
  namespace: growark
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - growark.your-domain.com
    secretName: growark-tls
  rules:
  - host: growark.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: growark-backend-svc
            port:
              number: 80
EOF
```

### 场景2: 增加副本数

```bash
kubectl scale deployment growark-backend \
  --replicas=5 \
  -n growark
```

### 场景3: 查看实时监控

```bash
# 监控Pod资源使用
kubectl top pods -n growark

# 监控节点资源
kubectl top nodes

# 查看HPA状态
kubectl get hpa -n growark
```

### 场景4: 查看所有事件

```bash
kubectl get events -n growark --sort-by='.lastTimestamp'
```

---

## 🔧 故障排查

### ❌ Pod无法启动

```bash
# 1. 查看Pod状态
kubectl describe pod <pod-name> -n growark

# 2. 查看日志
kubectl logs <pod-name> -n growark

# 常见原因：
# - 内存不足 → 增加资源限制
# - 数据库连接失败 → 检查DB_PASSWORD
# - 镜像拉取失败 → 检查镜像地址
```

### ❌ 无法连接服务

```bash
# 1. 检查Service
kubectl get svc -n growark

# 2. 检查LoadBalancer是否已分配IP
# 如果 EXTERNAL-IP 显示 <pending>，等待几分钟

# 3. 检查安全组/防火墙规则
# 确保3000端口已开放

# 4. 测试Pod内部连接
kubectl exec -it <pod-name> -n growark -- \
  curl http://localhost:3000/health
```

### ❌ WebSocket连接失败

```bash
# 1. 检查日志
kubectl logs -n growark -l app=backend | grep -i websocket

# 2. 测试连接
wscat -c ws://YOUR_PUBLIC_IP/

# 3. 检查防火墙
# WebSocket也使用3000端口，确保开放
```

---

## 📈 性能优化

### 1. 自动扩缩容已启用

```bash
# 当CPU > 70% 或内存 > 80% 时自动扩容
kubectl get hpa -n growark

# 监控扩缩容事件
kubectl get events -n growark | grep HPA
```

### 2. 增加数据库连接池

编辑 `server.js` 中的数据库连接：
```javascript
const pool = new Pool({
  min: 5,      // 增加从2到5
  max: 20,     // 增加从10到20
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 3. 启用缓存（可选）

```bash
# 如果需要Redis缓存，在Sealos中创建Redis服务
# 然后在server.js中配置
```

---

## 📊 监控命令速查

| 命令 | 用途 |
|------|------|
| `kubectl get pods -n growark` | 查看Pod状态 |
| `kubectl logs -n growark -l app=backend -f` | 查看实时日志 |
| `kubectl top pods -n growark` | 查看资源使用 |
| `kubectl describe pod <name> -n growark` | 查看Pod详情 |
| `kubectl get events -n growark` | 查看事件 |
| `kubectl get hpa -n growark` | 查看自动扩缩容 |

---

## 🎉 部署完成检查清单

- [ ] 后端Pod已启动（3个副本）
- [ ] Service已获得公网IP
- [ ] API可正常访问 (`/health` 返回200)
- [ ] WebSocket可连接
- [ ] 前端应用已配置新的API地址
- [ ] 前端应用已部署到Sealos
- [ ] 手机端可创建学生
- [ ] 大屏端实时显示更新
- [ ] 网络中断后自动重连
- [ ] 性能指标良好（CPU < 70%, 内存 < 80%）

---

## 📞 需要帮助？

查看详细指南：[SEALOS_DEPLOYMENT.md](./SEALOS_DEPLOYMENT.md)

常见问题和解决方案都在里面！

---

## 🚀 一行命令快速部署

```bash
# 确保你的 kubeconfig 已配置
./deploy-to-sealos.sh
```

---

**就这么简单！** 你的Growark系统现在已部署到Sealos公网！ 🎊

现在配置前端应用，让三端真正同步起来！
