const rawEnv = loadEnv(mode, process.cwd(), 'VITE_')
  const VITE_BASE_URL = rawEnv.VITE_BASE_URL
  const VITE_APP_ENV = rawEnv.VITE_APP_ENV
  const rawPort = rawEnv.VITE_PORT
  const rawPreviewPort = rawEnv.VITE_PREVIEW_PORT

  if (!VITE_APP_ENV) {
    throw new Error('Missing required environment variable: VITE_APP_ENV')
  }

  const port = rawPort !== undefined
    ? (() => {
        const p = parseInt(rawPort, 10)
        if (isNaN(p)) throw new Error(`Invalid VITE_PORT: ${rawPort}`)
        return p
      })()
    : 5173

  const previewPort = rawPreviewPort !== undefined
    ? (() => {
        const p = parseInt(rawPreviewPort, 10)
        if (isNaN(p)) throw new Error(`Invalid VITE_PREVIEW_PORT: ${rawPreviewPort}`)
        return p
      })()
    : 4173

  const functionsTarget = 'http://localhost:8888'

  return {
    base: VITE_BASE_URL || '/',
    plugins: [
      react(),
      tsconfigPaths(),
      svgr()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },
    define: {
      __APP_ENV__: JSON.stringify(VITE_APP_ENV)
    },
    server: {
      host: 'localhost',
      port,
      strictPort: true,
      open: true,
      proxy: {
        '/.netlify/functions': {
          target: functionsTarget,
          changeOrigin: true,
          rewrite: p => p.replace(/^\/\.netlify\/functions/, '')
        }
      }
    },
    preview: {
      host: 'localhost',
      port: previewPort,
      strictPort: true,
      open: true,
      proxy: {
        '/.netlify/functions': {
          target: functionsTarget,
          changeOrigin: true,
          rewrite: p => p.replace(/^\/\.netlify\/functions/, '')
        }
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode !== 'production',
      target: 'es2020',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (
                id.includes('node_modules/react/') ||
                id.includes('node_modules/react-dom/')
              ) {
                return 'react-vendor'
              }
              return 'vendor'
            }
          }
        }
      }
    },
    envDir: process.cwd(),
    envPrefix: 'VITE_'
  }
})