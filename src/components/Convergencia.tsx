import { useState } from "react";
import type { PointerEvent } from "react";
import { formatear } from "../tipos";
import type { PuntoConvergencia } from "../tipos";

// Recocido simulado: el costo "actual" sube y baja (acepta empeoramientos mientras hace
// calor) y el "mejor" solo baja. Al enfriarse, las dos curvas se juntan.
export function Convergencia({ puntos }: { puntos: PuntoConvergencia[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (puntos.length < 2) return <p className="vacio">El recocido no corrió (0 iteraciones).</p>;

  const ancho = 560;
  const alto = 220;
  const izq = 52;
  const abajo = 26;
  const arriba = 10;
  const der = 12;
  const maxIt = puntos[puntos.length - 1].iteracion;
  const min = Math.min(...puntos.map((p) => p.mejor));
  const max = Math.max(...puntos.map((p) => p.actual));
  const rango = Math.max(1, max - min);
  const x = (it: number) => izq + (it / maxIt) * (ancho - izq - der);
  const y = (v: number) => arriba + (1 - (v - min) / rango) * (alto - arriba - abajo);
  const linea = (clave: "actual" | "mejor") => puntos.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.iteracion).toFixed(1)} ${y(p[clave]).toFixed(1)}`).join(" ");
  const ticksY = Array.from({ length: 4 }, (_, i) => min + (rango * i) / 3);

  function mover(e: PointerEvent<SVGSVGElement>) {
    const caja = e.currentTarget.getBoundingClientRect();
    const it = (((e.clientX - caja.left) / caja.width) * ancho - izq) / (ancho - izq - der) * maxIt;
    let cerca = 0;
    puntos.forEach((p, i) => {
      if (Math.abs(p.iteracion - it) < Math.abs(puntos[cerca].iteracion - it)) cerca = i;
    });
    setHover(cerca);
  }

  const h = hover !== null ? puntos[hover] : null;
  return (
    <figure className="grafico">
      <div className="leyenda">
        <span><i className="leyenda__linea leyenda__linea--suave" /> Costo actual</span>
        <span><i className="leyenda__linea" /> Mejor encontrado</span>
      </div>
      <div className="grafico__scroll" role="region" aria-label="Convergencia, desplazable horizontalmente" tabIndex={0}>
      <div className="grafico__lienzo">
        <svg viewBox={`0 0 ${ancho} ${alto}`} role="img" tabIndex={0} aria-label="Convergencia del recocido simulado. Usá las flechas para recorrer las iteraciones." onPointerDown={mover} onPointerMove={mover} onPointerLeave={(e) => { if (e.pointerType === "mouse") setHover(null); }} onFocus={() => setHover(0)} onBlur={() => setHover(null)} onKeyDown={(e) => { if (e.key === "Escape") setHover(null); if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); setHover((actual) => Math.max(0, Math.min(puntos.length - 1, (actual ?? 0) + (e.key === "ArrowRight" ? 1 : -1)))); } }}>
          {ticksY.map((t) => (
            <g key={t}>
              <line x1={izq} x2={ancho - der} y1={y(t)} y2={y(t)} className="grafico__grilla" />
              <text x={izq - 8} y={y(t) + 4} className="grafico__tick" textAnchor="end">{formatear(t)}</text>
            </g>
          ))}
          <line x1={izq} x2={ancho - der} y1={alto - abajo} y2={alto - abajo} className="grafico__base" />
          <text x={izq} y={alto - 6} className="grafico__tick">0</text>
          <text x={ancho - der} y={alto - 6} className="grafico__tick" textAnchor="end">{formatear(maxIt)} iteraciones</text>
          <path d={linea("actual")} className="convergencia__actual" />
          <path d={linea("mejor")} className="convergencia__mejor" />
          {h && (
            <g>
              <line x1={x(h.iteracion)} x2={x(h.iteracion)} y1={arriba} y2={alto - abajo} className="grafico__cursor" />
              <circle cx={x(h.iteracion)} cy={y(h.mejor)} r={4.5} className="convergencia__marca" />
            </g>
          )}
        </svg>
      </div>
      </div>
        {h && (
          <div className="tooltip" role="status">
            <strong>Iteración {formatear(h.iteracion)}</strong>
            <span>Actual {formatear(h.actual)}</span>
            <span>Mejor {formatear(h.mejor)}</span>
            <span>Temperatura {h.temperatura.toFixed(1)}</span>
          </div>
        )}
    </figure>
  );
}
