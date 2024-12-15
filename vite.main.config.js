import { defineConfig, mergeConfig } from 'vite';
import { getBuildConfig, getBuildDefine, esmodule, pluginHotRestart } from './vite.base.config';
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
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    },
    publicDir: './resources/public',
    plugins: [
      pluginHotRestart('restart'),
      native({ forceCopyIfUnbuilt: true, webpack: {} }),
    ],
    define,
    resolve: {
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
  };
  return mergeConfig(getBuildConfig(forgeEnv), config);
});