import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: '/fmd/',
  plugins: mode === 'e2e' ? [{
    name: 'fmd-e2e-bridge',
    transformIndexHtml: {
      order: 'pre',
      handler: () => [{
        tag: 'script',
        attrs: { type: 'module', src: '/src/testing/e2e-entry.ts' },
        injectTo: 'body',
      }],
    },
  }] : [],
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1_200,
  },
}));
