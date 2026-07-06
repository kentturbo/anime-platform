import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  const token = req.cookies.session_token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const sessionResult = await query(
      'SELECT * FROM sessions WHERE session_token = $1 AND expires_at > NOW()',
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const userResult = await query(
      'SELECT id, email, telegram_id, verified, subscription_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireSubscription = async (req, res, next) => {
  if (!req.user.subscription_active) {
    return res.status(403).json({ error: 'Active subscription required' });
  }
  next();
};

export const requireVerified = async (req, res, next) => {
  if (!req.user.verified) {
    return res.status(403).json({ error: 'Email verification required' });
  }
  next();
};
