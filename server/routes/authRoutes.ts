import bcrypt from 'bcryptjs';
import {Router} from 'express';
import {getDbStatus} from '../config/db.ts';
import {AuthenticatedRequest, requireAuth, signAuthToken} from '../middleware/auth.ts';
import {User} from '../models/User.ts';

const router = Router();

router.post('/login', async (req, res) => {
  if (getDbStatus().state !== 'connected') {
    res.status(503).json({
      error: 'Database is not connected. Configure MONGODB_URI in .env to sign in.',
    });
    return;
  }

  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      res.status(400).json({error: 'Email and password are required.'});
      return;
    }

    const user = await User.findOne({email, active: true});
    if (!user) {
      res.status(401).json({error: 'Invalid email or password.'});
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({error: 'Invalid email or password.'});
      return;
    }

    const payload = {
      userId: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      assignedCommunity: user.assignedCommunity,
    };

    const token = signAuthToken(payload);
    res.json({token, user: payload});
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({error: 'Unable to process login request.'});
  }
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  res.json({user: req.user});
});

export default router;
