import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    open: true, // Automatically open browser
    cors: true, // Enable CORS for development
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          router: ['react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase warning limit for larger chunks
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js', 'react-router-dom'],
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      '@': '/src', // Enable @ alias for src directory
    },
  },
}) 