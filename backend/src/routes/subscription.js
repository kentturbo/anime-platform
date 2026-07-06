import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireVerified } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-payment', authenticateToken, requireVerified, async (req, res) => {
  const { plan, amount, currency } = req.body;

  try {
    const paymentId = `PAYMENT_${Date.now()}_${req.user.id}`;

    res.json({
      success: true,
      paymentId,
      redirectUrl: `/payment/gateway?id=${paymentId}`,
      message: 'Payment gateway integration pending'
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

router.post('/verify-payment', authenticateToken, requireVerified, async (req, res) => {
  const { paymentId, transactionId } = req.body;

  try {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await query(
      'INSERT INTO subscriptions (user_id, status, expires_at, payment_id, amount, currency) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'active', expiresAt, paymentId, 9.99, 'USD']
    );

    await query(
      'UPDATE users SET subscription_active = TRUE WHERE id = $1',
      [req.user.id]
    );

    res.json({ 
      success: true, 
      message: 'Subscription activated',
      expiresAt 
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

router.get('/status', authenticateToken, requireVerified, async (req, res) => {
  try {
    const result = await query(
      'SELECT status, expires_at, amount, currency FROM subscriptions WHERE user_id = $1 AND status = $2 ORDER BY expires_at DESC LIMIT 1',
      [req.user.id, 'active']
    );

    if (result.rows.length === 0) {
      return res.json({ active: false });
    }

    const subscription = result.rows[0];
    const active = new Date(subscription.expires_at) > new Date();

    res.json({
      active,
      expiresAt: subscription.expires_at,
      amount: subscription.amount,
      currency: subscription.currency
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

export default router;
