import { defineConfig } from 'vite';
import inject from '@rollup/plugin-inject';

export default defineConfig({
  base: './',
  assetsInclude: ['**/*.gltf', '**/*.glb'],
  build: {
    outDir: 'dist-web',
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    chunkSizeWarningLimit: 10240,
  },
  plugins: [
    inject({
      $: 'jquery',
      jQuery: 'jquery',
    }),
  ],
  resolve: {
    preserveSymlinks: true,
  },
  clearScreen: false,
});
