// El backend solo envía el identificador; el informe requiere la clave de la instalación.
self.addEventListener("push", (event) => {
  let payload;
  try {
    payload = event.data?.json();
  } catch {
    payload = null;
  }
  const title = typeof payload?.title === "string" && payload.title ? payload.title : "QuickDrop";
  event.waitUntil(self.registration.showNotification(title, {
    body: typeof payload?.body === "string" ? payload.body : "Hay novedades en tu plan de reparto.",
    icon: "/web-app-manifest-192x192.png",
    tag: typeof payload?.tag === "string" ? payload.tag.slice(0,100) : undefined,
    data: { url: typeof payload?.url === "string" ? payload.url : "/" },
  }));
  event.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(windows => {
    for (const client of windows) client.postMessage({type:"rutas-listas"});
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let destination = new URL("/", self.location.origin);
  try {
    const candidate = new URL(event.notification.data?.url ?? "/", self.location.origin);
    if (candidate.origin === self.location.origin) destination = candidate;
  } catch {
    // Un destino inválido vuelve al inicio de la app.
  }
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => client.url === destination.href);
    if (existing) return existing.focus();
    return self.clients.openWindow(destination.href);
  })());
});
