import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../public/push.js", import.meta.url), "utf8");

function worker(clients = []) {
  const handlers = {};
  const notifications = [];
  const opened = [];
  runInNewContext(source, {
    URL,
    self: {
      location: { origin: "https://quickdrop.example" },
      addEventListener: (name, handler) => { handlers[name] = handler; },
      registration: { showNotification: async (...args) => { notifications.push(args); } },
      clients: {
        matchAll: async () => clients,
        openWindow: async (url) => { opened.push(url); },
      },
    },
  });
  async function fire(name, properties) {
    const pending = [];
    handlers[name]({ ...properties, waitUntil: (promise) => pending.push(promise) });
    await Promise.all(pending);
  }
  return { notifications, opened, fire };
}

test("push muestra título, cuerpo e ícono de la app", async () => {
  const sw = worker();
  await sw.fire("push", { data: { json: () => ({ title: "Plan listo", body: "10 pedidos", url: "/?plan=1" }) } });
  assert.equal(sw.notifications[0][0], "Plan listo");
  assert.equal(sw.notifications[0][1].body, "10 pedidos");
  assert.equal(sw.notifications[0][1].icon, "/web-app-manifest-192x192.png");
});

test("push vacío, inválido o con tipos incorrectos siempre muestra un aviso seguro", async () => {
  for (const data of [null, { json() { throw new Error("JSON inválido"); } }, { json: () => null }, { json: () => ({ title: {}, body: 123 }) }]) {
    const sw = worker();
    await sw.fire("push", { data });
    assert.equal(sw.notifications[0][0], "QuickDrop");
    assert.equal(typeof sw.notifications[0][1].body, "string");
  }
});

test("al tocar una notificación no abre URLs externas ni esquemas ejecutables", async () => {
  for (const url of ["https://evil.example/", "//evil.example/", "javascript:alert(1)", "http://[", null]) {
    const sw = worker();
    let closed = false;
    await sw.fire("notificationclick", { notification: { data: { url }, close: () => { closed = true; } } });
    assert.equal(closed, true);
    assert.equal(sw.opened[0], "https://quickdrop.example/");
  }
});

test("reutiliza la ventana del destino o abre una URL interna", async () => {
  let focused = false;
  const sw = worker([{ url: "https://quickdrop.example/?plan=1", focus: async () => { focused = true; } }]);
  await sw.fire("notificationclick", { notification: { data: { url: "/?plan=1" }, close() {} } });
  assert.equal(focused, true);
  assert.equal(sw.opened.length, 0);
  const other = worker();
  await other.fire("notificationclick", { notification: { data: { url: "/?plan=2" }, close() {} } });
  assert.equal(other.opened[0], "https://quickdrop.example/?plan=2");
});
