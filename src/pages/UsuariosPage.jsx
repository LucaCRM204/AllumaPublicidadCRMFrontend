// src/pages/UsuariosPage.jsx
import { useState, useEffect } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const ROLES = { owner: '👑 Owner', supervisor: '👁️ Supervisor', agente: '🙋 Agente' }
const ROLE_COLORS = { owner: 'var(--accent)', supervisor: 'var(--purple)', agente: 'var(--blue)' }

function UserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState(user || { nombre: '', email: '', password: '', role: 'agente', activo: true })
  const [saving, setSaving] = useState(false)
  const isEdit = !!user

  const handleSubmit = async () => {
    if (!form.nombre || !form.email) return toast.error('Nombre y email son requeridos')
    if (!isEdit && !form.password) return toast.error('La contraseña es requerida')
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/api/users/${user.id}`, form)
        toast.success('Usuario actualizado')
      } else {
        await api.post('/api/users', form)
        toast.success('Usuario creado')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error guardando')
    } finally { setSaving(false) }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
            {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Nombre completo</label>
            <input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">{isEdit ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label>
            <input className="input" type="password" value={form.password || ''} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <label className="label">Rol</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="agente">🙋 Agente</option>
              <option value="supervisor">👁️ Supervisor</option>
              <option value="owner">👑 Owner</option>
            </select>
          </div>
          {isEdit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="activo" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} />
              <label htmlFor="activo" style={{ fontSize: 14, cursor: 'pointer' }}>Usuario activo</label>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UsuariosPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [modal, setModal] = useState(null) // null | 'nuevo' | userObj

  const fetchUsers = async () => {
    const { data } = await api.get('/api/users')
    setUsers(data)
  }

  useEffect(() => { fetchUsers() }, [])

  const desactivar = async (u) => {
    if (!confirm(`¿Desactivar a ${u.nombre}?`)) return
    try {
      await api.delete(`/api/users/${u.id}`)
      toast.success('Usuario desactivado')
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Usuarios</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{users.length} usuarios registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('nuevo')}>+ Nuevo usuario</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map(u => (
          <div key={u.id} className="card" style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '16px 20px', opacity: u.activo ? 1 : 0.5,
          }}>
            {/* Avatar */}
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: ROLE_COLORS[u.role] + '22', border: `2px solid ${ROLE_COLORS[u.role]}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
              color: ROLE_COLORS[u.role], flexShrink: 0,
            }}>
              {u.nombre[0]?.toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{u.nombre}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.email}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="badge" style={{
                background: ROLE_COLORS[u.role] + '22',
                color: ROLE_COLORS[u.role], border: `1px solid ${ROLE_COLORS[u.role]}44`,
              }}>
                {ROLES[u.role]}
              </span>

              {u.leads_activos > 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg)', padding: '3px 10px', borderRadius: 10 }}>
                  {u.leads_activos} leads activos
                </span>
              )}

              {!u.activo && <span style={{ fontSize: 11, color: 'var(--red)' }}>Inactivo</span>}

              {u.id !== me.id && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setModal(u)}>Editar</button>
                  {u.activo && <button className="btn btn-danger btn-sm" onClick={() => desactivar(u)}>Desactivar</button>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <UserModal
          user={modal === 'nuevo' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchUsers() }}
        />
      )}
    </div>
  )
}
