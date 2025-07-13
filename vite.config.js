const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      netlify()
    ],
    envPrefix: 'VITE_',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    define: Object.fromEntries(
      Object.entries(env).map(([key, val]) => [`process.env.${key}`, JSON.stringify(val)])
    ),
    server: {
      port: Number(env.VITE_PORT) || 5173,
      open: true,
      fs: { strict: true }
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  }
})