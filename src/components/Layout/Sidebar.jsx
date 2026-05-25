// src/components/Layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/pipeline', icon: '⬡', label: 'Pipeline' },
  { to: '/leads', icon: '◈', label: 'Leads' },
  { to: '/calendario', icon: '◷', label: 'Calendario' },
  { to: '/metricas', icon: '◎', label: 'Métricas', roles: ['owner', 'supervisor'] },
  { to: '/usuarios', icon: '◉', label: 'Usuarios', roles: ['owner'] },
]

const ROLE_LABELS = { owner: 'Owner', supervisor: 'Supervisor', agente: 'Agente' }
const ROLE_COLORS = { owner: '#6c63ff', supervisor: '#a855f7', agente: '#3b82f6' }

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Sesión cerrada')
  }

  const filteredNav = NAV.filter(n => !n.roles || n.roles.includes(user?.role))

  return (
    <aside style={{
      width: 'var(--sidebar-w)', minHeight: '100vh', background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
          <span style={{ color: 'var(--accent)' }}>A</span>lluma
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, letterSpacing: 1, textTransform: 'uppercase' }}>
          CRM
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {filteredNav.map(item => (
          <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', borderRadius: 'var(--radius-sm)',
            marginBottom: 4, fontSize: 14, fontWeight: 500,
            color: isActive ? 'var(--text)' : 'var(--text-muted)',
            background: isActive ? 'var(--bg-hover)' : 'transparent',
            transition: 'all 0.15s',
            textDecoration: 'none',
          })}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          padding: '12px 14px', borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-hover)', marginBottom: 8,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{user?.nombre}</div>
          <div style={{ fontSize: 11, color: ROLE_COLORS[user?.role] || 'var(--text-muted)', fontWeight: 500 }}>
            {ROLE_LABELS[user?.role]}
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
