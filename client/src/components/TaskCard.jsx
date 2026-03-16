import { useState, useRef, useEffect } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import TaskForm from './TaskForm';

const STATUS_CONFIG = {
  pending:       { label: 'Pending',       accent: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  text: '#fcd34d', dot: '#f59e0b' },
  in_progress:   { label: 'In Progress',   accent: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.25)',  text: '#7dd3fc', dot: '#38bdf8' },
  completed:     { label: 'Completed',     accent: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)',  text: '#6ee7b7', dot: '#34d399' },
  not_completed: { label: 'Not Completed', accent: '#fb7185', bg: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.25)', text: '#fda4af', dot: '#fb7185' },
};

const STATUS_OPTIONS = ['pending', 'in_progress', 'completed', 'not_completed'];

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatusDropdown({ value, onChange, loading, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cfg = STATUS_CONFIG[value] || STATUS_CONFIG.pending;

  function toggle(next) {
    setOpen(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) toggle(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative flex-1 max-w-[200px]">
      <button
        type="button"
        disabled={loading}
        onClick={() => toggle(!open)}
        className="w-full flex items-center justify-between gap-2 text-xs rounded-lg px-3 py-1.5 transition-all duration-150 cursor-pointer disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
      >
        <span className="flex items-center gap-1.5">
          {loading ? (
            <svg className="animate-spin h-3 w-3 shrink-0" style={{ color: cfg.accent }} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.dot }} />
          )}
          {cfg.label}
        </span>
        <svg
          className={`w-3 h-3 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          className="absolute z-50 mt-1 w-full rounded-xl overflow-hidden shadow-xl select-none animate-fade-in"
          style={{ background: '#120d30', border: '1px solid var(--input-border)' }}
        >
          {STATUS_OPTIONS.map(key => {
            const opt = STATUS_CONFIG[key];
            return (
              <li
                key={key}
                onClick={() => { onChange(key); toggle(false); }}
                className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors duration-100"
                style={{
                  color: key === value ? opt.text : 'rgba(148,163,184,0.8)',
                  background: key === value ? opt.bg : undefined,
                }}
                onMouseEnter={e => { if (key !== value) e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
                onMouseLeave={e => { if (key !== value) e.currentTarget.style.background = ''; }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.dot }} />
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function TaskCard({ task, onUpdate, onDelete }) {
  const [editing, setEditing]             = useState(false);
  const [loading, setLoading]             = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen]   = useState(false);

  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;

  async function handleUpdate(data) {
    setLoading(true);
    try { await onUpdate(task.id, data); setEditing(false); }
    finally { setLoading(false); }
  }

  async function handleStatusChange(newStatus) {
    setStatusLoading(true);
    try { await onUpdate(task.id, { status: newStatus }); }
    finally { setStatusLoading(false); }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    await onDelete(task.id);
  }

  if (editing) {
    return (
      <div className="card p-5 animate-fade-in" style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'var(--card-alt)' }}>
        <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">Edit Task</p>
        <TaskForm initialData={task} onSubmit={handleUpdate} onCancel={() => setEditing(false)} loading={loading} />
      </div>
    );
  }

  return (
    <div
      className={`group relative rounded-2xl transition-all duration-200 hover:-translate-y-0.5 animate-fade-in ${dropdownOpen ? 'z-10' : ''}`}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.accent}22`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'}
    >
      {/* Status left-accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-full"
        style={{ background: cfg.accent }}
      />

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <h3 className={`font-semibold text-base leading-snug ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-white'}`}>
                {task.title}
              </h3>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0"
                style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
              >
                {cfg.label}
              </span>
            </div>
            {task.description && (
              <p className="text-gray-400 text-sm line-clamp-2 mt-1 leading-relaxed">{task.description}</p>
            )}
            <p className="text-gray-600 text-xs mt-2.5">Added at {formatTime(task.created_at)}</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={() => setEditing(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-violet-400 transition-colors duration-150"
              style={{ background: 'rgba(139,92,246,0.06)' }}
              title="Edit"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg text-gray-500 hover:text-rose-400 transition-colors duration-150"
              style={{ background: 'rgba(139,92,246,0.06)' }}
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status change row */}
        <div
          className="mt-3.5 pt-3.5 flex items-center gap-3"
          style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}
        >
          <span className="text-xs text-gray-600 shrink-0 font-medium">Status</span>
          <StatusDropdown
            value={task.status}
            onChange={handleStatusChange}
            loading={statusLoading}
            onOpenChange={setDropdownOpen}
          />
        </div>
      </div>
    </div>
  );
}
