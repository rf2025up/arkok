#!/bin/bash

###############################################
# Sealos 配置检查脚本
# 用途：检查部署配置是否正确
# 用法：./CHECK_SEALOS_CONFIG.sh
###############################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 检查结果计数
PASS=0
FAIL=0
WARN=0

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

log_pass() {
    echo -e "${GREEN}✓${NC}  $1"
    ((PASS++))
}

log_fail() {
    echo -e "${RED}✗${NC}  $1"
    ((FAIL++))
}

log_warn() {
    echo -e "${YELLOW}⚠${NC}  $1"
    ((WARN++))
}

log_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

PROJECT_ROOT="/home/devbox/project"
cd "$PROJECT_ROOT"

# ============================================
# 1. 检查项目结构
# ============================================
log_section "1️⃣  项目结构检查"

# 检查关键文件
check_file() {
    local file=$1
    local description=$2

    if [ -f "$file" ]; then
        log_pass "$description 存在: $file"
    else
        log_fail "$description 不存在: $file"
    fi
}

check_dir() {
    local dir=$1
    local description=$2

    if [ -d "$dir" ]; then
        log_pass "$description 存在: $dir"
    else
        log_fail "$description 不存在: $dir"
    fi
}

check_file "$PROJECT_ROOT/entrypoint.sh" "启动脚本"
check_file "$PROJECT_ROOT/server.js" "后端主文件"
check_file "$PROJECT_ROOT/package.json" "后端 package.json"
check_file "$PROJECT_ROOT/.env.production" "后端环境变量"

check_dir "$PROJECT_ROOT/admin" "手机端目录"
check_dir "$PROJECT_ROOT/display" "大屏端目录"

if [ -d "$PROJECT_ROOT/admin" ]; then
    check_file "$PROJECT_ROOT/admin/package.json" "手机端 package.json"
    check_file "$PROJECT_ROOT/admin/.env.production" "手机端环境变量"
fi

if [ -d "$PROJECT_ROOT/display" ]; then
    check_file "$PROJECT_ROOT/display/package.json" "大屏端 package.json"
    check_file "$PROJECT_ROOT/display/.env.production" "大屏端环境变量"
fi

# ============================================
# 2. 检查监听地址配置
# ============================================
log_section "2️⃣  监听地址配置检查"

# 检查后端监听地址
log_info "检查后端监听地址..."
if grep -q "0\.0\.0\.0" "$PROJECT_ROOT/server.js" 2>/dev/null; then
    log_pass "后端配置了 0.0.0.0 监听"
elif grep -q "listen\|app\.listen" "$PROJECT_ROOT/server.js" 2>/dev/null; then
    log_warn "后端监听配置存在，请确认是 0.0.0.0"
    grep -n "listen" "$PROJECT_ROOT/server.js" | head -3
else
    log_warn "无法确定后端监听地址配置"
fi

# 检查前端 vite.config 或 package.json
log_info "检查前端预览服务配置..."
if [ -f "$PROJECT_ROOT/admin/vite.config.ts" ] || [ -f "$PROJECT_ROOT/admin/vite.config.js" ]; then
    log_pass "手机端 vite.config 存在"
else
    log_warn "手机端 vite.config 不存在，使用默认配置时请确认命令中有 --host 0.0.0.0"
fi

if [ -f "$PROJECT_ROOT/display/vite.config.ts" ] || [ -f "$PROJECT_ROOT/display/vite.config.js" ]; then
    log_pass "大屏端 vite.config 存在"
else
    log_warn "大屏端 vite.config 不存在，使用默认配置时请确认命令中有 --host 0.0.0.0"
fi

# ============================================
# 3. 检查环境变量
# ============================================
log_section "3️⃣  环境变量检查"

# 后端环境变量
log_info "后端环境变量 (.env.production):"
if [ -f "$PROJECT_ROOT/.env.production" ]; then
    while IFS= read -r line; do
        if [[ ! -z "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
            echo -e "  ${CYAN}$line${NC}"
        fi
    done < "$PROJECT_ROOT/.env.production"
    log_pass "后端环境变量文件存在"
else
    log_fail "后端环境变量文件不存在"
fi

# 手机端环境变量
log_info "手机端环境变量 (admin/.env.production):"
if [ -f "$PROJECT_ROOT/admin/.env.production" ]; then
    while IFS= read -r line; do
        if [[ ! -z "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
            echo -e "  ${CYAN}$line${NC}"
        fi
    done < "$PROJECT_ROOT/admin/.env.production"
    log_pass "手机端环境变量文件存在"
else
    log_warn "手机端环境变量文件可能不存在或为空"
fi

# 大屏端环境变量
log_info "大屏端环境变量 (display/.env.production):"
if [ -f "$PROJECT_ROOT/display/.env.production" ]; then
    while IFS= read -r line; do
        if [[ ! -z "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
            echo -e "  ${CYAN}$line${NC}"
        fi
    done < "$PROJECT_ROOT/display/.env.production"
    log_pass "大屏端环境变量文件存在"
else
    log_warn "大屏端环境变量文件可能不存在或为空"
fi

# ============================================
# 4. 检查 Node.js 和 npm
# ============================================
log_section "4️⃣  运行环境检查"

# 检查 Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_pass "Node.js 已安装: $NODE_VERSION"
else
    log_fail "Node.js 未安装"
fi

# 检查 npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log_pass "npm 已安装: $NPM_VERSION"
else
    log_fail "npm 未安装"
fi

# 检查依赖
log_info "检查依赖安装状态..."
if [ -d "$PROJECT_ROOT/node_modules" ]; then
    log_pass "后端依赖已安装"
else
    log_warn "后端依赖未安装，运行时会自动安装"
fi

if [ -d "$PROJECT_ROOT/admin/node_modules" ]; then
    log_pass "手机端依赖已安装"
else
    log_warn "手机端依赖未安装，运行时会自动安装"
fi

if [ -d "$PROJECT_ROOT/display/node_modules" ]; then
    log_pass "大屏端依赖已安装"
else
    log_warn "大屏端依赖未安装，运行时会自动安装"
fi

# ============================================
# 5. 检查端口占用
# ============================================
log_section "5️⃣  端口占用检查"

check_port() {
    local port=$1
    local service=$2

    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        log_warn "$service 端口 $port 已被占用"
    else
        log_pass "$service 端口 $port 可用"
    fi
}

check_port 3000 "API 后端"
check_port 5173 "手机端"
check_port 5174 "大屏端"

# ============================================
# 6. 检查 Git 配置
# ============================================
log_section "6️⃣  Git 仓库检查"

if [ -d "$PROJECT_ROOT/.git" ]; then
    log_pass "Git 仓库存在"

    cd "$PROJECT_ROOT"
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
    log_info "当前分支: $CURRENT_BRANCH"

    LAST_COMMIT=$(git log -1 --oneline 2>/dev/null)
    log_info "最后提交: $LAST_COMMIT"

    if git status --porcelain | grep -q .; then
        log_warn "有未提交的更改"
        git status --short
    else
        log_pass "工作目录干净"
    fi
else
    log_fail "不是 Git 仓库"
fi

# ============================================
# 7. Sealos 配置建议
# ============================================
log_section "7️⃣  Sealos 配置建议"

echo -e "${CYAN}在 Sealos 管理面板中需要配置以下内容：${NC}"
echo ""

echo -e "${YELLOW}📌 后端 API 映射：${NC}"
echo "   端口: 3000"
echo "   监听地址: 0.0.0.0:3000"
echo "   公网 URL 格式: https://xxxxx.sealoshzh.site/api"
echo ""

echo -e "${YELLOW}📌 手机端 (Admin) 映射：${NC}"
echo "   端口: 5173"
echo "   监听地址: 0.0.0.0:5173"
echo "   公网 URL 格式: https://yyyyy.sealosbia.site/admin"
echo ""

echo -e "${YELLOW}📌 大屏端 (Display) 映射：${NC}"
echo "   端口: 5174"
echo "   监听地址: 0.0.0.0:5174"
echo "   公网 URL 格式: https://zzzzz.sealosbja.site/display"
echo ""

echo -e "${MAGENTA}⚠️  关键点：${NC}"
echo "   1. 所有应用必须使用 ${CYAN}0.0.0.0${NC} 监听"
echo "   2. 不能使用 localhost 或 127.0.0.1"
echo "   3. 如果显示'调试中'，检查是否用了错误的监听地址"
echo ""

# ============================================
# 8. 总结
# ============================================
log_section "📊 检查总结"

TOTAL=$((PASS + FAIL + WARN))
echo ""
echo -e "  ${GREEN}✓ 通过${NC}: $PASS"
echo -e "  ${RED}✗ 失败${NC}: $FAIL"
echo -e "  ${YELLOW}⚠ 警告${NC}: $WARN"
echo -e "  ${CYAN}总计${NC}: $TOTAL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ 所有关键检查已通过！${NC}"
    if [ $WARN -eq 0 ]; then
        echo -e "${GREEN}✓ 没有任何警告！${NC}"
    else
        echo -e "${YELLOW}⚠ 但有 $WARN 个警告需要注意${NC}"
    fi
else
    echo -e "${RED}✗ 有 $FAIL 个关键问题需要修复${NC}"
fi

echo ""
echo -e "${CYAN}下一步建议：${NC}"
echo "  1. 运行: chmod +x ./QUICK_START.sh"
echo "  2. 运行: ./QUICK_START.sh 全部"
echo "  3. 在 Sealos 管理面板配置端口映射"
echo "  4. 验证公网 URL 可访问性"
echo ""
