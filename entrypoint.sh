#!/bin/bash

# Growark 项目启动脚本
# 支持开发和生产环境
# 用法：./entrypoint.sh [development|production]

set -e

app_env=${1:-development}
build_target="server"

# 日志函数
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# 检查依赖
check_dependencies() {
    log "Checking dependencies..."
    if [ ! -d "node_modules" ]; then
        log "Installing npm dependencies..."
        npm install
    fi

    # 检查是否有新的依赖需要安装
    if [ "package.json" -nt "node_modules/.package-lock.json" ] 2>/dev/null; then
        log "Updating npm dependencies..."
        npm install
    fi
}

# 初始化数据库（仅生产环境）
init_database() {
    if [ "$app_env" = "production" ] || [ "$app_env" = "prod" ]; then
        if [ -f "create-schema.js" ]; then
            log "Initializing database schema..."
            timeout 30 node create-schema.js || log "Database already initialized"
        fi
    fi
}

# 开发环境启动
dev_commands() {
    log "Starting in DEVELOPMENT mode..."
    log "Server will listen on: http://localhost:3000"
    log "Admin dashboard: http://localhost:3000/admin"
    log "API docs: http://localhost:3000/api-docs"
    log "WebSocket: ws://localhost:3000"
    NODE_ENV=development node "${build_target}.js"
}

# 生产环境启动
prod_commands() {
    log "Starting in PRODUCTION mode..."
    log "Server will listen on: 0.0.0.0:3000"
    log "WebSocket: wss://xysrxgjnpycd.sealoshzh.site"
    NODE_ENV=production node "${build_target}.js"
}

# 主流程
main() {
    log "========================================"
    log "Growark Backend Startup"
    log "========================================"

    check_dependencies
    init_database

    case "$app_env" in
        production|prod)
            prod_commands
            ;;
        development|dev)
            dev_commands
            ;;
        *)
            log "Unknown environment: $app_env"
            log "Usage: $0 [development|production]"
            exit 1
            ;;
    esac
}

# 错误处理
trap 'log "Script interrupted"; exit 1' INT TERM

# 运行主程序
main
