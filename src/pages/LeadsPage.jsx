// src/pages/LeadsPage.jsx
import { useState, useEffect, useCallback } from 'react'
import api from '../api'
import LeadModal from '../components/Leads/LeadModal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '../context/AuthContext'

const ESTADO_INFO = {
  nuevo:       { label: '📥 Nuevo',       css: 'estado-nuevo' },
  contactando: { label: '📞 Contactando',  css: 'estado-contactando' },
  interesado:  { label: '🔥 Interesado',   css: 'estado-interesado' },
  propuesta:   { label: '📋 Propuesta',    css: 'estado-propuesta' },
  ganado:      { label: '✅ Ganado',        css: 'estado-ganado' },
  perdido:     { label: '❌ Perdido',       css: 'estado-perdido' },
}

export default function LeadsPage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState(null)
  const [filters, setFilters] = useState({ estado: '', buscar: '' })

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.estado) params.estado = filters.estado
      if (filters.buscar) params.buscar = filters.buscar
      const { data } = await api.get('/api/leads', { params })
      setLeads(data)
    } catch {
      setLeads([])
    } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Leads</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{leads.length} resultados</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ maxWidth: 280 }}
          placeholder="Buscar por nombre, empresa, email..."
          value={filters.buscar}
          onChange={e => setFilters(f => ({ ...f, buscar: e.target.value }))}
        />
        <select
          className="input"
          style={{ maxWidth: 200 }}
          value={filters.estado}
          onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_INFO).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        {(filters.buscar || filters.estado) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ estado: '', buscar: '' })}>
            × Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>
        ) : leads.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Sin resultados</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Nombre', 'Empresa', 'Servicio', 'Estado', 'Agente', 'Fecha', ''].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)',
                      fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{lead.nombre || '—'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {lead.empresa || '—'}
                      {lead.rubro && <span style={{ fontSize: 11, marginLeft: 4, color: 'var(--text-muted)' }}>· {lead.rubro}</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-soft)' }}>{lead.servicio_interes || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${ESTADO_INFO[lead.estado]?.css}`}>
                        {ESTADO_INFO[lead.estado]?.label || lead.estado}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{lead.agente_nombre || '—'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                      {format(new Date(lead.created_at), "d MMM yyyy", { locale: es })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {lead.telefono && (
                        <a href={`https://wa.me/${lead.telefono}`} target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize: 16 }}>💬</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={fetchLeads}
        />
      )}
    </div>
  )
}
