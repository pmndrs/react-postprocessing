import * as vite from 'vite'
import * as path from 'node:path'

export default vite.defineConfig({
  resolve: {
    alias: {
      '@react-three/postprocessing': path.resolve(__dirname, 'src/index.ts'),
    },
  },
  build: {
    sourcemap: true,
    target: 'es2020',
    lib: {
      formats: ['es'],
      entry: 'src/index.ts',
      fileName: '[name]',
    },
    rollupOptions: {
      external: (id: string) => !id.startsWith('.') && !path.isAbsolute(id),
      output: {
        sourcemapExcludeSources: true,
      },
    },
  },
  plugins: [
    {
      name: 'vite-tsc',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'index.d.ts', source: `export * from '../src/index.ts'` })
      },
    },
    {
      name: 'vite-minify',
      renderChunk: {
        order: 'post',
        async handler(code, { fileName }) {
          // Preserve pure annotations, but remove all other comments and whitespace
          code = code.replaceAll('/* @__PURE__ */', '__PURE__ || ')
          const result = await vite.transformWithEsbuild(code, fileName, { minify: true, target: 'es2020' })
          result.code = result.code.replaceAll('__PURE__||', '/*@__PURE__*/')
          return result
        },
      },
    },
  ],
})
