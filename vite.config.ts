/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { complexityApiPlugin } from './src/server/middleware/vite-plugin-analyzer.ts';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables into process.env for server-side endpoints
  const env = loadEnv(mode, process.cwd(), '');
  if (env.OPENROUTER_API_KEY) {
    process.env.OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;
  }
  if (env.OPENROUTER_MODEL) {
    process.env.OPENROUTER_MODEL = env.OPENROUTER_MODEL;
  }

  return {
    plugins: [react(), complexityApiPlugin()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});
