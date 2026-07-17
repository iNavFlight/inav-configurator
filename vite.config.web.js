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
    // 资源内联阈值设置为 4KB（默认值），避免大文件内联
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
    // Rollup 优化配置
    rollupOptions: {
      input: 'index.html',
      output: {
        // 手动分包策略
        manualChunks: {
          // 大型编辑器单独分包
          'monaco-editor': ['monaco-editor'],
          // 3D 库单独分包
          'three': ['three'],
          // 地图库单独分包
          'openlayers': ['ol'],
          // 数据可视化库分包
          'd3': ['d3'],
          'chartjs': ['chart.js'],
          // jQuery 相关
          'jquery-vendor': ['jquery', 'jquery-textcomplete'],
          // 其他工具库
          'vendor-utils': ['i18next', 'marked', 'semver', 'xml2js', 'inflection'],
        },
        // 优化文件命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // 使用 esbuild 压缩（比 terser 快）
    minify: 'esbuild',
    // 生产环境不生成 sourcemap
    sourcemap: false,
    // CSS 代码分割
    cssCodeSplit: true,
    // 启用 CSS 压缩
    cssMinify: true,
    // 设置目标浏览器，启用更多优化
    target: 'es2015',
  },

  // 插件配置
  plugins: [
    // jQuery 全局注入
    inject({
      $: 'jquery',
      jQuery: 'jquery',
      include: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
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

  // 依赖预构建优化
  optimizeDeps: {
    include: [
      'jquery',
      'i18next',
      'three',
      'chart.js',
      'd3',
      'ol',
      'marked',
      'semver',
    ],
    // 排除不需要预构建的依赖
    exclude: ['monaco-editor'],
  },

  // 构建性能优化
  esbuild: {
    // 生产环境移除 console 和 debugger
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // 压缩标识符
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },

  // 清屏设置
  clearScreen: false,
});
