import path from 'path';
import { defineConfig } from 'vite';
import inject from "@rollup/plugin-inject";
import { pluginExposeRenderer } from './vite.base.config';

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
  build: {
    outDir: `.vite/renderer/${name}`,
    rollupOptions: {
      input: path.join(__dirname, 'js/libraries/bluetooth-device-chooser/bt-device-chooser-index.html')
    },
  },
  plugins: [
    pluginExposeRenderer(name)
  ],
  resolve: {
    preserveSymlinks: true,
  },
  clearScreen: false,
};
});

