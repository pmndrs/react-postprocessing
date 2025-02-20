import * as vite from 'vite'
import * as path from 'node:path'
import { BlendFunction, EffectAttribute } from 'postprocessing'

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
      name: 'vite-minify',
      transform(code, url) {
        if (!url.includes('node_modules')) {
          code = code.replaceAll(/EffectAttribute\.(\w+)/g, (_, key) => EffectAttribute[key])
          code = code.replaceAll(/BlendFunction\.(\w+)/g, (_, key) => BlendFunction[key])
          return vite.transformWithEsbuild(code, url)
        }
      },
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
