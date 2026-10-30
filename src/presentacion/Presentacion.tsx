import { useEffect, useState } from "react";
import { siguienteIndice } from "./navegacion.mjs";
import "./presentacion.css";

type Diapositiva = { etiqueta: string; titulo: string; bajada: string; puntos?: string[]; imagen?: string; alt?: string; nota?: string; formula?: string; portada?: boolean };

const slides: Diapositiva[] = [
  { etiqueta: "CODEJAM  /  QUICKDROP", titulo: "Un plan de reparto, explicado paso a paso.", bajada: "Cómo convertimos pedidos en rutas, evaluamos su costo y hacemos visible cada decisión.", portada: true, nota: "Recorrido del producto y del optimizador" },
  { etiqueta: "01  /  LA EXPERIENCIA", titulo: "De los datos al plan", bajada: "La pantalla guía al usuario desde la carga hasta la descarga del resultado.", puntos: ["Elegir archivos JSON o CSV, el ejemplo o un dataset aleatorio.", "Seleccionar el esfuerzo de búsqueda y resolver con la API.", "Explorar el costo, las etapas, los vehículos y la línea de tiempo. Descargar el plan en JSON o CSV."], imagen: "carga.jpg", alt: "Pantalla de carga de dataset y selección de esfuerzo", nota: "También se puede abrir un informe generado localmente, sin API." },
  { etiqueta: "02  /  ENTRADA", titulo: "Primero leemos el mundo", bajada: "El solver valida y normaliza los archivos de mundo, pedidos y vehículos.", puntos: ["El depósito, la velocidad, los tiempos y las tarifas vienen del dataset.", "Los pedidos aportan ubicación y peso. Los vehículos definen los recursos disponibles.", "La misma entrada se acepta en JSON o CSV."], imagen: "lectura.jpg", alt: "Etapa de lectura del dataset", nota: "Ejemplo reproducible: 10 pedidos, 3 vehículos; semilla 2026 y 60.000 iteraciones." },
  { etiqueta: "03  /  AGRUPAMIENTO", titulo: "Agrupamos pedidos para cada k", bajada: "Probamos cada máximo de vehículos disponible, desde 1 hasta 3 en este ejemplo.", puntos: ["K-means y barrido angular proponen repartos iniciales de pedidos.", "Se construyen rutas para comparar candidatos y se refinan varios arranques.", "En esta etapa los grupos todavía no tienen orden de visita ni costo propio."], imagen: "agrupamiento.jpg", alt: "Selector de etapas con agrupamiento y mapa de pedidos" },
  { etiqueta: "04  /  RUTA INICIAL", titulo: "Construimos la primera ruta", bajada: "Cada grupo se ordena por vecino más cercano y luego se ajusta con 2-opt.", puntos: ["La primera solución completa ya puede simularse y recibir un costo.", "El mapa muestra el depósito, los pedidos y los recorridos por vehículo.", "En el caso elegido, la ruta inicial cuesta 638."], imagen: "ruta.jpg", alt: "Mapa de la ruta inicial" },
  { etiqueta: "05  /  BÚSQUEDA", titulo: "Exploramos rutas alternativas", bajada: "La búsqueda local conserva cambios que reducen el costo total.", puntos: ["Reordena, reubica e intercambia pedidos, incluso entre vehículos.", "El recocido simulado también acepta algunas soluciones peores para escapar de mínimos locales.", "La temperatura disminuye con las iteraciones y se conserva el mejor resultado encontrado."], imagen: "local.jpg", alt: "Etapa de búsqueda local seleccionada en el mapa", nota: "En esta corrida el costo del k elegido permanece en 638; otras entradas pueden mejorar." },
  { etiqueta: "05B  /  RECOCIDO", titulo: "Exploración con temperatura", bajada: "El recocido prueba cambios al azar y permite algunos empeoramientos para buscar otras soluciones.", puntos: ["La probabilidad de aceptar un empeoramiento disminuye durante el enfriamiento.", "Se guarda el mejor plan encontrado durante las 60.000 iteraciones de esta corrida.", "La curva de convergencia permite comparar el costo actual con el mejor registrado."], imagen: "recocido.jpg", alt: "Etapa de recocido simulado seleccionada en el mapa", nota: "En el ejemplo elegido el mejor costo sigue siendo 638." },
  { etiqueta: "06  /  PULIDO", titulo: "Cerramos y verificamos el plan", bajada: "Una última búsqueda local precede al pulido exacto del orden de cada ruta pequeña.", puntos: ["Held-Karp calcula el orden de menor distancia para rutas de hasta 12 pedidos.", "Se selecciona el menor costo entre los k probados; ante empate, se prefieren menos vehículos usados.", "El plan final se simula y se comprueba que su costo coincida con el evaluador interno."], imagen: "pulido.jpg", alt: "Etapa de pulido exacto", nota: "El orden exacto se aplica por ruta; no garantiza el óptimo global del problema." },
  { etiqueta: "07  /  COSTO", titulo: "Cuatro componentes, una decisión", bajada: "La función objetivo combina el recorrido con los recursos y las entregas pendientes.", formula: "distancia × tarifa + vehículos + makespan × tarifa + fallas × penalidad", puntos: ["Distancia: cuadras recorridas, incluido el regreso al depósito.", "Vehículos: suma del costo fijo de los vehículos usados.", "Makespan: minutos desde la salida hasta el regreso del último vehículo.", "Fallas: pedidos sin asignar multiplicados por su penalidad."], imagen: "ruta.jpg", alt: "Resumen del costo total y entregas" },
  { etiqueta: "08  /  EJEMPLO REAL", titulo: "El resultado: 638", bajada: "El ejemplo entrega los 10 pedidos usando 1 de los 3 vehículos disponibles.", formula: "88 × 3  +  60  +  314 × 1  +  0 × 200  =  638", puntos: ["264 por distancia; 60 por vehículo; 314 por tiempo; 0 por fallas.", "El vehículo sale a las 08:00 y regresa a las 13:14.", "Los tres máximos de vehículos terminan con costo 638; el desempate favorece menos vehículos usados."], imagen: "ruta.jpg", alt: "Resultado de la ejecución: costo total 638 y diez entregas" },
  { etiqueta: "09  /  UI Y UX", titulo: "El resultado se puede investigar", bajada: "La interfaz hace visible tanto el plan como el proceso que lo produjo.", puntos: ["El resumen pone primero el costo y las entregas, con su desglose.", "El selector permite recorrer las seis etapas y comparar el mapa.", "La comparación de k, la convergencia y la línea de tiempo explican decisiones y horarios.", "Los detalles se consultan con toque, mouse o teclado; el diseño se adapta a pantallas pequeñas."], imagen: "analisis.jpg", alt: "Interfaz de análisis de la ejecución", nota: "Las capturas corresponden a la ejecución local del ejemplo." },
  { etiqueta: "10  /  ENTREGA", titulo: "Un plan listo para evaluar", bajada: "La aplicación exporta las rutas y el simulador determina su validez y costo.", puntos: ["El resultado incluye el orden de paradas por vehículo y los pedidos sin asignar.", "El backend incorpora una simulación equivalente a la oficial y contrasta el costo antes de devolver el informe.", "El solver es heurístico: explora alternativas, pero no promete el mejor plan global."], imagen: "ruta.jpg", alt: "Acciones para descargar el plan", nota: "Código fuente: CodeJam-Front y CodeJam-Back. Dataset: quickdrop-sim/datos/ejemplo." },
];

export function Presentacion() {
  const [indice, setIndice] = useState(0);
  const slide = slides[indice];
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
    <article className={`pres-slide ${slide.portada ? "pres-slide--portada" : ""}`} key={indice} aria-live="polite">
      <div className="pres-copy">
        <p className="pres-label">{slide.etiqueta}</p>
        <h1>{slide.titulo}</h1>
        <p className="pres-lead">{slide.bajada}</p>
        {slide.formula && <p className="pres-formula">{slide.formula}</p>}
        {slide.puntos && <ul>{slide.puntos.map((p) => <li key={p}>{p}</li>)}</ul>}
        {slide.nota && <p className="pres-note">{slide.nota}</p>}
      </div>
      {slide.imagen && <figure className="pres-figure"><img src={`/capturas-presentacion/${slide.imagen}`} alt={slide.alt} /><figcaption>CAPTURA DE LA APLICACIÓN · EJEMPLO DEL SIMULADOR</figcaption></figure>}
      {slide.portada && <div className="pres-cover-number" aria-hidden="true">01<span>—</span>12</div>}
    </article>
    <footer className="pres-footer"><div><strong>{String(indice + 1).padStart(2, "0")}</strong> <span>/ {String(slides.length).padStart(2, "0")}</span></div><div className="pres-progress" aria-hidden="true"><i style={{ width: `${((indice + 1) / slides.length) * 100}%` }} /></div><div className="pres-controls"><button onClick={() => setIndice((i) => siguienteIndice(i, -1, slides.length))} disabled={indice === 0} aria-label="Diapositiva anterior">←</button><button onClick={() => setIndice((i) => siguienteIndice(i, 1, slides.length))} disabled={indice === slides.length - 1} aria-label="Diapositiva siguiente">→</button></div></footer>
  </main>;
}



