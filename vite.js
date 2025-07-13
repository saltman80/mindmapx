const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function configureServer(server) {
  server.httpServer?.on('error', console.error);
  server.middlewares.use(
    history({
      index: '/index.html',
      rewrites: [
        { from: /^\/api\/.*$/, to: (context) => context.parsedUrl.path }
      ]
    })
  );
}

async function buildProject() {
  const mode = 'production';
  const env = loadEnv(mode, __dirname, '');
  const clientEnv = Object.fromEntries(
    Object.entries(env).filter(([key]) => key.startsWith('VITE_'))
  );
  const defineEnv = {
    'process.env.NODE_ENV': JSON.stringify(mode),
    ...Object.entries(clientEnv).reduce((acc, [key, val]) => {
      acc[`process.env.${key}`] = JSON.stringify(val);
      return acc;
    }, {})
  };
  await build({
    root: __dirname,
    base: env.VITE_BASE_URL || './',
    publicDir: path.resolve(__dirname, 'public'),
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    define: defineEnv,
    build: {
      outDir: 'dist',
      sourcemap: env.VITE_SOURCEMAP === 'true',
      target: env.VITE_BUILD_TARGET || 'es2020',
      rollupOptions: { input: path.resolve(__dirname, 'index.html') }
    }
  });
}

async function main() {
  const mode = process.env.NODE_ENV || 'development';
  const env = loadEnv(mode, __dirname, '');
  const clientEnv = Object.fromEntries(
    Object.entries(env).filter(([key]) => key.startsWith('VITE_'))
  );
  const defineEnv = {
    'process.env.NODE_ENV': JSON.stringify(mode),
    ...Object.entries(clientEnv).reduce((acc, [key, val]) => {
      acc[`process.env.${key}`] = JSON.stringify(val);
      return acc;
    }, {})
  };
  if (mode === 'production') {
    await buildProject();
  } else {
    const server = await createServer({
      root: __dirname,
      base: env.VITE_BASE_URL || '/',
      publicDir: path.resolve(__dirname, 'public'),
      resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
      define: defineEnv,
      server: {
        port: Number(env.PORT) || 3000,
        strictPort: true,
        open: true,
        fs: { strict: true },
        proxy: {
          '/api': {
            target: env.VITE_API_PROXY_TARGET || 'http://localhost:8888',
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/api/, '')
          }
        }
      },
      build: { sourcemap: env.VITE_SOURCEMAP === 'true' }
    });
    configureServer(server);
    await server.listen();
    server.printUrls();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});