import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Vendor deps (react, supabase, i18n, router, icons) rarely change
        // between deploys, but without this they shared one chunk with all
        // app code -- every deploy invalidated the whole thing for a
        // returning visitor's browser cache, not just the app-code delta.
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          i18n: ['i18next', 'react-i18next'],
        },
      },
    },
  },
})
