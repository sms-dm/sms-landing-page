import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    host: true,
    strictPort: true,
    // Configure middleware to serve demo files before React Router catches them
    proxy: {
      '/demo': {
        target: 'http://localhost:3002',
        bypass: (req) => {
          // If it's a demo route, serve from public/demo
          if (req.url?.startsWith('/demo')) {
            return req.url;
          }
        }
      }
    }
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore TypeScript-related warnings during build
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        warn(warning);
      }
    }
  },
  // Ensure public directory is properly served
  publicDir: 'public'
})