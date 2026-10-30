import type { Informe } from "./tipos";

export const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

export type Archivos = Record<string, string>;

export async function resolver(archivos: Archivos, iteraciones: number): Promise<Informe> {
  const response = await fetch(`${apiUrl}/api/resolver`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ archivos, opciones: { iteraciones } }),
    signal: AbortSignal.timeout(60_000),
  });
  const cuerpo = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(cuerpo.error ?? `La API respondió ${response.status}`);
  return cuerpo as Informe;
}

export async function apiDisponible(signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/api/health`, { signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(10_000)]) });
    return response.ok;
  } catch {
    return false;
  }
}
