// Configuración plana (ESLint 10) — sin plugins externos para no añadir
// dependencias. Se mantiene deliberadamente corta: `no-undef` y reglas de
// integridad del código; `no-unused-vars` queda en warning para no bloquear.
//
//   npm run lint
export default [
    {
        files: ['src/**/*.js', 'src/**/*.jsx'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: { ecmaFeatures: { jsx: true } },
            globals: {
                window: 'readonly', document: 'readonly', navigator: 'readonly',
                location: 'readonly', history: 'readonly', console: 'readonly',
                localStorage: 'readonly', sessionStorage: 'readonly',
                fetch: 'readonly', performance: 'readonly', crypto: 'readonly',
                setTimeout: 'readonly', clearTimeout: 'readonly',
                setInterval: 'readonly', clearInterval: 'readonly',
                requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly',
                queueMicrotask: 'readonly', structuredClone: 'readonly',
                alert: 'readonly', confirm: 'readonly', prompt: 'readonly',
                FormData: 'readonly', Headers: 'readonly', Request: 'readonly',
                Response: 'readonly', AbortController: 'readonly', AbortSignal: 'readonly',
                URL: 'readonly', URLSearchParams: 'readonly', Blob: 'readonly',
                FileReader: 'readonly', Image: 'readonly', File: 'readonly',
                Event: 'readonly', EventTarget: 'readonly', CustomEvent: 'readonly',
                getComputedStyle: 'readonly', matchMedia: 'readonly',
                JSON: 'readonly', Math: 'readonly', Date: 'readonly', Array: 'readonly',
                Object: 'readonly', String: 'readonly', Number: 'readonly',
                Boolean: 'readonly', Promise: 'readonly', Map: 'readonly', Set: 'readonly',
                WeakMap: 'readonly', WeakSet: 'readonly', Symbol: 'readonly',
                Error: 'readonly', TypeError: 'readonly', RangeError: 'readonly',
                RegExp: 'readonly', BigInt: 'readonly', ArrayBuffer: 'readonly',
                Uint8Array: 'readonly', DataView: 'readonly',
                parseInt: 'readonly', parseFloat: 'readonly', isNaN: 'readonly',
                isFinite: 'readonly', encodeURIComponent: 'readonly',
                decodeURIComponent: 'readonly', encodeURI: 'readonly',
                decodeURI: 'readonly', eval: 'readonly', globalThis: 'readonly',
                process: 'readonly', Buffer: 'readonly',
                describe: 'readonly', it: 'readonly', test: 'readonly',
                expect: 'readonly', vi: 'readonly',
                beforeEach: 'readonly', afterEach: 'readonly',
                beforeAll: 'readonly', afterAll: 'readonly',
                jest: 'readonly', React: 'readonly',
                btoa: 'readonly', atob: 'readonly', global: 'readonly',
                IntersectionObserver: 'readonly', ResizeObserver: 'readonly',
                HTMLElement: 'readonly', Element: 'readonly', Event: 'readonly',
                DOMParser: 'readonly', MutationObserver: 'readonly',
            },
        },
        rules: {
            'no-undef': 'error',
            'no-unreachable': 'error',
            'no-dupe-keys': 'error',
            'no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
        },
    },
]
