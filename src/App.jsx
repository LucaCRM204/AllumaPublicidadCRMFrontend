// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Layout/Sidebar'
import Login from './pages/Login'
import PipelinePage from './pages/PipelinePage'
import LeadsPage from './pages/LeadsPage'
import MetricasPage from './pages/MetricasPage'
import UsuariosPage from './pages/UsuariosPage'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
      Cargando...
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/pipeline" replace />
  return children
}

function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        marginLeft: 'var(--sidebar-w)', flex: 1,
        padding: '32px 36px', maxWidth: 'calc(100vw - var(--sidebar-w))',
        overflowX: 'hidden',
      }}>
        {children}
      </main>
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/pipeline" /> : <Login />} />

      <Route path="/pipeline" element={
        <ProtectedRoute>
          <Layout><PipelinePage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/leads" element={
        <ProtectedRoute>
          <Layout><LeadsPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/metricas" element={
        <ProtectedRoute roles={['owner', 'supervisor']}>
          <Layout><MetricasPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/usuarios" element={
        <ProtectedRoute roles={['owner']}>
          <Layout><UsuariosPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/pipeline" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              fontSize: 13,
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
