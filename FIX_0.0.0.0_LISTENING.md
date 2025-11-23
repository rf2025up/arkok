# 🔧 修复"调试中"问题 - 0.0.0.0 监听配置指南

## 问题现象

在 Sealos Devbox 管理面板中，公网连接显示 **"调试中"** 而不是正常的公网 URL。

```
❌ 错误状态：
┌─────────────────────────────────┐
│ 端口 3000  状态: 调试中         │
│ 状态: 连接中...                 │
└─────────────────────────────────┘

✅ 正确状态：
┌─────────────────────────────────┐
│ 端口 3000                       │
│ https://xxxxx.sealoshzh.site    │
└─────────────────────────────────┘
```

---

## 根本原因

应用没有在 **`0.0.0.0`** 上监听，而是在 **`localhost`** 或 **`127.0.0.1`** 上监听。

| 监听地址 | 可访问 | 在 Sealos 中能否通过公网访问 |
|---------|--------|------------------------------|
| `localhost:3000` | ✅ 本地访问 | ❌ **不能** |
| `127.0.0.1:3000` | ✅ 本地访问 | ❌ **不能** |
| `0.0.0.0:3000` | ✅ 所有网卡 | ✅ **能** |

---

## 解决方案

### 1️⃣ 后端应用修改

#### Node.js / Express 应用

**❌ 错误方式**：
```javascript
// server.js 或 app.js

// 错误 1：使用 localhost
app.listen(3000, 'localhost', () => {
  console.log('Server running on localhost:3000');
});

// 错误 2：使用 127.0.0.1
app.listen(3000, '127.0.0.1', () => {
  console.log('Server running on 127.0.0.1:3000');
});

// 错误 3：没有指定主机名（默认 localhost）
app.listen(3000, () => {
  console.log('Server running');
});

// 错误 4：使用变量但值不对
const host = 'localhost';
app.listen(3000, host, () => {
  console.log(`Server running on ${host}:3000`);
});
```

**✅ 正确方式**：
```javascript
// 方法 1：直接使用 0.0.0.0
app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on 0.0.0.0:3000');
});

// 方法 2：使用环境变量（推荐）
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 3000;

app.listen(port, host, () => {
  console.log(`Server running on ${host}:${port}`);
});

// 方法 3：在生产环境使用 0.0.0.0
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
app.listen(3000, host, () => {
  console.log(`Server running on ${host}:3000`);
});
```

#### 检查现有代码

```bash
# 搜索监听配置
grep -n "listen\|\.listen" server.js

# 搜索主机名配置
grep -n "localhost\|127.0.0.1" server.js
```

**修复步骤**：
1. 编辑 `server.js` 或启动文件
2. 查找 `app.listen()` 或 `server.listen()` 的调用
3. 将主机名改为 `'0.0.0.0'` 或 `process.env.HOST || '0.0.0.0'`
4. 保存文件
5. 重启应用

### 2️⃣ 前端应用修改

#### Vite 应用预览模式

**❌ 错误方式**：
```bash
# 默认监听 localhost
npm run preview

# 错误：指定了 localhost
npm run preview -- --host localhost --port 5173
```

**✅ 正确方式**：
```bash
# 正确：指定 0.0.0.0
npm run preview -- --host 0.0.0.0 --port 5173

# 或者编辑 vite.config.ts
```

#### 编辑 Vite 配置文件

**vite.config.ts** 或 **vite.config.js**：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // 开发环境
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    // 预览模式（生产环境测试）
    host: '0.0.0.0',
    port: 5173,
  },
})
```

#### 检查现有配置

```bash
# 查看 Vite 配置
cat vite.config.ts
cat vite.config.js

# 搜索 host 配置
grep -n "host:" vite.config.ts
grep -n "host:" vite.config.js
```

### 3️⃣ entrypoint.sh 脚本修改

如果使用启动脚本，确保脚本中配置了正确的监听地址。

**检查脚本**：
```bash
grep -n "listen\|0.0.0.0" entrypoint.sh
```

**修改脚本**：
```bash
# entrypoint.sh 中确保有：
app.listen(3000, '0.0.0.0')

# 或在启动命令中指定：
NODE_HOST=0.0.0.0 NODE_PORT=3000 node server.js
```

---

## 修复流程

### 步骤 1：检查当前配置

```bash
# 进入项目目录
cd /home/devbox/project

# 查看后端监听配置
grep -n "listen" server.js | head -5

# 查看前端配置
grep -n "host:" admin/vite.config.ts display/vite.config.ts
```

### 步骤 2：修改后端配置

```bash
# 编辑 server.js
nano server.js

# 查找类似这样的行：
# app.listen(3000, 'localhost')
# 改为：
# app.listen(3000, '0.0.0.0')

# 保存并退出 (Ctrl+X -> Y -> Enter)
```

### 步骤 3：重启后端

```bash
# 杀死旧进程
pkill -f "node server.js"

# 验证进程已停止
ps aux | grep node | grep -v grep

# 启动新版本
./entrypoint.sh production > backend.log 2>&1 &

# 查看日志
tail -f backend.log
```

### 步骤 4：重启前端

**手机端**：
```bash
cd /home/devbox/project/admin

# 杀死旧进程
pkill -f "npm run preview" | head -1

# 等待一秒
sleep 1

# 启动新版本
npm run preview -- --host 0.0.0.0 --port 5173 > admin.log 2>&1 &
```

**大屏端**：
```bash
cd /home/devbox/project/display

# 杀死旧进程
pkill -f "npm run preview" | tail -1

# 等待一秒
sleep 1

# 启动新版本
npm run preview -- --host 0.0.0.0 --port 5174 > display.log 2>&1 &
```

### 步骤 5：验证修复

```bash
# 检查进程是否正在运行
ps aux | grep -E "node|npm" | grep -v grep

# 检查端口监听
netstat -tuln | grep -E "3000|5173|5174"

# 应该看到类似这样的输出：
# tcp        0      0 0.0.0.0:3000            0.0.0.0:*               LISTEN
# tcp        0      0 0.0.0.0:5173            0.0.0.0:*               LISTEN
# tcp        0      0 0.0.0.0:5174            0.0.0.0:*               LISTEN
```

### 步骤 6：在 Sealos 中验证

1. 打开 Sealos Devbox 管理面板
2. 查看"公网连接"部分
3. 应该看到：
   ```
   ✅ 端口 3000
      https://xxxxx.sealoshzh.site
   ```
   而不是：
   ```
   ⏳ 端口 3000
      状态: 调试中...
   ```

---

## 常见场景修复

### 场景 1：使用 .env 环境变量

如果使用环境变量控制主机名：

```javascript
// ❌ 错误
const host = process.env.HOST || 'localhost';
app.listen(3000, host);

// ✅ 正确
const host = process.env.HOST || '0.0.0.0';
app.listen(3000, host);
```

### 场景 2：条件判断

```javascript
// ❌ 错误
if (process.env.NODE_ENV === 'production') {
  app.listen(3000, 'localhost');
} else {
  app.listen(3000, 'localhost');
}

// ✅ 正确
if (process.env.NODE_ENV === 'production') {
  app.listen(3000, '0.0.0.0');  // 生产环境
} else {
  app.listen(3000, 'localhost');  // 开发环境
}
```

### 场景 3：使用中间件或框架

```javascript
// Express
app.listen(3000, '0.0.0.0');

// Koa
app.listen(3000, '0.0.0.0');

// Fastify
fastify.listen({ port: 3000, host: '0.0.0.0' });

// Hapi
server.start({ host: '0.0.0.0', port: 3000 });
```

---

## 诊断命令

```bash
# 显示所有监听的端口
netstat -tuln

# 显示只监听 0.0.0.0 的端口
netstat -tuln | grep "0.0.0.0"

# 显示端口 3000 的详细信息
lsof -i :3000

# 显示 Node.js 进程
ps aux | grep node | grep -v grep

# 检查文件中的监听配置
grep -r "listen" . --include="*.js" --include="*.ts"

# 测试本地连接
curl http://localhost:3000
curl http://0.0.0.0:3000

# 测试远程 IP 连接（如果在 Devbox 中）
curl http://$(hostname -I | awk '{print $1}'):3000
```

---

## 检查清单

修复前：
- [ ] 查找了所有的 `.listen()` 调用
- [ ] 找到了使用 `localhost` 或 `127.0.0.1` 的地方
- [ ] 找到了 Vite 的主机配置

修复后：
- [ ] 修改了后端监听地址为 `0.0.0.0`
- [ ] 修改了前端预览命令包含 `--host 0.0.0.0`
- [ ] 重启了所有应用
- [ ] 验证了 `netstat` 显示 `0.0.0.0` 监听
- [ ] 在 Sealos 面板中看到了公网 URL（不再是"调试中"）
- [ ] 能通过公网 URL 访问应用

---

## 快速修复脚本

创建文件 `fix-listening.sh`：

```bash
#!/bin/bash

echo "修复监听地址..."

# 后端
echo "修改后端监听地址..."
sed -i "s/listen(3000, 'localhost'/listen(3000, '0.0.0.0'/g" server.js
sed -i "s/listen(3000, \"localhost\"/listen(3000, \"0.0.0.0\"/g" server.js
sed -i "s/listen(3000, '127.0.0.1'/listen(3000, '0.0.0.0'/g" server.js

# 前端配置
echo "修改前端配置..."
cd admin
if grep -q "host:" vite.config.ts; then
    sed -i "s/host: .*/host: '0.0.0.0',/" vite.config.ts
else
    # 添加主机配置
    sed -i "/port: 5173/a\    host: '0.0.0.0'," vite.config.ts
fi

cd ../display
if grep -q "host:" vite.config.ts; then
    sed -i "s/host: .*/host: '0.0.0.0',/" vite.config.ts
else
    sed -i "/port: 5174/a\    host: '0.0.0.0'," vite.config.ts
fi

echo "修复完成！"
echo "请重新启动应用..."
```

使用：
```bash
chmod +x fix-listening.sh
./fix-listening.sh
```

---

## 需要帮助？

如果修复后仍显示"调试中"：

1. 运行诊断命令
2. 查看应用日志
3. 检查防火墙设置
4. 咨询 Sealos 文档

```bash
# 查看诊断信息
./CHECK_SEALOS_CONFIG.sh
```

---

**最后更新**: 2024年11月23日
**版本**: 1.0
