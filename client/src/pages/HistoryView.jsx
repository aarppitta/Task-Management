import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getArchivedTasks } from '../api/taskApi';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function DatePicker({ value, onChange, max }) {
  const [open, setOpen]         = useState(false);
  const [viewYear, setViewYear] = useState(() => new Date((value || max) + 'T12:00:00').getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date((value || max) + 'T12:00:00').getMonth());
  const ref = useRef(null);
  const maxDate = new Date(max + 'T23:59:59');

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const displayValue = value
    ? new Date(value + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Select date';

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const maxYear  = maxDate.getFullYear();
  const maxMonth = maxDate.getMonth();
  const atMaxMonth = viewYear === maxYear && viewMonth === maxMonth;
  const atMinMonth = viewYear === 2020 && viewMonth === 0;

  function prevMonth() {
    if (atMinMonth) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (atMaxMonth) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function selectDay(day) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input-base flex items-center justify-between cursor-pointer text-left"
      >
        <span className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={value ? 'text-white' : 'text-gray-500'}>{displayValue}</span>
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1.5 rounded-2xl shadow-2xl animate-fade-in overflow-hidden"
          style={{ background: '#120d30', border: '1px solid var(--card-border)', minWidth: '280px' }}
        >
          {/* Month/year nav */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--card-border)' }}
          >
            <button
              type="button"
              onClick={prevMonth}
              disabled={atMinMonth}
              className="p-1.5 rounded-lg transition-colors duration-100 disabled:opacity-25"
              style={{ color: 'rgba(167,139,250,0.8)' }}
              onMouseEnter={e => { if (!atMinMonth) e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; }}
              onMouseLeave={e => e.currentTarget.style.background = ''}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-white select-none">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              disabled={atMaxMonth}
              className="p-1.5 rounded-lg transition-colors duration-100 disabled:opacity-25"
              style={{ color: 'rgba(167,139,250,0.8)' }}
              onMouseEnter={e => { if (!atMaxMonth) e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; }}
              onMouseLeave={e => e.currentTarget.style.background = ''}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 px-3 pt-3 pb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium select-none" style={{ color: 'rgba(139,92,246,0.6)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`pad-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = dateStr === value;
              const isFuture   = new Date(dateStr + 'T12:00:00') > maxDate;
              const isToday    = dateStr === max;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isFuture}
                  onClick={() => selectDay(day)}
                  className="h-8 w-full flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-100 disabled:opacity-20 disabled:cursor-not-allowed select-none"
                  style={
                    isSelected
                      ? { background: 'linear-gradient(135deg, #6d28d9, #9333ea)', color: '#fff' }
                      : isToday
                      ? { color: '#a78bfa', border: '1px solid rgba(109, 40, 217, 0.4)' }
                      : { color: 'rgba(229,231,235,0.8)' }
                  }
                  onMouseEnter={e => { if (!isSelected && !isFuture) e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = ''; }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_CONFIG = {
  pending:       { label: 'Pending',       color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.22)'  },
  in_progress:   { label: 'In Progress',   color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.22)'  },
  completed:     { label: 'Completed',     color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.22)'  },
  not_completed: { label: 'Not Completed', color: '#fb7185', bg: 'rgba(251,113,133,0.1)',  border: 'rgba(251,113,133,0.22)' },
};

function fmtDate(raw) {
  return new Date(String(raw).substring(0, 10) + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function getYesterday() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export default function HistoryView() {
  const [date, setDate]       = useState(getYesterday());
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!date) return;
    setLoading(true); setError(null); setSearched(true);
    try {
      const data = await getArchivedTasks(date);
      setTasks(data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load archived tasks';
      setError(msg);
      toast.error(msg);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  function handleDateChange(newDate) {
    setDate(newDate); setSearched(false); setTasks([]); setError(null);
  }

  const completed    = tasks.filter(t => t.status === 'completed').length;
  const notCompleted = tasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-1 gradient-text">
          Task History
        </h1>
        <p className="text-gray-500 text-sm">Browse archived tasks from previous days</p>
      </div>

      {/* Date picker */}
      <div
        className="relative z-10 rounded-2xl p-5 mb-8 flex items-end gap-3"
        style={{ background: 'rgba(28, 16, 64, 0.5)', border: '1px solid var(--card-border)' }}
      >
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Select Date
          </label>
          <DatePicker
            value={date}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        <button onClick={handleSearch} disabled={!date || loading} className="btn-primary shrink-0">
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Loading…
            </span>
          ) : 'View'}
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(109, 40, 217, 0.15)', borderTopColor: '#a78bfa' }} />
          <p className="text-gray-600 text-sm">Loading archive…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(225,29,72,0.07)', border: '1px solid rgba(225,29,72,0.18)' }}>
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      ) : searched && tasks.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
            style={{ background: 'rgba(109, 40, 217, 0.08)', border: '1px solid rgba(109, 40, 217, 0.18)' }}>
            📭
          </div>
          <p className="text-white font-semibold text-lg mb-1.5">No archived tasks</p>
          <p className="text-gray-600 text-sm">No tasks were archived for {fmtDate(date)}</p>
        </div>
      ) : tasks.length > 0 ? (
        <div className="animate-fade-in">
          {/* Summary row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white font-semibold text-base">{fmtDate(date)}</h2>
              <p className="text-gray-600 text-xs mt-0.5">{tasks.length} archived task{tasks.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                {completed} done
              </span>
              {notCompleted > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(251,113,133,0.1)', color: '#fb7185', border: '1px solid rgba(251,113,133,0.2)' }}>
                  {notCompleted} incomplete
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            {tasks.map(task => {
              const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
              return (
                <div
                  key={task.id}
                  className="relative rounded-2xl overflow-hidden transition-all duration-150"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--card-border)',
                  }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l" style={{ background: cfg.color }} />
                  <div className="pl-5 pr-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap mb-1">
                          <h3 className={`font-semibold text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-white'}`}>
                            {task.title}
                          </h3>
                          <span
                            className="text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0"
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-gray-500 text-sm mt-1 leading-relaxed">{task.description}</p>
                        )}
                        <p className="text-gray-700 text-xs mt-2.5">
                          Archived {new Date(task.archived_at).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : !searched ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
            style={{ background: 'rgba(109, 40, 217, 0.08)', border: '1px solid rgba(109, 40, 217, 0.18)' }}>
            📅
          </div>
          <p className="text-white font-semibold text-lg mb-1.5">Pick a date</p>
          <p className="text-gray-600 text-sm">Select a date above to view its archived tasks</p>
        </div>
      ) : null}
    </div>
  );
}
