# 使用官方Node.js镜像作为基础镜像
FROM node:24-alpine

# 更换镜像源为阿里云
# 1. 更换Alpine apk源为阿里云镜像
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 2. 配置npm使用中国镜像源
RUN npm config set registry https://registry.npmmirror.com
# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache bash

# 全局安装PM2
RUN npm install -g pm2

# 复制package.json和pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装pnpm并安装依赖
RUN npm install -g pnpm && pnpm install

# 复制应用代码和启动脚本
COPY index.js startup.sh ./
COPY startup.sh /usr/local/bin/startup.sh

# 给启动脚本执行权限
RUN chmod +x /usr/local/bin/startup.sh

# 创建日志目录
RUN mkdir -p logs

# 使用启动脚本
CMD ["tail", "-f", "/dev/null"] 