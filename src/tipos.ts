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
  costos: { porCuadra: number; porVehiculo: number; porMinutoTotal: number; porFalla: number };
}

export interface Pedido extends Punto {
  id: number;
  peso: number;
  premium?: boolean;
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
  metodo: "kmeans" | "barrido";
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

export function formatear(n: number): string {
  return Math.round(n).toLocaleString("es-AR");
}
