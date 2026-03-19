self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Quddify", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Quddify", {
      body: payload.body || "",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: payload.type || "lead",
      renotify: true,
      data: payload,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    }),
  );
});
