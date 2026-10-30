import { useState } from "react";
import { colorVehiculo } from "../colores";
import type { Dataset, Instantanea, Punto } from "../tipos";

const CELDA = 28;
const MARGEN = 28;

interface Props {
  dataset: Dataset;
  instantanea: Instantanea | null;
  resaltado: string | null;
  onResaltar: (vehiculo: string | null) => void;
}

interface InfoPedido {
  vehiculo: string | null;
  orden: number | null;
  viaje: number;
}

export function MapaGrilla({ dataset, instantanea, resaltado, onResaltar }: Props) {
  const { mundo, pedidos, vehiculos } = dataset;
  const [hover, setHover] = useState<number | null>(null);
  const ancho = MARGEN * 2 + (mundo.ancho - 1) * CELDA;
  const alto = MARGEN * 2 + (mundo.alto - 1) * CELDA;
  const px = (x: number) => MARGEN + x * CELDA;
  const py = (y: number) => MARGEN + (mundo.alto - 1 - y) * CELDA; // y crece hacia arriba
  const rutas = instantanea?.rutas ?? [];

  // A qué vehículo y en qué orden va cada pedido en esta etapa.
  const info = new Map<number, InfoPedido>();
  for (const ruta of rutas) {
    let orden = 0;
    let viaje = 1;
    for (const p of ruta.paradas) {
      if (p === "DEPOSITO") {
        viaje++;
        continue;
      }
      info.set(p, { vehiculo: ruta.vehiculo, orden: instantanea?.ordenada ? ++orden : null, viaje });
    }
  }
  const sinAsignar = new Set(instantanea?.sinAsignar ?? []);
  const indice = (id: string) => vehiculos.findIndex((v) => v.id === id);

  // Recorrido Manhattan: primero horizontal y después vertical. Un pequeño desfase por
  // vehículo evita que dos rutas por la misma calle se tapen.
  function camino(puntos: Punto[], desfase: number): string {
    return puntos
      .map((p, i) => {
        const x = px(p.x) + desfase;
        const y = py(p.y) + desfase;
        return i === 0 ? `M${x} ${y}` : `H${x} V${y}`;
      })
      .join(" ");
  }

  const pedidoPorId = new Map(pedidos.map((p) => [p.id, p]));
  const hoverInfo = hover !== null ? info.get(hover) : undefined;
  const hoverPedido = hover !== null ? pedidoPorId.get(hover) : undefined;

  return (
    <div className="mapa">
      <svg viewBox={`0 0 ${ancho} ${alto}`} role="group" aria-label="Mapa de la grilla. Tocá un pedido o usá Tab para ver su detalle.">
        {Array.from({ length: mundo.ancho }, (_, x) => (
          <line key={`v${x}`} x1={px(x)} x2={px(x)} y1={py(0)} y2={py(mundo.alto - 1)} className="mapa__calle" />
        ))}
        {Array.from({ length: mundo.alto }, (_, y) => (
          <line key={`h${y}`} y1={py(y)} y2={py(y)} x1={px(0)} x2={px(mundo.ancho - 1)} className="mapa__calle" />
        ))}
        {Array.from({ length: mundo.ancho }, (_, x) => x % 5 === 0 && (
          <text key={`tx${x}`} x={px(x)} y={alto - 8} className="mapa__eje">{x}</text>
        ))}
        {Array.from({ length: mundo.alto }, (_, y) => y % 5 === 0 && (
          <text key={`ty${y}`} x={10} y={py(y) + 4} className="mapa__eje">{y}</text>
        ))}

        {instantanea?.ordenada && rutas.map((ruta) => {
          const color = colorVehiculo(vehiculos, ruta.vehiculo);
          const desfase = (indice(ruta.vehiculo) - (vehiculos.length - 1) / 2) * 2.5;
          const puntos: Punto[] = [mundo.deposito, ...ruta.paradas.map((p) => (p === "DEPOSITO" ? mundo.deposito : pedidoPorId.get(p)!))];
          const atenuada = resaltado !== null && resaltado !== ruta.vehiculo;
          return (
            <g key={ruta.vehiculo} opacity={atenuada ? 0.12 : 1} onMouseEnter={() => onResaltar(ruta.vehiculo)} onMouseLeave={() => onResaltar(null)}>
              <path d={camino(puntos, desfase)} stroke={color} className="mapa__ruta" />
              <path d={camino([puntos[puntos.length - 1], mundo.deposito], desfase)} stroke={color} className="mapa__ruta mapa__ruta--regreso" />
            </g>
          );
        })}

        {instantanea?.centros?.map((c, i) => (
          <g key={`c${i}`} className="mapa__centro" transform={`translate(${px(c.x)} ${py(c.y)})`}>
            <path d="M-6 -6 L6 6 M6 -6 L-6 6" />
          </g>
        ))}

        {pedidos.map((p) => {
          const i = info.get(p.id);
          const fallido = sinAsignar.has(p.id);
          const color = i?.vehiculo ? colorVehiculo(vehiculos, i.vehiculo) : "#fcfcfb";
          const atenuado = resaltado !== null && i?.vehiculo !== resaltado;
          return (
            <g
              key={p.id}
              transform={`translate(${px(p.x)} ${py(p.y)})`}
              opacity={atenuado ? 0.25 : 1}
              tabIndex={0}
              role="button"
              aria-label={`Pedido ${p.id}, ${p.peso} kg. Ver detalle.`}
              onPointerEnter={(e) => { if (e.pointerType === "mouse") setHover(p.id); }}
              onPointerLeave={(e) => { if (e.pointerType === "mouse") setHover(null); }}
              onClick={() => setHover(p.id)}
              onFocus={() => setHover(p.id)}
              onBlur={() => setHover(null)}
              onKeyDown={(e) => { if (e.key === "Escape") setHover(null); if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setHover(p.id); } }}
              className="mapa__pedido"
            >
              <circle r={14} fill="transparent" />
              <circle r={9.5} fill={color} className={fallido ? "mapa__punto mapa__punto--fallido" : "mapa__punto"} />
              <text y={3.5} className={i?.vehiculo ? "mapa__id" : "mapa__id mapa__id--oscuro"}>{p.id}</text>
            </g>
          );
        })}

        <g transform={`translate(${px(mundo.deposito.x)} ${py(mundo.deposito.y)})`} className="mapa__deposito">
          <rect x={-11} y={-11} width={22} height={22} rx={5} />
          <text y={4.5}>D</text>
        </g>
      </svg>

      {hoverPedido && (
        <div className="mapa__tooltip" style={{ left: `${(px(hoverPedido.x) / ancho) * 100}%`, top: `${(py(hoverPedido.y) / alto) * 100}%` }}>
          <strong>Pedido {hoverPedido.id}</strong>
          <span>({hoverPedido.x}, {hoverPedido.y}) · {hoverPedido.peso} kg</span>
          {sinAsignar.has(hoverPedido.id) && <span>Sin asignar: falla</span>}
          {hoverInfo?.vehiculo && (
            <span>
              {hoverInfo.vehiculo}
              {hoverInfo.orden !== null && ` · parada ${hoverInfo.orden}`}
              {hoverInfo.viaje > 1 && ` · viaje ${hoverInfo.viaje}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
