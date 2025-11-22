# Vite 配置修复 - allowedHosts

## 问题
在访问 `https://xysrxgjnpycd.sealoshzh.site` 时出现错误：
```
Blocked request. This host ("xysrxgjnpycd.sealoshzh.site") is not allowed.
To allow this host, add "xysrxgjnpycd.sealoshzh.site" to `server.allowedHosts` in vite.config.js.
```

## 原因
Vite 的安全机制默认只允许 `localhost` 访问，需要明确配置允许其他主机。

## 解决方案

### 手机端配置 (mobile/vite.config.ts)
```typescript
server: {
  port: 3000,
  host: '0.0.0.0',
  allowedHosts: ['xysrxgjnpycd.sealoshzh.site', 'localhost', '127.0.0.1'],
},
```

### 大屏端配置 (bigscreen/vite.config.ts)
```typescript
server: {
  port: 5173,
  strictPort: false,
  allowedHosts: ['xysrxgjnpycd.sealoshzh.site', 'localhost', '127.0.0.1'],
},
```

## 修改内容

✅ **mobile/vite.config.ts** - 添加 allowedHosts 配置
✅ **bigscreen/vite.config.ts** - 添加 allowedHosts 配置
✅ 已提交到 GitHub (Commit: 7391cce)

## 已允许的主机

- `xysrxgjnpycd.sealoshzh.site` - 公网域名
- `localhost` - 本地开发
- `127.0.0.1` - 本地回环地址

## 验证

修改后访问公网地址应该不再出现 "Blocked request" 错误。

## 相关文档

参考：https://vitejs.dev/config/server-options.html#server-allowedhosts
