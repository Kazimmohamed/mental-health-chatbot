import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import nesting from 'tailwindcss/nesting'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [
    react(),
  ],
  css: {
    postcss: {
      plugins: [
        nesting(),
        tailwindcss(),
        autoprefixer(),
      ]
    }
  }
})