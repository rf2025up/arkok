#!/bin/bash

# 前端环境配置脚本

PUBLIC_URL="https://xysrxgjnpycd.sealoshzh.site"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          前端环境配置 - 自动生成脚本                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo

echo "📝 配置信息:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "公网地址: $PUBLIC_URL"
echo "API URL: $PUBLIC_URL/api"
echo "WebSocket: wss://xysrxgjnpycd.sealoshzh.site"
echo

# 配置大屏端
echo "📱 配置大屏端 (BigScreen)..."
mkdir -p bigscreen
cat > bigscreen/.env.production << EOF
# 大屏端生产环境配置
REACT_APP_API_URL=$PUBLIC_URL/api
REACT_APP_WS_URL=wss://xysrxgjnpycd.sealoshzh.site
VITE_API_URL=$PUBLIC_URL/api
VITE_WS_URL=wss://xysrxgjnpycd.sealoshzh.site
EOF

echo "✅ 大屏端配置已生成: bigscreen/.env.production"
echo "   内容:"
cat bigscreen/.env.production | sed 's/^/      /'
echo

# 配置手机端
echo "📱 配置手机端 (Mobile)..."
mkdir -p mobile
cat > mobile/.env.production << EOF
# 手机端生产环境配置
REACT_APP_API_URL=$PUBLIC_URL/api
VITE_API_URL=$PUBLIC_URL/api
EOF

echo "✅ 手机端配置已生成: mobile/.env.production"
echo "   内容:"
cat mobile/.env.production | sed 's/^/      /'
echo

# 创建本地开发配置
echo "🔨 创建本地开发配置..."

cat > bigscreen/.env.development << EOF
# 大屏端开发环境配置
REACT_APP_API_URL=http://devbox-2.ns-ll4yxeb3:3000/api
REACT_APP_WS_URL=ws://devbox-2.ns-ll4yxeb3:3000
VITE_API_URL=http://devbox-2.ns-ll4yxeb3:3000/api
VITE_WS_URL=ws://devbox-2.ns-ll4yxeb3:3000
EOF

cat > mobile/.env.development << EOF
# 手机端开发环境配置
REACT_APP_API_URL=http://devbox-2.ns-ll4yxeb3:3000/api
VITE_API_URL=http://devbox-2.ns-ll4yxeb3:3000/api
EOF

echo "✅ 开发环境配置已生成"
echo "   - bigscreen/.env.development"
echo "   - mobile/.env.development"
echo

# 生成构建脚本
echo "🔨 生成前端构建脚本..."

cat > build-frontend.sh << 'SCRIPT_EOF'
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
SCRIPT_EOF

chmod +x build-frontend.sh
echo "✅ 构建脚本已生成: build-frontend.sh"
echo

# 生成部署脚本
echo "📦 生成前端部署脚本..."

cat > deploy-frontend.sh << 'SCRIPT_EOF'
#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          前端应用部署 - 到 Sealos                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo

echo "部署步骤:"
echo
echo "1️⃣  大屏端部署"
echo "   步骤1: 打开 https://cloud.sealos.io"
echo "   步骤2: 应用管理 → 创建应用"
echo "   步骤3: 选择 '静态网站' 或 'Docker'"
echo "   步骤4: 上传 bigscreen/dist 文件夹"
echo "   步骤5: 记录分配的地址"
echo
echo "2️⃣  手机端部署"
echo "   步骤1: 同上"
echo "   步骤2: 上传 mobile/dist 文件夹"
echo "   步骤3: 记录分配的地址"
echo
echo "3️⃣  测试"
echo "   步骤1: 打开大屏端地址"
echo "   步骤2: 打开手机端地址"
echo "   步骤3: 手机端创建学生"
echo "   步骤4: 大屏端应实时显示"
echo

SCRIPT_EOF

chmod +x deploy-frontend.sh
echo "✅ 部署脚本已生成: deploy-frontend.sh"
echo

# 总结
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  配置完成总结                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo
echo "✅ 生成的文件:"
echo "   📄 bigscreen/.env.production (生产环境)"
echo "   📄 bigscreen/.env.development (开发环境)"
echo "   📄 mobile/.env.production (生产环境)"
echo "   📄 mobile/.env.development (开发环境)"
echo "   🔨 build-frontend.sh (构建脚本)"
echo "   📦 deploy-frontend.sh (部署说明)"
echo
echo "🚀 接下来的步骤:"
echo "   1. 验证后端运行:"
echo "      curl https://xysrxgjnpycd.sealoshzh.site/health"
echo
echo "   2. 构建前端应用:"
echo "      bash build-frontend.sh"
echo
echo "   3. 按照部署脚本说明上传到 Sealos:"
echo "      cat deploy-frontend.sh"
echo
echo "   4. 打开前端应用测试"
echo
echo "💡 提示:"
echo "   - .env.production 用于上传到 Sealos 时"
echo "   - .env.development 用于本地测试时"
echo "   - 公网 API 使用 HTTPS"
echo "   - WebSocket 使用 WSS"
echo
