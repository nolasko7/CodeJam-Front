import type { Archivos } from "./api";

// datos/ejemplo del simulador oficial.
export const EJEMPLO: Archivos = {
  "mundo.json": JSON.stringify({
    grilla_ancho: 20, grilla_alto: 20, deposito_x: 0, deposito_y: 0, hora_salida: "08:00",
    tiempo_servicio: 5, tiempo_carga: 10, min_por_cuadra: 3, costo_por_cuadra: 3,
    costo_por_vehiculo: 60, costo_por_minuto_total: 1, costo_por_falla: 200,
  }),
  "pedidos.json": JSON.stringify([
    { id: 1, x: 3, y: 4, peso: 8 }, { id: 2, x: 6, y: 2, peso: 12 }, { id: 3, x: 10, y: 10, peso: 20 },
    { id: 4, x: 15, y: 3, peso: 5 }, { id: 5, x: 2, y: 15, peso: 18 }, { id: 6, x: 12, y: 17, peso: 7 },
    { id: 7, x: 18, y: 18, peso: 25 }, { id: 8, x: 7, y: 9, peso: 10 }, { id: 9, x: 16, y: 11, peso: 14 },
    { id: 10, x: 4, y: 7, peso: 6 },
  ]),
  "vehiculos.json": JSON.stringify([{ id: "V1" }, { id: "V2" }, { id: "V3" }]),
};

/** Dataset al azar con el depósito en cualquier lugar, para probar que nada supone (0,0). */
export function datasetAleatorio(pedidos: number, vehiculos: number): Archivos {
  const r = () => Math.floor(Math.random() * 20);
  const vistos = new Set<string>();
  const lista = [];
  while (lista.length < pedidos) {
    const x = r();
    const y = r();
    if (vistos.has(`${x},${y}`)) continue;
    vistos.add(`${x},${y}`);
    lista.push({ id: lista.length + 1, x, y, peso: 1 + Math.floor(Math.random() * 25) });
  }
  return {
    "mundo.json": JSON.stringify({ deposito_x: r(), deposito_y: r(), hora_salida: "08:00" }),
    "pedidos.json": JSON.stringify(lista),
    "vehiculos.json": JSON.stringify(Array.from({ length: vehiculos }, (_, i) => ({ id: `V${i + 1}` }))),
  };
}
