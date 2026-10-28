import { useEffect, useState } from "react";

type Status = "checking" | "online" | "offline";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

export function App() {
  const [status, setStatus] = useState<Status>("checking");

  async function checkApi(signal?: AbortSignal) {
    setStatus("checking");
    const requestSignal = AbortSignal.any([
      signal ?? new AbortController().signal,
      AbortSignal.timeout(10_000),
    ]);
    try {
      const response = await fetch(`${apiUrl}/api/health`, { signal: requestSignal });
      const result: { status?: string } = await response.json();
      setStatus(response.ok && result.status === "ok" ? "online" : "offline");
    } catch {
      if (signal?.aborted) return;
      setStatus("offline");
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void checkApi(controller.signal);
    return () => controller.abort();
  }, []);

  const message = {
    checking: "Conectando con la API…",
    online: "API y base de datos conectadas",
    offline: "No se pudo conectar con la API",
  }[status];

  return (
    <main className="page">
      <section className="card" aria-labelledby="title">
        <span className="eyebrow">Un espacio para crear</span>
        <h1 id="title">CodeJam</h1>
        <p className="intro">Tu proyecto empieza aquí.</p>
        <div className={`connection connection--${status}`} role="status" aria-live="polite">
          <span className="indicator" aria-hidden="true" />
          {message}
        </div>
        <md-filled-button disabled={status === "checking"} onClick={() => void checkApi()}>
          Comprobar conexión
        </md-filled-button>
      </section>
    </main>
  );
}
