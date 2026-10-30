import { useEffect, useState } from "react";
import { apiDisponible, resolver } from "./api";
import type { Archivos } from "./api";
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
  const [cargando, setCargando] = useState(false);
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

  function mostrar(nuevo: Informe) {
    setInforme(nuevo);
    setEtapa(nuevo.etapas[nuevo.etapas.length - 1].numero);
    setResaltado(null);
    setError(null);
  }

  async function resolverDataset(archivos: Archivos, iteraciones: number) {
    setCargando(true);
    setError(null);
    try {
      mostrar(await resolver(archivos, iteraciones));
      setStatus("online");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo resolver el dataset");
    } finally {
      setCargando(false);
    }
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
      <CargaDataset cargando={cargando} onResolver={resolverDataset} onInforme={mostrar} onError={setError} />
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
