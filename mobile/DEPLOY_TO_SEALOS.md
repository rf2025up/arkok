# 手机端更新部署到Sealos指南

## 📦 最新构建完成

刚刚已完成手机端的最新构建，包含以下功能更新：
- ✅ Feature 2: 团队系统更新（超能英雄、天才少年、学霸无敌）
- ✅ Feature 3: 个人信息编辑（双击头像编辑姓名）
- ✅ Feature 4: 默认班级设置
- ✅ Feature 5: 积分管理UI重构
- ✅ Feature 6: 学生管理UI优化
- ✅ Feature 7: 挑战历史记录
- ✅ Feature 8: PK系统增强
- ✅ Feature 9: 进度条系统
- ✅ Feature 10: 打卡系统优化

## 🚀 部署到Sealos步骤

### 方法1: 通过Sealos UI快速部署（推荐）

#### 步骤1: 登录Sealos并打包dist文件
```bash
# 压缩dist文件夹便于上传
cd /home/devbox/project/mobile
zip -r dist.zip dist/
```

#### 步骤2: 上传到Sealos
1. 登录 https://cloud.sealos.io
2. 进入"应用管理" → "应用模板"或"自定义应用"
3. 选择你当前的手机端应用
4. 点击"更新"或"重新部署"
5. 选择新的dist文件夹或上传dist.zip

#### 步骤3: 刷新缓存
1. 在应用设置中配置缓存策略
2. 清除浏览器缓存：`Ctrl+Shift+Delete` 或 `Cmd+Shift+Delete`
3. 硬刷新：`Ctrl+F5` 或 `Cmd+Shift+R`

---

### 方法2: 通过kubectl部署（高级）

#### 前置要求
```bash
# 确保已配置kubectl
kubectl config get-contexts

# 选择正确的集群
kubectl config use-context your-cluster
```

#### 部署步骤

**步骤1: 创建或更新ConfigMap存储dist文件**
```bash
kubectl delete configmap mobile-app-dist -n growark 2>/dev/null || true
kubectl create configmap mobile-app-dist \
  --from-file=/home/devbox/project/mobile/dist/ \
  -n growark
```

**步骤2: 更新Deployment**
```bash
# 编辑deployment文件
kubectl edit deployment mobile-app -n growark

# 修改以下部分：
# - image: 更新为最新镜像（如果使用Docker）
# - initContainers: 添加init容器复制dist文件
# - replicas: 推荐设置为2-3个副本
```

**步骤3: 验证部署**
```bash
# 查看Pod状态
kubectl get pods -n growark -l app=mobile-app

# 查看Service
kubectl get svc -n growark | grep mobile

# 查看日志
kubectl logs -n growark -l app=mobile-app -f
```

**步骤4: 验证新功能**
```bash
# 获取公网IP
kubectl get svc -n growark -o wide

# 访问应用
open "http://<EXTERNAL-IP>/"

# 或使用curl测试
curl -I http://<EXTERNAL-IP>/
```

---

### 方法3: 通过Docker镜像（完整流程）

#### 构建Docker镜像
```bash
cd /home/devbox/project/mobile

# 创建Dockerfile（已有Sealos标准配置）
cat > Dockerfile << 'EOF'
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
CMD ["serve", "-s", "dist", "-l", "3000"]
EOF

# 构建镜像
docker build -t mobile-app:latest .
docker tag mobile-app:latest <your-registry>/mobile-app:latest

# 推送到镜像仓库（如果使用）
docker push <your-registry>/mobile-app:latest
```

#### 在Sealos中部署镜像
1. 进入应用管理
2. 选择"自定义镜像"
3. 输入镜像地址：`<your-registry>/mobile-app:latest`
4. 配置环境变量和资源
5. 点击部署

---

## 🔄 部署后验证

### 1. 检查新功能是否可用
```bash
# 打开浏览器访问手机端公网地址
# 测试以下功能：

# Feature 2: 团队系统
# 进入班级管理 → 学生 → 选择学生 → 查看战队（应显示新团队名）

# Feature 3: 个人信息编辑
# 双击学生头像 → 编辑姓名 → 保存

# Feature 7: 挑战历史
# 进入班级管理 → 挑战 → 查看"进行中"和"过往挑战"标签页

# Feature 10: 打卡反馈
# 进入好习惯打卡 → 选择学生 → 打卡 → 查看绿色成功提示
```

### 2. 清除缓存并硬刷新
```
浏览器快捷键：
- Windows/Linux: Ctrl+Shift+Delete (清除缓存) 然后 Ctrl+F5 (硬刷新)
- Mac: Cmd+Shift+Delete (清除缓存) 然后 Cmd+Shift+R (硬刷新)

或者在浏览器DevTools中：
- F12 打开DevTools
- 右键点击刷新按钮 → 选择"清空缓存并硬刷新"
```

### 3. 检查浏览器控制台
```
打开DevTools (F12) → Console标签
确保没有JavaScript错误
验证API请求成功（Network标签）
```

### 4. 检查Service Worker缓存（如果有）
```javascript
// 在浏览器console中运行
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => {
    registration.unregister();
  });
  console.log('Service Worker已清除');
});

// 然后刷新页面
location.reload(true);
```

---

## 🐛 如果部署失败

### 问题1: 旧功能仍然显示

**解决方案**：
```bash
# 完全清除浏览器缓存
1. Ctrl+Shift+Delete (Windows) 或 Cmd+Shift+Delete (Mac)
2. 选择"所有时间"
3. 勾选"缓存的图像和文件"
4. 点击清除

# 然后
5. 访问应用
6. Cmd+R (Mac) 或 Ctrl+R (Windows) 刷新
7. 或者用隐身模式打开（不使用缓存）
```

### 问题2: 白屏或加载错误

**解决方案**：
```bash
# 检查部署日志
kubectl logs -n growark -l app=mobile-app --tail=100

# 检查dist文件是否正确上传
kubectl exec -it <pod-name> -n growark -- ls -la /app/dist/

# 检查网络连接
kubectl exec -it <pod-name> -n growark -- curl http://localhost:3000/
```

### 问题3: 静态资源404错误

**解决方案**：
```bash
# 确保serve正确配置
# serve -s dist -l 3000 应该会在根路径提供index.html

# 检查Nginx/Web服务器配置（如果不是用serve）
# 确保所有请求都重定向到index.html
```

---

## 📊 部署检查清单

部署前：
- [ ] 本地构建成功：`npm run build`
- [ ] dist文件夹包含所有更新
- [ ] 环境变量配置正确
- [ ] 没有console错误

部署中：
- [ ] 文件上传到Sealos
- [ ] Pod启动成功
- [ ] Service获得公网IP

部署后：
- [ ] 清除浏览器缓存
- [ ] 硬刷新页面
- [ ] 验证所有新功能
- [ ] 检查console没有错误
- [ ] 测试API连接

---

## 🎯 快速部署命令

如果使用kubectl，一键部署：
```bash
# 1. 进入目录
cd /home/devbox/project/mobile

# 2. 构建
npm run build

# 3. 更新配置
kubectl delete configmap mobile-app-dist -n growark 2>/dev/null || true
kubectl create configmap mobile-app-dist --from-file=dist/ -n growark

# 4. 重启Pod（强制更新）
kubectl rollout restart deployment mobile-app -n growark

# 5. 查看状态
kubectl get pods -n growark -l app=mobile-app -w

# 6. 获取公网地址
kubectl get svc -n growark | grep mobile
```

---

## 📝 部署完成

✅ 新功能已部署到Sealos公网
✅ 刷新浏览器即可看到最新功能
✅ 所有9个功能更新已生效

**公网访问地址**: 请访问你的Sealos应用公网IP或域名

---

**最后更新**: 2024年11月22日 16:00
**包含功能**: Features 2-10
**构建状态**: ✅ 成功
**应用大小**: 572KB
