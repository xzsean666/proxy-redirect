#!/bin/bash

# 启动脚本 - 处理环境变量验证和PM2启动
echo "🚀 Starting Proxy Redirect Service..."

# 设置默认环境变量
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}
export HOST=${HOST:-0.0.0.0}
export TARGET_BASE=${TARGET_BASE:-https://api.binance.com}
export PROXY_TOKEN=${PROXY_TOKEN:-666}
export PROXY_TIMEOUT=${PROXY_TIMEOUT:-30000}
export CACHE_TTL=${CACHE_TTL:-10}
export PM2_INSTANCES=${PM2_INSTANCES:-1}


# 打印配置信息
echo "📋 Configuration:"
echo "  - Node Environment: $NODE_ENV"
echo "  - Server: $HOST:$PORT"
echo "  - Target API: $TARGET_BASE"
echo "  - PM2 Instances: $PM2_INSTANCES"


# 验证必要的环境变量
if [ -z "$TARGET_BASE" ]; then
  echo "❌ Error: TARGET_BASE environment variable is required"
  exit 1
fi

if [ -z "$PROXY_TOKEN" ]; then
  echo "❌ Error: PROXY_TOKEN environment variable is required"
  exit 1
fi

# 确保日志目录存在
mkdir -p logs

# 清理旧的PM2进程（如果存在）
echo "🧹 Cleaning up any existing PM2 processes..."
pm2 delete all 2>/dev/null || true

# 启动PM2应用
echo "🔄 Starting PM2 with $PM2_INSTANCES instances..."
exec pm2-runtime start index.js --name proxy-redirect -i $PM2_INSTANCES 