const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkg = JSON.parse(fs.readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const defineEnv = {
    'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
    'process.env.JWT_SECRET': JSON.stringify(env.JWT_SECRET),
    'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
    'process.env.STRIPE_SECRET_KEY': JSON.stringify(env.STRIPE_SECRET_KEY),
    'process.env.STRIPE_WEBHOOK_SECRET': JSON.stringify(env.STRIPE_WEBHOOK_SECRET),
  }

  return {
    plugins: [tsconfigPaths()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@lib': resolve(__dirname, 'src/lib'),
        '@db': resolve(__dirname, 'db'),
        '@migrations': resolve(__dirname, 'db/migrations'),
        '@functions': resolve(__dirname, 'src/functions'),
      },
      extensions: ['.js', '.ts', '.json'],
    },
    define: defineEnv,
    build: {
      target: 'node18',
      outDir: 'netlify/functions',
      emptyOutDir: true,
      sourcemap: true,
      minify: false,
      rollupOptions: {
        external: [...Object.keys(pkg.dependencies || {}), 'path', 'url'],
        input: {
          health: resolve(__dirname, 'src/functions/health.ts'),
          auth: resolve(__dirname, 'src/functions/auth.ts'),
          mindmaps: resolve(__dirname, 'src/functions/mindmaps.ts'),
          nodes: resolve(__dirname, 'src/functions/nodes.ts'),
          todos: resolve(__dirname, 'src/functions/todos.ts'),
          stripeWebhook: resolve(__dirname, 'src/functions/stripeWebhook.ts'),
          analytics: resolve(__dirname, 'src/functions/admin/analytics.ts'),
        },
        output: {
          format: 'cjs',
          entryFileNames: '[name].js',
          exports: 'auto',
        },
      },
    },
  }
})