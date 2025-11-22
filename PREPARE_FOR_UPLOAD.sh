#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                                   ║"
echo "║           准备文件上传到 Sealos - 文件导出脚本                   ║"
echo "║                                                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo

# 创建导出目录
EXPORT_DIR="/tmp/growark_deployment"
rm -rf $EXPORT_DIR
mkdir -p $EXPORT_DIR

echo "📁 创建导出目录: $EXPORT_DIR"
echo

# 复制大屏端
echo "📦 复制大屏端文件..."
cp -r bigscreen/dist $EXPORT_DIR/bigscreen_dist
ls -lhR $EXPORT_DIR/bigscreen_dist | head -10

echo
echo "📦 复制手机端文件..."
cp -r mobile/dist $EXPORT_DIR/mobile_dist
ls -lhR $EXPORT_DIR/mobile_dist | head -10

echo
echo "📝 创建部署说明..."
cat > $EXPORT_DIR/README.txt << 'README'
Growark 系统 - Sealos 部署文件

【文件说明】
• bigscreen_dist/    - 大屏端应用（176KB）
• mobile_dist/       - 手机端应用（560KB）

【部署步骤】

1️⃣ 部署大屏端
   • 访问: https://cloud.sealos.io
   • 应用管理 → 创建应用
   • 类型: 静态网站
   • 名称: bigscreen
   • 上传: bigscreen_dist 整个文件夹

2️⃣ 部署手机端
   • 应用管理 → 创建应用
   • 类型: 静态网站
   • 名称: mobile
   • 上传: mobile_dist 整个文件夹

3️⃣ 等待部署完成（2-3 分钟）

4️⃣ 测试系统
   • 访问分配的两个公网地址
   • 测试实时同步功能

【关键地址】
后端: https://xysrxgjnpycd.sealoshzh.site
API:  https://xysrxgjnpycd.sealoshzh.site/api
WebSocket: wss://xysrxgjnpycd.sealoshzh.site

【重要提示】
✓ 应用类型必须选择"静态网站"
✓ 上传完整的 dist 文件夹（包括 index.html 和 assets/）
✓ 部署后需要 1-2 分钟初始化，请耐心等待

README

cat $EXPORT_DIR/README.txt

echo
echo "✅ 文件准备完毕！"
echo
echo "📁 导出目录位置:"
echo "   $EXPORT_DIR"
echo
echo "📊 文件统计:"
echo "   大屏端大小: $(du -sh $EXPORT_DIR/bigscreen_dist | cut -f1)"
echo "   手机端大小: $(du -sh $EXPORT_DIR/mobile_dist | cut -f1)"
echo
echo "🔄 您现在可以:"
echo "   1. 从 Sealos Web UI 上传这两个文件夹"
echo "   2. 或打包下载后在本地上传"
echo
echo "💻 在 Sealos Web UI 中上传:"
echo "   • 打开: https://cloud.sealos.io"
echo "   • 创建应用 → 静态网站"
echo "   • 拖拽 bigscreen_dist 文件夹上传"
echo "   • 拖拽 mobile_dist 文件夹上传"
echo

