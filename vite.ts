const functionFiles = fg.sync('src/functions/**/*.ts')
  const input = functionFiles.reduce<Record<string, string>>((entries, file) => {
    const entryName = file
      .replace(/^src\/functions\//, '')
      .replace(/\.ts$/, '')
    entries[entryName] = path.resolve(__dirname, file)
    return entries
  }, {})

  return {
    plugins: [
      tsconfigPaths()
    ],
    build: {
      target: 'node18',
      rollupOptions: {
        input,
        external: [...builtinModules],
        plugins: [
          nodeResolve({ preferBuiltins: true }),
          commonjs()
        ],
        output: {
          format: 'cjs',
          entryFileNames: '[dir]/[name].js',
          exports: 'auto'
        }
      },
      outDir: 'netlify/functions',
      emptyOutDir: true,
      sourcemap: true,
      minify: false
    }
  }
})