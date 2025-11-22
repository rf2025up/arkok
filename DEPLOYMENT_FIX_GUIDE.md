# 🔧 前端应用路由修复部署指南

**更新时间**: 2025年11月22日
**问题**: `/admin` 和 `/display` 都连接到了手机端代码，导致大屏端无法正常访问
**方案**: 重新构建前端应用，配置正确的路由映射

---

## 📋 问题分析

### 当前状态（错误）
- ❌ `https://xysrxgjnpycd.sealoshzh.site/admin` → 手机端应用 ✓
- ❌ `https://xysrxgjnpycd.sealoshzh.site/display` → 手机端应用（应该是大屏端）

### 目标状态（正确）
- ✅ `https://xysrxgjnpycd.sealoshzh.site/admin` → 手机端应用（新版本，含新功能）
- ✅ `https://xysrxgjnpycd.sealoshzh.site/display` → 大屏端应用

---

## ✅ 已完成的步骤

### 1. 前端应用重新构建

**手机端构建** ✓
```bash
cd /home/devbox/project/mobile
npm run build
```
- 输出: `/mobile/dist/`
- 大小: ~600KB
- 包含: 超能英雄、天才少年、学霸无敌等新功能

**大屏端构建** ✓
```bash
cd /home/devbox/project/bigscreen
npm run build
```
- 输出: `/bigscreen/dist/`
- 大小: ~200KB
- 最新版本的大屏实时显示系统

---

## 🚀 部署步骤

### 方案 A: 使用 Nginx 反向代理（推荐）

#### 1. 准备部署文件

已创建以下文件：
- `nginx.conf` - Nginx 配置（路由映射）
- `Dockerfile.frontend.nginx` - 多阶段构建 Dockerfile

#### 2. 构建 Docker 镜像

```bash
docker build -f Dockerfile.frontend.nginx -t growark-frontend:latest .
```

#### 3. 推送到镜像仓库

```bash
# 如果使用 Docker Hub
docker tag growark-frontend:latest username/growark-frontend:latest
docker push username/growark-frontend:latest

# 如果使用 Sealos 内置镜像仓库
# 按 Sealos 文档配置
```

#### 4. 在 Sealos 中部署

创建新的 Deployment，使用上述镜像：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: growark-frontend
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: growark-frontend
  template:
    metadata:
      labels:
        app: growark-frontend
    spec:
      containers:
      - name: frontend
        image: username/growark-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

#### 5. 配置 Service 和 Ingress

```yaml
apiVersion: v1
kind: Service
metadata:
  name: growark-frontend-svc
spec:
  type: LoadBalancer
  selector:
    app: growark-frontend
  ports:
  - port: 80
    targetPort: 80

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: growark-ingress
spec:
  rules:
  - host: xysrxgjnpycd.sealoshzh.site
    http:
      paths:
      - path: /admin
        pathType: Prefix
        backend:
          service:
            name: growark-frontend-svc
            port:
              number: 80
      - path: /display
        pathType: Prefix
        backend:
          service:
            name: growark-frontend-svc
            port:
              number: 80
```

---

### 方案 B: 使用两个独立的容器（简单方案）

如果 Sealos 不支持 Nginx 反向代理，可以部署两个独立的 http-server：

#### 1. 手机端容器

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: growark-mobile
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: growark-mobile
  template:
    metadata:
      labels:
        app: growark-mobile
    spec:
      containers:
      - name: mobile
        image: node:18-alpine
        workingDir: /app
        command:
          - sh
          - -c
          - |
            npm install -g http-server && \
            http-server . -p 3000 --cors
        volumeMounts:
        - name: mobile-dist
          mountPath: /app
        ports:
        - containerPort: 3000
      volumes:
      - name: mobile-dist
        configMap:
          name: mobile-dist

---
apiVersion: v1
kind: Service
metadata:
  name: growark-mobile-svc
spec:
  selector:
    app: growark-mobile
  ports:
  - port: 80
    targetPort: 3000
```

#### 2. 大屏端容器

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: growark-bigscreen
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: growark-bigscreen
  template:
    metadata:
      labels:
        app: growark-bigscreen
    spec:
      containers:
      - name: bigscreen
        image: node:18-alpine
        workingDir: /app
        command:
          - sh
          - -c
          - |
            npm install -g http-server && \
            http-server . -p 3001 --cors
        volumeMounts:
        - name: bigscreen-dist
          mountPath: /app
        ports:
        - containerPort: 3001
      volumes:
      - name: bigscreen-dist
        configMap:
          name: bigscreen-dist

---
apiVersion: v1
kind: Service
metadata:
  name: growark-bigscreen-svc
spec:
  selector:
    app: growark-bigscreen
  ports:
  - port: 80
    targetPort: 3001
```

---

## 🧪 验证部署

### 1. 检查路由映射

```bash
# 检查手机端
curl -I https://xysrxgjnpycd.sealoshzh.site/admin
# 应该返回 200 OK

# 检查大屏端
curl -I https://xysrxgjnpycd.sealoshzh.site/display
# 应该返回 200 OK
```

### 2. 检查 HTML 内容

```bash
# 手机端应该包含 "课堂英雄" 标题
curl https://xysrxgjnpycd.sealoshzh.site/admin | grep "课堂英雄"

# 大屏端应该包含 "大屏" 相关内容
curl https://xysrxgjnpycd.sealoshzh.site/display | grep "星途成长方舟"
```

### 3. 功能验证

- [ ] 访问手机端，检查是否显示新功能（超能英雄、天才少年、学霸无敌）
- [ ] 访问大屏端，检查是否正常显示排行榜和数据
- [ ] 检查 API 连接是否正常（手机端应该能获取学生数据）
- [ ] 检查 WebSocket 连接是否正常（大屏端应该实时更新数据）

---

## 📝 构建产物清单

### mobile/dist 内容
```
mobile/dist/
├── index.html           # 主入口
├── assets/
│   ├── main-*.js       # 主应用代码（新功能）
│   ├── client-*.js     # 运行时代码
│   ├── bigscreen-*.js  # 大屏内嵌应用
│   └── *.css           # 样式文件
└── bigscreen/
    └── index.html      # 大屏内嵌应用入口（旧版，不使用）
```

### bigscreen/dist 内容
```
bigscreen/dist/
├── index.html           # 主入口
└── assets/
    ├── index-*.js      # 大屏应用代码
    └── *.css           # 样式文件
```

---

## 🔍 故障排查

### 问题 1: `/display` 仍然显示手机端内容

**原因**: 路由配置未正确生效

**解决**:
1. 检查 Ingress 规则是否正确配置
2. 检查 Nginx 配置中的 `alias` 路径是否正确
3. 清空浏览器缓存，重新加载页面

### 问题 2: 大屏端无法加载 API 数据

**原因**: API 请求未正确转发到后端

**解决**:
1. 检查 Nginx 配置中 `/api/` 路由规则
2. 确保后端 API 服务正常运行
3. 检查 CORS 配置

### 问题 3: 静态资源 404

**原因**: 构建产物路径错误

**解决**:
1. 检查 `html` 中的资源引用路径
2. 确认构建产物确实存在
3. 检查 Nginx 配置中的 `alias` 或 `root` 路径

---

## 📚 相关文件

- `nginx.conf` - Nginx 配置文件
- `Dockerfile.frontend.nginx` - Docker 构建文件
- `mobile/vite.config.ts` - 手机端构建配置
- `bigscreen/vite.config.ts` - 大屏端构建配置

---

## 🎯 下一步

1. **推送代码** (可选)
   ```bash
   git add .
   git commit -m "Fix: 重新构建前端，修复路由映射"
   git push origin master
   ```

2. **部署到 Sealos**
   - 按上述部署步骤操作
   - 验证路由映射正确

3. **功能验证**
   - 测试手机端新功能
   - 测试大屏端实时数据更新

---

**部署完成标志**:
- ✓ 手机端正常显示（/admin）
- ✓ 大屏端正常显示（/display）
- ✓ 数据实时同步（WebSocket 连接正常）
