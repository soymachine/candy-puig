import { defineConfig } from 'vite';

export default defineConfig({
  base: '/candy-puig/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
