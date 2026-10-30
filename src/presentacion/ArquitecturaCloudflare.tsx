const RUTA = "/capturas-presentacion";

interface NodoProps {
  logo: string;
  titulo: string;
  detalle: string;
  etiqueta?: string;
  variante?: "dominio" | "d1";
}

function Nodo({ logo, titulo, detalle, etiqueta, variante }: NodoProps) {
  return (
    <div className={`arq__nodo ${variante ? `arq__nodo--${variante}` : ""}`}>
      <img src={`${RUTA}/${logo}`} alt="" width={40} height={40} />
      <div>
        <strong>{titulo}</strong>
        <span>{detalle}</span>
      </div>
      {etiqueta && <em>{etiqueta}</em>}
    </div>
  );
}

function Flecha({ texto }: { texto: string }) {
  return <div className="arq__flecha" aria-hidden="true"><i />{texto}</div>;
}

// Dominio propio → Worker del front → Worker de la API → D1. Los logos son los de Cloudflare y el favicon de la app.
export function ArquitecturaCloudflare() {
  return (
    <div className="arq" role="img" aria-label="Arquitectura: el dominio codejam.citax.com.ar apunta a un Worker de Cloudflare con la aplicación, que llama a otro Worker con la API y el solver, y la API guarda los datos en Cloudflare D1 (SQLite).">
      <Nodo logo="logo-cloudflare.svg" titulo="codejam.citax.com.ar" detalle="Dominio propio" variante="dominio" />
      <Flecha texto="apunta al Worker" />
      <Nodo logo="favicon-codejam.png" titulo="codejam-front" detalle="Aplicación web" etiqueta="Cloudflare Worker" />
      <Flecha texto="llama a la API (HTTP)" />
      <Nodo logo="logo-cloudflareworkers.svg" titulo="codejam-back" detalle="API y solver del reparto" etiqueta="Cloudflare Worker" />
      <Flecha texto="binding DB" />
      <Nodo logo="logo-cloudflare.svg" titulo="Cloudflare D1" detalle="SQLite: persistencia y datasets guardados" variante="d1" />
    </div>
  );
}
