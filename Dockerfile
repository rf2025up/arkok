FROM node:18-alpine

WORKDIR /app

# 后端依赖
COPY package*.json ./
RUN npm ci --only=production

# 后端代码
COPY server.js .
COPY create-schema.js .

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# 启动命令
CMD ["node", "server.js"]
