import express from 'express';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {createExpressApp} from './app.ts';
import {connectDatabase} from './config/db.ts';
import {env} from './config/env.ts';
import {seedDatabaseIfEmpty} from './seed/seedData.ts';
import {startDailyCronScheduler} from './services/schedulerService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export async function startServer() {
  const app = createExpressApp();

  const dbConnected = await connectDatabase();
  if (dbConnected) {
    try {
      const seedResult = await seedDatabaseIfEmpty(false);
      if (seedResult.seeded) {
        console.log(`[DignityLink Seed] ${seedResult.message}`);
      }
      startDailyCronScheduler();
    } catch (err) {
      console.error('[DignityLink Startup] Seed or scheduler init error:', err);
    }
  }

  const isStandaloneApiOnly = process.env.STANDALONE_API_ONLY === 'true';

  if (!isStandaloneApiOnly) {
    if (env.nodeEnv !== 'production') {
      const {createServer: createViteServer} = await import('vite');
      const vite = await createViteServer({
        configFile: path.resolve(projectRoot, 'vite.config.ts'),
        server: {middlewareMode: true},
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distDir = path.resolve(projectRoot, 'dist');
      if (fs.existsSync(distDir)) {
        app.use(express.static(distDir));
        app.get('*', (_req, res) => {
          res.sendFile(path.resolve(distDir, 'index.html'));
        });
      }
    }
  }

  const listenPort = isStandaloneApiOnly ? Number(process.env.PORT || 5000) : env.port;
  app.listen(listenPort, '0.0.0.0', () => {
    console.log(`[DignityLink Server] Listening on http://0.0.0.0:${listenPort} (${env.nodeEnv})`);
  });
}

// Run directly when executed via tsx server/index.ts or imported by root server.ts
startServer().catch((err) => {
  console.error('[DignityLink Server] Fatal startup error:', err);
  process.exit(1);
});
