import { useEffect, useState } from "react";
import { configuracionPush, eliminarPush, registrarPush } from "../api";

function decode(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value.replace(/-/g,"+").replace(/_/g,"/")), c => c.charCodeAt(0));
}

function mismaClave(subscription: PushSubscription, key: string): boolean {
  const previous = subscription.options.applicationServerKey;
  return Boolean(previous && Array.from(new Uint8Array(previous)).join() === Array.from(decode(key)).join());
}

async function suscribir(registration: ServiceWorkerRegistration, key: string): Promise<PushSubscription> {
  let vencido = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const pending = registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decode(key)});
  void pending.then(subscription => { if (vencido) void subscription.unsubscribe(); }).catch(() => {});
  try {
    return await Promise.race([pending,new Promise<never>((_resolve,reject) => {
      timer = setTimeout(() => { vencido = true; reject(new Error("El servicio de notificaciones no respondió. Revisá tu conexión y volvé a intentar.")); },20_000);
    })]);
  } finally { clearTimeout(timer); }
}

export function Notificaciones() {
  const compatible = window.isSecureContext && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const [activa,setActiva] = useState(false);
  const [ocupado,setOcupado] = useState(false);
  const [publicKey,setPublicKey] = useState<string | null>(null);
  const [mensaje,setMensaje] = useState(compatible ? "Preparando notificaciones…" : "Este navegador no permite notificaciones push. Podés consultar las rutas desde la app.");

  useEffect(() => {
    if (!compatible) return;
    let cancelled = false;
    void configuracionPush().then(async config => {
      if (cancelled) return;
      setPublicKey(config.publicKey);
      const registration = await navigator.serviceWorker.getRegistration();
      const sub = await registration?.pushManager.getSubscription();
      if (sub && !mismaClave(sub,config.publicKey)) {
        setMensaje("El servicio de avisos cambió. Volvé a activar las notificaciones.");
        return;
      }
      if (sub && Notification.permission === "granted") await registrarPush(sub);
      if (!cancelled) {
        setActiva(Boolean(sub && Notification.permission === "granted"));
        setMensaje(Notification.permission === "denied" ? "Notificaciones bloqueadas. Habilitalas en los ajustes del navegador." : sub ? "Te avisaremos cuando estén listas las rutas de tu dataset." : "Activá los avisos para enterarte cuando tus rutas estén listas, aunque cierres la app.");
      }
    }).catch(error => { if (!cancelled) setMensaje(error instanceof Error ? error.message : "No se pudieron preparar los avisos."); });
    return () => { cancelled = true; };
  },[compatible]);

  async function activar() {
    setOcupado(true);
    let nueva: PushSubscription | null = null;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setMensaje("Los avisos no están habilitados. Podés ver el resultado desde la app."); return; }
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration?.active || !publicKey) throw new Error("La app todavía se está preparando. Recargala y volvé a intentar.");
      let subscription = await registration.pushManager.getSubscription();
      if (subscription && !mismaClave(subscription,publicKey)) {
        await subscription.unsubscribe();
        subscription = null;
      }
      if (!subscription) {
        subscription = await suscribir(registration,publicKey);
        nueva = subscription;
      }
      await registrarPush(subscription);
      setActiva(true);
      setMensaje("Te avisaremos cuando estén listas las rutas de tu dataset.");
    } catch (error) {
      if (nueva) await nueva.unsubscribe().catch(() => false);
      setMensaje(error instanceof Error ? error.message : "No se pudieron activar los avisos.");
    } finally { setOcupado(false); }
  }

  async function desactivar() {
    setOcupado(true);
    try {
      await eliminarPush();
      setActiva(false);
      setMensaje("Avisos desactivados para esta instalación.");
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      await subscription?.unsubscribe();
    } catch (error) { setMensaje(error instanceof Error ? error.message : "No se pudieron desactivar los avisos. Volvé a intentar."); }
    finally { setOcupado(false); }
  }

  return <section className="notificaciones" aria-label="Notificaciones de rutas">
    <p role="status">{mensaje}</p>
    {compatible && publicKey && <button type="button" className="boton boton--tonal" disabled={ocupado || (!activa && Notification.permission === "denied")} onClick={() => void (activa ? desactivar() : activar())}>
      {ocupado ? "Guardando…" : activa ? "Desactivar notificaciones" : "Activar notificaciones"}
    </button>}
  </section>;
}
