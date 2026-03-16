import { useState, useRef, useEffect } from 'react';

const STATUS_OPTIONS = [
  { value: 'pending',       label: 'Pending',       dot: '#f59e0b' },
  { value: 'in_progress',   label: 'In Progress',   dot: '#38bdf8' },
  { value: 'completed',     label: 'Completed',     dot: '#34d399' },
  { value: 'not_completed', label: 'Not Completed', dot: '#fb7185' },
];

function StatusSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = STATUS_OPTIONS.find((o) => o.value === value) || STATUS_OPTIONS[0];

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input-base flex items-center justify-between cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selected.dot }} />
          {selected.label}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl overflow-hidden shadow-xl select-none"
            style={{ background: '#120d30', border: '1px solid var(--input-border)' }}>
          {STATUS_OPTIONS.map((opt) => (
            <li
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition-colors duration-100
                ${opt.value === value ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              style={{ background: opt.value === value ? 'rgba(139,92,246,0.2)' : undefined }}
              onMouseEnter={(e) => { if (opt.value !== value) e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
              onMouseLeave={(e) => { if (opt.value !== value) e.currentTarget.style.background = ''; }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.dot }} />
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TaskForm({ initialData = {}, onSubmit, onCancel, loading }) {
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [status, setStatus] = useState(initialData.status || 'pending');

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim(), status });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          Title <span className="text-rose-400 normal-case tracking-normal">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          required
          autoFocus
          className="input-base"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          Description <span className="text-gray-600 normal-case tracking-normal font-normal">optional</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details, context, or notes…"
          rows={3}
          className="input-base resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          Status
        </label>
        <StatusSelect value={status} onChange={setStatus} />
      </div>

      <div className="flex gap-2.5 pt-1">
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="btn-primary flex-1"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving…
            </span>
          ) : initialData.id ? 'Update Task' : 'Add Task'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
