import { colorVehiculo } from "../colores";
import { formatear } from "../tipos";
import type { Informe } from "../tipos";
import { MapaGrilla } from "./MapaGrilla";

interface Props {
  informe: Informe;
  seleccionada: number;
  onSeleccionar: (numero: number) => void;
  resaltado: string | null;
  onResaltar: (vehiculo: string | null) => void;
}

export function VisorEtapas({ informe, seleccionada, onSeleccionar, resaltado, onResaltar }: Props) {
  const { dataset, etapas } = informe;
  const etapa = etapas.find((e) => e.numero === seleccionada) ?? etapas[etapas.length - 1];
  const inst = etapa.instantanea;
  const anterior = etapas.find((e) => e.numero === etapa.numero - 1)?.instantanea?.costo?.total;

  return (
    <section className="panel" aria-labelledby="etapas-titulo">
      <h2 id="etapas-titulo">2 · Cómo se llegó al plan, etapa por etapa</h2>

      <ol className="pasos">
        {etapas.map((e) => (
          <li key={e.numero}>
            <button type="button" aria-current={e.numero === etapa.numero ? "step" : undefined} onClick={() => onSeleccionar(e.numero)}>
              <span className="pasos__numero">{e.numero}</span>
              <span className="pasos__titulo">{e.titulo}</span>
              <span className="pasos__costo">{e.instantanea?.costo ? formatear(e.instantanea.costo.total) : "—"}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="etapa">
        <div className="etapa__mapa">
          <MapaGrilla dataset={dataset} instantanea={inst} resaltado={resaltado} onResaltar={onResaltar} mostrarPremium />
          {inst && (
            <ul className="leyenda leyenda--vehiculos">
              {inst.rutas.map((r) => (
                <li key={r.vehiculo} onMouseEnter={() => onResaltar(r.vehiculo)} onMouseLeave={() => onResaltar(null)} className={resaltado === r.vehiculo ? "activo" : undefined}>
                  <i style={{ background: colorVehiculo(dataset.vehiculos, r.vehiculo) }} />
                  {r.vehiculo} · {r.paradas.filter((p) => p !== "DEPOSITO").length} pedidos
                </li>
              ))}
              {inst.sinAsignar.length > 0 && <li><i className="sin-asignar" /> Sin asignar · {inst.sinAsignar.length}</li>}
              {inst.centros && <li><span className="cruz">×</span> Centro de k-means</li>}
              {dataset.pedidos.some((p) => p.premium) && <li><span className="estrella">★</span> Premium</li>}
            </ul>
          )}
        </div>

        <div className="etapa__detalle">
          <p className="etapa__numero">Etapa {etapa.numero} de {etapas.length}</p>
          <h3>{etapa.titulo}</h3>
          <p>{etapa.descripcion}</p>
          {inst?.costo && (
            <div className="etapa__costo">
              <span>Costo</span>
              <strong>{formatear(inst.costo.total)}</strong>
              {anterior !== undefined && anterior > inst.costo.total && <em>−{formatear(anterior - inst.costo.total)} vs. etapa anterior</em>}
              {anterior !== undefined && anterior === inst.costo.total && <em>sin cambios: la etapa anterior ya era buena</em>}
            </div>
          )}
          {inst && !inst.ordenada && <p className="etapa__nota">Los grupos todavía no tienen orden de visita, así que no tienen costo. Por eso no hay rutas dibujadas.</p>}
          <dl className="etapa__datos">
            {Object.entries(etapa.detalles).map(([clave, valor]) => (
              <div key={clave}>
                <dt>{clave}</dt>
                <dd>{typeof valor === "number" ? formatear(valor) : valor}</dd>
              </div>
            ))}
            {etapa.ms > 0 && (
              <div>
                <dt>Tiempo de cálculo</dt>
                <dd>{etapa.ms} ms</dd>
              </div>
            )}
          </dl>
          <div className="etapa__nav">
            <button type="button" className="boton boton--texto" disabled={etapa.numero === 1} onClick={() => onSeleccionar(etapa.numero - 1)}>← Anterior</button>
            <button type="button" className="boton boton--texto" disabled={etapa.numero === etapas.length} onClick={() => onSeleccionar(etapa.numero + 1)}>Siguiente →</button>
          </div>
        </div>
      </div>
    </section>
  );
}
