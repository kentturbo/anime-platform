import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import UAParser from 'ua-parser-js';
import { query } from '../config/database.js';
import { sendVerificationEmail } from '../services/email.js';
import { checkChannelSubscription, getTelegramChannelLink } from '../services/telegram.js';
import { detectIP } from '../services/ip.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createSession = async (userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await query(
    'INSERT INTO sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );

  return token;
};

router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const verificationCode = generateVerificationCode();
      const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const result = await query(
        'INSERT INTO users (email, password_hash, verification_code, verification_expires_at) VALUES ($1, $2, $3, $4) RETURNING id',
        [email, passwordHash, verificationCode, verificationExpiresAt]
      );

      await sendVerificationEmail(email, verificationCode);

      const ipData = await detectIP(req);
      const parser = new UAParser(req.headers['user-agent']);
      const browserData = {
        browser: parser.getBrowser(),
        os: parser.getOS(),
        device: parser.getDevice()
      };

      await query(
        'INSERT INTO user_metadata (user_id, ip_address, real_ip, vpn_detected, browser_data) VALUES ($1, $2, $3, $4, $5)',
        [result.rows[0].id, ipData.ip, ipData.realIP, ipData.vpnDetected, JSON.stringify(browserData)]
      );

      res.json({ 
        success: true, 
        message: 'Verification code sent to your email',
        userId: result.rows[0].id 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

router.post('/verify-email',
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;

    try {
      const result = await query(
        'SELECT id, verification_code, verification_expires_at FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      if (new Date() > new Date(user.verification_expires_at)) {
        return res.status(400).json({ error: 'Verification code expired' });
      }

      if (user.verification_code !== code) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      await query(
        'UPDATE users SET verified = TRUE, verification_code = NULL, verification_expires_at = NULL WHERE id = $1',
        [user.id]
      );

      res.json({ 
        success: true, 
        message: 'Email verified successfully',
        requiresTelegram: true,
        telegramChannelLink: getTelegramChannelLink()
      });
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  }
);

router.post('/link-telegram',
  body('email').isEmail().normalizeEmail(),
  body('telegramId').isNumeric(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, telegramId } = req.body;

    try {
      const userResult = await query('SELECT id, verified FROM users WHERE email = $1', [email]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult.rows[0];

      if (!user.verified) {
        return res.status(400).json({ error: 'Email must be verified first' });
      }

      const isSubscribed = await checkChannelSubscription(telegramId);

      if (!isSubscribed) {
        return res.status(403).json({ 
          error: 'You must subscribe to our Telegram channel',
          telegramChannelLink: getTelegramChannelLink()
        });
      }

      await query('UPDATE users SET telegram_id = $1 WHERE id = $2', [telegramId, user.id]);

      const token = await createSession(user.id);

      res.cookie('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.json({ 
        success: true, 
        message: 'Telegram linked successfully',
        token 
      });
    } catch (error) {
      console.error('Telegram link error:', error);
      res.status(500).json({ error: 'Failed to link Telegram' });
    }
  }
);

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const result = await query(
        'SELECT id, password_hash, verified, telegram_id FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.verified) {
        return res.status(403).json({ error: 'Email not verified' });
      }

      if (!user.telegram_id) {
        return res.status(403).json({ 
          error: 'Telegram not linked',
          requiresTelegram: true,
          telegramChannelLink: getTelegramChannelLink()
        });
      }

      const ipData = await detectIP(req);
      await query(
        'UPDATE user_metadata SET ip_address = $1, real_ip = $2, vpn_detected = $3, last_login = NOW() WHERE user_id = $4',
        [ipData.ip, ipData.realIP, ipData.vpnDetected, user.id]
      );

      const token = await createSession(user.id);

      res.cookie('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.json({ 
        success: true, 
        token,
        user: {
          id: user.id,
          email
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

router.post('/logout', authenticateToken, async (req, res) => {
  const token = req.cookies.session_token || req.headers.authorization?.split(' ')[1];

  try {
    await query('DELETE FROM sessions WHERE session_token = $1', [token]);
    res.clearCookie('session_token');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const subResult = await query(
      'SELECT status, expires_at FROM subscriptions WHERE user_id = $1 AND status = $2 ORDER BY expires_at DESC LIMIT 1',
      [req.user.id, 'active']
    );

    const subscriptionActive = subResult.rows.length > 0 && new Date(subResult.rows[0].expires_at) > new Date();

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        verified: req.user.verified,
        subscriptionActive
      }
    });
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
