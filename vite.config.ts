import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { apiDevPlugin } from './vite-api-plugin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load every env var (empty prefix) so the dev-mode /api handlers can read
  // server-only secrets such as NASA_API_KEY and GEMINI_API_KEY.
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), tailwindcss(), apiDevPlugin()],
    server: { port: 5173 },
    build: { target: 'es2022', chunkSizeWarningLimit: 1600 },
  };
});
