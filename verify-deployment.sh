#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          部署前最终验证 - Sealos 公网部署                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo

# 验证大屏端
echo "📺 大屏端验证:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "bigscreen/dist/index.html" ]; then
    echo "✅ index.html 存在"
    SIZE=$(stat -f%z "bigscreen/dist/index.html" 2>/dev/null || stat -c%s "bigscreen/dist/index.html" 2>/dev/null)
    echo "   大小: $SIZE 字节"
else
    echo "❌ index.html 不存在"
    exit 1
fi

if [ -d "bigscreen/dist/assets" ]; then
    FILES=$(find bigscreen/dist/assets -type f | wc -l)
    echo "✅ assets 文件夹存在 ($FILES 个文件)"
else
    echo "❌ assets 文件夹不存在"
    exit 1
fi

if [ -f "bigscreen/.env.production" ]; then
    echo "✅ .env.production 存在"
    if grep -q "REACT_APP_WS_URL=wss://" bigscreen/.env.production; then
        echo "   ✓ 已配置 WSS"
    fi
    if grep -q "REACT_APP_API_URL=https://" bigscreen/.env.production; then
        echo "   ✓ 已配置 HTTPS API"
    fi
else
    echo "❌ .env.production 不存在"
    exit 1
fi

echo

# 验证手机端
echo "📱 手机端验证:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "mobile/dist/index.html" ]; then
    echo "✅ index.html 存在"
    SIZE=$(stat -f%z "mobile/dist/index.html" 2>/dev/null || stat -c%s "mobile/dist/index.html" 2>/dev/null)
    echo "   大小: $SIZE 字节"
else
    echo "❌ index.html 不存在"
    exit 1
fi

if [ -d "mobile/dist/assets" ]; then
    FILES=$(find mobile/dist/assets -type f | wc -l)
    echo "✅ assets 文件夹存在 ($FILES 个文件)"
else
    echo "❌ assets 文件夹不存在"
    exit 1
fi

if [ -f "mobile/.env.production" ]; then
    echo "✅ .env.production 存在"
    if grep -q "REACT_APP_API_URL=https://" mobile/.env.production; then
        echo "   ✓ 已配置 HTTPS API"
    fi
else
    echo "❌ .env.production 不存在"
    exit 1
fi

echo

# 验证文档
echo "📖 部署文档验证:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for file in DEPLOYMENT_READY.md SEALOS_DEPLOY_GUIDE.md deployment-status.sh; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file"
    fi
done

echo
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                验证完成 - 部署就绪！                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo

echo "✅ 所有文件已验证，可以开始部署"
echo
echo "部署方式："
echo "1. 访问 https://cloud.sealos.io"
echo "2. 上传 bigscreen/dist 为应用"
echo "3. 上传 mobile/dist 为应用"
echo "4. 记录分配的地址"
echo "5. 测试连接和同步功能"
echo
