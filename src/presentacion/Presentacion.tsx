import { useEffect, useState } from "react";
import { MapaGrilla } from "../components/MapaGrilla";
import { DesgloseCosto } from "../components/DesgloseCosto";
import type { Informe } from "../tipos";
import datos from "./informe.json";
import { Paisaje3D } from "./Paisaje3D";
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
  desglose?: boolean;
  nota?: string;
  formula?: string;
  portada?: boolean;
  paisaje3d?: boolean;
};

const slides: Diapositiva[] = [
  { etiqueta: "CODEJAM  /  QUICKDROP", titulo: "Cómo armamos el plan de reparto", bajada: "Qué técnicas usamos en cada paso, y por qué.", portada: true, nota: "Un optimizador heurístico en cinco etapas" },
  { etiqueta: "01  /  EL OBJETIVO", titulo: "Un solo número guía todas las decisiones", bajada: "Cada plan se evalúa con la misma fórmula del simulador oficial: menor costo, mejor plan.", formula: "distancia × tarifa + vehículos + tiempo total + fallas × penalidad + demora premium", puntos: ["Distancia: cuadras recorridas, con el regreso al depósito.", "Vehículos y tiempo total: usar más vehículos baja el tiempo, pero cada uno suma costo fijo.", "Fallas y premium: pedidos sin entregar, y minutos hasta entregar a los clientes premium."], porque: "Con un número único, cada etapa compara alternativas de forma objetiva, por ejemplo cuántos vehículos conviene usar.", desglose: true },
  { etiqueta: "02  /  AGRUPAMIENTO", titulo: "Primero repartimos los pedidos", bajada: "Probamos desde 1 hasta el máximo de vehículos, para decidir cuántos conviene usar.", usamos: "K-means y barrido angular.", porque: "K-means agrupa por cercanía pero ignora el depósito. El barrido corta la ciudad en rebanadas alrededor del depósito. No sabemos cuál conviene en cada caso, así que probamos los dos y partimos del plan más barato.", nota: "Es solo el punto de partida: las etapas siguientes lo corrigen.", etapa: 2 },
  { etiqueta: "03  /  RUTA INICIAL", titulo: "Ordenamos cada grupo", bajada: "Cada reparto se convierte en una primera solución completa, con su costo.", usamos: "Vecino más cercano y 2-opt.", porque: "Ir siempre al pedido más próximo es rápido y da una ruta razonable. 2-opt invierte tramos cuando eso acorta el recorrido, y elimina los cruces.", etapa: 3 },
  { etiqueta: "04  /  BÚSQUEDA LOCAL", titulo: "Mejoramos con cambios chicos", bajada: "Probamos movimientos y nos quedamos con los que bajan el costo total.", usamos: "Mover o intercambiar pedidos entre vehículos, invertir tramos, o dejar un pedido sin entregar si sale más barato.", porque: "Corrige lo que el agrupamiento no veía. Es el equivalente discreto del descenso de gradiente: acá se decide qué vehículo lleva cada pedido y en qué orden, y no hay una derivada que seguir.", nota: "Límite: se frena en un mínimo local, cuando ningún cambio chico mejora.", etapa: 4 },
  { etiqueta: "05  /  RECOCIDO SIMULADO", titulo: "Escapar de los mínimos locales", bajada: "Probamos cambios al azar y a veces aceptamos uno peor, con una probabilidad que baja a medida que se enfría.", usamos: "Recocido simulado, con enfriamiento gradual.", porque: "Un descenso simple se queda en el primer valle que encuentra. Con temperatura alta el plan explora; al enfriarse se vuelve exigente. Siempre guardamos el mejor plan visto.", nota: "Ilustración con 2 variables. El costo real depende de decenas de decisiones, pero la idea es la misma.", paisaje3d: true },
  { etiqueta: "06  /  PULIDO EXACTO", titulo: "Cerramos con el orden óptimo", bajada: "En las rutas cortas dejamos de aproximar y calculamos la mejor respuesta.", usamos: "Held-Karp (programación dinámica) en rutas de hasta 12 pedidos. Con clientes premium, ramificación y poda en rutas de hasta 9.", porque: "Probar todos los órdenes del plan completo es imposible, pero en una ruta corta sí. Así ninguna ruta pequeña queda con un orden que se pueda mejorar.", nota: "El orden exacto es por ruta: no garantiza el óptimo de todo el plan.", etapa: 6 },
  { etiqueta: "07  /  RESULTADO", titulo: "Ejemplo real: costo 638", bajada: "10 pedidos y 3 vehículos disponibles: el plan entrega todo con uno solo.", formula: "88 × 3  +  60  +  314 × 1  +  0 × 200  =  638", puntos: ["264 por distancia, 60 por vehículo, 314 por tiempo y 0 por fallas.", "Con 10 pedidos lo comprobamos por fuerza bruta: no existe un plan más barato.", "El solver es heurístico: con más pedidos no promete el óptimo, pero compara muchas alternativas."], etapa: 6 },
];

const informe = datos;

export function Presentacion() {
  const [indice, setIndice] = useState(0);
  const slide = slides[indice];
  const [resaltado, setResaltado] = useState<string | null>(null);
  useEffect(() => {
    const teclado = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) return;
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
    <article className={`pres-slide ${slide.portada ? "pres-slide--portada" : ""} ${slide.paisaje3d ? "pres-slide--3d" : ""}`} key={indice} aria-live="polite">
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
      {slide.etapa && <figure className="pres-figure"><MapaGrilla dataset={informe.dataset} instantanea={informe.etapas[slide.etapa - 1].instantanea} resaltado={resaltado} onResaltar={setResaltado} /><figcaption>MAPA DE LA APLICACIÓN · EJEMPLO DEL SIMULADOR</figcaption></figure>}
      {slide.desglose && <figure className="pres-figure pres-desglose"><h2>Desglose del costo <strong>638</strong></h2><DesgloseCosto costo={informe.evaluacion.costo} metricas={informe.evaluacion.metricas} mundo={informe.dataset.mundo} /><figcaption>DESGLOSE DE LA APLICACIÓN · EJEMPLO DEL SIMULADOR</figcaption></figure>}
      {slide.portada && <div className="pres-cover-number" aria-hidden="true">01<span>—</span>{String(slides.length).padStart(2, "0")}</div>}
    </article>
    <footer className="pres-footer"><div><strong>{String(indice + 1).padStart(2, "0")}</strong> <span>/ {String(slides.length).padStart(2, "0")}</span></div><div className="pres-progress" aria-hidden="true"><i style={{ width: `${((indice + 1) / slides.length) * 100}%` }} /></div><div className="pres-controls"><button onClick={() => setIndice((i) => siguienteIndice(i, -1, slides.length))} disabled={indice === 0} aria-label="Diapositiva anterior">←</button><button onClick={() => setIndice((i) => siguienteIndice(i, 1, slides.length))} disabled={indice === slides.length - 1} aria-label="Diapositiva siguiente">→</button></div></footer>
  </main>;
}
