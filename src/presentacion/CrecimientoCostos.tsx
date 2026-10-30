import { useState } from "react";

// Cuánto crece el trabajo según la cantidad de pedidos n, para las funciones que aparecen al
// comparar técnicas de resolución. Por defecto la escala es logarítmica para que se vean las
// cuatro curvas; en escala normal se nota cómo el factorial se dispara y las demás quedan pegadas.

const N_MAX = 10;
const ANCHO = 480;
const ALTO = 290;
const M = { izq: 62, der: 14, arriba: 14, abajo: 42 };
const LOG_MAX = 7; // 10⁷
const Y_NORMAL_MAX = 4_000_000;

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

const FUNCIONES = [
  { clave: "lineal", nombre: "Lineal", formula: "n", color: "#2a78d6", f: (n: number) => n },
  { clave: "cuadratica", nombre: "Cuadrática", formula: "n²", color: "#1baf7a", f: (n: number) => n * n },
  { clave: "exponencial", nombre: "Exponencial", formula: "2ⁿ", color: "#eda100", f: (n: number) => 2 ** n },
  { clave: "factorial", nombre: "Factorial", formula: "n!", color: "#e34948", f: factorial },
];

const SUPERINDICE = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const superindice = (n: number) => String(n).split("").map((d) => SUPERINDICE[Number(d)]).join("");

/** 1.600 · 3.628.800 · 1,1 × 10¹² · 8,2 × 10⁴⁷ */
function formatear(x: number): string {
  if (x < 1e9) return Math.round(x).toLocaleString("es-AR");
  const exp = Math.floor(Math.log10(x));
  return `${(x / 10 ** exp).toFixed(1).replace(".", ",")} × 10${superindice(exp)}`;
}

const MARCAS_LOG = [
  { v: 1, texto: "1" }, { v: 10, texto: "10" }, { v: 1e2, texto: "100" }, { v: 1e3, texto: "1 mil" },
  { v: 1e4, texto: "10 mil" }, { v: 1e5, texto: "100 mil" }, { v: 1e6, texto: "1 millón" }, { v: 1e7, texto: "10 millones" },
];
const MARCAS_NORMAL = [0, 1e6, 2e6, 3e6, 4e6].map((v) => ({ v, texto: v === 0 ? "0" : `${v / 1e6} millón${v > 1e6 ? "es" : ""}` }));

export function CrecimientoCostos() {
  const [logaritmica, setLogaritmica] = useState(true);
  const anchoUtil = ANCHO - M.izq - M.der;
  const altoUtil = ALTO - M.arriba - M.abajo;
  const x = (n: number) => M.izq + ((n - 1) / (N_MAX - 1)) * anchoUtil;
  const y = (v: number) => M.arriba + altoUtil * (1 - (logaritmica ? Math.log10(Math.max(v, 1)) / LOG_MAX : Math.min(v / Y_NORMAL_MAX, 1)));
  const marcas = logaritmica ? MARCAS_LOG : MARCAS_NORMAL;
  const ns = Array.from({ length: N_MAX }, (_, i) => i + 1);

  return (
    <figure className="crec">
      <div className="crec__controles" role="group" aria-label="Escala del gráfico">
        <button type="button" aria-pressed={logaritmica} onClick={() => setLogaritmica(true)}>Escala logarítmica</button>
        <button type="button" aria-pressed={!logaritmica} onClick={() => setLogaritmica(false)}>Escala normal</button>
      </div>

      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label="Gráfico del crecimiento del trabajo según la cantidad de pedidos: lineal, cuadrático, exponencial y factorial. El factorial crece mucho más rápido que los demás.">
        {marcas.map((m) => (
          <g key={m.v}>
            <line x1={M.izq} x2={ANCHO - M.der} y1={y(m.v)} y2={y(m.v)} className="crec__grilla" />
            <text x={M.izq - 8} y={y(m.v) + 4} className="crec__tick" textAnchor="end">{m.texto}</text>
          </g>
        ))}
        {ns.map((n) => (
          <text key={n} x={x(n)} y={ALTO - M.abajo + 16} className="crec__tick" textAnchor="middle">{n}</text>
        ))}
        <text x={M.izq + anchoUtil / 2} y={ALTO - 6} className="crec__eje" textAnchor="middle">cantidad de pedidos (n)</text>
        <text transform={`translate(12 ${M.arriba + altoUtil / 2}) rotate(-90)`} className="crec__eje" textAnchor="middle">operaciones</text>

        <g key={logaritmica ? "log" : "normal"}>
          {FUNCIONES.map((fn, i) => (
            <g key={fn.clave} style={{ ["--retraso" as string]: `${i * 0.18}s` }}>
              <polyline
                points={ns.map((n) => `${x(n)},${y(fn.f(n))}`).join(" ")}
                pathLength={1}
                className="crec__linea"
                stroke={fn.color}
              />
              {ns.map((n) => <circle key={n} cx={x(n)} cy={y(fn.f(n))} r={2.8} fill={fn.color} className="crec__punto" />)}
            </g>
          ))}
        </g>
      </svg>

      <table className="crec__tabla">
        <thead>
          <tr><th scope="col">Crecimiento</th><th scope="col">10 pedidos</th><th scope="col">40 pedidos</th></tr>
        </thead>
        <tbody>
          {FUNCIONES.map((fn) => (
            <tr key={fn.clave}>
              <th scope="row"><i style={{ background: fn.color }} />{fn.nombre} <span>{fn.formula}</span></th>
              <td>{formatear(fn.f(10))}</td>
              <td>{formatear(fn.f(40))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption>PROBAR TODOS LOS ÓRDENES CRECE COMO n!</figcaption>
    </figure>
  );
}
