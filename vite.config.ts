const mode = process.env.NODE_ENV || 'development'
  const root = process.cwd()
  const env = { ...process.env, ...loadEnv(mode, root) }

  const defaultConfig: UserConfig = {
    root,
    base: env.BASE_URL || '/',
    publicDir: path.resolve(root, 'public'),
    plugins: [
      react(),
      tsconfigPaths(),
      netlifyPlugin({ functionsDir: 'netlify/functions' }),
    ],
    resolve: {
      alias: { '@': path.resolve(root, 'src') },
      extensions: ['.js', '.ts', '.tsx', '.json'],
    },
    define: { 'process.env': JSON.stringify(env) },
    server: {
      port: Number(env.VITE_PORT) || 3000,
      open: true,
      strictPort: true,
      fs: { allow: [root] },
    },
    preview: {
      port: Number(env.VITE_PORT_PREVIEW) || 4173,
    },
    build: {
      outDir: path.resolve(root, 'dist'),
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        input: { main: path.resolve(root, 'index.html') },
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              return id.split('node_modules/')[1].split('/')[0]
            }
          },
        },
      },
      ...(env.NODE_ENV === 'production' && { minify: 'terser' }),
    },
    esbuild: env.NODE_ENV === 'production' ? { drop: ['console', 'debugger'] } : {},
  }

  return {
    ...defaultConfig,
    ...userConfig,
    plugins: [...(defaultConfig.plugins || []), ...(userConfig.plugins || [])],
    resolve: { ...defaultConfig.resolve, ...userConfig.resolve },
    define: { ...defaultConfig.define, ...userConfig.define },
    server: { ...defaultConfig.server, ...userConfig.server },
    preview: { ...defaultConfig.preview, ...userConfig.preview },
    build: { ...defaultConfig.build, ...userConfig.build },
    esbuild: { ...defaultConfig.esbuild, ...userConfig.esbuild },
  }
})