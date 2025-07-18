import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/global.scss";`
      }
    }
  },
  base: '/', // ✅ use '/' unless you're deploying under a subpath
  build: {
    rollupOptions: {
      external: ['immutable'],
    },
  },
})
