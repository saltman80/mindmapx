import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const root = process.cwd()
  const env = loadEnv(mode, root, '')
  const base = env.VITE_BASE_URL || '/'

  let devPort = parseInt(env.PORT, 10)
  if (Number.isNaN(devPort)) devPort = 5173

  let functionsPort = parseInt(env.NETLIFY_DEV_PORT, 10)
  if (Number.isNaN(functionsPort)) functionsPort = 8888

  let previewPort = parseInt(env.VITE_PREVIEW_PORT, 10)
  if (Number.isNaN(previewPort)) previewPort = 4173

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(root, 'src'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
    },
    server: {
      host: '0.0.0.0',
      port: devPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://localhost:${functionsPort}`,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, '/.netlify/functions'),
        },
      },
    },
    preview: {
      port: previewPort,
    },
  }
})