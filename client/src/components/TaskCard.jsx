import { useState } from 'react'
import {
  PlayIcon,
  CheckIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import StatusBadge from './StatusBadge'
import TaskForm from './TaskForm'

const statusBorder = {
  'Pending':       '#f59e0b',  // amber-400
  'In Progress':   '#38bdf8',  // sky-400
  'Completed':     '#34d399',  // emerald-400
  'Not Completed': '#fb7185',  // rose-400
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

export default function TaskCard({ task, onStatusChange, onDelete, onEdit, isEditing }) {
  const [actionLoading, setActionLoading] = useState(false)
  const isReadOnly = !onStatusChange && !onDelete && !onEdit

  async function handleStatusChange(newStatus) {
    setActionLoading(true)
    await onStatusChange(task.id, newStatus)
    setActionLoading(false)
  }

  async function handleDelete() {
    if (!window.confirm('Delete this task?')) return
    setActionLoading(true)
    await onDelete(task.id)
    setActionLoading(false)
  }

  if (isEditing) {
    return (
      <div className="animate-fade-in">
        <TaskForm
          initialData={task}
          onSubmit={(formData) => onEdit(task.id, formData)}
          onCancel={() => onEdit(task.id, null)}
          isLoading={actionLoading}
        />
      </div>
    )
  }

  const accentColor = statusBorder[task.status] ?? '#4b3d7a'

  return (
    <div
      className={`rounded-2xl card-lift animate-fade-in overflow-hidden ${actionLoading ? 'opacity-40' : ''}`}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderLeft: `3px solid ${accentColor}`,
        boxShadow: `0 2px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}
    >
      <div className="p-4 flex items-start justify-between gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-100 leading-snug">{task.title}</p>
          {task.description && (
            <p className="mt-1 text-gray-500 text-sm leading-relaxed">{task.description}</p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <span className="text-gray-600 text-xs">{formatDate(task.created_at)}</span>
          </div>
        </div>

        {/* Action buttons */}
        {!isReadOnly && (
          <div className="flex items-center gap-0.5 shrink-0">
            {task.status === 'Pending' && (
              <button
                title="Mark as In Progress"
                onClick={() => handleStatusChange('In Progress')}
                disabled={actionLoading}
                className="p-1.5 rounded-lg text-sky-400 hover:bg-sky-500/15 hover:text-sky-300 disabled:opacity-40 transition-colors"
              >
                <PlayIcon className="w-4 h-4" />
              </button>
            )}
            {(task.status === 'Pending' || task.status === 'In Progress') && (
              <button
                title="Mark as Completed"
                onClick={() => handleStatusChange('Completed')}
                disabled={actionLoading}
                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300 disabled:opacity-40 transition-colors"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
            )}
            <button
              title="Edit task"
              onClick={() => onEdit(task.id, 'open')}
              disabled={actionLoading}
              className="p-1.5 rounded-lg text-violet-400 hover:bg-violet-500/15 hover:text-violet-300 disabled:opacity-40 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              title="Delete task"
              onClick={handleDelete}
              disabled={actionLoading}
              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-40 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
