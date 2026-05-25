// src/components/Leads/LeadModal.jsx
import { useState, useEffect } from 'react'
import api from '../../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '../../context/AuthContext'

const ESTADOS = [
  { id: 'nuevo',       label: '📥 Nuevo' },
  { id: 'contactando', label: '📞 Contactando' },
  { id: 'interesado',  label: '🔥 Interesado' },
  { id: 'propuesta',   label: '📋 Propuesta' },
  { id: 'entrevista',  label: '🤝 Entrevista / Reunión' },
  { id: 'vendido',     label: '✅ Vendido' },
  { id: 'sin_interes', label: '👋 Sin interés' },
]

const TIPO_ICONS = {
  creacion: '🟢', cambio_estado: '↔️', nota: '📝',
  asignacion: '👤', llamada: '📞', email: '📧',
}

export default function LeadModal({ lead, onClose, onUpdate }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [nota, setNota] = useState('')
  const [agentes, setAgentes] = useState([])
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const fetchLead = async () => {
    const { data: d } = await api.get(`/api/leads/${lead.id}`)
    setData(d)
    setForm({
      nombre: d.nombre, empresa: d.empresa, rubro: d.rubro,
      email: d.email, telefono: d.telefono, servicio_interes: d.servicio_interes, notas: d.notas,
    })
  }

  useEffect(() => {
    fetchLead()
    if (user.role !== 'agente') {
      api.get('/api/users').then(r => setAgentes(r.data.filter(u => u.role === 'agente')))
    }
  }, [lead.id])

  const cambiarEstado = async (estado) => {
    try {
      await api.put(`/api/leads/${lead.id}/estado`, { estado })
      toast.success('Estado actualizado')
      fetchLead()
      onUpdate()
    } catch { toast.error('Error actualizando estado') }
  }

  const agregarNota = async () => {
    if (!nota.trim()) return
    setSaving(true)
    try {
      await api.post(`/api/leads/${lead.id}/nota`, { texto: nota })
      setNota('')
      toast.success('Nota agregada')
      fetchLead()
    } catch { toast.error('Error guardando nota') }
    finally { setSaving(false) }
  }

  const guardarEdicion = async () => {
    setSaving(true)
    try {
      await api.put(`/api/leads/${lead.id}`, form)
      toast.success('Lead actualizado')
      setEditando(false)
      fetchLead()
      onUpdate()
    } catch { toast.error('Error guardando') }
    finally { setSaving(false) }
  }

  const reasignar = async (agente_id) => {
    try {
      await api.put(`/api/leads/${lead.id}/asignar`, { agente_id: parseInt(agente_id) })
      toast.success('Lead reasignado')
      fetchLead()
      onUpdate()
    } catch { toast.error('Error reasignando') }
  }

  if (!data) return (
    <div className="overlay">
      <div className="modal" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Cargando...
      </div>
    </div>
  )

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
              {data.nombre || 'Sin nombre'}
            </h2>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
              {data.empresa || '—'}{data.rubro ? ` · ${data.rubro}` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: 20, cursor: 'pointer', lineHeight: 1,
          }}>×</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Estado */}
          <div>
            <label className="label">Estado del pipeline</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ESTADOS.map(e => (
                <button key={e.id} onClick={() => cambiarEstado(e.id)}
                  className={`btn btn-sm badge estado-${e.id}`}
                  style={{
                    border: data.estado === e.id ? '2px solid currentColor' : '1px solid transparent',
                    fontWeight: data.estado === e.id ? 700 : 400,
                  }}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Datos del lead */}
          {editando ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { k: 'nombre', l: 'Nombre' }, { k: 'empresa', l: 'Empresa' },
                { k: 'rubro', l: 'Rubro' }, { k: 'servicio_interes', l: 'Servicio' },
                { k: 'email', l: 'Email' }, { k: 'telefono', l: 'Teléfono' },
              ].map(({ k, l }) => (
                <div key={k}>
                  <label className="label">{l}</label>
                  <input className="input" value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                </div>
              ))}
              <div style={{ gridColumn: '1/-1' }}>
                <label className="label">Notas internas</label>
                <textarea className="input" rows={3} value={form.notas || ''} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={guardarEdicion} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditando(false)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <label className="label">Datos de contacto</label>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditando(true)}>✏️ Editar</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { l: 'Email', v: data.email },
                  { l: 'Teléfono', v: data.telefono },
                  { l: 'Empresa', v: data.empresa },
                  { l: 'Rubro', v: data.rubro },
                  { l: 'Servicio', v: data.servicio_interes },
                  { l: 'Fuente', v: data.fuente },
                ].map(({ l, v }) => (
                  <div key={l} style={{ background: 'var(--bg)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v || '—'}</div>
                  </div>
                ))}
              </div>
              {data.telefono && (
                <a href={`https://wa.me/${data.telefono}`} target="_blank" rel="noreferrer"
                  className="btn btn-ghost btn-sm" style={{ marginTop: 10, color: '#22c55e' }}>
                  💬 Abrir en WhatsApp
                </a>
              )}
            </div>
          )}

          {/* Reasignar — solo owner/supervisor */}
          {user.role !== 'agente' && agentes.length > 0 && (
            <div>
              <label className="label">Agente asignado</label>
              <select className="input" value={data.asignado_a || ''} onChange={e => reasignar(e.target.value)}>
                <option value="">Sin asignar</option>
                {agentes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
          )}

          {/* Nueva nota */}
          <div>
            <label className="label">Agregar nota</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" placeholder="Escribí una nota..."
                value={nota} onChange={e => setNota(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && agregarNota()} />
              <button className="btn btn-primary btn-sm" onClick={agregarNota} disabled={saving || !nota.trim()}>
                +
              </button>
            </div>
          </div>

          {/* Historial */}
          {data.actividad?.length > 0 && (
            <div>
              <label className="label">Historial</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                {[...data.actividad].reverse().map(act => (
                  <div key={act.id} style={{
                    background: 'var(--bg)', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: 14, marginTop: 1 }}>{TIPO_ICONS[act.tipo] || '•'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-soft)' }}>{act.descripcion}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                        {act.user_nombre || 'Sistema'} · {format(new Date(act.created_at), "d MMM 'a las' HH:mm", { locale: es })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
