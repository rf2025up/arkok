# 🚀 Sealos 部署检查清单

## 📋 新建 Devbox 流程

### 第 1 步：在 Sealos 创建新 Devbox
- [ ] 登录 https://sealos.io
- [ ] 打开 Devbox 管理面板
- [ ] 创建新的 Devbox（推荐配置：2 CPU + 4GB RAM）
- [ ] 等待 Devbox 启动完成
- [ ] 获取 Devbox 访问 URL
- [ ] 记录 Devbox URL：`_______________________`

### 第 2 步：配置公网端口映射

在 Sealos Devbox 管理界面操作：

| 应用 | 端口 | 监听地址 | 公网 URL |
|------|------|---------|---------|
| 后端 API | 3000 | 0.0.0.0:3000 | |
| 手机端 | 5173 | 0.0.0.0:5173 | |
| 大屏端 | 5174 | 0.0.0.0:5174 | |

⚠️ **关键：必须选择 `0.0.0.0` 监听，不能用 localhost**

#### 配置步骤：
1. 打开 Devbox 管理界面
2. 点击"公网连接"或"端口映射"
3. 点击"新建公网访问"或"添加映射"
4. 输入端口号（如 3000）
5. **确认监听地址为 `0.0.0.0`**
6. Sealos 会自动生成公网 URL
7. 记录生成的公网地址到下表

#### 记录的公网地址：
```
API 后端: ________________________________
手机端 (Admin): ___________________________
大屏端 (Display): __________________________
```

### 第 3 步：克隆代码

在 Devbox 中执行：

```bash
# 进入工作目录
cd /home/devbox

# 克隆项目
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git project

# 进入项目
cd project

# 检查项目结构
ls -la
```

验证已有以下文件/目录：
- [ ] `entrypoint.sh` - 后端启动脚本
- [ ] `server.js` - 后端主文件
- [ ] `package.json` - 后端依赖
- [ ] `admin/` - 手机端代码
- [ ] `display/` - 大屏端代码
- [ ] `.env.production` - 环境变量

### 第 4 步：配置环境变量

#### 后端环境变量配置
文件：`.env.production`

```bash
# 编辑文件
nano .env.production

# 需要修改的内容：
NODE_ENV=production

# 根据 Sealos 分配的 URL 修改以下内容：
VITE_API_BASE_URL=https://[你的API地址]/api
VITE_ADMIN_URL=https://[你的手机端地址]/admin
VITE_DISPLAY_URL=https://[你的大屏端地址]/display
```

#### 手机端环境变量
文件：`admin/.env.production`

```bash
VITE_API_BASE_URL=https://[你的API地址]/api
```

#### 大屏端环境变量
文件：`display/.env.production`

```bash
VITE_API_BASE_URL=https://[你的API地址]/api
```

### 第 5 步：启动应用

#### 方案 A：使用快速启动脚本（推荐）

```bash
# 查看帮助
./QUICK_START.sh 帮助

# 启动所有服务
./QUICK_START.sh 全部

# 或者分别启动
./QUICK_START.sh 后端
./QUICK_START.sh 手机端
./QUICK_START.sh 大屏端
```

#### 方案 B：手动启动

**启动后端：**
```bash
cd /home/devbox/project
./entrypoint.sh production > backend.log 2>&1 &
```

**启动手机端：**
```bash
cd /home/devbox/project/admin
npm install
npm run build
npm run preview -- --host 0.0.0.0 --port 5173 &
```

**启动大屏端：**
```bash
cd /home/devbox/project/display
npm install
npm run build
npm run preview -- --host 0.0.0.0 --port 5174 &
```

### 第 6 步：验证部署

- [ ] 后端 API 可访问
  ```bash
  curl https://[你的API地址]/api/students
  ```

- [ ] 手机端可加载
  ```bash
  curl https://[你的手机端地址]/admin
  ```

- [ ] 大屏端可加载
  ```bash
  curl https://[你的大屏端地址]/display
  ```

- [ ] 打开浏览器测试各个 URL
  - [ ] https://[你的手机端地址]/admin
  - [ ] https://[你的大屏端地址]/display
  - [ ] 检查浏览器控制台是否有错误

### 第 7 步：监控和日志

**查看所有运行进程：**
```bash
ps aux | grep -E "node|npm" | grep -v grep
```

**查看后端日志：**
```bash
tail -f backend.log
```

**查看手机端日志：**
```bash
tail -f admin/admin.log
```

**查看大屏端日志：**
```bash
tail -f display/display.log
```

**检查端口监听状态：**
```bash
netstat -tuln | grep -E "3000|5173|5174"
```

---

## 🔄 代码更新流程

### 更新后端代码

```bash
# 进入项目目录
cd /home/devbox/project

# 拉取最新代码
git pull origin master

# 杀死旧进程
pkill -f "node server.js"

# 启动新版本
./entrypoint.sh production > backend.log 2>&1 &

# 查看日志
tail -f backend.log
```

### 更新手机端代码

```bash
# 进入项目目录
cd /home/devbox/project

# 拉取最新代码
git pull origin master

# 进入手机端目录
cd admin

# 重新构建
npm run build

# 杀死旧进程
pkill -f "npm run preview" | head -1

# 启动新版本
npm run preview -- --host 0.0.0.0 --port 5173 > admin.log 2>&1 &
```

### 更新大屏端代码

```bash
# 进入项目目录
cd /home/devbox/project

# 拉取最新代码
git pull origin master

# 进入大屏端目录
cd display

# 重新构建
npm run build

# 杀死旧进程
pkill -f "npm run preview" | tail -1

# 启动新版本
npm run preview -- --host 0.0.0.0 --port 5174 > display.log 2>&1 &
```

### 一键更新所有服务

```bash
./QUICK_START.sh 更新
```

---

## 🐛 常见问题排查

### 问题 1：公网连接显示"调试中"

**症状**：在 Sealos 管理面板中看到"调试中"提示

**原因**：应用监听地址不是 `0.0.0.0`

**解决**：
1. 检查应用代码监听地址
2. 修改为 `0.0.0.0`
3. 重启应用

```javascript
// 后端示例
app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on 0.0.0.0:3000');
});
```

### 问题 2：前端无法连接后端 API

**症状**：浏览器控制台显示网络错误

**排查步骤**：
1. 检查 `.env.production` 中的 API 地址是否正确
2. 确保 API 地址与 Sealos 分配的公网 URL 一致
3. 检查后端是否配置了 CORS
4. 查看浏览器 F12 -> Network 标签

**修复 CORS：**
```javascript
const cors = require('cors');
app.use(cors());
```

### 问题 3：端口被占用

**症状**：启动时显示"Address already in use"

**解决**：
```bash
# 查看占用端口的进程
lsof -i :3000
lsof -i :5173
lsof -i :5174

# 杀死进程
kill -9 PID_NUMBER

# 或使用快速启动脚本清理
./QUICK_START.sh 停止
```

### 问题 4：依赖安装失败

**症状**：npm install 失败

**解决**：
```bash
# 清除 npm 缓存
npm cache clean --force

# 重新安装
npm install

# 如果仍然失败，查看错误日志
npm install --verbose
```

### 问题 5：数据库连接错误

**症状**：后端启动但报数据库错误

**解决**：
1. 检查 `.env.production` 中的数据库 URL
2. 确保数据库服务正在运行
3. 运行数据库初始化脚本

```bash
node create-schema.js
```

---

## ✅ 最终检查清单

- [ ] Devbox 已创建并正常运行
- [ ] 端口映射已配置（所有应用使用 0.0.0.0）
- [ ] 代码已从 GitHub 克隆
- [ ] 环境变量已正确配置
- [ ] 后端已启动并监听 0.0.0.0:3000
- [ ] 手机端已启动并监听 0.0.0.0:5173
- [ ] 大屏端已启动并监听 0.0.0.0:5174
- [ ] 可通过公网 URL 访问所有应用
- [ ] 前端能连接到后端 API
- [ ] 没有浏览器控制台错误

---

## 📝 快速命令参考

```bash
# 检查配置
./CHECK_SEALOS_CONFIG.sh

# 启动所有服务
./QUICK_START.sh 全部

# 查看状态
./QUICK_START.sh 状态

# 停止所有服务
./QUICK_START.sh 停止

# 更新代码并重启
./QUICK_START.sh 更新

# 查看后端日志
tail -f backend.log

# 查看进程
ps aux | grep -E "node|npm" | grep -v grep

# 检查端口
netstat -tuln | grep -E "3000|5173|5174"
```

---

## 📞 需要帮助？

1. **查看技术方案**：`cat SEALOS_DEPLOYMENT_GUIDE.md`
2. **运行配置检查**：`./CHECK_SEALOS_CONFIG.sh`
3. **查看脚本帮助**：`./QUICK_START.sh 帮助`
4. **查看应用日志**：`tail -f *.log`

---

**最后更新**: 2024年11月23日
**版本**: 1.0
**适用于**: Growark 班级管理系统
