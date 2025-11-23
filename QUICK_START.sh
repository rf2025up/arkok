#!/bin/bash

###############################################
# Growark 快速启动脚本
# 用途：在新 Devbox 中一键启动所有服务
# 用法：./QUICK_START.sh [后端|前端|全部]
###############################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 项目根目录
PROJECT_ROOT="/home/devbox/project"

# 确保在项目目录
cd "$PROJECT_ROOT" || exit 1

# 清理函数 - 用于启动前清理旧进程
cleanup_old_processes() {
    log_info "清理旧进程..."

    # 清理旧的 Node.js 进程
    pkill -f "node server.js" || true
    pkill -f "node create-schema.js" || true

    # 清理旧的 npm 前端进程
    pkill -f "npm run preview" || true

    sleep 2
    log_success "旧进程已清理"
}

# 启动后端
start_backend() {
    log_info "========== 启动后端 API =========="

    cleanup_old_processes

    # 检查 entrypoint.sh 是否存在
    if [ ! -f "$PROJECT_ROOT/entrypoint.sh" ]; then
        log_error "entrypoint.sh 不存在！请检查项目结构"
        return 1
    fi

    log_info "使用 entrypoint.sh 启动后端..."

    # 后台启动，输出日志到 backend.log
    cd "$PROJECT_ROOT"
    nohup ./entrypoint.sh production > backend.log 2>&1 &

    sleep 2

    # 验证启动
    if ps aux | grep -q "node server.js" | grep -v grep; then
        log_success "后端 API 已启动"
        log_info "监听地址：0.0.0.0:3000"
        log_info "日志文件：$PROJECT_ROOT/backend.log"
        log_info "查看日志：tail -f $PROJECT_ROOT/backend.log"
        return 0
    else
        log_error "后端启动失败，请查看日志"
        cat "$PROJECT_ROOT/backend.log"
        return 1
    fi
}

# 启动手机端
start_admin() {
    log_info "========== 启动手机端 (Admin) =========="

    if [ ! -d "$PROJECT_ROOT/admin" ]; then
        log_error "admin 目录不存在"
        return 1
    fi

    cd "$PROJECT_ROOT/admin"

    log_info "安装依赖..."
    npm install > /dev/null 2>&1 || true

    log_info "构建项目..."
    npm run build > /dev/null 2>&1

    log_info "启动预览服务..."
    nohup npm run preview -- --host 0.0.0.0 --port 5173 > admin.log 2>&1 &

    sleep 2

    log_success "手机端 (Admin) 已启动"
    log_info "监听地址：0.0.0.0:5173"
    log_info "日志文件：$PROJECT_ROOT/admin/admin.log"
}

# 启动大屏端
start_display() {
    log_info "========== 启动大屏端 (Display) =========="

    if [ ! -d "$PROJECT_ROOT/display" ]; then
        log_error "display 目录不存在"
        return 1
    fi

    cd "$PROJECT_ROOT/display"

    log_info "安装依赖..."
    npm install > /dev/null 2>&1 || true

    log_info "构建项目..."
    npm run build > /dev/null 2>&1

    log_info "启动预览服务..."
    nohup npm run preview -- --host 0.0.0.0 --port 5174 > display.log 2>&1 &

    sleep 2

    log_success "大屏端 (Display) 已启动"
    log_info "监听地址：0.0.0.0:5174"
    log_info "日志文件：$PROJECT_ROOT/display/display.log"
}

# 启动全部服务
start_all() {
    log_info "================================"
    log_info "开始启动所有服务..."
    log_info "================================"

    start_backend
    sleep 2

    start_admin
    sleep 2

    start_display
    sleep 2

    log_info ""
    log_success "================================"
    log_success "所有服务启动成功！"
    log_success "================================"

    echo ""
    log_info "📱 手机端 (Admin): http://localhost:5173 或 https://YOUR_ADMIN_URL"
    log_info "🖥️  大屏端 (Display): http://localhost:5174 或 https://YOUR_DISPLAY_URL"
    log_info "🔌 API 后端: http://localhost:3000 或 https://YOUR_API_URL"
    echo ""

    log_info "查看进程状态："
    ps aux | grep -E "node|npm" | grep -v grep
    echo ""

    log_info "查看日志："
    log_info "后端: tail -f $PROJECT_ROOT/backend.log"
    log_info "手机端: tail -f $PROJECT_ROOT/admin/admin.log"
    log_info "大屏端: tail -f $PROJECT_ROOT/display/display.log"
}

# 停止所有服务
stop_all() {
    log_info "停止所有服务..."
    cleanup_old_processes
    log_success "所有服务已停止"
}

# 查看状态
show_status() {
    log_info "================================"
    log_info "服务状态检查"
    log_info "================================"

    echo ""
    log_info "📊 运行中的进程："
    ps aux | grep -E "node|npm" | grep -v grep || log_warn "没有运行中的进程"

    echo ""
    log_info "🔌 端口监听状态："
    netstat -tuln 2>/dev/null | grep -E "3000|5173|5174" || netstat -tlnp 2>/dev/null | grep -E "3000|5173|5174" || log_warn "无法检查端口（需要 sudo）"

    echo ""
    log_info "📝 最近的日志："

    if [ -f "$PROJECT_ROOT/backend.log" ]; then
        echo -e "\n${BLUE}[后端日志 - 最后5行]${NC}"
        tail -5 "$PROJECT_ROOT/backend.log"
    fi

    if [ -f "$PROJECT_ROOT/admin/admin.log" ]; then
        echo -e "\n${BLUE}[手机端日志 - 最后5行]${NC}"
        tail -5 "$PROJECT_ROOT/admin/admin.log"
    fi

    if [ -f "$PROJECT_ROOT/display/display.log" ]; then
        echo -e "\n${BLUE}[大屏端日志 - 最后5行]${NC}"
        tail -5 "$PROJECT_ROOT/display/display.log"
    fi
}

# 更新代码并重新启动
update_and_restart() {
    log_info "================================"
    log_info "更新代码并重新启动"
    log_info "================================"

    log_info "拉取最新代码..."
    cd "$PROJECT_ROOT"
    git pull origin master || log_error "Git pull 失败"

    log_info "停止现有服务..."
    stop_all

    log_info "启动新版本..."
    start_all
}

# 帮助信息
show_help() {
    cat << EOF
${BLUE}Growark 快速启动脚本${NC}

用法: ./QUICK_START.sh [命令]

命令:
  全部            启动所有服务 (后端 + 手机端 + 大屏端)
  后端            仅启动后端 API
  前端            启动前端 (手机端和大屏端)
  手机端          仅启动手机端 (Admin)
  大屏端          仅启动大屏端 (Display)

  停止            停止所有服务
  状态            查看服务运行状态
  更新            更新代码并重新启动所有服务

  帮助            显示此帮助信息

示例:
  # 启动所有服务
  ./QUICK_START.sh 全部

  # 仅启动后端
  ./QUICK_START.sh 后端

  # 查看状态
  ./QUICK_START.sh 状态

  # 更新代码并重启
  ./QUICK_START.sh 更新

${YELLOW}重要提示:${NC}
1. 确保在 /home/devbox/project 目录运行此脚本
2. 确保所有应用都配置为 0.0.0.0 监听
3. 检查 .env.production 环境变量配置
4. 第一次运行可能需要一些时间下载依赖

EOF
}

# 主逻辑
main() {
    local command="${1:-全部}"

    case "$command" in
        全部)
            start_all
            ;;
        后端)
            start_backend
            ;;
        前端)
            log_info "启动前端服务..."
            start_admin
            sleep 2
            start_display
            ;;
        手机端)
            start_admin
            ;;
        大屏端)
            start_display
            ;;
        停止)
            stop_all
            ;;
        状态)
            show_status
            ;;
        更新)
            update_and_restart
            ;;
        帮助|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
