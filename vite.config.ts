import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'admin-zero-db-api',
      configureServer(server) {
        // Admin verify endpoint
        server.middlewares.use('/api/verify-admin', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { passcode } = JSON.parse(body || '{}');
                const validPasscode = process.env.VITE_ADMIN_PASSCODE || 'aisys2026';
                if (passcode === validPasscode) {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true, token: 'aisys-admin-authenticated' }));
                } else {
                  res.writeHead(401, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, message: 'Passcode salah.' }));
                }
              } catch (e: any) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }
          res.writeHead(405).end();
        });

        // Save skill endpoint (writes directly to public/skill-config.json)
        server.middlewares.use('/api/save-skill', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { systemPrompt, skillName } = JSON.parse(body || '{}');
                if (!systemPrompt) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'systemPrompt diperlukan' }));
                  return;
                }

                const configPath = path.resolve(__dirname, 'public/skill-config.json');
                const newConfig = {
                  skillName: skillName || 'AISYS HTML5 Game Builder',
                  version: '1.0',
                  updatedAt: Date.now(),
                  systemPrompt: systemPrompt.trim(),
                };

                fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, updatedAt: newConfig.updatedAt }));
              } catch (e: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }
          res.writeHead(405).end();
        });
      },
    },
  ],
  server: {
    port: 5173,
    proxy: {
      // Proxy to bypass CORS during local development
      '/api-proxy': {
        target: 'https://ai.sumopod.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, ''),
        secure: false,
        timeout: 180000,
        headers: {
          Connection: 'keep-alive',
        },
      },
    },
  },
});
