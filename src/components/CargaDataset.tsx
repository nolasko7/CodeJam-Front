import { useState } from "react";
import type { ChangeEvent } from "react";
import type { Archivos } from "../api";
import { EJEMPLO, datasetAleatorio } from "../datasets";
import type { Informe } from "../tipos";

const NIVELES = [
  { iteraciones: 20_000, nombre: "Rápido" },
  { iteraciones: 60_000, nombre: "Normal" },
  { iteraciones: 300_000, nombre: "Intenso" },
];

interface Props {
  cargando: boolean;
  onResolver: (archivos: Archivos, iteraciones: number) => void;
  onInforme: (informe: Informe) => void;
  onError: (mensaje: string) => void;
}

async function leer(archivos: FileList): Promise<Archivos> {
  const resultado: Archivos = {};
  for (const archivo of Array.from(archivos)) resultado[archivo.name] = await archivo.text();
  return resultado;
}

export function CargaDataset({ cargando, onResolver, onInforme, onError }: Props) {
  const [archivos, setArchivos] = useState<Archivos | null>(null);
  const [origen, setOrigen] = useState("");
  const [iteraciones, setIteraciones] = useState(60_000);
  const [pedidos, setPedidos] = useState(40);
  const [vehiculos, setVehiculos] = useState(5);

  async function subir(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const leidos = await leer(e.target.files);
    setArchivos(leidos);
    setOrigen(Object.keys(leidos).join(", "));
    e.target.value = "";
  }

  async function abrirInforme(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    try {
      const informe = JSON.parse(await archivo.text()) as Informe;
      if (!informe.etapas || !informe.evaluacion) throw new Error();
      onInforme(informe);
    } catch {
      onError("Ese archivo no es un informe.json generado por npm run resolver.");
    }
  }

  return (
    <section className="panel carga" aria-labelledby="carga-titulo">
      <h2 id="carga-titulo">1 · Elegí un dataset</h2>
      <div className="carga__opciones">
        <label className="boton boton--tonal">
          Subir archivos
          <input className="entrada-archivo" type="file" multiple accept=".json,.csv" onChange={subir} />
        </label>
        <button className="boton boton--tonal" type="button" onClick={() => { setArchivos(EJEMPLO); setOrigen("Ejemplo del simulador (10 pedidos, 3 vehículos)"); }}>
          Ejemplo del simulador
        </button>
        <div className="carga__aleatorio">
          <button className="boton boton--tonal" type="button" onClick={() => { setArchivos(datasetAleatorio(pedidos, vehiculos)); setOrigen(`Aleatorio: ${pedidos} pedidos, ${vehiculos} vehículos, depósito al azar`); }}>
            Aleatorio
          </button>
          <label>
            <input type="number" min={1} max={120} value={pedidos} onChange={(e) => setPedidos(Number(e.target.value))} aria-label="Pedidos" /> pedidos
          </label>
          <label>
            <input type="number" min={1} max={8} value={vehiculos} onChange={(e) => setVehiculos(Number(e.target.value))} aria-label="Vehículos" /> vehículos
          </label>
        </div>
      </div>
      <p className="carga__ayuda">
        Subí <code>mundo</code>, <code>pedidos</code> y <code>vehiculos</code> juntos, en JSON o CSV. ¿Ya corriste <code>npm run resolver</code>?{" "}
        <label className="enlace">
          Abrí su informe.json
          <input className="entrada-archivo" type="file" accept=".json" onChange={abrirInforme} />
        </label>
        .
      </p>

      <div className="carga__resolver">
        <div className="carga__origen">{archivos ? <>✓ {origen}</> : "Ningún dataset cargado"}</div>
        <div className="segmentado" role="radiogroup" aria-label="Esfuerzo del recocido">
          {NIVELES.map((n) => (
            <button key={n.iteraciones} type="button" role="radio" aria-checked={iteraciones === n.iteraciones} onClick={() => setIteraciones(n.iteraciones)}>
              {n.nombre}
            </button>
          ))}
        </div>
        <md-filled-button disabled={!archivos || cargando} onClick={() => archivos && onResolver(archivos, iteraciones)}>
          {cargando ? "Resolviendo…" : "Resolver"}
        </md-filled-button>
      </div>
    </section>
  );
}
