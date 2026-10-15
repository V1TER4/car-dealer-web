import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    allowedHosts: [
      "dev.vehicle-platform-web",
      "painel.vehicle-platform-web",
      ".vehicle-platform-web",
    ],
    hmr: {
      host: "dev.vehicle-platform-web",
    },
  },
  build: {
    outDir: 'public',
  },
})
