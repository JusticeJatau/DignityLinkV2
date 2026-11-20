import {Router} from 'express';
import {AuthenticatedRequest, requireAuth, requireRole} from '../middleware/auth.ts';
import {Beneficiary} from '../models/Beneficiary.ts';
import {Feedback} from '../models/Feedback.ts';
import {MessageLog} from '../models/MessageLog.ts';
import {SchedulerRun} from '../models/SchedulerRun.ts';
import {getProviderArchitectureStatus} from '../providers/providerFactory.ts';
import {seedDatabaseIfEmpty} from '../seed/seedData.ts';

const router = Router();

router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const isScopedVolunteer =
      req.user?.role === 'volunteer' &&
      req.user.assignedCommunity &&
      req.user.assignedCommunity !== 'All Communities';

    const beneficiaryFilter = isScopedVolunteer ? {community: req.user!.assignedCommunity} : {};
    const scopedBeneficiaries = await Beneficiary.find(beneficiaryFilter);
    const scopedIds = scopedBeneficiaries.map((b) => b._id);

    const [logs, feedbacks, recentRuns] = await Promise.all([
      MessageLog.find({beneficiaryId: {$in: scopedIds}}),
      Feedback.find({beneficiaryId: {$in: scopedIds}}).sort({createdAt: -1}),
      SchedulerRun.find({}).sort({startedAt: -1}).limit(5),
    ]);

    const outboundLogs = logs.filter((l) => l.direction === 'outbound');
    const scheduledLessonLogs = outboundLogs.filter((l) => l.messageType === 'scheduled_lesson');

    const totalBeneficiaries = scopedBeneficiaries.length;
    const activeBeneficiaries = scopedBeneficiaries.filter((b) => b.status === 'active').length;
    const optedOutBeneficiaries = scopedBeneficiaries.filter((b) => b.status === 'opted_out').length;
    const minorBeneficiaries = scopedBeneficiaries.filter((b) => b.isMinor).length;

    const helpfulCount = feedbacks.filter((f) => f.category === 'helpful').length;
    const questionCount = feedbacks.filter((f) => f.category === 'question').length;
    const unresolvedQuestionsCount = feedbacks.filter(
      (f) => f.category === 'question' && !f.resolved,
    ).length;

    const channelBreakdown = {
      sms: scopedBeneficiaries.filter((b) => b.preferredChannel === 'sms').length,
      whatsapp: scopedBeneficiaries.filter((b) => b.preferredChannel === 'whatsapp').length,
    };

    const languageBreakdown = {
      en: scopedBeneficiaries.filter((b) => b.preferredLanguage === 'en').length,
      ha: scopedBeneficiaries.filter((b) => b.preferredLanguage === 'ha').length,
    };

    // Community breakdown
    const communityMap = new Map<
      string,
      {
        community: string;
        registrations: number;
        active: number;
        optedOut: number;
        messagesSent: number;
        helpfulFeedback: number;
        openQuestions: number;
      }
    >();

    for (const b of scopedBeneficiaries) {
      const entry = communityMap.get(b.community) || {
        community: b.community,
        registrations: 0,
        active: 0,
        optedOut: 0,
        messagesSent: 0,
        helpfulFeedback: 0,
        openQuestions: 0,
      };
      entry.registrations += 1;
      if (b.status === 'active') entry.active += 1;
      if (b.status === 'opted_out') entry.optedOut += 1;
      communityMap.set(b.community, entry);
    }

    const beneficiaryCommunityMap = new Map(
      scopedBeneficiaries.map((b) => [String(b._id), b.community]),
    );

    for (const log of outboundLogs) {
      const comm = beneficiaryCommunityMap.get(String(log.beneficiaryId));
      if (comm && communityMap.has(comm)) {
        communityMap.get(comm)!.messagesSent += 1;
      }
    }

    for (const fb of feedbacks) {
      const comm = fb.community;
      if (communityMap.has(comm)) {
        const entry = communityMap.get(comm)!;
        if (fb.category === 'helpful') entry.helpfulFeedback += 1;
        if (fb.category === 'question' && !fb.resolved) entry.openQuestions += 1;
      }
    }

    res.json({
      summary: {
        totalBeneficiaries,
        activeBeneficiaries,
        optedOutBeneficiaries,
        minorBeneficiaries,
        totalOutboundMessages: outboundLogs.length,
        scheduledLessonsSent: scheduledLessonLogs.length,
        totalFeedback: feedbacks.length,
        helpfulCount,
        questionCount,
        unresolvedQuestionsCount,
      },
      channelBreakdown,
      languageBreakdown,
      communityBreakdown: Array.from(communityMap.values()),
      recentFeedback: feedbacks.slice(0, 8),
      recentRuns,
      providerArchitecture: getProviderArchitectureStatus(),
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({error: 'Failed to compute dashboard statistics.'});
  }
});

router.get('/logs', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const isScopedVolunteer =
      req.user?.role === 'volunteer' &&
      req.user.assignedCommunity &&
      req.user.assignedCommunity !== 'All Communities';

    let beneficiaryFilter: Record<string, unknown> = {};
    if (isScopedVolunteer) {
      const scoped = await Beneficiary.find({community: req.user!.assignedCommunity}).select('_id');
      beneficiaryFilter = {beneficiaryId: {$in: scoped.map((s) => s._id)}};
    }

    const query: Record<string, unknown> = {...beneficiaryFilter};
    if (req.query.channel && req.query.channel !== 'all') {
      query.channel = String(req.query.channel);
    }
    if (req.query.direction && req.query.direction !== 'all') {
      query.direction = String(req.query.direction);
    }

    const logs = await MessageLog.find(query)
      .populate('beneficiaryId', 'fullName community preferredLanguage')
      .sort({createdAt: -1})
      .limit(100);

    res.json({logs});
  } catch (err) {
    console.error('Logs query error:', err);
    res.status(500).json({error: 'Failed to load messaging provider logs.'});
  }
});

router.get('/feedback', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const query: Record<string, unknown> = {};
    if (
      req.user?.role === 'volunteer' &&
      req.user.assignedCommunity &&
      req.user.assignedCommunity !== 'All Communities'
    ) {
      query.community = req.user.assignedCommunity;
    } else if (req.query.community && req.query.community !== 'all') {
      query.community = String(req.query.community);
    }

    if (req.query.category && req.query.category !== 'all') {
      query.category = String(req.query.category);
    }
    if (req.query.resolved === 'true') {
      query.resolved = true;
    } else if (req.query.resolved === 'false') {
      query.resolved = false;
    }

    const feedbacks = await Feedback.find(query).sort({createdAt: -1}).limit(100);
    res.json({feedbacks});
  } catch (err) {
    console.error('Feedback query error:', err);
    res.status(500).json({error: 'Failed to load feedback items.'});
  }
});

router.patch('/feedback/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      res.status(404).json({error: 'Feedback record not found.'});
      return;
    }

    if (
      req.user?.role === 'volunteer' &&
      req.user.assignedCommunity !== 'All Communities' &&
      feedback.community !== req.user.assignedCommunity
    ) {
      res.status(403).json({error: 'Access restricted to your assigned community.'});
      return;
    }

    feedback.resolved = typeof req.body.resolved === 'boolean' ? req.body.resolved : true;
    if (typeof req.body.volunteerNotes === 'string') {
      feedback.volunteerNotes = req.body.volunteerNotes.trim();
    }
    if (feedback.resolved) {
      feedback.resolvedByUserId = req.user!.userId as unknown as typeof feedback.resolvedByUserId;
      feedback.resolvedAt = new Date();
    }

    await feedback.save();
    res.json({feedback});
  } catch (err) {
    console.error('Update feedback error:', err);
    res.status(500).json({error: 'Failed to update feedback status.'});
  }
});

router.post('/seed', requireAuth, requireRole('coordinator'), async (req, res) => {
  try {
    const force = req.body.force === true;
    const result = await seedDatabaseIfEmpty(force);
    res.json(result);
  } catch (err) {
    console.error('Seed endpoint error:', err);
    res.status(500).json({error: 'Failed to seed database.'});
  }
});

export default router;
