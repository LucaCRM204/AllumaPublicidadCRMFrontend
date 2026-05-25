// src/pages/PipelinePage.jsx
import { useState, useEffect, useCallback } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import api from '../api'
import toast from 'react-hot-toast'
import LeadModal from '../components/Leads/LeadModal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const COLUMNAS = [
  { id: 'nuevo',       label: '📥 Nuevo',       color: 'var(--nuevo)' },
  { id: 'contactando', label: '📞 Contactando',  color: 'var(--contactando)' },
  { id: 'interesado',  label: '🔥 Interesado',   color: 'var(--interesado)' },
  { id: 'propuesta',   label: '📋 Propuesta',    color: 'var(--propuesta)' },
  { id: 'ganado',      label: '✅ Ganado',        color: 'var(--ganado)' },
  { id: 'perdido',     label: '❌ Perdido',       color: 'var(--perdido)' },
]

// ─── Card de lead draggable ───────────────────────────────────────────────────

function LeadCard({ lead, onClick, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSorting } = useSortable({ id: lead.id })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onClick(lead)}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSorting ? 0.4 : 1,
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
        marginBottom: 8,
        cursor: 'pointer',
        userSelect: 'none',
        transition: isSorting ? transition : 'all 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
        {lead.nombre || '—'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
        {lead.empresa || lead.rubro || '—'}
      </div>
      {lead.servicio_interes && (
        <div style={{
          fontSize: 11, color: 'var(--accent)', background: 'var(--accent-glow)',
          padding: '2px 8px', borderRadius: 10, display: 'inline-block', marginBottom: 8,
        }}>
          {lead.servicio_interes}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {lead.agente_nombre ? (
          <div style={{
            fontSize: 11, color: 'var(--text-muted)',
            background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 10,
          }}>
            {lead.agente_nombre.split(' ')[0]}
          </div>
        ) : <span />}
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {format(new Date(lead.created_at), 'd MMM', { locale: es })}
        </div>
      </div>
    </div>
  )
}

// ─── Columna del pipeline ─────────────────────────────────────────────────────

function Columna({ col, leads, onCardClick }) {
  return (
    <div style={{
      width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px', marginBottom: 12,
        borderRadius: 'var(--radius-sm)',
        borderLeft: `3px solid ${col.color}`,
        background: 'var(--bg-card)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{col.label}</span>
        <span style={{
          fontSize: 12, color: 'var(--text-muted)',
          background: 'var(--bg)', padding: '2px 8px', borderRadius: 10,
        }}>
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, minHeight: 200, padding: '2px' }}>
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} onClick={onCardClick} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div style={{
            border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)',
            height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: 12,
          }}>
            Sin leads
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Pipeline principal ───────────────────────────────────────────────────────

export default function PipelinePage() {
  const [pipeline, setPipeline] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState(null)
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const fetchPipeline = useCallback(async () => {
    try {
      const { data } = await api.get('/api/leads/pipeline')
      setPipeline(data)
    } catch {
      toast.error('Error cargando el pipeline')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPipeline() }, [fetchPipeline])

  // Encontrar en qué columna está un lead
  const findColumn = (id) => {
    for (const [col, leads] of Object.entries(pipeline)) {
      if (leads.find(l => l.id === id)) return col
    }
    return null
  }

  const findLead = (id) => {
    for (const leads of Object.values(pipeline)) {
      const found = leads.find(l => l.id === id)
      if (found) return found
    }
    return null
  }

  const handleDragStart = ({ active }) => setActiveId(active.id)

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null)
    if (!over) return

    const fromCol = findColumn(active.id)
    const toCol = over.id in pipeline ? over.id : findColumn(over.id)

    if (!fromCol || !toCol || fromCol === toCol) return

    // Actualizar UI optimísticamente
    const lead = findLead(active.id)
    setPipeline(prev => {
      const next = { ...prev }
      next[fromCol] = next[fromCol].filter(l => l.id !== active.id)
      next[toCol] = [{ ...lead, estado: toCol }, ...next[toCol]]
      return next
    })

    try {
      await api.put(`/api/leads/${active.id}/estado`, { estado: toCol })
    } catch {
      toast.error('Error actualizando estado')
      fetchPipeline() // Revertir
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
      Cargando pipeline...
    </div>
  )

  const activeLead = activeId ? findLead(activeId) : null

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Pipeline</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            {Object.values(pipeline).flat().length} leads en total
          </p>
        </div>
        <button onClick={fetchPipeline} className="btn btn-ghost btn-sm">
          ↻ Actualizar
        </button>
      </div>

      {/* Kanban */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 20 }}>
          {COLUMNAS.map(col => (
            <Columna
              key={col.id}
              col={col}
              leads={pipeline[col.id] || []}
              onCardClick={setSelectedLead}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-sm)', padding: '12px 14px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              width: 240, opacity: 0.95,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{activeLead.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{activeLead.empresa}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Modal detalle */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={fetchPipeline}
        />
      )}
    </div>
  )
}
