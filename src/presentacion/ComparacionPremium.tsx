// Mismo solver, mismo dataset (Evento 1 A: 40 pedidos, 5 premium), con y sin tener en cuenta la
// demora premium al decidir el plan. Los dos planes se evalúan con la regla completa del Evento 1.
// Valores medidos con el solver del back y recalculados con la fórmula de la especificación:
//   sin premium: 492 cuadras × 3 + 2 vehículos × 60 + 346 min = 958; demora premium 784 → 1742
//   con premium: 522 cuadras × 3 + 2 vehículos × 60 + 362 min = 1004; demora premium 353 → 1357
const PLANES = [
  { nombre: "Sin tener en cuenta el premium", base: 958, premium: 784 },
  { nombre: "Teniéndolo en cuenta", base: 1004, premium: 353 },
];

const total = (p: { base: number; premium: number }) => p.base + p.premium;
const MAXIMO = Math.max(...PLANES.map(total));

export function ComparacionPremium() {
  const mejora = Math.round((1 - total(PLANES[1]) / total(PLANES[0])) * 100);
  return (
    <figure className="prem">
      {PLANES.map((p) => (
        <div className="prem__fila" key={p.nombre}>
          <p className="prem__nombre">{p.nombre}</p>
          <div className="prem__barra" role="img" aria-label={`${p.nombre}: costo base ${p.base}, demora premium ${p.premium}, total ${total(p)}`}>
            <span className="prem__base" style={{ width: `${(p.base / MAXIMO) * 100}%` }}>{p.base}</span>
            <span className="prem__premium" style={{ width: `${(p.premium / MAXIMO) * 100}%` }}>{p.premium}</span>
          </div>
          <p className="prem__total">Total <strong>{total(p)}</strong></p>
        </div>
      ))}
      <ul className="prem__leyenda">
        <li><i className="prem__base" />Costo base</li>
        <li><i className="prem__premium" />Demora premium</li>
      </ul>
      <figcaption>EVENTO 1 A · MISMO SOLVER · {mejora}% MENOS DE COSTO</figcaption>
    </figure>
  );
}
