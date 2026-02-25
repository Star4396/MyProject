import { defineConfig } from '@vben/vite-config';

import ElementPlus from 'unplugin-element-plus/vite';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      plugins: [
        ElementPlus({
          format: 'esm',
        }),
      ],
      server: {
        proxy: {
          '/api/mock': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/mock/, ''),
            // mock代理目标地址
            target: 'http://localhost:5320/api',
            ws: true,
          },
          '/api/models': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/models/, ''),
            // springboot代理目标地址
            target: 'http://localhost:9090/',
            ws: true,
          },
        },
      },
    },
  };
});
