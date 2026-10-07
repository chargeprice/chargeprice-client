// Replaces the old offline service worker. Browsers that still have it installed fetch this file
// as an update: it clears all caches, unregisters itself and reloads the open tabs with the current app.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: "window" });
    clients.forEach(client => client.navigate(client.url));
  })());
});
