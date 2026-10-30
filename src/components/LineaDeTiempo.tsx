import { useState } from "react";
import { colorVehiculo } from "../colores";
import { aHora } from "../tipos";
import type { Dataset, Visita } from "../tipos";

// Una fila por vehículo: tramos de viaje (claros), entregas (sólidas) y recargas en el depósito
// (rayadas). La línea vertical es el makespan: lo define el vehículo que vuelve último.
export function LineaDeTiempo({ dataset, visitas, resaltado, onResaltar }: {
  dataset: Dataset;
  visitas: Visita[];
  resaltado: string | null;
  onResaltar: (v: string | null) => void;
}) {
  const [hover, setHover] = useState<{ v: Visita; desde: number; fila: number } | null>(null);
  const inicio = dataset.mundo.horaSalida;
  const usados = [...new Set(visitas.map((v) => v.vehiculo))];
  if (usados.length === 0) return <p className="vacio">Ningún vehículo salió.</p>;

  const fin = Math.max(...visitas.map((v) => v.salida));
  const ancho = 560;
  const izq = 44;
  const der = 14;
  const fila = 30;
  const alto = usados.length * fila + 30;
  const x = (m: number) => izq + ((m - inicio) / Math.max(1, fin - inicio)) * (ancho - izq - der);
  const paso = [15, 30, 60, 120].find((p) => (fin - inicio) / p <= 6) ?? 240;
  const ticks = [];
  for (let m = inicio; m <= fin; m += paso) ticks.push(m);

  return (
    <figure className="grafico">
      <div className="leyenda">
        <span><i className="leyenda__barra leyenda__barra--viaje" /> Viajando</span>
        <span><i className="leyenda__barra" /> Entregando</span>
        <span><i className="leyenda__barra leyenda__barra--recarga" /> Recarga en depósito</span>
      </div>
      <div className="grafico__lienzo">
        <svg viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label="Línea de tiempo de cada vehículo">
          <defs>
            <pattern id="rayado" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#e1e0d9" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#898781" strokeWidth="2" />
            </pattern>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={4} y2={alto - 22} className="grafico__grilla" />
              <text x={x(t)} y={alto - 6} className="grafico__tick" textAnchor="middle">{aHora(t)}</text>
            </g>
          ))}
          {usados.map((id, fi) => {
            const color = colorVehiculo(dataset.vehiculos, id);
            const y = 8 + fi * fila;
            const propias = visitas.filter((v) => v.vehiculo === id);
            let desde = inicio;
            return (
              <g key={id} opacity={resaltado && resaltado !== id ? 0.25 : 1} onMouseEnter={() => onResaltar(id)} onMouseLeave={() => { onResaltar(null); setHover(null); }}>
                <text x={0} y={y + 15} className="gantt__etiqueta">{id}</text>
                {propias.map((v, i) => {
                  const salida = desde;
                  desde = v.salida;
                  return (
                    <g key={i} onMouseEnter={() => setHover({ v, desde: salida, fila: fi })}>
                      <rect x={x(salida)} y={y + 7} width={Math.max(0, x(v.llegada) - x(salida) - 1)} height={8} rx={2} fill={color} opacity={0.3} />
                      {v.salida > v.llegada && (
                        <rect x={x(v.llegada)} y={y + 2} width={Math.max(1.5, x(v.salida) - x(v.llegada) - 1)} height={18} rx={2} fill={v.estado === "RECARGA" ? "url(#rayado)" : color} />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
          <line x1={x(fin)} x2={x(fin)} y1={0} y2={alto - 22} className="gantt__makespan" />
        </svg>
        {hover && (
          <div className="tooltip" style={{ left: `${(x(hover.v.llegada) / ancho) * 100}%`, top: `${((8 + hover.fila * fila) / alto) * 100}%` }}>
            <strong>{hover.v.vehiculo} · {hover.v.estado === "ENTREGADO" ? `pedido ${hover.v.parada}` : hover.v.estado === "RECARGA" ? "recarga" : "vuelta al depósito"}</strong>
            <span>Sale {aHora(hover.desde)} · llega {aHora(hover.v.llegada)}</span>
            <span>{hover.v.cuadras} cuadras{hover.v.salida > hover.v.llegada ? ` · libre ${aHora(hover.v.salida)}` : ""}</span>
          </div>
        )}
      </div>
      <figcaption>Makespan: {fin - inicio} min (vuelve el último a las {aHora(fin)})</figcaption>
    </figure>
  );
}
