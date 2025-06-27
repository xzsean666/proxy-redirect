const express = require('express');
const axios = require('axios');
const compression = require('compression');

// 从环境变量读取配置
const CONFIG = {
  TARGET_BASE: process.env.TARGET_BASE || 'https://api.binance.com',
  PROXY_TOKEN: process.env.PROXY_TOKEN || '666',
  PORT: parseInt(process.env.PORT || '3000'),
  HOST: process.env.HOST || '0.0.0.0',
  TIMEOUT: parseInt(process.env.PROXY_TIMEOUT || '30000'),
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '10'), // 缓存时间(秒)
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// 简单内存缓存
const cache = new Map();

const app = express();

// 中间件配置
app.use(compression({ threshold: 1024 })); // 大于1KB的响应进行gzip压缩
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Token验证中间件
app.use((req, res, next) => {
  const token = req.headers['proxy-token'];
  if (token !== CONFIG.PROXY_TOKEN) {
    return res.status(401).json({ 
      error: 'Unauthorized: Invalid or missing Proxy-Token' 
    });
  }
  next();
});

// 主要代理逻辑
app.use('/', async (req, res) => {
  const targetUrl = CONFIG.TARGET_BASE + req.originalUrl;
  
  // 生成缓存key（GET请求才缓存）
  const cacheKey = req.method === 'GET' ? `${req.method}:${targetUrl}` : null;
  
  // 检查缓存
  if (cacheKey && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CONFIG.CACHE_TTL * 1000) {
      return res.status(cached.status).set(cached.headers).send(cached.data);
    }
    cache.delete(cacheKey);
  }

  try {
    // 过滤请求头
    const { ['proxy-token']: _, ...filteredHeaders } = req.headers;

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        ...filteredHeaders,
        host: new URL(CONFIG.TARGET_BASE).host
      },
      data: req.body,
      timeout: CONFIG.TIMEOUT,
      validateStatus: () => true
    });

    // 缓存GET请求的成功响应
    if (cacheKey && response.status < 400) {
      cache.set(cacheKey, {
        status: response.status,
        headers: response.headers,
        data: response.data,
        timestamp: Date.now()
      });
    }

    res.status(response.status).set(response.headers).send(response.data);

  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(502).json({ error: 'Proxy request failed' });
  }
});

app.listen(CONFIG.PORT, CONFIG.HOST, () => {
  console.log(`🚀 Proxy server running at http://${CONFIG.HOST}:${CONFIG.PORT}`);
  console.log(`📡 Proxying to: ${CONFIG.TARGET_BASE}`);
});
