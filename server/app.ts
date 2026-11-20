import cors from 'cors';
import express from 'express';
import {connectDatabase, getDbStatus} from './config/db.ts';
import {getProviderArchitectureStatus} from './providers/providerFactory.ts';
import authRoutes from './routes/authRoutes.ts';
import beneficiaryRoutes from './routes/beneficiaryRoutes.ts';
import dashboardRoutes from './routes/dashboardRoutes.ts';
import messageRoutes from './routes/messageRoutes.ts';
import phoneRoutes from './routes/phoneRoutes.ts';
import schedulerRoutes from './routes/schedulerRoutes.ts';
import {seedDatabaseIfEmpty} from './seed/seedData.ts';
import {getSchedulerStatus, startDailyCronScheduler} from './services/schedulerService.ts';

export function createExpressApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({limit: '1mb'}));

  app.get('/api/health', (_req, res) => {
    const db = getDbStatus();
    res.json({
      service: 'DignityLink API',
      status: db.state === 'connected' ? 'ok' : 'degraded',
      database: db,
      scheduler: getSchedulerStatus(),
      providers: getProviderArchitectureStatus(),
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/health/reconnect', async (_req, res) => {
    const connected = await connectDatabase();
    if (connected) {
      await seedDatabaseIfEmpty(false);
      startDailyCronScheduler();
    }
    res.json({
      connected,
      database: getDbStatus(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/beneficiaries', beneficiaryRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/scheduler', schedulerRoutes);
  app.use('/api/phone', phoneRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.use('/api/*', (_req, res) => {
    res.status(404).json({error: 'API route not found.'});
  });

  return app;
}
