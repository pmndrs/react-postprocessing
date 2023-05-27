import * as path from 'node:path'
import { defineConfig } from 'vite'

const inline: string[] = ['n8ao']

export default defineConfig({
  build: {
    minify: false,
    target: 'es2018',
    sourcemap: true,
    lib: {
      formats: ['es', 'cjs'],
      entry: 'src/index.tsx',
      fileName: '[name]',
    },
    rollupOptions: {
      external: (id: string) => !id.startsWith('.') && !path.isAbsolute(id) && !inline.includes(id),
    },
  },
  plugins: [
    {
      name: 'n8ao-fix',
      generateBundle(_, bundle) {
        for (const id in bundle) {
          const asset = bundle[id]
          if ('code' in asset) {
            asset.code = asset.code.replace(/three\/(addons|examples)[^'"`]+/g, 'three-stdlib')
          }
        }
      },
    },
  ],
})
