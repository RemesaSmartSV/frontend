/**
 * Keeps the browser on the Pages origin and forwards API requests to the
 * ASP.NET service. Set API_ORIGIN in the Pages project environment variables
 * to the backend origin, without a trailing slash (for example,
 * https://remesasmart-api.onrender.com).
 */
export async function onRequest({ request, env }) {
    const apiOrigin = env.API_ORIGIN?.replace(/\/$/, '')

    if (!apiOrigin) {
        return new Response('API_ORIGIN is not configured', { status: 503 })
    }

    const incomingUrl = new URL(request.url)
    const apiPath = incomingUrl.pathname.replace(/^\/api(?=\/|$)/, '')
    const destination = `${apiOrigin}/api${apiPath}${incomingUrl.search}`
    const headers = new Headers(request.headers)
    headers.delete('host')

    return fetch(destination, new Request(request, { headers }))
}
