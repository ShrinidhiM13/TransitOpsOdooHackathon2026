import { Router, Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { authenticate } from '../middlewares/auth';

const router = Router();

/**
 * GET /api/push/vapid-public-key
 * Public endpoint — returns the VAPID public key so the frontend can subscribe.
 */
router.get('/vapid-public-key', (_req: Request, res: Response) => {
  res.json({ success: true, publicKey: process.env.VAPID_PUBLIC_KEY });
});

/**
 * POST /api/push/subscribe
 * Saves a PushSubscription for the authenticated user.
 * Body: { endpoint: string, keys: { p256dh: string, auth: string } }
 */
router.post('/subscribe', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint, keys } = req.body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    const userId = (req as any).user?.id;

    if (!endpoint || !keys?.p256dh || !keys?.auth || !userId) {
      return res.status(400).json({ success: false, message: 'Invalid subscription payload' });
    }

    // Upsert: remove old subscription with same endpoint (device) before inserting fresh one
    await pool.execute('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);

    await pool.execute(
      'INSERT INTO push_subscriptions (userId, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)',
      [userId, endpoint, keys.p256dh, keys.auth]
    );

    return res.status(201).json({ success: true, message: 'Push subscription saved' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/push/unsubscribe
 * Removes a PushSubscription by endpoint.
 * Body: { endpoint: string }
 */
router.delete('/unsubscribe', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint } = req.body as { endpoint: string };
    const userId = (req as any).user?.id;

    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'endpoint is required' });
    }

    await pool.execute(
      'DELETE FROM push_subscriptions WHERE endpoint = ? AND userId = ?',
      [endpoint, userId]
    );

    return res.json({ success: true, message: 'Subscription removed' });
  } catch (error) {
    next(error);
  }
});

export default router;
