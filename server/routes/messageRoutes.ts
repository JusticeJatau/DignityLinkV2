import {Router} from 'express';
import {AuthenticatedRequest, requireAuth, requireRole} from '../middleware/auth.ts';
import {MessageTemplate} from '../models/MessageTemplate.ts';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const query: Record<string, unknown> = {};
    if (req.query.weekNumber && req.query.weekNumber !== 'all') {
      query.weekNumber = Number(req.query.weekNumber);
    }
    if (req.query.language && req.query.language !== 'all') {
      query.language = String(req.query.language);
    }
    if (req.query.theme && req.query.theme !== 'all') {
      query.theme = String(req.query.theme);
    }

    const templates = await MessageTemplate.find(query).sort({sequenceNumber: 1, language: 1});
    res.json({templates});
  } catch (err) {
    console.error('List messages error:', err);
    res.status(500).json({error: 'Failed to load message library.'});
  }
});

router.patch('/:id', requireAuth, requireRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const {content, theme, active, contentReviewStatus} = req.body;
    const template = await MessageTemplate.findById(req.params.id);
    if (!template) {
      res.status(404).json({error: 'Message template not found.'});
      return;
    }

    if (typeof content === 'string') {
      const trimmed = content.trim();
      if (!trimmed) {
        res.status(400).json({error: 'Message content cannot be empty.'});
        return;
      }
      if (trimmed.length > 160) {
        res.status(400).json({
          error: `Message is ${trimmed.length} characters. Must stay at or under 160 characters to fit one SMS.`,
        });
        return;
      }
      template.content = trimmed;
    }

    if (theme) {
      template.theme = theme;
    }
    if (typeof active === 'boolean') {
      template.active = active;
    }
    if (contentReviewStatus === 'prototype_draft' || contentReviewStatus === 'clinical_reviewed') {
      template.contentReviewStatus = contentReviewStatus;
    }

    await template.save();
    res.json({template});
  } catch (err) {
    console.error('Update message error:', err);
    res.status(400).json({error: 'Failed to update message template.'});
  }
});

export default router;
