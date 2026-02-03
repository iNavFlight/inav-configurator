import { defineConfig } from 'vite';
import inject from '@rollup/plugin-inject';

/**
 * Vite 配置用于纯 Web 版本（WebView 环境）
 *
 * 功能变化：
 * - 移除 Electron 相关依赖
 * - 使用 Web Serial API 和 Web Bluetooth API
 * - 使用 IndexedDB 存储配置
 * - HTTPS 开发服务器（Web Serial API 需要）
 */
export default defineConfig({
  root: '.',
  base: './',

  // 构建配置
  build: {
    outDir: 'dist-web',
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    chunkSizeWarningLimit: 10240,
    rollupOptions: {
      input: 'index.html'
    },
    minify: true,
    sourcemap: false,
  },

  // 插件配置
  plugins: [
    // jQuery 全局注入
    inject({
      $: 'jquery',
      jQuery: 'jquery',
    })
  ],

  // 资产文件处理
  assetsInclude: ['**/*.gltf', '**/*.glb'],

  // 开发服务器配置
  server: {
    port: 3000,
    https: false, // Web Serial API 需要 HTTPS 环境
    open: false,
    host: '0.0.0.0', // 允许外部访问（用于移动设备测试）
  },

  // 预览服务器配置
  preview: {
    port: 3000,
    https: true,
    host: '0.0.0.0',
  },

  // 优化配置
  optimizeDeps: {
    include: ['jquery', 'i18next', 'three', 'chart.js'],
  },

  // 清屏设置
  clearScreen: false,
});
