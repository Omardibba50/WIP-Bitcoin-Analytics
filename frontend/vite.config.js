import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Bitcoin Dashboard',
        short_name: 'BTC Dash',
        description: 'Real-time Bitcoin metrics and AI predictions',
        theme_color: '#f7931a',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f0f23',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.blockchain\.info\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'blockchain-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
            },
          },
          {
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 2 * 60, // 2 minutes
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Target modern browsers for smaller bundle
    target: 'esnext',
    
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Code splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom'],
          
          // Chart.js and dependencies
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          
          // Date utilities
          'date-vendor': ['date-fns', 'react-datepicker'],
          
          // Utilities
          'utils': [
            './src/services/apiClient.js',
            './src/services/dataOrchestrator.js',
            './src/utils/chartFactory.js',
          ],
        },
        // Better chunk naming for caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    // Source maps for production debugging (disable for smaller builds)
    sourcemap: false,
    
    // CSS code splitting
    cssCodeSplit: true,
  },
  
  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'chart.js',
      'react-chartjs-2',
      'date-fns',
      'react-datepicker',
    ],
  },
});