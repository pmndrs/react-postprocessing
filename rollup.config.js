import path from 'path'
import resolve from '@rollup/plugin-node-resolve'
import filesize from 'rollup-plugin-filesize'
import typescript from '@rollup/plugin-typescript'

const root = process.platform === 'win32' ? path.resolve('/') : '/'
const external = (id) => !id.startsWith('.') && !id.startsWith(root)
const extensions = ['.js', '.jsx', '.ts', '.tsx']

export default [
  {
    input: `./src/index.tsx`,
    output: { file: `dist/index.js`, format: 'esm' },
    external,
    plugins: [typescript(), resolve({ extensions }), filesize()],
  },
  {
    input: `./src/index.tsx`,
    output: { file: `dist/index.cjs`, format: 'cjs' },
    external,
    plugins: [typescript(), resolve({ extensions }), filesize()],
  },
]
