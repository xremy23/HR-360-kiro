import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress the "src/main.tsx" resolution warning
        if (warning.code === 'UNRESOLVED_ENTRY' || warning.message?.includes('src/main.tsx')) {
          return;
        }
        warn(warning);
      },
    },
  },
})
