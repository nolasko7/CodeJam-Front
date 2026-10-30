import { formatear } from "../tipos";
import type { Desglose, Metricas, Mundo } from "../tipos";

// Parte de un todo: una sola barra con los términos de la fórmula de costo. La fila premium
// (Evento 1) aparece solo si el dataset tiene pedidos premium.
const PARTES = [
  { clave: "distancia", nombre: "Distancia", color: "#104281" },
  { clave: "vehiculos", nombre: "Vehículos", color: "#2a78d6" },
  { clave: "tiempo", nombre: "Tiempo (makespan)", color: "#6da7ec" },
  { clave: "premium", nombre: "Demora premium", color: "#9ec5f4" },
  { clave: "fallas", nombre: "Fallas", color: "#cde2fb" },
] as const;

export function DesgloseCosto({ costo, metricas, mundo }: { costo: Desglose; metricas: Metricas; mundo: Mundo }) {
  const c = mundo.costos;
  const hayPremium = (metricas.premiumTotal ?? 0) > 0;
  const formula: Record<(typeof PARTES)[number]["clave"], string> = {
    distancia: `${metricas.distanciaTotal} cuadras × ${c.porCuadra}`,
    vehiculos: `${metricas.vehiculosUsados} usados × ${c.porVehiculo}`,
    tiempo: `${metricas.makespan} min × ${c.porMinutoTotal}`,
    premium: `${metricas.minutosPremium ?? 0} min × ${c.porMinutoPremium ?? 1}`,
    fallas: `${metricas.fallidos} × ${c.porFalla}`,
  };
  const partes = PARTES.filter((p) => p.clave !== "premium" || hayPremium);
  const valor = (clave: (typeof PARTES)[number]["clave"]) => costo[clave] ?? 0;
  return (
    <div className="desglose">
      <div className="desglose__barra" role="img" aria-label="Desglose del costo total">
        {partes.filter((p) => valor(p.clave) > 0).map((p) => (
          <span key={p.clave} style={{ flexGrow: valor(p.clave), background: p.color }} title={`${p.nombre}: ${formatear(valor(p.clave))}`} />
        ))}
      </div>
      <ul className="desglose__lista">
        {partes.map((p) => (
          <li key={p.clave}>
            <i style={{ background: p.color }} />
            <span className="desglose__nombre">{p.nombre}</span>
            <span className="desglose__formula">{formula[p.clave]}</span>
            <strong>{formatear(valor(p.clave))}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
