/**
 * WebSocket 连接管理
 */

type Callback = (data: any) => void;

interface Subscribers {
  'student:created': Callback[];
  'student:updated': Callback[];
  'student:deleted': Callback[];
  'challenge:created': Callback[];
  'challenge:updated': Callback[];
  'pk:finished': Callback[];
  'task:completed': Callback[];
  'badge:awarded': Callback[];
}

let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

const subscribers: Subscribers = {
  'student:created': [],
  'student:updated': [],
  'student:deleted': [],
  'challenge:created': [],
  'challenge:updated': [],
  'pk:finished': [],
  'task:completed': [],
  'badge:awarded': []
};

/**
 * 连接 WebSocket
 */
export function connectWebSocket(wsUrl?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('✓ WebSocket 已连接');
      resolve();
      return;
    }

    const url = wsUrl || `ws://${window.location.hostname}:3000`;

    try {
      console.log(`🔗 连接 WebSocket: ${url}`);
      ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('✅ WebSocket 连接成功');
        reconnectAttempts = 0;
        resolve();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, payload } = message;

          console.log(`📨 收到消息: ${type}`);

          // 分发消息给订阅者
          if (type in subscribers) {
            const callbacks = subscribers[type as keyof Subscribers];
            callbacks.forEach((callback) => {
              try {
                callback(payload);
              } catch (err) {
                console.error('Callback error:', err);
              }
            });
          }
        } catch (err) {
          console.error('消息解析错误:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket 错误:', error);
        reject(error);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket 已断开');
        ws = null;
        attemptReconnect();
      };
    } catch (error) {
      console.error('连接错误:', error);
      reject(error);
    }
  });
}

/**
 * 重新连接
 */
function attemptReconnect() {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(`🔄 尝试重新连接... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    setTimeout(() => {
      connectWebSocket().catch(() => {}); // 忽略错误，自动重试
    }, RECONNECT_DELAY);
  } else {
    console.error('❌ WebSocket 重连失败，已达最大尝试次数');
  }
}

/**
 * 订阅事件
 */
export function subscribe(eventType: keyof Subscribers, callback: Callback) {
  if (eventType in subscribers) {
    subscribers[eventType].push(callback);
    console.log(`📍 订阅事件: ${eventType}`);
  }

  return () => {
    if (eventType in subscribers) {
      const index = subscribers[eventType].indexOf(callback);
      if (index >= 0) {
        subscribers[eventType].splice(index, 1);
        console.log(`🗑️ 取消订阅: ${eventType}`);
      }
    }
  };
}

/**
 * 断开连接
 */
export function disconnect() {
  if (ws) {
    ws.close();
    ws = null;
  }
}

/**
 * 获取连接状态
 */
export function isConnected(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}

/**
 * 获取连接状态文本
 */
export function getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
  if (ws === null) return 'disconnected';
  if (ws.readyState === WebSocket.OPEN) return 'connected';
  return 'connecting';
}
