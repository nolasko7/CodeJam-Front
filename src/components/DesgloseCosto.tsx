import { formatear } from "../tipos";
import type { Desglose, Metricas, Mundo } from "../tipos";

// Parte de un todo: una sola barra con los cuatro términos de la fórmula de costo.
const PARTES = [
  { clave: "distancia", nombre: "Distancia", color: "#104281" },
  { clave: "vehiculos", nombre: "Vehículos", color: "#2a78d6" },
  { clave: "tiempo", nombre: "Tiempo (makespan)", color: "#6da7ec" },
  { clave: "fallas", nombre: "Fallas", color: "#b7d3f6" },
] as const;

export function DesgloseCosto({ costo, metricas, mundo }: { costo: Desglose; metricas: Metricas; mundo: Mundo }) {
  const c = mundo.costos;
  const formula: Record<(typeof PARTES)[number]["clave"], string> = {
    distancia: `${metricas.distanciaTotal} cuadras × ${c.porCuadra}`,
    vehiculos: `${metricas.vehiculosUsados} usados × ${c.porVehiculo}`,
    tiempo: `${metricas.makespan} min × ${c.porMinutoTotal}`,
    fallas: `${metricas.fallidos} × ${c.porFalla}`,
  };
  return (
    <div className="desglose">
      <div className="desglose__barra" role="img" aria-label="Desglose del costo total">
        {PARTES.filter((p) => costo[p.clave] > 0).map((p) => (
          <span key={p.clave} style={{ flexGrow: costo[p.clave], background: p.color }} title={`${p.nombre}: ${formatear(costo[p.clave])}`} />
        ))}
      </div>
      <ul className="desglose__lista">
        {PARTES.map((p) => (
          <li key={p.clave}>
            <i style={{ background: p.color }} />
            <span className="desglose__nombre">{p.nombre}</span>
            <span className="desglose__formula">{formula[p.clave]}</span>
            <strong>{formatear(costo[p.clave])}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
