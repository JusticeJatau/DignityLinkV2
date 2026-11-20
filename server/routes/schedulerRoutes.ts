import {Router} from 'express';
import {AuthenticatedRequest, requireAuth} from '../middleware/auth.ts';
import {SchedulerRun} from '../models/SchedulerRun.ts';
import {getProviderArchitectureStatus} from '../providers/providerFactory.ts';
import {
  executeSchedulerRun,
  getSchedulerStatus,
  SchedulerMode,
} from '../services/schedulerService.ts';

const router = Router();

router.get('/status', requireAuth, async (_req, res) => {
  try {
    const recentRuns = await SchedulerRun.find({}).sort({startedAt: -1}).limit(15);
    res.json({
      cron: getSchedulerStatus(),
      providerArchitecture: getProviderArchitectureStatus(),
      recentRuns,
    });
  } catch (err) {
    console.error('Scheduler status error:', err);
    res.status(500).json({error: 'Failed to load scheduler status.'});
  }
});

router.post('/run', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const mode = (req.body.mode || 'next_due') as SchedulerMode;
    const weekNumber = req.body.weekNumber ? Number(req.body.weekNumber) : undefined;
    const slotInWeek = req.body.slotInWeek ? Number(req.body.slotInWeek) : undefined;

    if (mode === 'override' && (!weekNumber || !slotInWeek)) {
      res.status(400).json({error: 'Override mode requires both weekNumber and slotInWeek.'});
      return;
    }

    const result = await executeSchedulerRun({
      triggeredBy: 'manual',
      triggeredByUserId: req.user?.userId,
      mode,
      weekNumber,
      slotInWeek,
    });

    res.json(result);
  } catch (err) {
    console.error('Run scheduler error:', err);
    res.status(500).json({error: 'Failed to execute scheduler run.'});
  }
});

export default router;
