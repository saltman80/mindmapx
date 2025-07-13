const root = process.cwd()
  const env = loadEnv(mode, root, '')
  const baseRaw = env.VITE_BASE_URL || '/'
  const base = baseRaw.endsWith('/') ? baseRaw : `${baseRaw}/`
  const devPort = Number(env.VITE_DEV_PORT) || 5173
  const functionsPort = Number(env.VITE_NETLIFY_FUNCTIONS_PORT) || 8888
  const previewPort = Number(env.VITE_PREVIEW_PORT) || 4173
  const sourcemap = env.VITE_SOURCEMAP === 'true'

  return {
    root,
    base,
    plugins: [tsconfigPaths(), svgr(), react()],
    resolve: {
      alias: {
        '@': resolve(root, 'src'),
      },
    },
    server: {
      host: true,
      port: devPort,
      strictPort: true,
      open: true,
      fs: { strict: true },
      proxy: {
        [ /^\/(?:api|\.netlify\/functions)/ ]: {
          target: `http://localhost:${functionsPort}`,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, '/.netlify/functions'),
        },
      },
    },
    preview: {
      port: previewPort,
      open: true,
    },
    build: {
      outDir: 'dist',
      sourcemap,
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html'),
        },
      },
    },
  }
})