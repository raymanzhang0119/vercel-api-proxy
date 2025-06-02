        import fetch from 'node-fetch'; // Vercel Serverless Function环境中，需要引入node-fetch来使用fetch API

        export default async (req, res) => {
          // 设置CORS头，允许跨域请求
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          // 处理预检请求 (OPTIONS)
          if (req.method === 'OPTIONS') {
            return res.status(200).end();
          }

          const fluxApiUrl = 'https://api.bfl.ai/v1/flux-pro';
          let status = 'unknown';
          let message = '';
          let responseStatus = 0;
          let responseText = '';

          console.log(`[API_CHECK] 尝试连接到 Flux API: ${fluxApiUrl}`);

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 设置10秒超时

            // 发起对Flux API的GET请求，用于测试连通性
            const response = await fetch(fluxApiUrl, {
              method: 'GET',
              signal: controller.signal 
            });
            clearTimeout(timeoutId); // 清除超时定时器

            responseStatus = response.status;
            responseText = await response.text();

            // 检查响应状态。即使是405或404也可能表示连接成功，只是API不支持GET
            if (response.ok || response.status === 405 || response.status === 404) {
              status = 'success';
              message = `成功连接到 Flux API。HTTP状态: ${response.status}. 响应预览: ${responseText.substring(0, 200)}...`;
            } else {
              status = 'error';
              message = `连接到 Flux API 失败。HTTP状态: ${response.status}. 响应: ${responseText.substring(0, 200)}...`;
            }
          } catch (error) {
            status = 'error';
            message = `无法连接到 Flux API: ${error.message}`; 
            console.error(`[API_CHECK_ERROR] ${message}`, error); // 打印详细错误到Vercel日志
          }

          // 返回JSON响应
          res.status(200).json({
            status: status,
            message: message,
            fluxApiUrl: fluxApiUrl,
            responseStatus: responseStatus,
            responseText: responseText.substring(0, 500) // 限制响应文本大小
          });
        };
