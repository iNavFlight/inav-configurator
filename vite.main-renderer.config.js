import { defineConfig } from 'vite';
import { pluginExposeRenderer } from './vite.base.config';
import inject from '@rollup/plugin-inject';

// The Electron build has no service worker, so it doesn't use vite-plugin-pwa
// (that's only configured in vite.config.js, for the separate `yarn pwa:build`
// target). js/web/browser.js's registerSW() imports 'virtual:pwa-register'
// but is only ever called when bridge.getPlatform() === Platform.Web, so it's
// dead code on Electron - this just stubs the module so the import resolves
// (in both dev server and production build) without pulling in the real
// vite-plugin-pwa/workbox machinery, which this target doesn't need.
function stubPwaRegister() {
  const virtualModuleId = 'virtual:pwa-register';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;
  return {
    name: 'stub-pwa-register',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return 'export function registerSW() { return () => Promise.resolve(); }';
      }
    },
  };
}

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
    },
    plugins: [
      stubPwaRegister(),
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
