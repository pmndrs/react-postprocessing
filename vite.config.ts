import * as path from 'node:path'
import { BlendFunction, EffectAttribute } from 'postprocessing'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@react-three/postprocessing': path.resolve(import.meta.dirname, 'src/index.ts'),
    },
  },
  build: {
    sourcemap: true,
    minify: false,
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
      name: 'inline-enums',
      transform(code, url) {
        if (url.includes('node_modules')) return
        const result = code
          .replaceAll(/EffectAttribute\.(\w+)/g, (_, key) =>
            String(EffectAttribute[key as keyof typeof EffectAttribute])
          )
          .replaceAll(/BlendFunction\.(\w+)/g, (_, key) => String(BlendFunction[key as keyof typeof BlendFunction]))
        if (result !== code) return { code: result, map: null }
      },
    },
  ],
})
