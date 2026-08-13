import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  /* Der Simulator liegt unter www.wambsconsulting.de/simulator/ —
     dieselbe Domain wie die Website, ein Zertifikat, ein Deploy. */
  base: '/simulator/',
  build: {
    outDir: 'dist',
  },
})
