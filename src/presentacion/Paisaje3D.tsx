import { useEffect, useMemo, useRef, useState } from "react";
import { INICIOS, LIMITE, MINIMOS, costo, resumir, simular } from "./paisaje.mjs";
import type { Corrida, Modo } from "./paisaje.mjs";

// Superficie de costo en 3D con varios puntos de partida. Se dibuja en un canvas con una
// proyección propia (sin librerías): se puede girar arrastrando.

const N = 44; // celdas por lado de la malla
const Z_MIN = 1;
const Z_MAX = 7.4;
const ZC = 4; // altura que queda en el centro de la vista
const KZ = 0.55; // cuánto se estira la altura respecto de x e y
const DURACION = 9000; // ms que dura la animación
const SEMILLA = 5; // una corrida típica: ni la mejor ni la peor
const COLORES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#e34948"];
const LUZ = normalizar([-0.5, -0.6, 0.8]);

type V3 = [number, number, number];

function normalizar(v: V3): V3 {
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
}

interface Malla {
  quads: { i: number; j: number; z: number; luz: number }[];
  z: number[][];
}

function construirMalla(): Malla {
  const paso = (2 * LIMITE) / N;
  const z = Array.from({ length: N + 1 }, (_, i) => Array.from({ length: N + 1 }, (_, j) => costo(-LIMITE + i * paso, -LIMITE + j * paso)));
  const quads = [];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const dzx = (z[i + 1][j] + z[i + 1][j + 1] - z[i][j] - z[i][j + 1]) / (2 * paso);
      const dzy = (z[i][j + 1] + z[i + 1][j + 1] - z[i][j] - z[i + 1][j]) / (2 * paso);
      const n = normalizar([-dzx * KZ, -dzy * KZ, 1]);
      const luz = Math.max(0, n[0] * LUZ[0] + n[1] * LUZ[1] + n[2] * LUZ[2]);
      quads.push({ i, j, z: (z[i][j] + z[i + 1][j] + z[i][j + 1] + z[i + 1][j + 1]) / 4, luz });
    }
  }
  return { quads, z };
}

// Valles oscuros, cumbres claras.
const RAMPA: [number, V3][] = [
  [0, [49, 30, 110]],
  [0.35, [118, 88, 184]],
  [0.7, [196, 181, 229]],
  [1, [243, 239, 250]],
];

function colorAltura(z: number, luz: number): string {
  // Raíz suave: abre el contraste entre los valles, que son lo que importa mostrar.
  const t = Math.max(0, Math.min(1, (z - Z_MIN) / (Z_MAX - Z_MIN))) ** 0.55;
  let k = 1;
  while (k < RAMPA.length - 1 && t > RAMPA[k][0]) k++;
  const [t0, c0] = RAMPA[k - 1];
  const [t1, c1] = RAMPA[k];
  const u = (t - t0) / (t1 - t0);
  const sombra = 0.68 + 0.5 * luz;
  const c = c0.map((v, idx) => Math.max(0, Math.min(255, Math.round((v + (c1[idx] - v) * u) * sombra))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

interface Vista {
  yaw: number;
  pitch: number;
  auto: boolean;
  arrastrando: boolean;
}

function dibujar(ctx: CanvasRenderingContext2D, ancho: number, alto: number, vista: Vista, malla: Malla, corrida: Corrida, indice: number, destinos: (string | null)[]) {
  ctx.clearRect(0, 0, ancho, alto);
  const cy = Math.cos(vista.yaw);
  const sy = Math.sin(vista.yaw);
  const cp = Math.cos(vista.pitch);
  const sp = Math.sin(vista.pitch);
  const escala = 1.0 * Math.min(ancho / (2 * 5.7), alto / (2 * (5.7 * sp + 2.1 * cp)));
  const proyectar = (x: number, y: number, z: number): V3 => {
    const Z = (z - ZC) * KZ;
    const xr = x * cy - y * sy;
    const yr = x * sy + y * cy;
    return [ancho / 2 + escala * xr, alto / 2 - escala * (Z * cp + yr * sp), yr * cp - Z * sp];
  };
  const paso = (2 * LIMITE) / N;
  const px = (i: number) => -LIMITE + i * paso;

  // Superficie, de lo más lejano a lo más cercano.
  const orden = malla.quads
    .map((q) => ({ q, d: (px(q.i) + paso / 2) * sy + (px(q.j) + paso / 2) * cy }))
    .map((e) => ({ q: e.q, d: e.d * cp - (e.q.z - ZC) * KZ * sp }))
    .sort((a, b) => b.d - a.d);
  ctx.lineJoin = "round";
  ctx.lineWidth = 0.7;
  for (const { q } of orden) {
    const p = [proyectar(px(q.i), px(q.j), malla.z[q.i][q.j]), proyectar(px(q.i + 1), px(q.j), malla.z[q.i + 1][q.j]), proyectar(px(q.i + 1), px(q.j + 1), malla.z[q.i + 1][q.j + 1]), proyectar(px(q.i), px(q.j + 1), malla.z[q.i][q.j + 1])];
    const color = colorAltura(q.z, q.luz);
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (let k = 1; k < 4; k++) ctx.lineTo(p[k][0], p[k][1]);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.fill();
    ctx.stroke();
  }

  // Borde de la base y eje de costo en la esquina del fondo.
  const esquinas = [[-LIMITE, -LIMITE], [LIMITE, -LIMITE], [LIMITE, LIMITE], [-LIMITE, LIMITE]].map(([x, y]) => proyectar(x, y, Z_MIN));
  ctx.strokeStyle = "#8b858c";
  ctx.lineWidth = 1;
  ctx.beginPath();
  esquinas.forEach((e, k) => (k === 0 ? ctx.moveTo(e[0], e[1]) : ctx.lineTo(e[0], e[1])));
  ctx.closePath();
  ctx.stroke();
  const fondo = esquinas.reduce((a, b) => (b[2] > a[2] ? b : a));
  const esquinaFondo = [[-LIMITE, -LIMITE], [LIMITE, -LIMITE], [LIMITE, LIMITE], [-LIMITE, LIMITE]][esquinas.indexOf(fondo)];
  const arriba = proyectar(esquinaFondo[0], esquinaFondo[1], Z_MAX + 0.3);
  ctx.strokeStyle = "#45316c";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(fondo[0], fondo[1]);
  ctx.lineTo(arriba[0], arriba[1]);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(arriba[0], arriba[1]);
  ctx.lineTo(arriba[0] - 4, arriba[1] + 8);
  ctx.lineTo(arriba[0] + 4, arriba[1] + 8);
  ctx.closePath();
  ctx.fillStyle = "#45316c";
  ctx.fill();
  etiqueta(ctx, "costo", arriba[0] + 8, arriba[1] + 4, false);

  // Recorridos de cada punto de partida.
  const elevar = (c: { x: number; y: number; z: number }) => proyectar(c.x, c.y, c.z + 0.05);
  ctx.lineCap = "round";
  corrida.caminantes.forEach((c, k) => {
    const hasta = c.camino.slice(0, indice + 1).map(elevar);
    if (hasta.length > 1) {
      for (const [grosor, estilo] of [[3.6, "rgba(255,255,255,0.6)"], [1.7, COLORES[k % COLORES.length]]] as const) {
        ctx.lineWidth = grosor;
        ctx.strokeStyle = estilo;
        ctx.beginPath();
        hasta.forEach((e, n) => (n === 0 ? ctx.moveTo(e[0], e[1]) : ctx.lineTo(e[0], e[1])));
        ctx.stroke();
      }
    }
  });

  // Mínimos: el global siempre se nombra; los locales, cuando ya hay puntos que terminaron en ellos.
  const terminada = indice >= corrida.caminantes[0].camino.length - 1;
  for (const m of MINIMOS) {
    const global = m.nombre === "global";
    const e = proyectar(m.x, m.y, m.z + 0.05);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = global ? "rgba(34,35,48,0.35)" : "rgba(34,35,48,0.12)";
    ctx.beginPath();
    ctx.arc(e[0], e[1], global ? 9 : 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (global || (terminada && destinos.includes(m.nombre))) etiqueta(ctx, global ? "mínimo global" : "mínimo local", e[0] + 12, e[1] + 4, global);
  }

  // Los puntos, encima de todo.
  corrida.caminantes.forEach((c, k) => {
    const e = elevar(c.camino[Math.min(indice, c.camino.length - 1)]);
    ctx.beginPath();
    ctx.arc(e[0], e[1], 6.5, 0, Math.PI * 2);
    ctx.fillStyle = COLORES[k % COLORES.length];
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  });
}

function etiqueta(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, fuerte: boolean) {
  ctx.font = `${fuerte ? 700 : 500} 11.5px "DM Sans", system-ui, sans-serif`;
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.strokeText(texto, x, y);
  ctx.fillStyle = "#222330";
  ctx.fillText(texto, x, y);
}

const MODOS: { modo: Modo; titulo: string }[] = [
  { modo: "descenso", titulo: "Descenso simple" },
  { modo: "recocido", titulo: "Recocido (con temperatura)" },
];

export function Paisaje3D() {
  const [modo, setModo] = useState<Modo>("descenso");
  const [repeticion, setRepeticion] = useState(0);
  const [terminado, setTerminado] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const barra = useRef<HTMLElement>(null);
  const vista = useRef<Vista>({ yaw: 0.7, pitch: 1.0, auto: true, arrastrando: false });
  const corrida = useMemo(() => simular(modo, SEMILLA), [modo]);
  const resumen = useMemo(() => resumir(corrida), [corrida]);
  const malla = useMemo(construirMalla, []);

  useEffect(() => {
    const canvas = lienzo.current;
    const contenedor = caja.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !contenedor || !ctx) return;
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let progreso = sinMovimiento ? 1 : 0;
    let fin = sinMovimiento;
    const comienzo = performance.now();
    let previo = comienzo;
    let ancho = 0;
    let alto = 0;
    let raf = 0;
    setTerminado(sinMovimiento);

    const medir = () => {
      const dpr = window.devicePixelRatio || 1;
      ancho = contenedor.clientWidth;
      // El lienzo nunca pasa del alto que queda libre en la pantalla (de 720 a 1080), para que la
      // diapositiva entre sin scroll. dibujar() centra y escala según el lado menor, así que
      // achicar el alto no deforma la superficie.
      alto = Math.round(Math.min(ancho * 0.9, Math.max(240, window.innerHeight * 0.58 - 60)));
      canvas.width = Math.round(ancho * dpr);
      canvas.height = Math.round(alto * dpr);
      canvas.style.height = `${alto}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observador = new ResizeObserver(medir);
    observador.observe(contenedor);
    window.addEventListener("resize", medir);
    medir();

    const largo = corrida.caminantes[0].camino.length;
    const cuadro = (ahora: number) => {
      const dt = Math.min(ahora - previo, 64);
      previo = ahora;
      if (!fin) {
        // Tiempo real: dura lo mismo aunque haya pocos cuadros por segundo. El primer cuadro puede
        // traer una hora anterior a `comienzo` (requestAnimationFrame usa el inicio del cuadro):
        // sin el piso en 0 el índice da −1, dibujar() falla y la animación queda en blanco.
        progreso = Math.max(0, Math.min(1, (ahora - comienzo) / DURACION));
        if (progreso >= 1) {
          fin = true;
          setTerminado(true);
        }
      }
      if (!sinMovimiento && vista.current.auto && !vista.current.arrastrando) vista.current.yaw += dt * 0.00012;
      const indice = Math.min(largo - 1, Math.floor(progreso * (largo - 1)));
      dibujar(ctx, ancho, alto, vista.current, malla, corrida, indice, resumen.destinos);
      if (barra.current) barra.current.style.width = `${Math.round((corrida.temperaturas[indice] / (corrida.temperaturas[0] || 1)) * 100)}%`;
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    return () => {
      cancelAnimationFrame(raf);
      observador.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, [corrida, resumen, repeticion, malla]);

  const arrastre = useRef({ x: 0, y: 0 });
  const texto = terminado
    ? modo === "descenso"
      ? `Cada punto bajó hasta el primer valle que encontró: terminaron en ${resumen.distintos} valles distintos y solo ${resumen.globales} de ${resumen.total} llegó al más profundo.`
      : `Con temperatura, ${resumen.globales} de ${resumen.total} puntos llegaron al valle más profundo. No lo garantiza, pero explora más antes de decidir.`
    : `${INICIOS.length} puntos de color arrancan en lugares distintos y buscan bajar el costo.`;

  return (
    <figure className="paisaje">
      <div className="paisaje__controles" role="group" aria-label="Método de búsqueda">
        {MODOS.map((m) => (
          <button key={m.modo} type="button" aria-pressed={modo === m.modo} onClick={() => setModo(m.modo)}>{m.titulo}</button>
        ))}
        <button type="button" className="paisaje__repetir" onClick={() => setRepeticion((r) => r + 1)}>↻ Repetir</button>
      </div>
      <div className="paisaje__lienzo" ref={caja}>
        <canvas
          ref={lienzo}
          role="img"
          aria-label="Superficie de costo en 3D: un valle profundo en el centro y varios valles menores alrededor. Seis puntos de color parten de lugares distintos y bajan hacia los valles."
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            vista.current.arrastrando = true;
            vista.current.auto = false;
            arrastre.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerMove={(e) => {
            if (!vista.current.arrastrando) return;
            vista.current.yaw += (e.clientX - arrastre.current.x) * 0.008;
            vista.current.pitch = Math.max(0.3, Math.min(1.5, vista.current.pitch + (e.clientY - arrastre.current.y) * 0.006));
            arrastre.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={() => { vista.current.arrastrando = false; }}
          onPointerCancel={() => { vista.current.arrastrando = false; }}
        />
      </div>
      {modo === "recocido" && (
        <div className="paisaje__temperatura">
          <span>Temperatura</span>
          <div className="paisaje__barra"><i ref={barra} /></div>
          <span>alta → baja</span>
        </div>
      )}
      <p className="paisaje__resumen" aria-live="polite">{texto}</p>
      <figcaption>ILUSTRACIÓN CON 2 VARIABLES · ARRASTRÁ PARA GIRAR</figcaption>
    </figure>
  );
}
