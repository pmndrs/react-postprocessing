import { defineConfig } from 'vite'
import cjs from '@rollup/plugin-commonjs'
import path from 'path'
import reactRefresh from '@vitejs/plugin-react-refresh'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@react-three/postprocessing',
        replacement: path.resolve(__dirname, '../src'),
      },
    ],
  },
  plugins: [reactRefresh()],

  optimizeDeps: {
    exclude: ['@react-three/postprocessing'],
  },
})
