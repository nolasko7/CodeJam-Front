import { MapaGrilla } from "./MapaGrilla";
import type { Dataset } from "../tipos";

// Ubicaciones y pedidos premium del ejemplo oficial del Evento 1.
const ejemplo: Dataset = {
  mundo: { ancho: 20, alto: 20, deposito: { x: 0, y: 0 }, horaSalida: 480, tiempoServicio: 5, tiempoCarga: 10, minPorCuadra: 3, costos: { porCuadra: 3, porVehiculo: 60, porMinutoTotal: 1, porFalla: 200 } },
  pedidos: [
    { id: 1, x: 3, y: 4, peso: 8 }, { id: 2, x: 6, y: 2, peso: 12, premium: true },
    { id: 3, x: 10, y: 10, peso: 20 }, { id: 4, x: 15, y: 3, peso: 5 },
    { id: 5, x: 2, y: 15, peso: 18 }, { id: 6, x: 12, y: 17, peso: 7, premium: true },
    { id: 7, x: 18, y: 18, peso: 25 }, { id: 8, x: 7, y: 9, peso: 10 },
    { id: 9, x: 16, y: 11, peso: 14 }, { id: 10, x: 4, y: 7, peso: 6 },
  ],
  vehiculos: [{ id: "V1" }, { id: "V2" }, { id: "V3" }],
};

export function DesafioPremium() {
  return (
    <div className="desafio">
      <section className="panel desafio__intro" aria-labelledby="desafio-titulo">
        <div>
          <span className="eyebrow">Desafío 1 · Vista previa</span>
          <h2 id="desafio-titulo">Cliente prioritario</h2>
          <p>Los pedidos premium suman un costo según el tiempo que esperan desde la salida hasta su entrega. Entregarlos antes puede reducir el costo, aunque no necesariamente irán primero.</p>
        </div>
        <div className="desafio__aviso"><strong>Experiencia en preparación</strong><span>El mapa muestra el ejemplo oficial. La carga y los resultados premium se conectarán cuando esté lista la lógica del desafío.</span></div>
      </section>

      <section className="panel" aria-labelledby="premium-resumen">
        <div className="desafio__cabecera"><div><span className="eyebrow">Resultado del plan</span><h2 id="premium-resumen">Seguimiento premium</h2></div><span className="desafio__estado">Pendiente de cálculo</span></div>
        <div className="premium-metricas">
          <div><span>Premium entregados</span><strong>— / —</strong><small>Entregados del total</small></div>
          <div><span>Espera acumulada</span><strong>— min</strong><small>Desde la salida hasta cada entrega</small></div>
          <div><span>Costo premium</span><strong>—</strong><small>Espera acumulada × costo por minuto</small></div>
        </div>
        <div className="premium-formula"><span>★</span><div><strong>Desglose de costo · Premium</strong><p>— min de espera × — por minuto = <b>—</b></p></div></div>
      </section>

      <section className="panel" aria-labelledby="premium-mapa">
        <div className="desafio__cabecera"><div><span className="eyebrow">Ejemplo del simulador</span><h2 id="premium-mapa">Pedidos en el mapa</h2></div><span className="premium-insignia">★ 2 pedidos premium</span></div>
        <p className="panel__ayuda">Tocá un pedido o seleccionalo con el teclado para ver su detalle. La estrella identifica a los premium.</p>
        <div className="desafio__mapa"><MapaGrilla dataset={ejemplo} instantanea={null} resaltado={null} onResaltar={() => {}} mostrarPremium /></div>
        <div className="leyenda desafio__leyenda"><span><b className="premium-estrella">★</b> Pedido premium</span><span><i className="leyenda__punto leyenda__punto--hueco" /> Pedido estándar</span></div>
      </section>

      <div className="grilla-2">
        <section className="panel" aria-labelledby="premium-tiempo">
          <span className="eyebrow">Línea de tiempo</span><h2 id="premium-tiempo">Cuándo llega cada pedido</h2>
          <p className="panel__ayuda">Las entregas premium se identificarán con una estrella en la línea de tiempo y en el detalle de cada visita.</p>
          <div className="premium-vacio"><span aria-hidden="true">★</span><div><strong>Esperando un plan</strong><p>Los horarios aparecerán cuando se resuelva el desafío.</p></div></div>
        </section>
        <section className="panel" aria-labelledby="premium-plan">
          <span className="eyebrow">Plan de reparto</span><h2 id="premium-plan">Orden de las paradas</h2>
          <p className="panel__ayuda">Cada ruta distinguirá sus pedidos premium para reconocerlos en el orden de entrega.</p>
          <div className="premium-vacio"><span aria-hidden="true">★</span><div><strong>Esperando un plan</strong><p>Las rutas y sus paradas aparecerán acá.</p></div></div>
        </section>
      </div>
    </div>
  );
}
