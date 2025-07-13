const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  Object.assign(process.env, env)

  const {
    VITE_BASE_URL = '/',
    VITE_PORT,
    VITE_PREVIEW_PORT
  } = env

  const port = parseInt(VITE_PORT || '', 10)
  const previewPort = parseInt(VITE_PREVIEW_PORT || '', 10)

  const normalizeBase = (url: string) => {
    let str = url.trim()
    if (!str.startsWith('/')) str = `/${str}`
    if (!str.endsWith('/')) str = `${str}/`
    return str
  }

  const base = VITE_BASE_URL === '/' ? '/' : normalizeBase(VITE_BASE_URL)

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      port: Number.isNaN(port) ? 3000 : port,
      open: true,
      strictPort: true
    },
    preview: {
      port: Number.isNaN(previewPort) ? 4173 : previewPort,
      strictPort: true
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode !== 'production',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html')
        }
      }
    }
  }
})