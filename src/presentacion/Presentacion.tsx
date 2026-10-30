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

// Costo del plan inicial con cada método de agrupamiento, tal como lo registró el solver en el ejemplo.
const arranque = {
  kmeans: Number(datosZonas.etapas[1].detalles["Mejor arranque con k-means"] ?? 0),
  barrido: Number(datosZonas.etapas[1].detalles["Mejor arranque con barrido"] ?? 0),
};

// ¿K-means y barrido armaron el mismo reparto en el ejemplo? Cambia lo que se puede decir de ellos.
const claveReparto = (rutas: { paradas: (number | string)[] }[]) => rutas.map((r) => r.paradas.map(Number).sort((a, b) => a - b).join(",")).sort().join("|");
const mismoReparto = claveReparto(datosZonas.etapas[1].instantanea?.rutas ?? []) === claveReparto(datosBarrido.rutas);
const notaBarrido = mismoReparto
  ? `Acá las zonas están tan separadas que los dos métodos llegan al mismo reparto (costo de arranque ${Math.round(arranque.kmeans)}): cambia cómo lo encuentran. Con pedidos más mezclados pueden dar repartos distintos.`
  : `Costos de arranque: k-means ${Math.round(arranque.kmeans)} y barrido ${Math.round(arranque.barrido)}. El solver refina varios arranques y se queda con el que termina más barato: acá, ${String(datosZonas.etapas[1].detalles["Método ganador"] ?? "")}.`;

const slides: Diapositiva[] = [
  { etiqueta: "CODEJAM  /  QUICKDROP", titulo: "Cómo armamos el plan de reparto", bajada: "Primero pensamos en técnicas de resolución como la fuerza bruta, que prueba todas las combinaciones. Vimos que no era viable: los tiempos de cómputo crecen demasiado con la cantidad de pedidos. Por eso decidimos abordarlo con una heurística, que construye un buen plan y lo mejora por etapas.", portada: true, nota: "Un optimizador heurístico en cuatro etapas" },
  { etiqueta: "01  /  CÓMO LO ABORDAMOS", titulo: "Probar todo era imposible", bajada: "Antes de programar, comparamos técnicas de resolución y medimos cuánto crece el problema.", formula: "40 pedidos  →  40!  ≈  8 × 10⁴⁷ órdenes posibles", puntos: ["Pensamos en permutaciones: probar todos los órdenes posibles. Con 10 pedidos ya son 3,6 millones (10!), y eso sin contar cómo repartirlos entre los vehículos.", "El crecimiento factorial lo hace inviable: cada pedido extra multiplica el trabajo.", "Es un problema de ruteo de vehículos (VRP), que es NP-difícil: no se conoce un algoritmo que garantice el óptimo en tiempo razonable a medida que crece."], porque: "Elegimos una heurística: construir un buen plan y mejorarlo por etapas, midiendo cada cambio con el costo real.", nota: "Con pocos pedidos sí se puede probar todo: así comprobamos el resultado del final.", crecimiento: true },
  { etiqueta: "02  /  EL OBJETIVO", titulo: "Un solo número guía todas las decisiones", bajada: "Cada plan se evalúa con la misma fórmula del simulador oficial: menor costo, mejor plan.", formula: "distancia × tarifa + vehículos + tiempo total + fallas × penalidad + demora premium", puntos: ["Distancia: cuadras recorridas, con el regreso al depósito.", "Vehículos y tiempo total: usar más vehículos baja el tiempo, pero cada uno suma costo fijo.", "Fallas y premium: pedidos sin entregar, y minutos hasta entregar a los clientes premium."], porque: "Con un número único, cada etapa compara alternativas de forma objetiva, por ejemplo cuántos vehículos conviene usar.", desglose: true },
  { etiqueta: "03  /  AGRUPAMIENTO", titulo: "Primero repartimos los pedidos", bajada: "Probamos desde 1 hasta el máximo de vehículos, para decidir cuántos conviene usar.", usamos: "K-means y barrido angular.", porque: "K-means agrupa por cercanía pero ignora el depósito. El barrido corta la ciudad en rebanadas alrededor del depósito. No sabemos cuál conviene en cada caso, así que probamos los dos, refinamos varios arranques y nos quedamos con el que termina más barato.", nota: "Es solo el punto de partida: las etapas siguientes lo corrigen.", etapa: 2, zonas: true },
  { etiqueta: "04  /  BARRIDO ANGULAR", titulo: "La otra forma de agrupar", bajada: "El barrido angular ordena los pedidos por el ángulo que forman con el depósito y los corta en rebanadas, como una pizza.", usamos: "Barrido angular, probando todos los puntos de arranque del corte.", porque: "A diferencia de k-means, tiene en cuenta dónde está el depósito: cada vehículo atiende una rebanada y no cruza toda la ciudad. Como no sabemos cuál conviene en cada dataset, usamos los dos.", nota: notaBarrido, comparar: true, ancha: true },
  { etiqueta: "05  /  RUTA INICIAL", titulo: "Ordenamos cada grupo", bajada: "Cada reparto se convierte en una primera solución completa, con su costo.", usamos: "Vecino más cercano y 2-opt.", porque: "Ir siempre al pedido más próximo es rápido y da una ruta razonable. 2-opt invierte tramos cuando eso acorta el recorrido, y elimina los cruces.", etapa: 3, zonas: true },
  { etiqueta: "06  /  BÚSQUEDA LOCAL", titulo: "Mejoramos con cambios chicos", bajada: "Probamos movimientos y nos quedamos con los que bajan el costo total.", usamos: "Mover o intercambiar pedidos entre vehículos, invertir tramos, o dejar un pedido sin entregar si sale más barato.", porque: "Corrige lo que el agrupamiento no veía. Es el equivalente discreto del descenso de gradiente: acá se decide qué vehículo lleva cada pedido y en qué orden, y no hay una derivada que seguir.", nota: "Límite: se frena en un mínimo local, cuando ningún cambio chico mejora.", etapa: 4, zonas: true },
  { etiqueta: "07  /  RECOCIDO SIMULADO", titulo: "Escapar de los mínimos locales", bajada: "Probamos cambios al azar y a veces aceptamos uno peor, con una probabilidad que baja a medida que se enfría.", usamos: "Recocido simulado, con enfriamiento gradual.", porque: "Un descenso simple se queda en el primer valle que encuentra. Con temperatura alta el plan explora; al enfriarse se vuelve exigente. Siempre guardamos el mejor plan visto.", nota: "Ilustración con 2 variables. El costo real depende de decenas de decisiones, pero la idea es la misma.", paisaje3d: true },
  { etiqueta: "08  /  ARQUITECTURA", titulo: "Todo corre en Cloudflare", bajada: "Un solo proveedor para hostear la aplicación, la API y los datos.", puntos: ["Cloudflare Workers hospeda todo el proyecto: el front y la API con el solver.", "Un dominio propio, codejam.citax.com.ar, apunta al Worker de la aplicación.", "Cloudflare D1 (SQLite) da persistencia de datos y guarda ciertos datasets."], nota: "El solver corre dentro del Worker: por eso la API limita las iteraciones de cálculo.", arquitectura: true, ancha: true },
  { etiqueta: "09  /  ENTREGA", titulo: "Planes entregados y validados", bajada: "Los tres datasets del Evento 1 se subieron a la plataforma, que validó cada plan y calculó su costo.", puntos: ["Evento 1 A: válido, costo 1357.", "Evento 1 C: válido, costo 984.", "Evento 1 B: válido, costo 1806."], nota: "Cada entrega reemplaza a la anterior. El solver es heurístico: no garantiza el óptimo.", imagen: "entregas-evento1.png", alt: "Plataforma de entregas con los tres planes del Evento 1 válidos y sus costos", pie: "PLATAFORMA DE ENTREGAS · EVENTO 1", ancha: true },
  { etiqueta: "10  /  PROBALO", titulo: "Probá la aplicación", bajada: "Escaneá el código para abrir QuickDrop desde tu celular.", nota: "codejam.citax.com.ar", imagen: "qr-codejam.svg", alt: "Código QR que abre https://codejam.citax.com.ar/", pie: "CODEJAM.CITAX.COM.AR", qr: true },
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
      {slide.comparar && <ComparacionAgrupamiento dataset={informeZonas.dataset} kmeans={informeZonas.etapas[1].instantanea} barrido={datosBarrido} costoKmeans={arranque.kmeans} costoBarrido={arranque.barrido} />}
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
