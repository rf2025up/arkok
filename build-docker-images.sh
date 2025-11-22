#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  为 Growark 前端应用构建 Docker 镜像                         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    echo "请先安装 Docker：https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker 已安装"
echo

# 创建 bigscreen Dockerfile
echo "📝 创建 bigscreen Dockerfile..."
cat > /tmp/Dockerfile.bigscreen << 'EOF'
FROM node:18-alpine

WORKDIR /app

# 安装 http-server
RUN npm install -g http-server

# 复制构建的文件
COPY bigscreen/dist ./dist

# 暴露端口
EXPOSE 3001

# 启动服务
CMD ["http-server", "./dist", "-p", "3001", "--cors"]
EOF

# 创建 mobile Dockerfile
echo "📝 创建 mobile Dockerfile..."
cat > /tmp/Dockerfile.mobile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# 安装 http-server
RUN npm install -g http-server

# 复制构建的文件
COPY mobile/dist ./dist

# 暴露端口
EXPOSE 3002

# 启动服务
CMD ["http-server", "./dist", "-p", "3002", "--cors"]
EOF

echo
echo "🔨 构建 bigscreen 镜像..."
docker build -f /tmp/Dockerfile.bigscreen -t growark-bigscreen:latest .
if [ $? -eq 0 ]; then
    echo "✅ bigscreen 镜像构建成功"
else
    echo "❌ bigscreen 镜像构建失败"
    exit 1
fi

echo
echo "🔨 构建 mobile 镜像..."
docker build -f /tmp/Dockerfile.mobile -t growark-mobile:latest .
if [ $? -eq 0 ]; then
    echo "✅ mobile 镜像构建成功"
else
    echo "❌ mobile 镜像构建失败"
    exit 1
fi

echo
echo "✅ Docker 镜像构建完成！"
echo
echo "📊 已构建的镜像："
docker images | grep growark

echo
echo "🚀 后续步骤："
echo "1. 推送镜像到 Docker Registry（如需要）"
echo "   docker tag growark-bigscreen:latest <your-registry>/growark-bigscreen:latest"
echo "   docker push <your-registry>/growark-bigscreen:latest"
echo
echo "2. 在 Sealos 中部署镜像"
echo "   - 创建应用"
echo "   - 选择'Docker 应用'"
echo "   - 输入镜像地址：growark-bigscreen:latest"
echo
