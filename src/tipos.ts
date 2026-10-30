// Forma del informe que devuelve el back (POST /api/resolver) o que escribe `npm run resolver`.
export type Parada = number | "DEPOSITO";

export interface Punto {
  x: number;
  y: number;
}

export interface Mundo {
  ancho: number;
  alto: number;
  deposito: Punto;
  horaSalida: number;
  tiempoServicio: number;
  tiempoCarga: number;
  minPorCuadra: number;
  costos: { porCuadra: number; porVehiculo: number; porMinutoTotal: number; porFalla: number; porMinutoPremium?: number };
}

export interface Pedido extends Punto {
  id: number;
  peso: number;
  premium?: boolean; // Evento 1
}

export interface Dataset {
  mundo: Mundo;
  pedidos: Pedido[];
  vehiculos: { id: string }[];
}

export interface RutaPlan {
  vehiculo: string;
  paradas: Parada[];
}

export interface Desglose {
  distancia: number;
  vehiculos: number;
  tiempo: number;
  fallas: number;
  premium?: number;
  total: number;
}

export interface Metricas {
  pedidos: number;
  entregados: number;
  fallidos: number;
  distanciaTotal: number;
  vehiculosUsados: number;
  makespan: number;
  horaFin: number;
  premiumTotal?: number;
  premiumEntregados?: number;
  minutosPremium?: number;
}

export interface Visita {
  vehiculo: string;
  viaje: number;
  parada: Parada;
  x: number;
  y: number;
  cuadras: number;
  llegada: number;
  salida: number;
  estado: "ENTREGADO" | "RECARGA" | "REGRESO";
}

export interface Instantanea {
  ordenada: boolean;
  rutas: RutaPlan[];
  sinAsignar: number[];
  costo: Desglose | null;
  metricas: Metricas | null;
  centros?: Punto[];
}

export interface Etapa {
  numero: number;
  clave: string;
  titulo: string;
  descripcion: string;
  instantanea: Instantanea | null;
  detalles: Record<string, string | number>;
  ms: number;
}

export interface ResultadoPorK {
  k: number;
  costoKmeans: number;
  costoBarrido: number;
  costoPremiumDedicado?: number | null;
  metodo: "kmeans" | "barrido" | "premium-dedicado";
  construccion: number;
  busquedaLocal: number;
  recocido: number;
  final: number;
  vehiculosUsados: number;
  elegido: boolean;
}

export interface PuntoConvergencia {
  iteracion: number;
  actual: number;
  mejor: number;
  temperatura: number;
}

export interface Informe {
  dataset: Dataset;
  opciones: { semilla: number; iteraciones: number; semillasKmeans: number };
  premium?: { pedidos: number; costoPorMinuto: number } | null; // null o ausente: sin premium
  etapas: Etapa[];
  porK: ResultadoPorK[];
  convergencia: PuntoConvergencia[];
  plan: { rutas: RutaPlan[] };
  planCsv: string;
  evaluacion: { valido: boolean; errores: string[]; visitas: Visita[]; sinAsignar: number[]; metricas: Metricas; costo: Desglose };
  ms: number;
}

export function aHora(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

export const NOMBRE_METODO: Record<ResultadoPorK["metodo"], string> = {
  kmeans: "k-means",
  barrido: "barrido",
  "premium-dedicado": "vehículo dedicado a premium",
};

/** Minuto (desde la salida) en que el vehículo llega a cada pedido, igual que el simulador. */
export function llegadas(mundo: Mundo, pedidos: Pedido[], paradas: Parada[]): Map<number, number> {
  const porId = new Map(pedidos.map((p) => [p.id, p]));
  const resultado = new Map<number, number>();
  let t = 0;
  let pos: Punto = mundo.deposito;
  for (const parada of paradas) {
    const destino = parada === "DEPOSITO" ? mundo.deposito : porId.get(parada);
    if (!destino) continue;
    t += (Math.abs(pos.x - destino.x) + Math.abs(pos.y - destino.y)) * mundo.minPorCuadra;
    if (parada === "DEPOSITO") t += mundo.tiempoCarga;
    else {
      resultado.set(parada, t);
      t += mundo.tiempoServicio;
    }
    pos = destino;
  }
  return resultado;
}

export function formatear(n: number): string {
  return Math.round(n).toLocaleString("es-AR");
}
