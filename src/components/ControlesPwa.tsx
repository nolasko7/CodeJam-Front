import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Notificaciones } from "./Notificaciones";

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function ControlesPwa({ ocupado, hayInforme }: { ocupado: boolean; hayInforme: boolean }) {
  const [online, setOnline] = useState(navigator.onLine);
  const [instalacion, setInstalacion] = useState<EventoInstalacion | null>(null);
  const [instalando, setInstalando] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const recargaSolicitada = useRef(false);
  const ocupadoActual = useRef(ocupado);
  ocupadoActual.current = ocupado;
  const [instalada, setInstalada] = useState(() => window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && navigator.standalone === true));
  const [error, setError] = useState("");
  const {
    needRefresh: [actualizacion, setActualizacion],
    offlineReady: [disponibleOffline],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () => setError("No se pudo preparar el modo sin conexión. Podés seguir usando la web y reintentar recargando."),
    onNeedReload() {
      // El worker se comparte entre pestañas; cada una decide cuándo recargarse.
      if (recargaSolicitada.current && !ocupadoActual.current) window.location.reload();
      else {
        recargaSolicitada.current = false;
        setActualizando(false);
        setActualizacion(true);
      }
    },
  });

  useEffect(() => {
    const conectar = () => setOnline(true);
    const desconectar = () => setOnline(false);
    const ofrecer = (event: Event) => {
      event.preventDefault();
      setInstalacion(event as EventoInstalacion);
    };
    const completar = () => { setInstalada(true); setInstalacion(null); };
    window.addEventListener("online", conectar);
    window.addEventListener("offline", desconectar);
    window.addEventListener("beforeinstallprompt", ofrecer);
    window.addEventListener("appinstalled", completar);
    return () => {
      window.removeEventListener("online", conectar);
      window.removeEventListener("offline", desconectar);
      window.removeEventListener("beforeinstallprompt", ofrecer);
      window.removeEventListener("appinstalled", completar);
    };
  }, []);

  async function instalar() {
    if (!instalacion) return;
    setInstalando(true);
    try {
      await instalacion.prompt();
      await instalacion.userChoice;
    } catch {
      setError("No se pudo abrir la instalación. Probá desde el menú del navegador.");
    } finally {
      setInstalacion(null);
      setInstalando(false);
    }
  }

  async function actualizar() {
    if (ocupado || actualizando) return;
    setActualizando(true);
    recargaSolicitada.current = true;
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (ocupadoActual.current) {
        recargaSolicitada.current = false;
        setActualizando(false);
        return;
      }
      if (registration?.waiting) await updateServiceWorker(true);
      else window.location.reload(); // Otra pestaña ya pudo haber activado la versión.
    } catch {
      recargaSolicitada.current = false;
      setActualizando(false);
      setError("No se pudo actualizar. Reintentá cuando tengas conexión.");
    }
  }

  return (
    <aside className="pwa" aria-label="Aplicación y conexión">
      <div className="pwa__estado" role="status">
        {!online ? "Sin internet. Podés abrir un informe local; resolver necesita conexión." : disponibleOffline ? "App disponible sin conexión. Resolver necesita internet." : instalada ? "QuickDrop instalada. Resolver necesita internet." : "Instalá QuickDrop para abrirlo desde tu pantalla de inicio."}
      </div>
      {!instalada && (instalacion ? (
        <button type="button" className="boton boton--tonal" disabled={instalando} onClick={() => void instalar()}>Instalar app</button>
      ) : (
        <details className="pwa__instalar">
          <summary>Cómo instalar</summary>
          <p>En Android o escritorio, abrí el menú del navegador y elegí «Instalar app». En iPhone o iPad, usá Compartir → Agregar a inicio y abrí la app desde su ícono.</p>
        </details>
      ))}
      {actualizacion && (
        <div className="pwa__actualizacion" role="status">
          <p>Hay una versión nueva.{ocupado ? " Podés actualizar cuando termine la resolución." : hayInforme ? " Descargá el plan antes de actualizar: se recargará la app y se cerrará el informe." : " Actualizá cuando quieras."}</p>
          <button type="button" className="boton boton--tonal" disabled={ocupado || actualizando} onClick={() => void actualizar()}>{actualizando ? "Actualizando…" : "Actualizar app"}</button>
          <button type="button" className="boton boton--texto" disabled={actualizando} onClick={() => setActualizacion(false)}>Más tarde</button>
        </div>
      )}
      {error && <p className="pwa__error" role="status">{error}</p>}
      <Notificaciones />
    </aside>
  );
}
