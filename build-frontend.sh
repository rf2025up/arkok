#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          前端应用构建 - 生产版本                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo

# 构建大屏端
echo "📺 构建大屏端 (BigScreen)..."
cd bigscreen
npm install
npm run build
if [ $? -eq 0 ]; then
    echo "✅ 大屏端构建成功"
    echo "   输出目录: bigscreen/dist"
else
    echo "❌ 大屏端构建失败"
    exit 1
fi
cd ..
echo

# 构建手机端
echo "📱 构建手机端 (Mobile)..."
cd mobile
npm install
npm run build
if [ $? -eq 0 ]; then
    echo "✅ 手机端构建成功"
    echo "   输出目录: mobile/dist"
else
    echo "❌ 手机端构建失败"
    exit 1
fi
cd ..
echo

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  构建完成！                                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo
echo "✅ 大屏端输出: $(pwd)/bigscreen/dist"
echo "✅ 手机端输出: $(pwd)/mobile/dist"
echo
echo "下一步: 将这两个 dist 文件夹上传到 Sealos"
echo
