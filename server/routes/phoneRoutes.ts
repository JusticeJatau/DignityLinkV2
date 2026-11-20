import {Router} from 'express';
import {AuthenticatedRequest, requireAuth} from '../middleware/auth.ts';
import {Beneficiary} from '../models/Beneficiary.ts';
import {MessageLog} from '../models/MessageLog.ts';
import {processInboundReply} from '../services/messagingService.ts';

const router = Router();

router.get('/beneficiaries', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const query: Record<string, unknown> = {};
    if (
      req.user?.role === 'volunteer' &&
      req.user.assignedCommunity &&
      req.user.assignedCommunity !== 'All Communities'
    ) {
      query.community = req.user.assignedCommunity;
    }

    const beneficiaries = await Beneficiary.find(query)
      .select('fullName phoneNumber preferredChannel preferredLanguage community status')
      .sort({createdAt: -1});

    res.json({beneficiaries});
  } catch (err) {
    console.error('Phone beneficiaries error:', err);
    res.status(500).json({error: 'Failed to load phone simulator contacts.'});
  }
});

router.get('/inbox/:beneficiaryId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.beneficiaryId);
    if (!beneficiary) {
      res.status(404).json({error: 'Beneficiary not found.'});
      return;
    }

    if (
      req.user?.role === 'volunteer' &&
      req.user.assignedCommunity !== 'All Communities' &&
      beneficiary.community !== req.user.assignedCommunity
    ) {
      res.status(403).json({error: 'Access restricted to your assigned community.'});
      return;
    }

    const messages = await MessageLog.find({beneficiaryId: beneficiary._id}).sort({createdAt: 1});
    res.json({beneficiary, messages});
  } catch (err) {
    console.error('Phone inbox error:', err);
    res.status(500).json({error: 'Failed to load simulated handset inbox.'});
  }
});

router.post('/reply', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {beneficiaryId, rawReply} = req.body;
    if (!beneficiaryId || !String(rawReply || '').trim()) {
      res.status(400).json({error: 'beneficiaryId and reply message are required.'});
      return;
    }

    const beneficiary = await Beneficiary.findById(beneficiaryId);
    if (!beneficiary) {
      res.status(404).json({error: 'Beneficiary not found.'});
      return;
    }

    if (
      req.user?.role === 'volunteer' &&
      req.user.assignedCommunity !== 'All Communities' &&
      beneficiary.community !== req.user.assignedCommunity
    ) {
      res.status(403).json({error: 'Access restricted to your assigned community.'});
      return;
    }

    const result = await processInboundReply(String(beneficiaryId), String(rawReply));
    res.json(result);
  } catch (err) {
    console.error('Phone reply error:', err);
    const message = err instanceof Error ? err.message : 'Failed to process simulated reply.';
    res.status(400).json({error: message});
  }
});

export default router;
