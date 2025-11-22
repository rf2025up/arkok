#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        前端应用部署状态检查 - Sealos 公网部署              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo

# 检查构建状态
echo "📦 构建状态检查:"
echo

if [ -d "bigscreen/dist" ]; then
    BIGSCREEN_SIZE=$(du -sh bigscreen/dist | cut -f1)
    echo "✅ 大屏端已构建"
    echo "   路径: bigscreen/dist"
    echo "   大小: $BIGSCREEN_SIZE"
    if [ -f "bigscreen/dist/index.html" ]; then
        echo "   ✓ index.html 存在"
    fi
    if [ -d "bigscreen/dist/assets" ]; then
        echo "   ✓ assets 文件夹存在"
    fi
else
    echo "❌ 大屏端未构建"
fi

echo

if [ -d "mobile/dist" ]; then
    MOBILE_SIZE=$(du -sh mobile/dist | cut -f1)
    echo "✅ 手机端已构建"
    echo "   路径: mobile/dist"
    echo "   大小: $MOBILE_SIZE"
    if [ -f "mobile/dist/index.html" ]; then
        echo "   ✓ index.html 存在"
    fi
    if [ -d "mobile/dist/assets" ]; then
        echo "   ✓ assets 文件夹存在"
    fi
else
    echo "❌ 手机端未构建"
fi

echo
echo "⚙️  环境配置检查:"
echo

if [ -f "bigscreen/.env.production" ]; then
    echo "✅ 大屏端生产配置存在"
    echo "   配置内容:"
    sed 's/^/   /' bigscreen/.env.production
else
    echo "❌ 大屏端生产配置缺失"
fi

echo

if [ -f "mobile/.env.production" ]; then
    echo "✅ 手机端生产配置存在"
    echo "   配置内容:"
    sed 's/^/   /' mobile/.env.production
else
    echo "❌ 手机端生产配置缺失"
fi

echo
echo "🌐 后端连接配置:"
echo "   API 地址: https://xysrxgjnpycd.sealoshzh.site/api"
echo "   WebSocket: wss://xysrxgjnpycd.sealoshzh.site"
echo

echo "╔════════════════════════════════════════════════════════════╗"
echo "║              部署就绪状态                                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo

if [ -d "bigscreen/dist" ] && [ -d "mobile/dist" ] && \
   [ -f "bigscreen/.env.production" ] && [ -f "mobile/.env.production" ]; then
    echo "✅ 所有前端应用已准备就绪，可以部署到 Sealos"
    echo
    echo "下一步:"
    echo "1. 访问 https://cloud.sealos.io"
    echo "2. 创建应用 > 静态网站"
    echo "3. 上传 bigscreen/dist 文件夹"
    echo "4. 记录分配的地址"
    echo "5. 重复步骤 2-4 用于 mobile/dist"
    echo
    echo "📖 详细部署指南: SEALOS_DEPLOY_GUIDE.md"
else
    echo "❌ 某些构建文件或配置缺失，无法部署"
    echo "   请运行: bash build-frontend.sh"
fi

echo
