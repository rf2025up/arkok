#!/bin/bash

# Growark 前端部署脚本 - 部署到 Sealos
# 本脚本用于将已构建的前端应用部署到 Sealos 平台

set -e

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# 1. 检查构建产物
log "=== 检查构建产物 ==="
if [ ! -d "mobile/dist" ]; then
    log "错误：mobile/dist 不存在，请先运行: cd mobile && npm run build"
    exit 1
fi

if [ ! -d "bigscreen/dist" ]; then
    log "错误：bigscreen/dist 不存在，请先运行: cd bigscreen && npm run build"
    exit 1
fi

log "✓ 构建产物检查完成"
log "  - mobile/dist 大小: $(du -sh mobile/dist | cut -f1)"
log "  - bigscreen/dist 大小: $(du -sh bigscreen/dist | cut -f1)"

# 2. 输出部署说明
log ""
log "=== 前端应用部署方案 ==="
log ""
log "✓ 手机端（新版本，含新功能）: mobile/dist"
log "✓ 大屏端: bigscreen/dist"
log ""
log "需要在 Sealos 中配置："
log "  1. 手机端 (/admin) → 使用 mobile/dist 内容"
log "  2. 大屏端 (/display) → 使用 bigscreen/dist 内容"
log ""
log "推荐方案：使用 Nginx 反向代理"
log "  - 根据路径 (/admin, /display) 路由到不同的 http-server"
log ""

log "=== 部署完成 ==="
