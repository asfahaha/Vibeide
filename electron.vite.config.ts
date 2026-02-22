import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        // Explicitly externalize npm dependencies so native modules like
        // better-sqlite3 are not bundled (externalizeDepsPlugin alone is
        // unreliable in some electron-vite setups).
        external: [
          'better-sqlite3',
          '@anthropic-ai/sdk',
          '@electron-toolkit/preload',
          '@electron-toolkit/utils',
          '@xyflow/react',
          'react',
          'react-dom',
          'uuid',
          'zustand'
        ],
        input: {
          index: resolve(__dirname, 'src/main/index.ts')
        }
      }
    }
  },
  preload: {
    // Don't externalize deps for preload - bundle everything
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts')
        }
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html')
        }
      }
    },
    plugins: [react()],
    css: {
      postcss: {
        plugins: [tailwindcss, autoprefixer]
      }
    }
  }
})
