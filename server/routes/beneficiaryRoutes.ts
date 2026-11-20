import {Router} from 'express';
import {AuthenticatedRequest, requireAuth} from '../middleware/auth.ts';
import {Beneficiary} from '../models/Beneficiary.ts';
import {Feedback} from '../models/Feedback.ts';
import {MessageLog} from '../models/MessageLog.ts';
import {buildDiscreetWelcomeMessage, dispatchOutboundMessage} from '../services/messagingService.ts';
import {getBeneficiaryCurrentWeek} from '../services/schedulerService.ts';

const router = Router();

function normalizePhoneNumber(raw: string): string {
  const cleaned = raw.replace(/[\s()-]/g, '').trim();
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+234${cleaned.slice(1)}`;
  }
  return `+${cleaned}`;
}

router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const query: Record<string, unknown> = {};

    // Role-based access control: volunteers see only their assigned community unless 'All Communities'
    if (
      req.user?.role === 'volunteer' &&
      req.user.assignedCommunity &&
      req.user.assignedCommunity !== 'All Communities'
    ) {
      query.community = req.user.assignedCommunity;
    } else if (req.query.community && req.query.community !== 'all') {
      query.community = String(req.query.community);
    }

    if (req.query.language && req.query.language !== 'all') {
      query.preferredLanguage = String(req.query.language);
    }
    if (req.query.channel && req.query.channel !== 'all') {
      query.preferredChannel = String(req.query.channel);
    }
    if (req.query.status && req.query.status !== 'all') {
      query.status = String(req.query.status);
    }
    if (req.query.search) {
      const rx = new RegExp(String(req.query.search).trim(), 'i');
      query.$or = [{fullName: rx}, {phoneNumber: rx}, {community: rx}];
    }

    const beneficiaries = await Beneficiary.find(query).sort({createdAt: -1});

    const ids = beneficiaries.map((b) => b._id);
    const logCounts = await MessageLog.aggregate([
      {
        $match: {
          beneficiaryId: {$in: ids},
          direction: 'outbound',
          messageType: 'scheduled_lesson',
        },
      },
      {
        $group: {
          _id: '$beneficiaryId',
          lessonsSent: {$sum: 1},
          lastSentAt: {$max: '$createdAt'},
        },
      },
    ]);

    const countMap = new Map(
      logCounts.map((item) => [
        String(item._id),
        {lessonsSent: item.lessonsSent as number, lastSentAt: item.lastSentAt as Date},
      ]),
    );

    const enriched = beneficiaries.map((b) => {
      const stats = countMap.get(String(b._id));
      return {
        ...b.toObject(),
        currentWeek: Math.min(12, getBeneficiaryCurrentWeek(b.startDate)),
        lessonsSent: stats?.lessonsSent || 0,
        lastSentAt: stats?.lastSentAt || null,
      };
    });

    res.json({beneficiaries: enriched});
  } catch (err) {
    console.error('List beneficiaries error:', err);
    res.status(500).json({error: 'Failed to load beneficiaries.'});
  }
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      preferredChannel,
      preferredLanguage,
      community,
      startDate,
      isMinor,
      age,
      consent,
      guardianConsent,
      kitDistributed,
    } = req.body;

    const normalizedPhone = normalizePhoneNumber(String(phoneNumber || ''));
    if (!fullName?.trim()) {
      res.status(400).json({error: 'Beneficiary full name is required.'});
      return;
    }
    if (!/^\+\d{8,15}$/.test(normalizedPhone)) {
      res.status(400).json({
        error: 'Enter a valid phone number (8 to 15 digits, e.g. +2348031234567 or 08031234567).',
      });
      return;
    }

    if (!consent?.given || !consent?.explanationConfirmed) {
      res.status(400).json({
        error:
          'Registration blocked: Plain-language service explanation and informed consent must be confirmed.',
      });
      return;
    }

    const minorFlag = Boolean(isMinor) || (typeof age === 'number' && age < 18);
    if (minorFlag) {
      if (!guardianConsent?.given || !guardianConsent?.guardianName?.trim()) {
        res.status(400).json({
          error:
            'Parent or guardian consent and guardian name are mandatory when registering a minor under 18.',
        });
        return;
      }
    }

    // Volunteers default to their assigned community unless coordinator
    const resolvedCommunity =
      req.user?.role === 'volunteer' &&
      req.user.assignedCommunity &&
      req.user.assignedCommunity !== 'All Communities'
        ? req.user.assignedCommunity
        : String(community || '').trim();

    if (!resolvedCommunity) {
      res.status(400).json({error: 'Community or IDP camp name is required.'});
      return;
    }

    const existing = await Beneficiary.findOne({phoneNumber: normalizedPhone});
    if (existing) {
      res.status(409).json({
        error: `A beneficiary with phone number ${normalizedPhone} is already registered.`,
      });
      return;
    }

    const now = new Date();
    const beneficiary = await Beneficiary.create({
      fullName: String(fullName).trim(),
      phoneNumber: normalizedPhone,
      preferredChannel: preferredChannel === 'whatsapp' ? 'whatsapp' : 'sms',
      preferredLanguage: preferredLanguage === 'ha' ? 'ha' : 'en',
      community: resolvedCommunity,
      startDate: startDate ? new Date(startDate) : now,
      isMinor: minorFlag,
      age: age ? Number(age) : undefined,
      consent: {
        given: true,
        explanationConfirmed: true,
        givenBy: String(consent.givenBy || fullName).trim(),
        recordedByUserId: req.user!.userId,
        recordedAt: now,
      },
      guardianConsent: minorFlag
        ? {
            required: true,
            given: true,
            guardianName: String(guardianConsent.guardianName).trim(),
            relationship: String(guardianConsent.relationship || 'Parent / Guardian').trim(),
            recordedAt: now,
          }
        : {
            required: false,
            given: false,
          },
      kitDistributed: {
        padsCount: Number(kitDistributed?.padsCount || 3),
        soapIncluded: kitDistributed?.soapIncluded !== false,
        pouchIncluded: kitDistributed?.pouchIncluded !== false,
        distributedAt: now,
      },
      status: 'active',
      registeredByUserId: req.user!.userId,
    });

    // Immediately dispatch a discreet welcome message via the configured mock provider
    const welcomeBody = buildDiscreetWelcomeMessage(beneficiary);
    const {log: welcomeLog} = await dispatchOutboundMessage({
      beneficiary,
      body: welcomeBody,
      messageType: 'welcome',
    });

    res.status(201).json({
      beneficiary: {
        ...beneficiary.toObject(),
        currentWeek: 1,
        lessonsSent: 0,
      },
      welcomeLog,
    });
  } catch (err) {
    console.error('Create beneficiary error:', err);
    const message = err instanceof Error ? err.message : 'Failed to register beneficiary.';
    res.status(400).json({error: message});
  }
});

router.patch('/:id/opt-out', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.id);
    if (!beneficiary) {
      res.status(404).json({error: 'Beneficiary not found.'});
      return;
    }

    if (
      req.user?.role === 'volunteer' &&
      req.user.assignedCommunity !== 'All Communities' &&
      beneficiary.community !== req.user.assignedCommunity
    ) {
      res.status(403).json({error: 'Cannot modify beneficiary outside your assigned community.'});
      return;
    }

    const action = req.body.action === 'reactivate' ? 'reactivate' : 'opt_out';

    if (action === 'opt_out') {
      beneficiary.status = 'opted_out';
      beneficiary.optedOutAt = new Date();
      beneficiary.optOutReason = String(
        req.body.reason || `Marked opted-out by ${req.user?.name}`,
      ).trim();
      await beneficiary.save();
    } else {
      beneficiary.status = 'active';
      beneficiary.optedOutAt = undefined;
      beneficiary.optOutReason = undefined;
      await beneficiary.save();
    }

    res.json({beneficiary});
  } catch (err) {
    console.error('Opt-out toggle error:', err);
    res.status(500).json({error: 'Failed to update beneficiary status.'});
  }
});

router.get('/:id/timeline', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.id);
    if (!beneficiary) {
      res.status(404).json({error: 'Beneficiary not found.'});
      return;
    }

    if (
      req.user?.role === 'volunteer' &&
      req.user.assignedCommunity !== 'All Communities' &&
      beneficiary.community !== req.user.assignedCommunity
    ) {
      res.status(403).json({error: 'Cannot access beneficiary outside your assigned community.'});
      return;
    }

    const [logs, feedbacks] = await Promise.all([
      MessageLog.find({beneficiaryId: beneficiary._id}).sort({createdAt: -1}),
      Feedback.find({beneficiaryId: beneficiary._id}).sort({createdAt: -1}),
    ]);

    res.json({
      beneficiary: {
        ...beneficiary.toObject(),
        currentWeek: Math.min(12, getBeneficiaryCurrentWeek(beneficiary.startDate)),
      },
      logs,
      feedbacks,
    });
  } catch (err) {
    console.error('Timeline error:', err);
    res.status(500).json({error: 'Failed to load beneficiary timeline.'});
  }
});

export default router;
