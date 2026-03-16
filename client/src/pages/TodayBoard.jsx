import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import { getTasks, createTask, updateTask, deleteTask } from '../api/taskApi';

function getTodayDate() {
  return new Date().toLocaleDateString('en-CA');
}

const STAT_DEFS = [
  { key: 'total',      label: 'Total',       color: '#e5e7eb', accent: 'rgba(229,231,235,0.06)', border: 'rgba(229,231,235,0.1)'  },
  { key: 'pending',    label: 'Pending',     color: '#fbbf24', accent: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.18)'  },
  { key: 'inProgress', label: 'In Progress', color: '#38bdf8', accent: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.18)'  },
  { key: 'completed',  label: 'Completed',   color: '#34d399', accent: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.18)'  },
];

export default function TodayBoard({ refreshKey }) {
  const [tasks, setTasks]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const today = getTodayDate();

  const fetchTasks = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await getTasks(today);
      setTasks(data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load tasks';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { fetchTasks(); }, [fetchTasks, refreshKey]);

  async function handleCreate(data) {
    setFormLoading(true);
    try {
      const newTask = await createTask({ ...data, task_date: today });
      setTasks(prev => [...prev, newTask]);
      setShowForm(false);
      toast.success('Task created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdate(id, data) {
    try {
      const updated = await updateTask(id, data);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      toast.success('Task updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update task');
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete task');
    }
  }

  const total      = tasks.length;
  const completed  = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const pending    = tasks.filter(t => t.status === 'pending').length;
  const pct        = total > 0 ? Math.round((completed / total) * 100) : 0;
  const stats      = { total, pending, inProgress, completed };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-1 leading-tight gradient-text">
              Today&apos;s Tasks
            </h1>
            <p className="text-gray-500 text-sm">{formattedDate}</p>
          </div>
          {total > 0 && (
            <div className="text-right shrink-0">
              <div
                className="text-3xl font-bold tabular-nums"
                style={{ color: pct === 100 ? '#34d399' : pct >= 50 ? '#a78bfa' : '#fbbf24' }}
              >
                {pct}%
              </div>
              <div className="text-xs text-gray-600 mt-0.5">done</div>
            </div>
          )}
        </div>
        {total > 0 && (
          <div className="mt-5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: pct === 100
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, #6d28d9, #9333ea)',
              }}
            />
          </div>
        )}
      </div>

      {/* Stat cards */}
      {total > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-8">
          {STAT_DEFS.map(({ key, label, color, accent, border }) => (
            <div
              key={key}
              className="rounded-2xl p-4 text-center"
              style={{ background: accent, border: `1px solid ${border}` }}
            >
              <div className="text-2xl font-bold tabular-nums mb-0.5" style={{ color }}>{stats[key]}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add task */}
      {showForm ? (
        <div
          className="relative z-10 rounded-2xl p-5 mb-6 animate-fade-in"
          style={{
            background: 'rgba(18, 13, 48, 0.9)',
            border: '1px solid rgba(109, 40, 217, 0.35)',
            boxShadow: '0 0 40px rgba(109, 40, 217, 0.08)',
          }}
        >
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">New Task</p>
          <TaskForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={formLoading} />
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full mb-6 py-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200"
          style={{ border: '2px dashed rgba(109, 40, 217, 0.22)', color: 'rgba(167, 139, 250, 0.55)' }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(109, 40, 217, 0.5)';
            e.currentTarget.style.color = 'rgba(167, 139, 250, 1)';
            e.currentTarget.style.background = 'rgba(109, 40, 217, 0.06)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(109, 40, 217, 0.22)';
            e.currentTarget.style.color = 'rgba(167, 139, 250, 0.55)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add New Task
        </button>
      )}

      {/* Task list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(109, 40, 217, 0.15)', borderTopColor: '#a78bfa' }}
          />
          <p className="text-gray-600 text-sm">Loading tasks…</p>
        </div>
      ) : error ? (
        <div
          className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(225,29,72,0.07)', border: '1px solid rgba(225,29,72,0.18)' }}
        >
          <p className="text-rose-400 text-sm mb-2">{error}</p>
          <button onClick={fetchTasks} className="text-rose-500 hover:text-rose-400 text-xs underline">Retry</button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-24">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
            style={{ background: 'rgba(109, 40, 217, 0.08)', border: '1px solid rgba(109, 40, 217, 0.18)' }}
          >
            🎯
          </div>
          <p className="text-white font-semibold text-lg mb-1.5">No tasks yet</p>
          <p className="text-gray-600 text-sm">Click &quot;Add New Task&quot; to start your day</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
