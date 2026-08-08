// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from 'fs';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

let backendUrl = "http://127.0.0.1:5050";
try {
  const portFile = path.resolve(__dirname, "backend/.current_port");
  if (fs.existsSync(portFile)) {
    backendUrl = "http://" + fs.readFileSync(portFile, "utf-8").trim();
    console.log(`[Vite] Proxying /api to backend at ${backendUrl}`);
  }
} catch (e) {}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'CampusX AI',
          short_name: 'CampusX',
          description: 'Autonomous Multi-Agent Campus Assistant',
          theme_color: '#0f172a',
          background_color: '#020817',
          display: 'standalone',
          icons: [
            {
              src: 'favicon.ico',
              sizes: '64x64 32x32 24x24 16x16',
              type: 'image/x-icon'
            }
          ]
        }
      })
    ],
    server: {
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  },
});
