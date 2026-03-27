import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: resolve(__dirname, '../src/public'),
  css: {
    postcss: resolve(__dirname, 'postcss.config.js'),
  },
  build: {
    outDir: resolve(__dirname, '../dist'),
    rollupOptions: {
      input: {
        popup: resolve(__dirname, '../src/pages/popup/index.html'),
        finish: resolve(__dirname, '../src/pages/finish/finish.html'),
        background: resolve(__dirname, '../src/background/index.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background.js';
          }
          return 'assets/[name]-[hash].js';
        }
      }
    }
  }
})
