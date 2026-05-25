// src/pages/CalendarioPage.jsx
import { useState, useEffect } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isSameMonth, addMonths, subMonths, getDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const COLORS = ['#6c63ff', '#06b6d4', '#22c55e', '#f97316', '#a855f7', '#eab308', '#ef4444']

function EventoModal({ evento, onClose, onSaved, leads }) {
  const isEdit = !!evento?.id
  const [form, setForm] = useState({
    titulo: evento?.titulo || '',
    descripcion: evento?.descripcion || '',
    fecha: evento?.fecha ? evento.fecha.slice(0, 10) : evento?.fechaDefault || format(new Date(), 'yyyy-MM-dd'),
    hora_inicio: evento?.hora_inicio?.slice(0, 5) || '',
    hora_fin: evento?.hora_fin?.slice(0, 5) || '',
    lead_id: evento?.lead_id || '',
    color: evento?.color || '#6c63ff',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.titulo) return toast.error('El título es requerido')
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/api/calendario/${evento.id}`, form)
        toast.success('Evento actualizado')
      } else {
        await api.post('/api/calendario', form)
        toast.success('Evento creado')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error guardando')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este evento?')) return
    try {
      await api.delete(`/api/calendario/${evento.id}`)
      toast.success('Evento eliminado')
      onSaved()
    } catch { toast.error('Error eliminando') }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
            {isEdit ? 'Editar evento' : 'Nuevo evento'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Título *</label>
            <input className="input" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Reunión con cliente..." autoFocus />
          </div>

          <div>
            <label className="label">Fecha *</label>
            <input className="input" type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="label">Hora inicio</label>
              <input className="input" type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
            </div>
            <div>
              <label className="label">Hora fin</label>
              <input className="input" type="time" value={form.hora_fin} onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label">Lead relacionado (opcional)</label>
            <select className="input" value={form.lead_id} onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))}>
              <option value="">Sin lead asociado</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.nombre} {l.empresa ? `· ${l.empresa}` : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea className="input" rows={3} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Detalles del evento..." />
          </div>

          <div>
            <label className="label">Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{
                  width: 28, height: 28, borderRadius: '50%', background: c, border: 'none',
                  outline: form.color === c ? `3px solid ${c}` : 'none',
                  outlineOffset: 2, cursor: 'pointer',
                }} />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear evento'}
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            {isEdit && <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={handleDelete}>Eliminar</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CalendarioPage() {
  const [mesActual, setMesActual] = useState(new Date())
  const [eventos, setEventos] = useState([])
  const [leads, setLeads] = useState([])
  const [modal, setModal] = useState(null)
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)

  const fetchEventos = async () => {
    const mes = format(mesActual, 'yyyy-MM')
    try {
      const { data } = await api.get(`/api/calendario?mes=${mes}`)
      setEventos(data)
    } catch { toast.error('Error cargando eventos') }
  }

  useEffect(() => { fetchEventos() }, [mesActual])
  useEffect(() => {
    api.get('/api/leads').then(r => setLeads(r.data)).catch(() => {})
  }, [])

  const diasDelMes = eachDayOfInterval({ start: startOfMonth(mesActual), end: endOfMonth(mesActual) })
  const primerDia = getDay(startOfMonth(mesActual)) // 0=dom
  const offsetDias = primerDia === 0 ? 6 : primerDia - 1 // lunes primero

  const eventosDelDia = (dia) => eventos.filter(e => isSameDay(parseISO(e.fecha), dia))

  const eventosDelDiaSeleccionado = diaSeleccionado ? eventosDelDia(diaSeleccionado) : []

  const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Calendario</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            {eventos.length} eventos este mes
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setMesActual(m => subMonths(m, 1))}>←</button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, minWidth: 140, textAlign: 'center', fontSize: 15 }}>
            {format(mesActual, 'MMMM yyyy', { locale: es }).replace(/^\w/, c => c.toUpperCase())}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => setMesActual(m => addMonths(m, 1))}>→</button>
          <button className="btn btn-primary btn-sm" onClick={() => setModal({ fechaDefault: format(diaSeleccionado || new Date(), 'yyyy-MM-dd') })}>
            + Nuevo evento
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Grilla del calendario */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header días */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
                {d}
              </div>
            ))}
          </div>

          {/* Días */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {/* Offset */}
            {Array.from({ length: offsetDias }).map((_, i) => (
              <div key={`off-${i}`} style={{ minHeight: 90, borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }} />
            ))}

            {diasDelMes.map(dia => {
              const evs = eventosDelDia(dia)
              const esHoy = isSameDay(dia, new Date())
              const esSeleccionado = diaSeleccionado && isSameDay(dia, diaSeleccionado)

              return (
                <div key={dia.toISOString()}
                  onClick={() => setDiaSeleccionado(dia)}
                  style={{
                    minHeight: 90, padding: '6px 8px',
                    borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', transition: 'background 0.1s',
                    background: esSeleccionado ? 'var(--accent-glow)' : 'transparent',
                  }}
                  onMouseEnter={e => !esSeleccionado && (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => !esSeleccionado && (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600,
                    background: esHoy ? 'var(--accent)' : 'transparent',
                    color: esHoy ? '#fff' : isSameMonth(dia, mesActual) ? 'var(--text)' : 'var(--text-muted)',
                    marginBottom: 4,
                  }}>
                    {format(dia, 'd')}
                  </div>
                  {evs.slice(0, 3).map(ev => (
                    <div key={ev.id} onClick={e => { e.stopPropagation(); setModal(ev) }} style={{
                      fontSize: 11, padding: '2px 6px', borderRadius: 4, marginBottom: 2,
                      background: ev.color + '33', color: ev.color,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      cursor: 'pointer',
                    }}>
                      {ev.hora_inicio ? ev.hora_inicio.slice(0, 5) + ' ' : ''}{ev.titulo}
                    </div>
                  ))}
                  {evs.length > 3 && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{evs.length - 3} más</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Panel lateral — eventos del día seleccionado */}
        <div>
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, marginBottom: 16 }}>
              {diaSeleccionado
                ? format(diaSeleccionado, "d 'de' MMMM", { locale: es })
                : 'Seleccioná un día'}
            </div>

            {diaSeleccionado && (
              <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginBottom: 12, justifyContent: 'center' }}
                onClick={() => setModal({ fechaDefault: format(diaSeleccionado, 'yyyy-MM-dd') })}>
                + Agregar evento
              </button>
            )}

            {eventosDelDiaSeleccionado.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                {diaSeleccionado ? 'Sin eventos este día' : ''}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {eventosDelDiaSeleccionado.map(ev => (
                  <div key={ev.id}
                    onClick={() => setModal(ev)}
                    style={{
                      padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                      background: ev.color + '18', borderLeft: `3px solid ${ev.color}`,
                      cursor: 'pointer',
                    }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.titulo}</div>
                    {(ev.hora_inicio || ev.hora_fin) && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {ev.hora_inicio?.slice(0, 5)}{ev.hora_fin ? ` → ${ev.hora_fin.slice(0, 5)}` : ''}
                      </div>
                    )}
                    {ev.lead_nombre && (
                      <div style={{ fontSize: 11, color: ev.color, marginTop: 2 }}>
                        👤 {ev.lead_nombre}
                      </div>
                    )}
                    {ev.user_nombre && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {ev.user_nombre}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {modal && (
        <EventoModal
          evento={modal}
          leads={leads}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchEventos() }}
        />
      )}
    </div>
  )
}
