import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

let clientBuild: { outDir: string };

export default defineConfig({
  plugins: [react(), cloudflare(), VitePWA({
    registerType: "prompt",
    injectRegister: false,
    manifest: false,
    integration: {
      configureOptions(config) {
        clientBuild = config.environments.client.build;
      },
      beforeBuildServiceWorker(options) {
        // Cloudflare fija el outDir después de configResolved de Vite PWA.
        options.workbox.globDirectory = clientBuild.outDir;
        options.workbox.swDest = `${clientBuild.outDir}/sw.js`;
      },
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
      importScripts: ["/push.js"],
      navigateFallback: "/index.html",
      navigateFallbackDenylist: [/^\/api\//],
      cleanupOutdatedCaches: true,
    },
  })],
  server: { port: 5173, strictPort: true },
});
