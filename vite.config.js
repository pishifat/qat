import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue({
    template: {
      compilerOptions: {
        whitespace: 'preserve',
      },
    },
  })],
  root: './src',
  publicDir: '../public', // Serve static assets from public directory
  optimizeDeps: {
    include: ['shared/enums.mjs'],
  },
  build: {
    outDir: '../public',
    emptyOutDir: false, // Don't clear entire public dir (preserve images, etc.)
    rollupOptions: {
      input: resolve(__dirname, 'src/index.html'),
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
            return 'images/[name]-[hash][extname]'
          }
          if (/\.css$/.test(name ?? '')) {
            return 'css/[name]-[hash][extname]'
          }
          return '[name]-[hash][extname]'
        }
      }
    }
  },
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'shared/enums': resolve(__dirname, './shared/enums.mjs')
    },
    extensions: ['.mjs', '.js', '.vue', '.json']
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Silence deprecation warnings
        silenceDeprecations: ['legacy-js-api', 'import', 'color-functions', 'global-builtin', 'abs-percent'],
        // Add any global SCSS variables/mixins here if needed
      }
    }
  }
}) 