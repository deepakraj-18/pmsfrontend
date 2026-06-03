import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  optimizeDeps: {
    include: [
      'primereact/button',
      'primereact/datatable',
      'primereact/column',
      'primereact/dropdown',
      'primereact/multiselect',
      'primereact/inputtext',
      'primereact/calendar',
      'primereact/tag',
      'primereact/toast',
      'primereact/dialog',
      'primereact/fileupload',
      '@tanstack/react-query',
      'recharts',
      'framer-motion',
    ],
  },

  css: {
    devSourcemap: false,
  },

  assetsInclude: ['***.csv'],

  build: {
    target: 'esnext',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: false,
    minify: 'esbuild',
    esbuildOptions: {
      drop: ['console', 'debugger'],
      legalComments: 'none',
    },

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('framer-motion')) return 'vendor-animation';
            if (id.includes('primereact')) return 'vendor-prime';
            if (id.includes('primeicons')) return 'vendor-prime';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('@tanstack')) return 'vendor-query';
            if (id.includes('axios')) return 'vendor-http';

            return 'vendor';
          }
        },
      },
    },
  },
})
