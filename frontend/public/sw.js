// TransitOps Service Worker — handles Web Push Notifications
// Scope: / (root, handles all push messages for this origin)

self.addEventListener('install', (event) => {
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all open clients immediately
  event.waitUntil(clients.claim());
});

/**
 * Push event — fired by the browser when a push message arrives from the backend.
 * Parses the JSON payload and shows an OS-level notification.
 */
self.addEventListener('push', (event) => {
  let payload = {
    title: 'TransitOps',
    body: 'You have a new notification.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      payload = { ...payload, ...JSON.parse(event.data.text()) };
    } catch (e) {
      console.warn('[SW] Could not parse push payload:', e);
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data || { url: '/' },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: true, // Keep notification visible until user interacts
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

/**
 * Notification click event — when the driver taps the notification:
 * - "open" action or clicking body → focus existing tab or open new one
 * - "dismiss" action → close the notification
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
