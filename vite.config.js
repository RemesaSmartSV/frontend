import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'
import { loadEnv } from 'vite'

// Proxy en desarrollo: /api se reenvia al backend .NET local

export default defineConfig(({ mode }) => {
    // In dev, reuse only the public Google Client ID from backend/.env.
    // No SMTP/JWT values are exposed to the browser bundle.
    const backendEnv = loadEnv(mode, resolve(process.cwd(), '../backend'), '')
    // Under Vitest the client ID must be deterministic and env-independent:
    // the tests mock GIS entirely and CI has no backend/.env, so a placeholder
    // keeps the component on its real code path without developer secrets.
    const isVitest = !!process.env.VITEST
    const googleClientId = isVitest
        ? (process.env.VITE_GOOGLE_CLIENT_ID || 'client-id-de-prueba')
        : (process.env.VITE_GOOGLE_CLIENT_ID || backendEnv.GOOGLE_CLIENT_ID || '')

    return {
        define: {
            'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
        },
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
                // 5203 = `dotnet run` (launchSettings). Con el backend de Docker
                // hay que apuntar al 8080: VITE_API_TARGET=http://localhost:8080
                '/api': {
                    target: process.env.VITE_API_TARGET || 'http://localhost:5203',
                    changeOrigin: true,
                },
            },
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: './src/test-setup.js',
        },
    }
})

