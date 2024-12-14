import { defineConfig, mergeConfig } from 'vite';
import { getBuildConfig, getBuildDefine, external, esmodule, pluginHotRestart } from './vite.base.config';
import native from 'vite-plugin-native';

// https://vitejs.dev/config
export default defineConfig((env) => {
  /** @type {import('vite').ConfigEnv<'build'>} */
  const forgeEnv = env;
  const { forgeConfigSelf } = forgeEnv;
  const define = getBuildDefine(forgeEnv);
  const config = {
    build: {
      lib: {
        entry: forgeConfigSelf.entry,
        fileName: () => '[name].js',
        formats: [esmodule ? 'es' : 'cjs'],
      },
      rollupOptions: {
        external,
      },
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    },
    plugins: [
      pluginHotRestart('restart'),
      // Load C/C++ native modules. Like sqlite3, better-sqlite3, fsevents etc.
      native({ forceCopyIfUnbuilt: true, webpack: {} }),
    ],
    define,
    resolve: {
      // Load the Node.js entry.
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
  };

  return mergeConfig(getBuildConfig(forgeEnv), config);
});