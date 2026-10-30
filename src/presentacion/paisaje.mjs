// Paisaje de costo de ejemplo para la diapositiva del recocido: un cuenco con bultitos. Tiene
// dos variables (x, y) para poder dibujarlo en 3D, y el costo es la altura. El costo real del
// plan depende de muchas decisiones a la vez, pero la idea es la misma: muchos valles
// (mínimos locales) y uno solo realmente profundo (el mínimo global).
export const LIMITE = 4;

export function costo(x, y) {
  return 1 + 0.1 * (x * x + y * y) + 0.8 * (2 - Math.cos(2.4 * x) - Math.cos(2.4 * y));
}

// Puntos de partida repartidos por todo el mapa.
export const INICIOS = [
  { x: -3.3, y: 3.1 },
  { x: 3.2, y: 3.0 },
  { x: 3.3, y: -2.8 },
  { x: -3.0, y: -2.9 },
  { x: 0.9, y: 0.8 },
  { x: 1.9, y: -0.2 },
];

export const MODOS = ["descenso", "recocido"];
export const PARAMETROS = { descenso: { iteraciones: 400, paso: 0.3 }, recocido: { iteraciones: 700, paso: 0.4, t0: 1.2, tFinal: 0.02 } };

function generador(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(azar) {
  return Math.sqrt(-2 * Math.log(1 - azar())) * Math.cos(2 * Math.PI * azar());
}

const dentro = (v) => Math.max(-LIMITE, Math.min(LIMITE, v));

/**
 * Un caminante por cada punto de partida. En "descenso" solo acepta pasos que bajan el costo
 * (como la búsqueda local). En "recocido" acepta un paso que sube con probabilidad e^(−Δ/T),
 * y T baja de a poco. Devuelve cada recorrido y el mejor punto que vio.
 */
export function simular(modo, semilla = 7) {
  const { iteraciones, paso, t0, tFinal } = PARAMETROS[modo];
  const azar = generador(semilla);
  const temperaturas = Array.from({ length: iteraciones + 1 }, (_, i) =>
    modo === "recocido" ? t0 * (tFinal / t0) ** (i / iteraciones) : 0,
  );
  const caminantes = INICIOS.map((inicio) => {
    let { x, y } = inicio;
    let z = costo(x, y);
    let mejor = { x, y, z };
    const camino = [{ x, y, z }];
    for (let it = 1; it <= iteraciones; it++) {
      const nx = dentro(x + paso * normal(azar));
      const ny = dentro(y + paso * normal(azar));
      const nz = costo(nx, ny);
      const delta = nz - z;
      const acepta = delta <= 0 || (modo === "recocido" && azar() < Math.exp(-delta / temperaturas[it]));
      if (acepta) {
        x = nx;
        y = ny;
        z = nz;
        if (z < mejor.z) mejor = { x, y, z };
      }
      camino.push({ x, y, z });
    }
    // El recocido siempre se queda con el mejor plan que vio.
    camino.push(mejor);
    return { inicio, camino, mejor };
  });
  return { modo, temperaturas: [...temperaturas, temperaturas[temperaturas.length - 1]], caminantes };
}

/** Baja desde un punto hasta el fondo de su valle (búsqueda por patrones, sin azar). */
function fondo(x, y) {
  let paso = 0.2;
  while (paso > 1e-4) {
    let mejora = false;
    for (let k = 0; k < 8; k++) {
      const nx = dentro(x + paso * Math.cos((k * Math.PI) / 4));
      const ny = dentro(y + paso * Math.sin((k * Math.PI) / 4));
      if (costo(nx, ny) < costo(x, y) - 1e-12) {
        x = nx;
        y = ny;
        mejora = true;
      }
    }
    if (!mejora) paso /= 2;
  }
  return { x, y, z: costo(x, y) };
}

const encontrados = [];
for (let gx = -3.5; gx <= 3.5; gx += 0.5) {
  for (let gy = -3.5; gy <= 3.5; gy += 0.5) {
    const m = fondo(gx, gy);
    const enBorde = Math.abs(m.x) > LIMITE - 1e-3 || Math.abs(m.y) > LIMITE - 1e-3;
    if (!enBorde && !encontrados.some((c) => Math.hypot(c.x - m.x, c.y - m.y) < 0.3)) encontrados.push(m);
  }
}
encontrados.sort((p, q) => p.z - q.z);
export const MINIMOS = encontrados.map((m, i) => ({ nombre: i === 0 ? "global" : `local ${i}`, ...m }));

/** A cuál de los mínimos conocidos llegó un punto (o null si quedó en la pendiente). */
export function minimoDe(x, y) {
  const f = fondo(x, y);
  const m = MINIMOS.find((c) => Math.hypot(c.x - f.x, c.y - f.y) < 0.3);
  return m ? m.nombre : null;
}

/** Resumen de una corrida: cuántos terminan en cada valle y cuántos llegan al mínimo global. */
export function resumir(corrida) {
  const destinos = corrida.caminantes.map((c) => minimoDe(c.mejor.x, c.mejor.y));
  return {
    destinos,
    distintos: new Set(destinos.filter(Boolean)).size,
    globales: destinos.filter((d) => d === "global").length,
    total: destinos.length,
  };
}
