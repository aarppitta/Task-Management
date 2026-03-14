import { useState, useEffect } from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed']

const STATUS_STYLES = {
  'Pending':     { dot: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  'In Progress': { dot: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.3)' },
  'Completed':   { dot: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' },
}

export default function TaskForm({ onSubmit, initialData, onCancel, isLoading }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('Pending')
  const [titleError, setTitleError] = useState('')

  const isEditing = Boolean(initialData)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setDescription(initialData.description || '')
      setStatus(initialData.status || 'Pending')
    }
  }, [initialData])

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) {
      setTitleError('Title is required.')
      return
    }
    setTitleError('')
    onSubmit({ title: title.trim(), description: description.trim(), status })
    if (!isEditing) {
      setTitle('')
      setDescription('')
      setStatus('Pending')
    }
  }

  const inputClass =
    'w-full rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 ' +
    'focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:ring-offset-0 transition-all resize-none'

  const currentStyle = STATUS_STYLES[status] || STATUS_STYLES['Pending']

  return (
    <div
      className="rounded-2xl overflow-hidden animate-fade-in"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Rainbow top accent */}
      <div
        className="h-0.5 w-full"
        style={{
          background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899, #f97316, #eab308, #10b981)',
        }}
      />

      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.3)' }}
          >
            <SparklesIcon className="w-3.5 h-3.5 text-violet-300" />
          </div>
          <h3 className="text-sm font-semibold text-gray-300">
            {isEditing ? 'Edit Task' : 'Add New Task'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (e.target.value.trim()) setTitleError('')
              }}
              placeholder="What needs to be done?"
              className={inputClass}
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
            />
            {titleError && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                <span>⚠</span> {titleError}
              </p>
            )}
          </div>

          <div className="mb-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details (optional)..."
              rows={2}
              className={inputClass}
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
            />
          </div>

          {/* Status dropdown */}
          <div className="mb-4">
            <div className="relative">
              <div
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                style={{ background: currentStyle.dot }}
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl pl-8 pr-4 py-2.5 text-sm font-medium appearance-none cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-violet-500/60 transition-all"
                style={{
                  background: currentStyle.bg,
                  border: `1px solid ${currentStyle.border}`,
                  color: currentStyle.dot,
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} style={{ background: '#1a1a2e', color: '#e5e7eb' }}>
                    {opt}
                  </option>
                ))}
              </select>
              {/* Custom chevron */}
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                ▾
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="gradient-btn text-white rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving…' : isEditing ? '✓ Save Changes' : '+ Add Task'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-200 rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
                style={{ border: '1px solid var(--card-border)' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
