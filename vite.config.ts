import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const base = process.env.BASE_PATH || '/'

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    sourcemap: true,
    rollupOptions: {
      external: ['immutable'],
    },
  },
})
