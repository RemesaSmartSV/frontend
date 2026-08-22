import { useState } from 'react'

export default function App() {
  const [estadoApi, setEstadoApi] = useState(null)

  async function probarConexion() {
    setEstadoApi('Probando...')
    try {
      const res = await fetch('/api/TipsFinancieros')
      if (res.status === 401) {
        setEstadoApi('API conectada (requiere autenticacion JWT)')
      } else if (res.ok) {
        setEstadoApi('API conectada correctamente')
      } else {
        setEstadoApi(`API respondio con estado ${res.status}`)
      }
    } catch {
      setEstadoApi('No se pudo conectar con la API')
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '4rem auto', padding: '0 1rem' }}>
      <h1>RemesaSmartSV</h1>
      <p>API de finanzas familiares para El Salvador.</p>
      <p>Base del frontend React (Vite). Aqui iran las pantallas del MVP 1:
        hogares, miembros, remesas, ingresos, gastos y categorias.</p>
      <button onClick={probarConexion}>Probar conexion con la API</button>
      {estadoApi && <p><strong>Estado:</strong> {estadoApi}</p>}
    </main>
  )
}
