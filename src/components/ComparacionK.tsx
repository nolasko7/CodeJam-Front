import { useState } from "react";
import { formatear } from "../tipos";
import type { ResultadoPorK } from "../tipos";

// Para cada k: dónde arrancó (ruta inicial) y dónde terminó (después de optimizar).
// La línea entre los dos puntos es lo que aportaron las etapas 4 a 6.
export function ComparacionK({ porK }: { porK: ResultadoPorK[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const valores = porK.flatMap((r) => [r.construccion, r.final]);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = Math.max(1, max - min);
  const ancho = 560;
  const fila = 40;
  const izq = 108;
  const der = 70;
  const alto = porK.length * fila + 34;
  const x = (v: number) => izq + ((v - (min - rango * 0.05)) / (rango * 1.1)) * (ancho - izq - der);
  const ticks = Array.from({ length: 4 }, (_, i) => min + (rango * i) / 3);

  return (
    <figure className="grafico">
      <div className="leyenda">
        <span><i className="leyenda__punto leyenda__punto--hueco" /> Ruta inicial (etapa 3)</span>
        <span><i className="leyenda__punto" /> Final (etapa 6)</span>
      </div>
      <div className="grafico__lienzo">
        <svg viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label="Costo por cantidad de vehículos">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={6} y2={alto - 24} className="grafico__grilla" />
              <text x={x(t)} y={alto - 8} className="grafico__tick" textAnchor="middle">{formatear(t)}</text>
            </g>
          ))}
          {porK.map((r, i) => {
            const y = 22 + i * fila;
            return (
              <g key={r.k} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={r.elegido ? "dumbbell dumbbell--elegido" : "dumbbell"}>
                <rect x={0} y={y - fila / 2} width={ancho} height={fila} className="dumbbell__zona" />
                <text x={0} y={y + 4} className="dumbbell__etiqueta">
                  {r.k === 1 ? "1 vehículo" : `hasta ${r.k}`}
                </text>
                <line x1={x(r.construccion)} x2={x(r.final)} y1={y} y2={y} className="dumbbell__linea" />
                <circle cx={x(r.construccion)} cy={y} r={5} className="dumbbell__inicio" />
                <circle cx={x(r.final)} cy={y} r={6} className="dumbbell__final" />
                <text x={ancho - der + 10} y={y + 4} className="dumbbell__valor">
                  {formatear(r.final)}{r.elegido ? " ✓" : ""}
                </text>
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div className="tooltip" style={{ top: `${((22 + hover * fila) / alto) * 100}%`, left: "50%" }}>
            <strong>{porK[hover].k === 1 ? "1 vehículo" : `Hasta ${porK[hover].k} vehículos`}</strong>
            <span>Usó {porK[hover].vehiculosUsados}</span>
            <span>Ruta inicial {formatear(porK[hover].construccion)} ({porK[hover].metodo === "kmeans" ? "k-means" : "barrido"})</span>
            <span>Búsqueda local {formatear(porK[hover].busquedaLocal)}</span>
            <span>Recocido {formatear(porK[hover].recocido)}</span>
            <span>Final {formatear(porK[hover].final)}</span>
          </div>
        )}
      </div>
      <details className="tabla-datos">
        <summary>Ver tabla</summary>
        <table>
          <thead>
            <tr><th>k</th><th>k-means</th><th>Barrido</th><th>Ruta inicial</th><th>Búsq. local</th><th>Recocido</th><th>Final</th><th>Usados</th></tr>
          </thead>
          <tbody>
            {porK.map((r) => (
              <tr key={r.k} className={r.elegido ? "fila-elegida" : undefined}>
                <td>{r.k}</td><td>{formatear(r.costoKmeans)}</td><td>{formatear(r.costoBarrido)}</td><td>{formatear(r.construccion)}</td>
                <td>{formatear(r.busquedaLocal)}</td><td>{formatear(r.recocido)}</td><td>{formatear(r.final)}</td><td>{r.vehiculosUsados}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
