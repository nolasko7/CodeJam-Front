import { useEffect, useState } from "react";
import { apiDisponible, claveInstalacion, consultarTrabajo, crearTrabajo, ErrorApi, guardarTrabajo, obtenerResultado, restaurarTrabajo } from "./api";
import type { Archivos, TrabajoGuardado } from "./api";
import { CargaDataset } from "./components/CargaDataset";
import { ComparacionK } from "./components/ComparacionK";
import { Convergencia } from "./components/Convergencia";
import { ControlesPwa } from "./components/ControlesPwa";
import { DesgloseCosto } from "./components/DesgloseCosto";
import { LineaDeTiempo } from "./components/LineaDeTiempo";
import { VisorEtapas } from "./components/VisorEtapas";
import { colorVehiculo } from "./colores";
import { formatear } from "./tipos";
import type { Informe } from "./tipos";

type Status = "checking" | "online" | "offline";

function descargar(nombre: string, contenido: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

export function App() {
  const [status, setStatus] = useState<Status>("checking");
  const [informe, setInforme] = useState<Informe | null>(null);
  const [trabajo,setTrabajo] = useState<TrabajoGuardado | null>(restaurarTrabajo);
  const [cargando, setCargando] = useState(Boolean(trabajo));
  const [estadoTrabajo,setEstadoTrabajo] = useState("");
  const [revision,setRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [etapa, setEtapa] = useState(6);
  const [resaltado, setResaltado] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void apiDisponible(controller.signal).then((ok) => {
      if (!controller.signal.aborted) setStatus(ok ? "online" : "offline");
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const despertar = () => setRevision(value => value + 1);
    const enfocar = () => { if (document.visibilityState === "visible") despertar(); };
    window.addEventListener("online",despertar);
    document.addEventListener("visibilitychange",enfocar);
    navigator.serviceWorker?.addEventListener("message",despertar);
    return () => {
      window.removeEventListener("online",despertar);
      document.removeEventListener("visibilitychange",enfocar);
      navigator.serviceWorker?.removeEventListener("message",despertar);
    };
  },[]);

  useEffect(() => {
    if (!trabajo) return;
    const controller = new AbortController();
    const signal = controller.signal;
    let timer: ReturnType<typeof setTimeout>;
    let intentos = 0;
    let enviado = !trabajo.solicitud;
    const current = trabajo;

    async function consultar() {
      try {
        if (!enviado) {
          setEstadoTrabajo("Enviando el dataset…");
          await crearTrabajo(current,signal);
          if (signal.aborted) return;
          enviado = true;
          guardarTrabajo({id:current.id});
        }
        const estado = await consultarTrabajo(current.id,signal);
        if (signal.aborted) return;
        setStatus("online");
        intentos = 0;
        if (estado.estado === "completado") {
          const resultado = await obtenerResultado(current.id,signal);
          if (signal.aborted) return;
          mostrar(resultado);
          setCargando(false);
          setEstadoTrabajo("Rutas listas. Podés descargar el plan o recorrer las etapas.");
          return;
        }
        if (estado.estado === "fallido") {
          setCargando(false);
          setError(estado.error ?? "No se pudo resolver el dataset. Podés iniciar un nuevo cálculo.");
          setEstadoTrabajo("");
          return;
        }
        setEstadoTrabajo("Calculando las rutas. Podés cerrar la app; el cálculo continúa y te avisaremos si activaste las notificaciones.");
      } catch (e) {
        if (signal.aborted) return;
        if (e instanceof ErrorApi && e.status >= 400 && e.status < 500 && e.status !== 429) {
          setCargando(false);
          setError(e.message);
          setEstadoTrabajo("");
          if (!enviado) guardarTrabajo(null);
          return;
        }
        intentos++;
        setEstadoTrabajo("No se pudo consultar el trabajo. Se reintentará automáticamente al recuperar la conexión.");
      }
      if (!signal.aborted) timer = setTimeout(() => void consultar(),Math.min(30_000,2_000 * 2 ** Math.min(intentos,4)));
    }
    setCargando(true);
    void consultar();
    return () => { controller.abort(); clearTimeout(timer); };
  },[trabajo,revision]);

  function mostrar(nuevo: Informe) {
    setInforme(nuevo);
    setEtapa(nuevo.etapas[nuevo.etapas.length - 1].numero);
    setResaltado(null);
    setError(null);
  }

  function resolverDataset(archivos: Archivos, iteraciones: number) {
    setError(null);
    try {
      claveInstalacion();
      const nuevo = {id:crypto.randomUUID(),solicitud:{archivos,opciones:{iteraciones}}};
      guardarTrabajo(nuevo);
      const url = new URL(window.location.href);
      url.searchParams.set("trabajo",nuevo.id);
      window.history.replaceState(null,"",url);
      setCargando(true);
      setTrabajo(nuevo);
    } catch (e) {
      setError(e instanceof Error ? `No se pudo guardar el trabajo en este navegador: ${e.message}` : "No se pudo guardar el trabajo. Habilitá el almacenamiento del navegador.");
    }
  }

  function abrirInforme(nuevo: Informe) {
    setTrabajo(null);
    setCargando(false);
    setEstadoTrabajo("");
    mostrar(nuevo);
  }

  const ev = informe?.evaluacion;
  const elegido = informe?.porK.find((r) => r.elegido);

  return (
    <main className="pagina">
      <header className="encabezado">
        <div>
          <span className="eyebrow">CodeJam · QuickDrop</span>
          <h1>Plan de reparto</h1>
          <p className="intro">Subí un dataset, resolvelo y recorré cada etapa del algoritmo: de los grupos iniciales al plan final.</p>
        </div>
        <div className={`connection connection--${status}`} role="status" aria-live="polite">
          <span className="indicator" aria-hidden="true" />
          {{ checking: "Conectando con la API…", online: "API conectada", offline: "API sin conexión" }[status]}
        </div>
      </header>

      <ControlesPwa ocupado={cargando} hayInforme={informe !== null} />
      <CargaDataset cargando={cargando} onResolver={resolverDataset} onInforme={abrirInforme} onError={setError} />
      {estadoTrabajo && <p className="trabajo-estado" role="status">{estadoTrabajo}</p>}
      {error && <div className="error" role="alert">{error}</div>}

      {informe && ev && (
        <>
          <section className="panel resumen" aria-labelledby="resumen-titulo">
            <div className="resumen__total">
              <span className="eyebrow" id="resumen-titulo">Costo total del plan</span>
              <strong>{formatear(ev.costo.total)}</strong>
              <span>
                {ev.metricas.entregados}/{ev.metricas.pedidos} entregados · {ev.metricas.vehiculosUsados} de {informe.dataset.vehiculos.length} vehículos
                {elegido && elegido.k !== ev.metricas.vehiculosUsados ? ` (mejor resultado con hasta ${elegido.k})` : ""}
              </span>
              <div className="resumen__acciones">
                <button type="button" className="boton boton--tonal" onClick={() => descargar("plan.json", JSON.stringify({ rutas: informe.plan.rutas }, null, 2) + "\n", "application/json")}>Descargar plan.json</button>
                <button type="button" className="boton boton--tonal" onClick={() => descargar("plan.csv", informe.planCsv, "text/csv")}>plan.csv</button>
              </div>
            </div>
            <DesgloseCosto costo={ev.costo} metricas={ev.metricas} mundo={informe.dataset.mundo} />
          </section>

          <VisorEtapas informe={informe} seleccionada={etapa} onSeleccionar={setEtapa} resaltado={resaltado} onResaltar={setResaltado} />

          <div className="grilla-2">
            <section className="panel" aria-labelledby="k-titulo">
              <h2 id="k-titulo">3 · ¿Cuántos vehículos conviene usar?</h2>
              <p className="panel__ayuda">Corrimos todas las etapas para cada cantidad máxima de vehículos y nos quedamos con la más barata. Más vehículos bajan el makespan, pero cada uno suma su costo fijo y sus viajes al depósito.</p>
              <ComparacionK porK={informe.porK} />
            </section>
            <section className="panel" aria-labelledby="conv-titulo">
              <h2 id="conv-titulo">4 · Cómo bajó el costo en el recocido</h2>
              <p className="panel__ayuda">Al principio acepta empeorar para explorar; a medida que se enfría solo acepta mejoras. Se muestra el k elegido.</p>
              <Convergencia puntos={informe.convergencia} />
            </section>
          </div>

          <section className="panel" aria-labelledby="tiempo-titulo">
            <h2 id="tiempo-titulo">5 · Qué hace cada vehículo y cuándo</h2>
            <LineaDeTiempo dataset={informe.dataset} visitas={ev.visitas} resaltado={resaltado} onResaltar={setResaltado} />
          </section>

          <section className="panel" aria-labelledby="plan-titulo">
            <h2 id="plan-titulo">6 · El plan que se entrega</h2>
            <ul className="plan">
              {informe.plan.rutas.map((r) => (
                <li key={r.vehiculo}>
                  <span className="plan__vehiculo"><i style={{ background: colorVehiculo(informe.dataset.vehiculos, r.vehiculo) }} />{r.vehiculo}</span>
                  <span className="plan__paradas">{["D", ...r.paradas.map((p) => (p === "DEPOSITO" ? "D" : String(p))), "D"].join(" → ")}</span>
                </li>
              ))}
              {ev.sinAsignar.length > 0 && <li><span className="plan__vehiculo">Sin asignar</span><span className="plan__paradas">{ev.sinAsignar.join(", ")} (fallan)</span></li>}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
