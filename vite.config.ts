import * as vite from 'vite'
import * as path from 'node:path'
import { BlendFunction, EffectAttribute } from 'postprocessing'
import { minify } from 'rolldown/utils'

export default vite.defineConfig({
  resolve: {
    alias: {
      '@react-three/postprocessing': path.resolve(__dirname, 'src/index.ts'),
    },
  },
  build: {
    sourcemap: true,
    target: 'ES6',
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
      async transform(code, url) {
        if (!url.includes('node_modules')) {
          code = code.replaceAll(/EffectAttribute\.(\w+)/g, (_, key) =>
            String(EffectAttribute[key as keyof typeof EffectAttribute])
          )
          code = code.replaceAll(/BlendFunction\.(\w+)/g, (_, key) =>
            String(BlendFunction[key as keyof typeof BlendFunction])
          )
          const result = await vite.transformWithOxc(code, url)
          return { code: result.code, map: result.map }
        }
      },
      renderChunk: {
        order: 'post',
        async handler(code, { fileName }) {
          // Preserve pure annotations, but remove all other comments and whitespace
          code = code.replaceAll('/* @__PURE__ */', '__PURE__ || ')
          const result = await minify(fileName, code, { sourcemap: true })
          const finalCode = result.code.replaceAll('__PURE__||', '/*@__PURE__*/')
          return { code: finalCode, map: result.map }
        },
      },
    },
  ],
})
