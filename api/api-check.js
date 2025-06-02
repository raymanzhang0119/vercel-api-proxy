// api/flux-proxy.js
const fetch = require('node-fetch'); // 确保您已经在 package.json 中添加了 "node-fetch" 依赖

module.exports = async (req, res) => {
  // 设置CORS头，允许本地开发环境进行跨域请求
  // 在生产环境中，建议将 '*' 替换为您的前端域名，例如 'https://your-frontend-domain.com'
  res.setHeader('Access-Control-Allow-Origin', '*'); // 允许所有来源
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE'); // 允许的HTTP方法
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization'); // 允许的请求头

  // 处理OPTIONS请求（CORS预检请求）
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 构建目标URL
  // 确保 /flux/v1/flux-pro 这样的路径被正确地转发到 api.bfl.ai/v1/flux-pro
  const targetUrl = 'https://api.bfl.ai' + req.url.replace('/flux', '');

  try {
    const fetchOptions = {
      method: req.method,
      headers: { ...req.headers }, // 转发所有原始请求头
    };

    // 移除不应该被转发的头，例如 host，因为新的fetch会根据targetUrl自动设置
    delete fetchOptions.headers.host;

    // 对于POST、PUT等有请求体的请求，添加body
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      fetchOptions.body = JSON.stringify(req.body); // 假设请求体是JSON
      fetchOptions.headers['Content-Type'] = 'application/json'; // 确保Content-Type正确
    }

    const response = await fetch(targetUrl, fetchOptions);

    // 转发所有原始响应头
    for (const [key, value] of response.headers.entries()) {
      // 避免重复设置CORS相关的头，这些已经在前面设置过了
      if (!key.toLowerCase().startsWith('access-control-')) {
        res.setHeader(key, value);
      }
    }

    // 转发状态码和响应体
    res.status(response.status).send(await response.text());

  } catch (error) {
    console.error('代理请求失败:', error);
    res.status(500).json({ error: '代理请求失败', details: error.message });
  }
};
