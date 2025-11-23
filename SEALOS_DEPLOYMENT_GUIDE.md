# Sealos 部署完整技术方案

## 📋 项目概述

- **项目名称**: Growark 班级管理系统
- **构成**:
  - Backend API (Node.js + Express) - 端口 3000
  - Admin 手机端 (React) - 前端应用
  - Display 大屏端 (React) - 前端应用
- **部署平台**: Sealos (公网云平台)
- **启动脚本**: entrypoint.sh

---

## 🔧 核心部署步骤

### 第一步：创建新的 Devbox

1. **在 Sealos 管理界面创建新 Devbox**
   - 登录 https://sealos.io
   - 进入 Devbox 管理界面
   - 点击"创建新的 Devbox"
   - 选择合适的配置（推荐：2 CPU, 4GB RAM 以上）

2. **获取访问信息**
   - Devbox 创建完成后，获取访问 URL
   - 通常格式为：`https://xxx.sealosXXX.site/api`
   - 将此信息记录备用

### 第二步：配置端口映射 (关键步骤)

在 Devbox 管理界面，需要配置以下端口映射：

#### ⚠️ 重要：0.0.0.0 配置

**问题现象**：
- 在 Devbox 管理界面"公网连接"显示"调试中"
- 访问映射的公网地址无法连接

**解决方案**：
- 检查应用是否使用 `localhost` 或 `127.0.0.1` 监听
- **必须修改为 `0.0.0.0` 监听所有网卡**
- 这样才能通过 Sealos 的公网网址访问

**Devbox 中的应用配置检查**：

```javascript
// ❌ 错误配置（仅本地监听）
app.listen(3000, 'localhost');
app.listen(3000, '127.0.0.1');

// ✅ 正确配置（监听所有网卡）
app.listen(3000, '0.0.0.0');
```

#### 端口映射配置示例

| 应用 | 内部端口 | 公网地址示例 | 监听地址 |
|------|---------|-----------|---------|
| API 后端 | 3000 | https://xxxxx.sealoshzh.site/api | 0.0.0.0:3000 |
| 手机端 | 5173 | https://yyyyy.sealosbia.site/admin | 0.0.0.0:5173 |
| 大屏端 | 5174 | https://zzzzz.sealosbja.site/display | 0.0.0.0:5174 |

**在 Devbox 管理界面配置**：
1. 打开 Devbox 设置
2. 找到"端口映射"或"公网连接"
3. 点击"新建公网访问"
4. 输入应用监听的端口（例如 3000）
5. **确认监听地址设置为 `0.0.0.0`**
6. Sealos 会自动生成公网 URL
7. 记录生成的公网地址

---

## 📥 第三步：从 GitHub 克隆代码

在 Devbox 中执行：

```bash
# 进入工作目录
cd /home/devbox

# 克隆仓库
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git project

# 进入项目目录
cd project
```

### 确认目录结构

```
/home/devbox/project/
├── entrypoint.sh          # 启动脚本（必须存在）
├── server.js              # 后端主文件
├── create-schema.js       # 数据库初始化
├── package.json           # Node.js 依赖
├── admin/                 # 手机端代码
│   └── package.json
└── display/               # 大屏端代码
    └── package.json
```

---

## ⚙️ 第四步：配置环境变量

### 后端环境变量配置

检查/编辑 `.env.production` 文件：

```bash
# .env.production
NODE_ENV=production

# API 地址（根据 Sealos 分配的 URL 修改）
VITE_API_BASE_URL=https://xxxxx.sealoshzh.site/api

# 手机端地址
VITE_ADMIN_URL=https://yyyyy.sealosbia.site

# 大屏端地址
VITE_DISPLAY_URL=https://zzzzz.sealosbja.site

# 数据库（如果使用外部数据库）
DATABASE_URL=your_database_url
```

### 前端环境变量配置

**admin 手机端** - `admin/.env.production`：

```
VITE_API_BASE_URL=https://xxxxx.sealoshzh.site/api
VITE_DISPLAY_URL=https://zzzzz.sealosbja.site/display
```

**display 大屏端** - `display/.env.production`：

```
VITE_API_BASE_URL=https://xxxxx.sealoshzh.site/api
VITE_ADMIN_URL=https://yyyyy.sealosbia.site/admin
```

---

## 🚀 第五步：通过 entrypoint.sh 启动应用

### 启动脚本验证

```bash
# 检查脚本是否存在
ls -la entrypoint.sh

# 如果没有，从备份或 git 历史恢复
git checkout entrypoint.sh
```

### entrypoint.sh 核心功能

脚本会自动：
1. ✅ 检查 node_modules（缺失时自动 npm install）
2. ✅ 初始化数据库（生产环境）
3. ✅ 启动应用并监听 `0.0.0.0:3000`

### 启动命令

```bash
# 开发环境启动
./entrypoint.sh development

# 生产环境启动（推荐 Sealos 中使用）
./entrypoint.sh production

# 后台运行（推荐）
nohup ./entrypoint.sh production > server.log 2>&1 &
```

### 验证应用启动

```bash
# 查看进程
ps aux | grep node

# 查看日志
tail -f server.log

# 测试本地连接
curl http://localhost:3000/api/students

# 查看端口监听
netstat -tuln | grep 3000
```

---

## 🌐 第六步：启动前端应用

### 手机端（Admin）

```bash
cd admin

# 安装依赖
npm install

# 构建生产版本
npm run build

# 启动预览服务（监听 0.0.0.0:5173）
npm run preview -- --host 0.0.0.0 --port 5173
```

### 大屏端（Display）

```bash
cd ../display

# 安装依赖
npm install

# 构建生产版本
npm run build

# 启动预览服务（监听 0.0.0.0:5174）
npm run preview -- --host 0.0.0.0 --port 5174
```

---

## 📡 第七步：验证部署

### 检查清单

- [ ] API 后端是否可以通过公网 URL 访问？
  ```bash
  curl https://xxxxx.sealoshzh.site/api/students
  ```

- [ ] 手机端是否可以加载？
  ```bash
  curl https://yyyyy.sealosbia.site/admin
  ```

- [ ] 大屏端是否可以加载？
  ```bash
  curl https://zzzzz.sealosbja.site/display
  ```

- [ ] 前端能否连接到后端 API？
  - 打开浏览器开发者工具 (F12)
  - 查看网络请求是否成功
  - 检查 API 响应状态

- [ ] WebSocket 连接是否正常？
  - 在浏览器控制台检查 ws 连接状态

---

## 🔄 第八步：代码更新流程

当修改代码后需要重新部署：

### 更新后端代码

```bash
# 拉取最新代码
git pull origin master

# 重启后端应用
# 如果是后台运行，先杀死旧进程
pkill -f "node server.js"

# 启动新版本
./entrypoint.sh production > server.log 2>&1 &
```

### 更新前端代码

#### 手机端（Admin）

```bash
# 拉取最新代码
git pull origin master

# 进入手机端目录
cd admin

# 重新构建
npm run build

# 重启前端服务
pkill -f "npm run preview"

# 启动新版本
npm run preview -- --host 0.0.0.0 --port 5173 &
```

#### 大屏端（Display）

```bash
# 拉取最新代码
git pull origin master

# 进入大屏端目录
cd display

# 重新构建
npm run build

# 重启前端服务
pkill -f "npm run preview"

# 启动新版本
npm run preview -- --host 0.0.0.0 --port 5174 &
```

---

## 🐛 故障排除

### 问题 1：公网连接显示"调试中"

**原因**：应用监听地址不是 `0.0.0.0`

**解决**：
1. 检查应用代码中的监听地址
2. 修改为 `0.0.0.0`
3. 重启应用

```javascript
// 后端 server.js
app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on 0.0.0.0:3000');
});
```

### 问题 2：前端无法连接后端 API

**原因**：环境变量配置错误或 CORS 问题

**解决步骤**：
1. 检查前端 `.env.production` 中的 `VITE_API_BASE_URL`
2. 确保 URL 与 Sealos 分配的公网地址一致
3. 检查后端是否配置了 CORS 允许跨域请求

```javascript
// 后端 CORS 配置
const cors = require('cors');
app.use(cors());
```

### 问题 3：数据库连接失败

**原因**：数据库 URL 配置错误或数据库未初始化

**解决**：
1. 检查 `.env.production` 中的数据库 URL
2. 运行数据库初始化脚本
3. 查看数据库日志

```bash
# 手动初始化数据库
node create-schema.js
```

### 问题 4：端口被占用

**原因**：旧进程未完全关闭

**解决**：
```bash
# 查看占用端口的进程
lsof -i :3000
lsof -i :5173
lsof -i :5174

# 杀死进程
kill -9 PID_NUMBER
```

---

## 📝 完整启动脚本示例

创建一个一键启动脚本 `deploy-all.sh`：

```bash
#!/bin/bash

echo "Starting Growark deployment..."

# 后端
echo "Starting backend..."
cd /home/devbox/project
./entrypoint.sh production > backend.log 2>&1 &
sleep 3

# 手机端
echo "Starting admin..."
cd /home/devbox/project/admin
npm run build
npm run preview -- --host 0.0.0.0 --port 5173 > admin.log 2>&1 &
sleep 3

# 大屏端
echo "Starting display..."
cd /home/devbox/project/display
npm run build
npm run preview -- --host 0.0.0.0 --port 5174 > display.log 2>&1 &

echo "All services started!"
echo "Backend: 0.0.0.0:3000"
echo "Admin: 0.0.0.0:5173"
echo "Display: 0.0.0.0:5174"

# 显示进程状态
ps aux | grep -E "node|npm" | grep -v grep
```

---

## ✅ 快速参考

### 三个关键文件检查清单

- [ ] **entrypoint.sh** - 后端启动脚本
  - 位置：`/home/devbox/project/entrypoint.sh`
  - 功能：自动检查依赖、初始化数据库、启动应用

- [ ] **.env.production** - 后端环境变量
  - 位置：`/home/devbox/project/.env.production`
  - 包含：数据库地址、API 端口等

- [ ] **前端 .env.production** - 前端环境变量
  - 位置：`admin/.env.production` 和 `display/.env.production`
  - 包含：API 地址、其他应用地址等

### 三个必须的监听地址

```
应用      监听地址         端口
---      --------        ----
后端      0.0.0.0         3000
手机端    0.0.0.0         5173
大屏端    0.0.0.0         5174
```

---

## 🎯 总结流程

1. **创建 Devbox** → 获得公网 URL
2. **配置端口映射** → 所有应用使用 `0.0.0.0` 监听
3. **克隆代码** → `git clone` 项目
4. **设置环境变量** → `.env.production` 文件配置
5. **启动后端** → `./entrypoint.sh production`
6. **启动前端** → 手机端和大屏端分别启动
7. **验证部署** → 测试所有 URL 是否正常访问
8. **后续更新** → `git pull` + 重启应用

---

## 📞 联系方式

如有问题，请：
1. 查看 Devbox 日志
2. 检查端口监听状态
3. 验证环境变量配置
4. 查看应用启动日志
