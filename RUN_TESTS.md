# 快速测试指南

## 一键启动命令

### 方式1: 后台启动所有服务（推荐）

```bash
# 终端1 - 启动后端（保持开启）
cd /home/devbox/project && node server.js

# 终端2 - 启动大屏端
cd /home/devbox/project/bigscreen && npm run dev

# 终端3 - 启动手机端
cd /home/devbox/project/mobile && npm run dev
```

等待所有服务启动完成（约30秒）。

### 方式2: Docker Compose（适合未来容器化）

```bash
docker-compose -f docker-compose.yml up
```

## 快速验证清单

### ✅ 后端服务验证
```bash
# 检查API是否响应
curl http://localhost:3000/api/students

# 检查WebSocket是否可访问（在浏览器中打开）
http://localhost:3000/health
```

**预期输出**：
```json
{"status":"OK"}
```

### ✅ 大屏端验证
打开浏览器访问：`http://localhost:5173`

**检查项**：
- [ ] 页面加载成功
- [ ] 页面标题显示"星途成长方舟"
- [ ] 右上角显示连接状态（应为绿色"已连接"）
- [ ] 学生排行榜显示数据

### ✅ 手机端验证
打开浏览器访问：`http://localhost:5174`

**检查项**：
- [ ] 页面加载成功
- [ ] 学生列表显示
- [ ] 可以操作（创建、编辑、删除）

## 测试用例

### 测试1: 实时学生创建
**步骤**：
1. 打开手机端 → 学生管理
2. 创建新学生：
   ```
   名称: 测试学生
   班级: 3班
   ```
3. 点击"创建"按钮
4. 立即切换到大屏端
5. 在排行榜中搜索"测试学生"

**预期结果**：新学生在1秒内出现在大屏排行榜

**验证命令**：
```bash
curl http://localhost:3000/api/students | grep "测试学生"
```

### 测试2: 实时积分更新
**步骤**：
1. 打开手机端 → 学生列表
2. 选择任意学生 → 调整分数 +100
3. 点击"提交"
4. 立即切换到大屏端
5. 观察该学生的排名变化

**预期结果**：积分立即更新，排名实时改变

**后端日志验证**：
```
📨 收到消息: student:updated
✓ 广播事件: student:updated
```

### 测试3: 连接状态监控
**步骤**：
1. 打开大屏端，观察右上角连接状态
2. 在后端终端按 `Ctrl+C` 关闭服务器
3. 观察大屏端右上角状态变化
4. 等待3秒
5. 重新启动后端：`node server.js`
6. 观察大屏端自动重连

**预期结果**：
- 关闭后端 → 状态变红"离线"
- 重启后端 → 状态变黄闪烁"连接中..."
- 连接建立 → 状态变绿"已连接"

### 测试4: 批量操作
**步骤**：
1. 打开手机端
2. 快速创建5个学生（连续提交）
3. 同时切换到大屏端观察
4. 快速调整多个学生的分数

**预期结果**：所有操作实时同步，无延迟或遗漏

## 压力测试

### 高并发学生创建
```bash
# 创建脚本：stress-test.sh
#!/bin/bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/students \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"压力测试学生$i\",\"score\":0}" &
done
wait
```

运行：
```bash
bash stress-test.sh
```

**预期**：所有请求成功，大屏端实时显示所有新学生

## 调试技巧

### 1. 查看后端WebSocket连接状态
```bash
# 在后端日志中搜索连接信息
grep "WebSocket" server.js
```

### 2. 大屏端浏览器控制台
```javascript
// 打开浏览器 F12 → Console，执行：
// 检查WebSocket连接
console.log(window.wsStatus) // 应显示 'connected'

// 手动触发订阅测试
window.testSubscribe?.();
```

### 3. 检查网络流量
```bash
# 查看WebSocket通信
netstat -an | grep 3000

# 监控数据库连接
psql -c "SELECT * FROM pg_stat_activity;"
```

### 4. 查看数据库数据
```bash
# 连接数据库
psql -c "SELECT * FROM students LIMIT 5;"
```

## 常见问题排查

### Q: "无法连接到WebSocket"
```bash
# 检查后端是否运行
ps aux | grep node

# 检查端口是否开放
netstat -tln | grep 3000

# 查看防火墙设置
sudo ufw allow 3000/tcp
```

### Q: "大屏端不更新"
```bash
# 清除浏览器缓存并刷新
# 打开F12检查：
# 1. Network → WS 标签页 → 查看连接状态
# 2. Console → 查看错误信息
# 3. Application → Local Storage → 查看缓存数据
```

### Q: "手机端API请求失败"
```bash
# 检查API_BASE_URL配置
cd /home/devbox/project/mobile
grep -r "REACT_APP_API_URL" .

# 测试API连接
curl -v http://localhost:3000/api/students
```

### Q: "数据库连接错误"
```bash
# 验证数据库连接字符串
grep connectionString /home/devbox/project/server.js

# 测试数据库连接
psql postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres -c "SELECT 1"
```

## 性能基准

### 预期性能指标
- **实时同步延迟**：< 100ms
- **WebSocket消息处理**：< 50ms
- **API响应时间**：< 200ms
- **页面渲染**：< 1000ms
- **并发连接数**：最少支持100+

### 监控命令
```bash
# 检查后端内存占用
ps aux | grep node | grep server.js

# 监控实时连接数
watch -n 1 'netstat -an | grep -c :3000'

# 查看数据库性能
psql -c "SELECT * FROM pg_stat_statements LIMIT 10;"
```

## 清理和重置

### 重置所有数据
```bash
# 删除所有表数据（保留结构）
cd /home/devbox/project
node -e "
const { pool } = require('./server.js');
const tables = ['score_history', 'student_badges', 'habit_checkins',
                'task_assignments', 'challenge_participants', 'tasks',
                'challenges', 'students', 'pk_matches', 'badges', 'habits', 'groups', 'teams'];
tables.forEach(t => pool.query(\`TRUNCATE \${t} RESTART IDENTITY CASCADE\`));
"

# 重新初始化数据库
node create-schema.js
```

### 清理日志
```bash
# 清空后端日志（如果有）
truncate -s 0 /home/devbox/project/logs/server.log
```

## 验收标准

项目部署成功需满足：

- [x] 后端服务正常启动，WebSocket可连接
- [x] 大屏端成功连接WebSocket，显示"已连接"
- [x] 手机端可访问，API可调用
- [x] 创建学生后1秒内出现在大屏
- [x] 调整积分后立即更新大屏排行榜
- [x] 网络中断后自动重连，恢复连接后无需刷新
- [x] 连接状态指示器准确反映连接状态

## 下一步操作

部署完成后建议：

1. **生产部署**：
   - 使用 PM2 管理后端进程
   - 配置 Nginx 反向代理
   - 启用 SSL/TLS 加密

2. **监控告警**：
   - 集成 Prometheus 监控
   - 配置 ELK 日志系统
   - 设置告警规则

3. **性能优化**：
   - 启用 Redis 缓存
   - 实现数据库连接池优化
   - 添加 CDN 加速

4. **安全加固**：
   - 添加请求签名验证
   - 实现速率限制
   - 部署 DDoS 防护

---

快速开始：只需3个命令，3个终端窗口，等待30秒！✨
