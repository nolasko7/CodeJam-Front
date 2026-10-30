import { useState } from "react";
import type { Archivos } from "../api";
import { colorVehiculo } from "../colores";
import { aHora, formatear } from "../tipos";
import type { Dataset, Informe } from "../tipos";
import { CargaDataset } from "./CargaDataset";
import { LineaDeTiempo } from "./LineaDeTiempo";
import { MapaGrilla } from "./MapaGrilla";

// Ubicaciones y pedidos premium del ejemplo oficial del Evento 1 (se muestran antes de resolver).
const ejemplo: Dataset = {
  mundo: { ancho: 20, alto: 20, deposito: { x: 0, y: 0 }, horaSalida: 480, tiempoServicio: 5, tiempoCarga: 10, minPorCuadra: 3, costos: { porCuadra: 3, porVehiculo: 60, porMinutoTotal: 1, porFalla: 200, porMinutoPremium: 1 } },
  pedidos: [
    { id: 1, x: 3, y: 4, peso: 8 }, { id: 2, x: 6, y: 2, peso: 12, premium: true },
    { id: 3, x: 10, y: 10, peso: 20 }, { id: 4, x: 15, y: 3, peso: 5 },
    { id: 5, x: 2, y: 15, peso: 18 }, { id: 6, x: 12, y: 17, peso: 7, premium: true },
    { id: 7, x: 18, y: 18, peso: 25 }, { id: 8, x: 7, y: 9, peso: 10 },
    { id: 9, x: 16, y: 11, peso: 14 }, { id: 10, x: 4, y: 7, peso: 6 },
  ],
  vehiculos: [{ id: "V1" }, { id: "V2" }, { id: "V3" }],
};

interface Props {
  informe: Informe | null;
  cargando: boolean;
  error: string | null;
  onResolver: (archivos: Archivos, iteraciones: number) => void;
  onInforme: (informe: Informe) => void;
  onError: (mensaje: string) => void;
  onVerEtapas: () => void;
}

interface EntregaPremium {
  pedido: number;
  vehiculo: string;
  parada: number;
  llegada: number;
  demora: number;
  costo: number;
}

/** Cada premium entregado, con cuánto esperó y cuánto suma al costo (igual que el simulador). */
function entregasPremium(informe: Informe): EntregaPremium[] {
  const { mundo, pedidos } = informe.dataset;
  const premium = new Set(pedidos.filter((p) => p.premium).map((p) => p.id));
  const porMinuto = mundo.costos.porMinutoPremium ?? 1;
  const paradas = new Map<string, number>();
  const entregas: EntregaPremium[] = [];
  for (const v of informe.evaluacion.visitas) {
    if (v.estado !== "ENTREGADO") continue;
    const parada = (paradas.get(v.vehiculo) ?? 0) + 1;
    paradas.set(v.vehiculo, parada);
    if (typeof v.parada !== "number" || !premium.has(v.parada)) continue;
    const demora = v.llegada - mundo.horaSalida;
    entregas.push({ pedido: v.parada, vehiculo: v.vehiculo, parada, llegada: v.llegada, demora, costo: demora * porMinuto });
  }
  return entregas.sort((a, b) => a.llegada - b.llegada);
}

export function DesafioPremium({ informe, cargando, error, onResolver, onInforme, onError, onVerEtapas }: Props) {
  const [resaltado, setResaltado] = useState<string | null>(null);
  const ev = informe?.evaluacion;
  const m = ev?.metricas;
  const dataset = informe?.dataset ?? ejemplo;
  const premiumIds = new Set(dataset.pedidos.filter((p) => p.premium).map((p) => p.id));
  const hayPremium = premiumIds.size > 0;
  const porMinuto = dataset.mundo.costos.porMinutoPremium ?? 1;
  const final = informe?.etapas[informe.etapas.length - 1]?.instantanea ?? null;
  const entregas = informe ? entregasPremium(informe) : [];

  const estado = cargando
    ? "Resolviendo…"
    : !informe
      ? "Pendiente de cálculo"
      : hayPremium
        ? `Calculado · costo total ${formatear(ev!.costo.total)}`
        : "Este dataset no tiene premium";

  return (
    <div className="desafio">
      <section className="panel desafio__intro" aria-labelledby="desafio-titulo">
        <div>
          <span className="eyebrow">Desafío 1 · Evento 1</span>
          <h2 id="desafio-titulo">Cliente prioritario</h2>
          <p>Los pedidos premium suman un costo según el tiempo que esperan desde la salida hasta su entrega. Entregarlos antes puede reducir el costo, aunque no necesariamente irán primero.</p>
        </div>
        <div className="desafio__aviso">
          <strong>Cómo se calcula</strong>
          <span>
            Costo premium = costo por minuto premium × Σ minutos desde la salida hasta que empieza la entrega de cada premium entregado.
            Un premium sin entregar no suma minutos: paga la falla.
          </span>
        </div>
      </section>

      <CargaDataset cargando={cargando} onResolver={onResolver} onInforme={onInforme} onError={onError} />
      {error && <div className="error" role="alert">{error}</div>}

      <section className="panel" aria-labelledby="premium-resumen">
        <div className="desafio__cabecera">
          <div><span className="eyebrow">Resultado del plan</span><h2 id="premium-resumen">Seguimiento premium</h2></div>
          <span className="desafio__estado" role="status" aria-live="polite">{estado}</span>
        </div>
        <div className="premium-metricas">
          <div>
            <span>Premium entregados</span>
            <strong>{m ? `${m.premiumEntregados ?? 0} / ${m.premiumTotal ?? 0}` : "— / —"}</strong>
            <small>Entregados del total</small>
          </div>
          <div>
            <span>Espera acumulada</span>
            <strong>{m ? `${formatear(m.minutosPremium ?? 0)} min` : "— min"}</strong>
            <small>
              Desde la salida hasta cada entrega
              {m && (m.premiumEntregados ?? 0) > 0 && ` · promedio ${Math.round((m.minutosPremium ?? 0) / (m.premiumEntregados ?? 1))} min`}
            </small>
          </div>
          <div>
            <span>Costo premium</span>
            <strong>{ev ? formatear(ev.costo.premium ?? 0) : "—"}</strong>
            <small>
              Espera acumulada × costo por minuto
              {ev && ev.costo.total > 0 && ` · ${Math.round(((ev.costo.premium ?? 0) / ev.costo.total) * 100)}% del total`}
            </small>
          </div>
        </div>
        <div className="premium-formula">
          <span>★</span>
          <div>
            <strong>Desglose de costo · Premium</strong>
            <p>
              {m ? formatear(m.minutosPremium ?? 0) : "—"} min de espera × {informe ? porMinuto : "—"} por minuto = <b>{ev ? formatear(ev.costo.premium ?? 0) : "—"}</b>
            </p>
          </div>
        </div>
        {informe && (
          <div className="desafio__acciones">
            <button type="button" className="boton boton--texto" onClick={onVerEtapas}>Ver cómo se llegó a este plan, etapa por etapa →</button>
          </div>
        )}
      </section>

      <section className="panel" aria-labelledby="premium-mapa">
        <div className="desafio__cabecera">
          <div>
            <span className="eyebrow">{informe ? "Plan resuelto" : "Ejemplo del simulador"}</span>
            <h2 id="premium-mapa">Pedidos en el mapa</h2>
          </div>
          <span className="premium-insignia">★ {premiumIds.size} {premiumIds.size === 1 ? "pedido premium" : "pedidos premium"}</span>
        </div>
        <p className="panel__ayuda">
          Tocá un pedido o seleccionalo con el teclado para ver su detalle. La estrella identifica a los premium
          {informe ? "; en el detalle ves a qué hora llega y cuánto suma su demora." : "."}
        </p>
        <div className="desafio__mapa">
          <MapaGrilla dataset={dataset} instantanea={final} resaltado={resaltado} onResaltar={setResaltado} mostrarPremium />
        </div>
        <div className="leyenda desafio__leyenda">
          <span><b className="premium-estrella">★</b> Pedido premium</span>
          {final ? (
            final.rutas.map((r) => (
              <span key={r.vehiculo}><i className="leyenda__punto" style={{ background: colorVehiculo(dataset.vehiculos, r.vehiculo) }} /> {r.vehiculo}</span>
            ))
          ) : (
            <span><i className="leyenda__punto leyenda__punto--hueco" /> Pedido estándar</span>
          )}
        </div>
      </section>

      <div className="grilla-2">
        <section className="panel" aria-labelledby="premium-tiempo">
          <span className="eyebrow">Línea de tiempo</span><h2 id="premium-tiempo">Cuándo llega cada pedido</h2>
          <p className="panel__ayuda">Las entregas premium tienen una estrella: cuanto más a la izquierda, menos cuestan.</p>
          {informe && ev ? (
            <LineaDeTiempo dataset={informe.dataset} visitas={ev.visitas} resaltado={resaltado} onResaltar={setResaltado} />
          ) : (
            <div className="premium-vacio"><span aria-hidden="true">★</span><div><strong>Esperando un plan</strong><p>Los horarios aparecerán cuando se resuelva el desafío.</p></div></div>
          )}
        </section>
        <section className="panel" aria-labelledby="premium-plan">
          <span className="eyebrow">Plan de reparto</span><h2 id="premium-plan">Orden de las paradas</h2>
          <p className="panel__ayuda">Cada ruta distingue sus pedidos premium (★) para reconocerlos en el orden de entrega.</p>
          {informe ? (
            <ul className="plan">
              {informe.plan.rutas.map((r) => (
                <li key={r.vehiculo}>
                  <span className="plan__vehiculo"><i style={{ background: colorVehiculo(dataset.vehiculos, r.vehiculo) }} />{r.vehiculo}</span>
                  <span className="plan__paradas">
                    {["D", ...r.paradas.map((p) => (p === "DEPOSITO" ? "D" : premiumIds.has(p) ? `${p}★` : String(p))), "D"].join(" → ")}
                  </span>
                </li>
              ))}
              {ev && ev.sinAsignar.length > 0 && (
                <li><span className="plan__vehiculo">Sin asignar</span><span className="plan__paradas">{ev.sinAsignar.join(", ")} (fallan)</span></li>
              )}
            </ul>
          ) : (
            <div className="premium-vacio"><span aria-hidden="true">★</span><div><strong>Esperando un plan</strong><p>Las rutas y sus paradas aparecerán acá.</p></div></div>
          )}
        </section>
      </div>

      {entregas.length > 0 && (
        <section className="panel" aria-labelledby="premium-detalle">
          <span className="eyebrow">Detalle</span><h2 id="premium-detalle">Cada entrega premium</h2>
          <p className="panel__ayuda">Ordenadas por hora de llegada. La suma de la última columna es el costo premium del plan.</p>
          <div className="tabla-datos">
            <table>
              <thead>
                <tr><th>Pedido</th><th>Vehículo</th><th>Parada n.º</th><th>Llega</th><th>Demora</th><th>Costo</th></tr>
              </thead>
              <tbody>
                {entregas.map((e) => (
                  <tr key={e.pedido}>
                    <td>{e.pedido} ★</td>
                    <td>{e.vehiculo}</td>
                    <td>{e.parada}</td>
                    <td>{aHora(e.llegada)}</td>
                    <td>{e.demora} min</td>
                    <td>{formatear(e.costo)}</td>
                  </tr>
                ))}
                <tr className="fila-elegida">
                  <td colSpan={4}>Total</td>
                  <td>{formatear(entregas.reduce((a, e) => a + e.demora, 0))} min</td>
                  <td>{formatear(entregas.reduce((a, e) => a + e.costo, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
