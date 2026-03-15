import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/astro_turfer/',
  server: {
    port: 5173,
    host: true
  }
}));
