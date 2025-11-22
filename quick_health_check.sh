#!/bin/bash

echo ""
echo "🔍 Growark 系统快速检查"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_status() {
    local status=$1
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌ ($status)${NC}"
    fi
}

# 1. 后端服务
echo -n "后端服务状态: "
status=$(curl -s -o /dev/null -w "%{http_code}" https://xysrxgjnpycd.sealoshzh.site/health)
if [ "$status" = "200" ]; then
    echo -e "${GREEN}✅ 正常${NC}"
else
    echo -e "${RED}❌ 异常 ($status)${NC}"
fi

# 2. 数据库
echo -n "数据库连接: "
status=$(curl -s -o /dev/null -w "%{http_code}" https://xysrxgjnpycd.sealoshzh.site/api/students)
if [ "$status" = "200" ]; then
    total=$(curl -s https://xysrxgjnpycd.sealoshzh.site/api/students | grep -o '"total":[0-9]*' | cut -d: -f2)
    echo -e "${GREEN}✅ 正常 ($total 条记录)${NC}"
else
    echo -e "${RED}❌ 异常 ($status)${NC}"
fi

# 3. 大屏端
echo -n "大屏端应用: "
status=$(curl -s -o /dev/null -w "%{http_code}" https://xysrxgjnpycd.sealoshzh.site/display)
if [ "$status" = "200" ]; then
    echo -e "${GREEN}✅ 正常加载${NC}"
else
    echo -e "${RED}❌ 异常 ($status)${NC}"
fi

# 4. 教师端
echo -n "教师端应用: "
status=$(curl -s -o /dev/null -w "%{http_code}" https://xysrxgjnpycd.sealoshzh.site/admin)
if [ "$status" = "200" ]; then
    echo -e "${GREEN}✅ 正常加载${NC}"
else
    echo -e "${RED}❌ 异常 ($status)${NC}"
fi

echo ""
echo "======================================"
echo "✅ 检查完成"
echo ""
echo "📍 访问地址:"
echo "   🖥️  大屏: https://xysrxgjnpycd.sealoshzh.site/display"
echo "   👨‍🏫 教师: https://xysrxgjnpycd.sealoshzh.site/admin"
echo ""
