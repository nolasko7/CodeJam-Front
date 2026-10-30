import type { Informe } from "./tipos";

export const apiUrl = import.meta.env?.VITE_API_URL ?? "http://localhost:8787";

export type Archivos = Record<string, string>;

export class ErrorApi extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export interface TrabajoGuardado { id: string; solicitud?: { archivos: Archivos; opciones: { iteraciones: number } } }
export interface EstadoTrabajo { id: string; estado: "pendiente" | "procesando" | "completado" | "fallido"; aviso: string; error: string | null }
const claveTrabajo = `quickdrop:${apiUrl}:trabajo:v1`;
const claveIdentidad = `quickdrop:${apiUrl}:instalacion:v1`;

export function claveInstalacion(): string {
  let value = localStorage.getItem(claveIdentidad);
  if (!value || !/^[a-f0-9]{64}$/.test(value)) {
    value = Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2,"0")).join("");
    localStorage.setItem(claveIdentidad,value);
  }
  return value;
}

export function guardarTrabajo(value: TrabajoGuardado | null): void {
  if (value) localStorage.setItem(claveTrabajo,JSON.stringify(value));
  else localStorage.removeItem(claveTrabajo);
}

export function restaurarTrabajo(): TrabajoGuardado | null {
  try {
    const id = new URL(window.location.href).searchParams.get("trabajo");
    let saved: TrabajoGuardado | null = null;
    try { saved = JSON.parse(localStorage.getItem(claveTrabajo) ?? "null") as TrabajoGuardado | null; } catch { /* Un aviso válido se puede abrir aunque el registro local esté dañado. */ }
    const valido = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value);
    if (valido(id)) return saved?.id === id ? saved : { id };
    return valido(saved?.id) ? saved : null;
  } catch { return null; }
}

async function peticion<T>(path: string, options: RequestInit = {}, privada = true): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`,{
    ...options, cache: "no-store",
    headers: { "Content-Type":"application/json", ...(privada ? { Authorization:`Bearer ${claveInstalacion()}` } : {}), ...options.headers },
    signal: AbortSignal.any([options.signal ?? new AbortController().signal,AbortSignal.timeout(15_000)]),
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ErrorApi(response.status,body?.error ?? `La API respondió ${response.status}`);
  if (response.status !== 204 && body === null) throw new ErrorApi(502,"La API devolvió una respuesta inválida.");
  return body as T;
}

export const crearTrabajo = (trabajo: TrabajoGuardado, signal: AbortSignal) => peticion<{id:string}>(`/api/trabajos/${trabajo.id}`,{method:"PUT",body:JSON.stringify(trabajo.solicitud),signal});
export const consultarTrabajo = (id: string, signal: AbortSignal) => peticion<EstadoTrabajo>(`/api/trabajos/${id}`,{signal});
export const obtenerResultado = (id: string, signal: AbortSignal) => peticion<Informe>(`/api/trabajos/${id}/resultado`,{signal});
export const configuracionPush = () => peticion<{publicKey:string}>("/api/push/config",{},false);
export const registrarPush = (subscription: PushSubscription) => peticion<void>("/api/push/suscripcion",{method:"PUT",body:JSON.stringify(subscription.toJSON())});
export const eliminarPush = () => peticion<void>("/api/push/suscripcion",{method:"DELETE"});

export async function apiDisponible(signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/api/health`, { signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(10_000)]) });
    return response.ok;
  } catch {
    return false;
  }
}
