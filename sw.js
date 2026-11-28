// Service worker of the flats app: shows push alerts, opens the app on the flat on tap.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", e => {
  let d = {};
  try { d = e.data.json(); } catch (_) { d = { title: "New flat", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "New flat", {
    body: d.body || "", icon: "icon.png", badge: "icon.png", image: d.image || undefined,
    tag: d.id || undefined, data: { id: d.id || "", url: d.url || "" },
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const { url, id } = e.notification.data || {};
  const app = new URL("./", self.registration.scope).href;
  const msg = { t: "open", url: url || "", id: id || "", at: Date.now() };
  e.waitUntil((async () => {
    // Remember the tap: an app window that was in the background picks it up when it wakes
    // (iPhone only brings the open app to the front and ignores the link otherwise).
    try { await (await caches.open("liveinzh-tap")).put("tap", new Response(JSON.stringify(msg))); } catch (_) {}
    const ws = await clients.matchAll({ type: "window", includeUncontrolled: true });
    const w = ws.find(w => "focus" in w);
    if (w) {
      w.postMessage(msg);
      try { await w.focus(); } catch (_) {}
      return;
    }
    // App closed: start it on the flat.
    await clients.openWindow(id ? app + "?flat=" + encodeURIComponent(id) : app);
  })());
});
