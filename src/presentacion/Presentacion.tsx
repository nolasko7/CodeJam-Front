import { useEffect, useState } from "react";
import { MapaGrilla } from "../components/MapaGrilla";
import { DesgloseCosto } from "../components/DesgloseCosto";
import type { Informe } from "../tipos";
import datos from "./informe.json";
import datosZonas from "./informeZonas.json";
import { ArquitecturaCloudflare } from "./ArquitecturaCloudflare";
import { ComparacionAgrupamiento } from "./ComparacionAgrupamiento";
import { CrecimientoCostos } from "./CrecimientoCostos";
import { Paisaje3D } from "./Paisaje3D";
import datosBarrido from "./barridoZonas.json";
import { siguienteIndice } from "./navegacion.mjs";
import "./presentacion.css";

type Diapositiva = {
  etiqueta: string;
  titulo: string;
  bajada: string;
  usamos?: string;
  porque?: string;
  puntos?: string[];
  etapa?: number;
  zonas?: boolean; // el mapa usa el ejemplo de 3 zonas (varios grupos) en vez del de 10 pedidos
  desglose?: boolean;
  nota?: string;
  formula?: string;
  portada?: boolean;
  paisaje3d?: boolean;
  imagen?: string; // archivo en /capturas-presentacion
  alt?: string;
  pie?: string;
  ancha?: boolean; // la imagen ocupa más lugar que el texto
  qr?: boolean;
  comparar?: boolean; // k-means y barrido lado a lado
  arquitectura?: boolean;
  crecimiento?: boolean; // gráfico de lineal, n², 2ⁿ y n!
};

// ¿K-means y barrido armaron el mismo reparto en el ejemplo? Si es así, la diapositiva lo aclara.
const claveReparto = (rutas: { paradas: (number | string)[] }[]) => rutas.map((r) => r.paradas.map(Number).sort((a, b) => a - b).join(",")).sort().join("|");
const mismoReparto = claveReparto(datosZonas.etapas[1].instantanea?.rutas ?? []) === claveReparto(datosBarrido.rutas);

// Pocas palabras por diapositiva: se tiene que leer bien desde lejos, en un proyector.
const slides: Diapositiva[] = [
  { etiqueta: "CODEJAM  /  QUICKDROP", titulo: "Cómo armamos el plan de reparto", bajada: "La fuerza bruta no era viable por sus tiempos de cálculo. Elegimos una heurística que arma un buen plan y lo mejora por etapas.", portada: true },
  { etiqueta: "01  /  CÓMO LO ABORDAMOS", titulo: "Probar todo era imposible", bajada: "La fuerza bruta prueba todas las combinaciones, y su tiempo crece de forma explosiva.", formula: "40 pedidos  →  40!  ≈  8 × 10⁴⁷ órdenes", crecimiento: true },
  { etiqueta: "02  /  EL OBJETIVO", titulo: "Un solo número guía todo", bajada: "Cada plan se evalúa con una fórmula: menor costo, mejor plan.", formula: "distancia + vehículos + tiempo total + fallas + demora premium", desglose: true },
  { etiqueta: "03  /  AGRUPAMIENTO", titulo: "Primero repartimos los pedidos", bajada: "Un grupo por vehículo, probando distinta cantidad de vehículos.", usamos: "K-means y barrido angular.", porque: "Dividimos el problema: cada vehículo atiende una zona.", etapa: 2, zonas: true },
  { etiqueta: "04  /  BARRIDO ANGULAR", titulo: "La otra forma de agrupar", bajada: "Corta la ciudad en rebanadas alrededor del depósito, como una pizza.", usamos: "Barrido angular.", porque: "Tiene en cuenta dónde está el depósito; k-means no.", nota: mismoReparto ? "En este ejemplo los dos llegan al mismo reparto." : undefined, comparar: true, ancha: true },
  { etiqueta: "05  /  RUTA INICIAL", titulo: "Ordenamos cada grupo", bajada: "Así tenemos un primer plan completo, con su costo.", usamos: "Vecino más cercano y 2-opt.", porque: "Es rápido, y 2-opt elimina los cruces.", etapa: 3, zonas: true },
  { etiqueta: "06  /  BÚSQUEDA LOCAL", titulo: "Mejoramos con cambios chicos", bajada: "Probamos cambios y nos quedamos con los que bajan el costo.", usamos: "Mover o intercambiar pedidos entre vehículos.", porque: "Corrige lo que el agrupamiento no veía.", nota: "Se frena en un mínimo local.", etapa: 4, zonas: true },
  { etiqueta: "07  /  RECOCIDO SIMULADO", titulo: "Escapar de los mínimos locales", bajada: "A veces aceptamos un cambio peor, para no quedarnos atascados.", usamos: "Recocido simulado.", porque: "Con temperatura alta explora; al enfriarse se asienta.", nota: "Ilustración con 2 variables.", paisaje3d: true },
  { etiqueta: "08  /  ARQUITECTURA", titulo: "Todo corre en Cloudflare", bajada: "Un solo proveedor para la aplicación, la API y los datos.", puntos: ["Workers: hospedan el front y la API.", "Dominio propio: codejam.citax.com.ar.", "D1 (SQLite): persistencia y datasets."], arquitectura: true, ancha: true },
  { etiqueta: "09  /  ENTREGA", titulo: "Planes entregados y validados", bajada: "Los tres datasets del Evento 1 en la plataforma.", puntos: ["Evento 1 A: costo 1357", "Evento 1 C: costo 984", "Evento 1 B: costo 1806"], imagen: "entregas-evento1.png", alt: "Plataforma de entregas con los tres planes del Evento 1 válidos y sus costos", pie: "PLATAFORMA DE ENTREGAS · EVENTO 1", ancha: true },
  { etiqueta: "10  /  PROBALO", titulo: "Probá la aplicación", bajada: "Escaneá el código con tu celular.", nota: "codejam.citax.com.ar", imagen: "qr-codejam.svg", alt: "Código QR que abre https://codejam.citax.com.ar/", pie: "CODEJAM.CITAX.COM.AR", qr: true },
];

const informe = datos;
const informeZonas = datosZonas;

export function Presentacion() {
  const [indice, setIndice] = useState(0);
  const slide = slides[indice];
  const [resaltado, setResaltado] = useState<string | null>(null);
  useEffect(() => {
    const teclado = (e: KeyboardEvent) => {
      // Las flechas avanzan aunque el foco haya quedado en un botón (por ejemplo, después de
      // tocar "Recocido" o la flecha de abajo): los botones no usan esas teclas.
      if (e.altKey || e.ctrlKey || e.metaKey || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        setIndice((i) => siguienteIndice(i, e.key === "ArrowRight" ? 1 : -1, slides.length));
      }
    };
    window.addEventListener("keydown", teclado);
    return () => window.removeEventListener("keydown", teclado);
  }, []);
  return <main className="presentacion">
    <header className="pres-header"><a href="/" className="pres-brand">QUICKDROP <span> / PRESENTACIÓN</span></a><span>CODEJAM 2026</span></header>
    <article className={`pres-slide ${slide.portada ? "pres-slide--portada" : ""} ${slide.paisaje3d ? "pres-slide--3d" : ""} ${slide.ancha ? "pres-slide--ancha" : ""}`} key={indice} aria-live="polite">
      <div className="pres-copy">
        <p className="pres-label">{slide.etiqueta}</p>
        <h1>{slide.titulo}</h1>
        <p className="pres-lead">{slide.bajada}</p>
        {slide.formula && <p className="pres-formula">{slide.formula}</p>}
        {slide.usamos && <div className="pres-razon"><p className="pres-razon__rotulo">QUÉ USAMOS</p><p>{slide.usamos}</p></div>}
        {slide.puntos && <ul>{slide.puntos.map((p) => <li key={p}>{p}</li>)}</ul>}
        {slide.porque && <div className="pres-razon"><p className="pres-razon__rotulo">POR QUÉ</p><p>{slide.porque}</p></div>}
        {slide.nota && <p className="pres-note">{slide.nota}</p>}
      </div>
      {slide.paisaje3d && <Paisaje3D />}
      {slide.comparar && <ComparacionAgrupamiento dataset={informeZonas.dataset} kmeans={informeZonas.etapas[1].instantanea} barrido={datosBarrido} />}
      {slide.arquitectura && <ArquitecturaCloudflare />}
      {slide.crecimiento && <CrecimientoCostos />}
      {slide.imagen && <figure className={`pres-figure ${slide.qr ? "pres-qr" : ""}`}><img src={`/capturas-presentacion/${slide.imagen}`} alt={slide.alt} /><figcaption>{slide.pie}</figcaption></figure>}
      {slide.etapa && (() => {
        const fuente = slide.zonas ? informeZonas : informe;
        return <figure className="pres-figure"><MapaGrilla dataset={fuente.dataset} instantanea={fuente.etapas[slide.etapa - 1].instantanea} resaltado={resaltado} onResaltar={setResaltado} /><figcaption>{slide.zonas ? `EJEMPLO ILUSTRATIVO · ${fuente.dataset.pedidos.length} PEDIDOS EN 3 ZONAS, ${fuente.evaluacion.metricas.vehiculosUsados} VEHÍCULOS` : "MAPA DE LA APLICACIÓN · EJEMPLO DEL SIMULADOR"}</figcaption></figure>;
      })()}
      {slide.desglose && <figure className="pres-figure pres-desglose"><h2>Desglose del costo <strong>638</strong></h2><DesgloseCosto costo={informe.evaluacion.costo} metricas={informe.evaluacion.metricas} mundo={informe.dataset.mundo} /><figcaption>DESGLOSE DE LA APLICACIÓN · EJEMPLO DEL SIMULADOR</figcaption></figure>}
      {slide.portada && <div className="pres-cover-number" aria-hidden="true">01<span>—</span>{String(slides.length).padStart(2, "0")}</div>}
    </article>
    <footer className="pres-footer"><div><strong>{String(indice + 1).padStart(2, "0")}</strong> <span>/ {String(slides.length).padStart(2, "0")}</span></div><div className="pres-progress" aria-hidden="true"><i style={{ width: `${((indice + 1) / slides.length) * 100}%` }} /></div><div className="pres-controls"><button onClick={() => setIndice((i) => siguienteIndice(i, -1, slides.length))} disabled={indice === 0} aria-label="Diapositiva anterior">←</button><button onClick={() => setIndice((i) => siguienteIndice(i, 1, slides.length))} disabled={indice === slides.length - 1} aria-label="Diapositiva siguiente">→</button></div></footer>
  </main>;
}
