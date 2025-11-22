# Sealos 公网访问诊断指南

## 🔍 问题诊断

你报告的问题：**打不开公网地址**

### 可能的原因

1. **后端服务未启动**
2. **LoadBalancer未分配公网IP**
3. **防火墙/安全组规则阻止**
4. **网络连接配置问题**
5. **Sealos集群网络问题**

---

## 📊 诊断信息收集

### 当前环境检测到的信息

```
本地IP: 10.107.175.145 (这是一个内部容器IP)
网络类型: Sealos DevBox 环境
```

### 这意味着什么？

- ✅ 你在Sealos DevBox中
- ⚠️ 当前使用的是内部IP，不是公网IP
- ⚠️ 需要通过Sealos控制面板获取公网地址

---

## 🔧 解决步骤

### 步骤1: 检查Sealos控制面板

**登录 Sealos 控制面板**：
```
https://cloud.sealos.io
```

**导航路径**：
```
应用管理 → 我的应用 → 查找你的应用
```

**查看服务信息**：
```
点击应用 → 服务/网络 标签
查找 LoadBalancer 类型的服务
查看 "外部IP" 或 "公网地址"
```

### 步骤2: 检查应用是否已部署

**在Sealos UI中验证**：
```
☑ 应用状态: Running
☑ Pod数量: 3 (或你设置的副本数)
☑ 外部IP: 已分配 (不是 <pending>)
```

**如果外部IP显示 `<pending>`**：
```
说明: LoadBalancer还在分配IP
解决: 等待3-5分钟，然后刷新
```

### 步骤3: 通过 kubectl 检查

如果你有 kubectl 访问权限，运行以下命令：

```bash
# 检查Service状态
kubectl get svc -n growark

# 查看详细信息
kubectl get svc -n growark -o wide

# 查看特定服务的详情
kubectl describe svc growark-backend-svc -n growark

# 检查Pod状态
kubectl get pods -n growark
```

**预期输出应该包含**：
```
NAME                 TYPE           CLUSTER-IP      EXTERNAL-IP       PORT(S)
growark-backend-svc  LoadBalancer   10.96.x.x       YOUR_PUBLIC_IP    80:30123/TCP
```

### 步骤4: 测试公网连接

获得公网IP后，测试连接：

```bash
# 测试健康检查
curl http://YOUR_PUBLIC_IP/health

# 应该返回:
# {"status":"OK"}
```

---

## 🚨 常见问题及解决方案

### 问题1: LoadBalancer 显示 `<pending>`

**原因**：
- Sealos集群正在分配IP
- 网络配置延迟

**解决**：
```bash
# 等待IP分配
kubectl get svc -n growark --watch

# 或每30秒检查一次
watch -n 30 'kubectl get svc -n growark'
```

### 问题2: Pod 状态不是 Running

**查看日志**：
```bash
kubectl logs -n growark <pod-name>
```

**常见错误**：
- 数据库连接失败 → 检查 DB_PASSWORD
- 镜像拉取失败 → 检查镜像地址
- 内存不足 → 增加资源限制

### 问题3: API 返回 Connection Refused

**原因可能**：
1. 后端应用未启动
2. 端口配置错误
3. 网络策略阻止

**检查**：
```bash
# 查看Pod日志
kubectl logs -n growark -l app=backend

# 进入Pod检查
kubectl exec -it <pod-name> -n growark -- \
  curl http://localhost:3000/health

# 检查网络策略
kubectl get networkpolicy -n growark
```

### 问题4: DNS 无法解析

**症状**：
```
curl: (6) Couldn't resolve host name
```

**解决**：
```bash
# 使用IP而不是域名
curl http://IP_ADDRESS/health

# 检查DNS配置
kubectl describe pod <pod-name> -n growark | grep -i dns
```

---

## 🔄 完整诊断流程

### 一、确认应用已部署

```bash
# 1. 检查Deployment
kubectl get deployment -n growark

# 2. 检查Pod
kubectl get pods -n growark

# 3. 验证Pod数量 (应该 >= 1)
```

### 二、确认Service已创建

```bash
# 1. 检查Service
kubectl get svc -n growark

# 2. 检查Service类型 (应该是 LoadBalancer)
kubectl get svc -n growark -o wide

# 3. 查看端口映射
kubectl get svc -n growark -o yaml
```

### 三、等待IP分配

```bash
# 1. 监控IP分配
kubectl get svc -n growark --watch

# 2. 当 EXTERNAL-IP 不再是 <pending> 时，说明已分配

# 3. 记录这个 IP
```

### 四、测试连接

```bash
# 1. 测试 HTTP 连接
curl http://EXTERNAL_IP/health

# 2. 如果返回 {"status":"OK"}，说明成功！

# 3. 测试 WebSocket (可选)
wscat -c ws://EXTERNAL_IP/
```

---

## 📍 Sealos 不同环境的区别

### DevBox (你现在的环境)
```
✅ 用于开发和测试
✅ 内部网络: 10.107.x.x
⚠️ 需要通过Sealos配置获取公网IP
⚠️ 不能直接访问后端
✅ 可以通过kubectl管理
```

### Sealos 集群 (生产环境)
```
✅ 自动分配公网IP
✅ 可直接通过IP访问
✅ 支持LoadBalancer服务
✅ 完整的Kubernetes功能
```

---

## 🎯 你应该做的

### 现在立即做:

1. **登录Sealos控制面板**
   ```
   https://cloud.sealos.io
   ```

2. **查找你的应用**
   ```
   应用管理 → 我的应用
   ```

3. **检查服务信息**
   ```
   点击应用 → 网络/服务
   查看外部IP/公网地址
   ```

4. **记录这个地址**
   ```
   http://YOUR_PUBLIC_IP
   ```

5. **测试它**
   ```
   curl http://YOUR_PUBLIC_IP/health
   ```

### 如果还是不行:

1. **检查应用状态**
   - 是否显示 "Running"?
   - 有多少个Pod在运行?

2. **检查外部IP**
   - 是否还显示 `<pending>`?
   - 是否为空?

3. **联系Sealos支持**
   - 描述你遇到的问题
   - 提供应用名称和命名空间

---

## 🔐 Sealos 网络架构

```
互联网用户
    ↓
Sealos Load Balancer (分配的公网IP)
    ↓
你的应用 Pod (在集群内)
    ↓
PostgreSQL 数据库 (集群内)
```

你需要获取的是 **Sealos Load Balancer** 分配的公网IP。

---

## ✅ 成功的标志

当你能做以下事情时，说明配置成功了：

```bash
# 1. 获得公网IP
YOUR_PUBLIC_IP="123.45.67.89" (示例)

# 2. 测试API成功
$ curl http://123.45.67.89/health
{"status":"OK"}

# 3. 查看Pod日志正常
$ kubectl logs -n growark -l app=backend | tail -5
✓ 后端服务器已启动: http://0.0.0.0:3000
✓ WebSocket 服务: ws://0.0.0.0:3000
✓ 数据库已连接: PostgreSQL

# 4. 前端可以连接
$ curl http://123.45.67.89/api/students
[...]
```

---

## 📞 快速参考命令

```bash
# 部署应用
kubectl apply -f k8s-deployment.yaml

# 查看所有资源
kubectl get all -n growark

# 查看Service和IP
kubectl get svc -n growark -o wide

# 实时监控IP分配
kubectl get svc -n growark --watch

# 查看Pod日志
kubectl logs -n growark -l app=backend -f

# 进入Pod
kubectl exec -it <pod-name> -n growark -- bash

# 删除应用
kubectl delete namespace growark
```

---

## 🎓 学习资源

- [Sealos官方文档](https://docs.sealos.io)
- [Kubernetes服务](https://kubernetes.io/docs/concepts/services-networking/service/)
- [LoadBalancer详解](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)

---

**下一步**：

1. 登录Sealos控制面板查看你的应用
2. 记录分配的公网IP
3. 测试连接是否正常
4. 配置前端应用指向这个IP
5. 部署前端应用

---

**需要帮助？** 提供以下信息:
- 应用名称
- 命名空间名称
- Service状态 (kubectl get svc输出)
- Pod状态 (kubectl get pods输出)
- Pod日志 (kubectl logs输出)

---

最后更新: 2024年11月22日
