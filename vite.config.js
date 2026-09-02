import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Proxy en desarrollo: /api se reenvia al backend .NET local

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    server: {
        port: 5173,
        watch: {
            ignored: ['**/.vs/**'],
        },
        proxy: {
            '/api': {
                target: 'http://localhost:5203',
                changeOrigin: true,
            },
        },
    },
})