import { useId } from "react";
import { MapaGrilla } from "../components/MapaGrilla";
import type { Dataset, Instantanea, RutaPlan } from "../tipos";

// K-means y barrido angular lado a lado, sobre el mismo ejemplo. El barrido se dibuja con las
// líneas de corte que salen del depósito: cada rebanada es un vehículo.

const CELDA = 28; // mismas medidas que MapaGrilla, para que las líneas calcen con su mapa
const MARGEN = 28;
const DOS_PI = Math.PI * 2;

/** Ángulos donde el barrido corta: entre dos pedidos vecinos (por ángulo) de grupos distintos. */
function angulosDeCorte(dataset: Dataset, rutas: RutaPlan[]): number[] {
  const { deposito } = dataset.mundo;
  const grupo = new Map<number, number>();
  rutas.forEach((r, g) => r.paradas.forEach((p) => typeof p === "number" && grupo.set(p, g)));
  const orden = dataset.pedidos
    .map((p) => ({ id: p.id, angulo: Math.atan2(p.y - deposito.y, p.x - deposito.x) }))
    .sort((a, b) => a.angulo - b.angulo);
  const cortes: number[] = [];
  orden.forEach((a, i) => {
    const b = orden[(i + 1) % orden.length];
    if (grupo.get(a.id) === grupo.get(b.id)) return;
    const salto = (((b.angulo - a.angulo) % DOS_PI) + DOS_PI) % DOS_PI;
    cortes.push(a.angulo + salto / 2);
  });
  return cortes;
}

function Cortes({ dataset, angulos }: { dataset: Dataset; angulos: number[] }) {
  const { mundo } = dataset;
  const idRecorte = useId().replace(/:/g, "");
  const ancho = MARGEN * 2 + (mundo.ancho - 1) * CELDA;
  const alto = MARGEN * 2 + (mundo.alto - 1) * CELDA;
  const px = (x: number) => MARGEN + x * CELDA;
  const py = (y: number) => MARGEN + (mundo.alto - 1 - y) * CELDA;
  const c = { x: px(mundo.deposito.x), y: py(mundo.deposito.y) };
  return (
    <svg className="comparacion__cortes" viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true">
      <defs>
        <clipPath id={idRecorte}>
          <rect x={px(0)} y={py(mundo.alto - 1)} width={(mundo.ancho - 1) * CELDA} height={(mundo.alto - 1) * CELDA} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${idRecorte})`}>
        {angulos.map((a, i) => (
          <line key={i} x1={c.x} y1={c.y} x2={c.x + 2000 * Math.cos(a)} y2={c.y - 2000 * Math.sin(a)} className="comparacion__corte" />
        ))}
      </g>
    </svg>
  );
}

interface Props {
  dataset: Dataset;
  kmeans: Instantanea | null;
  barrido: { rutas: RutaPlan[] };
}

export function ComparacionAgrupamiento({ dataset, kmeans, barrido }: Props) {
  const sinResaltar = { resaltado: null, onResaltar: () => {} };
  const instantaneaBarrido: Instantanea = { ordenada: false, rutas: barrido.rutas, sinAsignar: [], costo: null, metricas: null };
  return (
    <div className="comparacion">
      <figure className="comparacion__col">
        <figcaption className="comparacion__titulo">K-MEANS</figcaption>
        <div className="comparacion__mapa">
          <MapaGrilla dataset={dataset} instantanea={kmeans} {...sinResaltar} />
        </div>
        <p>Agrupa por cercanía.</p>
      </figure>
      <figure className="comparacion__col">
        <figcaption className="comparacion__titulo">BARRIDO ANGULAR</figcaption>
        <div className="comparacion__mapa">
          <MapaGrilla dataset={dataset} instantanea={instantaneaBarrido} {...sinResaltar} />
          <Cortes dataset={dataset} angulos={angulosDeCorte(dataset, barrido.rutas)} />
        </div>
        <p>Corta por ángulo desde el depósito.</p>
      </figure>
    </div>
  );
}
