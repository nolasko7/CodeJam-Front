# PWA responsive — plan de implementación

**Objetivo:** adaptar QuickDrop a móvil y escritorio, permitir su instalación y preparar la recepción de push en una rama independiente de producción.

**Decisiones:** conservar React, Vite, Material y el diseño existente. Usar CSS para el layout, sin detectar dispositivos por JavaScript. Usar `vite-plugin-pwa` compatible con Vite 8 para precachear el shell; las solicitudes a la API siguen requiriendo conexión. Reutilizar los íconos de `branding`. Actualizar solo por acción del usuario, nunca durante una resolución.

- [x] Responsive: controles táctiles, safe areas, contenido largo y columnas flexibles. Gráficos legibles con scroll interno; mapa y detalles accesibles por toque y teclado.
- [x] PWA: manifest e íconos servidos, instalación contextual, estado offline y aviso de actualización manual. Verificar typecheck y build Cloudflare.
- [x] Push: receptor `push` y apertura de notificaciones limitada al mismo origen, con pruebas Node. Documentar VAPID, suscripciones, permisos, envío desde backend e instalación en iOS; no exponer un botón de suscripción sin backend.
- [x] Deploy: validar la rama/PR en CI sin publicar; producción conserva su workflow limitado a `main`.
- [x] Verificación: pruebas del receptor y assets, navegador en 320/390/768/1440 px, carga de informe, navegación, toque, teclado, offline y actualización.

**Riesgos a revisar:** navegador sin APIs PWA, permiso push denegado, payload inválido o URL externa, informe abierto al actualizar, pérdida de conexión y desbordamiento de tablas/mapas.

**Fuentes:** [Vite PWA](https://vite-pwa-org.netlify.app/guide/), [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API), [WebKit/iOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).

## Evidencia y decisiones finales

- `npm run typecheck`, `npm test` (4 casos), `npm run build` y `npm run check:pwa` pasan.
- Playwright con Chrome instalado y preview Cloudflare en localhost:5173: 320, 390, 768 y 1440 px, sin overflow de página, sin errores/warnings de consola, navegación, toque/teclado, nombres largos, tabla abierta, recarga offline y apertura de informe local. Las respuestas API fueron simuladas con un informe real generado por el solver; las fuentes remotas se sustituyeron por la fuente del sistema durante QA.
- Prueba con workers reales y tres pestañas: una actualización aceptada en otra pestaña conserva el cálculo en curso y el informe pospuesto; luego permite aplicar la versión localmente. La prueba reprodujo la recarga no deseada antes de corregirla y pasó después.
- Los detalles de los gráficos se renderizan fuera del contenedor con scroll, para que permanezcan visibles en escritorio. La prueba reprodujo el recorte antes del cambio y pasó después.
- Pendiente fuera de este alcance: suscripción y envío push del backend, pruebas de instalación/entrega en dispositivos reales y configuración de protecciones/revisores en GitHub. La rama no modifica el backend ni publica producción.
