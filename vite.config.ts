import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), cloudflare()],
  build: { rollupOptions: { input: ["index.html", "presentacion/index.html"] } },
  server: { port: 5173, strictPort: true },
});

