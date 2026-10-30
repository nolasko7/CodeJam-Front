export const LIMITE: number;
export interface Punto3 { x: number; y: number; z: number }
export interface Caminante { inicio: { x: number; y: number }; camino: Punto3[]; mejor: Punto3 }
export interface Corrida { modo: Modo; temperaturas: number[]; caminantes: Caminante[] }
export type Modo = "descenso" | "recocido";
export const MODOS: Modo[];
export const INICIOS: { x: number; y: number }[];
export const MINIMOS: { nombre: string; x: number; y: number; z: number }[];
export const PARAMETROS: Record<Modo, { iteraciones: number; paso: number; t0?: number; tFinal?: number }>;
export function costo(x: number, y: number): number;
export function simular(modo: Modo, semilla?: number): Corrida;
export function minimoDe(x: number, y: number): string | null;
export function resumir(corrida: Corrida): { destinos: (string | null)[]; distintos: number; globales: number; total: number };
