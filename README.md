# QuickDrop · CodeJam Front

React 19, Vite 8, TypeScript y Material Design 3. Permite subir datasets, resolver planes de reparto con la API y explorar los costos, el mapa y las etapas del algoritmo. También abre un `informe.json` generado por el solver sin usar la API.

## Desarrollo

Usar Node.js **22.23.0** (`.nvmrc`). `cf` también acepta las ramas 24 desde 24.22.0 y 26 desde 26.12.0; un Node 24 anterior muestra una advertencia de engine.

```sh
npm ci
npm run dev
```

Copiar `.env.example` a `.env.local` para cambiar `VITE_API_URL`. El build de producción usa `.env.production` si no hay un override. La API debe admitir el origen del front en su configuración CORS.

## Responsive

El layout usa CSS, sin detectar dispositivos por JavaScript. Los paneles se apilan según su espacio disponible; en pantallas de hasta 640 px los controles de carga ocupan el ancho y los pasos forman dos columnas. Los gráficos conservan un ancho legible y se desplazan dentro de su panel. Las tablas también tienen scroll local. Se respetan las safe areas y el zoom del navegador.

Los pedidos del mapa, la comparación de vehículos y las visitas de la línea de tiempo muestran su detalle por toque, mouse o foco de teclado; Escape lo cierra. El gráfico de convergencia permite recorrer puntos con las flechas. Los filtros de vehículo son botones que se activan por toque o teclado.

## PWA

`public/site.webmanifest` define la identidad, el modo standalone y los íconos reutilizados de `branding/`. `vite-plugin-pwa` genera un service worker en **el directorio de assets del build de Cloudflare**, con el HTML, JS, CSS e íconos precargados. No se registran workers en `npm run dev`; comprobar instalación y offline en el build:

```sh
npm test
npm run build
npm run check:pwa
npm run preview -- --host localhost --port 5173
```

La instalación requiere HTTPS o localhost y depende del soporte del navegador. El botón «Instalar app» aparece cuando el navegador ofrece la instalación. También se muestran instrucciones para instalar desde el menú; en iPhone/iPad, usar Compartir → Agregar a inicio.

Después de una primera carga online se puede volver a abrir la app y cargar un informe local sin conexión. **Resolver datasets requiere la API e internet**: el service worker no cachea solicitudes ni respuestas de la API. Los informes quedan en memoria y no se restauran al recargar. La fuente de Google es opcional; sin red se utiliza la fuente del sistema.

Las versiones nuevas esperan hasta que el usuario pulse «Actualizar app». El botón se deshabilita durante una resolución y el aviso recuerda descargar el plan antes de recargar. Cada pestaña requiere su propia acción: una actualización aceptada en otra pestaña no recarga la resolución ni el informe de esta. No se fuerza `skipWaiting` al instalar. Cerrar todas las ventanas permite que el navegador active normalmente una versión pendiente. `public/_headers` exige revalidar el worker, su receptor push y el manifest.

## Notificaciones push: viable, receptor preparado

El worker importa `public/push.js`, que muestra notificaciones y abre únicamente destinos del mismo origen. Un payload JSON puede ser:

```json
{ "title": "Plan listo", "body": "Tu plan de reparto está disponible.", "url": "/" }
```

Los payloads vacíos o inválidos producen un aviso genérico. Se reutiliza una ventana si ya muestra el destino. Los tests cubren la recepción, datos inválidos y URLs externas o con esquemas ejecutables.

**El envío remoto todavía no está implementado.** El backend actual solo expone health y resolución síncrona; agregar para habilitarlo:

1. Claves VAPID: publicar solo la clave pública; guardar la privada como secreto del Worker.
2. Un botón de suscripción que detecte `isSecureContext`, Service Worker, `PushManager` y `Notification`. Pedir permiso únicamente tras un clic. Tratar permiso denegado y navegadores no compatibles sin bloquear la app.
3. Persistir en el backend `PushSubscription.toJSON()` asociada al usuario, con endpoints para alta/baja protegidos y CORS del origen exacto. Tratar endpoint y claves de suscripción como datos privados.
4. Enviar Web Push cifrado desde el backend o un proveedor compatible; limpiar suscripciones vencidas al recibir 404/410. Para avisar de resoluciones terminadas con la app cerrada se necesita además ejecutar y persistir trabajos en segundo plano: hoy el resultado solo vuelve como respuesta al POST.
5. Probar la entrega real en Android/escritorio y una PWA instalada en iOS/iPadOS. En iOS/iPadOS, Web Push está disponible desde 16.4 para apps agregadas al inicio; el permiso requiere interacción del usuario.

No se ofrece un botón de activación hasta disponer de la suscripción y envío completos.

Referencias: [Push API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API), [Web Push en iOS/iPadOS (WebKit)](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [actualización manual (Vite PWA)](https://vite-pwa-org.netlify.app/guide/prompt-for-update).

## Deploy controlado en Cloudflare

La rama de implementación es `feat/pwa-responsive`. Los pushes a ramas distintas de `main` y los PR hacia `main` ejecutan **Validate frontend**: instalación, tests, typecheck/build y verificación de assets PWA. Ese workflow no despliega ni necesita un token de Cloudflare.

La publicación sigue limitada a `main`: revisar el diff y los checks de la rama antes de integrarla. Todo push a `main` ejecuta **Deploy Worker**; también se puede disparar manualmente seleccionando `main`. La rama de trabajo no publica sobre `codejam.citax.com.ar`.

Para un bloqueo de aprobación previo al deploy, configurar revisores requeridos en el environment de GitHub `CLOUDFLARE_API_TOKEN`, que ya utiliza el workflow, y proteger `main` con PR y checks requeridos. Esas políticas se configuran en GitHub; crear la rama por sí solo no las aplica.

El secret `CLOUDFLARE_API_TOKEN` necesita Workers Scripts Edit para la cuenta de `cloudflare.config.ts`. El workflow valida el token, ejecuta `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `npm run check:pwa` y finalmente `npm run deploy -- --prebuilt`.

Un preview con otro dominio requiere ampliar el allowlist CORS del backend. No reutilizar los dominios/triggers de producción para un Worker de preview. Las suscripciones push también pertenecen a su origen: preview y producción deben mantenerse separados.
