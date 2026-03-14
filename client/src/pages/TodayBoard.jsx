import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { getTodayTasks, createTask, updateTask, deleteTask, triggerEODJob } from '../api/taskApi'
import TaskForm from '../components/TaskForm'
import TaskCard from '../components/TaskCard'
import EmptyState from '../components/EmptyState'

function formatHeading(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

// Dark stat card with colored glow
function StatCard({ label, count, borderColor, textColor, iconBg, glowColor, icon }) {
  return (
    <div
      className="rounded-2xl p-4 card-lift"
      style={{
        background: 'var(--card)',
        border: `1px solid var(--card-border)`,
        borderTop: `2px solid ${borderColor}`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 0 0 ${glowColor}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold uppercase tracking-wide ${textColor} opacity-60`}>
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center text-base"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-bold ${textColor}`}>{count}</p>
    </div>
  )
}

export default function TodayBoard() {
  const [tasks, setTasks] = useState([])
  // displayDate drives both the heading text and the midnight-change detection
  const [displayDate, setDisplayDate] = useState(() => new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [error, setError] = useState(null)
  const [isEODRunning, setIsEODRunning] = useState(false)

  // Tracks the date string seen on last render — stored in a ref so the
  // interval closure always has a stable reference without needing re-mounting.
  const trackedDateKey = useRef(new Date().toDateString())

  // ── fetchTasks defined at component scope so both effects can call it ──
  async function fetchTasks() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getTodayTasks()
      setTasks(data)
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load tasks.')
      toast.error('Failed to load tasks.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Initial fetch on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetchTasks()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Midnight watcher: polls every 30 s, resets board when date flips ──
  useEffect(() => {
    const timer = setInterval(() => {
      const newDateKey = new Date().toDateString()
      if (newDateKey !== trackedDateKey.current) {
        trackedDateKey.current = newDateKey
        setDisplayDate(new Date())   // updates heading
        setEditingTask(null)          // close any open edit form
        fetchTasks()                  // re-fetches from API (returns [] for new day)
        toast("New day — board refreshed! 🌅", {
          style: {
            background: '#1c1040',
            color: '#e5e7eb',
            border: '1px solid #2e1f62',
            borderRadius: '12px',
          },
        })
      }
    }, 30_000) // 30-second polling interval

    return () => clearInterval(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreateTask({ title, description, status }) {
    setIsSubmitting(true)
    try {
      const newTask = await createTask(title, description, status)
      setTasks((prev) => [newTask, ...prev])
      toast.success('Task created!')
    } catch (err) {
      toast.error(err || 'Failed to create task.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRunEOD() {
    setIsEODRunning(true)
    try {
      await triggerEODJob()
      toast.success('EOD job completed! Tasks archived.')
      fetchTasks()
    } catch (err) {
      toast.error(err || 'EOD job failed.')
    } finally {
      setIsEODRunning(false)
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      const updated = await updateTask(id, { status: newStatus })
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
      toast.success('Status updated!')
    } catch (err) {
      toast.error(err || 'Failed to update status.')
    }
  }

  async function handleEdit(id, payload) {
    if (payload === 'open') { setEditingTask(tasks.find((t) => t.id === id) || null); return }
    if (payload === null)   { setEditingTask(null); return }
    setIsSubmitting(true)
    try {
      const updated = await updateTask(id, payload)
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
      setEditingTask(null)
      toast.success('Task updated!')
    } catch (err) {
      toast.error(err || 'Failed to update task.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTask(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      toast.success('Task deleted!')
    } catch (err) {
      toast.error(err || 'Failed to delete task.')
    }
  }

  const pendingCount    = tasks.filter((t) => t.status === 'Pending').length
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length
  const completedCount  = tasks.filter((t) => t.status === 'Completed').length

  return (
    <div className="space-y-6 animate-fade-in-slow">
      {/* Heading */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Today&apos;s Board</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">{formatHeading(displayDate)}</p>
        </div>
        <button
          onClick={handleRunEOD}
          disabled={isEODRunning}
          className="shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-rose-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'rgba(225,29,72,0.08)',
            border: '1px solid rgba(225,29,72,0.25)',
          }}
          title="Manually trigger End-of-Day job (archive tasks & send summary email)"
        >
          <span>{isEODRunning ? '⏳' : '🌙'}</span>
          {isEODRunning ? 'Running…' : 'Run EOD Job'}
        </button>
      </div>

      {/* Stat cards */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Pending"     count={pendingCount}
            borderColor="#f59e0b" textColor="text-amber-400"
            iconBg="rgba(245,158,11,0.12)" glowColor="rgba(245,158,11,0)" icon="⏳" />
          <StatCard label="In Progress" count={inProgressCount}
            borderColor="#38bdf8" textColor="text-sky-400"
            iconBg="rgba(56,189,248,0.12)" glowColor="rgba(56,189,248,0)" icon="⚡" />
          <StatCard label="Completed"   count={completedCount}
            borderColor="#34d399" textColor="text-emerald-400"
            iconBg="rgba(52,211,153,0.12)" glowColor="rgba(52,211,153,0)" icon="✅" />
        </div>
      )}

      {/* Add task form */}
      <TaskForm onSubmit={handleCreateTask} isLoading={isSubmitting} />

      {/* Loading spinner */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div
            className="w-8 h-8 rounded-full animate-spin"
            style={{
              border: '2px solid rgba(139, 92, 246, 0.15)',
              borderTop: '2px solid #a78bfa',
            }}
          />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div
          className="rounded-2xl px-4 py-3 text-rose-400 text-sm"
          style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.2)' }}
        >
          {error}
        </div>
      )}

      {/* Divider */}
      {!isLoading && tasks.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(109,40,217,0.4), transparent)' }} />
          <span className="text-xs font-semibold text-violet-500 tracking-widest uppercase">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} today
          </span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, rgba(109,40,217,0.4), transparent)' }} />
        </div>
      )}

      {/* Task list */}
      {!isLoading && tasks.length === 0 && (
        <EmptyState message="No tasks for today — add one above!" />
      )}

      {!isLoading && tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isEditing={editingTask?.id === task.id}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
