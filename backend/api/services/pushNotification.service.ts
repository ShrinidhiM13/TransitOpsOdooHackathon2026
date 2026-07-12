import webPush from 'web-push';
import pool from '../config/db';

// Initialise web-push with VAPID credentials once at module load
webPush.setVapidDetails(
  process.env.VAPID_MAILTO as string,
  process.env.VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

/**
 * Sends a Web Push notification to all registered subscriptions for a given userId.
 * Silently removes subscriptions that are no longer valid (410 Gone).
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  try {
    const [rows]: any = await pool.execute(
      'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE userId = ?',
      [userId]
    );

    if (!rows || rows.length === 0) return;

    const payloadStr = JSON.stringify(payload);

    const sendResults = await Promise.allSettled(
      rows.map((row: any) =>
        webPush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          payloadStr,
          { TTL: 86400 } // 24 hour TTL
        ).catch(async (err: any) => {
          // 410 Gone = subscription expired/revoked — clean it up
          if (err.statusCode === 410) {
            await pool.execute('DELETE FROM push_subscriptions WHERE id = ?', [row.id]);
            console.log(`[PushService] Removed expired subscription for user ${userId}`);
          } else {
            console.warn(`[PushService] Push failed for user ${userId}:`, err.message);
          }
        })
      )
    );

    const sent = sendResults.filter(r => r.status === 'fulfilled').length;
    console.log(`[PushService] Sent push to ${sent}/${rows.length} subscriptions for user ${userId}`);
  } catch (err: any) {
    // Non-fatal: log but don't crash the calling API
    console.error('[PushService] Unexpected error sending push:', err.message);
  }
}

export default webPush;
