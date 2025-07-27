import { fileURLToPath } from 'url'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function netlifyRedirect() {
  return {
    name: 'vite:netlify-redirect',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: '_redirects',
        source: '/api/* /.netlify/functions/:splat 200\n/* /index.html 200\n'
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    root: path.resolve(__dirname, 'src'),
    base: env.VITE_BASE_PATH || '/',
    publicDir: path.resolve(__dirname, 'public'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      port: Number(env.VITE_PORT) || 3000,
      open: true,
      strictPort: true
    },
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
      sourcemap: env.VITE_SOURCEMAP === 'true',
      rollupOptions: {
        input: path.resolve(__dirname, 'src/index.html')
      }
    },
    plugins: [netlifyRedirect()]
  }
})