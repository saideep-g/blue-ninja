import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Increase the warning limit slightly if needed, though splitting is better
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunking to separate vendor libraries from app code
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split Firebase and React into their own chunks
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            return 'vendor';
          }
        },
      },
    },
  },
})