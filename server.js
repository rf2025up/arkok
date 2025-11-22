#!/usr/bin/env node

/**
 * Growark Backend Server
 *
 * 功能：
 * 1. 提供前端静态文件（admin、display、student）
 * 2. 代理 API 请求到后端服务
 * 3. 处理 WebSocket 连接
 * 4. 学生数据管理
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { Pool } = require('pg');
require('dotenv').config();

// 初始化数据库连接
const pool = new Pool({
  connectionString: 'postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres'
});

// 初始化应用
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));

// 静态文件服务
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use('/index.css', express.static(path.join(__dirname, 'public/index.css')));
app.use('/bigscreen', express.static(path.join(__dirname, 'public/bigscreen')));

// ============= 前端路由映射 =============

/**
 * 大屏端 - 学生积分排行榜显示
 * 访问: https://xysrxgjnpycd.sealoshzh.site/display
 */
app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/display.html'));
});

/**
 * 大屏端 hash 路由支持
 */
app.get(/^\/display\//, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/display.html'));
});

/**
 * 教师端/管理端 - 手机端应用
 * 访问: https://xysrxgjnpycd.sealoshzh.site/admin
 */
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

/**
 * 教师端 hash 路由支持
 */
app.get(/^\/admin\//, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

/**
 * 学生端应用 (如果需要)
 * 访问: https://xysrxgjnpycd.sealoshzh.site/student
 */
app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/student.html'));
});

/**
 * 学生端 hash 路由支持
 */
app.get(/^\/student\//, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/student.html'));
});

// 根路由重定向到 admin
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// ============= API 路由 =============

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API 文档
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/api-docs.html'));
});

// 模拟学生数据 API
const mockStudents = [
  { id: 1, name: '张三', score: 850, total_exp: 1200, level: 5, class_name: '黄老师班', avatar_url: '' },
  { id: 2, name: '李四', score: 920, total_exp: 1500, level: 6, class_name: '黄老师班', avatar_url: '' },
  { id: 3, name: '王五', score: 780, total_exp: 1000, level: 4, class_name: '姜老师班', avatar_url: '' },
];

/**
 * 获取所有学生数据
 */
app.get('/api/students', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        score,
        total_exp,
        level,
        class_name,
        avatar_url
      FROM students
      ORDER BY score DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    // 如果数据库查询失败，返回 mock 数据作为备用
    res.json({
      success: true,
      data: mockStudents,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 获取单个学生数据
 */
app.get('/api/students/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, score, total_exp, level, class_name, avatar_url FROM students WHERE id = $1`,
      [parseInt(req.params.id)]
    );

    if (result.rows.length > 0) {
      res.json({
        success: true,
        data: result.rows[0],
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Student not found',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 调整学生分数
 */
app.post('/api/students/:id/adjust-score', async (req, res) => {
  try {
    const { delta } = req.body;
    const studentId = parseInt(req.params.id);

    // 获取当前分数
    const currentResult = await pool.query(
      `SELECT id, name, score, total_exp, level, class_name, avatar_url FROM students WHERE id = $1`,
      [studentId]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        timestamp: new Date().toISOString()
      });
    }

    const student = currentResult.rows[0];
    const newScore = (student.score || 0) + delta;

    // 更新分数
    const updateResult = await pool.query(
      `UPDATE students SET score = $1 WHERE id = $2 RETURNING id, name, score, total_exp, level, class_name, avatar_url`,
      [newScore, studentId]
    );

    res.json({
      success: true,
      data: updateResult.rows[0],
      message: `Score adjusted by ${delta}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adjusting score:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============= WebSocket 处理 =============

/**
 * WebSocket 实时数据推送
 * 用于大屏端实时显示更新
 */
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Growark server',
    timestamp: new Date().toISOString()
  }));

  // 定期推送学生数据更新
  const interval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'students_update',
      data: mockStudents,
      timestamp: new Date().toISOString()
    }));
  }, 2000);

  // 接收客户端消息
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('WebSocket message received:', data);

      // 广播给其他客户端
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'broadcast',
            data: data,
            timestamp: new Date().toISOString()
          }));
        }
      });
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  // 连接关闭
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clearInterval(interval);
  });

  // 错误处理
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// ============= 错误处理 =============

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// ============= 启动服务器 =============

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║         Growark Server Started Successfully          ║
╚══════════════════════════════════════════════════════╝

📍 Server Address: http://${HOST}:${PORT}

🔗 Frontend Endpoints:
   📱 Admin (手机端):   http://localhost:${PORT}/admin
   📺 Display (大屏端): http://localhost:${PORT}/display
   👤 Student (学生端): http://localhost:${PORT}/student

🔌 API Endpoints:
   📊 Students:        http://localhost:${PORT}/api/students
   🔗 WebSocket:       ws://localhost:${PORT}

📚 Documentation:
   📖 API Docs:        http://localhost:${PORT}/api-docs
   ❤️  Health Check:    http://localhost:${PORT}/health

Environment: ${process.env.NODE_ENV || 'development'}
Timestamp: ${new Date().toISOString()}

═══════════════════════════════════════════════════════
  `);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = server;
