# 🔧 Sealos 公网访问 - 快速诊断指南

## 问题: 打不开公网地址

### ⚡ 快速自检（2分钟）

运行这个脚本检查部署状态：

```bash
bash ./check-sealos-status.sh
```

脚本会检查：
- ✅ 命名空间
- ✅ Deployment
- ✅ Pod 状态
- ✅ Service
- ✅ 外部 IP
- ✅ 资源使用

---

## 问题排查树

```
打不开公网地址
    ├─ 检查应用是否部署
    │   ├─ YES → 检查是否有 Pod Running
    │   │   ├─ YES → 检查 LoadBalancer IP
    │   │   │   ├─ 有 IP → 测试 curl http://IP/health
    │   │   │   │   ├─ 成功 (200) → ✅ 公网可以访问！
    │   │   │   │   └─ 失败 → 检查防火墙和安全组
    │   │   │   └─ 没有 IP (<pending>) → 等待 3-5 分钟
    │   │   └─ NO → Pod 可能启动失败，查看日志
    │   └─ NO → 需要部署应用
    └─ 检查网络连接
        ├─ 能 ping 通公网 IP
        ├─ 能 DNS 解析
        └─ 防火墙允许 80/443 端口
```

---

## 📍 获取公网 IP 的三种方式

### 方式1: Sealos 控制面板（最简单）

1. 登录 https://cloud.sealos.io
2. 应用管理 → 我的应用
3. 点击应用名称
4. 查看"网络"或"服务"标签
5. 查找"外部 IP"或"公网地址"

### 方式2: kubectl 命令

```bash
# 查看所有 Service
kubectl get svc -n growark

# 查看详细信息
kubectl get svc -n growark -o wide

# 只显示外部 IP
kubectl get svc -n growark -o jsonpath='{.items[?(@.spec.type=="LoadBalancer")].status.loadBalancer.ingress[0].ip}'
```

### 方式3: 实时监控

```bash
# 监控 IP 分配
kubectl get svc -n growark --watch
```

---

## 🔍 外部 IP 的三种状态

### ✅ 状态1: 已分配（成功）

```
NAME              TYPE           CLUSTER-IP   EXTERNAL-IP    PORT(S)
growark-backend   LoadBalancer   10.96.x.x    203.0.113.42   80:30123/TCP
```

**意义**: 可以访问！
**访问地址**: http://203.0.113.42

### ⏳ 状态2: 等待中（正常）

```
NAME              TYPE           CLUSTER-IP   EXTERNAL-IP   PORT(S)
growark-backend   LoadBalancer   10.96.x.x    <pending>     80:30123/TCP
```

**意义**: 还在分配
**解决**: 等待 3-5 分钟

### ❌ 状态3: 无法分配（问题）

```
NAME              TYPE           CLUSTER-IP   EXTERNAL-IP   PORT(S)
growark-backend   LoadBalancer   10.96.x.x    <none>        80:30123/TCP
```

**意义**: 集群可能没有 LoadBalancer 支持
**解决**:
- 检查集群配置
- 联系 Sealos 支持

---

## 🧪 测试连接

### 步骤1: 获取公网 IP

```bash
EXTERNAL_IP=$(kubectl get svc -n growark -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}')
echo "公网IP: $EXTERNAL_IP"
```

### 步骤2: 测试 HTTP 连接

```bash
# 测试健康检查
curl http://$EXTERNAL_IP/health

# 应该返回:
# {"status":"OK"}
```

### 步骤3: 测试 API

```bash
# 获取学生列表
curl http://$EXTERNAL_IP/api/students

# 应该返回 JSON 数据
```

### 步骤4: 测试 WebSocket（可选）

```bash
# 需要 wscat 工具
npm install -g wscat

# 测试连接
wscat -c ws://$EXTERNAL_IP/
```

---

## 🆘 常见错误及解决

### ❌ 错误1: Connection refused

```
curl: (7) Failed to connect to 203.0.113.42 port 80: Connection refused
```

**原因**:
- 应用还在启动
- 防火墙阻止
- 端口配置错误

**解决**:
```bash
# 查看 Pod 状态
kubectl get pods -n growark

# 查看日志
kubectl logs -n growark -l app=backend

# 检查应用是否真的启动
kubectl exec -it <pod-name> -n growark -- curl http://localhost:3000/health
```

### ❌ 错误2: Operation timed out

```
curl: (28) Operation timed out after 30000 milliseconds
```

**原因**:
- 网络连接问题
- 防火墙/安全组阻止
- DNS 解析问题

**解决**:
```bash
# 检查网络连接
ping -c 4 203.0.113.42

# 检查 DNS
nslookup 203.0.113.42

# 增加超时时间
curl --connect-timeout 10 http://203.0.113.42/health
```

### ❌ 错误3: 无法获取 EXTERNAL-IP

**症状**:
```
<pending> 一直不变
<none> 显示
```

**原因**:
- 集群不支持 LoadBalancer
- 网络配置问题
- 配额限制

**解决**:
```bash
# 检查集群支持的服务类型
kubectl api-resources | grep Service

# 查看事件了解更多信息
kubectl describe svc -n growark growark-backend-svc

# 联系 Sealos 支持
```

---

## 📋 完整诊断清单

```
网络连接诊断:
☐ 能否 ping 公网 IP
☐ 能否 DNS 解析
☐ 网络延迟是否正常 (< 100ms)

Sealos 部署诊断:
☐ kubectl 是否能连接集群
☐ 命名空间 growark 是否存在
☐ Deployment 是否存在且 Ready
☐ Pod 是否都是 Running 状态
☐ Service 是否是 LoadBalancer 类型
☐ EXTERNAL-IP 是否已分配

应用诊断:
☐ 健康检查是否返回 200
☐ API 是否能正常访问
☐ 日志中是否有错误
☐ 资源使用是否正常 (CPU/内存)
```

---

## 🚀 快速部署检查

如果还没有部署，快速部署步骤：

```bash
# 1. 应用 Kubernetes 配置
kubectl apply -f k8s-deployment.yaml

# 2. 等待部署完成
kubectl rollout status deployment/growark-backend -n growark

# 3. 获取公网 IP（可能需要等待几分钟）
kubectl get svc -n growark --watch

# 4. 测试连接
curl http://EXTERNAL_IP/health
```

---

## 📞 收集诊断信息

如果需要帮助，收集这些信息：

```bash
# 1. 所有资源状态
kubectl get all -n growark

# 2. Service 详情
kubectl describe svc -n growark

# 3. Pod 日志（最后 50 行）
kubectl logs -n growark -l app=backend --tail=50

# 4. 事件
kubectl get events -n growark

# 5. Pod 详情
kubectl describe pod -n growark <pod-name>
```

---

## ✅ 成功的标志

当以下条件都满足时，说明已成功：

```bash
$ kubectl get svc -n growark
# EXTERNAL-IP 列显示 IP 地址 (不是 <pending> 或 <none>)

$ curl http://EXTERNAL_IP/health
# {"status":"OK"}

$ kubectl get pods -n growark
# 所有 Pod 状态都是 Running

$ kubectl logs -n growark -l app=backend | tail -1
# ✓ 后端服务器已启动: http://0.0.0.0:3000
```

---

## 🎓 下一步

1. **确认公网可以访问**
   - 运行 curl 测试
   - 从浏览器访问

2. **配置前端应用**
   ```
   REACT_APP_API_URL=http://EXTERNAL_IP/api
   REACT_APP_WS_URL=ws://EXTERNAL_IP
   ```

3. **部署前端**
   ```bash
   cd bigscreen && npm run build
   cd mobile && npm run build
   ```

4. **测试三端同步**
   - 手机端创建学生
   - 大屏端实时显示

---

## 📊 性能检查

部署后，检查性能：

```bash
# 查看响应时间
time curl http://EXTERNAL_IP/api/students

# 监控资源
kubectl top pods -n growark

# 查看网络延迟
curl -w 'DNS: %{time_namelookup}s, Connect: %{time_connect}s, Total: %{time_total}s\n' http://EXTERNAL_IP/health
```

---

**最后更新**: 2024年11月22日

**更多帮助**: 查看 SEALOS_DEPLOYMENT.md 或 SEALOS_NETWORK_DIAGNOSIS.md
