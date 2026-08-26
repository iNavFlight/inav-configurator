import { defineConfig } from 'vite';
import { pluginExposeRenderer } from './vite.base.config';
import inject from '@rollup/plugin-inject';

export default defineConfig((env) => {
  /** @type {import('vite').ConfigEnv<'renderer'>} */
  const forgeEnv = env;
  const { root, mode, forgeConfigSelf } = forgeEnv;
  const name = forgeConfigSelf.name ?? '';

  /** @type {import('vite').UserConfig} */
  return {
    root,
    mode,
    base: './',
    assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.wasm'],
    build: {
      outDir: `.vite/renderer/${name}`,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      chunkSizeWarningLimit: 10240,
      rollupOptions: {
        external: ['virtual:pwa-register'],
      }
    },
    plugins: [
      inject({
        $: 'jquery',
        jQuery: 'jquery',        
      }),
      pluginExposeRenderer(name)],
    resolve: {
      preserveSymlinks: true,
    },
    clearScreen: false,
  };
});
