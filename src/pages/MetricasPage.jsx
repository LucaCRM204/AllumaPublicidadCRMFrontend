// src/pages/MetricasPage.jsx
import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../api'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const ESTADO_COLORS = {
  nuevo: '#3b82f6', contactando: '#f97316', interesado: '#a855f7',
  propuesta: '#eab308', ganado: '#22c55e', perdido: '#ef4444',
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', color: color || 'var(--text)' }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function MetricasPage() {
  const [resumen, setResumen] = useState(null)
  const [porAgente, setPorAgente] = useState([])
  const [porServicio, setPorServicio] = useState([])
  const [porDia, setPorDia] = useState([])

  useEffect(() => {
    Promise.allSettled([
      api.get('/api/metricas/resumen'),
      api.get('/api/metricas/por-agente'),
      api.get('/api/metricas/por-servicio'),
      api.get('/api/metricas/por-dia'),
    ]).then(([r, a, s, d]) => {
      if (r.status === 'fulfilled') setResumen(r.value.data)
      if (a.status === 'fulfilled') setPorAgente(a.value.data)
      if (s.status === 'fulfilled') setPorServicio(s.value.data)
      if (d.status === 'fulfilled') setPorDia(d.value.data.map(row => ({ ...row, fecha: format(parseISO(row.fecha), 'd MMM', { locale: es }) })))
    })
  }, [])

  const tooltipStyle = {
    contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 },
    labelStyle: { color: 'var(--text)' },
  }

  const pieData = resumen ? [
    { name: 'Nuevo', value: resumen.nuevos || 0, color: ESTADO_COLORS.nuevo },
    { name: 'Contactando', value: resumen.contactando || 0, color: ESTADO_COLORS.contactando },
    { name: 'Interesado', value: resumen.interesados || 0, color: ESTADO_COLORS.interesado },
    { name: 'Propuesta', value: resumen.propuestas || 0, color: ESTADO_COLORS.propuesta },
    { name: 'Ganado', value: resumen.ganados || 0, color: ESTADO_COLORS.ganado },
    { name: 'Perdido', value: resumen.perdidos || 0, color: ESTADO_COLORS.perdido },
  ].filter(d => d.value > 0) : []

  if (!resumen) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
      Cargando métricas...
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Métricas</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Resumen general del equipo</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard label="Leads totales" value={resumen.total_leads} />
        <StatCard label="Hoy" value={resumen.leads_hoy} />
        <StatCard label="Esta semana" value={resumen.leads_semana} />
        <StatCard label="Ganados" value={resumen.ganados} color="var(--green)" />
        <StatCard label="Conversión" value={`${resumen.conversion_pct}%`} color="var(--accent)" />
      </div>

      {/* Gráfico por día + pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Leads por día (últimos 30 días)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={porDia}>
              <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="leads" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Distribución pipeline</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Por servicio */}
      {porServicio.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Leads por servicio</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={porServicio} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis dataKey="servicio_interes" type="category" width={140} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="total" fill="var(--accent)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="ganados" fill="var(--green)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Por agente */}
      {porAgente.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Performance por agente</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Agente', 'Total', 'Nuevo', 'Contactando', 'Interesado', 'Propuesta', 'Ganados', 'Perdidos', 'Conversión'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {porAgente.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{a.nombre}</td>
                    <td style={{ padding: '10px 12px' }}>{a.total_leads}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--nuevo)' }}>{a.nuevos || 0}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--contactando)' }}>{a.contactando || 0}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--interesado)' }}>{a.interesados || 0}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--propuesta)' }}>{a.propuestas || 0}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--green)', fontWeight: 600 }}>{a.ganados || 0}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--red)' }}>{a.perdidos || 0}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--accent)', fontWeight: 600 }}>{a.conversion_pct || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
