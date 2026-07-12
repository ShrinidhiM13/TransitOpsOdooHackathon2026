'use client';
import { useEffect, useRef } from 'react';
import { API_BASE } from './useApi';

/**
 * Converts a VAPID public key (URL-safe base64) to a Uint8Array
 * as required by PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * usePushNotifications — registers a Service Worker, requests permission,
 * and saves the PushSubscription to the backend.
 *
 * Call this hook only when the user is a DRIVER and has a valid JWT token.
 */
export function usePushNotifications(token: string | null, role: string | null | undefined) {
  const subscribedRef = useRef(false);

  useEffect(() => {
    // Only run for DRIVER role with a valid token, in a browser that supports push
    if (
      role !== 'DRIVER' ||
      !token ||
      subscribedRef.current ||
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      return;
    }

    let cancelled = false;

    async function setupPush() {
      try {
        // 1. Register the Service Worker
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        await navigator.serviceWorker.ready;

        if (cancelled) return;

        // 2. Check / request notification permission
        let permission = Notification.permission;
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }
        if (permission !== 'granted') {
          console.log('[Push] Notification permission denied or dismissed.');
          return;
        }

        if (cancelled) return;

        // 3. Fetch VAPID public key from backend
        const vapidRes = await fetch(`${API_BASE}/api/push/vapid-public-key`);
        const vapidData = await vapidRes.json();
        if (!vapidData.publicKey) throw new Error('VAPID public key missing');

        // 4. Subscribe to push
        const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as any,
        });

        if (cancelled) return;

        // 5. Save subscription to backend
        const subJson = subscription.toJSON();
        const saveRes = await fetch(`${API_BASE}/api/push/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          }),
        });

        if (saveRes.ok) {
          subscribedRef.current = true;
          console.log('[Push] ✅ Push subscription registered successfully.');
        } else {
          console.warn('[Push] Failed to save subscription:', await saveRes.text());
        }
      } catch (err: any) {
        console.warn('[Push] Setup failed:', err.message);
      }
    }

    setupPush();

    return () => {
      cancelled = true;
    };
  }, [token, role]);
}
